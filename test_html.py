with open('kutuphane/kutuphane.html', 'r') as f:
    c = f.read()
if "Öğrenci Masası" in c:
    print("HTML updated successfully")
else:
    print("Failed to update HTML")
