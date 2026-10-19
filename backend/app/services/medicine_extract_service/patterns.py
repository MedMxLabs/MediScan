"""Regexes and known-combination tables for prescription medicine extraction."""
from __future__ import annotations

import re
from typing import Any

_RX_PREFIX_RE = re.compile(
    r"(?i)^(?:\d+[\).\s]*)?(?:tab\.?|cap\.?|syp\.?|syr\.?|inj\.?|drops\.?|oint\.?|gel\.?|susp\.?)\s+"
)
_RX_INLINE_RE = re.compile(
    r"(?i)(?:tab\.?|cap\.?|syp\.?|syr\.?|inj\.?|drops\.?|oint\.?|gel\.?|susp\.?)\s+"
    r"([A-Za-z][A-Za-z0-9+\-/]{2,48}?)"
    r"(?=\s+(?:[\d.]+\s*(?:mg|ml|mcg|iu|gm|g|%|units?)\b|\d+\s*[-–]\s*\d+|(?:od|bd|tds|qid|hs|sos)\b|for\s+\d+\s*day|\s|$))"
)
_STRENGTH_RE = re.compile(r"(?i)\b[\d.]+\s*(?:mg|ml|mcg|iu|gm|g|%|units?)\b")
_CONCENTRATION_RE = re.compile(
    r"(?i)\b[\d.]+\s*(?:mg|mcg|g|iu|units?)\s*/\s*[\d.]+\s*(?:ml|l|mg|g)\b"
)
_FREQ_RE = re.compile(r"(?i)\b(od|bd|tds|qid|hs|sos|once daily|twice daily|thrice daily|\d+\s*[-–]\s*\d+\s*[-–]\s*\d+)\b")

# Medical document sections / labels — never medicines
_JUNK_RE = re.compile(
    r"(?i)(?:^|\b)("
    r"chief complaint|complaint|routine|diagnosis|eval|evaluation|follow up|follow-up|"
    r"history|examination|investigation|advice|referral|prescription|rx\b|"
    r"patient|doctor|dr\.|signature|hospital|clinic|department|"
    r"cr no|cr\.?no|uhid|ipd|opd|emd|emergency|registration|"
    r"age|sex|gender|dob|date of birth|mobile|phone|address|"
    r"lab report|report summary|cdac|medmx|upload|extracted|analysis|"
    r"hemoglobin|creatinine|glucose|platelet|wbc|rbc|tsh|cbc|"
    r"click to|choose file|view ocr|bill no|invoice|gst|"
    r"thank you|regards|consultant|specialist|mbbs|md\b|ms\b|dm\b"
    r")\b"
)

_DATE_RE = re.compile(
    r"(?i)(?:\b\d{1,2}[-/]\w{3,9}[-/]\d{2,4}\b|\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b\d{4}-\d{2}-\d{2}\b)"
)
_DEMO_RE = re.compile(r"(?i)\b\d+\s*yr\s*[/\\]?\s*[mf]\b|\b\d+\s*y\s*[/\\]\s*[mf]\b")
_TIME_ONLY_RE = re.compile(r"^\d{1,2}\s+\d{2}$")

# Drug-name signals (generic salts, suffixes, common Indian Rx molecules)
_DRUG_HINT_RE = re.compile(
    r"(?i)(?:"
    r"fenac|azole|prazole|statin|mycin|cillin|olol|sartan|pril|dipine|pine\b|"
    r"metformin|paracetamol|acetaminophen|amoxicillin|azithromycin|cetirizine|"
    r"levocetirizine|diclofenac|ibuprofen|aspirin|insulin|thyrox|levothyrox|"
    r"montelukast|pantoprazole|omeprazole|losartan|clopidogrel|telmisartan|"
    r"amlodipine|hydrochloride|diethylamine|salbutamol|prednisolone|"
    r"dexamethasone|cefixime|ofloxacin|levofloxacin|glimepiride|sitagliptin|"
    r"atorvastatin|rosuvastatin|gabapentin|pregabalin|tramadol|codeine|"
    r"domperidone|ondansetron|ranitidine|famotidine|levoflox|metronidazole|"
    r"rabeprazole|ambroxol|clavulanic|"
    r"doxycycline|cef|axone|augmentin|augment|linseed|linsee|nimesulide|"
    r"etoricoxib|aceclofenac|thiocolchicoside|methylcobalamin|pregabalin|"
    r"methyl salicylate|menthol|capsaicin|salicylate|"
    r"vitamin|cholecalciferol|cyanocobalamin|ferrous|folic|"
    r"combiflam|crocin|dolo|glycomet|telma|pantocid|thyronorm|"
    r"tablet|capsule|syrup|injection|drops|suspension"
    r")"
)

# Common generic suffixes when not in catalog/hint list
_PHARMA_SUFFIX_RE = re.compile(
    r"(?i)(?:mycin|cillin|azole|prazole|olol|sartan|pril|dipine|statin|"
    r"fenac|olone|azine|pam|zepam|tidine|prazole|gliptin|formin|"
    r"paracetamol|amoxicillin|azithromycin|metformin|insulin)$"
)

# Line looks like "DRUG NAME 50mg" or "DRUG 1-0-1"
_DRUG_LINE_RE = re.compile(
    r"(?i)^(?:\d+[\).\s]*)?"
    r"([A-Za-z][A-Za-z0-9+\-/ \.]{2,50}?)"
    r"\s+(?:[\d.]+\s*(?:mg|ml|mcg|iu|gm|g|%|units?)\b|\d+\s*[-–]\s*\d+\s*[-–]\s*\d+\b|(?:od|bd|tds|qid|hs|sos)\b)"
)

_TOPICAL_FORM_RE = re.compile(r"(?i)\b(gel|ointment|oint\.?|cream|lotion|liniment|spray)\b")

_ORAL_FORM_TAIL_RE = re.compile(
    r"(?i)\s+(?:oral\s+)?(?:tab(?:let)?s?|cap(?:sule)?s?|syp(?:up)?|syrups?|"
    r"inj(?:ection)?s?|gel|cream|ointment|drops|suspension)s?\.?\s*$"
)

# Fixed-dose combination: "DrugA 10 mg AND DrugB 5 mg Tablet" or "DrugA 20 mg + DrugB 30 mg"
_FDC_SPLIT_RE = re.compile(r"(?i)\s+(?:and|with)\s+|\s+\+\s+")

# Ingredient phrases for multi-drug topical lines (longest match first in _find_ingredients_in_text).
_COMBINATION_INGREDIENT_TERMS: list[tuple[str, str]] = [
    ("diclofenac diethylamine", "Diclofenac Diethylamine"),
    ("methyl salicylate", "Methyl Salicylate"),
    ("linseed oil", "Linseed Oil"),
    ("linsee oil", "Linseed Oil"),
    ("menthol", "Menthol"),
    ("capsaicin", "Capsaicin"),
    ("aceclofenac", "Aceclofenac"),
    ("thiocolchicoside", "Thiocolchicoside"),
    ("diclofenac", "Diclofenac"),
]

_KNOWN_COMBINATION_RECIPES: list[dict[str, Any]] = [
    {
        "ingredient_keys": {
            "diclofenac diethylamine",
            "linseed oil",
            "methyl salicylate",
            "menthol",
            "capsaicin",
        },
        "min_match": 3,
        "name": "Diclofenac Diethylamine + Linseed Oil + Methyl Salicylate + Menthol + Capsaicin Gel",
        "ingredients": [
            "Diclofenac Diethylamine",
            "Linseed Oil",
            "Methyl Salicylate",
            "Menthol",
            "Capsaicin",
        ],
        "brand_equivalents": ["Volini Gel", "Omnigel", "Dynapar Gel"],
        "form": "Gel",
    },
    {
        "ingredient_keys": {"montelukast", "levocetirizine"},
        "min_match": 2,
        "ingredients": ["Montelukast", "Levocetirizine"],
        "brand_equivalents": ["Montair-LC", "Montek-LC", "Telekast-L"],
        "form": "Tablet",
    },
    {
        "ingredient_keys": {"rabeprazole", "domperidone"},
        "min_match": 2,
        "ingredients": ["Rabeprazole Sodium", "Domperidone"],
        "brand_equivalents": ["Rablet-D", "Domrab", "Rabemac-D"],
        "form": "Capsule",
    },
    {
        "ingredient_keys": {"amoxicillin", "clavulanic acid"},
        "min_match": 2,
        "ingredients": ["Amoxicillin", "Clavulanic Acid"],
        "brand_equivalents": ["Augmentin", "Moxclav"],
        "form": "Tablet",
    },
    {
        "ingredient_keys": {"ibuprofen", "paracetamol"},
        "min_match": 2,
        "ingredients": ["Ibuprofen", "Paracetamol"],
        "brand_equivalents": ["Combiflam", "Ibugesic Plus"],
        "form": "Tablet",
    },
]
