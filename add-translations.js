const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'assets', 'i18n', 'en.json');
const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Add SERVICE and SELECT_SERVICE
json.REGISTER_CRAFTSMAN.SERVICE = "Service";
json.REGISTER_CRAFTSMAN.SELECT_SERVICE = "Select a service";

// Add SERVICE_REQUIRED to VALIDATION
json.REGISTER_CRAFTSMAN.VALIDATION.SERVICE_REQUIRED = "Please select a service";

fs.writeFileSync(filePath, JSON.stringify(json, null, 4), 'utf8');
console.log('Translation keys added successfully');
