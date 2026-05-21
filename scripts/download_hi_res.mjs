import fs from 'fs';
import path from 'path';
import https from 'https';

const CONFIG = {
  providerUrl: 'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
  outputDir: './public/assets/tiles/carto',

  // TIGHT BOUNDS (just the exhibition venue)
  bounds: {
    north: 51.8995,
    south: 51.8955,
    west: 5.77,
    east: 5.776,
  },

  minZoom: 20,
  maxZoom: 22,
  delayMs: 30, // Faster download
};

function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}
function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
      Math.pow(2, zoom),
  );
}

async function downloadTile(url, destPath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode} - ${url}`));
          return;
        }
        const file = fs.createWriteStream(destPath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('🗺️  Starting HI-RES Map Tile Downloader...');

  let totalDownloaded = 0,
    totalSkipped = 0,
    totalErrors = 0;

  for (let z = CONFIG.minZoom; z <= CONFIG.maxZoom; z++) {
    const xMin = lon2tile(CONFIG.bounds.west, z);
    const xMax = lon2tile(CONFIG.bounds.east, z);
    const yMin = lat2tile(CONFIG.bounds.north, z);
    const yMax = lat2tile(CONFIG.bounds.south, z);

    console.log(
      `\nZoom ${z}: X [${xMin} to ${xMax}] Y [${yMin} to ${yMax}] (${(xMax - xMin + 1) * (yMax - yMin + 1)} tiles)`,
    );

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        let url = CONFIG.providerUrl.replace('{z}', z).replace('{x}', x).replace('{y}', y);
        const tileDir = path.join(CONFIG.outputDir, z.toString(), x.toString());
        const filePath = path.join(tileDir, `${y}.png`);

        if (!fs.existsSync(tileDir)) fs.mkdirSync(tileDir, { recursive: true });

        if (fs.existsSync(filePath)) {
          totalSkipped++;
          continue;
        }

        try {
          await downloadTile(url, filePath);
          totalDownloaded++;
          await sleep(CONFIG.delayMs);
        } catch (err) {
          totalErrors++;
        }
      }
    }
  }
  console.log(`\n✅ HI-RES DONE! Downloaded: ${totalDownloaded}, Skipped: ${totalSkipped}`);
}

run();
