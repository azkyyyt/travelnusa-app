import os

for f in ['frontend/app.js', 'frontend/customer-app.js']:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        content = content.replace('"http://localhost:8000/', '`${API_BASE}/')
        content = content.replace('"http://localhost:8000', '`${API_BASE}')
        content = content.replace('http://localhost:8000/', '${API_BASE}/')
        content = content.replace('http://localhost:8000', '${API_BASE}')
        # Also fix any missing closing backticks in case they were left out by mistake
        # Actually it's better to just regex replace
        import re
        content = re.sub(r'"`\$\{API_BASE\}', r'`${API_BASE}', content)
        content = re.sub(r'\$\{API_BASE\}(.*?)""', r'${API_BASE}\1`"', content) 
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
