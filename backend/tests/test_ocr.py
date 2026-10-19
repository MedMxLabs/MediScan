"""OCR pipeline tests — RapidOCR + NLP (no external Tesseract required)."""
from __future__ import annotations

import io
import re

import pytest
from PIL import Image, ImageDraw


def _prescription_png_bytes() -> bytes:
    img = Image.new("RGB", (640, 220), "white")
    draw = ImageDraw.Draw(img)
    draw.text((24, 36), "Tab Paracetamol 650mg 1-0-1 for 5 days", fill="black")
    draw.text((24, 88), "Cap Amoxicillin 500mg BD for 7 days", fill="black")
    draw.text((24, 140), "Syp Cetirizine 5ml HS for 3 days", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_ocr_capabilities_report_ready():
    from app.services.ocr_service import scan_ocr_capabilities

    caps = scan_ocr_capabilities()
    assert caps["pymupdf"] is True
    assert caps["ready"] is True


def test_image_ocr_extracts_prescription_lines():
    from app.services.ocr_service import extract_document

    result = extract_document(_prescription_png_bytes(), "rx.png")
    assert result.text.strip(), result.error or "empty OCR"
    assert result.engine in ("tesseract", "rapidocr", "none") or result.engine
    lower = result.text.lower()
    assert "paracetamol" in lower or "amoxicillin" in lower


def test_medicine_name_extraction_filters_junk():
    from app.services.medicine_extract_service import extract_medicine_names

    text = """
    MedMX Labs Upload Prescription
    Patient: John Doe
    Tab Paracetamol 650mg 1-0-1 for 5 days
    Cap Amoxicillin 500mg BD for 7 days
    Lab Reports CDAC
    """
    result = extract_medicine_names(text)
    names = {n.lower() for n in result.medicine_names}
    assert any("paracetamol" in n for n in names)
    assert any("amoxicillin" in n for n in names)
    assert not any("lab report" in n or "cdac" in n or "upload" in n for n in names)
    assert result.extraction_engine in (
        "smart_nlp",
        "none",
        "smart_nlp+catalog_compact",
        "smart_nlp+combination",
        "combination_formulation",
    )


def test_medicine_name_extraction_rejects_hospital_document_junk():
    from app.services.medicine_extract_service import extract_medicine_names

    text = """
    CHIEF COMPLAINT ROUTINE
    DIAGNOSIS EVAL
    Tab Diclofenac Diethylamine Gel 1.16% BD for 5 days
    FOLLOW UP
    22-Apr-2026 09 23
    Anjali Sinha
    CR No
    47 Yr/F
    EMD
    """
    result = extract_medicine_names(text)
    names = [n.lower() for n in result.medicine_names]
    assert any("diclofenac" in n for n in names), names
    assert not any("chief" in n or "complaint" in n or "diagnosis" in n for n in names)
    assert not any("anjali" in n or "sinha" in n for n in names)
    assert not any("follow" in n for n in names)
    assert not any("cr no" in n or n == "emd" for n in names)
    assert len(names) <= 3


def test_medicine_name_extraction_standalone_drug_line():
    from app.services.medicine_extract_service import extract_medicine_names

    text = "DICLOFENAC DIETHYLAMINE LINSEED OIL 1.16% w/w BD"
    result = extract_medicine_names(text)
    assert any("diclofenac" in n.lower() for n in result.medicine_names)


def test_medicine_name_cleaning_strips_strength():
    from app.services.medicine_extract_service import _normalize_name

    assert "Paracetamol" in _normalize_name("Tab Paracetamol 650mg")
    assert "Amoxicillin" in _normalize_name("Cap Amoxicillin 500mg BD")


def test_pdf_embedded_text_without_tesseract():
    import fitz

    from app.services.ocr_service import extract_document

    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (72, 72),
        "Hemoglobin: 11.2 g/dL\nCreatinine: 1.5 mg/dL\nTSH: 5.2 mIU/L",
    )
    result = extract_document(doc.tobytes(), "labs.pdf")
    assert "hemoglobin" in result.text.lower()
    assert result.pipeline == "pdf_text"


def test_lab_biomarker_parsing_from_ocr_text():
    from app.services.report_service import analyze_lab_text

    text = "Hemoglobin: 11.2\nCreatinine: 1.5\nTSH: 5.2"
    rows = analyze_lab_text(text)
    names = {r["name"].lower() for r in rows}
    assert any("hemoglobin" in n for n in names)
    assert any("creatinine" in n for n in names)


def test_lab_table_row_parsing():
    from app.services.report_service import analyze_lab_text

    text = """
    HAEMOGLOBIN          11.2 g/dL     13.5 - 17.5
    TOTAL LEUCOCYTE COUNT  7800        4000 - 11000
    SERUM CREATININE     1.05 mg/dL    0.7 - 1.3
    FASTING BLOOD SUGAR  98 mg/dL      70 - 100
    """
    rows = analyze_lab_text(text)
    keys = {r["name"].lower() for r in rows}
    assert any("hemoglobin" in k for k in keys)
    assert any("creatinine" in k for k in keys)
    assert any("glucose" in k for k in keys)


def test_lab_image_ocr_and_parse():
    from app.services.ocr_service import extract_document
    from app.services.report_service import analyze_lab_text

    img = Image.new("RGB", (720, 320), "white")
    draw = ImageDraw.Draw(img)
    draw.text((20, 30), "HAEMOGLOBIN    11.2 g/dL    13.5-17.5", fill="black")
    draw.text((20, 70), "SERUM CREATININE  1.05 mg/dL", fill="black")
    draw.text((20, 110), "TSH  5.2 mIU/L", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    ocr = extract_document(buf.getvalue(), "lab.jpg")
    assert ocr.text.strip(), ocr.error
    rows = analyze_lab_text(ocr.text)
    assert len(rows) >= 2, f"expected markers, got {rows!r} from {ocr.text!r}"


def test_medicine_compact_catalog_recovers_split_ocr():
    from app.services.medicine_extract_service import extract_medicine_names

    text = "Tab Diclofe nac Gel 1.16% BD for 5 days\nTab Aceclofe nac 100 mg OD"
    result = extract_medicine_names(text)
    names = [n.lower() for n in result.medicine_names]
    assert any("diclofenac" in n for n in names), names
    assert any("aceclofenac" in n for n in names), names
    assert "catalog_compact" in result.extraction_engine


def test_azure_di_used_when_configured(monkeypatch):
    from app.services import ocr_service

    monkeypatch.setenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "https://example.cognitiveservices.azure.com")
    monkeypatch.setenv("AZURE_DOCUMENT_INTELLIGENCE_KEY", "test-key")
    monkeypatch.setenv("MEDSCAN_AZURE_OCR", "1")

    def fake_analyze(data, filename=""):
        assert data
        from app.services.document_intelligence_service import AzureDiResult

        return AzureDiResult("Tab Paracetamol 650mg 1-0-1 for 5 days")

    monkeypatch.setattr(ocr_service.azure_di, "analyze_document", fake_analyze)
    monkeypatch.setattr(ocr_service.azure_di, "is_available", lambda: True)

    result = ocr_service.extract_document(_prescription_png_bytes(), "rx.png")
    assert result.engine == "azure_document_intelligence"
    assert "paracetamol" in result.text.lower()


def test_combination_topical_gel_extracts_single_formulation():
    from app.services import medicine_extract_service as mes

    mes.catalog._CATALOG_LOOKUP = None
    result = mes.extract_medicine_names(
        """
    CHIEF COMPLAINT ROUTINE
    DICLOFENAC DIETHYLAMINE LINSEED OIL METHYL SALICYLATE MENTHOL AND CAPSAICIN GEL 1.16% w/w BD for 5 days
    Anjali Sinha
    """
    )
    assert len(result.medicine_names) == 1, result.medicine_names
    name = result.medicine_names[0].lower()
    assert "diclofenac diethylamine" in name
    assert "linseed oil" in name
    assert "methyl salicylate" in name
    assert "menthol" in name
    assert "capsaicin" in name
    assert "gel" in name
    med = result.medicines[0]
    assert med.get("kind") == "combination"
    assert len(med.get("ingredients") or []) >= 3
    assert any("volini" in b.lower() for b in (med.get("brand_equivalents") or []))


def test_combination_collapse_partial_catalog_hits():
    from app.services import medicine_extract_service as mes

    mes.catalog._CATALOG_LOOKUP = None
    result = mes.extract_medicine_names(
        "Tab Diclofenac Diethylamine Linseed Oil Methyl Salicylate Menthol Capsaicin Gel 1.16% BD"
    )
    assert len(result.medicine_names) == 1
    assert "diclofenac" in result.medicine_names[0].lower()
    assert not any(n.lower() == "diclofenac" for n in result.medicine_names)


def test_fdc_montelukast_levocetirizine_merged():
    from app.services import medicine_extract_service as mes

    mes.catalog._CATALOG_LOOKUP = None
    result = mes.extract_medicine_names(
        "Montelukast 10 mg and Levocetirizine 5 mg Oral Tablet HS"
    )
    assert len(result.medicine_names) == 1, result.medicine_names
    name = result.medicine_names[0].lower()
    assert "montelukast" in name and "levocetirizine" in name
    assert "+" in result.medicine_names[0] or " and " in result.medicine_names[0].lower()
    med = result.medicines[0]
    assert med.get("kind") == "combination"
    assert any("montair" in b.lower() for b in (med.get("brand_equivalents") or []))


def test_full_prescription_five_medicines():
    from app.services import medicine_extract_service as mes

    mes.catalog._CATALOG_LOOKUP = None
    text = """
    Tab Azithromycin 500 mg OD for 3 days
    Montelukast 10 mg and Levocetirizine 5 mg Oral Tablet HS
    Tab Paracetamol 650 mg SOS
    Syp Ambroxol 30 mg/5 ml TDS for 5 days
    Rabeprazole Sodium 20 mg + Domperidone 30 mg Capsule OD
    """
    result = mes.extract_medicine_names(text)
    assert len(result.medicine_names) == 5, result.medicine_names
    names_lower = [n.lower() for n in result.medicine_names]
    assert sum("azithromycin" in n for n in names_lower) == 1
    assert sum("montelukast" in n for n in names_lower) == 1
    assert sum("levocetirizine" in n for n in names_lower) == 1
    assert any("montelukast" in n and "levocetirizine" in n for n in names_lower)
    assert sum("paracetamol" in n for n in names_lower) == 1
    assert sum("ambroxol" in n for n in names_lower) == 1
    assert sum("rabeprazole" in n for n in names_lower) == 1
    assert sum("domperidone" in n for n in names_lower) == 1
    assert any("rabeprazole" in n and "domperidone" in n for n in names_lower)


def test_numbered_fdc_lines_not_duplicated():
    from app.services import medicine_extract_service as mes

    mes.catalog._CATALOG_LOOKUP = None
    text = """
    1. Tab Azithromycin 500 mg OD
    2. MONTELUKAST 10 MG + LEVOCETIRIZINE 5 MG ORAL TABLET, Single Tab
    3. Tab Paracetamol 650 mg SOS
    4. Syp Ambroxol 30 mg/5 ml TDS
    5. RABEPRAZOLE SODIUM 20 MG + DOMPERIDONE 30 MG ORAL TAB/CAP, Single Tab
    MONTELUKAST 10 MG + LEVOCETIRIZINE 5 MG ORAL TABLET, Single Tab
    """
    result = mes.extract_medicine_names(text)
    assert len(result.medicine_names) == 5, result.medicine_names
    combos = [m for m in result.medicines if m.get("kind") == "combination"]
    assert len(combos) == 2
    assert not any(re.match(r"^\d+\.", n) for n in result.medicine_names)
    assert not any(n.strip().endswith("/") for n in result.medicine_names)
    assert any("ambroxol" in n.lower() and "30" in n.lower() for n in result.medicine_names)


def test_invalid_image_returns_error_not_crash():
    from app.services.ocr_service import extract_document

    result = extract_document(b"not-an-image", "bad.png")
    assert not result.text.strip()
    assert result.error


def test_llm_filter_merges_and_rejects_junk(monkeypatch):
    from app.services.medicine_extract_service import extract_medicine_names

    monkeypatch.setenv("MEDSCAN_LLM_MEDICINE_FILTER", "1")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    monkeypatch.setenv("MEDSCAN_LLM_PROVIDER", "deepseek")

    def fake_chat(system, user, timeout=45.0):
        del system, timeout
        assert "Paracetamol" in user
        return {
            "medicines": [
                "Paracetamol 650mg",
                "Anjali Sinha",
                "Cap Amoxicillin 500mg",
            ]
        }

    monkeypatch.setattr("app.services.llm_client.chat_json", fake_chat)

    text = """
    Patient Anjali Sinha
    Tab Paracetamol 650mg BD for 5 days
    """
    result = extract_medicine_names(text)
    names = [n.lower() for n in result.medicine_names]
    assert any("paracetamol" in n for n in names)
    assert any("amoxicillin" in n for n in names)
    assert not any("anjali" in n for n in names)
    assert "llm" in result.extraction_engine
