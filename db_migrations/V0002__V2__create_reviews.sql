CREATE TABLE t_p95354559_review_sentiment_ana.reviews (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES t_p95354559_review_sentiment_ana.sources(id),
    external_id VARCHAR(500),
    author VARCHAR(255) NOT NULL DEFAULT 'Аноним',
    rating INTEGER,
    text TEXT NOT NULL,
    sentiment VARCHAR(20) NOT NULL DEFAULT 'neutral',
    sentiment_score FLOAT,
    answered BOOLEAN NOT NULL DEFAULT FALSE,
    answer_text TEXT,
    answered_at TIMESTAMPTZ,
    review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);