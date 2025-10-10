# secure-quiz-asala-v4.1.0

- تكبير إطار منصة الاختبار إلى 90vh ورفع عرض الحاوية إلى 1280px.
- اسم المطوّر: **د. محمد الشمراني** في جميع الصفحات.
- تفعيل إرسال البريد من الواجهة (EmailJS اختياري) + حفظ نسخة محلية للشكاوى تظهر في لوحة الأدمن.
- شاشة ترحيب محسّنة ومخفّفة.
- شعار الأصالة Overlay فوق منصة الإنشاء (يظهر للمدرّس داخل الإطار).

## تفعيل البريد
حرّر `assets/common.js`:
```
const ADMIN_EMAIL = "you@domain.com";
const EMAILJS_SERVICE_ID = "xxxx";
const EMAILJS_TEMPLATE_ID = "xxxx";
const EMAILJS_PUBLIC_KEY = "xxxx";
```
> عند عدم وضع المفاتيح، سيستخدم النظام mailto فقط. لروابط الاستعادة الحقيقية، فعّل مسارات الخادم:
`POST /api/auth/request-reset` و `POST /api/auth/reset`، وإرسال SMTP من الخادم.

## ملاحظة الشعار داخل منصة الطالب
إن كان نظام الاختبار يدعم باراميتر شعار، استخدم رابط الطالب هكذا:
`?logo=https://YOUR_GITHUB_PAGES/assets/asala-logo.jpg`
