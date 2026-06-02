"""Extract medicine names from prescription OCR — strict Rx/drug-line filter (no Ollama)."""
from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)

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

_CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "medicine_catalog_seed.json")
_CATALOG_LOOKUP: dict[str, str] | None = None


@dataclass
class MedicineExtractResult:
    medicines: list[dict[str, str]]
    medicine_names: list[str]
    extraction_engine: str = "smart_nlp"


def _load_catalog() -> dict[str, str]:
    global _CATALOG_LOOKUP
    if _CATALOG_LOOKUP is not None:
        return _CATALOG_LOOKUP

    lookup: dict[str, str] = {}
    try:
        with open(_CATALOG_PATH, encoding="utf-8") as fp:
            rows = json.load(fp)
        for row in rows:
            composition = (row.get("composition") or "").strip()
            generic = (row.get("generic_name") or "").strip()
            if composition:
                lookup[composition.lower()] = _normalize_name(composition)
            if generic and generic.lower() not in lookup:
                if not composition or generic.lower() not in composition.lower():
                    lookup[generic.lower()] = _normalize_name(generic)
            for field in ("generic_name", "name", "composition"):
                raw = (row.get(field) or "").strip()
                if not raw or "+" not in raw:
                    continue
                for part in re.split(r"\s*\+\s*", raw):
                    part = re.sub(r"\s+\d+.*$", "", part.strip())
                    if len(part) >= 4:
                        lookup.setdefault(part.lower(), _normalize_name(part))
            brand = (row.get("name") or "").strip()
            if brand:
                token = brand.split()[0]
                if len(token) >= 4:
                    lookup.setdefault(token.lower(), _normalize_name(token))
    except Exception as exc:
        logger.warning("Could not load medicine catalog seed: %s", exc)

    _CATALOG_LOOKUP = lookup
    return lookup


def scan_extraction_capabilities() -> dict[str, Any]:
    from app.services.ai_service import ai_medicine_fallback_enabled, llm_is_configured

    catalog = _load_catalog()
    return {
        "engine": "smart_nlp",
        "methods": [
            "rx_lines",
            "combination_formulation",
            "drug_strength_lines",
            "catalog_match",
            "catalog_compact",
            "azure_openai_filter",
        ],
        "catalog_terms": len(catalog),
        "ready": True,
        "strict_mode": True,
        "llm_fallback_enabled": ai_medicine_fallback_enabled(),
        "llm_configured": llm_is_configured(),
    }


def _normalize_name(raw: str) -> str:
    name = raw.strip()
    name = re.sub(r"(?i)^(?:\d+[\).\s]+)", "", name)
    name = re.sub(r"(?i)^(?:tab\.?|cap\.?|syp\.?|syr\.?|inj\.?|drops\.?)\s+", "", name)
    name = re.sub(r"(?i),?\s*single\s+(?:tab|cap|tablet|capsule)s?\b", "", name)
    name = re.sub(r"(?i)\s*oral\s+(?:tab(?:let)?|cap(?:sule)?|tab/cap)s?\b", "", name)
    concentrations = _CONCENTRATION_RE.findall(name)
    name = _STRENGTH_RE.sub("", name)
    name = _FREQ_RE.sub("", name)
    name = re.sub(r"\bfor\s+\d+\s*(?:day|days|week|weeks|month|months)\b", "", name, flags=re.I)
    name = re.sub(r"[^\w\s+\-/]", " ", name)
    name = re.sub(r"\s+", " ", name).strip(" .,-/\\")
    for conc in concentrations:
        conc_clean = re.sub(r"\s+", " ", conc.strip())
        if conc_clean.lower() not in name.lower():
            name = f"{name} {conc_clean}".strip()
    name = re.sub(r"\s+", " ", name).strip(" .,-/\\")
    return name


def _preprocess_rx_line(line: str) -> str:
    s = re.sub(r"\s+", " ", line.strip())
    s = re.sub(r"(?i)^\d+[\).\s]+", "", s)
    s = re.sub(r"(?i),?\s*single\s+(?:tab|cap|tablet|capsule)s?\b", "", s)
    return s.strip()


def _normalize_medicine_key(name: str) -> str:
    s = _preprocess_rx_line(name or "")
    s = s.lower()
    s = re.sub(r"(?i)\s*oral\s+(?:tab(?:let)?|cap(?:sule)?|tab/cap)s?\b", " ", s)
    s = re.sub(r"[^\w\s+]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _is_incomplete_medicine_name(name: str) -> bool:
    clean = (name or "").strip()
    if not clean or len(clean) < 3:
        return True
    if re.search(r"[/\\]\s*$", clean):
        return True
    if re.fullmatch(r"(?i)[a-z]{3,20}\s*[/\\]\s*", clean):
        return True
    return False


def _is_junk_text(text: str) -> bool:
    t = (text or "").strip()
    if not t or len(t) < 3:
        return True
    if _JUNK_RE.search(t):
        return True
    if _DATE_RE.search(t):
        return True
    if _DEMO_RE.search(t):
        return True
    if _TIME_ONLY_RE.match(t):
        return True
    if re.fullmatch(r"(?i)(cr no\.?|emd|opd|ipd|uhid|eval|routine)", t):
        return True
    # Person name: two title-case words, no drug signal
    parts = t.split()
    if len(parts) == 2 and all(p[:1].isupper() for p in parts if p):
        if not _DRUG_HINT_RE.search(t) and not _STRENGTH_RE.search(t):
            return True
    # ALL CAPS section header (3+ chars words, no digits, no drug hint)
    if t.isupper() and len(parts) >= 2 and not _DRUG_HINT_RE.search(t):
        if not _STRENGTH_RE.search(t):
            return True
    return False


def _catalog_match(name: str, full_text: str) -> str | None:
    lookup = _load_catalog()
    key = name.lower()
    if key in lookup:
        return lookup[key]
    for cat_key, display in lookup.items():
        if len(cat_key) >= 5 and re.search(rf"\b{re.escape(cat_key)}\b", key):
            return display
    # Substring in document for multi-word generics
    lower_doc = full_text.lower()
    for cat_key, display in lookup.items():
        if len(cat_key) >= 6 and re.search(rf"\b{re.escape(cat_key)}\b", lower_doc):
            if cat_key in key or key in cat_key:
                return display
    return None


def _has_drug_signal(name: str, line: str = "") -> bool:
    blob = f"{name} {line}"
    if _DRUG_HINT_RE.search(blob):
        return True
    if _RX_PREFIX_RE.search(line) or _RX_INLINE_RE.search(line):
        return True
    if _STRENGTH_RE.search(line) and re.search(r"[a-zA-Z]{4,}", name):
        return True
    if _catalog_match(name, line):
        return True
    return False


def _accept_name(name: str, line: str = "", full_text: str = "") -> str | None:
    clean = _normalize_name(name)
    if not clean or len(clean) < 3 or len(clean) > 120:
        return None
    if _is_incomplete_medicine_name(clean):
        return None
    if _is_junk_text(clean):
        return None
    if not _has_drug_signal(clean, line or clean):
        return None
    cat = _catalog_match(clean, full_text or line)
    if cat:
        return cat
    # Drop trailing junk tokens (e.g. "LINSEE" fragment alone)
    words = clean.split()
    if len(words) > 4:
        return None
    return clean


def _title_form(raw: str) -> str:
    form = raw.strip().lower()
    if form.startswith("oint"):
        return "Ointment"
    return raw.strip().title()


def _line_has_fdc_connector(line: str) -> bool:
    """True when two drug+strength segments are joined by and/with/+ on one Rx line."""
    if re.search(r"(?i)(?:mg|ml|mcg|iu|gm|g|%|units?)\s+(?:and|with)\s+", line):
        return True
    if re.search(r"(?i)\+\s*[A-Za-z]", line) and len(_STRENGTH_RE.findall(line)) >= 2:
        return True
    return False


def _trim_rx_line_tail(line: str) -> str:
    work = _preprocess_rx_line(line)
    work = re.sub(
        r"(?i)^(?:tab\.?|cap\.?|syp\.?|syr\.?|inj\.?|drops\.?|gel\.?|oint\.?)\s+",
        "",
        work,
    )
    for pat in (_FREQ_RE, re.compile(r"(?i)\bfor\s+\d"), _DATE_RE):
        m = pat.search(work)
        if m:
            work = work[: m.start()]
    return work.strip()


def _clean_fdc_component(raw: str) -> str:
    s = raw.strip()
    s = re.sub(r"(?i)^(?:tab\.?|cap\.?|syp\.?|syr\.?|inj\.?|drops\.?|gel\.?)\s+", "", s)
    s = _ORAL_FORM_TAIL_RE.sub("", s)
    s = re.sub(r"\s+", " ", s).strip(" .,-+")
    return s


def _ingredient_label(component: str) -> str:
    """Drug name without strength — for ingredients list and recipe matching."""
    label = _STRENGTH_RE.sub("", component).strip()
    label = re.sub(r"\s+", " ", label)
    return label


def _extract_fdc_combination_from_line(line: str) -> dict[str, Any] | None:
    """Parse fixed-dose combinations: Montelukast 10 mg and Levocetirizine 5 mg Tablet."""
    if _is_junk_text(line) or not _DRUG_HINT_RE.search(line):
        return None
    if not _line_has_fdc_connector(line):
        return None

    work = _trim_rx_line_tail(line)
    parts = [p.strip() for p in _FDC_SPLIT_RE.split(work) if p.strip()]
    components: list[str] = []

    for part in parts:
        if not _STRENGTH_RE.search(part):
            continue
        cleaned = _clean_fdc_component(part)
        if not cleaned or len(cleaned) < 5:
            continue
        drug_part = _ingredient_label(cleaned)
        if not drug_part or _is_junk_text(drug_part):
            continue
        if not _has_drug_signal(drug_part, line):
            continue
        components.append(cleaned)

    if len(components) < 2:
        return None

    ingredients = [_ingredient_label(c) for c in components]
    display_name = " + ".join(components)
    known = _match_known_combination(ingredients, display_name=display_name)

    if known:
        return known

    form = ""
    form_match = re.search(
        r"(?i)\b(tablet|capsule|syrup|injection|gel|cream|ointment)s?\b",
        line,
    )
    if form_match:
        form = _title_form(form_match.group(1))

    return {
        "name": display_name if not form or form.lower() in display_name.lower() else f"{display_name} {form}",
        "kind": "combination",
        "ingredients": ingredients,
        "brand_equivalents": [],
        "form": form,
    }


def _find_ingredients_in_text(text: str) -> list[str]:
    lower = text.lower()
    compact = re.sub(r"[^a-z0-9]", "", lower)
    found: list[str] = []
    seen: set[str] = set()

    for key, display in sorted(_COMBINATION_INGREDIENT_TERMS, key=lambda item: len(item[0]), reverse=True):
        display_key = display.lower()
        if display_key in seen:
            continue
        key_compact = re.sub(r"[^a-z0-9]", "", key)
        matched = bool(re.search(rf"\b{re.escape(key)}\b", lower))
        if not matched and len(key_compact) >= 6:
            matched = key_compact in compact
        if not matched:
            continue
        # Skip bare "Diclofenac" when "Diclofenac Diethylamine" already matched.
        if display_key == "diclofenac" and "diclofenac diethylamine" in seen:
            continue
        found.append(display)
        seen.add(display_key)
    return found


def _ingredient_matches_recipe_key(ingredient: str, key: str) -> bool:
    ing = ingredient.lower().strip()
    key = key.lower().strip()
    if not ing or not key:
        return False
    return ing == key or key in ing or ing.startswith(key)


def _match_known_combination(
    found_ingredients: list[str],
    display_name: str | None = None,
) -> dict[str, Any] | None:
    best: dict[str, Any] | None = None
    best_score = 0
    for recipe in _KNOWN_COMBINATION_RECIPES:
        keys = recipe["ingredient_keys"]
        overlap = sum(
            1
            for key in keys
            if any(_ingredient_matches_recipe_key(ing, key) for ing in found_ingredients)
        )
        needed = int(recipe.get("min_match", len(keys)))
        if overlap >= needed and overlap > best_score:
            best_score = overlap
            recipe_ingredients = list(recipe.get("ingredients") or found_ingredients)
            name = recipe.get("name") or display_name or _build_combination_name(
                recipe_ingredients,
                recipe.get("form", ""),
            )
            best = {
                "name": name,
                "kind": "combination",
                "ingredients": recipe_ingredients,
                "brand_equivalents": list(recipe.get("brand_equivalents") or []),
                "form": recipe.get("form", ""),
            }
    return best


def _build_combination_name(ingredients: list[str], form: str = "") -> str:
    base = " + ".join(ingredients)
    if form and form.lower() not in base.lower():
        base = f"{base} {form}"
    return base


def _extract_combination_from_line(line: str) -> dict[str, Any] | None:
    if _is_junk_text(line) or not _DRUG_HINT_RE.search(line):
        return None

    fdc = _extract_fdc_combination_from_line(line)
    if fdc:
        return fdc

    ingredients = _find_ingredients_in_text(line)
    if len(ingredients) < 2:
        return None

    has_topical = bool(_TOPICAL_FORM_RE.search(line))
    has_rx_strength = bool(_STRENGTH_RE.search(line) or _FREQ_RE.search(line))
    if not has_topical and not has_rx_strength:
        return None

    known = _match_known_combination(ingredients)
    if known:
        return known

    form = ""
    form_match = _TOPICAL_FORM_RE.search(line)
    if form_match:
        form = _title_form(form_match.group(1))

    return {
        "name": _build_combination_name(ingredients, form),
        "kind": "combination",
        "ingredients": ingredients,
        "brand_equivalents": [],
        "form": form,
    }


def _drop_redundant_substring_names(names: list[str]) -> list[str]:
    ordered = sorted(names, key=len, reverse=True)
    kept: list[str] = []
    for name in ordered:
        lower = name.lower()
        if any(
            lower != other.lower() and (lower in other.lower() or other.lower().startswith(lower + " "))
            for other in kept
        ):
            continue
        kept.append(name)
    return kept


def _combination_signature(combo: dict[str, Any]) -> frozenset[str]:
    ings = combo.get("ingredients") or []
    if ings:
        return frozenset(i.lower() for i in ings)
    name = combo.get("name", "")
    if _line_has_fdc_connector(name):
        parts = [p.strip() for p in _FDC_SPLIT_RE.split(_trim_rx_line_tail(name)) if p.strip()]
        labels = [_ingredient_label(_clean_fdc_component(p)) for p in parts if _STRENGTH_RE.search(p)]
        labels = [l for l in labels if l]
        if len(labels) >= 2:
            return frozenset(l.lower() for l in labels)
    return frozenset({_normalize_medicine_key(name)})


def _dedupe_combinations(combos: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[frozenset[str]] = set()
    out: list[dict[str, Any]] = []
    for combo in combos:
        sig = _combination_signature(combo)
        if sig in seen:
            continue
        seen.add(sig)
        out.append(combo)
    return out


def _is_subsumed_by_combination(name: str, combinations: list[dict[str, Any]]) -> bool:
    if _is_incomplete_medicine_name(name):
        return True
    norm = _normalize_medicine_key(name)
    if not norm:
        return True
    for combo in combinations:
        combo_norm = _normalize_medicine_key(combo.get("name", ""))
        if norm == combo_norm:
            return True
        if combo_norm and (combo_norm in norm or norm in combo_norm):
            return True
        ingredients = combo.get("ingredients") or []
        if len(ingredients) >= 2 and all(
            ing.lower() in norm or _ingredient_matches_recipe_key(ing, norm)
            for ing in ingredients
        ):
            if _line_has_fdc_connector(name) or "+" in norm or re.search(r"\band\b", norm):
                return True
        for ing in ingredients:
            ing_lower = ing.lower()
            if norm == ing_lower:
                return True
            if len(norm) <= len(ing_lower) and ing_lower in norm and _line_has_fdc_connector(name):
                return True
    return False


def _dedupe_medicine_entries(medicines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Drop duplicate entries; prefer combination rows with brand equivalents."""
    best: dict[str, dict[str, Any]] = {}
    order: list[str] = []

    def _score(m: dict[str, Any]) -> tuple[int, int]:
        return (
            1 if m.get("kind") == "combination" else 0,
            len(m.get("brand_equivalents") or []),
        )

    for med in medicines:
        key = _normalize_medicine_key(med.get("name", ""))
        if not key or _is_incomplete_medicine_name(med.get("name", "")):
            continue
        if key not in best:
            best[key] = med
            order.append(key)
        elif _score(med) > _score(best[key]):
            best[key] = med

    # Drop singles whose normalized key matches a combination ingredient set
    combos = [m for m in best.values() if m.get("kind") == "combination"]
    final_order: list[str] = []
    final: list[dict[str, Any]] = []
    for key in order:
        med = best[key]
        if med.get("kind") != "combination" and _is_subsumed_by_combination(med.get("name", ""), combos):
            continue
        final_order.append(key)
        final.append(med)
    return final[:20]


def _finalize_medicines(candidates: list[str], text: str) -> tuple[list[str], list[dict[str, Any]]]:
    """Merge multi-ingredient lines and drop partial duplicate catalog hits."""
    lines = [_preprocess_rx_line(ln) for ln in text.splitlines() if ln.strip()]
    lines = [re.sub(r"\s+", " ", ln) for ln in lines if ln]
    combinations: list[dict[str, Any]] = []

    for line in lines:
        combo = _extract_combination_from_line(line)
        if combo:
            combinations.append(combo)

    combinations = _dedupe_combinations(combinations)

    if not combinations:
        doc_ingredients = _find_ingredients_in_text(text)
        known = _match_known_combination(doc_ingredients)
        if known:
            combinations.append(known)

    singles = _drop_redundant_substring_names(candidates)
    singles = [n for n in singles if not _is_incomplete_medicine_name(n)]
    if combinations:
        singles = [n for n in singles if not _is_subsumed_by_combination(n, combinations)]

    medicines: list[dict[str, Any]] = [dict(c) for c in combinations]
    for name in singles:
        if not _is_subsumed_by_combination(name, combinations):
            medicines.append({"name": name, "kind": "single"})

    medicines = _dedupe_medicine_entries(medicines)
    names = [m["name"] for m in medicines]
    return names, medicines


def _dedupe(names: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for n in names:
        key = n.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(n)
        if len(out) >= 20:
            break
    return out


def _extract_from_line(line: str, full_text: str) -> list[str]:
    line = _preprocess_rx_line(line)
    if not line or _is_junk_text(line):
        return []

    combo = _extract_combination_from_line(line)
    if combo:
        return [combo["name"]]

    found: list[str] = []

    conc = _CONCENTRATION_RE.search(line)
    if conc and re.search(r"(?i)\b(?:syp|syr|syrup)\b", line):
        drug_m = re.search(
            r"(?i)(?:syp\.?|syr\.?|syrup\s+)?([A-Za-z][A-Za-z\s\-]{2,30}?)\s+"
            + re.escape(conc.group(0)),
            line,
        )
        if drug_m:
            accepted = _accept_name(f"{drug_m.group(1)} {conc.group(0)}", line, full_text)
            if accepted:
                return [accepted]

    for m in _RX_INLINE_RE.finditer(line):
        accepted = _accept_name(m.group(1), line, full_text)
        if accepted:
            found.append(accepted)

    m = _DRUG_LINE_RE.match(line.strip())
    if m:
        accepted = _accept_name(m.group(1), line, full_text)
        if accepted:
            found.append(accepted)

    if _RX_PREFIX_RE.match(line):
        body = _RX_PREFIX_RE.sub("", line.strip())
        strength_m = _STRENGTH_RE.search(body)
        if strength_m:
            name_part = body[: strength_m.start()].strip()
            accepted = _accept_name(name_part, line, full_text)
            if accepted:
                found.append(accepted)

    # Standalone drug line (hospital PDFs): "DICLOFENAC DIETHYLAMINE ..." without Tab prefix
    if not found and _DRUG_HINT_RE.search(line) and not _is_junk_text(line):
        # Take text before strength/frequency if present
        cut = len(line)
        for pat in (_STRENGTH_RE, _FREQ_RE, _DATE_RE):
            m = pat.search(line)
            if m:
                cut = min(cut, m.start())
        name_part = line[:cut].strip()
        accepted = _accept_name(name_part, line, full_text)
        if accepted:
            found.append(accepted)

    return found


def _extract_from_catalog_in_document(text: str) -> list[str]:
    lookup = _load_catalog()
    lower = text.lower()
    found: list[str] = []
    for cat_key, display in lookup.items():
        if len(cat_key) < 5:
            continue
        if re.search(rf"\b{re.escape(cat_key)}\b", lower):
            if not _is_junk_text(display):
                found.append(display)
    return found


def _document_has_rx_context(text: str) -> bool:
    for ln in text.splitlines():
        s = ln.strip()
        if not s:
            continue
        if _STRENGTH_RE.search(s) or _RX_PREFIX_RE.search(s) or _FREQ_RE.search(s):
            return True
    return False


def _extract_from_catalog_compact(text: str) -> list[str]:
    """Recover catalog drugs when OCR splits words (e.g. Diclofe nac → diclofenac)."""
    if not _document_has_rx_context(text):
        return []
    lookup = _load_catalog()
    compact = re.sub(r"[^a-z0-9]", "", text.lower())
    if len(compact) < 8:
        return []
    found: list[str] = []
    for cat_key, display in lookup.items():
        key_compact = re.sub(r"[^a-z0-9]", "", cat_key)
        if len(key_compact) >= 6 and key_compact in compact:
            if not _is_junk_text(display):
                found.append(display)
    return found


def _accept_llm_candidate(name: str, full_text: str) -> str | None:
    """Validate a name returned by Azure OpenAI — stricter than free text, looser than Rx-line rules."""
    clean = _normalize_name(name)
    if not clean or len(clean) < 3 or len(clean) > 140:
        return None
    if _is_junk_text(clean):
        return None

    cat = _catalog_match(clean, full_text)
    if cat:
        return cat

    if _has_drug_signal(clean, full_text):
        return clean

    lower_doc = full_text.lower()
    compact_doc = re.sub(r"[^a-z0-9]", "", lower_doc)
    clean_lower = clean.lower()
    clean_compact = re.sub(r"[^a-z0-9]", "", clean_lower)
    if (
        clean_lower in lower_doc
        or (len(clean_compact) >= 5 and clean_compact in compact_doc)
    ) and re.search(r"[a-zA-Z]{4,}", clean):
        word_count = len(clean.split())
        if word_count <= 4 or ("+" in clean and word_count <= 16):
            return clean
    return None


def _validate_llm_candidates(candidates: list[str], full_text: str) -> list[str]:
    accepted: list[str] = []
    for raw in candidates:
        if not raw or not isinstance(raw, str):
            continue
        hit = _accept_llm_candidate(raw, full_text)
        if hit:
            accepted.append(hit)
            continue
        for line in full_text.splitlines():
            line_hit = _accept_name(raw, line, full_text)
            if line_hit:
                accepted.append(line_hit)
                break
    return accepted


def _should_use_llm_filter(text: str, names: list[str]) -> bool:
    from app.services.ai_service import ai_medicine_fallback_enabled, llm_is_configured

    if not ai_medicine_fallback_enabled() or not llm_is_configured():
        return False
    if names:
        return True
    return bool(_document_has_rx_context(text) or _DRUG_HINT_RE.search(text))


def _merge_llm_with_nlp(llm_names: list[str], nlp_names: list[str], full_text: str) -> list[str]:
    merged = list(llm_names)
    seen = {n.lower() for n in merged}
    for n in nlp_names:
        key = n.lower()
        if key in seen:
            continue
        if _accept_name(n, n, full_text):
            merged.append(n)
            seen.add(key)
    return _dedupe(merged)


def _extract_smart_nlp(text: str) -> MedicineExtractResult:
    """Return medicine names only — strict filter, no document headers or patient info."""
    if not text or not text.strip():
        return MedicineExtractResult(medicines=[], medicine_names=[], extraction_engine="none")

    lines = [_preprocess_rx_line(ln) for ln in text.splitlines() if ln.strip()]
    lines = [re.sub(r"\s+", " ", ln) for ln in lines if ln]
    candidates: list[str] = []

    for line in lines:
        candidates.extend(_extract_from_line(line, text))

    # Catalog hits only when drug appears in a line that also has Rx/strength context nearby
    for line in lines:
        if _STRENGTH_RE.search(line) or _RX_PREFIX_RE.search(line) or _FREQ_RE.search(line):
            candidates.extend(_extract_from_catalog_in_document(line))

    names = _dedupe(candidates)
    medicines = [{"name": n} for n in names]
    return MedicineExtractResult(
        medicines=medicines,
        medicine_names=names,
        extraction_engine="smart_nlp" if names else "none",
    )


def extract_medicine_names(text: str) -> MedicineExtractResult:
    """Return medicine names — smart_nlp + catalog compact, filtered by Azure OpenAI when configured."""
    if not text or not text.strip():
        return MedicineExtractResult(medicines=[], medicine_names=[], extraction_engine="none")

    nlp = _extract_smart_nlp(text)
    names = list(nlp.medicine_names)
    engine = nlp.extraction_engine

    compact = _extract_from_catalog_compact(text)
    if compact:
        merged = _dedupe(names + compact)
        if len(merged) > len(names):
            names = merged
            if engine == "smart_nlp":
                engine = "smart_nlp+catalog_compact"
            elif engine == "none":
                engine = "catalog_compact"

    if _should_use_llm_filter(text, names):
        from app.services.ai_service import extract_medicine_names_from_ocr_text

        llm_raw = extract_medicine_names_from_ocr_text(text, candidates=names or None)
        llm_valid = _validate_llm_candidates(llm_raw, text)
        if llm_valid:
            had_nlp = bool(names)
            names = _merge_llm_with_nlp(llm_valid, names, text)
            if had_nlp and engine not in ("none",):
                engine = "azure_openai+smart_nlp"
            else:
                engine = "azure_openai"
        elif not names and llm_raw:
            logger.warning("Azure OpenAI returned medicines but none passed validation")

    names, medicines = _finalize_medicines(names, text)
    if combinations := [m for m in medicines if m.get("kind") == "combination"]:
        if engine == "none":
            engine = "combination_formulation"
        elif "combination" not in engine:
            engine = f"{engine}+combination"

    return MedicineExtractResult(
        medicines=medicines,
        medicine_names=names,
        extraction_engine=engine if names else "none",
    )
