INSERT INTO t_p95354559_review_sentiment_ana.sources (name, url, platform, active, reviews_count, last_sync_at) VALUES
('Яндекс Карты', 'yandex.ru/maps', 'yandex', true, 148, NOW() - INTERVAL '2 minutes'),
('2ГИС', '2gis.ru', '2gis', true, 89, NOW() - INTERVAL '15 minutes'),
('Google Maps', 'google.com/maps', 'google', false, 212, NOW() - INTERVAL '1 hour'),
('Отзовик', 'otzovik.com', 'otzovik', true, 34, NOW() - INTERVAL '3 minutes'),
('Zoon', 'zoon.ru', 'zoon', false, 57, NOW() - INTERVAL '2 hours');