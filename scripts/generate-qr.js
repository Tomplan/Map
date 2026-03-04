import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function generateQR() {
  try {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    let url = pkg.homepage;

    if (!url) {
      console.error('Error: "homepage" field not found in package.json');
      process.exit(1);
    }

    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    console.log(`Generating QR codes for: ${url}`);

    const outDir = path.join(rootDir, 'public', 'assets');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    await QRCode.toFile(path.join(outDir, 'app-qr.png'), url, {
      width: 2048,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    await QRCode.toFile(path.join(outDir, 'app-qr.svg'), url, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    console.log('✓ Generated public/assets/app-qr.png');
    console.log('✓ Generated public/assets/app-qr.svg');
  } catch (err) {
    console.error('Failed to generate QR codes:', err);
    process.exit(1);
  }
}

generateQR();
