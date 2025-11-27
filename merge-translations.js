const fs = require('fs');
const path = require('path');

console.log('Starting translation merge...\n');

// Load all translation files
const publicEnPath = './public/assets/i18n/en.json';
const publicArPath = './public/assets/i18n/ar.json';
const srcEnPath = './src/assets/i18n/en.json';
const srcArPath = './src/assets/i18n/ar.json';

const publicEn = JSON.parse(fs.readFileSync(publicEnPath, 'utf-8'));
const publicAr = JSON.parse(fs.readFileSync(publicArPath, 'utf-8'));
const srcEn = JSON.parse(fs.readFileSync(srcEnPath, 'utf-8'));
const srcAr = JSON.parse(fs.readFileSync(srcArPath, 'utf-8'));

// Merge function - deep merge objects
function deepMerge(target, source) {
    const output = { ...target };

    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])) {
                output[key] = deepMerge(output[key], source[key]);
            } else {
                output[key] = source[key];
            }
        } else {
            output[key] = source[key];
        }
    }

    return output;
}

// Merge src into public
const mergedEn = deepMerge(publicEn, srcEn);
const mergedAr = deepMerge(publicAr, srcAr);

// Write merged files to public directory
fs.writeFileSync(publicEnPath, JSON.stringify(mergedEn, null, 2), 'utf-8');
fs.writeFileSync(publicArPath, JSON.stringify(mergedAr, null, 2), 'utf-8');

console.log('✓ Merged English translations into public/assets/i18n/en.json');
console.log('✓ Merged Arabic translations into public/assets/i18n/ar.json');

// Count keys
function countKeys(obj, prefix = '') {
    let count = 0;
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            count += countKeys(obj[key], prefix ? `${prefix}.${key}` : key);
        } else {
            count++;
        }
    }
    return count;
}

console.log(`\nTotal keys in merged EN: ${countKeys(mergedEn)}`);
console.log(`Total keys in merged AR: ${countKeys(mergedAr)}`);
console.log('\nMerge complete!');
