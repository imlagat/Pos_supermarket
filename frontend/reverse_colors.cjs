const fs = require('fs');
const path = require('path');

const map = {
    'emerald-50': 'orange-50',
    'teal-50': 'orange-50',
    'emerald-100': 'orange-100',
    'teal-100': 'orange-100',
    'emerald-200': 'orange-200',
    'teal-200': 'orange-200',
    'emerald-300': 'orange-300',
    'teal-300': 'orange-300',
    'emerald-400': 'orange-400',
    'teal-400': 'orange-400',
    'emerald-500': 'orange-500', 
    'teal-500': 'orange-500', 
    'emerald-600': 'orange-600',
    'teal-600': 'orange-600',
    'emerald-700': 'orange-700',
    'teal-700': 'orange-700',
    'emerald-800': 'orange-800',
    'teal-800': 'orange-800',
    'emerald-900': 'orange-900',
    'teal-900': 'orange-900',
    'emerald-950': 'orange-950',
    'teal-950': 'orange-950',
    
    // Reverse my recent consist- CSS changes
    'consist-orange': 'orange-500',
    'consist-green': 'orange-500',
    'consist-steel': 'gray-800',
    'consist-water': 'gray-200',
    'consist-marine': 'gray-500',
    'consist-brilliance': 'white',
};

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
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
