import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, Source, Review, Template, StatsGeneral, SourceStat } from "@/api/client";

type Tab = "sources" | "reviews" | "sentiment" | "responses" | "stats" | "settings";

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "sources", label: "Источники", icon: "Globe" },
  { id: "reviews", label: "Отзывы", icon: "MessageSquare" },
  { id: "sentiment", label: "Анализ настроения", icon: "BarChart2" },
  { id: "responses", label: "Ответы", icon: "Reply" },
  { id: "stats", label: "Статистика", icon: "TrendingUp" },
  { id: "settings", label: "Настройки", icon: "Settings" },
];

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "никогда";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн назад`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const map: Record<string, { label: string; className: string }> = {
    positive: { label: "Позитивный", className: "bg-green-50 text-green-700 border-green-200" },
    negative: { label: "Негативный", className: "bg-red-50 text-red-700 border-red-200" },
    neutral: { label: "Нейтральный", className: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  const { label, className } = map[sentiment] || map.neutral;
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${className}`}>{label}</span>;
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />;
}

function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.sources.list();
    setSources(data.sources);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSource = async (src: Source) => {
    setSources(s => s.map(x => x.id === src.id ? { ...x, active: !x.active } : x));
    await api.sources.update({ id: src.id, active: !src.active });
  };

  const addSource = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setSaving(true);
    await api.sources.create({ name: newName.trim(), url: newUrl.trim() });
    setNewName(""); setNewUrl("");
    await load();
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Источники отзывов</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Загрузка..." : `${sources.filter(s => s.active).length} активных из ${sources.length}`}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Название (например: Авито)" value={newName} onChange={e => setNewName(e.target.value)} className="max-w-[180px]" />
        <Input placeholder="URL источника" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="max-w-sm" />
        <Button size="sm" onClick={addSource} disabled={saving} className="gap-2">
          {saving ? <Spinner /> : <Icon name="Plus" size={14} />}
          Добавить
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid gap-3">
          {sources.map(src => (
            <Card key={src.id} className="p-4 flex items-center justify-between hover:border-foreground/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full shrink-0 ${src.active ? "bg-positive" : "bg-muted-foreground"}`} />
                <div>
                  <p className="font-medium text-sm">{src.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{src.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="font-semibold">{src.total_reviews}</p>
                  <p className="text-xs text-muted-foreground">отзывов</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(src.last_sync_at)}</p>
                  <p className="text-xs text-muted-foreground">синхронизация</p>
                </div>
                {src.unanswered > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                    {src.unanswered} без ответа
                  </span>
                )}
                <button
                  onClick={() => toggleSource(src)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${src.active ? "bg-foreground" : "bg-border"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${src.active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsPage() {
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "neutral" | "unanswered">("all");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filter === "unanswered") params.answered = "false";
    else if (filter !== "all") params.sentiment = filter;
    const data = await api.reviews.list(params);
    setReviews(data.reviews);
    setTotal(data.total);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filters = [
    { id: "all" as const, label: "Все" },
    { id: "positive" as const, label: "Позитивные" },
    { id: "neutral" as const, label: "Нейтральные" },
    { id: "negative" as const, label: "Негативные" },
    { id: "unanswered" as const, label: "Без ответа" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold">Отзывы</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{loading ? "Загрузка..." : `${total} отзывов`}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === f.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <Card key={r.id} className="p-4 space-y-3 hover:border-foreground/20 transition-colors animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
                    {r.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.author}</p>
                    <p className="text-xs text-muted-foreground">{r.source_name} · {formatDate(r.review_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <RatingStars rating={r.rating} />
                  <SentimentBadge sentiment={r.sentiment} />
                  {r.answered && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Отвечено</span>}
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{r.text}</p>
              {r.answered && r.answer_text && (
                <div className="pl-3 border-l-2 border-muted">
                  <p className="text-xs text-muted-foreground mb-1">Ответ:</p>
                  <p className="text-sm text-foreground/70">{r.answer_text}</p>
                </div>
              )}
              {!r.answered && answering !== r.id && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setAnswering(r.id)}>
                    <Icon name="Reply" size={12} />
                    Ответить
                  </Button>
                </div>
              )}
              {answering === r.id && (
                <AnswerForm
                  review={r}
                  onSent={async (text) => {
                    await api.reviews.answer({ id: r.id, answer_text: text });
                    setAnswering(null);
                    await load();
                  }}
                  onCancel={() => setAnswering(null)}
                />
              )}
            </Card>
          ))}
          {reviews.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Нет отзывов по выбранному фильтру</div>
          )}
        </div>
      )}
    </div>
  );
}

function AnswerForm({ review, onSent, onCancel }: { review: Review; onSent: (text: string) => Promise<void>; onCancel: () => void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    api.templates.list().then(d => setTemplates(d.templates));
  }, []);

  const applyTemplate = (t: Template) => {
    setText(t.text.replace("{author}", review.author.split(" ")[0]));
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    await onSent(text.trim());
    setSending(false);
  };

  return (
    <div className="space-y-3 pt-1 border-t">
      {templates.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-foreground/30 transition-all text-muted-foreground"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      <Textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Текст ответа..." className="text-sm resize-none" />
      <div className="flex gap-2">
        <Button size="sm" onClick={send} disabled={sending || !text.trim()} className="gap-1.5">
          {sending ? <Spinner /> : <Icon name="Send" size={12} />}
          Отправить
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Отмена</Button>
      </div>
    </div>
  );
}

function SentimentPage() {
  const [stats, setStats] = useState<{ general: StatsGeneral } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stats.get().then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  const g = stats!.general;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold">Анализ настроения</h2>
        <p className="text-sm text-muted-foreground mt-0.5">На основе {g.total} отзывов из базы</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Позитивных", value: `${g.positive_pct}%`, count: g.positive_count, icon: "Smile", color: "text-positive" },
          { label: "Нейтральных", value: `${g.neutral_pct}%`, count: g.neutral_count, icon: "Meh", color: "text-neutral" },
          { label: "Негативных", value: `${g.negative_pct}%`, count: g.negative_count, icon: "Frown", color: "text-negative" },
        ].map(item => (
          <Card key={item.label} className="p-5 space-y-3">
            <Icon name={item.icon as "Smile"} size={24} className={item.color} />
            <div>
              <p className="text-3xl font-semibold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label} · {item.count} отз.</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold">Распределение тональности</h3>
        <div className="space-y-4">
          {[
            { label: "Позитивные", value: g.positive_pct, color: "bg-positive" },
            { label: "Нейтральные", value: g.neutral_pct, color: "bg-neutral" },
            { label: "Негативные", value: g.negative_pct, color: "bg-negative" },
          ].map(item => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono font-medium">{item.value}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="text-sm font-semibold">Охват ответов</h3>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-semibold font-mono">{g.answer_rate}%</p>
          <p className="text-sm text-muted-foreground pb-1">отзывов получили ответ ({g.answered} из {g.total})</p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-foreground rounded-full transition-all duration-700" style={{ width: `${g.answer_rate}%` }} />
        </div>
      </Card>
    </div>
  );
}

function ResponsesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [editText, setEditText] = useState("");
  const [sending, setSending] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplTone, setNewTplTone] = useState<"positive" | "negative" | "neutral">("positive");
  const [newTplText, setNewTplText] = useState("");
  const [savingTpl, setSavingTpl] = useState(false);

  useEffect(() => {
    Promise.all([api.templates.list(), api.reviews.list({ answered: "false", limit: "20" })]).then(([td, rd]) => {
      setTemplates(td.templates);
      setReviews(rd.reviews);
      const firstReview = rd.reviews[0] || null;
      setActiveReview(firstReview);
      const firstTpl = td.templates[0] || null;
      setSelected(firstTpl);
      if (firstTpl && firstReview) {
        setEditText(firstTpl.text.replace("{author}", firstReview.author.split(" ")[0]));
      }
      setLoading(false);
    });
  }, []);

  const handleSelectTemplate = (t: Template) => {
    setSelected(t);
    if (activeReview) setEditText(t.text.replace("{author}", activeReview.author.split(" ")[0]));
  };

  const handleSelectReview = (r: Review) => {
    setActiveReview(r);
    if (selected) setEditText(selected.text.replace("{author}", r.author.split(" ")[0]));
  };

  const sendAnswer = async () => {
    if (!activeReview || !editText.trim()) return;
    setSending(true);
    await api.reviews.answer({ id: activeReview.id, answer_text: editText.trim() });
    const updated = reviews.filter(r => r.id !== activeReview.id);
    setReviews(updated);
    const next = updated[0] || null;
    setActiveReview(next);
    if (next && selected) setEditText(selected.text.replace("{author}", next.author.split(" ")[0]));
    setSending(false);
  };

  const saveNewTemplate = async () => {
    if (!newTplName.trim() || !newTplText.trim()) return;
    setSavingTpl(true);
    await api.templates.create({ name: newTplName.trim(), tone: newTplTone, text: newTplText.trim() });
    const data = await api.templates.list();
    setTemplates(data.templates);
    setNewTplName(""); setNewTplText("");
    setSavingTpl(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold">Шаблоны и ответы</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{reviews.length} отзывов ждут ответа</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Выбрать отзыв</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">Все отзывы отвечены!</p>}
            {reviews.map(r => (
              <button
                key={r.id}
                onClick={() => handleSelectReview(r)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${activeReview?.id === r.id ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/30"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{r.author}</span>
                  <span className="text-xs text-muted-foreground">{r.source_name}</span>
                  <SentimentBadge sentiment={r.sentiment} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{r.text}</p>
              </button>
            ))}
          </div>

          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Шаблоны</h3>
          <div className="space-y-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${selected?.id === t.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30"}`}
              >
                <p className="font-medium">{t.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Редактирование ответа</h3>
          {activeReview ? (
            <>
              <Card className="p-3 space-y-1 border-dashed">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activeReview.author}</span>
                  <RatingStars rating={activeReview.rating} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{activeReview.text}</p>
              </Card>
              <Textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={6}
                className="resize-none text-sm leading-relaxed"
                placeholder="Текст ответа..."
              />
              <div className="flex gap-2">
                <Button className="gap-2 flex-1" onClick={sendAnswer} disabled={sending || !editText.trim()}>
                  {sending ? <Spinner /> : <Icon name="Send" size={14} />}
                  Отправить ответ
                </Button>
                {selected && (
                  <Button variant="outline" onClick={() => handleSelectTemplate(selected)} title="Сбросить шаблон">
                    <Icon name="RefreshCw" size={14} />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">Все отзывы уже получили ответ!</div>
          )}

          <div className="border-t pt-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Новый шаблон</h3>
            <Input placeholder="Название шаблона" value={newTplName} onChange={e => setNewTplName(e.target.value)} />
            <div className="flex gap-2">
              {(["positive", "negative", "neutral"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setNewTplTone(t)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${newTplTone === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}
                >
                  {{ positive: "Позитивный", negative: "Негативный", neutral: "Нейтральный" }[t]}
                </button>
              ))}
            </div>
            <Textarea placeholder="Текст шаблона. Используйте {author} для имени." value={newTplText} onChange={e => setNewTplText(e.target.value)} rows={3} className="resize-none text-sm" />
            <Button variant="outline" size="sm" onClick={saveNewTemplate} disabled={savingTpl} className="gap-2">
              {savingTpl ? <Spinner /> : <Icon name="Plus" size={12} />}
              Сохранить шаблон
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsPage() {
  const [data, setData] = useState<{ general: StatsGeneral; by_source: SourceStat[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stats.get().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  const { general: g, by_source } = data!;
  const maxReviews = Math.max(...by_source.map(s => s.reviews_count), 1);

  const statCards = [
    { label: "Всего отзывов", value: String(g.total), delta: `${g.answer_rate}% охват`, up: true },
    { label: "Отвечено", value: String(g.answered), delta: "ответов отправлено", up: true },
    { label: "Средний рейтинг", value: g.avg_rating ? String(g.avg_rating) : "—", delta: "по всем платформам", up: true },
    { label: "Без ответа", value: String(g.unanswered), delta: "требуют внимания", up: g.unanswered === 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold">Статистика</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Данные из базы в реальном времени</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="p-5 space-y-2">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-semibold font-mono">{s.value}</p>
            <p className={`text-xs flex items-center gap-1 ${s.up ? "text-positive" : "text-negative"}`}>
              <Icon name={s.up ? "TrendingUp" : "TrendingDown"} size={10} />
              {s.delta}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold">Активность по источникам</h3>
        <div className="space-y-3">
          {by_source.map(s => (
            <div key={s.id} className="flex items-center gap-4">
              <p className="text-sm w-32 shrink-0 truncate">{s.name}</p>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((s.reviews_count / maxReviews) * 100)}%` }}
                />
              </div>
              <p className="text-sm font-mono w-8 text-right">{s.reviews_count}</p>
              {s.avg_rating && (
                <p className="text-xs text-muted-foreground w-10 font-mono">★{s.avg_rating}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold">Тональность</h3>
          <div className="space-y-3">
            {[
              { label: "Позитивных", value: g.positive_pct, color: "bg-positive" },
              { label: "Нейтральных", value: g.neutral_pct, color: "bg-neutral" },
              { label: "Негативных", value: g.negative_pct, color: "bg-negative" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-24 shrink-0">{item.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                </div>
                <span className="font-mono text-xs w-8 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold">Рейтинг по платформам</h3>
          <div className="space-y-3">
            {by_source.filter(s => s.avg_rating).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate">{p.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <RatingStars rating={p.avg_rating ? Math.round(p.avg_rating) : null} />
                  <span className="font-mono font-medium">{p.avg_rating}</span>
                </div>
              </div>
            ))}
            {by_source.filter(s => s.avg_rating).length === 0 && (
              <p className="text-sm text-muted-foreground">Недостаточно данных</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [syncInterval, setSyncInterval] = useState("15");
  const [autoReply, setAutoReply] = useState(false);
  const [notifyNegative, setNotifyNegative] = useState(true);
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h2 className="text-xl font-semibold">Настройки</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Параметры сбора и обработки отзывов</p>
      </div>

      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-semibold">Синхронизация</h3>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Интервал обновления (минуты)</label>
          <div className="flex gap-2">
            {["5", "15", "30", "60"].map(v => (
              <button
                key={v}
                onClick={() => setSyncInterval(v)}
                className={`px-4 py-2 rounded-lg border text-sm font-mono transition-all ${syncInterval === v ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/30"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-semibold">Автоответы</h3>
        <div className="space-y-4">
          {[
            { label: "Автоматические ответы", desc: "Отвечать на позитивные отзывы автоматически", value: autoReply, set: setAutoReply },
            { label: "Уведомления о негативных", desc: "Сразу сообщать о новых негативных отзывах", value: notifyNegative, set: setNotifyNegative },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => item.set(!item.value)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${item.value ? "bg-foreground" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.value ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold">Уведомления</h3>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Email для уведомлений</label>
          <div className="flex gap-2">
            <Input placeholder="email@company.ru" value={email} onChange={e => setEmail(e.target.value)} className="flex-1" />
            <Button variant="outline">Сохранить</Button>
          </div>
        </div>
      </Card>

      <Button className="w-full">Сохранить все настройки</Button>
    </div>
  );
}

export default function Index() {
  const [tab, setTab] = useState<Tab>("sources");
  const [unanswered, setUnanswered] = useState(0);

  useEffect(() => {
    api.reviews.list({ answered: "false", limit: "1" }).then(d => setUnanswered(d.total)).catch(() => {});
  }, [tab]);

  const renderPage = () => {
    switch (tab) {
      case "sources": return <SourcesPage />;
      case "reviews": return <ReviewsPage />;
      case "sentiment": return <SentimentPage />;
      case "responses": return <ResponsesPage />;
      case "stats": return <StatsPage />;
      case "settings": return <SettingsPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r bg-white shrink-0 flex flex-col fixed h-full">
        <div className="p-5 border-b">
          <h1 className="font-semibold text-base tracking-tight">ReviewFlow</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Управление отзывами</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${tab === item.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Icon name={item.icon as "Globe"} size={15} />
              <span>{item.label}</span>
              {item.id === "reviews" && unanswered > 0 && (
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium ${tab === item.id ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>
                  {unanswered}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-positive animate-pulse" />
            <p className="text-xs text-muted-foreground">Подключено к БД</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto ml-56">
        <div className="max-w-4xl mx-auto p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
