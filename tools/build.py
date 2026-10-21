# -*- coding: utf-8 -*-
"""
مولّد موقع شركة تبارك (ملفات HTML ثابتة).
للتعديل: غيّر الإعدادات والمحتوى هنا ثم شغّل:   python3 tools/build.py
أو عدّل ملفات HTML مباشرة إن فضّلت.
"""
import json, os, pathlib

# ============ الإعدادات الأساسية (غيّرها هنا) ============
DOMAIN = "https://tabarak-1.github.io/tabarak-sa"      # <-- ضع عنوان موقعك الحقيقي بعد النشر (بدون / في النهاية)
NAME = "تبارك"
TAGLINE = "للعزل وكشف التسربات"
PHONE = "0568654551"                    # رقم الاتصال (tel:)
PHONE_DISPLAY = "056 865 4551"
import datetime
TODAY = datetime.date.today().isoformat()
CITY = "جدة"
WA = "966568654551"                     # واتساب (برمز السعودية)
# =========================================================

OUT = pathlib.Path(__file__).resolve().parent.parent

LOGO = '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="شعار تبارك"><rect width="64" height="64" rx="16" fill="#0b3a5b"/><path d="M10 31 32 13 54 31" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 28C32 28 22 39 22 45a10 10 0 0 0 20 0C42 39 32 28 32 28Z" fill="#22b8d9"/><path d="M27 45a5 5 0 0 0 4 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/></svg>'''

PHONE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.6 3.6a1 1 0 0 1-.25 1z"/></svg>'

WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.2.7-1.3 1.3-1.8 1.4-.5.1-1 .1-3.1-.7a10.5 10.5 0 0 1-4.1-3.6c-.8-1-1.3-2.1-1.4-2.4s-.3-1.6.5-2.4c.3-.3.6-.4.8-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z"/></svg>'
WA_URL = f"https://wa.me/{WA}?text=" + "%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D9%85%D8%B9%D8%A7%D9%8A%D9%86%D8%A9"

ICONS = {
 "roof": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12 12 4l9 8"/><path d="M5 10.5V20h14v-9.5"/><path d="M10 20v-5h4v5"/></svg>',
 "tank": '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/></svg>',
 "search": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/><path d="M11 8.5c-1.3 1.6-2 2.6-2 3.5a2 2 0 0 0 4 0c0-.9-.7-1.9-2-3.5Z"/></svg>',
}

NAV = [
 ("index.html", "الرئيسية"),
 ("roof-insulation.html", "عزل الأسطح"),
 ("tank-insulation.html", "عزل الخزانات"),
 ("leak-detection.html", "كشف التسربات"),
 ("blog/index.html", "المدونة"),
]

SERVICES = {
 "roof-insulation": {
  "title": "عزل الأسطح", "icon": "roof",
  "short": "حماية السطح من تسرب مياه الأمطار والرطوبة والحرارة بأنظمة عزل مناسبة لنوع السطح.",
  "seo_title": "عزل أسطح في جدة | عزل مائي وحراري - تبارك",
  "desc": "خدمة عزل أسطح في جدة من تبارك: عزل مائي وحراري، معالجة تسربات الأسطح، وتنفيذ مرتب بمواد مناسبة لحالة السطح. اتصل للمعاينة.",
  "h1": "عزل الأسطح في جدة",
  "lead": "السطح هو خط الدفاع الأول لمبناك. نعزله بنظام مناسب لحالته ونوع استخدامه ليمنع تسرب المياه ويقلل الرطوبة وانتقال الحرارة إلى الداخل.",
  "body": """
<h2>لماذا تحتاج إلى عزل السطح؟</h2>
<p>مع الوقت تتشقق الأسطح غير المعزولة أو ضعيفة العزل، فتتسرب المياه إلى الأسقف وتظهر بقع الرطوبة والعفن وتتلف الدهانات والأثاث، وقد يصل الضرر إلى حديد التسليح. العزل الجيد يوفر عليك تكاليف الإصلاح المتكررة ويحسّن راحة المكان.</p>
<h2>أنواع العزل التي نعمل بها</h2>
<ul>
<li><strong>عزل مائي بالرولات البيتومينية:</strong> أغشية تُلحم بالحرارة وتعطي طبقة مقاومة للماء ومناسبة للأسطح المكشوفة.</li>
<li><strong>عزل بالبولي يوريثان (رش):</strong> طبقة مستمرة بلا فواصل تجمع بين العزل المائي والحراري.</li>
<li><strong>عزل بالمواد الأسمنتية أو الإيبوكسية:</strong> مناسب لبعض الحمامات والمساحات الصغيرة والأسطح المحدودة.</li>
<li><strong>عزل حراري:</strong> ألواح أو رغوة تقلل انتقال الحرارة وتخفف حمل التكييف.</li>
</ul>
<p>اختيار النظام الأنسب يعتمد على حالة السطح، وطريقة استخدامه، والميزانية، ولهذا نبدأ دائماً بمعاينة قبل تحديد الحل.</p>
<h2>علامات تدل على حاجة سطحك للعزل</h2>
<ul>
<li>بقع رطوبة أو تقشّر دهان في الأسقف والجدران العلوية.</li>
<li>تشققات أو انتفاخ في أرضية السطح أو في طبقة العزل القديمة.</li>
<li>تجمع مياه في السطح لفترة بعد المطر.</li>
<li>ارتفاع حرارة الغرف العلوية بشكل ملحوظ في الصيف.</li>
</ul>
<h2>خطوات التنفيذ</h2>
<ol>
<li>معاينة السطح وتحديد مصادر التسرب والمشكلات.</li>
<li>تنظيف السطح وإصلاح الشروخ ومعالجة الأركان والمصارف.</li>
<li>تطبيق نظام العزل المناسب بالسماكة والطبقات الصحيحة.</li>
<li>اختبار العزل والتأكد من سلامة التنفيذ قبل التسليم.</li>
</ol>
<div class="callout"><strong>نصيحة:</strong> لا تؤجل العزل إلى أن يظهر التسرب داخل المنزل؛ المعالجة المبكرة أرخص وأسرع بكثير.</div>
""",
  "faq": [
   ("كم يستمر عمر عزل السطح؟", "يختلف حسب نوع المادة وجودة التنفيذ وتعرض السطح للشمس والاستخدام. التنفيذ الصحيح على سطح مجهّز جيداً هو أهم عامل لطول العمر."),
   ("هل يلزم تكسير العزل القديم؟", "ليس دائماً. نفحص حالة العزل القديم؛ إن كان متماسكاً قد نعالجه ونضيف عليه، وإن كان متضرراً نزيله قبل التنفيذ."),
   ("هل تقدمون معاينة قبل السعر؟", "نعم، نعاين الحالة أولاً ثم نقترح الحل المناسب. اتصل بنا لترتيب موعد."),
  ]},
 "tank-insulation": {
  "title": "عزل الخزانات", "icon": "tank",
  "short": "عزل مائي وحراري للخزانات الأرضية والعلوية للحفاظ على سلامة المياه ومنع التسرب.",
  "seo_title": "عزل خزانات مياه في جدة | أرضية وعلوية - تبارك",
  "desc": "عزل خزانات مياه في جدة، أرضية وعلوية، من تبارك: عزل مائي للمنع تسرب المياه، وعزل حراري للخزانات العلوية للحفاظ على برودة المياه. اتصل للمعاينة.",
  "h1": "عزل الخزانات في جدة",
  "lead": "سواء كان الخزان أرضياً أو علوياً، نوفر عزلاً يمنع التسرب ويحمي المياه من التلوث والحرارة، بمواد مناسبة للاستخدام مع مياه الشرب عند الحاجة.",
  "body": """
<h2>ما أهمية عزل الخزانات؟</h2>
<p>تسرب خزان المياه يعني هدر مياه وارتفاع فواتير ورطوبة في التربة أو في الأسقف القريبة، وقد يضعف الخرسانة مع الوقت. وعزل الخزان يحمي أيضاً المياه من دخول الشوائب أو تغيّر جودتها.</p>
<h2>الخزانات الأرضية</h2>
<p>غالباً تحتاج إلى عزل مائي داخلي أو خارجي حسب الإمكانية، مع معالجة الشروخ وفواصل الصب وأماكن مرور المواسير قبل وضع طبقة العزل. عند التعامل مع مياه الشرب يجب اختيار مواد مناسبة لهذا الاستخدام.</p>
<h2>الخزانات العلوية</h2>
<p>تتعرض لأشعة الشمس مباشرة فترتفع حرارة المياه، لذلك يُضاف عزل حراري عاكس أو رغوة عازلة، بالإضافة إلى معالجة أي تسرب في الجسم أو الوصلات.</p>
<h2>ما الذي نقوم به؟</h2>
<ul>
<li>فحص الخزان وتحديد أماكن التسرب أو الشروخ.</li>
<li>تنظيف الخزان وتجهيز الأسطح وإصلاح العيوب.</li>
<li>تنفيذ العزل المائي و/أو الحراري المناسب.</li>
<li>اختبار الخزان بالتعبئة والتأكد من عدم وجود تسرب قبل التسليم.</li>
</ul>
<div class="callout"><strong>ملاحظة:</strong> إذا لاحظت انخفاضاً غير مبرر في منسوب المياه، فقد يكون السبب تسرباً؛ يمكننا فحصه وتحديد موضعه.</div>
""",
  "faq": [
   ("هل يصلح العزل لخزانات مياه الشرب؟", "نعم عند استخدام مواد مناسبة لملامسة مياه الشرب. أخبرنا بنوع الاستخدام لنحدد المادة الصحيحة."),
   ("كم يستغرق عزل الخزان؟", "يختلف حسب الحجم والحالة وزمن جفاف المواد. نحدد المدة بعد المعاينة."),
   ("هل يمكن كشف مكان التسرب في الخزان أولاً؟", "نعم، يمكن فحص الخزان وتحديد التسرب قبل المعالجة."),
  ]},
 "leak-detection": {
  "title": "كشف التسربات", "icon": "search",
  "short": "تحديد مكان تسرب المياه بدقة قبل المعالجة لتقليل التكسير والتكلفة.",
  "seo_title": "كشف تسربات المياه في جدة بدون تكسير - تبارك",
  "desc": "كشف تسربات المياه في جدة من تبارك: تحديد مصدر التسرب في الأسقف والأسطح والمواسير والخزانات بطرق فحص حديثة، لتقليل التكسير وتسريع المعالجة.",
  "h1": "كشف التسربات في جدة",
  "lead": "أصعب جزء في التسرب هو معرفة مكانه. نستخدم أساليب فحص مناسبة لتحديد مصدر المشكلة بأقل تدخل ممكن، ثم نقترح المعالجة الصحيحة.",
  "body": """
<h2>متى تحتاج إلى كشف تسرب؟</h2>
<ul>
<li>ظهور بقع رطوبة أو عفن في سقف أو جدار دون سبب واضح.</li>
<li>ارتفاع مفاجئ في فاتورة المياه.</li>
<li>انخفاض ضغط المياه أو سماع صوت جريان بلا استخدام.</li>
<li>رطوبة في الأرضيات أو تبلل التربة حول المبنى.</li>
</ul>
<h2>طرق الكشف المستخدمة</h2>
<ul>
<li><strong>الفحص البصري والمعاينة الميدانية:</strong> لتتبع أثر الرطوبة والتحليل المبدئي.</li>
<li><strong>اختبار الضغط:</strong> للتأكد من وجود تسرب في شبكة المواسير وتحديد القسم المتأثر.</li>
<li><strong>الكشف الصوتي:</strong> الاستماع لصوت التسرب في المواسير المضغوطة.</li>
<li><strong>التصوير الحراري:</strong> يساعد في إظهار الفروق الحرارية الناتجة عن الرطوبة خلف الأسطح.</li>
<li><strong>اختبار تعبئة الخزانات والأسطح:</strong> لتحديد التسرب من الأسطح أو الأحواض.</li>
</ul>
<p>تختلف الطريقة المناسبة حسب مكان التسرب ونوعه، وقد نجمع أكثر من طريقة للوصول إلى نتيجة موثوقة.</p>
<h2>لماذا الكشف قبل الإصلاح؟</h2>
<p>تحديد المكان بدقة يوفر عليك تكسير مساحات كبيرة دون داعٍ، ويضمن أن المعالجة تستهدف السبب الحقيقي وليس العَرَض فقط.</p>
<div class="callout"><strong>تنبيه:</strong> إن لاحظت تسرباً قوياً فأغلق المحبس الرئيسي للمياه أولاً ثم اتصل بنا.</div>
""",
  "faq": [
   ("هل الكشف بدون تكسير؟", "غالباً نحدد الموضع بأساليب غير إتلافية، ولا نكسر إلا في أضيق نطاق عند الحاجة للإصلاح."),
   ("هل تعالجون التسرب بعد كشفه؟", "نعم، نكشف ثم نعالج، سواء كان في السطح أو الخزان أو الحمام أو غيرها."),
   ("كيف أعرف أن عندي تسرباً في المواسير؟", "ارتفاع الفاتورة بلا سبب أو استمرار حركة عداد المياه عند إغلاق كل الصنابير من أهم المؤشرات."),
  ]},
}

HOME_FAQ = [
 ("هل تخدمون مدينة جدة؟", "نعم، نخدم جدة وما حولها. اتصل بنا لتأكيد موقعك وترتيب المعاينة."),
 ("ما الخدمات التي تقدمها شركة تبارك؟", "نقدم عزل الأسطح (مائي وحراري)، وعزل الخزانات الأرضية والعلوية، وكشف تسربات المياه ومعالجتها."),
 ("كيف أطلب معاينة؟", f"اتصل بنا على {PHONE_DISPLAY} وسنحدد معك موعد المعاينة وتفاصيل الحالة."),
 ("هل المعاينة ضرورية قبل تحديد الحل؟", "نعم، لأن اختيار نظام العزل يعتمد على حالة السطح أو الخزان ومصدر المشكلة."),
 ("هل تقدمون استشارات قبل التنفيذ؟", "بالتأكيد، نشرح لك الخيارات المتاحة والفروق بينها لتتخذ قرارك بوضوح."),
]

# المقالات تُحفظ في data/posts.json (ويمكن إدارتها من صفحة admin.html)
POSTS = json.loads((OUT / "data" / "posts.json").read_text(encoding="utf-8"))

def esc(s): return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;")

def jsonld(d): return '<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c") + '</script>'

def page(path, title, desc, body, root="", schema=None, og="website", hero_cls=""):
    url = f"{DOMAIN}/{path}" if path != "index.html" else f"{DOMAIN}/"
    nav = ""
    for href, label in NAV:
        cur = ' aria-current="page"' if href == path else ""
        nav += f'<li><a href="{root}{href}"{cur}>{label}</a></li>'
    nav += f'<li><a class="btn btn-primary" href="tel:{PHONE}">اتصل الآن</a></li>'
    graphs = [{
      "@context": "https://schema.org", "@type": "LocalBusiness", "name": f"{NAME} {TAGLINE}",
      "url": DOMAIN + "/", "telephone": "+966" + PHONE[1:], "image": DOMAIN + "/assets/logo.svg",
      "description": "عزل أسطح وعزل خزانات وكشف تسربات المياه في جدة.",
      "address": {"@type": "PostalAddress", "addressLocality": CITY, "addressCountry": "SA"},
      "areaServed": {"@type": "City", "name": CITY},
      "makesOffer": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": s["title"]}} for s in SERVICES.values()],
    }]
    if schema: graphs += schema
    ld = "".join(jsonld(g) for g in graphs)
    return f'''<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0b3a5b">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="{og}">
<meta property="og:locale" content="ar_SA">
<meta property="og:site_name" content="{NAME} {TAGLINE}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/svg+xml" href="{root}assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="{root}assets/style.css">
{ld}
</head>
<body>
<a class="skip" href="#main">تخطي إلى المحتوى</a>
<header class="site-header"><div class="container nav">
<a class="brand" href="{root}index.html" aria-label="{NAME} - الصفحة الرئيسية">{LOGO}<span><b>{NAME}</b><small>{TAGLINE}</small></span></a>
<button class="burger" aria-label="القائمة" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
<ul class="menu" id="menu">{nav}</ul>
</div></header>
<main id="main">
{body}
</main>
<footer class="site-footer"><div class="container">
<div class="fgrid">
<div><a class="brand" href="{root}index.html">{LOGO}<span><b>{NAME}</b><small>{TAGLINE}</small></span></a>
<p>شركة في {CITY} متخصصة في عزل الأسطح وعزل الخزانات وكشف تسربات المياه.</p></div>
<div><h3>الخدمات</h3><ul>
{"".join(f'<li><a href="{root}{k}.html">{v["title"]}</a></li>' for k,v in SERVICES.items())}
</ul></div>
<div><h3>تواصل معنا</h3><ul>
<li><a href="tel:{PHONE}"><span class="ltr">{PHONE_DISPLAY}</span></a></li>
<li><a href="{WA_URL}" rel="noopener">واتساب</a></li>
<li>{CITY}، المملكة العربية السعودية</li>
<li><a href="{root}blog/index.html">المدونة</a></li>
</ul></div>
</div>
<div class="copy">© <span id="year">2026</span> {NAME} {TAGLINE}. جميع الحقوق محفوظة.</div>
</div></footer>
<a class="fab" href="tel:{PHONE}" aria-label="اتصل بنا">{PHONE_ICON}</a>
<a class="fab fab-wa" href="{WA_URL}" rel="noopener" aria-label="واتساب">{WA_ICON}</a>
<script src="{root}assets/main.js" defer></script>
</body>
</html>'''

def cta(root=""):
    return f'''<section class="cta"><div class="container">
<h2>هل لديك مشكلة تسرب أو تحتاج إلى عزل؟</h2>
<p>اتصل بنا الآن لترتيب معاينة وتحديد الحل المناسب.</p>
<a class="phone-big" href="tel:{PHONE}">{PHONE_DISPLAY}</a><br>
<a class="btn btn-primary" href="tel:{PHONE}">{PHONE_ICON}اتصل بنا</a> <a class="btn btn-ghost" href="{WA_URL}" rel="noopener">{WA_ICON}واتساب</a>
</div></section>'''

def faq_html(items):
    return '<div class="faq">' + "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q,a in items) + "</div>"

def faq_schema(items):
    return {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in items]}

def breadcrumb(items):
    return {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":DOMAIN+u} for i,(n,u) in enumerate(items)]}

def write(path, html):
    p = OUT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html, encoding="utf-8")

def post_cards(posts, root):
    return "".join(f'''<article class="card post-card"><div class="meta">{p["date_ar"]} · قراءة {p["read"]}</div>
<h3><a href="{root}blog/{p["slug"]}.html">{esc(p["title"])}</a></h3><p>{esc(p["desc"])}</p>
<a class="more" href="{root}blog/{p["slug"]}.html">اقرأ المزيد ←</a></article>''' for p in posts)

urls = []

# ---------- الرئيسية ----------
cards = "".join(f'''<article class="card"><div class="icon">{ICONS[v["icon"]]}</div><h3>{v["title"]}</h3><p>{v["short"]}</p><a class="more" href="{k}.html">تفاصيل الخدمة ←</a></article>''' for k,v in SERVICES.items())
why = [("معاينة قبل التنفيذ","نفحص الحالة أولاً ونشرح لك الحل بوضوح قبل البدء."),
       ("حلول مناسبة لكل حالة","نختار نظام العزل حسب نوع السطح أو الخزان وليس حلاً واحداً للجميع."),
       ("كشف دقيق للمشكلة","نحدد مصدر التسرب بأساليب فحص مناسبة لتقليل التكسير."),
       ("تنفيذ مرتب وملتزم","عمل منظم ونظافة في الموقع والتزام بما اتفقنا عليه.")]
why_html = "".join(f'<div class="card"><h3>{t}</h3><p>{d}</p></div>' for t,d in why)
steps = [("اتصل بنا","تواصل معنا واشرح المشكلة أو الخدمة المطلوبة."),("معاينة وتشخيص","نزور الموقع ونحدد السبب ونقترح الحل."),("التنفيذ","نبدأ العمل بالمواد والطريقة المتفق عليها."),("اختبار وتسليم","نتأكد من النتيجة ونسلّمك العمل جاهزاً.")]
steps_html = "".join(f'<div class="step"><div class="num">{i+1}</div><h3>{t}</h3><p>{d}</p></div>' for i,(t,d) in enumerate(steps))
home = f'''
<section class="hero"><div class="container">
<div><h1>{NAME} لعزل الأسطح والخزانات وكشف التسربات في {CITY}</h1>
<p class="lead">نخدم مدينة {CITY} وما حولها. نحمي مبناك من الرطوبة والتسربات بحلول عزل احترافية، ونحدد مصدر التسرب بدقة لتقليل التكسير والتكلفة.</p>
<div class="actions"><a class="btn btn-primary" href="tel:{PHONE}">{PHONE_ICON}اتصل الآن: <span class="ltr">{PHONE_DISPLAY}</span></a>
<a class="btn btn-ghost" href="{WA_URL}" rel="noopener">{WA_ICON}واتساب</a></div></div>
<div class="hero-card"><ul>
<li><span class="tick"></span><span>عزل مائي وحراري للأسطح</span></li>
<li><span class="tick"></span><span>عزل الخزانات الأرضية والعلوية</span></li>
<li><span class="tick"></span><span>كشف تسربات المياه بدقة</span></li>
<li><span class="tick"></span><span>معاينة قبل تحديد الحل</span></li>
</ul></div></div></section>
<section id="services"><div class="container">
<div class="section-head"><h2>خدماتنا</h2><p>حلول متخصصة لمشكلات المياه والرطوبة في المباني.</p></div>
<div class="grid g3">{cards}</div></div></section>
<section class="alt"><div class="container">
<div class="section-head"><h2>لماذا تختار تبارك؟</h2></div>
<div class="grid g4">{why_html}</div></div></section>
<section><div class="container">
<div class="section-head"><h2>كيف نعمل؟</h2><p>أربع خطوات واضحة من الاتصال إلى التسليم.</p></div>
<div class="grid g4">{steps_html}</div></div></section>
<section class="alt"><div class="container">
<div class="section-head"><h2>أحدث مقالات المدونة</h2><p>نصائح مفيدة حول العزل وكشف التسربات.</p></div>
<div class="grid g3"><!--POSTS:START-->{post_cards(POSTS[:3], "")}<!--POSTS:END--></div></div></section>
<section><div class="container">
<div class="section-head"><h2>أسئلة شائعة</h2></div>{faq_html(HOME_FAQ)}</div></section>
{cta()}'''
write("index.html", page("index.html", f"{NAME} | عزل أسطح وعزل خزانات وكشف تسربات في {CITY}", "شركة تبارك في جدة متخصصة في عزل الأسطح وعزل الخزانات وكشف تسربات المياه. معاينة وحلول احترافية. اتصل الآن " + PHONE_DISPLAY, home, schema=[faq_schema(HOME_FAQ)]))
urls.append(("", "1.0"))

# ---------- صفحات الخدمات ----------
for k, v in SERVICES.items():
    path = f"{k}.html"
    related = "".join(f'<li><a href="{kk}.html">{vv["title"]}</a></li>' for kk, vv in SERVICES.items() if kk != k)
    body = f'''
<section class="hero page-hero"><div class="container"><div>
<div class="crumbs"><a href="index.html">الرئيسية</a> / {v["title"]}</div>
<h1>{v["h1"]}</h1><p class="lead">{v["lead"]}</p>
<div class="actions"><a class="btn btn-primary" href="tel:{PHONE}">{PHONE_ICON}اطلب معاينة: <span class="ltr">{PHONE_DISPLAY}</span></a></div>
</div></div></section>
<section><div class="container"><div class="content">{v["body"]}
<h2>خدمات أخرى</h2><ul>{related}<li><a href="blog/index.html">مقالات المدونة</a></li></ul>
</div></div></section>
<section class="alt"><div class="container"><div class="section-head"><h2>أسئلة حول {v["title"]}</h2></div>{faq_html(v["faq"])}</div></section>
{cta()}'''
    sch = [faq_schema(v["faq"]), breadcrumb([("الرئيسية","/"),(v["title"],"/"+path)])]
    write(path, page(path, v["seo_title"], v["desc"], body, schema=sch))
    urls.append((path, "0.9"))

# ---------- المدونة ----------
blog_body = f'''
<section class="hero page-hero"><div class="container"><div>
<div class="crumbs"><a href="../index.html">الرئيسية</a> / المدونة</div>
<h1>مدونة {NAME}</h1><p class="lead">مقالات ونصائح عن عزل الأسطح والخزانات وكشف تسربات المياه.</p></div></div></section>
<section><div class="container"><div class="grid g3"><!--POSTS:START-->{post_cards(POSTS, "../")}<!--POSTS:END--></div></div></section>
{cta("../")}'''
write("blog/index.html", page("blog/index.html", f"مدونة {NAME} | نصائح العزل وكشف التسربات", "مقالات ونصائح من تبارك حول عزل الأسطح، عزل الخزانات، وكشف تسربات المياه.", blog_body, root="../",
      schema=[breadcrumb([("الرئيسية","/"),("المدونة","/blog/index.html")])]))
urls.append(("blog/index.html", "0.8"))

def post_body(title, date_ar, read, body, related):
    return f'''
<section class="hero page-hero"><div class="container"><div>
<div class="crumbs"><a href="../index.html">الرئيسية</a> / <a href="index.html">المدونة</a></div>
<h1>{title}</h1><p class="meta" style="color:#bcd6e5">{date_ar} · قراءة {read}</p></div></div></section>
<section><div class="container"><article class="content">{body}
<p><a class="btn btn-dark" href="tel:{PHONE}">{PHONE_ICON}اتصل بنا: <span class="ltr">{PHONE_DISPLAY}</span></a></p>
</article></div></section>
<section class="alt"><div class="container"><div class="section-head"><h2>مقالات ذات صلة</h2></div>
<div class="grid g3" style="max-width:780px;margin:auto;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">{related}</div></div></section>
{cta("../")}'''

for p in POSTS:
    path = f"blog/{p['slug']}.html"
    others = [x for x in POSTS if x is not p][:2]
    body = post_body(esc(p["title"]), p["date_ar"], p["read"], p["body"], post_cards(others, "../"))
    art = {"@context":"https://schema.org","@type":"Article","headline":p["title"],"description":p["desc"],
           "datePublished":p["date"],"dateModified":p.get("modified", p["date"]),"inLanguage":"ar",
           "mainEntityOfPage":f"{DOMAIN}/{path}",
           "author":{"@type":"Organization","name":NAME},
           "publisher":{"@type":"Organization","name":NAME,"logo":{"@type":"ImageObject","url":DOMAIN+"/assets/logo.svg"}}}
    write(path, page(path, p["title"] + f" - {NAME}", p["desc"], body, root="../", og="article",
          schema=[art, breadcrumb([("الرئيسية","/"),("المدونة","/blog/index.html"),(p["title"],"/"+path)])]))
    urls.append((path, "0.7", p.get("modified", p["date"])))

# قالب المقال: تستخدمه صفحة admin.html لإنشاء المقالات الجديدة (يُولَّد تلقائياً، لا تعدّله يدوياً)
_tpl = page("blog/{{SLUG}}.html", "{{TITLE}} - " + NAME, "{{DESC}}",
            post_body("{{TITLE}}", "{{DATE_AR}}", "{{READ}}", "{{BODY}}", "{{RELATED}}"), root="../", og="article")
assert "</script>\n</head>" in _tpl
write("assets/post-template.html", _tpl.replace("</script>\n</head>", "</script>{{POST_SCHEMA}}\n</head>", 1))
write("data/site.json", json.dumps({"domain": DOMAIN, "name": NAME, "phone": PHONE, "phoneDisplay": PHONE_DISPLAY}, ensure_ascii=False, indent=2) + "\n")
write(".nojekyll", "")

# ---------- 404 ----------
write("404.html", page("404.html", f"الصفحة غير موجودة - {NAME}", "الصفحة المطلوبة غير موجودة.",
  f'<section><div class="container content" style="text-align:center"><h1>الصفحة غير موجودة</h1><p>ربما تم نقل الصفحة أو أن الرابط غير صحيح.</p><p><a class="btn btn-dark" href="{DOMAIN}/index.html">العودة للرئيسية</a></p></div></section>').replace('<meta name="robots" content="index,follow,max-image-preview:large">','<meta name="robots" content="noindex">'))

# ---------- sitemap / robots / شعار ----------
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for u, pr, *lm in urls:
    sm += f"<url><loc>{DOMAIN}/{u}</loc><lastmod>{lm[0] if lm else TODAY}</lastmod><priority>{pr}</priority></url>\n"
sm += "</urlset>\n"
write("sitemap.xml", sm)
write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n")
write("assets/favicon.svg", LOGO.replace(' role="img" aria-label="شعار تبارك"', ""))
logo_full = f'''<svg viewBox="0 0 260 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="شعار تبارك"><g transform="translate(190 4)">{LOGO.replace('<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="شعار تبارك">','<g>').replace('</svg>','</g>')}</g><text x="182" y="40" text-anchor="end" font-family="Cairo,Tahoma,Arial,sans-serif" font-size="32" font-weight="800" fill="#0b3a5b">{NAME}</text><text x="182" y="60" text-anchor="end" font-family="Cairo,Tahoma,Arial,sans-serif" font-size="13" fill="#5b7080">{TAGLINE}</text></svg>'''
write("assets/logo.svg", logo_full)
print("pages:", len(urls) + 1)
