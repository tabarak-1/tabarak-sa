// يعيد توليد صفحات الموقع من data/content.json و data/posts.json (اختياري: لوحة الإدارة تفعل هذا تلقائياً)
// الاستخدام:  node tools/build.js
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const { render } = require(path.join(root, 'assets', 'site-core.js'));
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const files = render(read('data/content.json'), read('data/posts.json'));
for (const f of files) {
  const p = path.join(root, f.path);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, f.content);
}
console.log('تم توليد', files.filter((f) => f.path.endsWith('.html')).length, 'صفحة');
