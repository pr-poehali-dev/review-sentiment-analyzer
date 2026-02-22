import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p95354559_review_sentiment_ana")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def analyze_sentiment(text: str, rating: int) -> tuple:
    """Простой анализ тональности по ключевым словам и рейтингу."""
    positive_words = ["отлично", "хорошо", "супер", "замечательно", "прекрасно", "вежлив", "быстро", "лучший", "рад", "доволен", "спасибо", "рекомендую"]
    negative_words = ["плохо", "ужасно", "разочарован", "грубый", "долго", "некачественно", "не рекомендую", "возмущён", "жалею", "кошмар"]

    text_lower = text.lower()
    pos_count = sum(1 for w in positive_words if w in text_lower)
    neg_count = sum(1 for w in negative_words if w in text_lower)

    if rating and rating >= 4:
        pos_count += 2
    elif rating and rating <= 2:
        neg_count += 2

    if pos_count > neg_count:
        score = min(0.95, 0.3 + pos_count * 0.15)
        return "positive", round(score, 2)
    elif neg_count > pos_count:
        score = max(-0.95, -0.3 - neg_count * 0.15)
        return "negative", round(score, 2)
    else:
        return "neutral", round((pos_count - neg_count) * 0.1, 2)


def handler(event: dict, context) -> dict:
    """CRUD для отзывов: GET список с фильтрами, POST добавить, PUT ответить."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == "GET":
            filters = []
            values = []

            if params.get("source_id"):
                filters.append("r.source_id = %s")
                values.append(int(params["source_id"]))
            if params.get("sentiment"):
                filters.append("r.sentiment = %s")
                values.append(params["sentiment"])
            if params.get("answered") is not None:
                answered = params["answered"].lower() == "true"
                filters.append("r.answered = %s")
                values.append(answered)

            where = ("WHERE " + " AND ".join(filters)) if filters else ""
            limit = int(params.get("limit", 50))
            offset = int(params.get("offset", 0))

            cur.execute(f"""
                SELECT r.*, s.name as source_name, s.platform
                FROM {SCHEMA}.reviews r
                JOIN {SCHEMA}.sources s ON s.id = r.source_id
                {where}
                ORDER BY r.review_date DESC
                LIMIT %s OFFSET %s
            """, values + [limit, offset])
            rows = cur.fetchall()

            cur.execute(f"SELECT COUNT(*) as total FROM {SCHEMA}.reviews r {where}", values)
            total = cur.fetchone()["total"]

            reviews = []
            for row in rows:
                d = dict(row)
                d["review_date"] = d["review_date"].isoformat() if d["review_date"] else None
                d["created_at"] = d["created_at"].isoformat() if d["created_at"] else None
                d["answered_at"] = d["answered_at"].isoformat() if d["answered_at"] else None
                reviews.append(d)

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"reviews": reviews, "total": total})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            source_id = body.get("source_id")
            text = body.get("text", "").strip()
            author = body.get("author", "Аноним")
            rating = body.get("rating")
            external_id = body.get("external_id")

            if not source_id or not text:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "source_id и text обязательны"})}

            sentiment, score = analyze_sentiment(text, rating)

            cur.execute(f"""
                INSERT INTO {SCHEMA}.reviews (source_id, external_id, author, rating, text, sentiment, sentiment_score)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (source_id, external_id) DO NOTHING
                RETURNING id
            """, (source_id, external_id, author, rating, text, sentiment, score))

            row = cur.fetchone()
            if row:
                new_id = row["id"]
                cur.execute(f"""
                    UPDATE {SCHEMA}.sources
                    SET reviews_count = (SELECT COUNT(*) FROM {SCHEMA}.reviews WHERE source_id = %s),
                        last_sync_at = NOW()
                    WHERE id = %s
                """, (source_id, source_id))
                conn.commit()
                return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": new_id, "sentiment": sentiment, "score": score, "ok": True})}
            else:
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "duplicate": True})}

        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            review_id = body.get("id")
            answer_text = body.get("answer_text", "").strip()

            if not review_id or not answer_text:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id и answer_text обязательны"})}

            cur.execute(f"""
                UPDATE {SCHEMA}.reviews
                SET answered = true, answer_text = %s, answered_at = NOW()
                WHERE id = %s
            """, (answer_text, review_id))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    finally:
        cur.close()
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
