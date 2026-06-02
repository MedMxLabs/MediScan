"""Open-source OCR engine adapters — Tesseract, RapidOCR (ONNX), PDF text extractors."""
from __future__ import annotations

import io
import logging
import os
import shutil
from dataclasses import dataclass
from typing import Any

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

_rapidocr_engine: Any | None = None
_rapidocr_failed = False


@dataclass
class EngineResult:
    text: str
    engine: str
    error: str | None = None


def _as_ocr_text(raw: object) -> str:
    """Normalize OCR/PDF extractor output to plain str for type checkers."""
    if raw is None:
        return ""
    if isinstance(raw, str):
        return raw
    if isinstance(raw, bytes):
        return raw.decode("utf-8", errors="replace")
    if isinstance(raw, dict):
        return "\n".join(_as_ocr_text(v) for v in raw.values())
    if isinstance(raw, list):
        return "\n".join(_as_ocr_text(v) for v in raw)
    return str(raw)


def tesseract_available() -> bool:
    cmd = os.environ.get("TESSERACT_CMD") or shutil.which("tesseract")
    return bool(cmd)


def rapidocr_available() -> bool:
    global _rapidocr_failed
    if _rapidocr_failed:
        return False
    try:
        from rapidocr_onnxruntime import RapidOCR  # noqa: F401

        return True
    except ImportError:
        return False


def pymupdf_available() -> bool:
    return fitz is not None


def pdfplumber_available() -> bool:
    try:
        import pdfplumber  # noqa: F401

        return True
    except ImportError:
        return False


def opencv_available() -> bool:
    return cv2 is not None


def scan_capabilities() -> dict[str, bool]:
    return {
        "tesseract": tesseract_available(),
        "rapidocr": rapidocr_available(),
        "pymupdf": pymupdf_available(),
        "pdfplumber": pdfplumber_available(),
        "opencv": opencv_available(),
    }


def _get_rapidocr():
    global _rapidocr_engine, _rapidocr_failed
    if _rapidocr_failed:
        return None
    if _rapidocr_engine is not None:
        return _rapidocr_engine
    try:
        from rapidocr_onnxruntime import RapidOCR

        _rapidocr_engine = RapidOCR()
        return _rapidocr_engine
    except Exception as exc:
        logger.warning("RapidOCR init failed: %s", exc)
        _rapidocr_failed = True
        return None


def preprocess_variants(arr: np.ndarray) -> list[tuple[str, np.ndarray]]:
    """Return labeled OpenCV preprocessing passes for OCR retries."""
    variants: list[tuple[str, np.ndarray]] = [("raw", arr)]
    if cv2 is None:
        return variants

    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    _, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants.append(("otsu", cv2.cvtColor(otsu, cv2.COLOR_GRAY2RGB)))

    adaptive = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 8
    )
    variants.append(("adaptive", cv2.cvtColor(adaptive, cv2.COLOR_GRAY2RGB)))
    return variants


def _ocr_tesseract_on_array(arr: np.ndarray) -> EngineResult:
    try:
        import pytesseract
    except ImportError:
        return EngineResult("", "tesseract", "pytesseract not installed")

    cmd = os.environ.get("TESSERACT_CMD") or shutil.which("tesseract")
    if not cmd:
        return EngineResult("", "tesseract", "tesseract binary not in PATH")

    pytesseract.pytesseract.tesseract_cmd = cmd
    pil = Image.fromarray(arr)
    lang = os.environ.get("TESSERACT_LANG", "eng")
    try:
        text = pytesseract.image_to_string(pil, lang=lang)
        return EngineResult(_as_ocr_text(text).strip(), "tesseract")
    except Exception as exc:
        return EngineResult("", "tesseract", str(exc))


def _ocr_rapidocr_on_array(arr: np.ndarray) -> EngineResult:
    engine = _get_rapidocr()
    if engine is None:
        return EngineResult("", "rapidocr", "RapidOCR unavailable")
    try:
        result, _elapse = engine(arr)
        if not result:
            return EngineResult("", "rapidocr", "no text detected")
        lines = [row[1] for row in result if len(row) > 1 and row[1]]
        return EngineResult("\n".join(lines).strip(), "rapidocr")
    except Exception as exc:
        return EngineResult("", "rapidocr", str(exc))


def ocr_image_array(arr: np.ndarray) -> EngineResult:
    """Run OCR chain on RGB numpy array — Tesseract first, RapidOCR fallback."""
    best = EngineResult("", "none")
    for _label, variant in preprocess_variants(arr):
        if tesseract_available():
            tr = _ocr_tesseract_on_array(variant)
            if len(tr.text) > len(best.text):
                best = tr
            if len(tr.text) >= 40:
                return tr

        if rapidocr_available():
            rr = _ocr_rapidocr_on_array(variant)
            if len(rr.text) > len(best.text):
                best = rr
            if len(rr.text) >= 40:
                return rr

    if best.text:
        return best
    err = best.error or "All OCR engines returned empty text"
    return EngineResult("", best.engine or "none", err)


def extract_pdf_embedded_pymupdf(data: bytes, max_pages: int = 8) -> EngineResult:
    if fitz is None:
        return EngineResult("", "pymupdf", "PyMuPDF not installed")
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:
        return EngineResult("", "pymupdf", f"Cannot open PDF: {exc}")

    chunks: list[str] = []
    for i in range(min(len(doc), max_pages)):
        chunks.append(_as_ocr_text(doc[i].get_text()))
    text = "\n".join(chunks).strip()
    return EngineResult(text, "pymupdf_embedded")


def extract_pdf_embedded_pdfplumber(data: bytes, max_pages: int = 8) -> EngineResult:
    try:
        import pdfplumber
    except ImportError:
        return EngineResult("", "pdfplumber", "pdfplumber not installed")
    try:
        chunks: list[str] = []
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages[:max_pages]:
                chunks.append(_as_ocr_text(page.extract_text()))
        text = "\n".join(chunks).strip()
        return EngineResult(text, "pdfplumber_embedded")
    except Exception as exc:
        return EngineResult("", "pdfplumber", str(exc))


def rasterize_pdf_pages(data: bytes, max_pages: int = 3, dpi: int = 220) -> list[np.ndarray]:
    if fitz is None:
        return []
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception:
        return []
    images: list[np.ndarray] = []
    for i in range(min(len(doc), max_pages)):
        try:
            pix = doc[i].get_pixmap(dpi=dpi, alpha=False)
            png_bytes = pix.tobytes("png")
            im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
            images.append(np.array(im))
        except Exception as exc:
            logger.debug("PDF page %s rasterize failed: %s", i, exc)
    return images


def bytes_to_rgb_array(data: bytes) -> np.ndarray:
    try:
        im = Image.open(io.BytesIO(data)).convert("RGB")
        return np.array(im)
    except Exception as exc:
        raise ValueError(f"Invalid or unsupported image: {exc}") from exc
