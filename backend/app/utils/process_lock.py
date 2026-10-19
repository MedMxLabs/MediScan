"""File locks so one-time work runs once per container, not once per gunicorn worker."""
from __future__ import annotations

import os
import tempfile
from contextlib import contextmanager

try:
    import fcntl
except ImportError:  # Windows dev server is single-process
    fcntl = None

_held: list = []


def _path(name: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"medscan-{name}.lock")


@contextmanager
def exclusive(name: str):
    """Block until this process holds the lock, release on exit."""
    if fcntl is None:
        yield
        return
    with open(_path(name), "w") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(fh, fcntl.LOCK_UN)


def hold_for_process_lifetime(name: str) -> bool:
    """Non-blocking; True if acquired. Released when the process exits."""
    if fcntl is None:
        return True
    fh = open(_path(name), "w")
    try:
        fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        fh.close()
        return False
    _held.append(fh)
    return True
