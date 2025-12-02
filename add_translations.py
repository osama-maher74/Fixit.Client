import json

# Read English file
with open('public/assets/i18n/en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

# Add NOTIFICATIONS section
en_data['NOTIFICATIONS'] = {
    "TITLE": "Notifications",
    "NEW": "New",
    "EMPTY_STATE": "No notifications yet",
    "EMPTY_DESCRIPTION": "You'll see notifications about your service requests here",
    "JUST_NOW": "Just now",
    "MINUTES_AGO": "{count}m ago",
    "HOURS_AGO": "{count}h ago",
    "MARK_ALL_READ": "Mark all as read",
    "MARK_AS_READ": "Mark as read"
}

# Write back to English file
with open('public/assets/i18n/en.json', 'w', encoding='utf-8') as f:
    json.dump(en_data, f, ensure_ascii=False, indent=2)

# Read Arabic file
with open('public/assets/i18n/ar.json', 'r', encoding='utf-8') as f:
    ar_data = json.load(f)

# Add NOTIFICATIONS section in Arabic
ar_data['NOTIFICATIONS'] = {
    "TITLE": "الإشعارات",
    "NEW": "جديد",
    "EMPTY_STATE": "لا توجد إشعارات بعد",
    "EMPTY_DESCRIPTION": "ستظهر الإشعارات حول طلبات الخدمة هنا",
    "JUST_NOW": "الآن",
    "MINUTES_AGO": "منذ {count} د",
    "HOURS_AGO": "منذ {count} س",
    "MARK_ALL_READ": "تعليم الكل كمقروء",
    "MARK_AS_READ": "تعليم كمقروء"
}

# Write back to Arabic file
with open('public/assets/i18n/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar_data, f, ensure_ascii=False, indent=2)

print("✅ Successfully added NOTIFICATIONS translations to both files!")
