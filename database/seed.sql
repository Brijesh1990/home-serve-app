-- ============================================================================
-- HomeServe – Home Services Booking SaaS Platform
-- Comprehensive Seed Data (MySQL 8.0+)
-- Demo Password for all seeded users: Password@123
-- Bcrypt Hash: $2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE homeserve_db;

-- ----------------------------------------------------------------------------
-- 1. Seed Users (Admin, Customers, Service Providers, Technicians)
-- ----------------------------------------------------------------------------
INSERT INTO users (id, full_name, email, phone, password_hash, role, avatar_url, is_active, is_email_verified, created_at, updated_at) VALUES
(1, 'Arjun Mehta (Platform Admin)', 'admin@homeserve.com', '+919800000001', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', TRUE, TRUE, NOW(), NOW()),
(2, 'Priya Sharma', 'priya.sharma@example.com', '+919811110001', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'customer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', TRUE, TRUE, NOW(), NOW()),
(3, 'Rohan Verma', 'rohan.verma@example.com', '+919811110002', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'customer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', TRUE, TRUE, NOW(), NOW()),
(4, 'Ananya Nair', 'ananya.nair@example.com', '+919811110003', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'customer', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', TRUE, TRUE, NOW(), NOW()),
(5, 'Vikramaditya Joshi', 'vikram@voltcraft.in', '+919822220001', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'provider', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', TRUE, TRUE, NOW(), NOW()),
(6, 'Rajeshwari Kulkarni', 'rajeshwari@aquaflow.in', '+919822220002', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'provider', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', TRUE, TRUE, NOW(), NOW()),
(7, 'Siddharth Malhotra', 'siddharth@sparkleclean.in', '+919822220003', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'provider', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', TRUE, TRUE, NOW(), NOW()),
(8, 'Karthik Subramanian', 'karthik@coolbreeze.in', '+919822220004', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'provider', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', TRUE, TRUE, NOW(), NOW()),
(9, 'Manoj Tiwari', 'manoj.tech@voltcraft.in', '+919833330001', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'technician', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', TRUE, TRUE, NOW(), NOW()),
(10, 'Suresh Babu', 'suresh.tech@aquaflow.in', '+919833330002', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'technician', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200', TRUE, TRUE, NOW(), NOW()),
(11, 'Deepak Solanki', 'deepak.tech@sparkleclean.in', '+919833330003', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'technician', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200', TRUE, TRUE, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 2. Seed Customers
-- ----------------------------------------------------------------------------
INSERT INTO customers (id, user_id, loyalty_points, preferred_language, emergency_contact, created_at, updated_at) VALUES
(1, 2, 450, 'en', '+919811119991', NOW(), NOW()),
(2, 3, 210, 'en', '+919811119992', NOW(), NOW()),
(3, 4, 120, 'en', '+919811119993', NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 3. Seed Service Providers
-- ----------------------------------------------------------------------------
INSERT INTO service_providers (id, user_id, business_name, business_description, experience_years, verification_status, id_document_url, license_number, rejection_reason, avg_rating, total_reviews, total_completed_jobs, commission_rate, is_available, created_at, updated_at) VALUES
(1, 5, 'VoltCraft Electrical & Smart Home Solutions', 'ISO-certified residential & commercial electrical contractors, inverter specialists, and smart home automation engineers.', 9, 'verified', 'https://res.cloudinary.com/homeserve/kyc/voltcraft_gst.pdf', 'MH-ELEC-2017-8841', NULL, 4.85, 42, 128, 12.0, TRUE, NOW(), NOW()),
(2, 6, 'AquaFlow Plumbing & Hydro Engineering', '24x7 emergency leak detection, bathroom fittings, water tank sanitation, and hydro-jetting specialists.', 7, 'verified', 'https://res.cloudinary.com/homeserve/kyc/aquaflow_gst.pdf', 'KA-PLMB-2019-3319', NULL, 4.72, 31, 94, 15.0, TRUE, NOW(), NOW()),
(3, 7, 'SparkleClean Hygiene & Pest Control Experts', 'Eco-friendly deep home sanitation, sofa shampooing, kitchen degreasing, and herbal pest control.', 6, 'verified', 'https://res.cloudinary.com/homeserve/kyc/sparkle_gst.pdf', 'MH-CLN-2020-5590', NULL, 4.91, 68, 215, 10.0, TRUE, NOW(), NOW()),
(4, 8, 'CoolBreeze HVAC & Appliance Care', 'Authorized multi-brand split/window AC repair, gas refilling, refrigerator, and washing machine repair.', 5, 'pending', 'https://res.cloudinary.com/homeserve/kyc/coolbreeze_gst.pdf', 'DL-HVAC-2021-1120', NULL, 4.60, 12, 34, 15.0, TRUE, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 4. Seed Technicians
-- ----------------------------------------------------------------------------
INSERT INTO technicians (id, user_id, provider_id, specialization, experience_years, id_proof_url, availability_status, avg_rating, total_jobs_completed, is_active, created_at, updated_at) VALUES
(1, 9, 1, 'Senior Licensed Electrician & MCB Diagnostics', 6, 'https://res.cloudinary.com/homeserve/tech/manoj_id.pdf', 'available', 4.90, 74, TRUE, NOW(), NOW()),
(2, 10, 2, 'Master Plumber & Concealed Pipeline Specialist', 5, 'https://res.cloudinary.com/homeserve/tech/suresh_id.pdf', 'available', 4.75, 52, TRUE, NOW(), NOW()),
(3, 11, 3, 'Deep Sanitation & Mechanized Scrubbing Lead', 4, 'https://res.cloudinary.com/homeserve/tech/deepak_id.pdf', 'busy', 4.88, 91, TRUE, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 5. Seed Addresses
-- ----------------------------------------------------------------------------
INSERT INTO addresses (id, user_id, label, address_line1, address_line2, city, state, postal_code, country, latitude, longitude, is_default, created_at, updated_at) VALUES
(1, 2, 'Home', 'Flat 1204, Emerald Isle Tower B, Powai', 'Opposite L&T Business Park', 'Mumbai', 'Maharashtra', '400076', 'India', 19.1176, 72.9060, TRUE, NOW(), NOW()),
(2, 2, 'Office', 'Suite 402, Pinnacle Corporate Park, BKC', 'Bandra East', 'Mumbai', 'Maharashtra', '400051', 'India', 19.0653, 72.8681, FALSE, NOW(), NOW()),
(3, 3, 'Home', 'Villa 18, Palm Meadows Phase 2, Whitefield', 'Ramagondanahalli', 'Bengaluru', 'Karnataka', '560066', 'India', 12.9698, 77.7500, TRUE, NOW(), NOW()),
(4, 4, 'Home', 'B-702, Pinnac Memories, Kothrud', 'Near Karishma Society', 'Pune', 'Maharashtra', '411038', 'India', 18.5074, 73.8077, TRUE, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 6. Seed 10 Service Categories
-- ----------------------------------------------------------------------------
INSERT INTO service_categories (id, parent_id, name, slug, description, icon_name, image_url, is_active, display_order, created_at, updated_at) VALUES
(1, NULL, 'Electrical Services', 'electrical-services', 'Complete wiring, switchboard upgrades, fan installation, MCB circuit repair, and inverter setup.', 'Zap', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', TRUE, 1, NOW(), NOW()),
(2, NULL, 'Plumbing Services', 'plumbing-services', 'Leakage repair, tap and mixer installation, blockages, pipe fitting, and overhead water tank cleaning.', 'Droplets', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600', TRUE, 2, NOW(), NOW()),
(3, NULL, 'AC Repair & Maintenance', 'ac-repair-maintenance', 'Split and window AC foam-jet servicing, gas charging, PCB repair, and uninstallation/installation.', 'Wind', 'https://images.unsplash.com/photo-1631545806609-35d4ae490431?w=600', TRUE, 3, NOW(), NOW()),
(4, NULL, 'Home Cleaning', 'home-cleaning', 'Routine bathroom cleaning, kitchen degreasing, sofa shampooing, and carpet dry vacuuming.', 'Sparkles', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600', TRUE, 4, NOW(), NOW()),
(5, NULL, 'Painting Services', 'painting-services', 'Interior and exterior wall painting, waterproof putty coating, texture walls, and wood polishing.', 'Paintbrush', 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600', TRUE, 5, NOW(), NOW()),
(6, NULL, 'Carpentry Services', 'carpentry-services', 'Custom furniture assembly, modular kitchen hinge repair, door lock replacement, and wooden partitions.', 'Hammer', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600', TRUE, 6, NOW(), NOW()),
(7, NULL, 'Appliance Repair', 'appliance-repair', 'Washing machine, refrigerator, microwave oven, water purifier (RO), and geyser diagnostics & repair.', 'Cpu', 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600', TRUE, 7, NOW(), NOW()),
(8, NULL, 'Pest Control', 'pest-control', 'Odorless cockroach gel treatment, termite control, bedbug eradication, and mosquito fogging.', 'ShieldAlert', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600', TRUE, 8, NOW(), NOW()),
(9, NULL, 'Deep Cleaning', 'deep-cleaning', 'Full 1BHK to 4BHKvilla mechanized floor scrubbing, steam sanitization, and post-renovation cleanup.', 'SprayCan', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600', TRUE, 9, NOW(), NOW()),
(10, NULL, 'Home Maintenance', 'home-maintenance', 'Annual preventive home inspection, curtain rod drilling, TV wall mounting, and minor civil masonry.', 'Wrench', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600', TRUE, 10, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 7. Seed 16 Services across the 10 Categories
-- ----------------------------------------------------------------------------
INSERT INTO services (id, category_id, name, slug, short_description, description, base_price, duration_minutes, image_url, inclusions_json, exclusions_json, is_featured, is_active, created_at, updated_at) VALUES
(1, 1, 'MCB & Fuse Distribution Board Upgrade', 'mcb-fuse-distribution-board-upgrade', 'Complete inspection and replacement of faulty MCB/RCCB breakers with load balancing.', 'Certified electrician inspects short-circuit triggers, replaces damaged MCB/isolator units, tightens busbar terminals, and conducts thermal load testing.', 699.00, 60, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', '["Circuit load testing", "Terminal tightening", "Up to 4-pole MCB installation labor", "30-day service warranty"]', '["Cost of new MCB/RCCB hardware", "Concealed wall chiseling"]', TRUE, TRUE, NOW(), NOW()),
(2, 1, 'Smart Ceiling Fan & Chandelier Installation', 'smart-ceiling-fan-chandelier-installation', 'Safe mounting, earthing verification, and remote/Wi-Fi pairing for fans and lights.', 'Assembly of fan blades or chandelier crystals, anchor bolt safety check, regulator wiring, and zero-wobble balancing.', 449.00, 45, 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600', '["Fan/Light assembly", "Wiring connection", "Zero-wobble balancing"]', '["Anchor fastener hardware if missing", "False ceiling reinforcement"]', FALSE, TRUE, NOW(), NOW()),
(3, 2, 'Concealed Bathroom Pipe Leak & Mixer Repair', 'concealed-bathroom-pipe-leak-mixer-repair', 'Non-destructive pressure diagnosis, cartridge replacement, and waterproof sealing.', 'Resolves dripping diverters, low water pressure in showers, and concealed joint seepage using pressure gauges and Teflon/epoxy sealing.', 599.00, 60, 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600', '["Pressure gauge leak detection", "Mixer cartridge replacement labor", "Post-repair cleanliness"]', '["Spare taps/cartridges", "Wall tile replacement"]', TRUE, TRUE, NOW(), NOW()),
(4, 2, 'Drainage Hydro-Jetting & Blockage Clearance', 'drainage-hydro-jetting-blockage-clearance', 'High-pressure clearing of choked kitchen sinks, floor traps, and main bathroom lines.', 'Uses motorized spring auger and hydro-jetting equipment to remove grease, hair, and scale buildup without damaging PVC pipes.', 799.00, 75, 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600', '["Motorized spring auger clearance", "Eco-safe enzyme flush", "Flow rate verification"]', '["Excavation of underground chambers"]', FALSE, TRUE, NOW(), NOW()),
(5, 3, 'Split AC Foam-Jet Deep Service', 'split-ac-foam-jet-deep-service', '2x deeper cooling coil, blower wheel, and drain tray cleaning using jacketed foam-jet pump.', 'Protects indoor walls with a waterproof spill jacket while high-pressure foam removes stubborn dust and mold from evaporator fins and outdoor condenser.', 649.00, 60, 'https://images.unsplash.com/photo-1631545806609-35d4ae490431?w=600', '["Indoor evaporator coil foam wash", "Outdoor condenser high-pressure wash", "Gas pressure & amp check", "Drain pipe flush"]', '["Refrigerant gas top-up", "Spare parts"]', TRUE, TRUE, NOW(), NOW()),
(6, 3, 'AC Refrigerant Gas Refill (R32 / R410A)', 'ac-refrigerant-gas-refill', 'Nitrogen leak testing, brazing of pinholes, vacuuming, and 100% pure refrigerant charging.', 'Complete restoration of cooling efficiency including flare nut tightening, vacuum pump moisture removal, and full gas recharge.', 2499.00, 90, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600', '["Nitrogen pressure test", "Brazing up to 2 joints", "Full R32/R410A gas charge", "60-day leak warranty"]', '["Compressor replacement", "Copper coil replacement"]', FALSE, TRUE, NOW(), NOW()),
(7, 4, 'Intense Bathroom & Tile Descaling Package (2 Bathrooms)', 'intense-bathroom-tile-descaling', 'Hard-water stain removal, grouting scrub, WC sanitization, and chrome fixture polishing.', 'Hospital-grade biodegradable descalers combined with rotary hand scrubbers restore tiles, glass partitions, exhaust fans, and sanitaryware.', 899.00, 120, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600', '["Floor & wall tile descaling", "WC & washbasin steam sanitization", "Mirror & glass partition polishing"]', '["Paint stain removal", "Ceiling mold repainting"]', TRUE, TRUE, NOW(), NOW()),
(8, 4, '5-Seater Sofa Wet Shampooing & Vacuuming', 'sofa-wet-shampooing-vacuuming', 'Dry HEPA extraction, fabric-safe foam shampooing, and wet-vacuum moisture extraction.', 'Removes food spills, dust mites, and pet odors from fabric or leatherette sofas using Karcher injection-extraction machines.', 1199.00, 90, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', '["HEPA dry vacuuming", "Foam shampoo scrubbing", "Wet extraction & deodorizing"]', '["Ink/dye permanent stain guarantee"]', FALSE, TRUE, NOW(), NOW()),
(9, 5, 'Express 1-Room Interior Repainting & Putty Touchup', 'express-single-room-interior-repainting', 'Dust-free mechanized sanding, crack filling, 2 coats of low-VOC premium emulsion.', 'Laser area measurement, furniture masking with plastic sheets, crack filling, primer application, and roller finish.', 4999.00, 480, 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600', '["Complete furniture masking", "Minor crack filling", "2 coats premium emulsion", "Post-painting cleanup"]', '["Dampness waterproofing treatment", "Ceiling false-work"]', TRUE, TRUE, NOW(), NOW()),
(10, 6, 'Modular Kitchen Hinge & Drawer Channel Overhaul', 'modular-kitchen-hinge-channel-overhaul', 'Alignment and replacement of soft-close hydraulic hinges and telescopic drawer channels.', 'Fixes sagging cabinet shutters, jammed cutlery drawers, and loose handles across up to 8 kitchen modules.', 699.00, 75, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600', '["Adjustment of up to 8 shutters", "Channel lubrication & alignment", "Handle tightening"]', '["Cost of new Hettich/Hafele hinges"]', FALSE, TRUE, NOW(), NOW()),
(11, 7, 'Front-Load Washing Machine Complete Diagnostics & Repair', 'front-load-washing-machine-repair', 'Drum bearing check, drain pump cleaning, door lock switch & PCB error code resolution.', 'Trained appliance engineer diagnoses E10/E20/UE errors, clears coin traps, and tests spin RPM stability.', 499.00, 60, 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600', '["Complete 18-point diagnostic", "Filter & coin-trap cleaning", "Labor for 1 component replacement"]', '["Cost of OEM spare parts"]', TRUE, TRUE, NOW(), NOW()),
(12, 7, 'RO Water Purifier Full Service & Filter Kit Replacement', 'ro-water-purifier-full-service', 'TDS calibration, membrane housing sanitization, and sediment/carbon filter replacement.', 'Ensures safe drinking water with digital TDS meter verification, booster pump pressure check, and UV lamp inspection.', 1499.00, 60, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600', '["Sediment & pre-carbon filter included", "TDS calibration", "Internal tubing sanitization"]', '["RO Membrane replacement cost"]', FALSE, TRUE, NOW(), NOW()),
(13, 8, 'Odorless Cockroach & Ant Herbal Gel Treatment (2BHK/3BHK)', 'odorless-cockroach-ant-gel-treatment', 'Bayer-certified fipronil gel baiting + residual spray in drains without vacating kitchen.', 'Child and pet-friendly treatment targeting hinge corners, appliance motors, and under-sink crevices with 90-day protection.', 1099.00, 60, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', '["Bayer gel bait application", "Drain & balcony spray", "90-day free re-service guarantee"]', '["Termite drilling", "Bedbug steam treatment"]', TRUE, TRUE, NOW(), NOW()),
(14, 9, 'Full Occupied Home Mechanized Deep Cleaning (2BHK)', 'full-home-mechanized-deep-cleaning-2bhk', 'End-to-end floor scrubbing, kitchen chimney/cabinet degreasing, bathroom descaling & balcony wash.', 'A 3-member crew equipped with single-disc floor scrubbers, steam sanitizers, and industrial vacuums transforms every corner of your 2BHK home.', 3499.00, 300, 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600', '["Single-disc floor scrubbing", "All bathrooms & kitchen deep clean", "Fans, windows, switchboards & balconies"]', '["Inside wardrobe organizing", "Chandelier crystal dismantling"]', TRUE, TRUE, NOW(), NOW()),
(15, 10, 'Smart TV Wall Mounting & Concealed Cable Management', 'smart-tv-wall-mounting-cable-management', 'Spirit-level precision mounting for 32" to 75" LED/OLED TVs with PVC conduit dressing.', 'Heavy-duty anchor bolt drilling, bracket installation, soundbar alignment, and neat HDMI/power cord concealing.', 549.00, 45, 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600', '["Precision spirit-level drilling", "Soundbar alignment", "1 meter PVC cable casing"]', '["Wall bracket hardware cost"]', FALSE, TRUE, NOW(), NOW()),
(16, 10, 'Complete Drill & Hang Handyman Pack (Up to 8 Points)', 'complete-drill-and-hang-handyman-pack', 'Curtain rods, bathroom accessories, wall clocks, paintings, and mirror hanging in one visit.', 'Equipped with Bosch hammer drill and dust-collector attachment for clean installations on brick, concrete, or tiled walls.', 499.00, 60, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600', '["Up to 8 drilling points", "Rawl plugs & standard screws included", "Laser level alignment"]', '["Core cutting through RCC beams"]', FALSE, TRUE, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 8. Seed Provider Services
-- ----------------------------------------------------------------------------
INSERT INTO provider_services (id, provider_id, service_id, custom_price, custom_duration_minutes, is_active, created_at) VALUES
(1, 1, 1, 699.00, 60, TRUE, NOW()),
(2, 1, 2, 449.00, 45, TRUE, NOW()),
(3, 1, 15, 549.00, 45, TRUE, NOW()),
(4, 1, 16, 499.00, 60, TRUE, NOW()),
(5, 2, 3, 599.00, 60, TRUE, NOW()),
(6, 2, 4, 799.00, 75, TRUE, NOW()),
(7, 2, 12, 1499.00, 60, TRUE, NOW()),
(8, 3, 7, 899.00, 120, TRUE, NOW()),
(9, 3, 8, 1199.00, 90, TRUE, NOW()),
(10, 3, 13, 1099.00, 60, TRUE, NOW()),
(11, 3, 14, 3499.00, 300, TRUE, NOW()),
(12, 4, 5, 649.00, 60, TRUE, NOW()),
(13, 4, 6, 2499.00, 90, TRUE, NOW()),
(14, 4, 11, 499.00, 60, TRUE, NOW());

-- ----------------------------------------------------------------------------
-- 9. Seed Service Areas
-- ----------------------------------------------------------------------------
INSERT INTO service_areas (id, provider_id, city, state, postal_code, service_radius_km, is_active, created_at) VALUES
(1, 1, 'Mumbai', 'Maharashtra', '400076', 20.0, TRUE, NOW()),
(2, 1, 'Mumbai', 'Maharashtra', '400051', 20.0, TRUE, NOW()),
(3, 2, 'Bengaluru', 'Karnataka', '560066', 25.0, TRUE, NOW()),
(4, 2, 'Mumbai', 'Maharashtra', '400076', 15.0, TRUE, NOW()),
(5, 3, 'Mumbai', 'Maharashtra', '400076', 25.0, TRUE, NOW()),
(6, 3, 'Pune', 'Maharashtra', '411038', 20.0, TRUE, NOW()),
(7, 4, 'Mumbai', 'Maharashtra', '400076', 20.0, TRUE, NOW());

-- ----------------------------------------------------------------------------
-- 10. Seed Provider Working Hours (0=Monday .. 6=Sunday)
-- ----------------------------------------------------------------------------
INSERT INTO provider_working_hours (provider_id, day_of_week, start_time, end_time, is_closed, created_at) VALUES
(1, 0, '09:00', '19:00', FALSE, NOW()),
(1, 1, '09:00', '19:00', FALSE, NOW()),
(1, 2, '09:00', '19:00', FALSE, NOW()),
(1, 3, '09:00', '19:00', FALSE, NOW()),
(1, 4, '09:00', '19:00', FALSE, NOW()),
(1, 5, '09:00', '18:00', FALSE, NOW()),
(1, 6, '10:00', '16:00', FALSE, NOW()),
(2, 0, '08:00', '20:00', FALSE, NOW()),
(2, 1, '08:00', '20:00', FALSE, NOW()),
(2, 2, '08:00', '20:00', FALSE, NOW()),
(2, 3, '08:00', '20:00', FALSE, NOW()),
(2, 4, '08:00', '20:00', FALSE, NOW()),
(2, 5, '08:00', '20:00', FALSE, NOW()),
(2, 6, '00:00', '00:00', TRUE, NOW()),
(3, 0, '08:30', '18:30', FALSE, NOW()),
(3, 1, '08:30', '18:30', FALSE, NOW()),
(3, 2, '08:30', '18:30', FALSE, NOW()),
(3, 3, '08:30', '18:30', FALSE, NOW()),
(3, 4, '08:30', '18:30', FALSE, NOW()),
(3, 5, '08:30', '18:30', FALSE, NOW()),
(3, 6, '09:00', '17:00', FALSE, NOW());

-- ----------------------------------------------------------------------------
-- 11. Seed Availability Slots
-- ----------------------------------------------------------------------------
INSERT INTO availability_slots (id, provider_id, slot_date, start_time, end_time, is_booked, created_at) VALUES
(1, 1, CURDATE(), '10:00:00', '11:00:00', TRUE, NOW()),
(2, 1, CURDATE(), '12:00:00', '13:00:00', FALSE, NOW()),
(3, 1, CURDATE(), '15:00:00', '16:00:00', FALSE, NOW()),
(4, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '11:00:00', TRUE, NOW()),
(5, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '15:00:00', FALSE, NOW()),
(6, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', '12:00:00', TRUE, NOW()),
(7, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', '11:00:00', FALSE, NOW()),
(8, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', '14:00:00', TRUE, NOW()),
(9, 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00:00', '14:00:00', FALSE, NOW());

-- ----------------------------------------------------------------------------
-- 12. Seed Coupons
-- ----------------------------------------------------------------------------
INSERT INTO coupons (id, code, title, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, used_count, valid_from, valid_until, is_active, created_at, updated_at) VALUES
(1, 'WELCOME20', '20% Off First Home Service Booking', 'Flat 20% discount up to ₹300 on your first HomeServe booking above ₹499.', 'percentage', 20.0, 499.0, 300.0, 500, 14, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 180 DAY), TRUE, NOW(), NOW()),
(2, 'SUMMER15', '15% Off AC & Cooling Services', 'Beat the heat with 15% off up to ₹400 on AC Foam-Jet Servicing and Deep Cleaning.', 'percentage', 15.0, 599.0, 400.0, 300, 8, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 90 DAY), TRUE, NOW(), NOW()),
(3, 'HOME500', 'Flat ₹500 Off Deep Cleaning & Painting', 'Instant ₹500 savings on full-home deep cleaning or interior painting orders above ₹2500.', 'fixed', 500.0, 2500.0, 500.0, 200, 5, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 120 DAY), TRUE, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 13. Seed Bookings (Across Completed, In Progress, Provider Assigned, Confirmed, Pending)
-- ----------------------------------------------------------------------------
INSERT INTO bookings (
    id, booking_reference, customer_id, provider_id, service_id, address_id,
    appointment_date, appointment_time, status, problem_description, reference_image_url,
    base_amount, discount_amount, tax_amount, total_amount, commission_amount, provider_earning_amount,
    coupon_code, cancellation_reason, cancelled_by_role, created_at, updated_at
) VALUES
(1, 'HS-2026-10001', 1, 1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '10:00 AM', 'Completed',
 'Main distribution board MCB trips whenever both AC units run simultaneously.',
 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500',
 699.00, 139.80, 100.66, 659.86, 67.10, 492.10, 'WELCOME20', NULL, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),

(2, 'HS-2026-10002', 1, 3, 14, 1, CURDATE(), '09:00 AM', 'In Progress',
 'Full 2BHK deep cleaning before family festival gathering. Focus on kitchen chimney and balcony.',
 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500',
 3499.00, 500.00, 539.82, 3538.82, 299.90, 2699.10, 'HOME500', NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),

(3, 'HS-2026-10003', 2, 2, 3, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00 AM', 'Provider Assigned',
 'Master bathroom concealed shower diverter leaking continuously and low hot water flow.',
 NULL,
 599.00, 0.00, 107.82, 706.82, 89.85, 509.15, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

(4, 'HS-2026-10004', 3, 1, 2, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '02:00 PM', 'Confirmed',
 'Install 2 new BLDC Atomberg ceiling fans in living room and bedroom.',
 NULL,
 898.00, 134.70, 137.39, 900.69, 91.60, 671.70, 'SUMMER15', NULL, NULL, NOW(), NOW()),

(5, 'HS-2026-10005', 2, 3, 13, 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00 AM', 'Pending',
 'Need herbal gel treatment for kitchen cabinets and utility room drains.',
 NULL,
 1099.00, 0.00, 197.82, 1296.82, 109.90, 989.10, NULL, NULL, NULL, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 14. Seed Booking Assignments
-- ----------------------------------------------------------------------------
INSERT INTO booking_assignments (id, booking_id, technician_id, assigned_by_user_id, assignment_status, arrival_time, start_time, completion_time, completion_remarks, created_at, updated_at) VALUES
(1, 1, 1, 5, 'Completed', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 'Replaced faulty 32A C-curve MCB, balanced phase load, and verified thermal stability.', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 2, 3, 7, 'In Progress', NOW(), NOW(), NULL, 'Floor scrubbing completed in living room; kitchen degreasing in progress.', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(3, 3, 2, 6, 'Accepted', NULL, NULL, NULL, NULL, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 15. Seed Booking Images
-- ----------------------------------------------------------------------------
INSERT INTO booking_images (id, booking_id, uploaded_by_user_id, image_type, image_url, caption, created_at) VALUES
(1, 1, 2, 'reference', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', 'Charred wire near main MCB switchboard', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 1, 9, 'before', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', 'Old overloaded single-pole breaker setup', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 1, 9, 'after', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600', 'Upgraded Legrand MCB distribution board neatly dressed', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 2, 11, 'before', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600', 'Kitchen chimney grease buildup prior to steam clean', NOW());

-- ----------------------------------------------------------------------------
-- 16. Seed Booking Status History
-- ----------------------------------------------------------------------------
INSERT INTO booking_status_history (id, booking_id, old_status, new_status, changed_by_user_id, notes, created_at) VALUES
(1, 1, NULL, 'Pending', 2, 'Booking created by customer Priya Sharma', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 1, 'Pending', 'Confirmed', 5, 'Provider VoltCraft accepted the booking', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 1, 'Confirmed', 'Provider Assigned', 5, 'Assigned Senior Electrician Manoj Tiwari', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 1, 'Provider Assigned', 'In Progress', 9, 'Technician arrived on site and started diagnostics', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 1, 'In Progress', 'Completed', 9, 'Job completed and tested with customer sign-off', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(6, 2, NULL, 'Pending', 2, 'Booking created for 2BHK Deep Cleaning', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 2, 'Pending', 'Confirmed', 7, 'Accepted by SparkleClean Hygiene Experts', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(8, 2, 'Confirmed', 'Provider Assigned', 7, 'Assigned Technician Deepak Solanki', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(9, 2, 'Provider Assigned', 'In Progress', 11, 'Mechanized scrubbing started', NOW());

-- ----------------------------------------------------------------------------
-- 17. Seed Payments
-- ----------------------------------------------------------------------------
INSERT INTO payments (
    id, booking_id, customer_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    payment_method, payment_type, amount, currency, status, idempotency_key,
    refund_reason, refunded_at, paid_at, created_at, updated_at
) VALUES
(1, 1, 1, 'order_P9kLmN81xVq001', 'pay_P9kLmZ99aBc001', '8f9e2b4c7a1d3e5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f', 'upi', 'full', 659.86, 'INR', 'Paid', 'idem_hs_10001_full', NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 2, 1, 'order_P9kLmN81xVq002', 'pay_P9kLmZ99aBc002', '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 'card', 'full', 3538.82, 'INR', 'Paid', 'idem_hs_10002_full', NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 3, 2, 'order_P9kLmN81xVq003', 'pay_P9kLmZ99aBc003', '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c', 'upi', 'full', 706.82, 'INR', 'Paid', 'idem_hs_10003_full', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 4, 3, 'order_P9kLmN81xVq004', NULL, NULL, 'razorpay', 'full', 900.69, 'INR', 'Pending', 'idem_hs_10004_full', NULL, NULL, NULL, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 18. Seed Invoices
-- ----------------------------------------------------------------------------
INSERT INTO invoices (
    id, invoice_number, booking_id, payment_id, customer_id, provider_id,
    subtotal, discount_amount, tax_amount, total_amount, issued_at, due_date, pdf_url, billing_snapshot_json, created_at
) VALUES
(1, 'INV-2026-0001', 1, 1, 1, 1, 699.00, 139.80, 100.66, 659.86, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), '/api/v1/invoices/1/download',
 '{"customer_name":"Priya Sharma","provider_name":"VoltCraft Electrical & Smart Home Solutions","gstin":"27AABCV1234F1Z5","service":"MCB & Fuse Distribution Board Upgrade","sac_code":"995461","cgst_rate":9,"sgst_rate":9}', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 'INV-2026-0002', 2, 2, 1, 3, 3499.00, 500.00, 539.82, 3538.82, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), '/api/v1/invoices/2/download',
 '{"customer_name":"Priya Sharma","provider_name":"SparkleClean Hygiene & Pest Control Experts","gstin":"27AADCS9876K1Z2","service":"Full Occupied Home Mechanized Deep Cleaning (2BHK)","sac_code":"998533","cgst_rate":9,"sgst_rate":9}', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ----------------------------------------------------------------------------
-- 19. Seed Coupon Usages
-- ----------------------------------------------------------------------------
INSERT INTO coupon_usages (id, coupon_id, user_id, booking_id, discount_applied, used_at) VALUES
(1, 1, 2, 1, 139.80, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 3, 2, 2, 500.00, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 2, 4, 4, 134.70, NOW());

-- ----------------------------------------------------------------------------
-- 20. Seed Reviews
-- ----------------------------------------------------------------------------
INSERT INTO reviews (id, booking_id, customer_id, provider_id, service_id, rating, comment, provider_response, provider_responded_at, moderation_status, created_at, updated_at) VALUES
(1, 1, 1, 1, 1, 5, 'Manoj arrived right on time, diagnosed the phase overload in 10 minutes, and neatly dressed the entire MCB box. Zero tripping since then!', 'Thank you so much Priya! We are thrilled Manoj delivered a 5-star safe electrical upgrade for your home.', DATE_SUB(NOW(), INTERVAL 2 DAY), 'approved', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ----------------------------------------------------------------------------
-- 21. Seed Complaints
-- ----------------------------------------------------------------------------
INSERT INTO complaints (
    id, ticket_number, booking_id, raised_by_user_id, against_provider_id,
    category, subject, description, status, priority, admin_resolution, resolved_by_user_id, resolved_at, created_at, updated_at
) VALUES
(1, 'TKT-2026-001', 3, 3, 2, 'Schedule Delay', 'Request to confirm exact morning arrival window', 'Need confirmation that the plumber will carry a 40mm diverter cartridge for Jaquar fittings.', 'Resolved', 'Low', 'Confirmed with AquaFlow inventory team; technician Suresh Babu has packed the genuine Jaquar 40mm cartridge.', 1, NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- ----------------------------------------------------------------------------
-- 22. Seed Notifications
-- ----------------------------------------------------------------------------
INSERT INTO notifications (id, user_id, title, message, notification_type, reference_id, is_read, created_at) VALUES
(1, 2, 'Booking Completed & Invoice Ready', 'Your booking HS-2026-10001 has been completed. Download GST Invoice INV-2026-0001 anytime.', 'booking_completed', 1, TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 2, 'Technician Arrived On-Site', 'Deepak Solanki from SparkleClean has started your 2BHK Deep Cleaning (HS-2026-10002).', 'job_started', 2, FALSE, NOW()),
(3, 5, 'Payout Processed: ₹492.10', 'Net earning of ₹492.10 for booking HS-2026-10001 has been settled to your registered bank account.', 'payout_settled', 1, FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 1, 'Pending Provider Verification', 'CoolBreeze HVAC & Appliance Care uploaded KYC documents and awaits admin verification.', 'kyc_pending', 4, FALSE, NOW());

-- ----------------------------------------------------------------------------
-- 23. Seed Provider Earnings
-- ----------------------------------------------------------------------------
INSERT INTO provider_earnings (id, provider_id, booking_id, gross_amount, commission_percentage, commission_amount, net_earning, payout_status, payout_date, created_at) VALUES
(1, 1, 1, 559.20, 12.0, 67.10, 492.10, 'paid', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 3, 2, 2999.00, 10.0, 299.90, 2699.10, 'pending', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ----------------------------------------------------------------------------
-- 24. Seed Favorite Providers
-- ----------------------------------------------------------------------------
INSERT INTO favorite_providers (id, customer_id, provider_id, created_at) VALUES
(1, 1, 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 1, 3, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 2, 2, NOW());

-- ----------------------------------------------------------------------------
-- 25. Seed Subscriptions
-- ----------------------------------------------------------------------------
INSERT INTO subscriptions (id, provider_id, plan_name, plan_tier, price, billing_cycle, commission_rate, max_services, max_technicians, status, start_date, end_date, razorpay_subscription_id, created_at) VALUES
(1, 1, 'HomeServe Pro Growth Monthly', 'Professional', 1999.00, 'monthly', 12.0, 25, 15, 'active', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 'sub_RzpProVoltCraft01', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 2, 'HomeServe Starter Partner', 'Starter', 0.00, 'monthly', 15.0, 10, 5, 'active', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY), NULL, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(3, 3, 'HomeServe Enterprise Franchise Annual', 'Enterprise', 14999.00, 'annual', 10.0, 100, 50, 'active', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_ADD(NOW(), INTERVAL 305 DAY), 'sub_RzpEntSparkle03', DATE_SUB(NOW(), INTERVAL 60 DAY));

-- ----------------------------------------------------------------------------
-- 26. Seed Webhook Events
-- ----------------------------------------------------------------------------
INSERT INTO payment_webhook_events (id, event_id, event_type, payload_json, processed, created_at) VALUES
(1, 'evt_RzpWebhook_10001', 'payment.captured', '{"event":"payment.captured","order_id":"order_P9kLmN81xVq001","payment_id":"pay_P9kLmZ99aBc001","amount":65986}', TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 'evt_RzpWebhook_10002', 'payment.captured', '{"event":"payment.captured","order_id":"order_P9kLmN81xVq002","payment_id":"pay_P9kLmZ99aBc002","amount":353882}', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY));

SET FOREIGN_KEY_CHECKS = 1;
