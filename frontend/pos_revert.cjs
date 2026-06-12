const fs = require('fs');
const path = require('path');

const map = {
    'emerald-600': 'consist-orange',
    'emerald-700': 'consist-orange',
    'emerald-500': 'consist-orange',
    'teal-600': 'consist-orange',
    'teal-700': 'consist-orange',
    'emerald-50': 'orange-50',
    'from-emerald-600': 'from-consist-orange',
    'to-teal-600': 'to-orange-500'
};

const files = [
    'src/components/POS/BarcodeScannerModal.jsx',
    'src/components/POS/PaymentModal.jsx',
    'src/components/POS/ProductCard.jsx',
    'src/components/POS/ReceiptModal.jsx',
    'src/pages/POS.jsx'
];

for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if(fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;
        
        // Custom replacement to ensure gradient works
        content = content.replace(/from-emerald-600 to-teal-600/g, 'from-consist-orange to-[#f09a56]');

        for (const [key, value] of Object.entries(map)) {
            const regex = new RegExp(key + '\\b', 'g');
            if (regex.test(content)) {
                content = content.replace(regex, value);
                modified = true;
            }
        }
        if (modified) {
            fs.writeFileSync(fullPath, content);
            console.log('Modified: ' + fullPath);
        }
    }
}
