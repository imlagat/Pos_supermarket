const fs = require('fs');
const path = require('path');

const map = {
    'amber-50': 'emerald-50',
    'orange-50': 'emerald-50',
    'amber-100': 'emerald-100',
    'orange-100': 'emerald-100',
    'amber-200': 'emerald-200',
    'orange-200': 'emerald-200',
    'amber-300': 'emerald-300',
    'orange-300': 'emerald-300',
    'amber-400': 'emerald-400',
    'orange-400': 'emerald-400',
    'amber-500': 'emerald-600',
    'orange-500': 'teal-600',
    'amber-600': 'emerald-700',
    'orange-600': 'teal-700',
    'amber-700': 'emerald-800',
    'orange-700': 'teal-800',
    'amber-800': 'emerald-900',
    'orange-800': 'teal-900',
    'amber-900': 'emerald-950',
    'orange-900': 'teal-950',
};

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
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
}

walk(path.join(__dirname, 'src'));
