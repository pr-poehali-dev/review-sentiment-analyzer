CREATE TABLE t_p95354559_review_sentiment_ana.sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    platform VARCHAR(100) NOT NULL DEFAULT 'custom',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sync_interval_minutes INTEGER NOT NULL DEFAULT 15,
    last_sync_at TIMESTAMPTZ,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);