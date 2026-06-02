"""Reminder scheduling helpers."""
from __future__ import annotations

import re
from datetime import datetime, timedelta

from app.models.reminder import Reminder

_TIME_RE = re.compile(r"^(\d{1,2}):(\d{2})$")


def _parse_hhmm(raw: str) -> tuple[int, int] | None:
    m = _TIME_RE.match((raw or "").strip())
    if not m:
        return None
    hour, minute = int(m.group(1)), int(m.group(2))
    if 0 <= hour <= 23 and 0 <= minute <= 59:
        return hour, minute
    return None


def _normalize_times(times: list[str] | str | None) -> list[str]:
    if times is None:
        return []
    if isinstance(times, str):
        times = [times]
    out: list[str] = []
    for t in times:
        parsed = _parse_hhmm(str(t))
        if parsed:
            out.append(f"{parsed[0]:02d}:{parsed[1]:02d}")
    return out


def compute_next_trigger(
    times: list[str] | str | None,
    frequency: str | None,
    duration_days: int | None,
) -> datetime | None:
    """Next dose datetime in UTC from schedule times (defaults 09:00 if none valid)."""
    del frequency, duration_days  # reserved for future recurrence rules
    now = datetime.utcnow()
    normalized = _normalize_times(times)
    if not normalized:
        normalized = ["09:00"]

    candidates: list[datetime] = []
    for hhmm in normalized:
        hour, minute = _parse_hhmm(hhmm) or (9, 0)
        candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= now:
            candidate += timedelta(days=1)
        candidates.append(candidate)
    return min(candidates) if candidates else None


def update_reminder_fields(r: Reminder, data: dict) -> None:
    if "medicine_name" in data:
        r.medicine_name = (data.get("medicine_name") or "").strip() or r.medicine_name
    if "dose" in data:
        r.dose = data.get("dose")
    if "frequency" in data:
        r.frequency = data.get("frequency")
    if "schedule" in data:
        r.schedule = data.get("schedule") if isinstance(data.get("schedule"), dict) else r.schedule
    if "duration_days" in data:
        r.duration_days = data.get("duration_days")
    if "status" in data:
        r.status = data.get("status") or r.status

    times_list = None
    if isinstance(data.get("times"), list):
        times_list = data.get("times")
    elif isinstance(data.get("times"), str):
        times_list = [t.strip() for t in data["times"].split(",") if t.strip()]
    sch = r.schedule or {}
    if isinstance(sch, dict) and sch.get("times"):
        times_list = times_list or sch.get("times")
    if times_list and isinstance(sch, dict):
        r.schedule = {**sch, "times": _normalize_times(times_list)}

    r.next_trigger = compute_next_trigger(times_list, r.frequency, r.duration_days)


def advance_after_dose(reminder: Reminder) -> None:
    """Move next_trigger to the next scheduled slot after a dose is logged."""
    sch = reminder.schedule if isinstance(reminder.schedule, dict) else {}
    times_list = sch.get("times")
    if isinstance(times_list, str):
        times_list = [times_list]
    if not isinstance(times_list, list) or not times_list:
        times_list = ["09:00"]

    now = datetime.utcnow()
    normalized = _normalize_times(times_list)
    candidates: list[datetime] = []
    for hhmm in normalized:
        hour, minute = _parse_hhmm(hhmm) or (9, 0)
        for day_offset in (0, 1, 2):
            candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0) + timedelta(
                days=day_offset
            )
            if candidate > now:
                candidates.append(candidate)
    reminder.next_trigger = min(candidates) if candidates else compute_next_trigger(
        times_list, reminder.frequency, reminder.duration_days
    )
