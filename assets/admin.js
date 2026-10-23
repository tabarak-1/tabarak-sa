/* لوحة إدارة موقع تبارك: تعدّل كل المحتوى وتنشره مباشرة في مستودع GitHub (بدون خادم). */
(function () {
  'use strict';
  var Core = window.SiteCore;
  var $ = function (id) { return document.getElementById(id); };
  var S = { repo: '', branch: '', token: '', content: null, posts: [], pending: {}, tab: 'home' };
  var siteRoot = new URL('.', location.href).href;
  var RESERVED = ['index', 'blog', 'admin', '404', 'assets', 'data', 'tools', 'sitemap', 'robots'];

  /* ================= أدوات عامة ================= */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function today() { return new Date().toLocaleDateString('en-CA'); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split('.'), last = ks.pop(); var t = ks.reduce(function (a, k) { return (a[k] = a[k] || {}); }, o); t[last] = v; }
  function esc(s) { return Core.esc(s); }
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function dateAr(iso) { var p = iso.split('-'); return (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function readLabel(m) { if (m <= 1) return 'دقيقة واحدة'; if (m === 2) return 'دقيقتان'; if (m <= 10) return m + ' دقائق'; return m + ' دقيقة'; }
  function msg(node, text, kind) { node.textContent = text || ''; node.className = 'msg ' + (kind || ''); node.hidden = !text; }
  function norm(t) { return String(t || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/(^|\s)ال(?=\S{2})/g, '$1').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function count(hay, needle) { if (!needle) return 0; var n = 0, i = 0; while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; }
  function textOf(html) { return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
  async function busy(btn, label, fn, out) {
    var old = btn.textContent; btn.disabled = true; btn.textContent = label; if (out) msg(out, '');
    try { await fn(); } catch (e) { if (out) msg(out, e.message || String(e), 'err'); else alert(e.message || e); }
    btn.disabled = false; btn.textContent = old;
  }

  /* ================= GitHub API ================= */
  function hdrs(accept) { return { 'Authorization': 'Bearer ' + S.token, 'Accept': accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }; }
  function apiError(status) {
    var m = {
      401: 'رمز الوصول غير صحيح أو منتهي الصلاحية.',
      403: 'لا توجد صلاحية. تأكد أن الرمز يملك الصلاحية Contents: Read and write (أو انتظر قليلاً إن تجاوزت حد الطلبات).',
      404: 'لم يتم العثور على المستودع أو الملف. تأكد من اسم المستودع ومن صلاحيات الرمز.',
      409: 'حدث تعارض أثناء الحفظ. أعد المحاولة.', 422: 'حدث تعارض أثناء الحفظ. أعد المحاولة.'
    };
    var e = new Error(m[status] || ('خطأ من GitHub (' + status + ').')); e.status = status; return e;
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
    try { r = await fetch('https://api.github.com/repos/' + S.repo + '/contents/' + path + '?ref=' + encodeURIComponent(S.branch) + '&_=' + Date.now(), { headers: hdrs('application/vnd.github.raw+json'), cache: 'no-store' }); }
    catch (e) { throw new Error('تعذر الاتصال بالإنترنت.'); }
    if (r.status === 404) return null;
    if (!r.ok) throw apiError(r.status);
    return r.text();
  }
  async function commit(files, message) {
    var base = '/repos/' + S.repo;
    var ref = await gh(base + '/git/ref/heads/' + S.branch), head = ref.object.sha;
    var c = await gh(base + '/git/commits/' + head);
    var tree = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (f.content === null) tree.push({ path: f.path, mode: '100644', type: 'blob', sha: null });
      else if (f.base64 != null) {
        var b = await gh(base + '/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.base64, encoding: 'base64' }) });
        tree.push({ path: f.path, mode: '100644', type: 'blob', sha: b.sha });
      } else tree.push({ path: f.path, mode: '100644', type: 'blob', content: f.content });
    }
    var t = await gh(base + '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: c.tree.sha, tree: tree }) });
    var nc = await gh(base + '/git/commits', { method: 'POST', body: JSON.stringify({ message: message, tree: t.sha, parents: [head] }) });
    await gh(base + '/git/refs/heads/' + S.branch, { method: 'PATCH', body: JSON.stringify({ sha: nc.sha }) });
  }
  async function loadAll() {
    var r = await Promise.all([readFile('data/content.json'), readFile('data/posts.json')]);
    if (r[0] === null || r[1] === null) throw new Error('ملفات الموقع غير مكتملة في المستودع (data/content.json). ارفع أحدث نسخة من الموقع ثم أعد المحاولة.');
    return { content: JSON.parse(r[0]), posts: JSON.parse(r[1]) };
  }
  /* تحميل أحدث نسخة، تطبيق التعديل، توليد كل الصفحات، ثم حفظ كل شيء في commit واحد */
  async function apply(mutate, message, opts) {
    opts = opts || {};
    var d = await loadAll();
    var oldPaths = Core.render(d.content, d.posts).map(function (f) { return f.path; });
    mutate(d.content, d.posts);
    if (!opts.postsOnly) d.content.updated = today();
    var out = Core.render(d.content, d.posts);
    var files = out.slice();
    files.push({ path: 'data/content.json', content: JSON.stringify(d.content, null, 2) + '\n' });
    files.push({ path: 'data/posts.json', content: JSON.stringify(d.posts, null, 2) + '\n' });
    var all = JSON.stringify([d.content, d.posts]), uploaded = [];
    Object.keys(S.pending).forEach(function (p) { if (all.indexOf(p) >= 0) { files.push({ path: p, base64: S.pending[p].base64 }); uploaded.push(p); } });
    var keep = {}; out.forEach(function (f) { keep[f.path] = 1; });
    var gone = oldPaths.filter(function (p) { return !keep[p]; });
    for (var i = 0; i < gone.length; i++) { if (await readFile(gone[i]) !== null) files.push({ path: gone[i], content: null }); }
    await commit(files, message);
    S.content = d.content; S.posts = d.posts;
    uploaded.forEach(function (p) { delete S.pending[p]; });
  }

  /* ================= الصور ================= */
  function readAsDataURL(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(file); }); }
  function loadImage(src) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { rej(new Error('تعذر قراءة الصورة. استخدم صورة بصيغة JPG أو PNG أو WebP.')); }; i.src = src; }); }
  function slugName(n) { var b = n.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30); return b || 'photo'; }
  function imgSrc(path) { return S.pending[path] ? S.pending[path].dataUrl : siteRoot + path; }
  async function processFile(file) {
    if (!/^image\//.test(file.type)) throw new Error('الملف ليس صورة.');
    if (file.size > 15 * 1024 * 1024) throw new Error('حجم الصورة كبير جداً (الحد الأقصى 15MB).');
    var url = URL.createObjectURL(file), b64, durl, w, h, ext;
    try {
      var img = await loadImage(url); w = img.naturalWidth; h = img.naturalHeight;
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        durl = await readAsDataURL(file); b64 = durl.split(',')[1]; ext = file.type === 'image/gif' ? 'gif' : 'svg';
      } else {
        var k = Math.min(1, 1600 / Math.max(w, h)), cw = Math.round(w * k), ch = Math.round(h * k);
        var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
        var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cw, ch); cx.drawImage(img, 0, 0, cw, ch);
        durl = cv.toDataURL('image/jpeg', 0.82); b64 = durl.split(',')[1]; ext = 'jpg'; w = cw; h = ch;
      }
    } finally { URL.revokeObjectURL(url); }
    var path = 'assets/uploads/' + slugName(file.name) + '-' + Date.now().toString(36) + '.' + ext;
    S.pending[path] = { base64: b64, dataUrl: durl, width: w, height: h };
    return { path: path, width: w, height: h };
  }
  async function listUploads() {
    var list = [];
    try {
      var r = await gh('/repos/' + S.repo + '/contents/assets/uploads?ref=' + encodeURIComponent(S.branch));
      list = r.filter(function (x) { return x.type === 'file' && /\.(jpe?g|png|webp|gif|svg)$/i.test(x.name); }).map(function (x) { return 'assets/uploads/' + x.name; });
    } catch (e) { if (e.status !== 404) throw e; }
    Object.keys(S.pending).forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); });
    return list;
  }
  /* نافذة اختيار صورة: رفع من الجهاز أو من المكتبة. تُرجع {path,width,height,alt,caption} أو null */
  function pickImage(o) {
    return new Promise(function (resolve) {
      var m = el('div', 'modal'), box = el('div', 'mbox'); m.appendChild(box);
      box.appendChild(el('h2', null, 'إضافة صورة'));
      var chosen = null;
      var fl = el('label', 'filebtn', 'ارفع صورة من جهازك'); var file = el('input'); file.type = 'file'; file.accept = 'image/*'; fl.appendChild(file); box.appendChild(fl);
      var st = el('div', 'msg'); st.hidden = true; box.appendChild(st);
      var prev = el('img', 'pvimg'); prev.hidden = true; box.appendChild(prev);
      box.appendChild(el('div', 'lbl', 'أو اختر من الصور المرفوعة سابقاً'));
      var lib = el('div', 'lib', 'جارٍ التحميل...'); box.appendChild(lib);
      var alt, cap;
      if (o.alt) { var la = el('label'); la.appendChild(el('span', null, 'وصف الصورة (مهم للسيو ولمن لا يرى الصورة)')); alt = el('input'); alt.placeholder = 'مثال: عزل سطح فيلا بالرولات في جدة'; la.appendChild(alt); box.appendChild(la); }
      if (o.caption) { var lc = el('label'); lc.appendChild(el('span', null, 'تعليق تحت الصورة (اختياري)')); cap = el('input'); lc.appendChild(cap); box.appendChild(lc); }
      var act = el('div', 'actions'), ok = el('button', 'btn btn-primary', 'إدراج الصورة'), no = el('button', 'btn btn-light', 'إلغاء'); ok.type = no.type = 'button';
      act.appendChild(ok); act.appendChild(no); box.appendChild(act);
      document.body.appendChild(m);
      function close(v) { m.remove(); resolve(v); }
      function choose(c) { chosen = c; prev.src = imgSrc(c.path); prev.hidden = false; }
      file.addEventListener('change', async function () {
        if (!file.files[0]) return;
        msg(st, 'جارٍ تجهيز الصورة...', '');
        try { choose(await processFile(file.files[0])); msg(st, ''); } catch (e) { msg(st, e.message, 'err'); }
      });
      listUploads().then(function (list) {
        lib.textContent = '';
        if (!list.length) { lib.textContent = 'لا توجد صور مرفوعة بعد.'; return; }
        list.forEach(function (p) {
          var t = el('img', 'libimg'); t.src = imgSrc(p); t.alt = ''; t.title = p;
          t.onclick = async function () {
            var info = S.pending[p] ? { path: p, width: S.pending[p].width, height: S.pending[p].height } : { path: p };
            if (!info.width) { try { var im = await loadImage(siteRoot + p); info.width = im.naturalWidth; info.height = im.naturalHeight; } catch (e) { } }
            choose(info);
          };
          lib.appendChild(t);
        });
      }).catch(function (e) { lib.textContent = e.message; });
      no.onclick = function () { close(null); };
      ok.onclick = function () {
        if (!chosen) return msg(st, 'اختر صورة أولاً.', 'err');
        if (o.alt && !alt.value.trim()) return msg(st, 'اكتب وصفاً للصورة.', 'err');
        close({ path: chosen.path, width: chosen.width, height: chosen.height, alt: alt ? alt.value.trim() : '', caption: cap ? cap.value.trim() : '' });
      };
    });
  }

  /* ================= تنظيف HTML الناتج من المحرر ================= */
  var ALLOWED = { H2: 1, H3: 1, P: 1, UL: 1, OL: 1, LI: 1, STRONG: 1, EM: 1, A: 1, BR: 1, BLOCKQUOTE: 1, DIV: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1, HR: 1, FIGURE: 1, FIGCAPTION: 1, IMG: 1, IFRAME: 1 };
  var BLOCK = { H2: 1, H3: 1, P: 1, UL: 1, OL: 1, BLOCKQUOTE: 1, DIV: 1, TABLE: 1, HR: 1, FIGURE: 1 };
  var YT = /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{6,15}$/;
  function clean(html) {
    var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    var out = document.createElement('div');
    function walk(node, parent) {
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) { parent.appendChild(document.createTextNode(n.nodeValue)); return; }
        if (n.nodeType !== 1) return;
        var tag = n.tagName;
        if (/^(SCRIPT|STYLE|OBJECT|EMBED|FORM|INPUT|BUTTON|SELECT|TEXTAREA|NOSCRIPT|SVG)$/.test(tag)) return;
        if (tag === 'B') tag = 'STRONG'; else if (tag === 'I') tag = 'EM';
        else if (tag === 'H1') tag = 'H2'; else if (/^H[4-6]$/.test(tag)) tag = 'H3';
        else if (tag === 'DIV') tag = (n.classList.contains('callout') || n.classList.contains('video')) ? 'DIV' : 'P';
        if (!ALLOWED[tag]) { walk(n, parent); return; }
        var e;
        if (tag === 'IMG') {
          var src = n.getAttribute('data-file') || n.getAttribute('src') || '';
          if (!/^(assets\/uploads\/[\w.\-]+|https:\/\/[^\s"'<>]+)$/.test(src)) return;
          e = document.createElement('img'); e.setAttribute('src', src); e.setAttribute('alt', (n.getAttribute('alt') || '').trim());
          ['width', 'height'].forEach(function (a) { var v = n.getAttribute(a); if (/^\d{1,5}$/.test(v || '')) e.setAttribute(a, v); });
          e.setAttribute('loading', 'lazy'); e.setAttribute('decoding', 'async'); parent.appendChild(e); return;
        }
        if (tag === 'IFRAME') {
          var ys = n.getAttribute('src') || '';
          if (!YT.test(ys) || !(parent.classList && parent.classList.contains('video'))) return;
          e = document.createElement('iframe'); e.setAttribute('src', ys); e.setAttribute('loading', 'lazy'); e.setAttribute('allowfullscreen', ''); e.setAttribute('title', 'فيديو'); parent.appendChild(e); return;
        }
        e = document.createElement(tag.toLowerCase());
        if (tag === 'DIV') e.className = n.classList.contains('video') ? 'video' : 'callout';
        if (tag === 'A') {
          var h = (n.getAttribute('href') || '').trim();
          if (/^(https?:|tel:|mailto:|\/|\.\.?\/|#)/i.test(h)) {
            e.setAttribute('href', h); if (/^https?:/i.test(h)) e.setAttribute('rel', 'noopener');
            if (n.classList.contains('btn')) e.className = n.classList.contains('btn-primary') ? 'btn btn-primary' : 'btn btn-dark';
          }
        }
        walk(n, e); parent.appendChild(e);
      });
    }
    walk(doc.body, out);
    var res = document.createElement('div'), cur = null;
    Array.prototype.slice.call(out.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && BLOCK[n.tagName]) { cur = null; res.appendChild(n); return; }
      if (n.nodeType === 3 && !n.nodeValue.trim() && !cur) return;
      if (!cur) { cur = document.createElement('p'); res.appendChild(cur); }
      cur.appendChild(n);
    });
    var parts = [];
    Array.prototype.forEach.call(res.children, function (e) {
      if (e.tagName !== 'HR' && !e.textContent.trim() && !e.querySelector('img,iframe,hr')) return;
      parts.push(e.outerHTML);
    });
    return parts.join('\n');
  }

  /* ================= المحرر الغني ================= */
  var TOOLS = [
    ['p', 'فقرة'], ['h2', 'عنوان رئيسي'], ['h3', 'عنوان فرعي'], ['bold', 'غامق'], ['italic', 'مائل'], '|',
    ['ul', '• قائمة'], ['ol', '1. قائمة'], ['quote', 'اقتباس'], ['callout', 'ملاحظة مميزة'], ['hr', 'فاصل'], '|',
    ['image', 'صورة'], ['video', 'فيديو يوتيوب'], ['table', 'جدول'], ['row', '+ صف'], ['col', '+ عمود'], ['deltable', 'حذف الجدول'], '|',
    ['link', 'رابط'], ['unlink', 'إلغاء الرابط'], ['call', 'زر اتصال'], ['wa', 'زر واتساب'], '|',
    ['clear', 'مسح التنسيق'], ['undo', 'تراجع'], ['redo', 'إعادة']
  ];
  function ytId(u) {
    var m = String(u).trim().match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{6,15})/);
    return m ? m[1] : null;
  }
  function makeRich(initial) {
    var wrap = el('div', 'rich'), tb = el('div', 'toolbar'), ed = el('div', 'content editor'), hb = el('textarea', 'htmlbox');
    ed.contentEditable = 'true'; ed.dir = 'rtl'; ed.setAttribute('role', 'textbox'); ed.setAttribute('aria-multiline', 'true');
    hb.hidden = true; hb.dir = 'ltr'; hb.rows = 14;
    var htmlMode = false, saved = null;
    var restoring = false;
    function save() { if (restoring) return; var s = getSelection(); if (s.rangeCount && ed.contains(s.anchorNode)) saved = s.getRangeAt(0).cloneRange(); }
    function restore() {
      var r = saved; restoring = true;
      try { ed.focus(); if (r) { var s = getSelection(); s.removeAllRanges(); s.addRange(r); } } finally { restoring = false; }
    }
    ['keyup', 'mouseup', 'focus', 'input'].forEach(function (ev) { ed.addEventListener(ev, save); });
    function cell() { var s = getSelection(), n = s.anchorNode; if (!n) return null; n = n.nodeType === 3 ? n.parentNode : n; var c = n.closest && n.closest('td,th'); return c && ed.contains(c) ? c : null; }
    function insert(html) { restore(); document.execCommand('insertHTML', false, html); }
    async function run(c) {
      var x = function (a, b, v) { return document.execCommand(a, b, v); };
      restore();
      switch (c) {
        case 'p': case 'h2': case 'h3': x('formatBlock', false, '<' + c + '>'); break;
        case 'bold': x('bold'); break;
        case 'italic': x('italic'); break;
        case 'ul': x('insertUnorderedList'); break;
        case 'ol': x('insertOrderedList'); break;
        case 'quote': x('formatBlock', false, '<blockquote>'); break;
        case 'hr': x('insertHorizontalRule'); break;
        case 'unlink': x('unlink'); break;
        case 'undo': x('undo'); break;
        case 'redo': x('redo'); break;
        case 'clear': x('removeFormat'); x('formatBlock', false, '<p>'); break;
        case 'link': var u = prompt('اكتب الرابط (يبدأ بـ https:// أو tel:)'); if (u) { restore(); x('createLink', false, u.trim()); } break;
        case 'callout':
          x('formatBlock', false, '<div>');
          var s = getSelection(), n = s.anchorNode;
          if (n) { var e = n.nodeType === 3 ? n.parentNode : n, d = e.closest('div'); if (d && d !== ed && ed.contains(d)) d.classList.toggle('callout'); }
          break;
        case 'image':
          var r = await pickImage({ alt: true, caption: true }); if (!r) break;
          var fig = '<figure><img src="' + esc(imgSrc(r.path)) + '" data-file="' + esc(r.path) + '" alt="' + esc(r.alt) + '"' + (r.width ? ' width="' + r.width + '" height="' + r.height + '"' : '') + '>' + (r.caption ? '<figcaption>' + esc(r.caption) + '</figcaption>' : '') + '</figure><p><br></p>';
          insert(fig); break;
        case 'video':
          var v = prompt('الصق رابط فيديو يوتيوب'); if (!v) break;
          var id = ytId(v); if (!id) { alert('رابط يوتيوب غير صحيح.'); break; }
          insert('<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '" allowfullscreen title="فيديو"></iframe></div><p><br></p>'); break;
        case 'table':
          var cols = parseInt(prompt('عدد الأعمدة (1 إلى 6)', '3'), 10), rows = parseInt(prompt('عدد الصفوف بدون صف العناوين (1 إلى 15)', '3'), 10);
          if (!(cols >= 1 && cols <= 6 && rows >= 1 && rows <= 15)) break;
          var th = '', td = '', i, j;
          for (i = 0; i < cols; i++) { th += '<th>عنوان ' + (i + 1) + '</th>'; td += '<td><br></td>'; }
          var body = ''; for (j = 0; j < rows; j++) body += '<tr>' + td + '</tr>';
          insert('<table><thead><tr>' + th + '</tr></thead><tbody>' + body + '</tbody></table><p><br></p>'); break;
        case 'row': case 'col': case 'deltable':
          var ce = cell(); if (!ce) { alert('ضع المؤشر داخل خلية في الجدول أولاً.'); break; }
          var tr = ce.parentNode, table = ce.closest('table');
          if (c === 'deltable') { table.remove(); break; }
          if (c === 'row') {
            var nt = document.createElement('tr');
            for (var q = 0; q < tr.cells.length; q++) { var nc = document.createElement('td'); nc.innerHTML = '<br>'; nt.appendChild(nc); }
            if (tr.parentNode.tagName === 'THEAD') { var tbd = table.tBodies[0] || table.appendChild(document.createElement('tbody')); tbd.insertBefore(nt, tbd.firstChild); }
            else tr.parentNode.insertBefore(nt, tr.nextSibling);
          } else {
            var idx = ce.cellIndex;
            Array.prototype.forEach.call(table.rows, function (rw) { var k = document.createElement(rw.parentNode.tagName === 'THEAD' ? 'th' : 'td'); k.innerHTML = rw.parentNode.tagName === 'THEAD' ? 'عنوان' : '<br>'; rw.insertBefore(k, rw.cells[idx + 1] || null); });
          }
          break;
        case 'call': insert('<p><a class="btn btn-dark" href="tel:' + esc(S.content.settings.phone) + '">اتصل بنا الآن</a></p>'); break;
        case 'wa': insert('<p><a class="btn btn-primary" href="' + esc(Core.waUrl(S.content.settings)) + '">تواصل معنا عبر واتساب</a></p>'); break;
      }
      save(); ed.dispatchEvent(new Event('input', { bubbles: true }));
    }
    TOOLS.forEach(function (t) {
      if (t === '|') { tb.appendChild(el('span', 'sep')); return; }
      var b = el('button', null, t[1]); b.type = 'button'; b.dataset.cmd = t[0]; tb.appendChild(b);
    });
    var hbtn = el('button', 'htmlbtn', 'كود HTML'); hbtn.type = 'button'; tb.appendChild(hbtn);
    tb.addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
    tb.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cmd]'); if (!b || htmlMode) return; run(b.dataset.cmd);
    });
    hbtn.addEventListener('click', function () {
      if (htmlMode) setHtml(clean(hb.value)); else hb.value = clean(ed.innerHTML);
      htmlMode = !htmlMode; ed.hidden = htmlMode; hb.hidden = !htmlMode; tb.classList.toggle('off', htmlMode); hbtn.classList.toggle('on', htmlMode);
      hbtn.textContent = htmlMode ? 'العودة للمحرر' : 'كود HTML';
    });
    ed.addEventListener('paste', function (e) {
      e.preventDefault();
      document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
    });
    ed.addEventListener('focus', function () { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { } });
    function setHtml(html) {
      ed.innerHTML = clean(html || '') || '<p><br></p>';
      Array.prototype.forEach.call(ed.querySelectorAll('img'), function (im) {
        var p = im.getAttribute('src'); im.setAttribute('data-file', p); if (S.pending[p]) im.setAttribute('src', S.pending[p].dataUrl); else if (/^assets\//.test(p)) im.setAttribute('src', siteRoot + p);
      });
    }
    wrap.appendChild(tb); wrap.appendChild(ed); wrap.appendChild(hb); setHtml(initial);
    return { el: wrap, get: function () { return clean(htmlMode ? hb.value : ed.innerHTML); } };
  }

  /* ================= منشئ النماذج ================= */
  function buildForm(schema, data) {
    var root = el('div', 'form'), gets = [];
    schema.forEach(function (f) {
      if (f.t === 'h') { root.appendChild(el('div', 'fh', f.l)); return; }
      var w = el('div', 'fld'), val = f.k ? getPath(data, f.k) : undefined, get, input;
      root.appendChild(w);
      function labeled(ctl) {
        var lab = el('label'); lab.appendChild(el('span', null, f.l)); lab.appendChild(ctl); w.appendChild(lab);
        if (f.note) w.appendChild(el('div', 'note', f.note));
      }
      switch (f.t) {
        case 'text': case 'textarea':
          input = f.t === 'text' ? el('input') : el('textarea'); if (f.t === 'textarea') input.rows = f.rows || 3;
          input.value = val == null ? '' : val; if (f.ph) input.placeholder = f.ph; if (f.ltr) input.dir = 'ltr'; if (f.ro) input.readOnly = true;
          labeled(input);
          if (f.hint) {
            var cnt = el('div', 'cnt'); w.appendChild(cnt);
            var upd = function () { var n = input.value.length; cnt.textContent = n + ' حرف (المناسب ' + f.hint[0] + '–' + f.hint[1] + ')'; cnt.className = 'cnt' + (n >= f.hint[0] && n <= f.hint[1] ? ' ok' : ''); };
            input.addEventListener('input', upd); upd();
          }
          get = function () { return input.value.trim(); }; break;
        case 'lines':
          input = el('textarea'); input.rows = f.rows || 5; input.value = (val || []).join('\n'); labeled(input);
          get = function () { return input.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }; break;
        case 'select':
          input = el('select'); f.opts.forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; input.appendChild(op); }); input.value = val || f.opts[0][0]; labeled(input);
          get = function () { return input.value; }; break;
        case 'check':
          var lab = el('label', 'chk'); input = el('input'); input.type = 'checkbox'; input.checked = !!val; lab.appendChild(input); lab.appendChild(el('span', null, f.l)); w.appendChild(lab);
          get = function () { return input.checked; }; break;
        case 'color':
          input = el('input'); input.type = 'color'; input.value = val || '#000000'; labeled(input);
          get = function () { return input.value; }; break;
        case 'rich':
          w.appendChild(el('div', 'lbl', f.l)); var rr = makeRich(val || ''); w.appendChild(rr.el); get = rr.get; break;
        case 'image':
          w.appendChild(el('div', 'lbl', f.l));
          var cur = val || '', dims = { w: f.w ? getPath(data, f.w) : 0, h: f.h ? getPath(data, f.h) : 0 };
          var box = el('div', 'imgfld'), pv = el('img', 'thumbprev'), b1 = el('button', 'btn btn-light', 'اختيار صورة'), b2 = el('button', 'btn btn-light', 'إزالة');
          b1.type = b2.type = 'button';
          function showImg() { pv.hidden = !cur; if (cur) pv.src = imgSrc(cur); b2.hidden = !cur; }
          b1.onclick = async function () { var r = await pickImage({ alt: false, caption: false }); if (r) { cur = r.path; dims = { w: r.width || 0, h: r.height || 0 }; showImg(); } };
          b2.onclick = function () { cur = ''; dims = { w: 0, h: 0 }; showImg(); };
          box.appendChild(pv); box.appendChild(b1); box.appendChild(b2); w.appendChild(box); showImg();
          get = function () { return cur; };
          if (f.w) gets.push([f.w, function () { return cur ? dims.w : 0; }]);
          if (f.h) gets.push([f.h, function () { return cur ? dims.h : 0; }]);
          break;
        case 'list':
          w.appendChild(el('div', 'lbl', f.l));
          var items = el('div', 'items'); w.appendChild(items);
          var addItem = function (v) {
            var it = el('div', 'item'), head = el('div', 'ihead'), tl = el('b', null, f.itemLabel || 'عنصر');
            var bu = el('button', 'mini', '↑'), bd = el('button', 'mini', '↓'), bx = el('button', 'mini danger', '✕ حذف');
            bu.type = bd.type = bx.type = 'button';
            head.appendChild(tl); head.appendChild(bu); head.appendChild(bd); head.appendChild(bx);
            var sub = buildForm(f.item, v || clone(f.blank || {}));
            it.appendChild(head); it.appendChild(sub.el); it._get = sub.get; items.appendChild(it);
            var first = sub.el.querySelector('input:not([type=checkbox]),textarea');
            function ttl() { if (first && first.value) tl.textContent = first.value.slice(0, 50); }
            if (first) first.addEventListener('input', ttl); ttl();
            bu.onclick = function () { if (it.previousElementSibling) items.insertBefore(it, it.previousElementSibling); };
            bd.onclick = function () { if (it.nextElementSibling) items.insertBefore(it.nextElementSibling, it); };
            bx.onclick = function () { it.remove(); };
          };
          (val || []).forEach(addItem);
          var ab = el('button', 'btn btn-light', f.add || '+ إضافة'); ab.type = 'button'; ab.onclick = function () { addItem(null); }; w.appendChild(ab);
          get = function () { return Array.prototype.map.call(items.children, function (it) { return it._get(); }); }; break;
      }
      if (f.k) gets.push([f.k, get]);
    });
    return { el: root, get: function () { var o = {}; gets.forEach(function (g) { setPath(o, g[0], g[1]()); }); return o; } };
  }

  /* ================= المعاينة ================= */
  function showPreview(html, basePath) {
    Object.keys(S.pending).forEach(function (p) {
      var re = new RegExp('(?:\\.\\./)?' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      html = html.replace(re, function () { return S.pending[p].dataUrl; });
    });
    html = html.replace('<head>', '<head><base href="' + siteRoot + basePath + '">');
    $('pv-frame').srcdoc = html; $('pv').hidden = false;
  }

  /* شاشة نموذج عامة: cfg = {head, schema, data, mutate(vals)->fn(content,posts), message(vals), previewPath(vals), back, after, extra, postsOnly} */
  function showForm(cfg) {
    var pane = $('pane'); pane.textContent = '';
    var bar = el('div', 'bar'); bar.appendChild(el('h1', null, cfg.head));
    if (cfg.back) { var bb = el('button', 'btn btn-light', 'رجوع للقائمة'); bb.onclick = cfg.back; bar.appendChild(bb); }
    pane.appendChild(bar);
    if (cfg.intro) pane.appendChild(el('p', 'hint', cfg.intro));
    var panel = el('div', 'panel'); pane.appendChild(panel);
    var form = buildForm(cfg.schema, cfg.data); panel.appendChild(form.el);
    if (cfg.extra) cfg.extra(panel, form);
    var out = el('div', 'msg'); out.hidden = true; panel.appendChild(out);
    var act = el('div', 'actions'), save = el('button', 'btn btn-primary', 'حفظ ونشر'), prev = el('button', 'btn btn-light', 'معاينة');
    save.type = prev.type = 'button'; act.appendChild(save); act.appendChild(prev); panel.appendChild(act);
    save.onclick = function () {
      busy(save, 'جارٍ النشر...', async function () {
        var vals = form.get(), mut = cfg.mutate(vals);
        await apply(mut, cfg.message(vals), { postsOnly: cfg.postsOnly });
        if (cfg.after) cfg.after(); else msg(out, 'تم الحفظ. ستظهر التعديلات على الموقع خلال دقيقة أو دقيقتين.', 'ok');
      }, out);
    };
    prev.onclick = function () {
      try {
        var vals = form.get(), mut = cfg.mutate(vals), c = clone(S.content), p = clone(S.posts);
        mut(c, p);
        var path = cfg.previewPath(vals), f = Core.render(c, p).filter(function (x) { return x.path === path; })[0];
        showPreview(f.content, path.indexOf('blog/') === 0 ? 'blog/' : '');
        msg(out, '');
      } catch (e) { msg(out, e.message, 'err'); }
    };
  }

  /* ================= تعريف نماذج الموقع ================= */
  var FAQ = { k: 'faq', t: 'list', l: 'الأسئلة الشائعة', itemLabel: 'سؤال', add: '+ إضافة سؤال', blank: { q: '', a: '' }, item: [{ k: 'q', t: 'text', l: 'السؤال' }, { k: 'a', t: 'textarea', l: 'الجواب', rows: 3 }] };
  var HOME_SCHEMA = [
    { t: 'h', l: 'ظهور الصفحة في جوجل' },
    { k: 'seoTitle', t: 'text', l: 'عنوان الصفحة في جوجل', hint: [30, 60] },
    { k: 'metaDesc', t: 'textarea', l: 'وصف الصفحة في جوجل', hint: [120, 160] },
    { t: 'h', l: 'أعلى الصفحة' },
    { k: 'heroTitle', t: 'text', l: 'العنوان الرئيسي' },
    { k: 'heroLead', t: 'textarea', l: 'النص التعريفي تحت العنوان', rows: 3 },
    { k: 'heroPoints', t: 'lines', l: 'نقاط البطاقة (كل نقطة في سطر)' },
    { t: 'h', l: 'قسم الخدمات (بطاقات الخدمات تُدار من تبويب "الخدمات")' },
    { k: 'servicesTitle', t: 'text', l: 'عنوان القسم' }, { k: 'servicesSub', t: 'text', l: 'نص تحت العنوان' },
    { t: 'h', l: 'نص تعريفي بالشركة' },
    { k: 'intro', t: 'rich', l: 'المحتوى' },
    { t: 'h', l: 'لماذا تختارنا' },
    { k: 'whyTitle', t: 'text', l: 'عنوان القسم' },
    { k: 'why', t: 'list', l: 'البطاقات', itemLabel: 'ميزة', add: '+ إضافة ميزة', blank: { title: '', text: '' }, item: [{ k: 'title', t: 'text', l: 'العنوان' }, { k: 'text', t: 'textarea', l: 'النص', rows: 2 }] },
    { t: 'h', l: 'كيف نعمل' },
    { k: 'stepsTitle', t: 'text', l: 'عنوان القسم' }, { k: 'stepsSub', t: 'text', l: 'نص تحت العنوان' },
    { k: 'steps', t: 'list', l: 'الخطوات', itemLabel: 'خطوة', add: '+ إضافة خطوة', blank: { title: '', text: '' }, item: [{ k: 'title', t: 'text', l: 'العنوان' }, { k: 'text', t: 'textarea', l: 'النص', rows: 2 }] },
    { t: 'h', l: 'معرض الأعمال (يظهر فقط عند إضافة صور)' },
    { k: 'galleryTitle', t: 'text', l: 'عنوان القسم' }, { k: 'gallerySub', t: 'text', l: 'نص تحت العنوان' },
    { k: 'gallery', t: 'list', l: 'الصور', itemLabel: 'صورة', add: '+ إضافة صورة', blank: { image: '', caption: '' }, item: [{ k: 'image', t: 'image', l: 'الصورة', w: 'width', h: 'height' }, { k: 'caption', t: 'text', l: 'التعليق (يُستخدم أيضاً كوصف للصورة)' }] },
    { t: 'h', l: 'المدونة والأسئلة' },
    { k: 'blogTitle', t: 'text', l: 'عنوان قسم المقالات' }, { k: 'blogSub', t: 'text', l: 'نص تحت العنوان' },
    { k: 'faqTitle', t: 'text', l: 'عنوان قسم الأسئلة' }, FAQ
  ];
  var SETTINGS_SCHEMA = [
    { t: 'h', l: 'بيانات الشركة' },
    { k: 'name', t: 'text', l: 'اسم الشركة' }, { k: 'tagline', t: 'text', l: 'الوصف المختصر تحت الاسم' },
    { k: 'city', t: 'text', l: 'المدينة' }, { k: 'country', t: 'text', l: 'الدولة' },
    { k: 'phone', t: 'text', l: 'رقم الهاتف (للاتصال)', ltr: true, ph: '0568654551' }, { k: 'phoneDisplay', t: 'text', l: 'الرقم كما يظهر للزوار', ltr: true, ph: '056 865 4551' },
    { k: 'countryCode', t: 'text', l: 'مفتاح الدولة (للواتساب)', ltr: true, ph: '966' }, { k: 'waMessage', t: 'text', l: 'رسالة الواتساب الجاهزة' },
    { k: 'footerText', t: 'textarea', l: 'نص أسفل الصفحة', rows: 2 },
    { k: 'schemaDescription', t: 'textarea', l: 'وصف الشركة لمحركات البحث', rows: 2 },
    { t: 'h', l: 'دعوة الاتصال (تظهر في أسفل كل صفحة)' },
    { k: 'ctaTitle', t: 'text', l: 'العنوان' }, { k: 'ctaText', t: 'text', l: 'النص' },
    { t: 'h', l: 'مناطق الخدمة' },
    { k: 'areasTitle', t: 'text', l: 'العنوان' }, { k: 'areasIntro', t: 'text', l: 'جملة قبل القائمة' },
    { k: 'areas', t: 'lines', l: 'المناطق (كل منطقة في سطر)', rows: 8 }, { k: 'areasOutro', t: 'text', l: 'جملة بعد القائمة' },
    { t: 'h', l: 'الألوان' },
    { k: 'colors.primary', t: 'color', l: 'اللون الأساسي (الشعار والعناوين)' }, { k: 'colors.accent', t: 'color', l: 'اللون الثانوي' }, { k: 'colors.button', t: 'color', l: 'لون أزرار الاتصال' },
    { t: 'h', l: 'الموقع والتحقق' },
    { k: 'domain', t: 'text', l: 'رابط الموقع', ltr: true, note: 'غيّره فقط عند ربط دومين خاص. يجب أن يبدأ بـ https://' },
    { k: 'googleVerify', t: 'text', l: 'كود التحقق من Google Search Console (قيمة content فقط)', ltr: true }, { k: 'bingVerify', t: 'text', l: 'كود التحقق من Bing (اختياري)', ltr: true }
  ];
  var ICON_OPTS = [['roof', 'سقف'], ['tank', 'خزان'], ['search', 'كشف'], ['drop', 'قطرة ماء'], ['shield', 'حماية'], ['wrench', 'صيانة'], ['home', 'منزل']];
  function serviceSchema(editing) {
    return [
      { k: 'title', t: 'text', l: 'اسم الخدمة' },
      { k: 'slug', t: 'text', l: 'رابط الصفحة (بالإنجليزية)', ltr: true, ro: editing, ph: 'water-proofing', note: editing ? 'لا يتغير بعد النشر' : 'مثال: water-proofing' },
      { k: 'icon', t: 'select', l: 'الأيقونة', opts: ICON_OPTS },
      { k: 'short', t: 'textarea', l: 'وصف قصير (يظهر في بطاقة الخدمة بالرئيسية)', rows: 2 },
      { t: 'h', l: 'أعلى الصفحة' },
      { k: 'h1', t: 'text', l: 'العنوان الرئيسي للصفحة' },
      { k: 'lead', t: 'textarea', l: 'النص التعريفي', rows: 3 },
      { t: 'h', l: 'ظهور الصفحة في جوجل' },
      { k: 'seoTitle', t: 'text', l: 'عنوان الصفحة في جوجل', hint: [30, 60] },
      { k: 'metaDesc', t: 'textarea', l: 'وصف الصفحة في جوجل', hint: [120, 160] },
      { t: 'h', l: 'محتوى الصفحة' },
      { k: 'toc', t: 'check', l: 'إظهار فهرس محتويات في أعلى الصفحة (روابط تنقلك إلى كل فقرة، تُبنى تلقائياً من العناوين الرئيسية)' },
      { k: 'body', t: 'rich', l: 'المحتوى' },
      FAQ
    ];
  }
  function pageSchema(editing) {
    return [
      { k: 'title', t: 'text', l: 'اسم الصفحة (يظهر في القائمة)' },
      { k: 'slug', t: 'text', l: 'رابط الصفحة (بالإنجليزية)', ltr: true, ro: editing, ph: 'about', note: editing ? 'لا يتغير بعد النشر' : 'مثال: about أو projects' },
      { k: 'inMenu', t: 'check', l: 'إظهار الصفحة في القائمة العلوية وأسفل الموقع' },
      { k: 'h1', t: 'text', l: 'العنوان الرئيسي للصفحة' }, { k: 'lead', t: 'textarea', l: 'نص تعريفي (اختياري)', rows: 2 },
      { k: 'seoTitle', t: 'text', l: 'عنوان الصفحة في جوجل', hint: [30, 60] }, { k: 'metaDesc', t: 'textarea', l: 'وصف الصفحة في جوجل', hint: [120, 160] },
      { k: 'toc', t: 'check', l: 'إظهار فهرس محتويات في أعلى الصفحة (تُبنى تلقائياً من العناوين الرئيسية)' },
      { k: 'body', t: 'rich', l: 'المحتوى' }
    ];
  }
  var BLOG_SCHEMA = [
    { k: 'seoTitle', t: 'text', l: 'عنوان صفحة المدونة في جوجل', hint: [30, 60] }, { k: 'metaDesc', t: 'textarea', l: 'وصف الصفحة في جوجل', hint: [120, 160] },
    { k: 'h1', t: 'text', l: 'العنوان الرئيسي' }, { k: 'lead', t: 'textarea', l: 'النص التعريفي', rows: 2 }
  ];
  function postSchema(editing) {
    return [
      { k: 'title', t: 'text', l: 'عنوان المقال', hint: [20, 55] },
      { k: 'slug', t: 'text', l: 'رابط المقال (بالإنجليزية فقط)', ltr: true, ro: editing, ph: 'roof-leak-causes', note: editing ? 'لا يتغير بعد النشر (للحفاظ على ترتيبه في جوجل)' : 'مثال: roof-leak-causes' },
      { k: 'desc', t: 'textarea', l: 'وصف قصير يظهر في نتائج جوجل', hint: [120, 160] },
      { k: 'focusKw', t: 'text', l: 'الكلمة المفتاحية الرئيسية (العبارة التي تريد الظهور بها في جوجل)', ph: 'مثال: عزل اسطح جدة', note: 'لا تظهر للزوار، تستخدم لفحص المقال فقط. اختر عبارة واحدة يبحث بها العملاء.' },
      { k: 'keywords', t: 'lines', l: 'كلمات مفتاحية ثانوية (كل كلمة في سطر)', rows: 3, note: 'عبارات قريبة تريد أن تظهر في النص، مثل: تسرب الاسطح، عزل مائي' },
      { k: 'toc', t: 'check', l: 'إظهار قائمة محتويات في أعلى المقال (تُبنى تلقائياً من العناوين الرئيسية)' },
      { k: 'image', t: 'image', l: 'صورة المقال الرئيسية (اختيارية، تظهر في أعلى المقال وعند المشاركة)', w: 'imageWidth', h: 'imageHeight' },
      { k: 'body', t: 'rich', l: 'نص المقال' }
    ];
  }

  /* ================= التحقق والتعديلات ================= */
  var SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  function checkSlug(slug, content, selfSlug) {
    if (!SLUG.test(slug) || slug.length > 60) throw new Error('رابط الصفحة يجب أن يكون بالإنجليزية (حروف صغيرة وأرقام وشرطات) مثل: water-proofing');
    if (RESERVED.indexOf(slug) >= 0) throw new Error('هذا الرابط محجوز، اختر رابطاً آخر.');
    var used = content.services.concat(content.pages).some(function (x) { return x.slug === slug && x.slug !== selfSlug; });
    if (used) throw new Error('يوجد صفحة بنفس الرابط. غيّر الرابط.');
  }
  function need(v, msgText) { if (!String(v || '').trim()) throw new Error(msgText); }

  function homeMutate(vals) {
    need(vals.heroTitle, 'اكتب العنوان الرئيسي للصفحة.'); need(vals.seoTitle, 'اكتب عنوان الصفحة في جوجل.');
    vals.gallery = (vals.gallery || []).filter(function (g) { return g.image; });
    return function (c) { c.home = Object.assign(c.home || {}, vals); };
  }
  function settingsMutate(vals) {
    need(vals.name, 'اكتب اسم الشركة.'); need(vals.city, 'اكتب المدينة.');
    vals.phone = String(vals.phone).replace(/\s+/g, '');
    if (!/^\d{9,15}$/.test(vals.phone)) throw new Error('رقم الهاتف يجب أن يكون أرقاماً فقط، مثل 0568654551');
    vals.countryCode = String(vals.countryCode || '966').replace(/\D/g, '') || '966';
    vals.domain = String(vals.domain).trim().replace(/\/+$/, '');
    if (!/^https?:\/\/[^\s]+$/.test(vals.domain)) throw new Error('رابط الموقع يجب أن يبدأ بـ https://');
    if (!vals.phoneDisplay) vals.phoneDisplay = vals.phone;
    return function (c) { c.settings = Object.assign(c.settings || {}, vals); };
  }
  function listMutate(kind, slugEditing, vals, extraCheck) {
    need(vals.title, 'اكتب الاسم.'); need(vals.h1 || vals.title, 'اكتب العنوان الرئيسي.');
    if (!textOf(vals.body)) throw new Error('محتوى الصفحة فارغ.');
    return function (c) {
      var list = c[kind], i = list.findIndex(function (x) { return x.slug === slugEditing; });
      if (slugEditing) { if (i < 0) throw new Error('الصفحة غير موجودة في المستودع.'); vals.slug = slugEditing; }
      else checkSlug(vals.slug, c, null);
      if (extraCheck) extraCheck(vals);
      if (slugEditing) list[i] = Object.assign(list[i], vals); else list.push(vals);
    };
  }
  function postMutate(slugEditing, vals) {
    need(vals.title, 'اكتب عنوان المقال.'); need(vals.desc, 'اكتب وصفاً قصيراً للمقال (يظهر في جوجل).');
    var slug = slugEditing || vals.slug.toLowerCase();
    if (!slugEditing && (!SLUG.test(slug) || slug === 'index')) throw new Error('رابط المقال يجب أن يكون بالإنجليزية (حروف صغيرة وأرقام وشرطات) مثل: roof-leak-causes');
    var text = textOf(vals.body); if (text.length < 80) throw new Error('نص المقال قصير جداً.');
    var words = text.split(' ').length;
    return function (c, posts) {
      var i = posts.findIndex(function (x) { return x.slug === slug; });
      var base = i >= 0 ? posts[i] : null;
      if (slugEditing && !base) throw new Error('المقال غير موجود في المستودع.');
      if (!slugEditing && base) throw new Error('يوجد مقال بنفس الرابط. غيّر رابط المقال.');
      var date = base ? base.date : today();
      var p = { slug: slug, title: vals.title, desc: vals.desc, date: date, date_ar: dateAr(date), read: readLabel(Math.max(1, Math.round(words / 180))), body: '\n' + vals.body + '\n' };
      if (vals.focusKw) p.focusKw = vals.focusKw;
      if (vals.keywords && vals.keywords.length) p.keywords = vals.keywords;
      if (vals.toc) p.toc = true;
      if (vals.image) { p.image = vals.image; if (vals.imageWidth) { p.imageWidth = vals.imageWidth; p.imageHeight = vals.imageHeight; } }
      if (base) { p.modified = today(); posts[i] = p; } else posts.unshift(p);
    };
  }

  /* ================= مساعد السيو للمقالات ================= */
  function seoExtra(panel, form) {
    var box = el('div', 'seo'); panel.appendChild(box); var t = null;
    function upd() {
      var v; try { v = form.get(); } catch (e) { return; }
      var text = textOf(v.body), words = text ? text.split(' ').length : 0, h2 = (v.body.match(/<h2>/g) || []).length;
      var imgs = (v.body.match(/<img /g) || []).length, noalt = (v.body.match(/alt=""/g) || []).length;
      var city = S.content.settings.city;
      var items = [
        [v.title.length >= 20 && v.title.length <= 55, 'طول العنوان: ' + v.title.length + ' حرف (الأفضل 20–55)'],
        [v.desc.length >= 120 && v.desc.length <= 160, 'طول الوصف: ' + v.desc.length + ' حرف (الأفضل 120–160)'],
        [(v.title + ' ' + v.desc).indexOf(city) >= 0, 'ذُكرت "' + city + '" في العنوان أو الوصف (مهم للظهور المحلي)'],
        [words >= 300, 'عدد الكلمات: ' + words + ' (الأفضل 300 فأكثر)'],
        [h2 >= 2, 'عدد العناوين الرئيسية: ' + h2 + ' (الأفضل عنوانان على الأقل)'],
        [imgs >= 1 || !!v.image, 'يحتوي على صورة (يحسّن الجذب والمشاركة)'],
        [noalt === 0, 'كل الصور لها وصف بديل'],
        [!!v.slug && SLUG.test(v.slug) && v.slug.length <= 60, 'رابط المقال بالإنجليزية وقصير']
      ];
      var kw = norm(v.focusKw || '');
      if (!kw) items.push([false, 'اكتب الكلمة المفتاحية الرئيسية لتفعيل فحوصات الكلمات']);
      else {
        var nt = norm(text), words1 = kw.split(' ').length;
        var first = norm(textOf((v.body.match(/<p[\s>][\s\S]*?<\/p>/) || [''])[0])), h2s = (v.body.match(/<h2[^>]*>[\s\S]*?<\/h2>/g) || []).map(function (x) { return norm(textOf(x)); });
        var cnt = count(nt, kw), dens = words ? cnt * words1 / words * 100 : 0;
        items.push([norm(v.title).indexOf(kw) >= 0, 'الكلمة الرئيسية في عنوان المقال']);
        items.push([norm(v.desc).indexOf(kw) >= 0, 'الكلمة الرئيسية في الوصف']);
        items.push([first.indexOf(kw) >= 0, 'الكلمة الرئيسية في الفقرة الأولى']);
        items.push([h2s.some(function (x) { return x.indexOf(kw) >= 0; }), 'الكلمة الرئيسية في أحد العناوين الرئيسية']);
        items.push([dens >= 0.5 && dens <= 2.5, 'تكرار الكلمة الرئيسية: ' + cnt + ' مرة (' + dens.toFixed(1) + '٪، المناسب 0.5–2.5٪ دون حشو)']);
        var sec = (v.keywords || []);
        if (sec.length) { var hit = sec.filter(function (k) { return count(nt, norm(k)) > 0; }); items.push([hit.length === sec.length, 'الكلمات الثانوية الموجودة في النص: ' + hit.length + ' من ' + sec.length + (hit.length < sec.length ? ' (ناقص: ' + sec.filter(function (k) { return hit.indexOf(k) < 0; }).join('، ') + ')' : '')]); }
      }
      if (h2 >= 3 && !v.toc) items.push([false, 'المقال فيه ' + h2 + ' عناوين، فعّل قائمة المحتويات لتسهيل القراءة']);
      box.textContent = '';
      var done = items.filter(function (i) { return i[0]; }).length;
      box.appendChild(el('b', null, 'مساعد السيو: ' + done + ' من ' + items.length));
      var ul = el('ul'); items.forEach(function (i) { ul.appendChild(el('li', i[0] ? 'ok' : 'warn', (i[0] ? '✓ ' : '! ') + i[1])); }); box.appendChild(ul);
    }
    panel.addEventListener('input', function () { clearTimeout(t); t = setTimeout(upd, 400); }); upd();
  }

  /* ================= التبويبات ================= */
  function banner(text, kind) { msg($('banner'), text, kind); }
  function renderList(cfg) {
    var pane = $('pane'); pane.textContent = '';
    var bar = el('div', 'bar'); bar.appendChild(el('h1', null, cfg.head));
    var nb = el('button', 'btn btn-primary', cfg.newLabel); nb.onclick = cfg.onNew; bar.appendChild(nb); pane.appendChild(bar);
    if (cfg.hint) pane.appendChild(el('p', 'hint', cfg.hint));
    if (!cfg.items.length) pane.appendChild(el('div', 'empty', 'لا توجد عناصر بعد.'));
    cfg.items.forEach(function (it, idx) {
      var row = el('div', 'prow'), info = el('div', 'pinfo'); info.appendChild(el('b', null, it.title)); info.appendChild(el('small', null, cfg.sub(it)));
      var act = el('div', 'pact');
      var a = el('a', 'btn btn-light', 'عرض'); a.target = '_blank'; a.rel = 'noopener'; a.href = siteRoot + cfg.href(it); act.appendChild(a);
      var e = el('button', 'btn btn-light', 'تعديل'); e.onclick = function () { cfg.onEdit(it); }; act.appendChild(e);
      if (cfg.onMove) {
        var u = el('button', 'btn btn-light', '↑'), d = el('button', 'btn btn-light', '↓');
        u.disabled = idx === 0; d.disabled = idx === cfg.items.length - 1;
        u.onclick = function () { cfg.onMove(it, -1); }; d.onclick = function () { cfg.onMove(it, 1); }; act.appendChild(u); act.appendChild(d);
      }
      var x = el('button', 'btn btn-danger', 'حذف'); x.onclick = function () { cfg.onDelete(it); }; act.appendChild(x);
      row.appendChild(info); row.appendChild(act); pane.appendChild(row);
    });
  }
  async function quick(mutate, message, okText, after) {
    banner('جارٍ الحفظ...', '');
    try { await apply(mutate, message); after(); banner(okText, 'ok'); } catch (e) { banner(e.message, 'err'); }
  }
  function moveIn(kind, slug, dir) {
    return function (c) { var l = c[kind], i = l.findIndex(function (x) { return x.slug === slug; }), j = i + dir; if (i < 0 || j < 0 || j >= l.length) return; var t = l[i]; l[i] = l[j]; l[j] = t; };
  }

  var TABS = {
    home: function () {
      showForm({ head: 'الصفحة الرئيسية', schema: HOME_SCHEMA, data: S.content.home, mutate: homeMutate, message: function () { return 'تعديل الصفحة الرئيسية'; }, previewPath: function () { return 'index.html'; } });
    },
    settings: function () {
      showForm({
        head: 'إعدادات الموقع', schema: SETTINGS_SCHEMA, data: S.content.settings, mutate: settingsMutate, message: function () { return 'تعديل إعدادات الموقع'; }, previewPath: function () { return 'index.html'; },
        intro: 'أي تغيير هنا (الاسم، الهاتف، الألوان...) ينعكس تلقائياً على كل صفحات الموقع.'
      });
    },
    services: function () { servicesList(); },
    pages: function () { pagesList(); },
    posts: function () { postsList(); }
  };
  function servicesList() {
    renderList({
      head: 'الخدمات', newLabel: '+ خدمة جديدة', items: S.content.services, sub: function (s) { return s.slug + '.html'; }, href: function (s) { return s.slug + '.html'; },
      hint: 'كل خدمة لها صفحة خاصة وتظهر في القائمة العلوية وبطاقات الصفحة الرئيسية. الترتيب هنا هو ترتيب الظهور.',
      onNew: function () { editService(null); }, onEdit: function (s) { editService(s.slug); },
      onMove: function (s, d) { quick(moveIn('services', s.slug, d), 'ترتيب الخدمات', 'تم تغيير الترتيب.', servicesList); },
      onDelete: function (s) {
        if (!confirm('حذف خدمة "' + s.title + '" وصفحتها نهائياً؟')) return;
        quick(function (c) { c.services = c.services.filter(function (x) { return x.slug !== s.slug; }); }, 'حذف خدمة: ' + s.title, 'تم حذف الخدمة.', servicesList);
      }
    });
  }
  function editService(slug) {
    var cur = slug ? S.content.services.filter(function (x) { return x.slug === slug; })[0] : { slug: '', title: '', icon: 'drop', short: '', h1: '', lead: '', seoTitle: '', metaDesc: '', body: '<h2>عنوان فرعي</h2>\n<p>اكتب هنا...</p>', faq: [], toc: true };
    showForm({
      head: slug ? 'تعديل خدمة: ' + cur.title : 'خدمة جديدة', schema: serviceSchema(!!slug), data: cur, back: servicesList,
      mutate: function (v) { return listMutate('services', slug, v); }, message: function (v) { return (slug ? 'تعديل خدمة: ' : 'إضافة خدمة: ') + v.title; },
      previewPath: function (v) { return (slug || v.slug) + '.html'; }, after: function () { servicesList(); banner('تم الحفظ. ستظهر الصفحة على الموقع خلال دقيقة أو دقيقتين.', 'ok'); }
    });
  }
  function pagesList() {
    renderList({
      head: 'صفحات إضافية', newLabel: '+ صفحة جديدة', items: S.content.pages, sub: function (p) { return p.slug + '.html' + (p.inMenu ? ' · في القائمة' : ''); }, href: function (p) { return p.slug + '.html'; },
      hint: 'أنشئ صفحات مثل "من نحن" أو "أعمالنا" أو "تواصل معنا" بمحتوى غني وصور.',
      onNew: function () { editPage(null); }, onEdit: function (p) { editPage(p.slug); },
      onMove: function (p, d) { quick(moveIn('pages', p.slug, d), 'ترتيب الصفحات', 'تم تغيير الترتيب.', pagesList); },
      onDelete: function (p) {
        if (!confirm('حذف صفحة "' + p.title + '" نهائياً؟')) return;
        quick(function (c) { c.pages = c.pages.filter(function (x) { return x.slug !== p.slug; }); }, 'حذف صفحة: ' + p.title, 'تم حذف الصفحة.', pagesList);
      }
    });
  }
  function editPage(slug) {
    var cur = slug ? S.content.pages.filter(function (x) { return x.slug === slug; })[0] : { slug: '', title: '', inMenu: true, toc: false, h1: '', lead: '', seoTitle: '', metaDesc: '', body: '<p>اكتب هنا...</p>' };
    showForm({
      head: slug ? 'تعديل صفحة: ' + cur.title : 'صفحة جديدة', schema: pageSchema(!!slug), data: cur, back: pagesList,
      mutate: function (v) { return listMutate('pages', slug, v); }, message: function (v) { return (slug ? 'تعديل صفحة: ' : 'إضافة صفحة: ') + v.title; },
      previewPath: function (v) { return (slug || v.slug) + '.html'; }, after: function () { pagesList(); banner('تم الحفظ. ستظهر الصفحة على الموقع خلال دقيقة أو دقيقتين.', 'ok'); }
    });
  }
  function postsList() {
    renderList({
      head: 'المقالات', newLabel: '+ مقال جديد', items: S.posts, sub: function (p) { return p.date_ar + (p.modified ? ' · عُدّل ' + dateAr(p.modified) : ''); }, href: function (p) { return 'blog/' + p.slug + '.html'; },
      hint: '',
      onNew: function () { editPost(null); }, onEdit: function (p) { editPost(p.slug); },
      onDelete: function (p) {
        if (!confirm('حذف المقال "' + p.title + '" نهائياً؟')) return;
        quick(function (c, posts) { var i = posts.findIndex(function (x) { return x.slug === p.slug; }); if (i >= 0) posts.splice(i, 1); }, 'حذف مقال: ' + p.title, 'تم حذف المقال.', postsList);
      }
    });
    var b = el('button', 'btn btn-light', 'تعديل عنوان صفحة المدونة ووصفها'); b.style.marginTop = '14px';
    b.onclick = function () {
      showForm({ head: 'صفحة المدونة', schema: BLOG_SCHEMA, data: S.content.blog, back: postsList, mutate: function (v) { return function (c) { c.blog = Object.assign(c.blog || {}, v); }; }, message: function () { return 'تعديل صفحة المدونة'; }, previewPath: function () { return 'blog/index.html'; }, after: function () { postsList(); banner('تم الحفظ.', 'ok'); } });
    };
    $('pane').appendChild(b);
  }
  function editPost(slug) {
    var cur = slug ? S.posts.filter(function (x) { return x.slug === slug; })[0] : { slug: '', title: '', desc: '', image: '', focusKw: '', keywords: [], toc: true, body: '<p>اكتب مقدمة قصيرة هنا...</p>' };
    showForm({
      head: slug ? 'تعديل المقال' : 'مقال جديد', schema: postSchema(!!slug), data: cur, back: postsList, extra: seoExtra, postsOnly: true,
      mutate: function (v) { return postMutate(slug, v); }, message: function (v) { return (slug ? 'تعديل مقال: ' : 'إضافة مقال: ') + v.title; },
      previewPath: function (v) { return 'blog/' + (slug || v.slug.toLowerCase()) + '.html'; }, after: function () { postsList(); banner('تم الحفظ. سيظهر المقال على الموقع خلال دقيقة أو دقيقتين.', 'ok'); }
    });
  }

  function selectTab(name) {
    S.tab = name;
    Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function (b) { b.classList.toggle('on', b.dataset.tab === name); });
    banner('', '');
    TABS[name]();
    window.scrollTo(0, 0);
  }
  $('tabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-tab]'); if (b) selectTab(b.dataset.tab); });
  $('pv-close').addEventListener('click', function () { $('pv').hidden = true; });

  /* ================= الدخول ================= */
  function show(v) { $('v-login').hidden = v !== 'login'; $('v-app').hidden = v !== 'app'; $('logout').hidden = v !== 'app'; window.scrollTo(0, 0); }
  function guessRepo() {
    var h = location.hostname;
    if (/\.github\.io$/.test(h)) { var owner = h.split('.')[0], seg = location.pathname.split('/')[1]; return owner + '/' + ((seg && !/\.html?$/.test(seg)) ? seg : owner + '.github.io'); }
    return '';
  }
  async function connect(repo, token) {
    S.repo = repo; S.token = token;
    var info = await gh('/repos/' + repo);
    if (info.permissions && info.permissions.push === false) throw new Error('هذا الرمز لا يملك صلاحية الكتابة على المستودع.');
    S.branch = info.default_branch;
    var d = await loadAll(); S.content = d.content; S.posts = d.posts;
    show('app'); selectTab('home');
  }
  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var repo = $('l-repo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, ''), token = $('l-token').value.trim();
    busy($('l-go'), 'جارٍ الاتصال...', async function () {
      await connect(repo, token);
      try { if ($('l-save').checked) localStorage.setItem('tbk_admin', JSON.stringify({ repo: repo, token: token })); else localStorage.removeItem('tbk_admin'); } catch (x) { }
    }, $('l-msg'));
  });
  $('logout').addEventListener('click', function () {
    try { localStorage.removeItem('tbk_admin'); } catch (x) { }
    S.token = ''; $('l-token').value = ''; show('login');
  });
  $('l-repo').value = guessRepo();
  var saved = null; try { saved = JSON.parse(localStorage.getItem('tbk_admin') || 'null'); } catch (x) { }
  if (saved && saved.repo && saved.token) {
    $('l-repo').value = saved.repo; $('l-token').value = saved.token;
    connect(saved.repo, saved.token).catch(function (e) { msg($('l-msg'), e.message, 'err'); });
  }
})();
