with open('kutuphane/kutuphane.css', 'r') as f:
    c = f.read()

c += "\n.desk-return-chk { width: 18px; height: 18px; margin: 0; }"

with open('kutuphane/kutuphane.css', 'w') as f:
    f.write(c)
