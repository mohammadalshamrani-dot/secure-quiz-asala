# Secure Quiz Asala – Handshake & Results (Custom-ready)

- web/handshake.js : يستقبل postMessage من منصة الإنشاء (الأصل مقيّد على دومين Render الخاص بك).
- web/qrcode.min.js : مكتبة QR (Placeholder بسيط—يفضل استبداله بنسخة qrcode.js الكاملة إن رغبت).
- web/students.html : صفحة نتائج الطلاب (مربوطة بالدومين).
- web/footer-fix.css : حل لتكرار الفوتر.
- backend/server.mjs + package.json + .env.example + supabase_schema.sql : خادم Express + مخطط قاعدة البيانات.

## تضمين السكربتات في صفحة إنشاء الاختبار
<link rel="stylesheet" href="/secure-quiz-asala/web/footer-fix.css">
<script src="/secure-quiz-asala/web/qrcode.min.js"></script>
<script src="/secure-quiz-asala/web/handshake.js"></script>