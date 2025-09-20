-- 确保使用正确的数据库
USE charityevents_db;

-- 清空现有数据（如果需要重新开始）
TRUNCATE TABLE events;
TRUNCATE TABLE categories;

-- 插入分类数据 - 使用英文描述避免编码问题
INSERT INTO categories (name, description) VALUES 
('Fun Run', 'Charity running events suitable for all ages'),
('Gala Dinner', 'Formal charity dinners with speeches and auctions'),
('Silent Auction', 'Silent auction events with secret bidding'),
('Concert', 'Charity music performances'),
('Workshop', 'Educational workshops for skill development'),
('Sports Tournament', 'Sports competitions for charity');

-- 插入活动数据 - 使用英文描述
INSERT INTO events (name, short_description, full_description, date_time, location, address, category_id, ticket_price, ticket_type, goal_amount, current_amount, is_active, max_attendees) VALUES
(
    'Annual Charity Run 2025',
    'Join our 5km charity run to support children education',
    'This is our 10th annual charity run! All proceeds will directly support local school education programs. Event includes 5km run, kids fun run, and family entertainment area. Water stations, first aid, and finishing medals provided.',
    '2025-10-15 08:00:00',
    'City Central Park',
    '123 Park Avenue, City Central',
    1,
    25.00,
    'paid',
    10000.00,
    6500.00,
    TRUE,
    500
),
(
    'Gala Dinner for Children Hospital',
    'Elegant charity dinner supporting children hospital equipment',
    'Join us for a special evening supporting our local children hospital. Event includes three-course dinner, live music, silent auction, and inspiring speeches. Business attire required.',
    '2025-11-20 19:00:00',
    'Grand Hotel Ballroom',
    '456 Luxury Street, Uptown District',
    2,
    150.00,
    'paid',
    50000.00,
    32500.00,
    TRUE,
    200
),
(
    'Art for Heart Silent Auction',
    'Silent auction of artworks donated by local artists',
    'Browse and bid on wonderful artworks donated by local established and emerging artists. All proceeds support heart disease research. Drinks and snacks provided.',
    '2025-09-30 18:00:00',
    'Community Art Center',
    '789 Art Lane, Cultural District',
    3,
    0.00,
    'free',
    15000.00,
    8200.00,
    TRUE,
    150
),
(
    'Rock for Rescue Concert',
    'Rock concert supporting animal rescue organization',
    'Enjoy an evening of music featuring local bands performing classic rock. All ticket proceeds support medical and care costs for animal rescue organization.',
    '2025-12-05 20:00:00',
    'Downtown Music Hall',
    '321 Sound Street, Entertainment District',
    4,
    35.00,
    'paid',
    20000.00,
    12500.00,
    TRUE,
    300
),
(
    'Coding for Kids Workshop',
    'Free programming workshop introducing kids to computer science',
    'In this interactive workshop, children will learn programming basics. Suitable for ages 8-12. Pre-registration required. Donations optional.',
    '2025-10-25 10:00:00',
    'Tech Innovation Center',
    '654 Code Avenue, Tech Park',
    5,
    0.00,
    'free',
    5000.00,
    3200.00,
    TRUE,
    30
),
(
    'Charity Basketball Tournament',
    '3v3 basketball competition supporting youth sports programs',
    'Form your team for this exciting 3v3 basketball tournament! All skill levels welcome. Prizes include trophies and sports equipment.',
    '2025-11-12 09:00:00',
    'City Sports Complex',
    '987 Sport Way, Athletic District',
    6,
    15.00,
    'paid',
    8000.00,
    4500.00,
    TRUE,
    100
),
(
    'Winter Gala for Homeless Shelter',
    'Winter charity dinner raising funds for homeless shelter',
    'Join us this holiday season to support the homeless shelter. Event includes dinner, dancing, and raffle prizes.',
    '2025-12-15 18:30:00',
    'Riverside Convention Center',
    '147 Event Boulevard, Riverside',
    2,
    75.00,
    'paid',
    25000.00,
    18000.00,
    TRUE,
    250
),
(
    'Sunset Yoga for Mental Health',
    'Sunset yoga class supporting mental health awareness',
    'Join a relaxing yoga class against the beautiful backdrop of park sunset. All levels welcome. Please bring your own yoga mat.',
    '2025-09-20 17:30:00',
    'Sunset Park',
    '258 Serenity Road, Westside',
    5,
    20.00,
    'paid',
    3000.00,
    2100.00,
    TRUE,
    50
);

-- 插入一个非活跃活动作为示例
INSERT INTO events (name, short_description, full_description, date_time, location, category_id, ticket_price, goal_amount, current_amount, is_active) VALUES
(
    'Cancelled: Summer Festival 2025',
    'Summer festival cancelled due to weather conditions',
    'This event has been cancelled. All purchased tickets will be fully refunded.',
    '2025-08-10 12:00:00',
    'City Park',
    4,
    0.00,
    10000.00,
    0.00,
    FALSE
);