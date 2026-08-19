"""
Document text extraction for prescriptions and lab reports.

Azure is used ONLY for OCR (Azure Document Intelligence prebuilt-read).
Medicine parsing, chatbot, and lab insights run locally — no Azure OpenAI.

Pipeline:
  Image → Azure DI (when configured) → local Tesseract/RapidOCR fallback
  PDF   → embedded text (PyMuPDF/pdfplumber) → Azure DI → local page OCR fallback
"""
from __future__ import annotations

import os
from dataclasses import dataclass

import numpy as np

from app.services import document_intelligence_service as azure_di
from app.services import ocr_engines as engines

MIN_USABLE_TEXT = int(os.environ.get("MEDSCAN_OCR_MIN_CHARS", "12"))


def _azure_only_mode() -> bool:
    flag = os.environ.get("MEDSCAN_OCR_AZURE_ONLY", "0").strip().lower()
    return flag in ("1", "true", "yes", "on")


def normalize_ocr_text(text: str) -> str:
    """Fix common OCR spacing issues before NLP / lab parsing."""
    import re

    t = text or ""
    t = re.sub(r"([A-Za-z])(\d)", r"\1 \2", t)
    t = re.sub(r"(\d)(mg|ml|gm|mcg|iu|g)\b", r"\1 \2", t, flags=re.I)
    t = re.sub(r"[ \t]+", " ", t)
    return t.strip()


@dataclass
class DocumentOcrResult:
    text: str
    engine: str = "none"
    pipeline: str = ""
    error: str | None = None
    stages: list[str] | None = None

    @property
    def note(self) -> str | None:
        if self.error:
            return self.error
        if self.engine and self.engine != "none":
            parts = [f"engine={self.engine}"]
            if self.pipeline:
                parts.append(f"pipeline={self.pipeline}")
            return "; ".join(parts)
        return None


def scan_ocr_capabilities() -> dict:
    caps = engines.scan_capabilities()
    caps.update(azure_di.scan_capability())
    caps["azure_only_mode"] = _azure_only_mode()
    caps["ready"] = (
        caps.get("azure_document_intelligence")
        or caps.get("rapidocr")
        or caps.get("tesseract")
        or caps.get("pymupdf")
    )
    return caps


def _merge_text(*chunks: str) -> str:
    seen: set[str] = set()
    lines: list[str] = []
    for chunk in chunks:
        for ln in (chunk or "").splitlines():
            s = ln.strip()
            if not s or s in seen:
                continue
            seen.add(s)
            lines.append(s)
    return "\n".join(lines).strip()


def _is_usable(text: str) -> bool:
    return len((text or "").strip()) >= MIN_USABLE_TEXT


def _try_azure_di(data: bytes, filename: str, stages: list[str]) -> DocumentOcrResult | None:
    if not azure_di.is_available():
        return None
    stages.append("azure_prebuilt_read")
    di = azure_di.analyze_document(data, filename)
    if di.text and _is_usable(di.text):
        return DocumentOcrResult(
            text=normalize_ocr_text(di.text),
            engine=di.engine,
            pipeline="azure_read",
            stages=stages.copy(),
        )
    if di.error:
        stages.append(f"azure_error:{di.error[:80]}")
    return None


def ocr_rgb_array(arr: np.ndarray) -> DocumentOcrResult:
    result = engines.ocr_image_array(arr)
    if result.text:
        return DocumentOcrResult(
            text=normalize_ocr_text(result.text),
            engine=result.engine,
            pipeline="image_ocr",
            stages=["opencv", result.engine],
        )
    return DocumentOcrResult(
        text="",
        engine=result.engine or "none",
        pipeline="image_ocr",
        error=result.error or "OCR produced no text",
        stages=["opencv", result.engine or "none"],
    )


def extract_text_from_image_bytes(image_bytes: bytes, filename: str = "") -> DocumentOcrResult:
    stages: list[str] = []
    azure_result = _try_azure_di(image_bytes, filename, stages)
    if azure_result:
        return azure_result

    if _azure_only_mode() and azure_di.scan_capability().get("azure_di_configured"):
        err = stages[-1] if stages else "Azure Document Intelligence returned no text"
        return DocumentOcrResult(
            text="",
            engine="azure_document_intelligence",
            pipeline="azure_read",
            error=f"Azure OCR required but failed: {err}",
            stages=stages,
        )

    try:
        arr = engines.bytes_to_rgb_array(image_bytes)
    except ValueError as exc:
        return DocumentOcrResult(
            text="",
            error=str(exc),
            pipeline="image_ocr",
            stages=stages + ["invalid_image"],
        )

    local = ocr_rgb_array(arr)
    local.stages = stages + (local.stages or [])
    return local


def extract_text_from_pdf_bytes(data: bytes, filename: str = "") -> DocumentOcrResult:
    stages: list[str] = []
    embedded_parts: list[str] = []

    pm = engines.extract_pdf_embedded_pymupdf(data)
    stages.append(pm.engine)
    if pm.text:
        embedded_parts.append(pm.text)

    pl = engines.extract_pdf_embedded_pdfplumber(data)
    if pl.engine not in stages:
        stages.append(pl.engine)
    if pl.text:
        embedded_parts.append(pl.text)

    merged = _merge_text(*embedded_parts)
    if _is_usable(merged):
        if pm.text and pl.text:
            engine = "pdf_embedded"
        elif pm.text:
            engine = "pymupdf_embedded"
        else:
            engine = "pdfplumber_embedded"
        return DocumentOcrResult(
            text=normalize_ocr_text(merged),
            engine=engine,
            pipeline="pdf_text",
            stages=stages,
        )

    azure_result = _try_azure_di(data, filename, stages)
    if azure_result:
        return azure_result

    if _azure_only_mode() and azure_di.scan_capability().get("azure_di_configured"):
        err = next((s for s in reversed(stages) if s.startswith("azure_error:")), "no text")
        return DocumentOcrResult(
            text="",
            engine="azure_document_intelligence",
            pipeline="azure_read",
            error=f"Azure OCR required but failed: {err.replace('azure_error:', '', 1)}",
            stages=stages,
        )

    ocr_chunks: list[str] = []
    used_engine = "none"
    last_err: str | None = None
    for idx, arr in enumerate(engines.rasterize_pdf_pages(data)):
        stages.append(f"page_{idx}_raster")
        page_result = ocr_rgb_array(arr)
        stages.extend(page_result.stages or [])
        if page_result.text:
            ocr_chunks.append(page_result.text)
            used_engine = page_result.engine
        if page_result.error:
            last_err = page_result.error

    ocr_merged = _merge_text(*ocr_chunks)
    if _is_usable(ocr_merged):
        return DocumentOcrResult(
            text=normalize_ocr_text(ocr_merged),
            engine=used_engine,
            pipeline="pdf_ocr",
            stages=stages,
        )

    return DocumentOcrResult(
        text="",
        engine=used_engine,
        pipeline="pdf_ocr",
        error=last_err or pm.error or "PDF OCR produced no text",
        stages=stages,
    )


def extract_document(data: bytes, filename: str = "") -> DocumentOcrResult:
    if not data:
        return DocumentOcrResult(text="", error="empty file")
    fn = (filename or "").lower()
    is_pdf = data[:5] == b"%PDF-" or data[:4] == b"%PDF" or fn.endswith(".pdf")
    if is_pdf:
        return extract_text_from_pdf_bytes(data, filename)
    return extract_text_from_image_bytes(data, filename)


def extract_document_text(data: bytes, filename: str = "") -> tuple[str, str | None]:
    """Backward-compatible helper returning (text, note)."""
    result = extract_document(data, filename)
    return result.text, result.note or result.error
