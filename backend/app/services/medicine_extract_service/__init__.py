"""Extract medicine names from prescription OCR — strict Rx/drug-line filter."""
from . import catalog
from .catalog import _catalog_match
from .extract import MedicineExtractResult, extract_medicine_names, scan_extraction_capabilities
from .patterns import _DRUG_HINT_RE, _PHARMA_SUFFIX_RE, _STRENGTH_RE
from .text import _is_incomplete_medicine_name, _is_junk_text, _normalize_name

__all__ = [
    "MedicineExtractResult",
    "_DRUG_HINT_RE",
    "_PHARMA_SUFFIX_RE",
    "_STRENGTH_RE",
    "_catalog_match",
    "_is_incomplete_medicine_name",
    "_is_junk_text",
    "_normalize_name",
    "catalog",
    "extract_medicine_names",
    "scan_extraction_capabilities",
]
