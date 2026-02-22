INSERT INTO t_p95354559_review_sentiment_ana.reviews (source_id, external_id, author, rating, text, sentiment, sentiment_score, answered, review_date) VALUES
(1, 'ext-001', 'Алексей М.', 5, 'Отличный сервис! Всё быстро и качественно, сотрудники вежливые. Обязательно вернусь снова.', 'positive', 0.92, false, NOW() - INTERVAL '0 days'),
(2, 'ext-002', 'Марина К.', 2, 'Ждал заказ дольше обещанного. Качество не соответствует цене. Разочарован.', 'negative', -0.74, true, NOW() - INTERVAL '1 day'),
(4, 'ext-003', 'Дмитрий Р.', 4, 'В целом неплохо, но есть куда расти. Доставка могла бы быть быстрее.', 'neutral', 0.21, false, NOW() - INTERVAL '2 days'),
(1, 'ext-004', 'Светлана П.', 5, 'Пользуюсь давно, никогда не подводили. Лучший выбор в своём сегменте.', 'positive', 0.88, false, NOW() - INTERVAL '3 days'),
(3, 'ext-005', 'Иван Т.', 1, 'Ужасное обслуживание, не рекомендую. Грубый персонал.', 'negative', -0.91, false, NOW() - INTERVAL '4 days'),
(2, 'ext-006', 'Ольга Н.', 3, 'Среднее качество по средней цене. Ничего особенного.', 'neutral', 0.05, true, NOW() - INTERVAL '5 days');