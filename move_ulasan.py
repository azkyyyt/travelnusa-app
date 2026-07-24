with open('frontend/customer.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = '<!-- SECTION ULASAN -->'
end_str = '</div>\n            </div>\n        </div>\n\n        <!-- Halaman Pembayaran -->'

idx1 = content.find(start_str)
idx2 = content.find(end_str)

if idx1 != -1 and idx2 != -1:
    ulasan_block = content[idx1:idx2]
    content = content[:idx1] + content[idx2:]
    
    target_str = '<button class="btn btn-primary" onclick="window.print()"'
    idx3 = content.find(target_str)
    
    if idx3 != -1:
        content = content[:idx3] + ulasan_block + '\n                ' + content[idx3:]
        with open('frontend/customer.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print('SUCCESS')
    else:
        print('Target not found')
else:
    print('Block not found')
