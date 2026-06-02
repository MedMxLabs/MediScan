"""Delete uploaded prescription / lab report files from disk."""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)


def safe_remove_file(path: str | None) -> bool:
    if not path:
        return False
    try:
        abspath = os.path.abspath(path)
        if os.path.isfile(abspath):
            os.remove(abspath)
            return True
    except OSError as exc:
        logger.warning("Could not delete upload %s: %s", path, exc)
    return False
