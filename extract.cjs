const fs = require('fs');
try {
  let html = fs.readFileSync('login_preview.html', 'utf-8');
  html = html.replace(/url\([^)]+\)/g, 'url(BASE64_IMAGE_PLACEHOLDER)');
  fs.writeFileSync('clean_html.txt', html);
  console.log("Success");
} catch (e) {
  console.error(e);
}
