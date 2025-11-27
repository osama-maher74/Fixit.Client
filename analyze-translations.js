const fs = require('fs');
const path = require('path');

// Load translation files
const publicEnPath = './public/assets/i18n/en.json';
const publicArPath = './public/assets/i18n/ar.json';
const srcEnPath = './src/assets/i18n/en.json';
const srcArPath = './src/assets/i18n/ar.json';

const publicEn = JSON.parse(fs.readFileSync(publicEnPath, 'utf-8'));
const publicAr = JSON.parse(fs.readFileSync(publicArPath, 'utf-8'));
const srcEn = JSON.parse(fs.readFileSync(srcEnPath, 'utf-8'));
const srcAr = JSON.parse(fs.readFileSync(srcArPath, 'utf-8'));

// Function to get all keys recursively
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Get all keys from each file
const publicEnKeys = getAllKeys(publicEn);
const publicArKeys = getAllKeys(publicAr);
const srcEnKeys = getAllKeys(srcEn);
const srcArKeys = getAllKeys(srcAr);

console.log('\n========== TRANSLATION ANALYSIS ==========\n');
console.log(`Public EN keys: ${publicEnKeys.length}`);
console.log(`Public AR keys: ${publicArKeys.length}`);
console.log(`Src EN keys: ${srcEnKeys.length}`);
console.log(`Src AR keys: ${srcArKeys.length}`);

// Find missing keys in public AR compared to public EN
console.log('\n--- Missing in Public AR (compared to Public EN) ---');
const missingPublicAr = publicEnKeys.filter(key => !publicArKeys.includes(key));
if (missingPublicAr.length > 0) {
  missingPublicAr.forEach(key => console.log(`  - ${key}`));
} else {
  console.log('  ✓ No missing keys');
}

// Find missing keys in public EN compared to public AR
console.log('\n--- Missing in Public EN (compared to Public AR) ---');
const missingPublicEn = publicArKeys.filter(key => !publicEnKeys.includes(key));
if (missingPublicEn.length > 0) {
  missingPublicEn.forEach(key => console.log(`  - ${key}`));
} else {
  console.log('  ✓ No missing keys');
}

// Find missing keys in src AR compared to src EN
console.log('\n--- Missing in Src AR (compared to Src EN) ---');
const missingSrcAr = srcEnKeys.filter(key => !srcArKeys.includes(key));
if (missingSrcAr.length > 0) {
  missingSrcAr.forEach(key => console.log(`  - ${key}`));
} else {
  console.log('  ✓ No missing keys');
}

// Find missing keys in src EN compared to src AR
console.log('\n--- Missing in Src EN (compared to Src AR) ---');
const missingSrcEn = srcArKeys.filter(key => !srcEnKeys.includes(key));
if (missingSrcEn.length > 0) {
  missingSrcEn.forEach(key => console.log(`  - ${key}`));
} else {
  console.log('  ✓ No missing keys');
}

// Check which keys are in public but not in src
console.log('\n--- Keys in Public EN but NOT in Src EN ---');
const publicOnlyKeys = publicEnKeys.filter(key => !srcEnKeys.includes(key));
if (publicOnlyKeys.length > 0) {
  publicOnlyKeys.forEach(key => console.log(`  - ${key}`));
} else {
  console.log('  ✓ No public-only keys');
}

// Check which keys are in src but not in public
console.log('\n--- Keys in Src EN but NOT in Public EN ---');
const srcOnlyKeys = srcEnKeys.filter(key => !publicEnKeys.includes(key));
if (srcOnlyKeys.length > 0) {
  srcOnlyKeys.forEach(key => console.log(`  - ${key}`));
} else {
  console.log('  ✓ No src-only keys');
}

console.log('\n========== SUMMARY ==========');
console.log(`Total unique keys across all files: ${new Set([...publicEnKeys, ...srcEnKeys]).size}`);
console.log(`Issues found: ${missingPublicAr.length + missingPublicEn.length + missingSrcAr.length + missingSrcEn.length}`);
console.log('=====================================\n');
