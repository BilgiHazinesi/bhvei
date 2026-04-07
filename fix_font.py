import re

with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

# 1. Update title text directly to KİTAP KURDU BELGESİ
content = content.replace('<div class="title">Kitap Kurdu Belgesi</div>', '<div class="title">KİTAP KURDU BELGESİ</div>')
content = content.replace('<title>Kitap Kurdu Belgesi</title>', '<title>KİTAP KURDU BELGESİ</title>')

# 2. Update CSS for .title: remove text-transform, change font
old_css = """.title {
                font-size: 4rem; font-weight: 900; color: #1e3a8a;
                text-transform: uppercase; letter-spacing: 2px;
                margin-top: -20px;
                text-shadow: 2px 2px 0px #fff, 4px 4px 0px rgba(0,0,0,0.1);
            }"""

new_css = """.title {
                font-family: 'Arial Black', Impact, sans-serif;
                font-size: 4rem; font-weight: 900; color: #1e3a8a;
                letter-spacing: 2px;
                margin-top: -20px;
                text-shadow: 2px 2px 0px #fff, 4px 4px 0px rgba(0,0,0,0.1);
            }"""

content = content.replace(old_css, new_css)

with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(content)
