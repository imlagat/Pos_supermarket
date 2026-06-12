import os
import glob

pages_dir = 'frontend/src/pages'
for filepath in glob.glob(os.path.join(pages_dir, '*.jsx')):
    with open(filepath, 'r') as f:
        content = f.read()

    if '<PageLoader' in content and 'import PageLoader' not in content:
        # Just prepend it after the first import
        first_import = content.find('import')
        if first_import != -1:
            end_of_line = content.find('\n', first_import)
            new_content = content[:end_of_line+1] + "import PageLoader from '../components/common/PageLoader';\n" + content[end_of_line+1:]
        else:
            new_content = "import PageLoader from '../components/common/PageLoader';\n" + content
            
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")
