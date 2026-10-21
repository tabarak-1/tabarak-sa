# موقع شركة تبارك

موقع ثابت (HTML/CSS) سريع ومجاني الاستضافة، مهيأ لمحركات البحث، يدعم العربية (RTL).

## الصفحات
- الرئيسية، عزل الأسطح، عزل الخزانات، كشف التسربات
- المدونة (`blog/`) + لوحة إدارة المقالات (`admin.html`)

## النشر المجاني على GitHub Pages
1. أنشئ مستودعاً Public باسم `اسم-المستخدم.github.io`.
2. ارفع **محتويات** هذا المجلد (وليس المجلد نفسه) إلى المستودع.
3. من Settings ← Pages اختر Deploy from a branch ← `main` ← `/(root)`.
4. بعد دقيقة افتح `https://اسم-المستخدم.github.io`.

## إعدادات ضرورية بعد النشر
1. افتح `tools/build.py` وغيّر `DOMAIN` إلى رابط موقعك الحقيقي، ثم شغّل `python3 tools/build.py`
   (بدون بايثون: استبدل `https://www.example.com` بالرابط الحقيقي في كل الملفات، بما فيها `data/site.json` و`assets/post-template.html`).
2. أضف الموقع إلى Google Search Console وأرسل `sitemap.xml`، وأنشئ Google Business Profile للشركة في جدة.

## لوحة إدارة المقالات (admin.html)
افتح `https://موقعك/admin.html` لإضافة مقال أو تعديله أو حذفه دون لمس أي ملف.

**الإعداد (مرة واحدة):** أنشئ رمز وصول (Fine-grained token) من GitHub:
Settings ← Developer settings ← Personal access tokens ← Fine-grained tokens ← Generate new token ←
اختر مستودع الموقع فقط ← Repository permissions ← **Contents: Read and write**.
ثم الصق الرمز في صفحة الدخول مع اسم المستودع (مثل `tabarak/tabarak.github.io`).

**الاستخدام:** مقال جديد ← اكتب العنوان والرابط (بالإنجليزية) والوصف والنص ← معاينة ← نشر.
يُحفظ كل شيء في GitHub (commit واحد) ويظهر على الموقع خلال دقيقة أو دقيقتين، وتتحدث المدونة والرئيسية وsitemap تلقائياً.

**ملاحظات:**
- الرمز يُخزَّن في متصفحك فقط ولا يُرسل إلا إلى GitHub. لا تشاركه، ولا تفعّل "تذكّرني" على جهاز عام.
- رابط المقال لا يتغير بعد النشر (للحفاظ على ترتيبه في جوجل).
- بعد نشر أي مقال: افتحه في Google Search Console ← فحص الرابط ← طلب الفهرسة.
- المقالات تُحفظ في `data/posts.json`. إن عدّلت الموقع من جهازك بعد استخدام اللوحة، حمّل آخر نسخة من GitHub أولاً حتى لا تفقد المقالات الجديدة.

## التعديل اليدوي
- **رقم الهاتف والاسم والمدينة:** أعلى `tools/build.py` ثم `python3 tools/build.py`.
- **النصوص:** داخل `tools/build.py` أو ملفات HTML مباشرة.
- **الألوان:** أعلى `assets/style.css` (متغيرات `:root`).
- **الشعار:** `assets/logo.svg` و`assets/favicon.svg`.
