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


def handler(event: dict, context) -> dict:
    """CRUD для шаблонов ответов: GET список, POST создать, PUT обновить."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == "GET":
            cur.execute(f"SELECT * FROM {SCHEMA}.response_templates ORDER BY tone, created_at")
            rows = [dict(r) for r in cur.fetchall()]
            for r in rows:
                r["created_at"] = r["created_at"].isoformat()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"templates": rows})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            name = body.get("name", "").strip()
            tone = body.get("tone", "neutral")
            text = body.get("text", "").strip()
            if not name or not text:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "name и text обязательны"})}
            cur.execute(
                f"INSERT INTO {SCHEMA}.response_templates (name, tone, text) VALUES (%s, %s, %s) RETURNING id",
                (name, tone, text)
            )
            new_id = cur.fetchone()["id"]
            conn.commit()
            return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": new_id, "ok": True})}

        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            tmpl_id = body.get("id")
            if not tmpl_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id обязателен"})}
            fields, values = [], []
            for key in ["name", "tone", "text"]:
                if key in body:
                    fields.append(f"{key} = %s")
                    values.append(body[key])
            if not fields:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "нет полей для обновления"})}
            values.append(tmpl_id)
            cur.execute(f"UPDATE {SCHEMA}.response_templates SET {', '.join(fields)} WHERE id = %s", values)
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    finally:
        cur.close()
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
