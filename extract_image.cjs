const fs = require('fs');
try {
  let html = fs.readFileSync('login_preview.html', 'utf-8');
  const match = html.match(/data:image\/[^;]+;base64,([^"'\)]+)/);
  if (match) {
    const base64Data = match[1];
    fs.writeFileSync('client/public/login-bg.jpeg', Buffer.from(base64Data, 'base64'));
    console.log("Image saved successfully.");
  } else {
    console.log("Image not found.");
  }
} catch (e) {
  console.error(e);
}
