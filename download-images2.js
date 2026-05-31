import fs from 'fs';
import path from 'path';

const images = [
  {
    url: 'https://media.wired.com/photos/593252a1bef1fc5e58971275/master/w_800%2Cc_limit/amazon-1999.jpg',
    filename: 'bezos.jpg'
  },
  {
    url: 'https://cdn.arstechnica.net/wp-content/uploads/2024/03/GettyImages-2094138132-1.jpg',
    filename: 'jensen.jpg'
  },
  {
    url: 'https://techcrunch.com/wp-content/uploads/2012/02/mark_zuckerberg_2004.jpg',
    filename: 'zuck.jpg'
  }
];

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

async function downloadImages() {
  for (const img of images) {
    try {
      console.log(`Downloading ${img.url}...`);
      const response = await fetch(img.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.google.com/'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      fs.writeFileSync(path.join(publicDir, img.filename), buffer);
      console.log(`Successfully downloaded ${img.filename} (${buffer.length} bytes)`);
    } catch (error) {
      console.error(`Failed to download ${img.filename}:`, error);
    }
  }
}

downloadImages();
