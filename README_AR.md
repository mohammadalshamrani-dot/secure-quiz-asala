
# حزمة واجهة منصة الاختبارات (Static Frontend Pack)

هذه الحزمة ثابتة (HTML/JS/CSS) جاهزة للرفع على GitHub Pages **أو** Render Static Site
وموصولة تلقائيًا بخادمك: `https://secure-quiz-asala-1.onrender.com` عبر الوسم:
```html
<meta name="api-base" content="https://secure-quiz-asala-1.onrender.com" />
```

## الصفحات
- `index.html` الصفحة الترحيبية + أزرار الدخول والنتائج
- `login.html` تسجيل الدخول (يحفظ التوكن في LocalStorage)
- `create-quiz.html` واجهة مبسّطة لإنشاء الاختبار + توليد QR + روابط
- `results.html` عرض ملخص النتائج ورسوم بيانية (يتطلب تسجيل دخول)

## التثبيت السريع (GitHub Pages)
1) ارفع المجلد كله في مستودع GitHub (مثال: `secure-quiz-asala`).
2) من إعدادات المستودع → Pages → اختر النشر من فرع `main`/`root`.
3) تأكد أن الخادم يسمح بالوصول من مصدر موقعك (CORS): 
   - `Access-Control-Allow-Origin: https://<username>.github.io`
   - `Access-Control-Allow-Headers: Authorization, Content-Type`
4) افتح `https://<username>.github.io/secure-quiz-asala/`

## التثبيت على Render (Static Site)
- نوع الخدمة: **Static Site**
- Build command: (فارغ)
- Publish directory: `/` (أو `dist` لو بنيت)
- أضف نفس إعدادات CORS في الخادم ليسمح لمصدر Render Domain.

## ملاحظات
- الواجهة ترسل التوكن في ترويسة `Authorization: Bearer <token>`.
- إذا الخادم يستخدم Cookies بدل الهيدر: عدّل `api.js` لقراءة الكوكي.
- ملفات الجافاسكربت: `src/js/*` — لا تنسَ تضمينها في الصفحات بالترتيب.
