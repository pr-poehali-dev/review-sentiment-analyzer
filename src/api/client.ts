const URLS = {
  sources: "https://functions.poehali.dev/fcbbb2ae-b7c5-4468-9d89-740469cc6375",
  reviews: "https://functions.poehali.dev/0454e843-58e8-45a8-9830-cd269d831645",
  templates: "https://functions.poehali.dev/365d408b-97ba-4015-8a13-40cd96e74b82",
  stats: "https://functions.poehali.dev/a96d1346-c4da-4a50-bd54-d5529b786326",
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return typeof data === "string" ? JSON.parse(data) : data;
}

export const api = {
  sources: {
    list: () => request<{ sources: Source[] }>(URLS.sources),
    create: (body: { name: string; url: string; platform?: string }) =>
      request<{ id: number; ok: boolean }>(URLS.sources, { method: "POST", body: JSON.stringify(body) }),
    update: (body: { id: number; [key: string]: unknown }) =>
      request<{ ok: boolean }>(URLS.sources, { method: "PUT", body: JSON.stringify(body) }),
  },
  reviews: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{ reviews: Review[]; total: number }>(URLS.reviews + qs);
    },
    add: (body: { source_id: number; text: string; author?: string; rating?: number; external_id?: string }) =>
      request<{ id: number; sentiment: string; score: number; ok: boolean }>(URLS.reviews, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    answer: (body: { id: number; answer_text: string }) =>
      request<{ ok: boolean }>(URLS.reviews, { method: "PUT", body: JSON.stringify(body) }),
  },
  templates: {
    list: () => request<{ templates: Template[] }>(URLS.templates),
    create: (body: { name: string; tone: string; text: string }) =>
      request<{ id: number; ok: boolean }>(URLS.templates, { method: "POST", body: JSON.stringify(body) }),
    update: (body: { id: number; name?: string; tone?: string; text?: string }) =>
      request<{ ok: boolean }>(URLS.templates, { method: "PUT", body: JSON.stringify(body) }),
  },
  stats: {
    get: () => request<{ general: StatsGeneral; by_source: SourceStat[] }>(URLS.stats),
  },
};

export interface Source {
  id: number;
  name: string;
  url: string;
  platform: string;
  active: boolean;
  sync_interval_minutes: number;
  last_sync_at: string | null;
  reviews_count: number;
  total_reviews: number;
  unanswered: number;
  created_at: string;
}

export interface Review {
  id: number;
  source_id: number;
  source_name: string;
  platform: string;
  external_id: string | null;
  author: string;
  rating: number | null;
  text: string;
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number | null;
  answered: boolean;
  answer_text: string | null;
  answered_at: string | null;
  review_date: string;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  tone: "positive" | "negative" | "neutral";
  text: string;
  is_default: boolean;
  created_at: string;
}

export interface StatsGeneral {
  total: number;
  answered: number;
  unanswered: number;
  avg_rating: number | null;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  answer_rate: number;
}

export interface SourceStat {
  id: number;
  name: string;
  platform: string;
  reviews_count: number;
  avg_rating: number | null;
  last_sync_at: string | null;
}
