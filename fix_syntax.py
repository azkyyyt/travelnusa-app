import os
import re

for f in ['frontend/app.js', 'frontend/customer-app.js']:
    if not os.path.exists(f): continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Fix the mismatched quote!
    # Example: `${API_BASE}/paket" -> `${API_BASE}/paket`
    content = re.sub(r'(`\$\{API_BASE\}[^"\'`]*?)["\']', r'\1`', content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
