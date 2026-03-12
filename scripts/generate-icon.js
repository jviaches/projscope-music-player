const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.on('ready', () => {
  const win = new BrowserWindow({
    width: 256,
    height: 256,
    show: false,
    transparent: true,
    webPreferences: { offscreen: true }
  });

  const html = `
  <html>
  <body style="margin:0;padding:0;background:rgba(0,0,0,0);">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
    <!-- Vinyl record -->
    <circle cx="128" cy="128" r="120" fill="#1a1a1a"/>
    <circle cx="128" cy="128" r="115" fill="#222"/>
    <!-- Grooves -->
    <circle cx="128" cy="128" r="105" fill="none" stroke="#333" stroke-width="0.5"/>
    <circle cx="128" cy="128" r="95" fill="none" stroke="#333" stroke-width="0.5"/>
    <circle cx="128" cy="128" r="85" fill="none" stroke="#333" stroke-width="0.5"/>
    <circle cx="128" cy="128" r="75" fill="none" stroke="#333" stroke-width="0.5"/>
    <circle cx="128" cy="128" r="65" fill="none" stroke="#333" stroke-width="0.5"/>
    <!-- Vinyl shine -->
    <path d="M 128 13 A 115 115 0 0 1 230 80" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="20"/>
    <!-- Label area -->
    <circle cx="128" cy="128" r="50" fill="#e74c3c"/>
    <circle cx="128" cy="128" r="46" fill="#c0392b"/>
    <!-- Center hole -->
    <circle cx="128" cy="128" r="6" fill="#1a1a1a"/>
    <!-- Music note - much larger -->
    <g transform="translate(100, 95)">
      <rect x="8" y="0" width="5" height="52" rx="2" fill="white"/>
      <rect x="33" y="5" width="5" height="47" rx="2" fill="white"/>
      <path d="M 13 0 L 13 5 L 38 10 L 38 5 Z" fill="white"/>
      <ellipse cx="8" cy="52" rx="10" ry="7.5" transform="rotate(-15, 8, 52)" fill="white"/>
      <ellipse cx="33" cy="52" rx="10" ry="7.5" transform="rotate(-15, 33, 52)" fill="white"/>
    </g>
  </svg>
  </body>
  </html>`;

  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  win.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      win.webContents.capturePage().then(image => {
        const pngBuffer = image.toPNG();
        const outputPath = path.join(__dirname, '..', 'src', 'assets', 'icons', 'vinyl.png');
        fs.writeFileSync(outputPath, pngBuffer);
        console.log('Icon saved to ' + outputPath);
        app.quit();
      });
    }, 500);
  });
});
