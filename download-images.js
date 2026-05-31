import fs from 'fs';
import path from 'path';
import https from 'https';

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

images.forEach(img => {
  const file = fs.createWriteStream(path.join(publicDir, img.filename));
  https.get(img.url, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${img.filename}`);
    });
  }).on('error', err => {
    fs.unlink(path.join(publicDir, img.filename), () => {});
    console.error(`Error downloading ${img.filename}: ${err.message}`);
  });
});
