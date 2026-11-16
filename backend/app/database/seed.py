import json
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

from app.core.security import generate_razorpay_signature, hash_password
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models import (
    Address,
    AvailabilitySlot,
    Booking,
    BookingAssignment,
    BookingImage,
    BookingStatusHistory,
    Complaint,
    Coupon,
    Customer,
    FavoriteProvider,
    Invoice,
    Notification,
    Payment,
    ProviderEarning,
    ProviderService,
    ProviderWorkingHour,
    Review,
    Service,
    ServiceArea,
    ServiceCategory,
    ServiceProvider,
    Subscription,
    Technician,
    User,
)
from app.services.pricing_service import calculate_booking_pricing


def seed_database(db: Session) -> None:
    """Create all 28 tables and seed rich enterprise data idempotently if users table is empty."""
    Base.metadata.create_all(bind=engine)

    if db.query(User).count() > 0:
        return

    pwd_hash = hash_password("Password@123")

    # 1. Users
    admin_user = User(
        full_name="Vikramaditya Rao (Super Admin)",
        email="admin@homeserve.com",
        phone="+91 9820010000",
        password_hash=pwd_hash,
        role="admin",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
        is_active=True,
        is_email_verified=True,
    )
    cust1_user = User(
        full_name="Aarav Sharma",
        email="customer@homeserve.com",
        phone="+91 9820112233",
        password_hash=pwd_hash,
        role="customer",
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
        is_active=True,
        is_email_verified=True,
    )
    cust2_user = User(
        full_name="Priya Patel",
        email="priya@homeserve.com",
        phone="+91 9820445566",
        password_hash=pwd_hash,
        role="customer",
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
        is_active=True,
        is_email_verified=True,
    )
    prov1_user = User(
        full_name="Suresh Mehta",
        email="provider@homeserve.com",
        phone="+91 9820778899",
        password_hash=pwd_hash,
        role="provider",
        avatar_url="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
        is_active=True,
        is_email_verified=True,
    )
    prov2_user = User(
        full_name="Ananya Nair",
        email="sparkle@homeserve.com",
        phone="+91 9820889900",
        password_hash=pwd_hash,
        role="provider",
        avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300",
        is_active=True,
        is_email_verified=True,
    )
    prov3_user = User(
        full_name="Rohan Deshmukh",
        email="craft@homeserve.com",
        phone="+91 9820991122",
        password_hash=pwd_hash,
        role="provider",
        avatar_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300",
        is_active=True,
        is_email_verified=True,
    )
    tech1_user = User(
        full_name="Rajesh Kumar",
        email="tech@homeserve.com",
        phone="+91 9820334455",
        password_hash=pwd_hash,
        role="technician",
        avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
        is_active=True,
        is_email_verified=True,
    )
    tech2_user = User(
        full_name="Vikram Singh",
        email="vikram@homeserve.com",
        phone="+91 9820667788",
        password_hash=pwd_hash,
        role="technician",
        avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
        is_active=True,
        is_email_verified=True,
    )

    db.add_all(
        [
            admin_user,
            cust1_user,
            cust2_user,
            prov1_user,
            prov2_user,
            prov3_user,
            tech1_user,
            tech2_user,
        ]
    )
    db.flush()

    # 2. Customers & Addresses
    cust1 = Customer(
        user_id=cust1_user.id,
        loyalty_points=450,
        preferred_language="English",
        emergency_contact="+91 9820112299",
    )
    cust2 = Customer(
        user_id=cust2_user.id,
        loyalty_points=280,
        preferred_language="English",
        emergency_contact="+91 9820445599",
    )
    db.add_all([cust1, cust2])
    db.flush()

    addr1 = Address(
        user_id=cust1_user.id,
        label="Home (Mumbai)",
        address_line1="Flat 1402, Oberoi Sky Heights, Lokhandwala",
        address_line2="Andheri West",
        city="Mumbai",
        state="Maharashtra",
        postal_code="400053",
        country="India",
        latitude=19.1363,
        longitude=72.8277,
        is_default=True,
    )
    addr2 = Address(
        user_id=cust1_user.id,
        label="Work Studio (Bengaluru)",
        address_line1="Level 4, Prestige Tech Park, Outer Ring Road",
        address_line2="Bellandur",
        city="Bengaluru",
        state="Karnataka",
        postal_code="560103",
        country="India",
        latitude=12.9352,
        longitude=77.6912,
        is_default=False,
    )
    addr3 = Address(
        user_id=cust2_user.id,
        label="Home",
        address_line1="B-704, Hiranandani Gardens, Powai",
        address_line2="Central Avenue",
        city="Mumbai",
        state="Maharashtra",
        postal_code="400076",
        country="India",
        latitude=19.1197,
        longitude=72.9051,
        is_default=True,
    )
    db.add_all([addr1, addr2, addr3])
    db.flush()

    # 3. Service Providers
    prov1 = ServiceProvider(
        user_id=prov1_user.id,
        business_name="Apex Home Solutions",
        business_description="ISO-9001 certified electrical, AC engineering, and precision plumbing specialists with 24x7 rapid emergency dispatch.",
        category_specialization="Electrical, AC Repair & Plumbing",
        city="Mumbai",
        experience_years=9,
        verification_status="verified",
        id_document_url="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
        license_number="MH-ELEC-2017-8841",
        avg_rating=4.9,
        total_reviews=2,
        total_completed_jobs=148,
        commission_rate=12.0,
        is_available=True,
    )
    prov2 = ServiceProvider(
        user_id=prov2_user.id,
        business_name="SparklePro Cleaners",
        business_description="Hospital-grade eco-friendly home sanitization, deep cleaning, sofa spa, and odorless herbal pest control.",
        category_specialization="Home Cleaning, Deep Cleaning & Pest Control",
        city="Mumbai",
        experience_years=6,
        verification_status="verified",
        id_document_url="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
        license_number="MH-CLN-2020-3319",
        avg_rating=4.8,
        total_reviews=1,
        total_completed_jobs=96,
        commission_rate=15.0,
        is_available=True,
    )
    prov3 = ServiceProvider(
        user_id=prov3_user.id,
        business_name="UrbanCraft Interiors",
        business_description="Bespoke modular carpentry, Italian wood polishing, laser-leveled wall painting, and waterproof texture finishes.",
        category_specialization="Painting & Carpentry Services",
        city="Bengaluru",
        experience_years=5,
        verification_status="pending",
        id_document_url="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
        license_number="KA-INT-2021-5520",
        avg_rating=4.7,
        total_reviews=0,
        total_completed_jobs=32,
        commission_rate=15.0,
        is_available=True,
    )
    db.add_all([prov1, prov2, prov3])
    db.flush()

    # 4. Technicians
    tech1 = Technician(
        user_id=tech1_user.id,
        provider_id=prov1.id,
        specialization="Master Electrician & Inverter AC Specialist",
        experience_years=7,
        id_proof_url="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
        availability_status="available",
        avg_rating=4.9,
        total_jobs_completed=84,
        is_active=True,
    )
    tech2 = Technician(
        user_id=tech2_user.id,
        provider_id=prov1.id,
        specialization="Senior Plumbing & Appliance Engineer",
        experience_years=5,
        id_proof_url="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
        availability_status="available",
        avg_rating=4.8,
        total_jobs_completed=64,
        is_active=True,
    )
    db.add_all([tech1, tech2])
    db.flush()

    # 5. All 10 Service Categories
    categories_data = [
        (
            "Electrical Services",
            "electrical-services",
            "Certified residential & commercial wiring, MCB distribution board upgrades, fan & chandelier installation.",
            "Zap",
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800",
            1,
        ),
        (
            "Plumbing Services",
            "plumbing-services",
            "Leak detection, concealed pipe repair, luxury sanitaryware installation, and hydro-jet drain unblocking.",
            "Droplets",
            "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800",
            2,
        ),
        (
            "AC Repair & Maintenance",
            "ac-repair-maintenance",
            "Foam-jet AC servicing, refrigerant gas charging, PCB diagnostics, and split/cassette AC installation.",
            "Wind",
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
            3,
        ),
        (
            "Home Cleaning",
            "home-cleaning",
            "Express apartment cleaning, bathroom descaling, kitchen degreasing, and sofa upholstery shampooing.",
            "Sparkles",
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
            4,
        ),
        (
            "Painting Services",
            "painting-services",
            "Dust-free mechanized interior & exterior painting, designer Royale textures, and damp-proof waterproofing.",
            "Paintbrush",
            "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800",
            5,
        ),
        (
            "Carpentry Services",
            "carpentry-services",
            "Custom furniture assembly, hydraulic hinge replacements, smart lock fitting, and door alignment.",
            "Hammer",
            "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800",
            6,
        ),
        (
            "Appliance Repair",
            "appliance-repair",
            "Front-load washing machine, double-door refrigerator, microwave, and RO water purifier repairs.",
            "Cpu",
            "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800",
            7,
        ),
        (
            "Pest Control",
            "pest-control",
            "WHO-approved odorless herbal gel treatment for cockroaches, termites, bed bugs, and wood borers.",
            "ShieldCheck",
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
            8,
        ),
        (
            "Deep Cleaning",
            "deep-cleaning",
            "Move-in/move-out full villa & apartment steam sanitization using Karcher industrial equipment.",
            "SprayCan",
            "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800",
            9,
        ),
        (
            "Home Maintenance",
            "home-maintenance",
            "Complete annual home health checkups, curtain rod/TV mounting, grouting, and handyman packages.",
            "Wrench",
            "https://images.unsplash.com/photo-1540479859555-17af45c78602?w=800",
            10,
        ),
    ]

    cat_map = {}
    for name, slug, desc, icon, img, order in categories_data:
        cat = ServiceCategory(
            name=name,
            slug=slug,
            description=desc,
            icon_name=icon,
            image_url=img,
            is_active=True,
            display_order=order,
        )
        db.add(cat)
        db.flush()
        cat_map[slug] = cat

    # 6. 16 Detailed Services
    services_data = [
        (
            "ac-repair-maintenance",
            "Split AC Foam-Jet Deep Service",
            "split-ac-foam-jet-service",
            "2x deeper cooling coil & blower jet cleaning with anti-rust coating",
            "Comprehensive high-pressure foam-jet cleaning of indoor cooling coils, blower wheel, drain tray, and outdoor condenser unit. Includes gas pressure check and electrical amp testing.",
            699.0,
            60,
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
            ["High-pressure foam jet cleaning", "Outdoor condenser wash", "Drain pipe flush", "30-day leak & cooling warranty"],
            ["Spare parts & refrigerant gas top-up", "Masonry or core cutting"],
            True,
        ),
        (
            "ac-repair-maintenance",
            "AC Refrigerant Gas Refill & Leak Fix",
            "ac-refrigerant-gas-refill",
            "Complete nitrogen pressure testing, brazing leak repair & R32/R410A gas charging",
            "End-to-end refrigerant restoration for split and window ACs using digital manifold gauges, vacuum pump evacuation, and eco-friendly R32/R410A refrigerant.",
            2499.0,
            90,
            "https://images.unsplash.com/photo-1631545806609-35d4ae490431?w=800",
            ["Nitrogen leak detection", "Pin-valve & flare nut check", "Full vacuuming & gas refill", "60-day cooling guarantee"],
            ["Compressor replacement"],
            True,
        ),
        (
            "electrical-services",
            "Complete MCB Distribution Box Upgrade",
            "mcb-distribution-box-upgrade",
            "Install shock-proof RCCB/ELCB circuit breakers & thermal load balancing",
            "Protect your home appliances against voltage surges and short circuits with industrial-grade Schneider/Havells MCB & RCCB installation and phase balancing.",
            1299.0,
            75,
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800",
            ["Circuit load diagnostics", "MCB/RCCB fitting & dressing", "Earthing voltage verification", "30-day workmanship warranty"],
            ["Cost of MCB enclosure box if replaced"],
            True,
        ),
        (
            "electrical-services",
            "Smart Ceiling Fan & Chandelier Installation",
            "ceiling-fan-chandelier-installation",
            "Laser-balanced BLDC ceiling fan or decorative chandelier mounting",
            "Safe anchor-fastener mounting, concealed dimmer/remote receiver wiring, and zero-wobble balancing for BLDC fans and crystal chandeliers.",
            449.0,
            45,
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
            ["Safe ladder & drilling setup", "Concealed wiring connection", "Zero-noise wobble test"],
            ["Fan or chandelier hardware unit"],
            False,
        ),
        (
            "plumbing-services",
            "Concealed Pipe Leak Detection & Seal",
            "concealed-pipe-leak-repair",
            "Acoustic & thermal moisture inspection with non-destructive pressure sealing",
            "Pinpoint hidden bathroom and kitchen pipeline leaks using digital moisture meters and repair faulty joints, diverters, and CPVC couplings.",
            899.0,
            60,
            "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800",
            ["Digital moisture inspection", "Joint replacement & Teflon sealing", "Post-repair pressure test"],
            ["Wall tiles replacement"],
            True,
        ),
        (
            "plumbing-services",
            "Hydro-Jet Kitchen & Bathroom Drain Unblocking",
            "hydro-jet-drain-unblocking",
            "Motorized spring auger & high-pressure drain line clearing",
            "Instant removal of stubborn grease, hair, and scale blockages from kitchen sinks, floor traps, and main inspection chambers.",
            599.0,
            45,
            "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800",
            ["Motorized drain snake clearing", "Enzyme odor treatment", "Flow rate verification"],
            ["Civil excavation"],
            False,
        ),
        (
            "home-cleaning",
            "intense Bathroom & Kitchen Steam Sanitization",
            "bathroom-kitchen-steam-sanitization",
            "Hard-water scale removal, chimney exterior degreasing & tile grouting",
            "Hospital-grade descaling of glass partitions, chrome faucets, exhaust fans, kitchen slabs, and ceramic tiles using biodegradable Diversey solutions.",
            1199.0,
            120,
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
            ["High-temp steam sterilization", "Hard-water stain removal", "Chrome fixture buffing"],
            ["Inside cabinets utensil organization"],
            True,
        ),
        (
            "home-cleaning",
            "Luxury 5-Seater Sofa & Carpet Wet Shampooing",
            "luxury-sofa-carpet-shampooing",
            "3-step foam extraction, dust-mite vacuuming & fabric Scotchgard conditioning",
            "Revive fabric and leatherette sofas with industrial injection-extraction machines that lift deep stains and allergens while drying in 2 hours.",
            999.0,
            90,
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
            ["HEPA dry vacuuming", "pH-neutral shampoo scrubbing", "Wet vacuum moisture extraction"],
            ["Dry-clean-only silk fabrics"],
            False,
        ),
        (
            "deep-cleaning",
            "Full 2BHK Move-In Deep Cleaning",
            "full-2bhk-move-in-deep-cleaning",
            "360-degree floor scrubbing, window track vacuuming, washroom & kitchen spa",
            "A 4-member specialist crew performs single-disc machine floor scrubbing, balcony wash, internal/external window cleaning, and complete disinfection.",
            3499.0,
            240,
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
            ["4-person specialist crew", "Single-disc floor scrubbing", "All bedrooms, hall, kitchen & bathrooms", "Eco-friendly Diversey chemicals"],
            ["Chandelier crystal dismantling"],
            True,
        ),
        (
            "painting-services",
            "1 Room Express Mechanized Wall Painting",
            "express-room-wall-painting",
            "Laser measurement, furniture masking, 2 coats putty + Asian Paints Royale",
            "Transform your bedroom or living room in 24 hours with zero-dust vacuum sanders, acrylic wall putty, and low-VOC luxury emulsion.",
            4999.0,
            360,
            "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800",
            ["Full furniture & floor masking", "Crack filling & vacuum sanding", "2 coats premium emulsion", "Post-painting cleanup"],
            ["Structural ceiling plastering"],
            True,
        ),
        (
            "carpentry-services",
            "Smart Digital Door Lock & Wardrobe Tune-up",
            "smart-door-lock-wardrobe-tuneup",
            "Precision mortise/biometric lock installation & soft-close hinge alignment",
            "Expert carpentry for biometric smart locks, hydraulic bed lift mechanisms, sliding wardrobe rollers, and main door planing.",
            799.0,
            60,
            "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800",
            ["Template jig routing", "Smart lock calibration", "Up to 4 wardrobe hinges tuned"],
            ["Cost of smart lock device"],
            False,
        ),
        (
            "appliance-repair",
            "Front-Load Washing Machine Complete Overhaul",
            "front-load-washing-machine-repair",
            "Drum bearing check, drain pump cleaning, PCB & shock absorber service",
            "Authorized-grade diagnostics and repair for LG, Bosch, IFB, and Samsung front-load and top-load washing machines.",
            649.0,
            60,
            "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800",
            ["50-point diagnostic check", "Drain filter & hose cleaning", "Drum calibration", "90-day service warranty"],
            ["OEM spare part cost if replaced"],
            True,
        ),
        (
            "appliance-repair",
            "RO Water Purifier Membrane & Filter Kit Service",
            "ro-water-purifier-filter-service",
            "TDS calibration, sediment + carbon filter replacement & UV sanitization",
            "Ensure 100% pure drinking water with digital TDS meter testing, food-grade tank sterilization, and genuine sediment/carbon cartridge tune-up.",
            549.0,
            45,
            "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800",
            ["Digital TDS & flow check", "Housing sterilization", "Leak-proof elbow check"],
            ["RO membrane cartridge price"],
            False,
        ),
        (
            "pest-control",
            "Odorless Herbal Cockroach & Ant Control (2BHK)",
            "odorless-herbal-pest-control",
            "Child & pet-safe Bayer gel baiting + residual spray with 90-day warranty",
            "Zero-evacuation kitchen and washroom pest management using German Bayer gel baiting and micro-encapsulated herbal spray.",
            1099.0,
            60,
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
            ["No need to empty kitchen cabinets", "Pet & child safe Bayer gel", "Free re-treatment within 90 days"],
            ["Termite drilling treatment"],
            True,
        ),
        (
            "pest-control",
            "Anti-Termite Drill-Fill-Seal Wood Protection",
            "anti-termite-wood-protection",
            "Perimeter wall-floor junction drilling, Imidacloprid injection & white cement seal",
            "Stop subterranean termites from damaging expensive woodwork with high-penetration chemical barriers and 1-year protection certificate.",
            2999.0,
            180,
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
            ["Precision 45-degree wall drilling", "Odorless termiticide injection", "Color-matched hole sealing"],
            ["Furniture replacement"],
            False,
        ),
        (
            "home-maintenance",
            "Annual Complete Home Health & Safety Inspection",
            "annual-home-health-inspection",
            "Electrical thermal scan + plumbing leak check + AC & appliance audit",
            "Two senior engineers inspect every switchboard, faucet, flush tank, and AC unit in your home in a single 2-hour visit.",
            1499.0,
            120,
            "https://images.unsplash.com/photo-1540479859555-17af45c78602?w=800",
            ["Electrical load & earthing audit", "All taps & flush valves tuned", "2 AC filters cleaned", "Detailed digital health report"],
            ["Major spare parts"],
            True,
        ),
    ]

    service_objs = []
    for (
        cat_slug,
        name,
        slug,
        short_desc,
        desc,
        price,
        duration,
        img,
        inc,
        exc,
        featured,
    ) in services_data:
        svc = Service(
            category_id=cat_map[cat_slug].id,
            name=name,
            slug=slug,
            short_description=short_desc,
            description=desc,
            base_price=price,
            duration_minutes=duration,
            image_url=img,
            inclusions_json=json.dumps(inc),
            exclusions_json=json.dumps(exc),
            is_featured=featured,
            is_active=True,
        )
        db.add(svc)
        db.flush()
        service_objs.append(svc)

    # 7. Provider Services, Service Areas, Working Hours, Subscriptions
    for idx, svc in enumerate(service_objs):
        target_prov = prov1 if idx in (0, 1, 2, 3, 4, 5, 11, 12, 15) else prov2
        db.add(
            ProviderService(
                provider_id=target_prov.id,
                service_id=svc.id,
                custom_price=svc.base_price,
                custom_duration_minutes=svc.duration_minutes,
                is_active=True,
            )
        )
    # Also add painting & carpentry to prov3
    for svc in service_objs[9:11]:
        db.add(
            ProviderService(
                provider_id=prov3.id,
                service_id=svc.id,
                custom_price=svc.base_price,
                custom_duration_minutes=svc.duration_minutes,
                is_active=True,
            )
        )

    db.add_all(
        [
            ServiceArea(provider_id=prov1.id, city="Mumbai", state="Maharashtra", postal_code="400053", service_radius_km=25.0, is_active=True),
            ServiceArea(provider_id=prov1.id, city="Mumbai", state="Maharashtra", postal_code="400076", service_radius_km=20.0, is_active=True),
            ServiceArea(provider_id=prov2.id, city="Mumbai", state="Maharashtra", postal_code="400050", service_radius_km=25.0, is_active=True),
            ServiceArea(provider_id=prov3.id, city="Bengaluru", state="Karnataka", postal_code="560103", service_radius_km=20.0, is_active=True),
        ]
    )

    for prov in (prov1, prov2, prov3):
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
            db.add(
                ProviderWorkingHour(
                    provider_id=prov.id,
                    day_of_week=day,
                    start_time="08:00",
                    end_time="20:00",
                    is_closed=(day == "Sunday" and prov.id == prov3.id),
                )
            )

    db.add_all(
        [
            Subscription(
                provider_id=prov1.id,
                plan_name="HomeServe Pro Growth",
                plan_tier="Professional",
                price=2499.0,
                billing_cycle="monthly",
                commission_rate=12.0,
                max_services=30,
                max_technicians=20,
                status="active",
                start_date=datetime.utcnow() - timedelta(days=10),
                end_date=datetime.utcnow() + timedelta(days=20),
                razorpay_subscription_id="sub_HS_ApexPro001",
            ),
            Subscription(
                provider_id=prov2.id,
                plan_name="HomeServe Starter Partner",
                plan_tier="Starter",
                price=999.0,
                billing_cycle="monthly",
                commission_rate=15.0,
                max_services=10,
                max_technicians=5,
                status="active",
                start_date=datetime.utcnow() - timedelta(days=5),
                end_date=datetime.utcnow() + timedelta(days=25),
                razorpay_subscription_id="sub_HS_Sparkle002",
            ),
        ]
    )

    db.add(FavoriteProvider(customer_id=cust1.id, provider_id=prov1.id))
    db.add(FavoriteProvider(customer_id=cust1.id, provider_id=prov2.id))

    # 8. Coupons
    now = datetime.utcnow()
    coupons = [
        Coupon(
            code="WELCOME20",
            title="20% Off First Home Service",
            description="Get 20% instant discount up to ₹500 on any home service booking.",
            discount_type="percentage",
            discount_value=20.0,
            min_order_amount=400.0,
            max_discount_amount=500.0,
            usage_limit=500,
            used_count=12,
            valid_from=now - timedelta(days=30),
            valid_until=now + timedelta(days=180),
            is_active=True,
        ),
        Coupon(
            code="SUMMER15",
            title="15% Off AC & Cooling Care",
            description="Beat the heat with 15% off up to ₹400 on AC servicing and gas charging.",
            discount_type="percentage",
            discount_value=15.0,
            min_order_amount=500.0,
            max_discount_amount=400.0,
            usage_limit=300,
            used_count=8,
            valid_from=now - timedelta(days=15),
            valid_until=now + timedelta(days=120),
            is_active=True,
        ),
        Coupon(
            code="HOME250",
            title="Flat ₹250 Off Deep Cleaning & Painting",
            description="Flat ₹250 discount on orders above ₹1,000.",
            discount_type="fixed",
            discount_value=250.0,
            min_order_amount=1000.0,
            max_discount_amount=250.0,
            usage_limit=200,
            used_count=5,
            valid_from=now - timedelta(days=10),
            valid_until=now + timedelta(days=120),
            is_active=True,
        ),
    ]
    db.add_all(coupons)
    db.flush()

    # 9. Sample Bookings across all statuses
    today = date.today()
    sample_bookings_spec = [
        (
            "HS-20261110-A101",
            cust1,
            prov1,
            service_objs[0],  # Split AC Foam-Jet Deep Service (699)
            addr1,
            today - timedelta(days=4),
            "10:30 AM",
            "Completed",
            "Master bedroom Daikin 1.5T split AC cooling is low and water dripping from indoor unit.",
            tech1,
            "Completed",
            True,
        ),
        (
            "HS-20261112-B202",
            cust1,
            prov2,
            service_objs[8],  # Full 2BHK Move-In Deep Cleaning (3499)
            addr1,
            today - timedelta(days=2),
            "09:00 AM",
            "Completed",
            "Complete pre-festival deep cleaning for 2BHK apartment including balcony and kitchen.",
            None,
            None,
            True,
        ),
        (
            "HS-20261116-C303",
            cust1,
            prov1,
            service_objs[2],  # Complete MCB Distribution Box Upgrade (1299)
            addr1,
            today + timedelta(days=1),
            "02:00 PM",
            "Provider Assigned",
            "Kitchen geyser MCB trips frequently when microwave and AC run together.",
            tech1,
            "Accepted",
            True,
        ),
        (
            "HS-20261116-D404",
            cust2,
            prov1,
            service_objs[4],  # Concealed Pipe Leak Detection & Seal (899)
            addr3,
            today + timedelta(days=2),
            "12:00 PM",
            "In Progress",
            "Damp patch near master washroom shower diverter wall.",
            tech2,
            "In Progress",
            True,
        ),
        (
            "HS-20261117-E505",
            cust2,
            prov2,
            service_objs[13],  # Odorless Herbal Cockroach & Ant Control (1099)
            addr3,
            today + timedelta(days=3),
            "04:00 PM",
            "Pending",
            "Need herbal gel treatment in modular kitchen drawers and utility area.",
            None,
            None,
            False,
        ),
        (
            "HS-20261108-F606",
            cust1,
            prov1,
            service_objs[3],  # Smart Ceiling Fan Installation (449)
            addr2,
            today - timedelta(days=6),
            "06:00 PM",
            "Cancelled",
            "Install 2 Atomberg BLDC ceiling fans in study room.",
            None,
            None,
            False,
        ),
    ]

    created_bookings = []
    for (
        ref,
        cust,
        prov,
        svc,
        addr,
        b_date,
        b_time,
        b_status,
        prob_desc,
        assigned_tech,
        assign_status,
        is_paid,
    ) in sample_bookings_spec:
        pricing = calculate_booking_pricing(
            base_amount=svc.base_price,
            discount_amount=0.0,
            commission_rate=prov.commission_rate,
        )
        b = Booking(
            booking_reference=ref,
            customer_id=cust.id,
            provider_id=prov.id,
            service_id=svc.id,
            address_id=addr.id,
            appointment_date=b_date,
            appointment_time=b_time,
            status=b_status,
            problem_description=prob_desc,
            reference_image_url=svc.image_url,
            base_amount=pricing["base_amount"],
            discount_amount=pricing["discount_amount"],
            tax_amount=pricing["tax_amount"],
            total_amount=pricing["total_amount"],
            commission_amount=pricing["commission_amount"],
            provider_earning_amount=pricing["provider_earning_amount"],
            cancellation_reason="Customer traveled out of station" if b_status == "Cancelled" else None,
            cancelled_by_role="customer" if b_status == "Cancelled" else None,
        )
        db.add(b)
        db.flush()
        created_bookings.append(b)

        db.add(
            BookingStatusHistory(
                booking_id=b.id,
                old_status=None,
                new_status="Pending",
                changed_by_user_id=cust.user_id,
                notes="Booking created",
            )
        )
        if b_status != "Pending":
            db.add(
                BookingStatusHistory(
                    booking_id=b.id,
                    old_status="Pending",
                    new_status=b_status,
                    changed_by_user_id=prov.user_id,
                    notes=f"Booking transitioned to {b_status}",
                )
            )

        if assigned_tech:
            db.add(
                BookingAssignment(
                    booking_id=b.id,
                    technician_id=assigned_tech.id,
                    assigned_by_user_id=prov.user_id,
                    assignment_status=assign_status,
                    arrival_time=now - timedelta(hours=3) if assign_status in ("In Progress", "Completed") else None,
                    start_time=now - timedelta(hours=2) if assign_status in ("In Progress", "Completed") else None,
                    completion_time=now - timedelta(hours=1) if assign_status == "Completed" else None,
                    completion_remarks="Cleaned cooling coil, cleared drain line, verified 7.2°C grill temperature."
                    if assign_status == "Completed"
                    else None,
                )
            )

        if is_paid:
            order_id = f"order_HS_seed_{b.id}"
            pay_id = f"pay_HS_seed_{b.id}"
            sig = generate_razorpay_signature(order_id, pay_id)
            payment = Payment(
                booking_id=b.id,
                customer_id=cust.id,
                razorpay_order_id=order_id,
                razorpay_payment_id=pay_id,
                razorpay_signature=sig,
                payment_method="UPI / Razorpay",
                payment_type="full",
                amount=b.total_amount,
                currency="INR",
                status="Paid",
                idempotency_key=f"seed_idem_{b.id}",
                paid_at=now - timedelta(days=1),
            )
            db.add(payment)
            db.flush()

            inv_num = f"INV-202611-{b.id:04d}"
            snapshot = {
                "invoice_number": inv_num,
                "booking_reference": b.booking_reference,
                "service_name": svc.name,
                "customer_name": cust.user.full_name,
                "provider_business_name": prov.business_name,
                "subtotal": b.base_amount,
                "discount_amount": b.discount_amount,
                "tax_amount": b.tax_amount,
                "total_amount": b.total_amount,
            }
            db.add(
                Invoice(
                    invoice_number=inv_num,
                    booking_id=b.id,
                    payment_id=payment.id,
                    customer_id=cust.id,
                    provider_id=prov.id,
                    subtotal=b.base_amount,
                    discount_amount=b.discount_amount,
                    tax_amount=b.tax_amount,
                    total_amount=b.total_amount,
                    issued_at=now - timedelta(days=1),
                    due_date=now - timedelta(days=1),
                    pdf_url=f"/api/v1/invoices/booking/{b.id}",
                    billing_snapshot_json=json.dumps(snapshot),
                )
            )

            db.add(
                ProviderEarning(
                    provider_id=prov.id,
                    booking_id=b.id,
                    gross_amount=b.base_amount,
                    commission_percentage=prov.commission_rate,
                    commission_amount=b.commission_amount,
                    net_earning=b.provider_earning_amount,
                    payout_status="paid" if b_status == "Completed" else "processed",
                    payout_date=now if b_status == "Completed" else None,
                )
            )

    # 10. Reviews for Completed Bookings
    db.add_all(
        [
            Review(
                booking_id=created_bookings[0].id,
                customer_id=cust1.id,
                provider_id=prov1.id,
                service_id=service_objs[0].id,
                rating=5,
                comment="Rajesh arrived 10 minutes early with a protective jacket bag, foam-jetted the indoor and outdoor units without spilling a drop, and our AC cools like brand new!",
                provider_response="Thank you so much Aarav! We are glad Rajesh delivered a 5-star experience.",
                provider_responded_at=now - timedelta(days=2),
                moderation_status="approved",
            ),
            Review(
                booking_id=created_bookings[1].id,
                customer_id=cust1.id,
                provider_id=prov2.id,
                service_id=service_objs[8].id,
                rating=5,
                comment="SparklePro's 4-person crew spent 4 full hours scrubbing every corner, window track, and bathroom tile. Truly hotel-grade deep cleaning.",
                provider_response="Thank you Aarav! Looking forward to serving your home again.",
                provider_responded_at=now - timedelta(days=1),
                moderation_status="approved",
            ),
        ]
    )

    # 11. Sample Complaint
    db.add(
        Complaint(
            ticket_number="TKT-20261114-A1",
            booking_id=created_bookings[2].id,
            raised_by_user_id=cust1_user.id,
            against_provider_id=prov1.id,
            category="Rescheduling / Timing",
            subject="Requesting morning slot confirmation call",
            description="Please ask the assigned technician to call 30 minutes prior to arrival.",
            status="Open",
            priority="Medium",
        )
    )

    # 12. Sample Notifications
    db.add_all(
        [
            Notification(
                user_id=cust1_user.id,
                title="Technician Assigned (HS-20261116-C303)",
                message="Master Electrician Rajesh Kumar has been assigned to your MCB Distribution Box Upgrade.",
                notification_type="assignment",
                reference_id=created_bookings[2].id,
                is_read=False,
            ),
            Notification(
                user_id=prov1_user.id,
                title="Payment Received (HS-20261116-C303)",
                message="Customer Aarav Sharma completed online payment for booking HS-20261116-C303.",
                notification_type="payment",
                reference_id=created_bookings[2].id,
                is_read=False,
            ),
            Notification(
                user_id=tech1_user.id,
                title="Upcoming Field Dispatch (HS-20261116-C303)",
                message="New assignment at Oberoi Sky Heights, Andheri West at 02:00 PM.",
                notification_type="assignment",
                reference_id=created_bookings[2].id,
                is_read=False,
            ),
            Notification(
                user_id=admin_user.id,
                title="Provider Verification Pending: UrbanCraft Interiors",
                message="Rohan Deshmukh submitted license KA-INT-2021-5520 for admin verification.",
                notification_type="verification",
                reference_id=prov3.id,
                is_read=False,
            ),
        ]
    )

    db.commit()


def run_startup_seed() -> None:
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


if __name__ == "__main__":
    run_startup_seed()
    print("HomeServe database seeded successfully!")
