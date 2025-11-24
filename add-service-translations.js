const fs = require('fs');
const path = require('path');

// Read English translations
const enPath = path.join(__dirname, 'src', 'assets', 'i18n', 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

// Add SERVICE_BOOKING section
enData.SERVICE_BOOKING = {
    "TITLE": "Professional Home Services",
    "SUBTITLE": "Your trusted partner for all home repair and maintenance needs",
    "HOME_REPAIRS": "Home Repairs",
    "HOME_REPAIRS_DESC": "General repairs and maintenance for your home with skilled professionals",
    "ELECTRICAL": "Electrical Services",
    "ELECTRICAL_DESC": "Safe and certified electrical installations, repairs, and inspections",
    "PLUMBING": "Plumbing",
    "PLUMBING_DESC": "Expert plumbing solutions for all your water and drainage needs",
    "PAINTING": "Painting & Decoration",
    "PAINTING_DESC": "Transform your space with professional painting and finishing services",
    "CARPENTRY": "Carpentry",
    "CARPENTRY_DESC": "Custom woodwork, furniture repair, and carpentry solutions",
    "MAINTENANCE": "General Maintenance",
    "MAINTENANCE_DESC": "Regular preventive maintenance to keep your home in perfect condition",
    "READY_TO_START": "Ready to Get Started?",
    "CTA_DESC": "Book a professional craftsman for your next project and experience quality service",
    "BOOK_NOW": "Book Now"
};

// Write back
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf-8');

// Read Arabic translations
const arPath = path.join(__dirname, 'src', 'assets', 'i18n', 'ar.json');
const arData = JSON.parse(fs.readFileSync(arPath, 'utf-8'));

// Add SERVICE_BOOKING section in Arabic
arData.SERVICE_BOOKING = {
    "TITLE": "خدمات منزلية احترافية",
    "SUBTITLE": "شريكك الموثوق لجميع احتياجات الإصلاح والصيانة المنزلية",
    "HOME_REPAIRS": "إصلاحات منزلية",
    "HOME_REPAIRS_DESC": "إصلاحات وصيانة عامة لمنزلك مع محترفين ماهرين",
    "ELECTRICAL": "الخدمات الكهربائية",
    "ELECTRICAL_DESC": "تركيبات وإصلاحات وفحوصات كهربائية آمنة ومعتمدة",
    "PLUMBING": "السباكة",
    "PLUMBING_DESC": "حلول سباكة احترافية لجميع احتياجات المياه والصرف",
    "PAINTING": "الدهانات والديكور",
    "PAINTING_DESC": "حوّل مساحتك بخدمات دهان وتشطيب احترافية",
    "CARPENTRY": "النجارة",
    "CARPENTRY_DESC": "أعمال خشبية مخصصة وإصلاح الأثاث وحلول النجارة",
    "MAINTENANCE": "الصيانة العامة",
    "MAINTENANCE_DESC": "صيانة وقائية منتظمة للحفاظ على منزلك في حالة مثالية",
    "READY_TO_START": "هل أنت مستعد للبدء؟",
    "CTA_DESC": "احجز حرفيًا محترفًا لمشروعك القادم واختبر خدمة عالية الجودة",
    "BOOK_NOW": "احجز الآن"
};

// Write back
fs.writeFileSync(arPath, JSON.stringify(arData, null, 2), 'utf-8');

console.log('✅ Translations added successfully!');
