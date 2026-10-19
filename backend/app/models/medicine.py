from datetime import datetime

from app.extensions import db


class MedicineCatalog(db.Model):
    __tablename__ = "medicine_catalog"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(512), nullable=False, index=True)
    generic_name = db.Column(db.String(512), nullable=True)
    composition = db.Column(db.String(1024), nullable=True)
    strength = db.Column(db.String(128), nullable=True)
    form = db.Column(db.String(64), nullable=True)
    manufacturer = db.Column(db.String(255), nullable=True)


class SearchCache(db.Model):
    """Daily bucket cache for medicine search payloads (PRD §8.2)."""

    __tablename__ = "search_cache"
    __table_args__ = (db.Index("ix_search_cache_query_bucket", "normalized_query", "date_bucket"),)

    id = db.Column(db.Integer, primary_key=True)
    normalized_query = db.Column(db.String(512), nullable=False, index=True)
    date_bucket = db.Column(db.String(10), nullable=False, index=True)  # YYYY-MM-DD
    payload_json = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class ScrapeJob(db.Model):
    """Background live-scrape job; results land in SearchCache so any worker can serve them."""

    __tablename__ = "scrape_jobs"

    id = db.Column(db.String(36), primary_key=True)
    normalized_query = db.Column(db.String(512), nullable=False, index=True)
    date_bucket = db.Column(db.String(10), nullable=False)
    state = db.Column(db.String(16), nullable=False, default="pending")  # pending|running|done|failed
    error = db.Column(db.String(512), nullable=True)
    scrape_errors = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

