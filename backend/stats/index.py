import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p95354559_review_sentiment_ana")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Статистика по отзывам: общие метрики, разбивка по источникам и настроению."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute(f"""
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN answered = true THEN 1 END) as answered,
                COUNT(CASE WHEN answered = false THEN 1 END) as unanswered,
                ROUND(AVG(rating)::numeric, 1) as avg_rating,
                COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_count,
                COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_count,
                COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral_count
            FROM {SCHEMA}.reviews
        """)
        general = dict(cur.fetchone())

        total = general["total"] or 1
        general["positive_pct"] = round(general["positive_count"] / total * 100)
        general["negative_pct"] = round(general["negative_count"] / total * 100)
        general["neutral_pct"] = round(general["neutral_count"] / total * 100)
        general["answer_rate"] = round(general["answered"] / total * 100)

        cur.execute(f"""
            SELECT
                s.id, s.name, s.platform,
                COUNT(r.id) as reviews_count,
                ROUND(AVG(r.rating)::numeric, 1) as avg_rating,
                s.last_sync_at
            FROM {SCHEMA}.sources s
            LEFT JOIN {SCHEMA}.reviews r ON r.source_id = s.id
            GROUP BY s.id, s.name, s.platform, s.last_sync_at
            ORDER BY reviews_count DESC
        """)
        by_source = []
        for row in cur.fetchall():
            d = dict(row)
            d["last_sync_at"] = d["last_sync_at"].isoformat() if d["last_sync_at"] else None
            d["reviews_count"] = int(d["reviews_count"]) if d["reviews_count"] is not None else 0
            d["avg_rating"] = float(d["avg_rating"]) if d["avg_rating"] is not None else None
            by_source.append(d)

        for k in ["total", "answered", "unanswered", "positive_count", "negative_count", "neutral_count",
                   "positive_pct", "negative_pct", "neutral_pct", "answer_rate"]:
            general[k] = int(general[k]) if general[k] is not None else 0
        if general["avg_rating"] is not None:
            general["avg_rating"] = float(general["avg_rating"])

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "general": general,
                "by_source": by_source,
            })
        }

    finally:
        cur.close()
        conn.close()