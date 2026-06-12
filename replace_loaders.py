import os
import glob
import re

pages_dir = 'frontend/src/pages'
for filepath in glob.glob(os.path.join(pages_dir, '*.jsx')):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to find: if (loading) return <div...>Loading...</div>;
    # or similar
    pattern = re.compile(r'if\s*\(\s*loading\s*\)\s*return\s*<div[^>]*>([^<]*(?:Loading|loading)[^<]*)</div>;')
    
    match = pattern.search(content)
    if match:
        loading_msg = match.group(1).strip()
        new_content = pattern.sub(f'if (loading) return <PageLoader message="{loading_msg}" />;', content)
        
        # Add import if not exists
        if 'PageLoader' not in new_content:
            # Find the last import statement
            last_import = new_content.rfind('import')
            if last_import != -1:
                end_of_line = new_content.find('\n', last_import)
                new_content = new_content[:end_of_line+1] + "import PageLoader from '../components/common/PageLoader';\n" + new_content[end_of_line+1:]
            else:
                new_content = "import PageLoader from '../components/common/PageLoader';\n" + new_content
                
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        # Check for slightly different pattern like <div className="text-center py-12 text-gray-500">Loading purchase orders...</div>
        # Actually some are just `return <div>Loading...</div>;`
        pass
