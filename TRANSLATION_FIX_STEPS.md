# خطوات إصلاح ترجمة تسجيل الحرفي

## 📝 الخطوة 1: إضافة الترجمات للعربي

**الملف**: `public/assets/i18n/ar.json`

**البحث عن**: `"REQUEST_DETAILS": {` (حوالي السطر 480-490)

**إضافة قبلها** (قبل `"REQUEST_DETAILS"`):

انسخ **كل المحتوى** من ملف `REGISTER_CRAFTSMAN_AR.json` الموجود في جذر المشروع وأضفه قبل `"REQUEST_DETAILS"`

---

## 📝 الخطوة 2: إضافة الترجمات للإنجليزي

**الملف**: `public/assets/i18n/en.json`

**البحث عن**: `"REQUEST_DETAILS": {` (حوالي السطر 480-490)

**إضافة قبلها** (قبل `"REQUEST_DETAILS"`):

انسخ **كل المحتوى** من ملف `REGISTER_CRAFTSMAN_EN.json` الموجود في جذر المشروع وأضفه قبل `"REQUEST_DETAILS"`

---

## 📝 الخطوة 3: تحديث component لترجمة أسماء الخدمات

**الملف**: `src/app/pages/register-craftsman/register-craftsman.component.ts`

### أ) إضافة دالة الترجمة

**ابحث عن**: `loadServices()` (حوالي السطر 63-72)

**أضف بعدها مباشرة**:

```typescript
  // ADD THIS METHOD TO TRANSLATE SERVICE NAMES
  translateServiceName(serviceName: string): string {
    const translationKey = `SERVICES.SERVICE_NAMES.${serviceName}`;
    const translated = this.translate.instant(translationKey);
    return translated !== translationKey ? translated : serviceName;
  }
```

**أو** انسخ الملف الكامل من `UPDATED_register-craftsman.component.ts`

---

## 📝 الخطوة 4: تحديث HTML لاستخدام الترجمة

**الملف**: `src/app/pages/register-craftsman/register-craftsman.component.html`

**ابحث عن** السطر 203:
```html
<option [ngValue]="service.serviceId">{{ service.serviceName }}</option>
```

**استبدلها بـ**:
```html
<option [ngValue]="service.serviceId">{{ translateServiceName(service.serviceName) }}</option>
```

---

## ✅ الخطوة 5: تحديث المتصفح

اعمل **Hard Refresh** (Ctrl + Shift + R) أو (Ctrl + F5)

---

## 🎯 النتيجة المتوقعة

✅ جميع النصوص بالعربي والإنجليزي ستظهر صحيحة  
✅ أسماء الخدمات ستظهر مترجمة:
- **Plumbing Repair** → **إصلاح السباكة**
- **Electrical Maintenance** → **صيانة كهربائية**
- **AC Cleaning & Service** → **تنظيف وصيانة المكيفات**
- وهكذا...

---

## 📌 ملاحظات مهمة

- الملفات المساعدة (`REGISTER_CRAFTSMAN_AR.json`, `REGISTER_CRAFTSMAN_EN.json`, `UPDATED_register-craftsman.component.ts`) موجودة في **جذر المشروع** للنسخ منها
- تأكد من صحة JSON بعد النسخ (لا توجد فواصل زائدة)
- الخدمات القادمة من الباك إند دائماً بالإنجليزي، والترجمة تتم في الفرونت إند
