import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p95354559_review_sentiment_ana")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """CRUD для источников отзывов: GET список, POST создать, PUT обновить, DELETE удалить."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == "GET":
            cur.execute(f"""
                SELECT s.*, 
                    COUNT(r.id) as total_reviews,
                    COUNT(CASE WHEN r.answered = false THEN 1 END) as unanswered
                FROM {SCHEMA}.sources s
                LEFT JOIN {SCHEMA}.reviews r ON r.source_id = s.id
                GROUP BY s.id
                ORDER BY s.created_at ASC
            """)
            rows = cur.fetchall()
            sources = []
            for row in rows:
                d = dict(row)
                d["last_sync_at"] = d["last_sync_at"].isoformat() if d["last_sync_at"] else None
                d["created_at"] = d["created_at"].isoformat() if d["created_at"] else None
                sources.append(d)
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"sources": sources})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            name = body.get("name", "").strip()
            url = body.get("url", "").strip()
            platform = body.get("platform", "custom")
            if not name or not url:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "name и url обязательны"})}
            cur.execute(
                f"INSERT INTO {SCHEMA}.sources (name, url, platform) VALUES (%s, %s, %s) RETURNING id",
                (name, url, platform)
            )
            new_id = cur.fetchone()["id"]
            conn.commit()
            return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": new_id, "ok": True})}

        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            source_id = body.get("id")
            if not source_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id обязателен"})}
            fields = []
            values = []
            for key in ["name", "url", "platform", "active", "sync_interval_minutes"]:
                if key in body:
                    fields.append(f"{key} = %s")
                    values.append(body[key])
            if not fields:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "нет полей для обновления"})}
            values.append(source_id)
            cur.execute(
                f"UPDATE {SCHEMA}.sources SET {', '.join(fields)} WHERE id = %s",
                values
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    finally:
        cur.close()
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
