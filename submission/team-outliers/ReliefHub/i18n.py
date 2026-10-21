"""
ReliefHub Multilingual Localization (English, Urdu, Sindhi)
Complete translation dictionary and helper functions for Sindh Flood Relief.
"""

LANGUAGES = {
    "en": "English",
    "ur": "اردو (Urdu)",
    "sd": "سنڌي (Sindhi)"
}

TRANSLATIONS = {
    # Branding & Header
    "app_title": {
        "en": "ReliefHub — Sindh Flood Emergency Operations",
        "ur": "ریلیف ہب — سندھ سیلاب ایمرجنسی آپریشنز",
        "sd": "ريليف حب — سنڌ ٻوڏ ايمرجنسي آپريشنز"
    },
    "app_subtitle": {
        "en": "Humanitarian logistics, shelter management, and community aid coordination.",
        "ur": "انسانی ہمدردی، کیمپ مینجمنٹ اور امدادی سرگرمیوں کا مرکزی نظام۔",
        "sd": "انساني امداد، ڪئمپ انتظام ۽ راشن پهچائڻ جو مرڪزي پليٽ فارم."
    },
    "welcome_title": {
        "en": "Welcome!",
        "ur": "خوش آمدید!",
        "sd": "ڀلي ڪري آيا!"
    },
    "welcome_sub": {
        "en": "Getting help or giving help starts here",
        "ur": "مدد حاصل کرنا یا مدد فراہم کرنا یہاں سے شروع ہوتا ہے",
        "sd": "مدد حاصل ڪرڻ يا مدد ڏيڻ هتان شروع ٿئي ٿو"
    },

    # Role options on login
    "role_donor": {
        "en": "Community Donor",
        "ur": "عطیہ دہندہ (ڈونر)",
        "sd": "امداد ڏيندڙ (ڊونر)"
    },
    "role_volunteer": {
        "en": "Field Volunteer",
        "ur": "میدانی رضا کار",
        "sd": "ميداني رضاڪار"
    },
    "role_visitor": {
        "en": "Public Visitor",
        "ur": "عام مہمان (وزٹر)",
        "sd": "عام مهمان (ويزيٽر)"
    },
    "role_admin": {
        "en": "Relief Coordinator (Staff)",
        "ur": "ریلیف کوآرڈینیٹر (اسٹاف)",
        "sd": "ريليف ڪوآرڊينيٽر (اسٽاف)"
    },

    # Auth screen copy
    "donor_login_desc": {
        "en": "Donate cash (PKR) or physical goods with 100% direct warehouse replenishment.",
        "ur": "پیسے یا سامان کا عطیہ دیں، جو براہ راست امدادی گودام میں شامل ہوتا ہے۔",
        "sd": "رقم يا راشن جو عطيو ڏيو، جيڪو سڌو سنئون امدادي گودام ۾ شامل ٿئي ٿو."
    },
    "vol_login_desc": {
        "en": "Register your medical, driving, cooking, or logistics skills to help flood victims.",
        "ur": "سیلاب متاثرین کی مدد کے لیے اپنی میڈیکل، ڈرائیونگ یا لاجسٹکس خدمات پیش کریں۔",
        "sd": "ٻوڏ ستايلن جي مدد لاءِ پنهنجي طبي، ڊرائيونگ يا امدادي خدمتن جي رجسٽريشن ڪريو."
    },
    "visitor_login_desc": {
        "en": "Browse how ReliefHub works, view active camps, and inspect urgent flood relief requests.",
        "ur": "دیکھیں کہ ریلیف ہب کیسے کام کرتا ہے اور کیمپس کی فوری ضروریات کا معائنہ کریں۔",
        "sd": "ڏسو ته ريليف حب ڪيئن ڪم ڪري ٿو ۽ ڪئمپن جي فوري ضرورتن جو جائزو وٺو."
    },
    "btn_continue_donor": {
        "en": "Continue as Community Donor",
        "ur": "بطور ڈونر آگے بڑھیں",
        "sd": "بطور ڊونر اڳتي وڌو"
    },
    "btn_continue_vol": {
        "en": "Continue to Volunteer Portal",
        "ur": "رضاکار پورٹل میں داخل ہوں",
        "sd": "رضاڪار پورٽل ۾ داخل ٿيو"
    },
    "btn_continue_visitor": {
        "en": "Explore as Visitor",
        "ur": "بطور مہمان وزٹ کریں",
        "sd": "بطور مهمان دورو ڪريو"
    },
    "staff_portal_link": {
        "en": "Official Staff Sign In",
        "ur": "سرکاری عملے کا لاگ ان",
        "sd": "سرڪاري عملدارن جو لاگ ان"
    },
    "staff_pin_placeholder": {
        "en": "Enter Coordinator Passcode / PIN",
        "ur": "کوآرڈینیٹر پاس ورڈ یا پن درج کریں",
        "sd": "ڪوآرڊينيٽر پاس ڪوڊ يا پن لکو"
    },
    "staff_login_btn": {
        "en": "Unlock Coordinator Dashboard",
        "ur": "کوآرڈینیٹر ڈیش بورڈ کھولیں",
        "sd": "ڪوآرڊينيٽر ڊيش بورڊ کوليو"
    },
    "email_required_error": {
        "en": "Please enter your email or organization address.",
        "ur": "براہ کرم آگے بڑھنے کے لیے اپنا ای میل درج کریں۔",
        "sd": "مهرباني ڪري اڳتي وڌڻ لاءِ پنهنجي اي ميل لکو."
    },
    "email_invalid_error": {
        "en": "Please enter a valid email address (e.g. donor@organization.org).",
        "ur": "براہ کرم درست ای میل پتہ درج کریں (مثلاً donor@organization.org)۔",
        "sd": "مهرباني ڪري صحيح اي ميل لکو (مثال: donor@organization.org)."
    },
    "name_required_error": {
        "en": "Please enter your full name or email.",
        "ur": "براہ کرم آگے بڑھنے کے لیے اپنا نام یا ای میل درج کریں۔",
        "sd": "مهرباني ڪري اڳتي وڌڻ لاءِ پنهنجو نالو يا اي ميل لکو."
    },

    # Navigation menu items
    "nav_home": {
        "en": "Home & Mission",
        "ur": "مرکزی صفحہ اور مشن",
        "sd": "مکيه صفحو ۽ مقصد"
    },
    "nav_camps": {
        "en": "Relief Camps Directory",
        "ur": "امدادی کیمپس کی فہرست",
        "sd": "امدادي ڪئمپن جي لسٽ"
    },
    "nav_inventory": {
        "en": "Warehouse Supplies",
        "ur": "گودام کا سامان",
        "sd": "گودام جو سامان"
    },
    "nav_needs": {
        "en": "Camp Urgent Requests",
        "ur": "کیمپس کی فوری ضروریات",
        "sd": "ڪئمپن جون فوري ضرورتون"
    },
    "nav_dispatches": {
        "en": "Relief Convoys in Motion",
        "ur": "روانہ کردہ امدادی قافلے",
        "sd": "روانو ٿيل امدادي قافلا"
    },
    "nav_donate": {
        "en": "Donate Cash & Supplies",
        "ur": "مالی و اشیائے امداد کا عطیہ",
        "sd": "رقم ۽ سامان جو عطيو ڏيو"
    },
    "nav_vol_portal": {
        "en": "Volunteer Portal & Apply",
        "ur": "رضاکار پورٹل اور درخواست",
        "sd": "رضاڪار پورٽل ۽ درخواست"
    },
    "nav_admin_cmd": {
        "en": "Operations Command Center",
        "ur": "آپریشنز کمانڈ سینٹر",
        "sd": "آپريشنز ڪمانڊ سينٽر"
    },

    # Metric labels
    "metric_active_camps": {
        "en": "Active Relief Camps",
        "ur": "فعال امدادی کیمپس",
        "sd": "فعال امدادي ڪئمپون"
    },
    "metric_families": {
        "en": "Families Sheltered",
        "ur": "پناہ گزین خاندان",
        "sd": "پناهه وٺندڙ خاندان"
    },
    "metric_fulfillment": {
        "en": "Demand Fulfillment",
        "ur": "امدادی سامان کی فراہمی",
        "sd": "ضرورتن جي فراهمي"
    },
    "metric_low_stock": {
        "en": "Low-Stock Alerts",
        "ur": "کم اسٹاک کا انتباہ",
        "sd": "گهٽ اسٽاڪ جو چتاءُ"
    },
    "metric_vols": {
        "en": "Volunteers Deployed",
        "ur": "تعینات رضاکار",
        "sd": "تعينات رضاڪار"
    },
    "metric_cash": {
        "en": "Total Cash Received",
        "ur": "کل موصول شدہ نقد امداد",
        "sd": "ڪل ملييل رقمي امداد"
    },
    "metric_supplies": {
        "en": "Total Supplies Donated",
        "ur": "کل موصول شدہ امدادی سامان",
        "sd": "ڪل ملييل امدادي سامان"
    },

    # General actions
    "btn_sign_out": {
        "en": "Sign Out / Switch Role",
        "ur": "سائن آؤٹ / کردار تبدیل کریں",
        "sd": "سائين آئوٽ / تبديل ڪريو"
    },
    "signed_in_as": {
        "en": "Signed In As",
        "ur": "لاگ ان شناخت",
        "sd": "لاگ ان حيثيت"
    },
    "language_label": {
        "en": "Language / زبان / ٻولي",
        "ur": "زبان کا انتخاب",
        "sd": "ٻولي چونڊيو"
    },
    "hero_headline": {
        "en": "Sindh Flood Emergency Response",
        "ur": "سندھ سیلاب ایمرجنسی ریلیف رسپانس",
        "sd": "سنڌ ٻوڏ ايمرجنسي ريليف رسپانس"
    },
    "hero_body": {
        "en": "Supporting vulnerable children and families across flood-affected districts in Sindh with clean water, food rations, tents, and medicines.",
        "ur": "سندھ کے سیلاب متاثرہ اضلاع میں بچوں اور خاندانوں کو صاف پانی، راشن، خیمے اور ادویات کی فوری فراہمی۔",
        "sd": "سنڌ جي ٻوڏ متاثر ضلعن ۾ ٻارن ۽ خاندانن کي صاف پاڻي، راشن، تنبو ۽ دوائون پهچائڻ."
    }
}

def t(key: str, lang: str = "en") -> str:
    """Retrieve translated text for a given key and language code."""
    entry = TRANSLATIONS.get(key, {})
    return entry.get(lang, entry.get("en", key))
