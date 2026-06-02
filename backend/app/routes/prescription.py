"""Prescription upload — OCR + AI medicine-name extraction (prices on demand via /api/compare)."""
from __future__ import annotations

import hashlib
import os
import uuid

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.prescription import Prescription
from app.services import ocr_service
from app.services.medicine_extract_service import extract_medicine_names
from app.utils.redis_cache import cache_key_ocr, get_cache, set_cache

bp = Blueprint("prescription", __name__, url_prefix="/api/prescription")

bp_public = Blueprint("prescription_public", __name__, url_prefix="/api")


def _ensure_upload_folder() -> str:
    path = os.path.abspath(current_app.config["MEDSCAN_UPLOAD_FOLDER"])
    os.makedirs(path, exist_ok=True)
    return path


def _run_upload():
    uid = None
    try:
        jwt_u = get_jwt_identity()
        if jwt_u and str(jwt_u).isdigit():
            uid = int(jwt_u)
    except Exception:
        uid = None

    if "file" not in request.files:
        return jsonify({"status": "error", "message": "file required"}), 400
    f = request.files["file"]
    raw = f.read()
    if not raw:
        return jsonify({"status": "error", "message": "empty file"}), 400

    file_hash = hashlib.sha256(raw).hexdigest()
    ck = cache_key_ocr(file_hash)
    cached = get_cache(ck)
    if cached:
        cached = dict(cached)
        cached["cache_hit"] = True
        return jsonify({"status": "success", "data": cached}), 200

    fname = secure_filename(f.filename or "rx") or "rx"
    ocr_result = ocr_service.extract_document(raw, fname)
    text = ocr_result.text
    if not text.strip():
        return jsonify(
            {
                "status": "error",
                "message": "OCR produced no text",
                "data": {
                    "detail": ocr_result.error or "Install Tesseract or use RapidOCR (included in requirements).",
                    "ocr_engine": ocr_result.engine,
                    "ocr_capabilities": ocr_service.scan_ocr_capabilities(),
                },
            }
        ), 422

    extracted = extract_medicine_names(text)
    medicines = extracted.medicines

    folder = _ensure_upload_folder()
    ext = os.path.splitext(fname)[1].lower()
    if not ext:
        ext = ".pdf" if raw[:4] == b"%PDF" else ".png"
    store = os.path.join(folder, f"{uuid.uuid4().hex}{ext}")
    with open(store, "wb") as fp:
        fp.write(raw)

    rec = Prescription(
        user_id=uid,
        image_path=store,
        extracted_text=text,
        medicine_list=medicines,
    )
    db.session.add(rec)
    db.session.commit()

    payload = {
        "prescription_id": rec.id,
        "extracted_text": text[:8000],
        "medicines": medicines,
        "medicine_names": extracted.medicine_names,
        "extraction_engine": extracted.extraction_engine,
        "ocr_note": ocr_result.note,
        "ocr_engine": ocr_result.engine,
        "ocr_pipeline": ocr_result.pipeline,
        "cache_hit": False,
    }
    set_cache(ck, {k: v for k, v in payload.items() if k != "cache_hit"})
    return jsonify({"status": "success", "data": payload}), 200


@bp.post("/upload")
@jwt_required(optional=True)
def upload():
    return _run_upload()


@bp_public.post("/upload-prescription")
@jwt_required(optional=True)
def upload_prescription_alias():
    return _run_upload()
