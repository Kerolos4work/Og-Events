const fs = require('fs');
const path = require('path');

// Read the content of the fixed file
const fixedFilePath = path.join(__dirname, 'orderIdsManager-fixed.ts');
const fixedContent = fs.readFileSync(fixedFilePath, 'utf8');

// Write the content to the original file
const originalFilePath = path.join(__dirname, 'orderIdsManager.ts');
fs.writeFileSync(originalFilePath, fixedContent);

console.log('Successfully updated orderIdsManager.ts');
