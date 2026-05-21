import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * =========================================================
 * TILE DOWNLOADER CONFIGURATION
 * Easily change provider, coordinates, and zooms here.
 * =========================================================
 */
const CONFIG = {
  // 1. CHOOSE YOUR MAP PROVIDER
  // Carto Voyager:
  providerUrl: 'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
  outputDir: './public/assets/tiles/carto',

  // Esri World Imagery (Uncomment to use Esri instead):
  // providerUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  // outputDir: './public/assets/tiles/esri',

  // 2. SET YOUR EVENT BOUNDING BOX (GPS Coordinates)
  // Get these by right-clicking on Google Maps at the top-left and bottom-right of your venue
  bounds: {
    north: 51.905, // Top edge (Latitude)
    south: 51.89, // Bottom edge (Latitude)
    west: 5.76, // Left edge (Longitude)
    east: 5.79, // Right edge (Longitude)
  },

  // 3. SET ZOOM LEVELS
  minZoom: 14,
  maxZoom: 19,

  // 4. POLITE DOWNLOADING (Don't change unless necessary)
  // Delay in milliseconds between downloads to avoid IP bans during scraping
  delayMs: 150,
};

/**
 * =========================================================
 * CORE LOGIC (Math to convert GPS to Map Tiles)
 * =========================================================
 */

// Convert Longitude to Tile X
function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

// Convert Latitude to Tile Y
function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
      Math.pow(2, zoom),
  );
}

// Download a single file
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

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * =========================================================
 * RUNNER
 * =========================================================
 */
async function run() {
  console.log('🗺️  Starting Map Tile Downloader...');
  console.log(`Provider: ${CONFIG.providerUrl}`);
  console.log(`Saving to: ${CONFIG.outputDir}`);

  let totalDownloaded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let z = CONFIG.minZoom; z <= CONFIG.maxZoom; z++) {
    const xMin = lon2tile(CONFIG.bounds.west, z);
    const xMax = lon2tile(CONFIG.bounds.east, z);
    // Y coordinates increase as you go SOUTH, so north is yMin and south is yMax
    const yMin = lat2tile(CONFIG.bounds.north, z);
    const yMax = lat2tile(CONFIG.bounds.south, z);

    console.log(`\nZoom ${z}: X [${xMin} to ${xMax}] Y [${yMin} to ${yMax}]`);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        // Build the URL based on the provider format
        let url = CONFIG.providerUrl.replace('{z}', z).replace('{x}', x).replace('{y}', y);

        // Define local save path
        const tileDir = path.join(CONFIG.outputDir, z.toString(), x.toString());
        const filePath = path.join(tileDir, `${y}.png`);

        // Create folders if they don't exist
        if (!fs.existsSync(tileDir)) {
          fs.mkdirSync(tileDir, { recursive: true });
        }

        // Skip if already downloaded
        if (fs.existsSync(filePath)) {
          process.stdout.write('S'); // S for skip
          totalSkipped++;
          continue;
        }

        // Try downloading
        try {
          await downloadTile(url, filePath);
          process.stdout.write('.'); // Dot for success
          totalDownloaded++;
          await sleep(CONFIG.delayMs); // Be polite to the server
        } catch (err) {
          process.stdout.write('E'); // E for Error
          console.error(`\nError on ${url}: ${err.message}`);
          totalErrors++;
        }
      }
    }
  }

  console.log('\n\n✅ DONE!');
  console.log(`Successfully downloaded: ${totalDownloaded} tiles`);
  console.log(`Already existed (skipped): ${totalSkipped} tiles`);
  console.log(`Errors: ${totalErrors}`);
}

run();
