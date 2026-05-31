import fs from 'fs';
import path from 'path';

async function getWikipediaImage(title, filename) {
  try {
    const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800`);
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId].thumbnail.source;
    
    console.log(`Downloading ${imageUrl}...`);
    const imgResponse = await fetch(imageUrl);
    const arrayBuffer = await imgResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(path.join(process.cwd(), 'public', filename), buffer);
    console.log(`Successfully downloaded ${filename} (${buffer.length} bytes)`);
  } catch (error) {
    console.error(`Failed to download ${filename}:`, error);
  }
}

async function main() {
  await getWikipediaImage('Jeff Bezos', 'bezos.jpg');
  await getWikipediaImage('Jensen Huang', 'jensen.jpg');
  await getWikipediaImage('Mark Zuckerberg', 'zuck.jpg');
}

main();
