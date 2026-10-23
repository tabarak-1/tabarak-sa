/* مولّد موقع تبارك: يحوّل data/content.json + data/posts.json إلى صفحات الموقع كلها.
   يعمل في المتصفح (لوحة الأدمن) وفي Node (tools/build.js) بنفس الكود تماماً. */
(function (root) {
  'use strict';

  var DEF = { primary: '#0b3a5b', accent: '#1fb5d6', button: '#f59e0b' };
  var PHONE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.6 3.6a1 1 0 0 1-.25 1z"/></svg>';
  var WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.2.7-1.3 1.3-1.8 1.4-.5.1-1 .1-3.1-.7a10.5 10.5 0 0 1-4.1-3.6c-.8-1-1.3-2.1-1.4-2.4s-.3-1.6.5-2.4c.3-.3.6-.4.8-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z"/></svg>';
  var ICONS = {
    roof: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12 12 4l9 8"/><path d="M5 10.5V20h14v-9.5"/><path d="M10 20v-5h4v5"/></svg>',
    tank: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/><path d="M11 8.5c-1.3 1.6-2 2.6-2 3.5a2 2 0 0 0 4 0c0-.9-.7-1.9-2-3.5Z"/></svg>',
    drop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C12 3 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-12-7-12Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5a4 4 0 0 0 5 5L10 21a2.1 2.1 0 0 1-3-3l9.5-9.5Z"/><path d="M15 9l-1-1"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7"/><path d="M6 10v10h12V10"/></svg>'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function jsonld(o) { return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>'; }
  function validHex(h, d) { return /^#[0-9a-f]{6}$/i.test(h || '') ? h.toLowerCase() : d; }
  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function hex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]); }
  function withToc(html, label, extra) {
    var n = 0, items = [];
    var out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, function (m, a, t) {
      if (/\sid=/.test(a)) return m;
      n++; items.push(['sec-' + n, t.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()]);
      return '<h2' + a + ' id="sec-' + n + '">' + t + '</h2>';
    });
    items = items.concat(extra || []);
    if (items.length < 2) return html;
    return '<nav class="toc" aria-label="' + (label || 'محتويات المقال') + '"><b>' + (label || 'محتويات المقال') + '</b><ol>' + items.map(function (i) { return '<li><a href="#' + i[0] + '">' + esc(i[1]) + '</a></li>'; }).join('') + '</ol></nav>\n' + out;
  }
  function fixAssets(html, rootPath) { return rootPath ? String(html).replace(/(src|href)="assets\//g, '$1="' + rootPath + 'assets/') : html; }
  function maxDate(list, fallback) { return list.reduce(function (m, d) { return d > m ? d : m; }, fallback || ''); }

  function makeCtx(content, posts) {
    var S = content.settings, c = {};
    c.S = S; c.name = S.name; c.tagline = S.tagline; c.city = S.city;
    c.domain = String(S.domain || '').replace(/\/+$/, '');
    c.phone = S.phone; c.disp = S.phoneDisplay || S.phone;
    var cc = S.countryCode || '966';
    c.intl = cc + (String(S.phone).charAt(0) === '0' ? String(S.phone).slice(1) : S.phone);
    c.wa = 'https://wa.me/' + c.intl + '?text=' + encodeURIComponent(S.waMessage || '');
    var col = S.colors || {};
    c.colors = { primary: validHex(col.primary, DEF.primary), accent: validHex(col.accent, DEF.accent), button: validHex(col.button, DEF.button) };
    c.drop = c.colors.accent === DEF.accent ? '#22b8d9' : c.colors.accent;
    c.services = content.services || [];
    c.pages = content.pages || [];
    c.posts = posts || [];
    c.nav = [['index.html', 'الرئيسية']];
    c.services.forEach(function (s) { c.nav.push([s.slug + '.html', s.title]); });
    c.pages.forEach(function (p) { if (p.inMenu) c.nav.push([p.slug + '.html', p.title]); });
    c.nav.push(['blog/index.html', 'المدونة']);
    return c;
  }

  function logoInner(c) {
    return '<rect width="64" height="64" rx="16" fill="' + c.colors.primary + '"/><path d="M10 31 32 13 54 31" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 28C32 28 22 39 22 45a10 10 0 0 0 20 0C42 39 32 28 32 28Z" fill="' + c.drop + '"/><path d="M27 45a5 5 0 0 0 4 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>';
  }
  function logo(c) { return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="شعار ' + esc(c.name) + '">' + logoInner(c) + '</svg>'; }

  function faqHtml(items) {
    return '<div class="faq">' + items.map(function (i) { return '<details><summary>' + esc(i.q) + '</summary><p>' + esc(i.a) + '</p></details>'; }).join('') + '</div>';
  }
  function faqSchema(items) {
    return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(function (i) { return { '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } }; }) };
  }
  function breadcrumb(c, items) {
    return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(function (x, i) { return { '@type': 'ListItem', position: i + 1, name: x[0], item: c.domain + x[1] }; }) };
  }
  function cards(c, posts, rp) {
    return posts.map(function (p) {
      var u = rp + 'blog/' + p.slug + '.html';
      var img = p.image ? '<a href="' + u + '"><img class="thumb" src="' + rp + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async"></a>' : '';
      return '<article class="card post-card">' + img + '<div class="meta">' + p.date_ar + ' · قراءة ' + p.read + '</div>\n' +
        '<h3><a href="' + u + '">' + esc(p.title) + '</a></h3><p>' + esc(p.desc) + '</p>\n' +
        '<a class="more" href="' + u + '">اقرأ المزيد ←</a></article>';
    }).join('');
  }
  function cta(c) {
    var S = c.S;
    return '<section class="cta"><div class="container">\n<h2>' + esc(S.ctaTitle) + '</h2>\n<p>' + esc(S.ctaText) + '</p>\n' +
      '<a class="phone-big" href="tel:' + c.phone + '">' + esc(c.disp) + '</a><br>\n' +
      '<a class="btn btn-primary" href="tel:' + c.phone + '">' + PHONE_ICON + 'اتصل بنا</a> <a class="btn btn-ghost" href="' + c.wa + '" rel="noopener">' + WA_ICON + 'واتساب</a>\n</div></section>';
  }
  function areasHtml(c) {
    var S = c.S, a = S.areas || [];
    if (!a.length) return '';
    return '<h2>' + esc(S.areasTitle) + '</h2><p>' + esc(S.areasIntro) + '</p><ul class="areas">' +
      a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p>' + esc(S.areasOutro) + '</p>';
  }

  function page(c, o) {
    var path = o.path, rp = o.root || '', og = o.og || 'website';
    var url = path === 'index.html' ? c.domain + '/' : c.domain + '/' + path;
    var S = c.S;
    var nav = c.nav.map(function (n) { return '<li><a href="' + rp + n[0] + '"' + (n[0] === path ? ' aria-current="page"' : '') + '>' + esc(n[1]) + '</a></li>'; }).join('');
    nav += '<li><a class="btn btn-primary" href="tel:' + c.phone + '">اتصل الآن</a></li>';
    var graphs = [{
      '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': c.domain + '/#business', name: c.name + ' ' + c.tagline,
      url: c.domain + '/', telephone: '+' + c.intl, image: c.domain + '/assets/og-image.png', logo: c.domain + '/assets/icon-512.png',
      description: S.schemaDescription,
      address: { '@type': 'PostalAddress', addressLocality: c.city, addressCountry: S.countryIso || 'SA' },
      areaServed: { '@type': 'City', name: c.city, containedInPlace: { '@type': 'Country', name: S.country } },
      makesOffer: c.services.map(function (s) { return { '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title } }; })
    }];
    if (o.schema) graphs = graphs.concat(o.schema);
    var ld = graphs.map(jsonld).join('');
    var verify = '';
    if (S.googleVerify) verify += '<meta name="google-site-verification" content="' + esc(S.googleVerify) + '">\n';
    if (S.bingVerify) verify += '<meta name="msvalidate.01" content="' + esc(S.bingVerify) + '">\n';
    var imgUrl = o.image ? c.domain + '/' + o.image : c.domain + '/assets/og-image.png';
    var imgDims = o.image ? '' : '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n';
    var robots = o.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index,follow,max-image-preview:large">';
    var T = esc(o.title), D = esc(o.desc), brand = esc(c.name) + ' ' + esc(c.tagline), lg = logo(c);
    var svcLinks = c.services.map(function (s) { return '<li><a href="' + rp + s.slug + '.html">' + esc(s.title) + '</a></li>'; }).join('');
    var pageLinks = c.pages.filter(function (p) { return p.inMenu; }).map(function (p) { return '<li><a href="' + rp + p.slug + '.html">' + esc(p.title) + '</a></li>\n'; }).join('');
    return '<!DOCTYPE html>\n<html lang="ar-SA" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      verify + '<title>' + T + '</title>\n<meta name="description" content="' + D + '">\n<link rel="canonical" href="' + url + '">\n' +
      '<meta name="theme-color" content="' + c.colors.primary + '">\n' + robots + '\n' +
      '<meta property="og:type" content="' + og + '">\n<meta property="og:locale" content="ar_SA">\n<meta property="og:site_name" content="' + brand + '">\n' +
      '<meta property="og:title" content="' + T + '">\n<meta property="og:description" content="' + D + '">\n<meta property="og:url" content="' + url + '">\n' +
      '<meta property="og:image" content="' + imgUrl + '">\n' + imgDims +
      '<meta property="og:image:alt" content="' + brand + ' في ' + esc(c.city) + '">\n<meta name="twitter:card" content="summary_large_image">\n' +
      '<meta name="twitter:title" content="' + T + '">\n<meta name="twitter:description" content="' + D + '">\n<meta name="twitter:image" content="' + imgUrl + '">\n' +
      '<link rel="icon" type="image/svg+xml" href="' + rp + 'assets/favicon.svg">\n<link rel="apple-touch-icon" href="' + rp + 'assets/apple-touch-icon.png">\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" media="print" onload="this.media=\'all\'">\n' +
      '<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap"></noscript>\n' +
      '<link rel="stylesheet" href="' + rp + 'assets/style.css">\n<link rel="stylesheet" href="' + rp + 'assets/theme.css">\n' + ld + '\n</head>\n<body>\n' +
      '<a class="skip" href="#main">تخطي إلى المحتوى</a>\n<header class="site-header"><div class="container nav">\n' +
      '<a class="brand" href="' + rp + 'index.html" aria-label="' + esc(c.name) + ' - الصفحة الرئيسية">' + lg + '<span><b>' + esc(c.name) + '</b><small>' + esc(c.tagline) + '</small></span></a>\n' +
      '<button class="burger" aria-label="القائمة" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>\n<ul class="menu" id="menu">' + nav + '</ul>\n</div></header>\n' +
      '<main id="main">\n' + o.body + '\n</main>\n<footer class="site-footer"><div class="container">\n<div class="fgrid">\n' +
      '<div><a class="brand" href="' + rp + 'index.html">' + lg + '<span><b>' + esc(c.name) + '</b><small>' + esc(c.tagline) + '</small></span></a>\n<p>' + esc(S.footerText) + '</p></div>\n' +
      '<div><h3>الخدمات</h3><ul>\n' + svcLinks + '\n</ul></div>\n' +
      '<div><h3>تواصل معنا</h3><ul>\n<li><a href="tel:' + c.phone + '"><span class="ltr">' + esc(c.disp) + '</span></a></li>\n<li><a href="' + c.wa + '" rel="noopener">واتساب</a></li>\n' +
      '<li>' + esc(c.city) + '، ' + esc(S.country) + '</li>\n<li><a href="' + rp + 'blog/index.html">المدونة</a></li>\n' + pageLinks + '</ul></div>\n</div>\n' +
      '<div class="copy">© <span id="year">2026</span> ' + esc(c.name) + ' ' + esc(c.tagline) + '. جميع الحقوق محفوظة.</div>\n</div></footer>\n' +
      '<a class="fab" href="tel:' + c.phone + '" aria-label="اتصل بنا">' + PHONE_ICON + '</a>\n<a class="fab fab-wa" href="' + c.wa + '" rel="noopener" aria-label="واتساب">' + WA_ICON + '</a>\n' +
      '<script src="' + rp + 'assets/main.js" defer></script>\n</body>\n</html>';
  }

  /* ---------- الصفحة الرئيسية ---------- */
  function homePage(c, content) {
    var h = content.home, S = c.S, posts = c.posts;
    var hero = '<section class="hero"><div class="container">\n<div><h1>' + esc(h.heroTitle) + '</h1>\n<p class="lead">' + esc(h.heroLead) + '</p>\n' +
      '<div class="actions"><a class="btn btn-primary" href="tel:' + c.phone + '">' + PHONE_ICON + 'اتصل الآن: <span class="ltr">' + esc(c.disp) + '</span></a>\n' +
      '<a class="btn btn-ghost" href="' + c.wa + '" rel="noopener">' + WA_ICON + 'واتساب</a></div></div>\n<div class="hero-card"><ul>\n' +
      (h.heroPoints || []).map(function (p) { return '<li><span class="tick"></span><span>' + esc(p) + '</span></li>\n'; }).join('') + '</ul></div></div></section>';
    var secs = [];
    function sub(t) { return t ? '<p>' + esc(t) + '</p>' : ''; }
    if (c.services.length) secs.push(function (k) {
      return '<section id="services"' + k + '><div class="container">\n<div class="section-head"><h2>' + esc(h.servicesTitle) + '</h2>' + sub(h.servicesSub) + '</div>\n<div class="grid g3">' +
        c.services.map(function (s) {
          return '<article class="card"><div class="icon">' + (ICONS[s.icon] || ICONS.roof) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.short) + '</p><a class="more" href="' + s.slug + '.html">تفاصيل الخدمة ←</a></article>';
        }).join('') + '</div></div></section>';
    });
    if ((h.intro || '').trim()) secs.push(function (k) { return '<section' + k + '><div class="container"><div class="content">' + fixAssets(h.intro, '') + '</div></div></section>'; });
    if ((h.why || []).length) secs.push(function (k) {
      return '<section' + k + '><div class="container">\n<div class="section-head"><h2>' + esc(h.whyTitle) + '</h2></div>\n<div class="grid g4">' +
        h.why.map(function (w) { return '<div class="card"><h3>' + esc(w.title) + '</h3><p>' + esc(w.text) + '</p></div>'; }).join('') + '</div></div></section>';
    });
    if ((h.steps || []).length) secs.push(function (k) {
      return '<section' + k + '><div class="container">\n<div class="section-head"><h2>' + esc(h.stepsTitle) + '</h2>' + sub(h.stepsSub) + '</div>\n<div class="grid g4">' +
        h.steps.map(function (s, i) { return '<div class="step"><div class="num">' + (i + 1) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>'; }).join('') + '</div></div></section>';
    });
    if ((h.gallery || []).length) secs.push(function (k) {
      return '<section' + k + '><div class="container">\n<div class="section-head"><h2>' + esc(h.galleryTitle) + '</h2>' + sub(h.gallerySub) + '</div>\n<div class="grid g3 gallery">' +
        h.gallery.map(function (g) {
          var dims = (g.width && g.height) ? ' width="' + g.width + '" height="' + g.height + '"' : '';
          return '<figure><img src="' + esc(g.image) + '" alt="' + esc(g.caption || h.galleryTitle) + '"' + dims + ' loading="lazy" decoding="async">' + (g.caption ? '<figcaption>' + esc(g.caption) + '</figcaption>' : '') + '</figure>';
        }).join('') + '</div></div></section>';
    });
    var ar = areasHtml(c);
    if (ar) secs.push(function (k) { return '<section' + k + '><div class="container"><div class="content">' + ar + '</div></div></section>'; });
    if (posts.length) secs.push(function (k) {
      return '<section' + k + '><div class="container">\n<div class="section-head"><h2>' + esc(h.blogTitle) + '</h2>' + sub(h.blogSub) + '</div>\n<div class="grid g3">' + cards(c, posts.slice(0, 3), '') + '</div></div></section>';
    });
    if ((h.faq || []).length) secs.push(function (k) {
      return '<section' + k + '><div class="container">\n<div class="section-head"><h2>' + esc(h.faqTitle) + '</h2></div>' + faqHtml(h.faq) + '</div></section>';
    });
    var parts = [hero].concat(secs.map(function (f, i) { return f(i % 2 ? ' class="alt"' : ''); }), [cta(c)]);
    return '\n' + parts.join('\n');
  }

  function servicePage(c, s) {
    var related = c.services.filter(function (x) { return x !== s; }).map(function (x) { return '<li><a href="' + x.slug + '.html">' + esc(x.title) + '</a></li>'; }).join('');
    var ar = areasHtml(c), hasFaq = (s.faq || []).length > 0;
    var inner = s.body + '\n' + (ar ? ar + '\n' : '') + '<h2>خدمات أخرى</h2><ul>' + related + '<li><a href="blog/index.html">مقالات المدونة</a></li></ul>';
    if (s.toc) inner = withToc(inner, 'محتويات الصفحة', hasFaq ? [['faq', 'أسئلة حول ' + s.title]] : []);
    var body = '\n<section class="hero page-hero"><div class="container"><div>\n<div class="crumbs"><a href="index.html">الرئيسية</a> / ' + esc(s.title) + '</div>\n' +
      '<h1>' + esc(s.h1) + '</h1><p class="lead">' + esc(s.lead) + '</p>\n<div class="actions"><a class="btn btn-primary" href="tel:' + c.phone + '">' + PHONE_ICON + 'اطلب معاينة: <span class="ltr">' + esc(c.disp) + '</span></a></div>\n</div></div></section>\n' +
      '<section><div class="container"><div class="content">' + inner + '\n</div></div></section>\n' +
      ((s.faq || []).length ? '<section class="alt" id="faq"><div class="container"><div class="section-head"><h2>أسئلة حول ' + esc(s.title) + '</h2></div>' + faqHtml(s.faq) + '</div></section>\n' : '') + cta(c);
    var path = s.slug + '.html';
    var sch = [{ '@context': 'https://schema.org', '@type': 'Service', name: s.title + ' في ' + c.city, serviceType: s.title, description: s.metaDesc, url: c.domain + '/' + path, provider: { '@id': c.domain + '/#business' }, areaServed: { '@type': 'City', name: c.city } }];
    if ((s.faq || []).length) sch.push(faqSchema(s.faq));
    sch.push(breadcrumb(c, [['الرئيسية', '/'], [s.title, '/' + path]]));
    return page(c, { path: path, title: s.seoTitle, desc: s.metaDesc, body: body, schema: sch });
  }

  function customPage(c, p) {
    var body = '\n<section class="hero page-hero"><div class="container"><div>\n<div class="crumbs"><a href="index.html">الرئيسية</a> / ' + esc(p.title) + '</div>\n<h1>' + esc(p.h1 || p.title) + '</h1>' +
      (p.lead ? '<p class="lead">' + esc(p.lead) + '</p>' : '') + '\n</div></div></section>\n<section><div class="container"><div class="content">' + (p.toc ? withToc(p.body, 'محتويات الصفحة') : p.body) + '\n</div></div></section>\n' + cta(c);
    var path = p.slug + '.html';
    return page(c, { path: path, title: p.seoTitle || p.title, desc: p.metaDesc || '', body: body, schema: [breadcrumb(c, [['الرئيسية', '/'], [p.title, '/' + path]])] });
  }

  function blogIndex(c, content) {
    var b = content.blog;
    var body = '\n<section class="hero page-hero"><div class="container"><div>\n<div class="crumbs"><a href="../index.html">الرئيسية</a> / المدونة</div>\n<h1>' + esc(b.h1) + '</h1><p class="lead">' + esc(b.lead) + '</p></div></div></section>\n' +
      '<section><div class="container"><div class="grid g3">' + cards(c, c.posts, '../') + '</div></div></section>\n' + cta(c);
    return page(c, { path: 'blog/index.html', root: '../', title: b.seoTitle, desc: b.metaDesc, body: body, schema: [breadcrumb(c, [['الرئيسية', '/'], ['المدونة', '/blog/index.html']])] });
  }

  function postPage(c, p, others) {
    var path = 'blog/' + p.slug + '.html', url = c.domain + '/' + path;
    var svcLinks = c.services.map(function (s) { return '<a href="../' + s.slug + '.html">' + esc(s.title) + ' في ' + esc(c.city) + '</a>'; }).join(' · ');
    var cover = '';
    if (p.image) {
      var dims = (p.imageWidth && p.imageHeight) ? ' width="' + p.imageWidth + '" height="' + p.imageHeight + '"' : '';
      cover = '<figure class="cover"><img src="../' + esc(p.image) + '" alt="' + esc(p.title) + '"' + dims + ' fetchpriority="high" decoding="async"></figure>\n';
    }
    var body = '\n<section class="hero page-hero"><div class="container"><div>\n<div class="crumbs"><a href="../index.html">الرئيسية</a> / <a href="index.html">المدونة</a></div>\n' +
      '<h1>' + esc(p.title) + '</h1><p class="meta" style="color:#bcd6e5">' + p.date_ar + ' · قراءة ' + p.read + '</p></div></div></section>\n' +
      '<section><div class="container"><article class="content">' + cover + fixAssets(p.toc ? withToc(p.body) : p.body, '../') + '\n' +
      '<div class="callout"><strong>خدماتنا في ' + esc(c.city) + ':</strong> ' + svcLinks + '</div>\n' +
      '<p><a class="btn btn-dark" href="tel:' + c.phone + '">' + PHONE_ICON + 'اتصل بنا: <span class="ltr">' + esc(c.disp) + '</span></a></p>\n</article></div></section>\n' +
      '<section class="alt"><div class="container"><div class="section-head"><h2>مقالات ذات صلة</h2></div>\n' +
      '<div class="grid g3" style="max-width:780px;margin:auto;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' + cards(c, others, '../') + '</div></div></section>\n' + cta(c);
    var art = {
      '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.desc,
      datePublished: p.date, dateModified: p.modified || p.date, inLanguage: 'ar', mainEntityOfPage: url,
      author: { '@type': 'Organization', name: c.name },
      publisher: { '@type': 'Organization', name: c.name, logo: { '@type': 'ImageObject', url: c.domain + '/assets/logo.svg' } }
    };
    var kws = [p.focusKw].concat(p.keywords || []).filter(Boolean);
    if (kws.length) art.keywords = kws.join(', ');
    if (p.image) art.image = c.domain + '/' + p.image;
    return page(c, { path: path, root: '../', og: 'article', image: p.image || '', title: p.title + ' - ' + c.name, desc: p.desc, body: body,
      schema: [art, breadcrumb(c, [['الرئيسية', '/'], ['المدونة', '/blog/index.html'], [p.title, '/' + path]])] });
  }

  function themeCss(c) {
    var k = c.colors;
    if (k.primary === DEF.primary && k.accent === DEF.accent && k.button === DEF.button) return '/* الألوان الافتراضية (تُعدَّل من لوحة الإدارة ← إعدادات الموقع) */\n';
    return ':root{--navy:' + k.primary + ';--navy-2:' + mix(k.primary, '#000000', 0.25) + ';--navy-3:' + mix(k.primary, k.accent, 0.33) + ';--cyan:' + k.accent + ';--cyan-d:' + mix(k.accent, '#000000', 0.23) + ';--amber:' + k.button + '}\n';
  }

  function render(content, posts) {
    posts = posts || [];
    var c = makeCtx(content, posts), files = [];
    function add(path, text) { files.push({ path: path, content: text }); }
    add('index.html', page(c, { path: 'index.html', title: content.home.seoTitle, desc: content.home.metaDesc, body: homePage(c, content),
      schema: [faqSchema(content.home.faq || []), { '@context': 'https://schema.org', '@type': 'WebSite', name: c.name + ' ' + c.tagline, url: c.domain + '/', inLanguage: 'ar' }].filter(function (x, i) { return i || (content.home.faq || []).length; }) }));
    c.services.forEach(function (s) { add(s.slug + '.html', servicePage(c, s)); });
    c.pages.forEach(function (p) { add(p.slug + '.html', customPage(c, p)); });
    add('blog/index.html', blogIndex(c, content));
    posts.forEach(function (p) { add('blog/' + p.slug + '.html', postPage(c, p, posts.filter(function (x) { return x !== p; }).slice(0, 2))); });
    add('404.html', page(c, { path: '404.html', title: 'الصفحة غير موجودة - ' + c.name, desc: 'الصفحة المطلوبة غير موجودة.', noindex: true,
      body: '<section><div class="container content" style="text-align:center"><h1>الصفحة غير موجودة</h1><p>ربما تم نقل الصفحة أو أن الرابط غير صحيح.</p><p><a class="btn btn-dark" href="' + c.domain + '/index.html">العودة للرئيسية</a></p></div></section>' }));

    var upd = content.updated || '', pd = posts.map(function (p) { return p.modified || p.date; });
    var urls = [['', '1.0', maxDate(pd.slice(0, 3), upd)]];
    c.services.forEach(function (s) { urls.push([s.slug + '.html', '0.9', upd]); });
    c.pages.forEach(function (p) { urls.push([p.slug + '.html', '0.6', upd]); });
    urls.push(['blog/index.html', '0.8', maxDate(pd, upd)]);
    posts.forEach(function (p) { urls.push(['blog/' + p.slug + '.html', '0.7', p.modified || p.date]); });
    add('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(function (u) { return '<url><loc>' + c.domain + '/' + u[0] + '</loc><lastmod>' + u[2] + '</lastmod><priority>' + u[1] + '</priority></url>\n'; }).join('') + '</urlset>\n');
    add('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: ' + c.domain + '/sitemap.xml\n');
    add('assets/favicon.svg', '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' + logoInner(c) + '</svg>');
    add('assets/logo.svg', '<svg viewBox="0 0 260 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="شعار ' + esc(c.name) + '"><g transform="translate(190 4)"><g>' + logoInner(c) + '</g></g>' +
      '<text x="182" y="40" text-anchor="end" font-family="Cairo,Tahoma,Arial,sans-serif" font-size="32" font-weight="800" fill="' + c.colors.primary + '">' + esc(c.name) + '</text>' +
      '<text x="182" y="60" text-anchor="end" font-family="Cairo,Tahoma,Arial,sans-serif" font-size="13" fill="#5b7080">' + esc(c.tagline) + '</text></svg>');
    add('assets/theme.css', themeCss(c));
    return files;
  }

  function waUrl(S) {
    var cc = S.countryCode || '966';
    return 'https://wa.me/' + cc + (String(S.phone).charAt(0) === '0' ? String(S.phone).slice(1) : S.phone) + '?text=' + encodeURIComponent(S.waMessage || '');
  }

  var API = { render: render, esc: esc, ICONS: ICONS, DEF: DEF, waUrl: waUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.SiteCore = API;
})(typeof window !== 'undefined' ? window : globalThis);
