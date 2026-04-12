-- =====================================================
-- Royal Nepal - Seed Data
-- Sample data for Nepal-specific locations and services
-- =====================================================

USE royal_nepal;

-- =====================================================
-- SEED DATA: LOCATIONS
-- Popular Nepalese destinations
-- =====================================================

INSERT INTO locations (location_name, location_type, province, latitude, longitude, description, airport_code, is_popular) VALUES
-- Cultural & Historical Capitals (The Valleys)
('Kathmandu', 'city', 'Bagmati Province', 27.7172453, 85.3239605, 'The vibrant capital city of Nepal, home to Pashupatinath, Boudhanath, and Durbar Square.', 'KTM', TRUE),
('Bhaktapur', 'city', 'Bagmati Province', 27.6710079, 85.4298092, 'The city of devotees, famous for its preserved medieval art, architecture, and pottery.', NULL, TRUE),
('Lalitpur', 'city', 'Bagmati Province', 27.6666700, 85.3166700, 'Also known as Patan, famous for its rich cultural heritage and intricate arts and crafts.', NULL, TRUE),

-- Adventure & Trekking Hubs (The Himalayas)
('Pokhara', 'city', 'Gandaki Province', 28.2095800, 83.9855800, 'The tourism capital of Nepal, a lakeside city and gateway to the Annapurna circuit.', 'PKR', TRUE),
('Namche Bazaar', 'trekking_area', 'Koshi Province', 27.8047000, 86.7138000, 'The famous Sherpa town and main staging point for Everest Base Camp treks.', NULL, TRUE),
('Lukla', 'trekking_area', 'Koshi Province', 27.6869800, 86.7295900, 'Famous for Tenzing-Hillary Airport, the thrilling starting point for Everest expeditions.', 'LUA', TRUE),
('Mustang', 'district', 'Gandaki Province', 29.1000000, 83.9700000, 'A mystical region known for its Tibetan culture and stunning barren landscapes.', 'JMO', TRUE),
('Jomsom', 'city', 'Gandaki Province', 28.7805600, 83.7230600, 'A popular trekking destination in the Mustang district with breathtaking mountain views.', 'JMO', FALSE),

-- Jungle & Wildlife Retreats (The Terai)
('Chitwan', 'district', 'Bagmati Province', 27.5291600, 84.3542000, 'Home to Chitwan National Park, famous for jungle safaris and one-horned rhinos.', NULL, TRUE),
('Sauraha', 'city', 'Bagmati Province', 27.5792000, 84.4960000, 'Main tourist hub in Chitwan for national park activities.', NULL, FALSE),
('Bardiya', 'district', 'Lumbini Province', 28.3300000, 81.3500000, 'A pristine wildlife destination offering incredible experiences with Bengal tigers.', NULL, TRUE),

-- Sacred Pilgrimage Sites
('Lumbini', 'city', 'Lumbini Province', 27.4830900, 83.2763800, 'The birthplace of Lord Buddha, a UNESCO World Heritage Site with international monasteries.', NULL, TRUE),
('Muktinath', 'city', 'Gandaki Province', 28.8166700, 83.8666700, 'A sacred place for both Hindus and Buddhists in the Mustang district.', NULL, TRUE),
('Janakpur', 'city', 'Madhesh Province', 26.7288400, 85.9245700, 'The birthplace of Goddess Sita, home to the stunning Janaki Mandir.', 'JKR', TRUE),
('Pashupatinath', 'city', 'Bagmati Province', 27.7105300, 85.3487500, 'One of the most sacred Hindu temples dedicated to Lord Shiva, located in Kathmandu.', NULL, FALSE),

-- Scenic Hill Stations
('Nagarkot', 'city', 'Bagmati Province', 27.7172100, 85.5203500, 'Famous for sunrise views over the Himalayas, including Mount Everest.', NULL, TRUE),
('Bandipur', 'city', 'Gandaki Province', 27.9459000, 84.4206000, 'A beautifully preserved Newari cultural village with mountain views.', NULL, TRUE),
('Dhulikhel', 'city', 'Bagmati Province', 27.6177100, 85.5449200, 'Known for traditional architecture and panoramic Himalayan views.', NULL, TRUE),

-- National Parks & Trekking Areas
('Everest Region', 'trekking_area', 'Koshi Province', 27.9881200, 86.9250000, 'The iconic Everest Base Camp and surrounding trekking routes.', NULL, TRUE),
('Annapurna Region', 'trekking_area', 'Gandaki Province', 28.5966800, 83.8202800, 'One of the most popular trekking circuits in the world.', NULL, TRUE),
('Chitwan National Park', 'national_park', 'Bagmati Province', 27.5291600, 84.3542000, 'First national park in Nepal, UNESCO World Heritage Site.', NULL, TRUE),
('Sagarmatha National Park', 'national_park', 'Koshi Province', 27.9620800, 86.9133400, 'Home to Mount Everest, a UNESCO World Heritage Site.', NULL, TRUE);

-- =====================================================
-- SEED DATA: AIRLINES
-- Domestic airlines operating in Nepal
-- =====================================================

INSERT INTO airlines (airline_name, airline_code, contact_number, email, is_active) VALUES
('Buddha Air', 'U4', '+977-1-5542494', 'info@buddhaair.com', TRUE),
('Yeti Airlines', 'YT', '+977-1-4465888', 'info@yetiairlines.com', TRUE),
('Shree Airlines', 'N9', '+977-1-4465726', 'info@shreeairlines.com', TRUE),
('Saurya Airlines', 'S9', '+977-1-4011101', 'info@sauryaairlines.com', TRUE),
('Tara Air', '7M', '+977-1-4220333', 'info@taraair.com', TRUE),
('Summit Air', 'SA', '+977-1-4465766', 'info@summitair.com.np', TRUE);

-- =====================================================
-- SEED DATA: DOMESTIC FLIGHTS
-- Sample flight routes
-- =====================================================

INSERT INTO domestic_flights (airline_id, flight_number, origin_location_id, destination_location_id, departure_time, arrival_time, duration_minutes, aircraft_type, total_seats, available_seats, base_price, currency, operates_on_days) VALUES
-- Kathmandu to Pokhara routes
(1, 'U4-505', 1, 4, '06:30:00', '07:00:00', 30, 'ATR 72', 70, 70, 5500.00, 'NPR', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(2, 'YT-691', 1, 4, '07:15:00', '07:45:00', 30, 'ATR 42', 48, 48, 5200.00, 'NPR', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(3, 'N9-201', 1, 4, '09:30:00', '10:00:00', 30, 'ATR 72', 70, 70, 5300.00, 'NPR', 'Mon,Wed,Fri,Sun'),

-- Kathmandu to Lukla routes (Everest)
(1, 'U4-201', 1, 6, '06:00:00', '06:40:00', 40, 'Twin Otter', 18, 18, 15000.00, 'NPR', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(5, '7M-201', 1, 6, '06:30:00', '07:10:00', 40, 'Twin Otter', 16, 16, 14500.00, 'NPR', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(5, '7M-301', 1, 6, '07:00:00', '07:40:00', 40, 'Twin Otter', 16, 16, 14500.00, 'NPR', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),

-- Kathmandu to Jomsom routes
(1, 'U4-401', 1, 8, '06:45:00', '07:30:00', 45, 'Twin Otter', 18, 18, 12000.00, 'NPR', 'Mon,Wed,Fri,Sun'),
(5, '7M-401', 1, 8, '07:15:00', '08:00:00', 45, 'Twin Otter', 16, 16, 11500.00, 'NPR', 'Tue,Thu,Sat'),

-- Pokhara to Jomsom routes
(1, 'U4-411', 4, 8, '06:30:00', '07:00:00', 30, 'Twin Otter', 18, 18, 8500.00, 'NPR', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(5, '7M-411', 4, 8, '07:00:00', '07:30:00', 30, 'Twin Otter', 16, 16, 8200.00, 'NPR', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');

-- =====================================================
-- SEED DATA: BUS OPERATORS
-- Major bus companies in Nepal
-- =====================================================

INSERT INTO bus_operators (operator_name, contact_number, rating, is_active) VALUES
('Green Line Tours', '+977-1-4780122', 4.5, TRUE),
('Golden Travels', '+977-1-4780111', 4.3, TRUE),
('Mountain Overland', '+977-1-4262088', 4.4, TRUE),
('Deluxe Tourist Bus Service', '+977-1-4262066', 4.2, TRUE),
('Shiva Parvati Travels', '+977-1-4265845', 4.0, TRUE);

-- =====================================================
-- SEED DATA: BUSES
-- Popular bus routes
-- =====================================================

INSERT INTO buses (operator_id, bus_number, origin_location_id, destination_location_id, departure_time, arrival_time, duration_minutes, bus_type, total_seats, available_seats, base_price, currency, amenities, operates_on_days) VALUES
-- Kathmandu to Pokhara routes
(1, 'GL-001', 1, 4, '07:00:00', '13:30:00', 390, 'tourist', 32, 32, 1500.00, 'NPR', 'AC,WiFi,RestRoom,Entertainment', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(2, 'GT-101', 1, 4, '07:30:00', '14:00:00', 390, 'deluxe', 28, 28, 1200.00, 'NPR', 'AC,RestRoom', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(3, 'MO-201', 1, 4, '08:00:00', '14:30:00', 390, 'tourist', 35, 35, 1400.00, 'NPR', 'AC,WiFi,Entertainment', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),

-- Kathmandu to Chitwan routes
(1, 'GL-002', 1, 10, '07:00:00', '12:00:00', 300, 'tourist', 32, 32, 1000.00, 'NPR', 'AC,WiFi,RestRoom', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(4, 'DT-301', 1, 10, '06:30:00', '11:30:00', 300, 'deluxe', 30, 30, 900.00, 'NPR', 'AC,RestRoom', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),

-- Kathmandu to Lumbini routes
(1, 'GL-003', 1, 12, '06:00:00', '14:00:00', 480, 'tourist', 35, 35, 1800.00, 'NPR', 'AC,WiFi,RestRoom,Meals', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(5, 'SP-401', 1, 12, '07:00:00', '15:00:00', 480, 'deluxe', 40, 40, 1500.00, 'NPR', 'AC,RestRoom', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),

-- Kathmandu to Janakpur routes
(2, 'GT-501', 1, 14, '06:30:00', '14:30:00', 480, 'deluxe', 35, 35, 1400.00, 'NPR', 'AC,RestRoom', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
(3, 'MO-601', 1, 14, '07:00:00', '15:00:00', 480, 'tourist', 32, 32, 1600.00, 'NPR', 'AC,WiFi,Entertainment', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');

-- =====================================================
-- SEED DATA: ADMIN USER
-- Default admin account (password: admin123 - must be changed!)
-- =====================================================

-- Password hash for 'admin123' using PHP password_hash with PASSWORD_BCRYPT
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified) VALUES
('admin@royalnepal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Royal', 'Admin', '+977-1-4000000', 'admin', TRUE, TRUE),
('vendor@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test', 'Vendor', '+977-9800000000', 'vendor', TRUE, TRUE),
('user@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test', 'User', '+977-9800000001', 'user', TRUE, TRUE);

-- =====================================================
-- SEED DATA: SAMPLE HOTELS
-- Hotels in major tourist destinations
-- =====================================================

INSERT INTO hotels (vendor_id, hotel_name, location_id, address, description, star_rating, hotel_type, amenities, contact_number, email) VALUES
-- Kathmandu Hotels
(2, 'Hotel Yak & Yeti', 1, 'Durbar Marg, Kathmandu', 'Luxury heritage hotel in the heart of Kathmandu with world-class amenities.', 5.0, 'hotel', 'WiFi,Restaurant,Bar,Pool,Spa,Gym,Parking,Airport_Transfer,Room_Service,Laundry', '+977-1-4248999', 'info@yakandyeti.com'),
(2, 'Kathmandu Guest House', 1, 'Thamel, Kathmandu', 'Historic budget-friendly hotel in the tourist hub of Thamel.', 3.0, 'guesthouse', 'WiFi,Restaurant,Parking,Room_Service', '+977-1-4700632', 'info@ktmgh.com'),

-- Pokhara Hotels
(2, 'Temple Tree Resort & Spa', 4, 'Gaurighat, Lakeside, Pokhara', 'Boutique resort with stunning lake and mountain views.', 4.5, 'resort', 'WiFi,Restaurant,Bar,Pool,Spa,Gym,Parking,Airport_Transfer,Room_Service,Laundry', '+977-61-465819', 'info@templetreepokhara.com'),
(2, 'Hotel Barahi', 4, 'Lakeside, Pokhara', 'Lakefront hotel offering panoramic views of Phewa Lake and the Annapurna range.', 4.0, 'hotel', 'WiFi,Restaurant,Bar,Gym,Parking,Room_Service', '+977-61-460617', 'info@hotelbarahi.com'),

-- Chitwan Hotels
(2, 'Jungle Villa Resort', 10, 'Sauraha, Chitwan', 'Eco-friendly resort near Chitwan National Park entrance.', 3.5, 'resort', 'WiFi,Restaurant,Pool,Parking,Airport_Transfer', '+977-56-580088', 'info@junglevilla.com'),

-- Lukla Teahouses
(2, 'Yeti Mountain Home Lukla', 6, 'Lukla, Solukhumbu', 'Comfortable teahouse for trekkers starting their Everest journey.', 3.0, 'teahouse', 'WiFi,Restaurant', '+977-1-4701212', 'info@yetimountainhome.com'),

-- Nagarkot Hotels
(2, 'Hotel Country Villa', 16, 'Nagarkot, Bhaktapur', 'Hilltop hotel offering breathtaking sunrise views of the Himalayas.', 3.5, 'hotel', 'WiFi,Restaurant,Parking,Room_Service', '+977-1-6680045', 'info@hotelcountryvilla.com');

-- =====================================================
-- SEED DATA: HOTEL ROOMS
-- Room types for the hotels
-- =====================================================

INSERT INTO hotel_rooms (hotel_id, room_type, description, capacity, total_rooms, available_rooms, base_price_per_night, currency, room_amenities) VALUES
-- Hotel Yak & Yeti rooms
(1, 'Deluxe Room', 'Spacious room with modern amenities and city views', 2, 50, 50, 15000.00, 'NPR', 'AC,TV,MiniBar,Safe'),
(1, 'Heritage Suite', 'Luxurious suite with traditional Nepali decor', 3, 20, 20, 25000.00, 'NPR', 'AC,TV,MiniBar,Balcony,Safe,Bathtub'),

-- Kathmandu Guest House rooms
(2, 'Standard Room', 'Clean and comfortable budget room', 2, 30, 30, 2500.00, 'NPR', 'TV'),
(2, 'Deluxe Room', 'Upgraded room with better amenities', 2, 15, 15, 4000.00, 'NPR', 'AC,TV'),

-- Temple Tree Resort rooms
(3, 'Garden View Room', 'Room overlooking tropical gardens', 2, 25, 25, 8000.00, 'NPR', 'AC,TV,Balcony'),
(3, 'Lake View Suite', 'Premium suite with Phewa Lake views', 3, 10, 10, 15000.00, 'NPR', 'AC,TV,MiniBar,Balcony,Bathtub'),

-- Hotel Barahi rooms
(4, 'Standard Room', 'Comfortable room with lake views', 2, 40, 40, 6500.00, 'NPR', 'AC,TV'),
(4, 'Executive Suite', 'Spacious suite with panoramic mountain views', 3, 15, 15, 12000.00, 'NPR', 'AC,TV,MiniBar,Balcony,Safe'),

-- Jungle Villa Resort rooms
(5, 'Safari Room', 'Jungle-themed room near the national park', 2, 20, 20, 4500.00, 'NPR', 'TV,Balcony'),

-- Yeti Mountain Home Lukla
(6, 'Twin Room', 'Basic teahouse room for trekkers', 2, 15, 15, 3000.00, 'NPR', 'Heater'),
(6, 'Deluxe Room', 'Upgraded teahouse room with better heating', 2, 8, 8, 4500.00, 'NPR', 'Heater,Mountain_View'),

-- Hotel Country Villa rooms
(7, 'Mountain View Room', 'Room with panoramic Himalayan views', 2, 25, 25, 5500.00, 'NPR', 'Heater,TV,Mountain_View');

-- =====================================================
-- SEED DATA: TOUR PACKAGES
-- Curated Nepal tour packages
-- =====================================================

INSERT INTO tour_packages (package_name, package_type, description, detailed_itinerary, duration_days, duration_nights, difficulty_level, group_size_min, group_size_max, base_price, currency, inclusions, exclusions, best_season) VALUES
('Everest Base Camp Trek', 'trekking', 'The ultimate Himalayan adventure to the base of the world\'s highest peak.', 'Day 1: Fly Kathmandu to Lukla, Trek to Phakding\nDay 2-3: Namche Bazaar acclimatization\nDay 4-8: Trek through Tengboche, Dingboche, Lobuche to Everest Base Camp\nDay 9-12: Return trek to Lukla\nDay 13: Fly back to Kathmandu', 13, 12, 'challenging', 1, 12, 125000.00, 'NPR', 'Domestic flights, Accommodation in teahouses, All meals during trek, Licensed guide and porter, National park permits, Travel insurance', 'International flights, Personal expenses, Tips, Alcohol', 'March-May, September-November'),

('Annapurna Circuit Trek', 'trekking', 'Complete circuit around the Annapurna massif crossing Thorong La Pass.', 'Comprehensive 15-day trek covering diverse landscapes from subtropical to alpine.', 15, 14, 'challenging', 2, 15, 95000.00, 'NPR', 'All accommodations, Meals during trek, Guide and porter, Permits, Ground transportation', 'Flights, Personal gear, Insurance, Tips', 'March-May, September-November'),

('Kathmandu Valley Heritage Tour', 'cultural', 'Explore the rich cultural heritage of Kathmandu Valley UNESCO sites.', 'Day 1: Kathmandu Durbar Square, Swayambhunath\nDay 2: Pashupatinath, Boudhanath\nDay 3: Bhaktapur Durbar Square\nDay 4: Patan Durbar Square, Patan Museum', 4, 3, 'easy', 1, 20, 25000.00, 'NPR', 'Hotel accommodation, All entrance fees, Professional guide, Private transportation, Breakfast', 'Lunch and dinner, Personal expenses, Tips', 'Year-round'),

('Chitwan Jungle Safari', 'wildlife', 'Experience the wilderness of Chitwan National Park with jungle safaris.', 'Day 1: Drive to Chitwan, Evening cultural program\nDay 2: Elephant safari, Canoe ride, Jungle walk\nDay 3: Jeep safari, Bird watching, Return to Kathmandu', 3, 2, 'easy', 2, 15, 18000.00, 'NPR', 'Full board accommodation, All safari activities, National park fees, Guide, Transportation', 'Alcohol, Personal expenses, Tips', 'October-March'),

('Lumbini Pilgrimage Tour', 'pilgrimage', 'Spiritual journey to the birthplace of Lord Buddha.', 'Day 1: Drive/Fly to Lumbini\nDay 2: Visit Maya Devi Temple, Ashoka Pillar, International monasteries\nDay 3: Tilaurakot and Kapilvastu exploration\nDay 4: Return to Kathmandu', 4, 3, 'easy', 1, 20, 22000.00, 'NPR', 'Accommodation, Transportation, Guide, Entrance fees, Breakfast', 'Lunch and dinner, Personal expenses', 'October-March'),

('Pokhara Adventure Package', 'adventure', 'Action-packed adventure activities in Nepal\'s adventure capital.', 'Day 1: Paragliding, Lakeside exploration\nDay 2: Ultra-light flight, Peace Pagoda visit\nDay 3: Sarangkot sunrise, Zip-lining, Boating', 3, 2, 'moderate', 2, 10, 28000.00, 'NPR', 'Hotel accommodation, All adventure activities, Transportation, Guide, Breakfast', 'Lunch and dinner, Personal expenses, Insurance', 'September-May'),

('Upper Mustang Trek', 'combined', 'Journey to the forbidden kingdom with its unique Tibetan culture.', 'Explore the ancient walled city of Lo Manthang and barren high-altitude landscapes.', 12, 11, 'moderate', 2, 12, 145000.00, 'NPR', 'All permits including restricted area, Teahouse accommodation, All meals, Guide and porter, Flights', 'Personal gear, Insurance, Tips, Alcohol', 'March-November'),

('Poon Hill Sunrise Trek', 'trekking', 'Short and scenic trek offering stunning Annapurna panorama views.', 'Day 1: Drive to Nayapul, Trek to Tikhedhunga\nDay 2: Trek to Ghorepani\nDay 3: Poon Hill sunrise, Trek to Tadapani\nDay 4: Trek to Ghandruk\nDay 5: Return to Pokhara', 5, 4, 'moderate', 1, 15, 32000.00, 'NPR', 'Teahouse accommodation, All meals, Guide, Permits, Transportation', 'Personal expenses, Tips, Insurance', 'October-November, March-April');

-- =====================================================
-- SEED DATA: PACKAGE LOCATIONS
-- Link packages to locations
-- =====================================================

INSERT INTO package_locations (package_id, location_id, day_number, sequence_order) VALUES
-- Everest Base Camp Trek locations
(1, 1, 1, 1), (1, 6, 1, 2), (1, 5, 3, 3), (1, 19, 8, 4),

-- Annapurna Circuit locations
(2, 1, 1, 1), (2, 4, 2, 2), (2, 20, 8, 3),

-- Kathmandu Valley Heritage Tour
(3, 1, 1, 1), (3, 2, 3, 2), (3, 3, 4, 3),

-- Chitwan Jungle Safari
(4, 1, 1, 1), (4, 9, 1, 2), (4, 21, 2, 3),

-- Lumbini Pilgrimage Tour
(5, 1, 1, 1), (5, 12, 2, 2),

-- Pokhara Adventure Package
(6, 4, 1, 1),

-- Upper Mustang Trek
(7, 1, 1, 1), (7, 4, 2, 2), (7, 7, 5, 3),

-- Poon Hill Trek
(8, 4, 1, 1), (8, 20, 3, 2);

-- =====================================================
-- SEED DATA: PLACES
-- Discover Nepalese attractions
-- =====================================================

INSERT INTO places (place_name, location_id, category, description, history, best_time_to_visit, entry_fee, currency, unesco_site, altitude_meters) VALUES
('Pashupatinath Temple', 1, 'religious', 'One of the most sacred Hindu temples dedicated to Lord Shiva, located on the banks of Bagmati River.', 'The temple dates back to 400 CE and is a masterpiece of Hindu architecture with a golden spire and silver doors.', 'Year-round', 1000.00, 'NPR', TRUE, 1350),

('Boudhanath Stupa', 1, 'religious', 'One of the largest Buddhist stupas in the world and a center of Tibetan Buddhism in Nepal.', 'Built in the 14th century, it is one of the holiest Buddhist sites in Nepal.', 'Year-round', 400.00, 'NPR', TRUE, 1350),

('Swayambhunath (Monkey Temple)', 1, 'religious', 'Ancient religious complex atop a hill with panoramic views of Kathmandu Valley.', 'Dating back over 2,500 years, it is one of the oldest religious sites in Nepal.', 'Year-round', 200.00, 'NPR', TRUE, 1415),

('Kathmandu Durbar Square', 1, 'heritage_site', 'Historic square with palaces, courtyards and temples from the Malla period.', 'Former royal palace complex of the Kathmandu Kingdom, showcasing Newari architecture.', 'October-March', 1000.00, 'NPR', TRUE, 1330),

('Bhaktapur Durbar Square', 2, 'heritage_site', 'Ancient royal palace complex with stunning medieval architecture and art.', 'Center of the Bhaktapur Kingdom until the late 18th century.', 'October-March', 1500.00, 'NPR', TRUE, 1401),

('Patan Durbar Square', 3, 'heritage_site', 'Former royal palace with intricate wood carvings and metalwork.', 'Heart of the ancient city of Lalitpur, showcasing finest Newari craftsmanship.', 'October-March', 1000.00, 'NPR', TRUE, 1330),

('Phewa Lake', 4, 'natural', 'Stunning freshwater lake offering boating with views of Annapurna and Machhapuchhre.', 'Second largest lake in Nepal, a popular tourist destination since the 1960s.', 'October-May', 0.00, 'NPR', FALSE, 742),

('Sarangkot Viewpoint', 4, 'viewpoint', 'Famous viewpoint for spectacular sunrise over the Annapurna and Dhaulagiri ranges.', 'Traditional village turned popular tourist viewpoint for paragliding and sunrise.', 'October-March', 0.00, 'NPR', FALSE, 1592),

('Maya Devi Temple', 12, 'religious', 'The exact birthplace of Lord Buddha, marked by an ancient stone slab.', 'Archaeological excavations reveal structures dating back to the 3rd century BCE.', 'October-March', 0.00, 'NPR', TRUE, 150),

('Chitwan National Park', 9, 'national_park', 'First national park of Nepal, home to endangered one-horned rhinoceros and Bengal tigers.', 'Established in 1973, became UNESCO World Heritage Site in 1984.', 'October-March', 1500.00, 'NPR', TRUE, 150),

('Sagarmatha National Park', 19, 'national_park', 'Home to Mount Everest and several of the world\'s highest peaks.', 'Established in 1976, covers the upper catchment of the Dudh Kosi river system.', 'March-May, September-November', 3000.00, 'NPR', TRUE, 2845),

('Annapurna Conservation Area', 20, 'national_park', 'Largest protected area in Nepal with diverse ecosystems and cultures.', 'Established in 1986, managed by National Trust for Nature Conservation.', 'March-May, September-November', 3000.00, 'NPR', FALSE, 1000),

('Nagarkot Hill Station', 16, 'viewpoint', 'Hill station famous for sunrise and sunset views over the Himalayas.', 'Former summer retreat for Nepali royalty, now popular tourist destination.', 'October-March', 0.00, 'NPR', FALSE, 2195),

('Muktinath Temple', 13, 'religious', 'Sacred pilgrimage site for both Hindus and Buddhists at high altitude.', 'Ancient temple complex with 108 water spouts and eternal flames.', 'March-November', 0.00, 'NPR', FALSE, 3710),

('Janaki Mandir', 14, 'religious', 'Beautiful Hindu temple dedicated to Goddess Sita in Mughal-Rajput architecture.', 'Built in 1910 by Queen Vrisha Bhanu, marks birthplace of Goddess Sita.', 'October-March', 0.00, 'NPR', FALSE, 98);

-- =====================================================
-- END OF SEED DATA
-- =====================================================
