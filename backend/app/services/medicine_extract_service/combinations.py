"""Fixed-dose / multi-ingredient combination detection and final de-duplication."""
from __future__ import annotations

import re
from typing import Any

from .catalog import _has_drug_signal
from .patterns import (
    _COMBINATION_INGREDIENT_TERMS,
    _DATE_RE,
    _DRUG_HINT_RE,
    _FDC_SPLIT_RE,
    _FREQ_RE,
    _KNOWN_COMBINATION_RECIPES,
    _ORAL_FORM_TAIL_RE,
    _STRENGTH_RE,
    _TOPICAL_FORM_RE,
)
from .text import _is_incomplete_medicine_name, _is_junk_text, _normalize_medicine_key, _preprocess_rx_line


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
        labels = [label for label in labels if label]
        if len(labels) >= 2:
            return frozenset(label.lower() for label in labels)
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
    final = [
        best[key]
        for key in order
        if best[key].get("kind") == "combination" or not _is_subsumed_by_combination(best[key].get("name", ""), combos)
    ]
    return final[:20]


def _finalize_medicines(candidates: list[str], text: str) -> tuple[list[str], list[dict[str, Any]]]:
    """Merge multi-ingredient lines and drop partial duplicate catalog hits."""
    lines = [_preprocess_rx_line(ln) for ln in text.splitlines() if ln.strip()]
    lines = [re.sub(r"\s+", " ", ln) for ln in lines if ln]
    combinations = _dedupe_combinations([c for c in map(_extract_combination_from_line, lines) if c])

    if not combinations:
        known = _match_known_combination(_find_ingredients_in_text(text))
        if known:
            combinations.append(known)

    singles = _drop_redundant_substring_names(candidates)
    singles = [n for n in singles if not _is_incomplete_medicine_name(n)]
    if combinations:
        singles = [n for n in singles if not _is_subsumed_by_combination(n, combinations)]

    medicines: list[dict[str, Any]] = [dict(c) for c in combinations]
    medicines.extend({"name": name, "kind": "single"} for name in singles)

    medicines = _dedupe_medicine_entries(medicines)
    return [m["name"] for m in medicines], medicines
