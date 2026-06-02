"""Lab report upload & analysis."""
from __future__ import annotations

import os
import uuid

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.report import LabReport
from app.services import ai_service, ocr_service
from app.services import report_analysis_service
from app.utils.responses import ok

bp = Blueprint("reports", __name__, url_prefix="/api/reports")

bp_lab = Blueprint("reports_lab", __name__, url_prefix="/api")


def _analyze_upload():
    uid = int(get_jwt_identity())
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "file required"}), 400
    f = request.files["file"]
    raw = f.read()
    if not raw:
        return jsonify({"status": "error", "message": "empty file"}), 400

    fname = secure_filename(f.filename or "labs") or "labs"
    ocr_result = ocr_service.extract_document(raw, fname)
    text = ocr_result.text
    if not text.strip():
        return jsonify(
            {
                "status": "error",
                "message": "OCR produced no text",
                "data": {
                    "detail": ocr_result.error or "",
                    "ocr_engine": ocr_result.engine,
                    "ocr_capabilities": ocr_service.scan_ocr_capabilities(),
                },
            }
        ), 422

    rows = report_analysis_service.analyze_lab_text(text)
    enriched = report_analysis_service.enrich_rows(rows)

    if not rows:
        insights = (
            "No recognised biomarkers (e.g. Hemoglobin, fasting glucose, HbA1c, lipids) were parsed "
            "from this document."
        )
    else:
        insights = report_analysis_service.insights_plain_language(rows) or ai_service.lab_insights_plain_language(rows)

    folder = os.path.abspath(current_app.config["MEDSCAN_UPLOAD_FOLDER"])
    os.makedirs(folder, exist_ok=True)
    ext = os.path.splitext(fname)[1].lower()
    if not ext:
        ext = ".png" if raw[:5] != b"%PDF-" else ".pdf"
    store = os.path.join(folder, f"{uuid.uuid4().hex}{ext}")
    with open(store, "wb") as fp:
        fp.write(raw)

    lr = LabReport(user_id=uid, image_path=store, extracted_values=enriched, analysis_result=insights)
    db.session.add(lr)
    db.session.commit()

    return jsonify(
        {
            "status": "success",
            "data": {
                "report_id": lr.id,
                "extracted_rows": enriched,
                "extracted_text": text[:8000],
                "extracted_text_preview": text[:1200],
                "insights": insights,
                "ocr_note": ocr_result.note,
                "ocr_engine": ocr_result.engine,
                "ocr_pipeline": ocr_result.pipeline,
            },
        }
    )


@bp.get("")
@jwt_required()
def list_reports():
    uid = int(get_jwt_identity())
    rows = (
        LabReport.query.filter_by(user_id=uid)
        .order_by(LabReport.created_at.desc())
        .limit(50)
        .all()
    )
    return ok(
        {
            "reports": [
                {
                    "id": r.id,
                    "extracted_rows": r.extracted_values or [],
                    "insights": r.analysis_result or "",
                    "created_at": r.created_at.isoformat(),
                }
                for r in rows
            ]
        }
    )


@bp.get("/<int:report_id>")
@jwt_required()
def get_report(report_id: int):
    uid = int(get_jwt_identity())
    r = LabReport.query.filter_by(id=report_id, user_id=uid).first()
    if not r:
        return jsonify({"status": "error", "message": "Report not found"}), 404
    return ok(
        {
            "id": r.id,
            "extracted_rows": r.extracted_values or [],
            "insights": r.analysis_result or "",
            "created_at": r.created_at.isoformat(),
        }
    )


@bp.post("/upload")
@jwt_required()
def upload():
    return _analyze_upload()


@bp_lab.post("/report-analysis")
@jwt_required()
def report_analysis_alias():
    return _analyze_upload()
