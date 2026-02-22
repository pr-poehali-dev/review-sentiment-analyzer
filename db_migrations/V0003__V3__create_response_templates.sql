CREATE TABLE t_p95354559_review_sentiment_ana.response_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tone VARCHAR(20) NOT NULL,
    text TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);