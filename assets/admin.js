/* لوحة إدارة المقالات: تعمل بالكامل من المتصفح وتحفظ مباشرة في مستودع GitHub (بدون خادم). */
(function (root) {
  'use strict';

  /* ================= الجزء الأول: دوال نقية (تُختبر خارج المتصفح) ================= */
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function dateAr(iso) { var p = iso.split('-'); return (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function readLabel(m) {
    if (m <= 1) return 'دقيقة واحدة';
    if (m === 2) return 'دقيقتان';
    if (m <= 10) return m + ' دقائق';
    return m + ' دقيقة';
  }
  function ld(o) { return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>'; }

  function cards(posts, rootPath) {
    return posts.map(function (p) {
      return '<article class="card post-card"><div class="meta">' + p.date_ar + ' · قراءة ' + p.read + '</div>\n' +
        '<h3><a href="' + rootPath + 'blog/' + p.slug + '.html">' + esc(p.title) + '</a></h3><p>' + esc(p.desc) + '</p>\n' +
        '<a class="more" href="' + rootPath + 'blog/' + p.slug + '.html">اقرأ المزيد ←</a></article>';
    }).join('');
  }

  function spliceMarkers(html, inner) {
    var re = /(<!--POSTS:START-->)[\s\S]*?(<!--POSTS:END-->)/;
    if (!re.test(html)) throw new Error('لم أجد مكان قائمة المقالات في الصفحة. حدّث ملفات الموقع من النسخة الأحدث.');
    return html.replace(re, function (m, a, b) { return a + inner + b; });
  }

  function renderPost(tpl, site, p, related) {
    var path = 'blog/' + p.slug + '.html', url = site.domain + '/' + path;
    var art = {
      '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.desc,
      datePublished: p.date, dateModified: p.modified || p.date, inLanguage: 'ar', mainEntityOfPage: url,
      author: { '@type': 'Organization', name: site.name },
      publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: site.domain + '/assets/logo.svg' } }
    };
    var bc = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: site.domain + '/' },
        { '@type': 'ListItem', position: 2, name: 'المدونة', item: site.domain + '/blog/index.html' },
        { '@type': 'ListItem', position: 3, name: p.title, item: url }
      ]
    };
    var map = {
      SLUG: p.slug, TITLE: esc(p.title), DESC: esc(p.desc), DATE_AR: p.date_ar, READ: p.read,
      BODY: p.body, RELATED: cards(related, '../'), POST_SCHEMA: ld(art) + ld(bc)
    };
    return tpl.replace(/\{\{(SLUG|TITLE|DESC|DATE_AR|READ|BODY|RELATED|POST_SCHEMA)\}\}/g, function (m, k) { return map[k]; });
  }

  function updateSitemap(xml, site, posts, today) {
    var re = /<url>([\s\S]*?)<\/url>/g, m, keep = [];
    while ((m = re.exec(xml))) {
      var loc = (/<loc>(.*?)<\/loc>/.exec(m[1]) || [])[1];
      if (!loc) continue;
      var lm = (/<lastmod>(.*?)<\/lastmod>/.exec(m[1]) || [])[1] || today;
      var pr = (/<priority>(.*?)<\/priority>/.exec(m[1]) || [])[1] || '0.5';
      var isBlogIndex = /\/blog\/index\.html$/.test(loc);
      var isPost = /\/blog\//.test(loc) && !isBlogIndex;
      if (isPost) continue;
      keep.push({ loc: loc, lm: (isBlogIndex || loc === site.domain + '/') ? today : lm, pr: pr });
    }
    posts.forEach(function (p) {
      keep.push({ loc: site.domain + '/blog/' + p.slug + '.html', lm: p.modified || p.date, pr: '0.7' });
    });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      keep.map(function (k) { return '<url><loc>' + k.loc + '</loc><lastmod>' + k.lm + '</lastmod><priority>' + k.pr + '</priority></url>\n'; }).join('') +
      '</urlset>\n';
  }

  /* يبني كل الملفات التي يجب حفظها (المقالات + القوائم + sitemap). content:null يعني حذف الملف. */
  function buildFiles(o) {
    var posts = o.posts, files = [];
    files.push({ path: 'data/posts.json', content: JSON.stringify(posts, null, 2) + '\n' });
    posts.forEach(function (p) {
      var rel = posts.filter(function (x) { return x !== p; }).slice(0, 2);
      files.push({ path: 'blog/' + p.slug + '.html', content: renderPost(o.tpl, o.site, p, rel) });
    });
    (o.deleted || []).forEach(function (s) { files.push({ path: 'blog/' + s + '.html', content: null }); });
    files.push({ path: 'blog/index.html', content: spliceMarkers(o.blogIdx, cards(posts, '../')) });
    files.push({ path: 'index.html', content: spliceMarkers(o.home, cards(posts.slice(0, 3), '')) });
    files.push({ path: 'sitemap.xml', content: updateSitemap(o.sitemap, o.site, posts, o.today) });
    return files;
  }

  var Core = { esc: esc, dateAr: dateAr, readLabel: readLabel, cards: cards, spliceMarkers: spliceMarkers, renderPost: renderPost, updateSitemap: updateSitemap, buildFiles: buildFiles };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Core; }
  if (typeof document === 'undefined') return;

  /* ================= الجزء الثاني: الواجهة ================= */
  var $ = function (id) { return document.getElementById(id); };
  var S = { repo: '', branch: '', token: '', posts: [], site: null, tpl: '', editing: null, htmlMode: false };
  var siteRoot = new URL('.', location.href).href;

  function today() { return new Date().toLocaleDateString('en-CA'); }
  function show(v) {
    ['v-login', 'v-list', 'v-edit', 'v-pages'].forEach(function (x) { $(x).hidden = (x !== v); });
    $('logout').hidden = (v === 'v-login');
    window.scrollTo(0, 0);
  }
  function msg(el, text, kind) { el.textContent = text || ''; el.className = 'msg ' + (kind || ''); el.hidden = !text; }

  /* ---------- GitHub API ---------- */
  function hdrs(accept) {
    return { 'Authorization': 'Bearer ' + S.token, 'Accept': accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  }
  function apiError(status) {
    var m = {
      401: 'رمز الوصول غير صحيح أو منتهي الصلاحية.',
      403: 'لا توجد صلاحية. تأكد أن الرمز يملك الصلاحية Contents: Read and write (أو انتظر قليلاً إن تجاوزت حد الطلبات).',
      404: 'لم يتم العثور على المستودع أو الملف. تأكد من اسم المستودع ومن صلاحيات الرمز.',
      409: 'حدث تعارض أثناء الحفظ. أعد المحاولة.',
      422: 'حدث تعارض أثناء الحفظ. أعد المحاولة.'
    };
    var e = new Error(m[status] || ('خطأ من GitHub (' + status + ').'));
    e.status = status; return e;
  }
  async function gh(path, opts) {
    opts = opts || {};
    var h = hdrs(); if (opts.body) h['Content-Type'] = 'application/json';
    var r;
    try { r = await fetch('https://api.github.com' + path, { method: opts.method || 'GET', headers: h, body: opts.body, cache: 'no-store' }); }
    catch (e) { throw new Error('تعذر الاتصال بالإنترنت.'); }
    if (!r.ok) throw apiError(r.status);
    return r.json();
  }
  async function readFile(path) {
    var r;
    try {
      r = await fetch('https://api.github.com/repos/' + S.repo + '/contents/' + path + '?ref=' + encodeURIComponent(S.branch) + '&_=' + Date.now(),
        { headers: hdrs('application/vnd.github.raw+json'), cache: 'no-store' });
    } catch (e) { throw new Error('تعذر الاتصال بالإنترنت.'); }
    if (r.status === 404) return null;
    if (!r.ok) throw apiError(r.status);
    return r.text();
  }
  async function commit(files, message) {
    var base = '/repos/' + S.repo;
    var ref = await gh(base + '/git/ref/heads/' + S.branch);
    var head = ref.object.sha;
    var c = await gh(base + '/git/commits/' + head);
    var tree = files.map(function (f) {
      return f.content === null ? { path: f.path, mode: '100644', type: 'blob', sha: null } : { path: f.path, mode: '100644', type: 'blob', content: f.content };
    });
    var t = await gh(base + '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: c.tree.sha, tree: tree }) });
    var nc = await gh(base + '/git/commits', { method: 'POST', body: JSON.stringify({ message: message, tree: t.sha, parents: [head] }) });
    await gh(base + '/git/refs/heads/' + S.branch, { method: 'PATCH', body: JSON.stringify({ sha: nc.sha }) });
  }
  async function loadAll() {
    var names = ['data/posts.json', 'data/site.json', 'assets/post-template.html', 'blog/index.html', 'index.html', 'sitemap.xml'];
    var r = await Promise.all(names.map(readFile));
    if (r.some(function (x) { return x === null; })) {
      throw new Error('ملفات الموقع غير مكتملة في المستودع (data/posts.json أو assets/post-template.html ...). ارفع النسخة الأحدث من الموقع ثم أعد المحاولة.');
    }
    return { posts: JSON.parse(r[0]), site: JSON.parse(r[1]), tpl: r[2], blogIdx: r[3], home: r[4], sitemap: r[5] };
  }
  /* تحميل أحدث نسخة، تطبيق التعديل، ثم حفظ كل شيء في commit واحد */
  async function apply(mutate, message) {
    var d = await loadAll();
    var deleted = mutate(d.posts) || [];
    var existing = [];
    for (var i = 0; i < deleted.length; i++) { if (await readFile('blog/' + deleted[i] + '.html') !== null) existing.push(deleted[i]); }
    var files = buildFiles({ posts: d.posts, site: d.site, tpl: d.tpl, blogIdx: d.blogIdx, home: d.home, sitemap: d.sitemap, today: today(), deleted: existing });
    await commit(files, message);
    S.posts = d.posts; S.site = d.site; S.tpl = d.tpl;
  }

  /* ---------- تنظيف HTML الناتج من المحرر ---------- */
  var BLOCK = { H2: 1, H3: 1, P: 1, UL: 1, OL: 1, BLOCKQUOTE: 1, DIV: 1, FIGURE: 1, TABLE: 1, HR: 1 };
  var ALLOWED = { H2: 1, H3: 1, P: 1, UL: 1, OL: 1, LI: 1, STRONG: 1, EM: 1, A: 1, BR: 1, BLOCKQUOTE: 1, DIV: 1, IMG: 1, FIGURE: 1, FIGCAPTION: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1, HR: 1 };
  function clean(html) {
    var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    var out = document.createElement('div');
    function walk(node, parent) {
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) { parent.appendChild(document.createTextNode(n.nodeValue)); return; }
        if (n.nodeType !== 1) return;
        var tag = n.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT') return;
        if (tag === 'B') tag = 'STRONG'; else if (tag === 'I') tag = 'EM';
        else if (tag === 'H1') tag = 'H2'; else if (/^H[4-6]$/.test(tag)) tag = 'H3';
        else if (tag === 'DIV') tag = n.classList.contains('callout') ? 'DIV' : 'P';
        if (!ALLOWED[tag]) { walk(n, parent); return; }
        var el = document.createElement(tag.toLowerCase());
        if (tag === 'DIV') el.className = 'callout';
        if (tag === 'A') {
          var h = (n.getAttribute('href') || '').trim();
          if (/^(https?:|tel:|mailto:|\/|\.\.?\/|#)/i.test(h)) { el.setAttribute('href', h); if (/^https?:/i.test(h)) el.setAttribute('rel', 'noopener'); }
        }
        if (tag === 'IMG') {
          var src = (n.getAttribute('src') || '').trim();
          if (!/^(https?:\/\/|\/|\.\.?\/)/i.test(src)) return;
          el.setAttribute('src', src);
          el.setAttribute('alt', (n.getAttribute('alt') || '').slice(0, 250));
          el.setAttribute('loading', 'lazy');
          var width = parseInt(n.getAttribute('width') || '', 10); if (width > 0 && width <= 1600) el.setAttribute('width', String(width));
          var style = n.getAttribute('style') || ''; if (/^(max-width:\s*100%;\s*height:\s*auto;?|width:\s*\d{1,4}px;\s*height:\s*auto;?)$/i.test(style)) el.setAttribute('style', style);
        }
        if (tag === 'FIGURE') { var fs = n.getAttribute('style') || ''; if (/^text-align:\s*(center|right|left);?$/i.test(fs)) el.setAttribute('style', fs); }
        walk(n, el); parent.appendChild(el);
      });
    }
    walk(doc.body, out);
    // لفّ النصوص السائبة في فقرات
    var res = document.createElement('div'), cur = null;
    Array.prototype.slice.call(out.childNodes).forEach(function (n) {
      var isBlock = n.nodeType === 1 && BLOCK[n.tagName];
      if (isBlock) { cur = null; res.appendChild(n); return; }
      if (n.nodeType === 3 && !n.nodeValue.trim() && !cur) return;
      if (!cur) { cur = document.createElement('p'); res.appendChild(cur); }
      cur.appendChild(n);
    });
    var parts = [];
    Array.prototype.forEach.call(res.children, function (el) {
      if (!el.textContent.trim()) return;
      parts.push(el.outerHTML);
    });
    return parts.join('\n');
  }

  /* ---------- المحرر ---------- */
  var ed = $('editor'), htmlbox = $('htmlbox');
  function getBody() { return clean(S.htmlMode ? htmlbox.value : ed.innerHTML); }
  function setBody(html) { var c = clean(html || ''); ed.innerHTML = c; htmlbox.value = c; }
  function cmd(c) {
    var x = document.execCommand.bind(document);
    switch (c) {
      case 'h2': case 'h3': case 'p': x('formatBlock', false, '<' + c + '>'); break;
      case 'bold': x('bold'); break;
      case 'ul': x('insertUnorderedList'); break;
      case 'ol': x('insertOrderedList'); break;
      case 'undo': x('undo'); break;
      case 'redo': x('redo'); break;
      case 'link':
        var u = prompt('اكتب الرابط (https:// أو tel: أو mailto:)'); if (u && /^(https?:\/\/|tel:|mailto:|\/|#)/i.test(u)) x('createLink', false, u); else if (u) alert('الرابط غير صالح.'); break;
      case 'image':
        var src = prompt('رابط الصورة (https:// أو مسار داخل الموقع)');
        if (src && /^(https?:\/\/|\/|\.\.?\/)/i.test(src)) { var alt = prompt('وصف الصورة (مهم لتحسين SEO)') || ''; document.execCommand('insertHTML', false, '<figure style="text-align:center"><img src="' + src.replace(/&/g,'&amp;').replace(/"/g,'&quot;') + '" alt="' + alt.replace(/&/g,'&amp;').replace(/"/g,'&quot;') + '" loading="lazy" style="max-width:100%;height:auto"><figcaption>' + alt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</figcaption></figure><p></p>'); } else if (src) alert('الرابط غير صالح.'); break;
      case 'quote': x('formatBlock', false, '<blockquote>'); break;
      case 'hr': document.execCommand('insertHTML', false, '<hr><p></p>'); break;
      case 'table': document.execCommand('insertHTML', false, '<table><tbody><tr><th>عنوان 1</th><th>عنوان 2</th></tr><tr><td>محتوى</td><td>محتوى</td></tr></tbody></table><p></p>'); break;
      case 'callout':
        x('formatBlock', false, '<div>');
        var sel = getSelection(), n = sel.anchorNode; if (!n) break;
        var el = n.nodeType === 3 ? n.parentNode : n, d = el.closest('div');
        if (d && d !== ed && ed.contains(d)) d.classList.toggle('callout');
        break;
    }
  }
  $('toolbar').addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  $('toolbar').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cmd]'); if (!b) return;
    if (S.htmlMode) return;
    ed.focus(); cmd(b.dataset.cmd);
  });
  ed.addEventListener('focus', function () { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { } });
  ed.addEventListener('paste', function (e) {
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, t);
  });
  $('btn-html').addEventListener('click', function () {
    if (S.htmlMode) { ed.innerHTML = clean(htmlbox.value); } else { htmlbox.value = clean(ed.innerHTML); }
    S.htmlMode = !S.htmlMode;
    ed.hidden = S.htmlMode; htmlbox.hidden = !S.htmlMode;
    $('btn-html').textContent = S.htmlMode ? 'العودة للمحرر' : 'عرض كود HTML';
    $('toolbar').classList.toggle('off', S.htmlMode);
  });
  $('f-desc').addEventListener('input', function () {
    var n = this.value.length;
    $('f-count').textContent = n + ' حرف (المناسب 120–160)';
    $('f-count').className = (n >= 100 && n <= 170) ? 'ok' : '';
  });

  /* ---------- رفع الصور إلى المستودع ---------- */
  $('image-upload').addEventListener('change', async function () {
    var file = this.files && this.files[0]; if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { alert('اختر صورة PNG أو JPG أو WEBP أو GIF.'); this.value=''; return; }
    if (file.size > 5 * 1024 * 1024) { alert('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.'); this.value=''; return; }
    var alt = prompt('اكتب وصفاً واضحاً للصورة لتحسين SEO:', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    if (alt === null) { this.value=''; return; }
    var input = this;
    try {
      msg($('e-msg'), 'جارٍ رفع الصورة إلى الموقع...'); input.disabled = true;
      var dataUrl = await new Promise(function (resolve, reject) { var r = new FileReader(); r.onload = function(){resolve(r.result);}; r.onerror = reject; r.readAsDataURL(file); });
      var base64 = String(dataUrl).split(',')[1];
      var ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      var safe = (file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0,40) || 'article-image');
      var path = 'assets/uploads/' + safe + '-' + Date.now() + '.' + ext;
      var res = await fetch('https://api.github.com/repos/' + S.repo + '/contents/' + path, { method:'PUT', headers:Object.assign(hdrs(), {'Content-Type':'application/json'}), body:JSON.stringify({message:'إضافة صورة للموقع: '+file.name, content:base64, branch:S.branch}) });
      if (!res.ok) throw apiError(res.status);
      var imageUrl = new URL(path, siteRoot).href;
      ed.focus(); document.execCommand('insertHTML', false, '<figure style="text-align:center"><img src="'+imageUrl.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" alt="'+alt.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'" loading="lazy" style="max-width:100%;height:auto"><figcaption>'+alt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</figcaption></figure><p></p>');
      msg($('e-msg'), 'تم رفع الصورة وإدراجها. احفظ المقال لنشر التعديل.', 'ok');
    } catch (e) { msg($('e-msg'), e.message || 'تعذر رفع الصورة.', 'err'); }
    finally { input.disabled = false; input.value = ''; }
  });

  /* ---------- إدارة ملفات صفحات الموقع ---------- */
  var PAGE_FILES = [
    {path:'index.html', title:'الصفحة الرئيسية', desc:'العناوين والنصوص والأقسام الرئيسية'},
    {path:'leak-detection.html', title:'كشف تسربات المياه', desc:'محتوى صفحة خدمة كشف التسربات'},
    {path:'roof-insulation.html', title:'عزل الأسطح', desc:'محتوى صفحة خدمة عزل الأسطح'},
    {path:'tank-insulation.html', title:'عزل الخزانات', desc:'محتوى صفحة خدمة عزل الخزانات'},
    {path:'blog/index.html', title:'صفحة المدونة', desc:'عنوان ووصف صفحة المقالات'},
    {path:'404.html', title:'صفحة الخطأ 404', desc:'محتوى صفحة الرابط غير الموجود'},
    {path:'assets/style.css', title:'تصميم وألوان الموقع', desc:'تعديل الألوان والخطوط والمسافات والتنسيق العام'},
    {path:'data/site.json', title:'بيانات الموقع', desc:'اسم النشاط والدومين ورقم الهاتف والإعدادات العامة'},
    {path:'assets/logo.svg', title:'الشعار', desc:'تعديل كود الشعار بصيغة SVG'}
  ];
  var activePage = null;
  function renderPages() {
    var box = $('page-list'); box.textContent = '';
    PAGE_FILES.forEach(function (p) {
      var card = document.createElement('div'); card.className='page-card';
      var h = document.createElement('h3'); h.textContent=p.title;
      var d = document.createElement('p'); d.className='hint'; d.textContent=p.desc;
      var path = document.createElement('code'); path.textContent=p.path;
      var b = document.createElement('button'); b.type='button'; b.className='btn btn-light'; b.textContent='تعديل كود الصفحة'; b.style.marginTop='12px'; b.onclick=function(){openPage(p);};
      card.appendChild(h); card.appendChild(d); card.appendChild(path); card.appendChild(b); box.appendChild(card);
    });
  }
  async function openPage(p) {
    activePage=p; $('page-editor-wrap').hidden=false; $('page-file-label').textContent='تعديل الملف: '+p.path; $('page-source').value='جارٍ تحميل الملف...'; msg($('page-msg'),'');
    try { var content=await readFile(p.path); if(content===null) throw new Error('الملف غير موجود في مستودع GitHub.'); $('page-source').value=content; $('page-editor-wrap').scrollIntoView({behavior:'smooth',block:'start'}); }
    catch(e){msg($('page-msg'),e.message,'err'); $('page-source').value='';}
  }
  $('btn-pages').addEventListener('click',function(){renderPages();$('page-editor-wrap').hidden=true;show('v-pages');});
  $('pages-back').addEventListener('click',function(){show('v-list');});
  $('page-cancel').addEventListener('click',function(){$('page-editor-wrap').hidden=true;activePage=null;});
  $('page-save').addEventListener('click',function(){
    if(!activePage)return;
    if(!confirm('سيتم استبدال ملف '+activePage.path+' كاملاً ونشر التعديل. تأكد من الاحتفاظ بكود الصفحة وروابطها. هل تريد المتابعة؟'))return;
    busy($('page-save'),'جارٍ الحفظ والنشر...',async function(){
      var content=$('page-source').value;
      if(/\.html?$/i.test(activePage.path) && !/<!doctype html|<html[\s>]/i.test(content))throw new Error('يبدو أن محتوى الملف ليس صفحة HTML كاملة.');
      if(/\.json$/i.test(activePage.path)){try{JSON.parse(content);}catch(e){throw new Error('صيغة JSON غير صحيحة؛ راجع الفواصل وعلامات الاقتباس.');}}
      await commit([{path:activePage.path,content:content}],'تعديل صفحة الموقع: '+activePage.path);
      msg($('page-msg'),'تم حفظ الصفحة في GitHub. سيظهر التحديث بعد انتهاء النشر.','ok');
    },$('page-msg'));
  });

  /* ---------- الشاشات ---------- */
  function renderList() {
    var box = $('posts'); box.textContent = '';
    if (!S.posts.length) { box.textContent = 'لا توجد مقالات بعد.'; return; }
    S.posts.forEach(function (p) {
      var row = document.createElement('div'); row.className = 'prow';
      var info = document.createElement('div'); info.className = 'pinfo';
      var t = document.createElement('b'); t.textContent = p.title;
      var m = document.createElement('small'); m.textContent = p.date_ar + (p.modified ? ' · عُدّل ' + dateAr(p.modified) : '');
      info.appendChild(t); info.appendChild(m);
      var act = document.createElement('div'); act.className = 'pact';
      var a = document.createElement('a'); a.className = 'btn btn-light'; a.textContent = 'عرض'; a.target = '_blank'; a.rel = 'noopener'; a.href = siteRoot + 'blog/' + p.slug + '.html';
      var e = document.createElement('button'); e.className = 'btn btn-light'; e.textContent = 'تعديل'; e.onclick = function () { openEditor(p.slug); };
      var d = document.createElement('button'); d.className = 'btn btn-danger'; d.textContent = 'حذف'; d.onclick = function () { removePost(p); };
      act.appendChild(a); act.appendChild(e); act.appendChild(d);
      row.appendChild(info); row.appendChild(act); box.appendChild(row);
    });
  }
  function openEditor(slug) {
    var p = slug ? S.posts.filter(function (x) { return x.slug === slug; })[0] : null;
    S.editing = p ? p.slug : null;
    $('e-head').textContent = p ? 'تعديل المقال' : 'مقال جديد';
    $('f-title').value = p ? p.title : '';
    $('f-slug').value = p ? p.slug : '';
    $('f-slug').readOnly = !!p;
    $('f-desc').value = p ? p.desc : '';
    $('f-desc').dispatchEvent(new Event('input'));
    if (S.htmlMode) $('btn-html').click();
    setBody(p ? p.body : '<p></p>');
    msg($('e-msg'), '');
    show('v-edit');
  }
  function collect() {
    var title = $('f-title').value.trim(), slug = $('f-slug').value.trim().toLowerCase(), desc = $('f-desc').value.trim(), body = getBody();
    if (!title) throw new Error('اكتب عنوان المقال.');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug === 'index') throw new Error('رابط المقال يجب أن يكون بالإنجليزية (حروف صغيرة وأرقام وشرطات) مثل: roof-leak-causes');
    if (!desc) throw new Error('اكتب وصفاً قصيراً للمقال (يظهر في نتائج جوجل).');
    var text = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length < 80) throw new Error('نص المقال قصير جداً.');
    var base = S.editing ? S.posts.filter(function (x) { return x.slug === S.editing; })[0] : null;
    var date = base ? base.date : today();
    var p = {
      slug: slug, title: title, desc: desc, date: date, date_ar: dateAr(date),
      read: readLabel(Math.max(1, Math.round(text.split(' ').length / 180))), body: '\n' + body + '\n'
    };
    if (base) p.modified = today();
    return p;
  }
  async function busy(btn, label, fn, out) {
    var old = btn.textContent; btn.disabled = true; btn.textContent = label; msg(out, '');
    try { await fn(); } catch (e) { msg(out, e.message || String(e), 'err'); }
    btn.disabled = false; btn.textContent = old;
  }
  $('e-save').addEventListener('click', function () {
    busy($('e-save'), 'جارٍ النشر...', async function () {
      var p = collect(), editing = S.editing;
      await apply(function (posts) {
        var i = posts.findIndex(function (x) { return x.slug === p.slug; });
        if (editing) {
          if (i < 0) throw new Error('المقال غير موجود في المستودع.');
          posts[i] = Object.assign({}, posts[i], p);
        } else {
          if (i >= 0) throw new Error('يوجد مقال بنفس الرابط. غيّر رابط المقال.');
          posts.unshift(p);
        }
      }, (editing ? 'تعديل مقال: ' : 'إضافة مقال: ') + p.title);
      renderList(); show('v-list');
      msg($('l-banner'), 'تم الحفظ. سيظهر المقال على الموقع خلال دقيقة أو دقيقتين.', 'ok');
    }, $('e-msg'));
  });
  async function removePost(p) {
    if (!confirm('حذف المقال "' + p.title + '" نهائياً؟')) return;
    msg($('l-banner'), 'جارٍ الحذف...', '');
    try {
      await apply(function (posts) {
        var i = posts.findIndex(function (x) { return x.slug === p.slug; });
        if (i >= 0) posts.splice(i, 1);
        return [p.slug];
      }, 'حذف مقال: ' + p.title);
      renderList(); msg($('l-banner'), 'تم حذف المقال.', 'ok');
    } catch (e) { msg($('l-banner'), e.message, 'err'); }
  }
  $('e-preview').addEventListener('click', function () {
    try {
      var p = collect();
      var rel = S.posts.filter(function (x) { return x.slug !== p.slug; }).slice(0, 2);
      var html = renderPost(S.tpl, S.site, p, rel).replace('<head>', '<head><base href="' + siteRoot + 'blog/">');
      $('pv-frame').srcdoc = html; $('pv').hidden = false;
      msg($('e-msg'), '');
    } catch (e) { msg($('e-msg'), e.message, 'err'); }
  });
  $('pv-close').addEventListener('click', function () { $('pv').hidden = true; });
  $('btn-new').addEventListener('click', function () { openEditor(null); });
  $('e-back').addEventListener('click', function () { show('v-list'); });

  /* ---------- الدخول ---------- */
  function guessRepo() {
    var h = location.hostname;
    if (/\.github\.io$/.test(h)) {
      var owner = h.split('.')[0], seg = location.pathname.split('/')[1];
      return owner + '/' + ((seg && !/\.html?$/.test(seg)) ? seg : owner + '.github.io');
    }
    return '';
  }
  async function connect(repo, token) {
    S.repo = repo; S.token = token;
    var info = await gh('/repos/' + repo);
    if (info.permissions && info.permissions.push === false) throw new Error('هذا الرمز لا يملك صلاحية الكتابة على المستودع.');
    S.branch = info.default_branch;
    var d = await loadAll();
    S.posts = d.posts; S.site = d.site; S.tpl = d.tpl;
    renderList(); msg($('l-banner'), ''); show('v-list');
  }
  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var repo = $('l-repo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, ''), token = $('l-token').value.trim();
    busy($('l-go'), 'جارٍ الاتصال...', async function () {
      await connect(repo, token);
      try {
        if ($('l-save').checked) localStorage.setItem('tbk_admin', JSON.stringify({ repo: repo, token: token }));
        else localStorage.removeItem('tbk_admin');
      } catch (x) { }
    }, $('l-msg'));
  });
  $('logout').addEventListener('click', function () {
    try { localStorage.removeItem('tbk_admin'); } catch (x) { }
    S.token = ''; $('l-token').value = ''; show('v-login');
  });

  $('l-repo').value = guessRepo();
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('tbk_admin') || 'null'); } catch (x) { }
  if (saved && saved.repo && saved.token) {
    $('l-repo').value = saved.repo; $('l-token').value = saved.token;
    connect(saved.repo, saved.token).catch(function (e) { msg($('l-msg'), e.message, 'err'); });
  }
})(typeof window !== 'undefined' ? window : this);
