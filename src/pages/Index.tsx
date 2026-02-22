import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Tab = "sources" | "reviews" | "sentiment" | "responses" | "stats" | "settings";

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "sources", label: "Источники", icon: "Globe" },
  { id: "reviews", label: "Отзывы", icon: "MessageSquare" },
  { id: "sentiment", label: "Анализ настроения", icon: "BarChart2" },
  { id: "responses", label: "Ответы", icon: "Reply" },
  { id: "stats", label: "Статистика", icon: "TrendingUp" },
  { id: "settings", label: "Настройки", icon: "Settings" },
];

const SOURCES = [
  { id: 1, name: "Яндекс Карты", url: "yandex.ru/maps", active: true, reviews: 148, lastSync: "2 мин назад" },
  { id: 2, name: "2ГИС", url: "2gis.ru", active: true, reviews: 89, lastSync: "15 мин назад" },
  { id: 3, name: "Google Maps", url: "google.com/maps", active: false, reviews: 212, lastSync: "1 час назад" },
  { id: 4, name: "Отзовик", url: "otzovik.com", active: true, reviews: 34, lastSync: "3 мин назад" },
  { id: 5, name: "Zoon", url: "zoon.ru", active: false, reviews: 57, lastSync: "2 часа назад" },
];

const REVIEWS = [
  { id: 1, source: "Яндекс Карты", author: "Алексей М.", date: "22 фев", rating: 5, text: "Отличный сервис! Всё быстро и качественно, сотрудники вежливые. Обязательно вернусь снова.", sentiment: "positive", answered: false },
  { id: 2, source: "2ГИС", author: "Марина К.", date: "21 фев", rating: 2, text: "Ждал заказ дольше обещанного. Качество не соответствует цене. Разочарован.", sentiment: "negative", answered: true },
  { id: 3, source: "Отзовик", author: "Дмитрий Р.", date: "20 фев", rating: 4, text: "В целом неплохо, но есть куда расти. Доставка могла бы быть быстрее.", sentiment: "neutral", answered: false },
  { id: 4, source: "Яндекс Карты", author: "Светлана П.", date: "19 фев", rating: 5, text: "Пользуюсь давно, никогда не подводили. Лучший выбор в своём сегменте.", sentiment: "positive", answered: false },
  { id: 5, source: "Google Maps", author: "Иван Т.", date: "18 фев", rating: 1, text: "Ужасное обслуживание, не рекомендую. Грубый персонал.", sentiment: "negative", answered: false },
  { id: 6, source: "2ГИС", author: "Ольга Н.", date: "17 фев", rating: 3, text: "Среднее качество по средней цене. Ничего особенного.", sentiment: "neutral", answered: true },
];

const TEMPLATES = [
  { id: 1, name: "Благодарность (позитивный)", tone: "positive", text: "Здравствуйте, {author}! Большое спасибо за тёплый отзыв — это очень ценно для нас. Рады, что смогли оправдать ваши ожидания, и будем рады видеть вас снова!" },
  { id: 2, name: "Извинение (негативный)", tone: "negative", text: "Здравствуйте, {author}! Нам жаль, что ваш опыт оказался неудачным. Мы приносим искренние извинения и обязательно разберёмся в ситуации. Свяжитесь с нами напрямую — сделаем всё, чтобы исправить положение." },
  { id: 3, name: "Нейтральный ответ", tone: "neutral", text: "Здравствуйте, {author}! Спасибо, что поделились мнением. Мы внимательно изучим ваш отзыв и постараемся улучшить качество наших услуг. Будем рады снова видеть вас!" },
  { id: 4, name: "Приглашение к диалогу", tone: "neutral", text: "Здравствуйте, {author}! Благодарим за отзыв. Для нас важно ваше мнение — свяжитесь с нами удобным способом, чтобы мы могли подробнее обсудить вашу ситуацию." },
];

const SENTIMENT_DATA = [
  { label: "Позитивные", value: 62, color: "bg-positive" },
  { label: "Нейтральные", value: 23, color: "bg-neutral" },
  { label: "Негативные", value: 15, color: "bg-negative" },
];

const STATS = [
  { label: "Всего отзывов", value: "540", delta: "+34 за неделю", up: true },
  { label: "Отвечено", value: "487", delta: "90% охват", up: true },
  { label: "Средний рейтинг", value: "4.2", delta: "+0.3 за месяц", up: true },
  { label: "Без ответа", value: "53", delta: "-12 за неделю", up: false },
];

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const map: Record<string, { label: string; className: string }> = {
    positive: { label: "Позитивный", className: "bg-green-50 text-green-700 border-green-200" },
    negative: { label: "Негативный", className: "bg-red-50 text-red-700 border-red-200" },
    neutral: { label: "Нейтральный", className: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  const { label, className } = map[sentiment] || map.neutral;
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${className}`}>{label}</span>;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

function SourcesPage() {
  const [sources, setSources] = useState(SOURCES);
  const [newUrl, setNewUrl] = useState("");

  const toggleSource = (id: number) => {
    setSources(s => s.map(src => src.id === id ? { ...src, active: !src.active } : src));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Источники отзывов</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{sources.filter(s => s.active).length} активных из {sources.length}</p>
        </div>
        <Button size="sm" className="gap-2">
          <Icon name="Plus" size={14} />
          Добавить
        </Button>
      </div>

      <div className="flex gap-2">
        <Input placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)} className="max-w-sm" />
        <Button variant="outline" size="sm" onClick={() => setNewUrl("")}>Подключить</Button>
      </div>

      <div className="grid gap-3">
        {sources.map(src => (
          <Card key={src.id} className="p-4 flex items-center justify-between hover:border-foreground/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${src.active ? "bg-positive" : "bg-muted-foreground"}`} />
              <div>
                <p className="font-medium text-sm">{src.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{src.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-right">
                <p className="font-semibold">{src.reviews}</p>
                <p className="text-xs text-muted-foreground">отзывов</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">{src.lastSync}</p>
                <p className="text-xs text-muted-foreground">синхронизация</p>
              </div>
              <button
                onClick={() => toggleSource(src.id)}
                className={`w-10 h-5 rounded-full transition-colors relative ${src.active ? "bg-foreground" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${src.active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReviewsPage() {
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "neutral" | "unanswered">("all");

  const filtered = REVIEWS.filter(r => {
    if (filter === "unanswered") return !r.answered;
    if (filter === "all") return true;
    return r.sentiment === filter;
  });

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
        <p className="text-sm text-muted-foreground mt-0.5">{REVIEWS.length} последних отзывов</p>
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

      <div className="space-y-3">
        {filtered.map(r => (
          <Card key={r.id} className="p-4 space-y-3 hover:border-foreground/20 transition-colors animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                  {r.author[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{r.author}</p>
                  <p className="text-xs text-muted-foreground">{r.source} · {r.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <RatingStars rating={r.rating} />
                <SentimentBadge sentiment={r.sentiment} />
                {r.answered && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Отвечено</span>}
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{r.text}</p>
            {!r.answered && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Icon name="Wand2" size={12} />
                  Сгенерировать ответ
                </Button>
                <Button size="sm" variant="ghost" className="text-xs">Отметить прочитанным</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function SentimentPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold">Анализ настроения</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Распределение тональности за последние 30 дней</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Позитивных", value: "62%", count: "335", icon: "Smile", color: "text-positive" },
          { label: "Нейтральных", value: "23%", count: "124", icon: "Meh", color: "text-neutral" },
          { label: "Негативных", value: "15%", count: "81", icon: "Frown", color: "text-negative" },
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
          {SENTIMENT_DATA.map(item => (
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

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold">Ключевые темы из отзывов</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { tag: "обслуживание", count: 89, sentiment: "positive" },
            { tag: "доставка", count: 64, sentiment: "negative" },
            { tag: "цена", count: 51, sentiment: "neutral" },
            { tag: "качество", count: 112, sentiment: "positive" },
            { tag: "скорость", count: 43, sentiment: "neutral" },
            { tag: "персонал", count: 77, sentiment: "positive" },
            { tag: "ожидание", count: 38, sentiment: "negative" },
            { tag: "ассортимент", count: 29, sentiment: "positive" },
          ].map(t => (
            <span key={t.tag} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              t.sentiment === "positive" ? "bg-green-50 text-green-700 border-green-200" :
              t.sentiment === "negative" ? "bg-red-50 text-red-700 border-red-200" :
              "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {t.tag} · {t.count}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ResponsesPage() {
  const [selected, setSelected] = useState(TEMPLATES[0]);
  const activeReview = REVIEWS.find(r => !r.answered) || REVIEWS[0];
  const [editText, setEditText] = useState(TEMPLATES[0].text.replace("{author}", activeReview.author.split(" ")[0]));

  const handleSelectTemplate = (t: typeof TEMPLATES[0]) => {
    setSelected(t);
    setEditText(t.text.replace("{author}", activeReview.author.split(" ")[0]));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold">Шаблоны и ответы</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Готовые шаблоны с возможностью кастомизации</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Отзыв для ответа</h3>
          <Card className="p-4 space-y-3 border-foreground/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                {activeReview.author[0]}
              </div>
              <div>
                <p className="text-sm font-medium">{activeReview.author}</p>
                <p className="text-xs text-muted-foreground">{activeReview.source} · {activeReview.date}</p>
              </div>
              <RatingStars rating={activeReview.rating} />
            </div>
            <p className="text-sm leading-relaxed">{activeReview.text}</p>
            <SentimentBadge sentiment={activeReview.sentiment} />
          </Card>

          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Шаблоны</h3>
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${selected.id === t.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30"}`}
              >
                <p className="font-medium">{t.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Редактирование ответа</h3>
          <Textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={8}
            className="resize-none text-sm leading-relaxed"
          />
          <div className="flex gap-2">
            <Button className="gap-2 flex-1">
              <Icon name="Send" size={14} />
              Отправить ответ
            </Button>
            <Button variant="outline" onClick={() => handleSelectTemplate(selected)}>
              <Icon name="RefreshCw" size={14} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Используйте <code className="font-mono bg-muted px-1 rounded">{"{author}"}</code> для подстановки имени
          </p>
        </div>
      </div>
    </div>
  );
}

function StatsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold">Статистика</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Сводные показатели за 30 дней</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
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
          {SOURCES.map(s => (
            <div key={s.id} className="flex items-center gap-4">
              <p className="text-sm w-32 shrink-0">{s.name}</p>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full"
                  style={{ width: `${Math.round((s.reviews / 220) * 100)}%` }}
                />
              </div>
              <p className="text-sm font-mono w-12 text-right">{s.reviews}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold">Скорость ответов</h3>
          <div className="space-y-3">
            {[
              { label: "До 1 часа", value: 45 },
              { label: "До 24 часов", value: 33 },
              { label: "До 3 дней", value: 15 },
              { label: "Позже", value: 7 },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-24 shrink-0">{item.label}</span>
                <div className="flex-1 h-1 bg-muted rounded-full">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${item.value}%` }} />
                </div>
                <span className="font-mono text-xs w-8 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold">Рейтинг по платформам</h3>
          <div className="space-y-3">
            {[
              { name: "Яндекс Карты", rating: 4.7 },
              { name: "Google Maps", rating: 4.3 },
              { name: "2ГИС", rating: 4.5 },
              { name: "Отзовик", rating: 3.9 },
              { name: "Zoon", rating: 4.1 },
            ].map(p => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{p.name}</span>
                <div className="flex items-center gap-2">
                  <RatingStars rating={Math.round(p.rating)} />
                  <span className="font-mono font-medium">{p.rating}</span>
                </div>
              </div>
            ))}
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Автоматические ответы</p>
              <p className="text-xs text-muted-foreground mt-0.5">Отвечать на позитивные отзывы автоматически</p>
            </div>
            <button
              onClick={() => setAutoReply(!autoReply)}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${autoReply ? "bg-foreground" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoReply ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Уведомления о негативных</p>
              <p className="text-xs text-muted-foreground mt-0.5">Сразу сообщать о новых негативных отзывах</p>
            </div>
            <button
              onClick={() => setNotifyNegative(!notifyNegative)}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${notifyNegative ? "bg-foreground" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifyNegative ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold">Уведомления</h3>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Email для уведомлений</label>
          <div className="flex gap-2">
            <Input placeholder="email@company.ru" className="flex-1" />
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

  const unansweredCount = REVIEWS.filter(r => !r.answered).length;

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
              {item.id === "reviews" && unansweredCount > 0 && (
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium ${tab === item.id ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>
                  {unansweredCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-positive" />
            <p className="text-xs text-muted-foreground">Синхронизация активна</p>
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
