const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * @param {string} kullaniciId 
 * @returns {Promise<string|null>} 
 */
async function profilResmiCek(kullaniciId) {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto(`https://discord.com/users/${kullaniciId}`, { 
      waitUntil: 'networkidle2' 
    });
    
    await page.waitForTimeout(2000);
    
    const screenshotPath = path.join(tempDir, `${kullaniciId}_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath });
    
    await browser.close();
    
    return screenshotPath;
  } catch (error) {
    console.error('Ekran görüntüsü alınırken hata:', error);
    return null;
  }
}