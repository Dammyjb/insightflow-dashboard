-- InsightFlow Analytics - Sample Data Seed
-- This generates realistic sample data for demonstration

-- Clear existing data
DELETE FROM user_feedback;
DELETE FROM conversion_events;
DELETE FROM conversion_funnel;
DELETE FROM user_activities;
DELETE FROM user_sessions;

-- Insert User Sessions (50 sessions over the past 30 days)
INSERT INTO user_sessions (id, user_id, session_start, session_end, is_churned, device_type, browser, referrer_source) VALUES
-- Week 1 - Active users
('s001', 'u001', datetime('now', '-28 days'), datetime('now', '-28 days', '+15 minutes'), 0, 'desktop', 'Chrome', 'google'),
('s002', 'u002', datetime('now', '-28 days'), datetime('now', '-28 days', '+8 minutes'), 0, 'mobile', 'Safari', 'direct'),
('s003', 'u003', datetime('now', '-27 days'), datetime('now', '-27 days', '+22 minutes'), 0, 'desktop', 'Firefox', 'facebook'),
('s004', 'u004', datetime('now', '-27 days'), datetime('now', '-27 days', '+5 minutes'), 1, 'mobile', 'Chrome', 'google'),
('s005', 'u005', datetime('now', '-26 days'), datetime('now', '-26 days', '+18 minutes'), 0, 'tablet', 'Safari', 'instagram'),
('s006', 'u006', datetime('now', '-26 days'), datetime('now', '-26 days', '+3 minutes'), 1, 'mobile', 'Chrome', 'twitter'),
('s007', 'u001', datetime('now', '-25 days'), datetime('now', '-25 days', '+25 minutes'), 0, 'desktop', 'Chrome', 'direct'),
('s008', 'u007', datetime('now', '-25 days'), datetime('now', '-25 days', '+12 minutes'), 0, 'desktop', 'Edge', 'google'),
-- Week 2
('s009', 'u008', datetime('now', '-21 days'), datetime('now', '-21 days', '+9 minutes'), 0, 'mobile', 'Safari', 'direct'),
('s010', 'u009', datetime('now', '-21 days'), datetime('now', '-21 days', '+4 minutes'), 1, 'desktop', 'Chrome', 'google'),
('s011', 'u010', datetime('now', '-20 days'), datetime('now', '-20 days', '+30 minutes'), 0, 'desktop', 'Firefox', 'linkedin'),
('s012', 'u002', datetime('now', '-20 days'), datetime('now', '-20 days', '+16 minutes'), 0, 'mobile', 'Safari', 'direct'),
('s013', 'u011', datetime('now', '-19 days'), datetime('now', '-19 days', '+7 minutes'), 1, 'tablet', 'Chrome', 'facebook'),
('s014', 'u012', datetime('now', '-19 days'), datetime('now', '-19 days', '+20 minutes'), 0, 'desktop', 'Chrome', 'google'),
('s015', 'u013', datetime('now', '-18 days'), datetime('now', '-18 days', '+11 minutes'), 0, 'mobile', 'Safari', 'instagram'),
-- Week 3
('s016', 'u014', datetime('now', '-14 days'), datetime('now', '-14 days', '+6 minutes'), 1, 'desktop', 'Firefox', 'google'),
('s017', 'u015', datetime('now', '-14 days'), datetime('now', '-14 days', '+28 minutes'), 0, 'desktop', 'Chrome', 'direct'),
('s018', 'u003', datetime('now', '-13 days'), datetime('now', '-13 days', '+19 minutes'), 0, 'desktop', 'Firefox', 'direct'),
('s019', 'u016', datetime('now', '-13 days'), datetime('now', '-13 days', '+2 minutes'), 1, 'mobile', 'Chrome', 'twitter'),
('s020', 'u017', datetime('now', '-12 days'), datetime('now', '-12 days', '+14 minutes'), 0, 'tablet', 'Safari', 'facebook'),
('s021', 'u018', datetime('now', '-12 days'), datetime('now', '-12 days', '+8 minutes'), 0, 'desktop', 'Edge', 'google'),
('s022', 'u019', datetime('now', '-11 days'), datetime('now', '-11 days', '+5 minutes'), 1, 'mobile', 'Chrome', 'instagram'),
-- Week 4 (recent)
('s023', 'u020', datetime('now', '-7 days'), datetime('now', '-7 days', '+23 minutes'), 0, 'desktop', 'Chrome', 'google'),
('s024', 'u001', datetime('now', '-7 days'), datetime('now', '-7 days', '+31 minutes'), 0, 'desktop', 'Chrome', 'direct'),
('s025', 'u021', datetime('now', '-6 days'), datetime('now', '-6 days', '+10 minutes'), 0, 'mobile', 'Safari', 'direct'),
('s026', 'u022', datetime('now', '-6 days'), datetime('now', '-6 days', '+4 minutes'), 1, 'mobile', 'Chrome', 'facebook'),
('s027', 'u023', datetime('now', '-5 days'), datetime('now', '-5 days', '+17 minutes'), 0, 'desktop', 'Firefox', 'google'),
('s028', 'u024', datetime('now', '-5 days'), datetime('now', '-5 days', '+12 minutes'), 0, 'tablet', 'Safari', 'linkedin'),
('s029', 'u025', datetime('now', '-4 days'), datetime('now', '-4 days', '+6 minutes'), 1, 'desktop', 'Chrome', 'google'),
('s030', 'u005', datetime('now', '-4 days'), datetime('now', '-4 days', '+21 minutes'), 0, 'tablet', 'Safari', 'direct'),
('s031', 'u026', datetime('now', '-3 days'), datetime('now', '-3 days', '+9 minutes'), 0, 'mobile', 'Chrome', 'twitter'),
('s032', 'u027', datetime('now', '-3 days'), datetime('now', '-3 days', '+3 minutes'), 1, 'desktop', 'Edge', 'google'),
('s033', 'u028', datetime('now', '-2 days'), datetime('now', '-2 days', '+15 minutes'), 0, 'desktop', 'Chrome', 'facebook'),
('s034', 'u029', datetime('now', '-2 days'), datetime('now', '-2 days', '+26 minutes'), 0, 'mobile', 'Safari', 'direct'),
('s035', 'u030', datetime('now', '-1 days'), datetime('now', '-1 days', '+8 minutes'), 0, 'desktop', 'Firefox', 'google'),
('s036', 'u007', datetime('now', '-1 days'), datetime('now', '-1 days', '+18 minutes'), 0, 'desktop', 'Edge', 'direct'),
('s037', 'u031', datetime('now', '-1 days'), datetime('now', '-1 days', '+5 minutes'), 1, 'mobile', 'Chrome', 'instagram'),
('s038', 'u032', datetime('now'), NULL, 0, 'desktop', 'Chrome', 'google'),
('s039', 'u033', datetime('now'), NULL, 0, 'tablet', 'Safari', 'facebook'),
('s040', 'u034', datetime('now'), NULL, 0, 'mobile', 'Chrome', 'direct');

-- Insert User Activities (detailed journey tracking)
INSERT INTO user_activities (id, session_id, activity_name, activity_type, page_path, duration_seconds, timestamp, drop_off) VALUES
-- Session 1: Complete journey
('a001', 's001', 'Homepage View', 'page_view', '/home', 45, datetime('now', '-28 days'), 0),
('a002', 's001', 'Product Browse', 'page_view', '/products', 120, datetime('now', '-28 days', '+1 minute'), 0),
('a003', 's001', 'Product Detail', 'page_view', '/products/item-1', 180, datetime('now', '-28 days', '+3 minutes'), 0),
('a004', 's001', 'Add to Cart', 'action', '/cart', 30, datetime('now', '-28 days', '+6 minutes'), 0),
('a005', 's001', 'Checkout', 'page_view', '/checkout', 240, datetime('now', '-28 days', '+7 minutes'), 0),
('a006', 's001', 'Purchase Complete', 'event', '/confirmation', 60, datetime('now', '-28 days', '+11 minutes'), 0),
-- Session 2: Partial journey - drops at cart
('a007', 's002', 'Homepage View', 'page_view', '/home', 30, datetime('now', '-28 days'), 0),
('a008', 's002', 'Product Browse', 'page_view', '/products', 90, datetime('now', '-28 days', '+30 seconds'), 0),
('a009', 's002', 'Product Detail', 'page_view', '/products/item-2', 150, datetime('now', '-28 days', '+2 minutes'), 0),
('a010', 's002', 'Add to Cart', 'action', '/cart', 45, datetime('now', '-28 days', '+4 minutes'), 1),
-- Session 3: Full journey with signup
('a011', 's003', 'Homepage View', 'page_view', '/home', 60, datetime('now', '-27 days'), 0),
('a012', 's003', 'Signup Page', 'page_view', '/signup', 180, datetime('now', '-27 days', '+1 minute'), 0),
('a013', 's003', 'Signup Complete', 'event', '/signup/confirm', 30, datetime('now', '-27 days', '+4 minutes'), 0),
('a014', 's003', 'Product Browse', 'page_view', '/products', 240, datetime('now', '-27 days', '+5 minutes'), 0),
('a015', 's003', 'Checkout', 'page_view', '/checkout', 300, datetime('now', '-27 days', '+9 minutes'), 0),
('a016', 's003', 'Purchase Complete', 'event', '/confirmation', 45, datetime('now', '-27 days', '+14 minutes'), 0),
-- Session 4: Churned user - bounced
('a017', 's004', 'Homepage View', 'page_view', '/home', 120, datetime('now', '-27 days'), 0),
('a018', 's004', 'Pricing Page', 'page_view', '/pricing', 180, datetime('now', '-27 days', '+2 minutes'), 1),
-- Session 5: Engaged browsing
('a019', 's005', 'Homepage View', 'page_view', '/home', 45, datetime('now', '-26 days'), 0),
('a020', 's005', 'Features', 'page_view', '/features', 200, datetime('now', '-26 days', '+1 minute'), 0),
('a021', 's005', 'Product Browse', 'page_view', '/products', 300, datetime('now', '-26 days', '+4 minutes'), 0),
('a022', 's005', 'Search', 'action', '/search', 120, datetime('now', '-26 days', '+9 minutes'), 0),
('a023', 's005', 'Product Detail', 'page_view', '/products/item-5', 240, datetime('now', '-26 days', '+11 minutes'), 0),
('a024', 's005', 'Add to Cart', 'action', '/cart', 60, datetime('now', '-26 days', '+15 minutes'), 0),
-- Session 6: Quick bounce
('a025', 's006', 'Homepage View', 'page_view', '/home', 90, datetime('now', '-26 days'), 1),
-- Session 7: Returning user - full journey
('a026', 's007', 'Homepage View', 'page_view', '/home', 20, datetime('now', '-25 days'), 0),
('a027', 's007', 'Account', 'page_view', '/account', 60, datetime('now', '-25 days', '+30 seconds'), 0),
('a028', 's007', 'Product Browse', 'page_view', '/products', 180, datetime('now', '-25 days', '+2 minutes'), 0),
('a029', 's007', 'Product Detail', 'page_view', '/products/item-3', 150, datetime('now', '-25 days', '+5 minutes'), 0),
('a030', 's007', 'Checkout', 'page_view', '/checkout', 200, datetime('now', '-25 days', '+8 minutes'), 0),
('a031', 's007', 'Purchase Complete', 'event', '/confirmation', 30, datetime('now', '-25 days', '+12 minutes'), 0),
-- More varied activities
('a032', 's008', 'Homepage View', 'page_view', '/home', 40, datetime('now', '-25 days'), 0),
('a033', 's008', 'Blog', 'page_view', '/blog', 300, datetime('now', '-25 days', '+1 minute'), 0),
('a034', 's008', 'Blog Article', 'page_view', '/blog/article-1', 420, datetime('now', '-25 days', '+6 minutes'), 0),
('a035', 's009', 'Homepage View', 'page_view', '/home', 60, datetime('now', '-21 days'), 0),
('a036', 's009', 'Product Browse', 'page_view', '/products', 240, datetime('now', '-21 days', '+1 minute'), 0),
('a037', 's009', 'Add to Cart', 'action', '/cart', 90, datetime('now', '-21 days', '+5 minutes'), 0),
('a038', 's010', 'Homepage View', 'page_view', '/home', 180, datetime('now', '-21 days'), 1),
-- Drop-off at checkout (common pattern)
('a039', 's011', 'Homepage View', 'page_view', '/home', 30, datetime('now', '-20 days'), 0),
('a040', 's011', 'Product Browse', 'page_view', '/products', 400, datetime('now', '-20 days', '+1 minute'), 0),
('a041', 's011', 'Product Detail', 'page_view', '/products/item-8', 300, datetime('now', '-20 days', '+8 minutes'), 0),
('a042', 's011', 'Add to Cart', 'action', '/cart', 60, datetime('now', '-20 days', '+13 minutes'), 0),
('a043', 's011', 'Checkout', 'page_view', '/checkout', 480, datetime('now', '-20 days', '+14 minutes'), 1),
-- More sessions with varied patterns
('a044', 's012', 'Homepage View', 'page_view', '/home', 45, datetime('now', '-20 days'), 0),
('a045', 's012', 'Features', 'page_view', '/features', 180, datetime('now', '-20 days', '+1 minute'), 0),
('a046', 's012', 'Pricing Page', 'page_view', '/pricing', 240, datetime('now', '-20 days', '+4 minutes'), 0),
('a047', 's013', 'Homepage View', 'page_view', '/home', 60, datetime('now', '-19 days'), 0),
('a048', 's013', 'Product Browse', 'page_view', '/products', 180, datetime('now', '-19 days', '+1 minute'), 1),
('a049', 's014', 'Homepage View', 'page_view', '/home', 30, datetime('now', '-19 days'), 0),
('a050', 's014', 'Signup Page', 'page_view', '/signup', 120, datetime('now', '-19 days', '+30 seconds'), 0),
('a051', 's014', 'Signup Complete', 'event', '/signup/confirm', 45, datetime('now', '-19 days', '+3 minutes'), 0),
('a052', 's014', 'Product Browse', 'page_view', '/products', 300, datetime('now', '-19 days', '+4 minutes'), 0),
('a053', 's014', 'Checkout', 'page_view', '/checkout', 180, datetime('now', '-19 days', '+9 minutes'), 0),
('a054', 's014', 'Purchase Complete', 'event', '/confirmation', 30, datetime('now', '-19 days', '+12 minutes'), 0),
-- Recent high-engagement sessions
('a055', 's023', 'Homepage View', 'page_view', '/home', 40, datetime('now', '-7 days'), 0),
('a056', 's023', 'Product Browse', 'page_view', '/products', 300, datetime('now', '-7 days', '+1 minute'), 0),
('a057', 's023', 'Search', 'action', '/search', 90, datetime('now', '-7 days', '+6 minutes'), 0),
('a058', 's023', 'Product Detail', 'page_view', '/products/item-12', 200, datetime('now', '-7 days', '+8 minutes'), 0),
('a059', 's023', 'Add to Cart', 'action', '/cart', 45, datetime('now', '-7 days', '+11 minutes'), 0),
('a060', 's023', 'Checkout', 'page_view', '/checkout', 180, datetime('now', '-7 days', '+12 minutes'), 0),
('a061', 's023', 'Purchase Complete', 'event', '/confirmation', 30, datetime('now', '-7 days', '+15 minutes'), 0),
('a062', 's024', 'Homepage View', 'page_view', '/home', 20, datetime('now', '-7 days'), 0),
('a063', 's024', 'Account', 'page_view', '/account', 120, datetime('now', '-7 days', '+30 seconds'), 0),
('a064', 's024', 'Order History', 'page_view', '/account/orders', 180, datetime('now', '-7 days', '+2 minutes'), 0),
('a065', 's024', 'Product Browse', 'page_view', '/products', 240, datetime('now', '-7 days', '+5 minutes'), 0),
('a066', 's024', 'Checkout', 'page_view', '/checkout', 200, datetime('now', '-7 days', '+9 minutes'), 0),
('a067', 's024', 'Purchase Complete', 'event', '/confirmation', 45, datetime('now', '-7 days', '+13 minutes'), 0);

-- Insert Conversion Funnel Steps
INSERT INTO conversion_funnel (id, funnel_name, step_order, step_name, users_entered, users_completed, drop_off_count) VALUES
('f001', 'Main Conversion Funnel', 1, 'Landing Page', 1000, 750, 250),
('f002', 'Main Conversion Funnel', 2, 'Product View', 750, 520, 230),
('f003', 'Main Conversion Funnel', 3, 'Add to Cart', 520, 340, 180),
('f004', 'Main Conversion Funnel', 4, 'Begin Checkout', 340, 210, 130),
('f005', 'Main Conversion Funnel', 5, 'Complete Purchase', 210, 156, 54);

-- Insert Conversion Events
INSERT INTO conversion_events (id, user_id, event_type, funnel_step, completed, timestamp, revenue) VALUES
-- User journeys through funnel
('ce001', 'u001', 'page_view', 1, 1, datetime('now', '-28 days'), NULL),
('ce002', 'u001', 'page_view', 2, 1, datetime('now', '-28 days', '+2 minutes'), NULL),
('ce003', 'u001', 'add_to_cart', 3, 1, datetime('now', '-28 days', '+5 minutes'), NULL),
('ce004', 'u001', 'checkout', 4, 1, datetime('now', '-28 days', '+7 minutes'), NULL),
('ce005', 'u001', 'purchase', 5, 1, datetime('now', '-28 days', '+11 minutes'), 89.99),
('ce006', 'u002', 'page_view', 1, 1, datetime('now', '-28 days'), NULL),
('ce007', 'u002', 'page_view', 2, 1, datetime('now', '-28 days', '+1 minute'), NULL),
('ce008', 'u002', 'add_to_cart', 3, 1, datetime('now', '-28 days', '+3 minutes'), NULL),
('ce009', 'u002', 'checkout', 4, 0, datetime('now', '-28 days', '+4 minutes'), NULL),
('ce010', 'u003', 'page_view', 1, 1, datetime('now', '-27 days'), NULL),
('ce011', 'u003', 'signup', 2, 1, datetime('now', '-27 days', '+3 minutes'), NULL),
('ce012', 'u003', 'page_view', 2, 1, datetime('now', '-27 days', '+5 minutes'), NULL),
('ce013', 'u003', 'checkout', 4, 1, datetime('now', '-27 days', '+10 minutes'), NULL),
('ce014', 'u003', 'purchase', 5, 1, datetime('now', '-27 days', '+14 minutes'), 149.99),
('ce015', 'u004', 'page_view', 1, 1, datetime('now', '-27 days'), NULL),
('ce016', 'u004', 'page_view', 2, 0, datetime('now', '-27 days', '+2 minutes'), NULL),
('ce017', 'u005', 'page_view', 1, 1, datetime('now', '-26 days'), NULL),
('ce018', 'u005', 'page_view', 2, 1, datetime('now', '-26 days', '+3 minutes'), NULL),
('ce019', 'u005', 'add_to_cart', 3, 1, datetime('now', '-26 days', '+10 minutes'), NULL),
('ce020', 'u006', 'page_view', 1, 0, datetime('now', '-26 days'), NULL),
('ce021', 'u007', 'page_view', 1, 1, datetime('now', '-25 days'), NULL),
('ce022', 'u007', 'page_view', 2, 1, datetime('now', '-25 days', '+1 minute'), NULL),
('ce023', 'u007', 'add_to_cart', 3, 1, datetime('now', '-25 days', '+6 minutes'), NULL),
('ce024', 'u007', 'checkout', 4, 1, datetime('now', '-25 days', '+8 minutes'), NULL),
('ce025', 'u007', 'purchase', 5, 1, datetime('now', '-25 days', '+12 minutes'), 59.99),
-- More conversion events
('ce026', 'u008', 'page_view', 1, 1, datetime('now', '-21 days'), NULL),
('ce027', 'u008', 'page_view', 2, 1, datetime('now', '-21 days', '+2 minutes'), NULL),
('ce028', 'u008', 'add_to_cart', 3, 1, datetime('now', '-21 days', '+5 minutes'), NULL),
('ce029', 'u009', 'page_view', 1, 0, datetime('now', '-21 days'), NULL),
('ce030', 'u010', 'page_view', 1, 1, datetime('now', '-20 days'), NULL),
('ce031', 'u010', 'page_view', 2, 1, datetime('now', '-20 days', '+5 minutes'), NULL),
('ce032', 'u010', 'add_to_cart', 3, 1, datetime('now', '-20 days', '+12 minutes'), NULL),
('ce033', 'u010', 'checkout', 4, 0, datetime('now', '-20 days', '+14 minutes'), NULL),
('ce034', 'u012', 'page_view', 1, 1, datetime('now', '-19 days'), NULL),
('ce035', 'u012', 'signup', 2, 1, datetime('now', '-19 days', '+2 minutes'), NULL),
('ce036', 'u012', 'page_view', 2, 1, datetime('now', '-19 days', '+4 minutes'), NULL),
('ce037', 'u012', 'checkout', 4, 1, datetime('now', '-19 days', '+9 minutes'), NULL),
('ce038', 'u012', 'purchase', 5, 1, datetime('now', '-19 days', '+12 minutes'), 199.99),
-- Recent conversions
('ce039', 'u020', 'page_view', 1, 1, datetime('now', '-7 days'), NULL),
('ce040', 'u020', 'page_view', 2, 1, datetime('now', '-7 days', '+3 minutes'), NULL),
('ce041', 'u020', 'add_to_cart', 3, 1, datetime('now', '-7 days', '+8 minutes'), NULL),
('ce042', 'u020', 'checkout', 4, 1, datetime('now', '-7 days', '+11 minutes'), NULL),
('ce043', 'u020', 'purchase', 5, 1, datetime('now', '-7 days', '+15 minutes'), 124.99),
('ce044', 'u001', 'page_view', 1, 1, datetime('now', '-7 days'), NULL),
('ce045', 'u001', 'page_view', 2, 1, datetime('now', '-7 days', '+2 minutes'), NULL),
('ce046', 'u001', 'checkout', 4, 1, datetime('now', '-7 days', '+9 minutes'), NULL),
('ce047', 'u001', 'purchase', 5, 1, datetime('now', '-7 days', '+13 minutes'), 79.99),
('ce048', 'u025', 'page_view', 1, 1, datetime('now', '-4 days'), NULL),
('ce049', 'u025', 'page_view', 2, 0, datetime('now', '-4 days', '+3 minutes'), NULL),
('ce050', 'u028', 'page_view', 1, 1, datetime('now', '-2 days'), NULL),
('ce051', 'u028', 'page_view', 2, 1, datetime('now', '-2 days', '+2 minutes'), NULL),
('ce052', 'u028', 'add_to_cart', 3, 1, datetime('now', '-2 days', '+8 minutes'), NULL),
('ce053', 'u028', 'checkout', 4, 1, datetime('now', '-2 days', '+10 minutes'), NULL),
('ce054', 'u028', 'purchase', 5, 1, datetime('now', '-2 days', '+13 minutes'), 299.99);

-- Insert User Feedback
INSERT INTO user_feedback (id, user_id, session_id, feedback_type, rating, comment, page_path, timestamp) VALUES
('fb001', 'u001', 's001', 'nps', 9, 'Great experience, easy checkout!', '/confirmation', datetime('now', '-28 days')),
('fb002', 'u003', 's003', 'rating', 5, 'Love the product selection', '/products', datetime('now', '-27 days')),
('fb003', 'u005', 's005', 'comment', NULL, 'Search could be improved', '/search', datetime('now', '-26 days')),
('fb004', 'u007', 's007', 'nps', 10, 'Best shopping experience!', '/confirmation', datetime('now', '-25 days')),
('fb005', 'u010', 's011', 'rating', 3, 'Checkout was confusing', '/checkout', datetime('now', '-20 days')),
('fb006', 'u012', 's014', 'nps', 8, 'Good overall, shipping info could be clearer', '/checkout', datetime('now', '-19 days')),
('fb007', 'u020', 's023', 'rating', 5, 'Found exactly what I needed!', '/products', datetime('now', '-7 days')),
('fb008', 'u001', 's024', 'nps', 9, 'Returning customer, always great!', '/confirmation', datetime('now', '-7 days')),
('fb009', 'u028', 's033', 'rating', 4, 'Nice products, delivery could be faster', '/confirmation', datetime('now', '-2 days'));
