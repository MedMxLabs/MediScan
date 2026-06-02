#!/usr/bin/env python3
"""Print MedScan backend setup status — run from backend/: python scripts/check_setup.py"""
from __future__ import annotations

import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from load_env import load_app_env

load_app_env()


def _flag(ok: bool) -> str:
    return "OK" if ok else "MISSING"


def main() -> int:
    from app.services.ai_service import llm_is_configured
    from app.utils.client_api_key import client_api_keys_configured
    from app.services.supabase_auth_service import is_configured as supabase_configured
    from app.services.document_intelligence_service import is_available as azure_di_ready
    from app.services.document_intelligence_service import scan_capability as azure_caps
    from app.services.medicine_extract_service import scan_extraction_capabilities
    from app.services.ocr_service import scan_ocr_capabilities

    ocr = scan_ocr_capabilities()
    extract = scan_extraction_capabilities()
    azure = azure_caps()

    print("=" * 60)
    print("MedScan backend setup check")
    print("=" * 60)

    print("\n[OCR engines]")
    print(f"  Tesseract .............. {_flag(ocr.get('tesseract'))}")
    print(f"  RapidOCR ............... {_flag(ocr.get('rapidocr'))}")
    print(f"  PyMuPDF / pdfplumber ... {_flag(ocr.get('pymupdf'))} / {_flag(ocr.get('pdfplumber'))}")
    print(f"  Azure Document Intel ... {_flag(ocr.get('azure_document_intelligence'))}")
    print(f"  OCR ready .............. {_flag(ocr.get('ready'))}")

    print("\n[Medicine extraction]")
    print(f"  Smart NLP .............. OK")
    print(f"  Catalog compact ........ OK (split OCR recovery)")
    print(f"  LLM fallback enabled ... {_flag(extract.get('llm_fallback_enabled'))}")
    print(f"  LLM API configured ..... {_flag(extract.get('llm_configured'))}")
    print(f"  Catalog terms .......... {extract.get('catalog_terms', 0)}")

    print("\n[Supabase Auth (web)]")
    print(f"  Configured ............. {_flag(supabase_configured())}")
    if supabase_configured():
        print("  Web: set VITE_SUPABASE_* or rely on GET /api/auth/supabase/config")

    print("\n[Client API key]")
    print(f"  Enforcement ............ {_flag(client_api_keys_configured())}")
    if client_api_keys_configured():
        print("  Mobile/web must send X-Medscan-Api-Key (see scripts/generate_client_api_key.py)")

    print("\n[Env files]")
    root_env = _BACKEND.parent / ".env"
    backend_env = _BACKEND / ".env"
    print(f"  medscan/.env ............. {'found' if root_env.is_file() else 'not found'}")
    print(f"  backend/.env ............. {'found' if backend_env.is_file() else 'not found'}")

    todo: list[str] = []
    if not llm_is_configured():
        todo.append("Set AZURE_OPENAI_API_KEY (and AZURE_OPENAI_API_BASE from your deployment URL)")
    if not azure_di_ready():
        if not azure.get("azure_di_configured"):
            todo.append(
                "Set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT + AZURE_DOCUMENT_INTELLIGENCE_KEY "
                "(Azure Portal -> Document Intelligence resource)"
            )
        else:
            todo.append("Azure DI keys set but disabled — set MEDSCAN_AZURE_OCR=1")
    if not ocr.get("tesseract") and not ocr.get("rapidocr") and not azure_di_ready():
        todo.append("Install Tesseract or ensure rapidocr-onnxruntime is installed")

    print("\n[Your action items]")
    if todo:
        for i, item in enumerate(todo, 1):
            print(f"  {i}. {item}")
    else:
        print("  All optional services configured. You're good to go.")

    print("\n[Quick test]")
    print("  curl http://127.0.0.1:5000/api/health")
    print("  python -m pytest tests/test_ocr.py -q")
    print("=" * 60)
    return 0 if ocr.get("ready") else 1


if __name__ == "__main__":
    raise SystemExit(main())
