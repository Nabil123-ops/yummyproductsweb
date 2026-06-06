const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'raw_products.csv');
const outPath = path.join(__dirname, '..', 'src', 'data', 'initialProducts.ts');

const defaultImages = {
  'Accessories': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop&q=80',
  'Bath Bombs & Soaps': 'https://images.unsplash.com/photo-1607006342440-b709500109a9?w=400&auto=format&fit=crop&q=80',
  'Body Care': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop&q=80',
  'Candles': 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&auto=format&fit=crop&q=80',
  'Face Care': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80',
  'Flash Sale': 'https://images.unsplash.com/photo-1472851294608-062f824d296e?w=400&auto=format&fit=crop&q=80',
  'Gentlemen': 'https://images.unsplash.com/photo-1626015276681-28516e706c17?w=400&auto=format&fit=crop&q=80',
  'Hair Care': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
  'Intimate Care': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&auto=format&fit=crop&q=80',
  'Lips, Eyebrows And Lashes': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&auto=format&fit=crop&q=80',
  'Makhmaria': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&auto=format&fit=crop&q=80',
  'Misk El Tahara': 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=400&auto=format&fit=crop&q=80',
  'Oils, Serums & Essences': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&auto=format&fit=crop&q=80',
  'Younger': 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&auto=format&fit=crop&q=80'
};

const subcategoryShorthands = {
  'Accessories': 'ACC',
  'Bath Bombs & Soaps': 'SOP',
  'Body Care': 'BDY',
  'Candles': 'CDL',
  'Face Care': 'FAC',
  'Flash Sale': 'SAL',
  'Gentlemen': 'GNT',
  'Hair Care': 'HAR',
  'Intimate Care': 'INT',
  'Lips, Eyebrows And Lashes': 'LIP',
  'Makhmaria': 'MAK',
  'Misk El Tahara': 'MSK',
  'Oils, Serums & Essences': 'OIL',
  'Younger': 'YNG'
};

function parseCSV(text) {
  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' || char === '“' || char === '”') {
      if (inQuotes && nextChar === '"') {
        // Double double-quotes inside quotes acts as quote literal
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell.trim());
      if (row.length > 1 || row[0] !== '') {
        lines.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    lines.push(row);
  }
  return lines;
}

function generate() {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);
  
  if (rows.length < 2) {
    console.error("No CSV rows parsed!");
    process.exit(1);
  }

  const header = rows[0].map(h => h.trim().toLowerCase());
  const nameIdx = header.indexOf('product_name');
  const priceBeforeIdx = header.indexOf('price_before');
  const priceAfterIdx = header.indexOf('price_after');
  const catIdx = header.indexOf('category');
  const subcatIdx = header.indexOf('subcategory');
  const descIdx = header.indexOf('description');
  const imgIdx = header.indexOf('image_url');

  const products = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < nameIdx) continue;
    
    const rawName = row[nameIdx];
    if (!rawName) continue;

    const priceBeforeRaw = row[priceBeforeIdx];
    const priceAfterRaw = row[priceAfterIdx];
    const subcat = row[subcatIdx] || 'Accessories';
    const rawDesc = row[descIdx] || '';
    const rawImg = row[imgIdx] || '';

    // Calculate Prices
    const priceAfter = parseFloat(priceAfterRaw) || 0;
    const priceBefore = parseFloat(priceBeforeRaw) || 0;

    let price = priceAfter;
    let salePrice = undefined;

    if (priceBefore > 0 && priceBefore !== priceAfter) {
      price = priceBefore;
      salePrice = priceAfter;
    }

    // Default Images based on subcategory
    const imageUrl = rawImg.trim() || defaultImages[subcat] || defaultImages['Accessories'];

    // Create unique ID, Sku, Barcode
    const idxStr = String(i).padStart(3, '0');
    const shorthand = subcategoryShorthands[subcat] || 'ACC';
    const sku = `${shorthand}-${idxStr}`;
    const barcode = `76477025${idxStr}`;

    // Clean up description line breaks and trailing garbage
    let description = rawDesc
      .replace(/\\n/g, '\n')
      .replace(/\r/g, '')
      .trim();

    // Setup typical rating and review count
    const ratingAverage = parseFloat((4.5 + Math.random() * 0.5).toFixed(1));
    const reviewsCount = Math.floor(Math.random() * 32) + 5;

    const prod = {
      id: `p-${i}`,
      name: rawName,
      sku: sku,
      barcode: barcode,
      price: price,
      salePrice: salePrice,
      description: description,
      category: subcat, // Critical: Map main category to the subcategory so browsing works out of the box!
      subcategory: subcat,
      stockQuantity: Math.floor(Math.random() * 30) + 15,
      imageUrl: imageUrl,
      galleryImages: [imageUrl],
      brand: 'Yummy Products',
      isArchived: false,
      isFeatured: i <= 15 || !!salePrice,
      isNewArrival: i % 5 === 0,
      ratingAverage: ratingAverage,
      reviewsCount: reviewsCount
    };

    products.push(prod);
  }

  // Write file
  const tsContent = `import { Product } from '../types';

export const initialProducts: Product[] = ${JSON.stringify(products, null, 2)};
`;

  fs.writeFileSync(outPath, tsContent, 'utf-8');
  console.log(`Successfully generated ${products.length} products inside initialProducts.ts`);
}

generate();
