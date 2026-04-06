with open('kutuphane/kutuphane.html', 'r') as f:
    content = f.read()

# 1. Books Tab Stats
old_html_books = """            <div id="tab-books" class="section">
                <div class="glass-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h3 style="margin:0; color:var(--primary);">📚 Kütüphane</h3></div>
                    <div class="filter-group">"""

new_html_books = """            <div id="tab-books" class="section">
                <div class="glass-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><h3 style="margin:0; color:var(--primary);">📚 Kütüphane</h3></div>
                    <div id="booksTabStats" style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:12px; margin-bottom:15px; font-size:0.85rem; text-align:center;">
                        <div><div style="font-weight:bold; color:var(--primary); font-size:1.1rem;" id="statTotalBooks">0</div><div style="color:var(--text-sub);">Tümü</div></div>
                        <div><div style="font-weight:bold; color:#10b981; font-size:1.1rem;" id="statShelfBooks">0</div><div style="color:var(--text-sub);">Rafta</div></div>
                        <div><div style="font-weight:bold; color:#ef4444; font-size:1.1rem;" id="statOutBooks">0</div><div style="color:var(--text-sub);">Dışarıda</div></div>
                    </div>
                    <div class="filter-group">"""

if old_html_books in content:
    content = content.replace(old_html_books, new_html_books)

# 2. Report Student Input list attribute
old_html_report = """<div class="input-wrapper"><input type="text" id="reportStudentInput" placeholder="Öğrenci Seçiniz..." oninput="handleInput(this); genReport()"><i class="fas fa-times-circle clear-btn" onclick="clearField('reportStudentInput')"></i></div>"""
new_html_report = """<div class="input-wrapper"><input type="text" list="studentList" id="reportStudentInput" placeholder="Öğrenci Seçiniz..." oninput="handleInput(this); genReport()"><i class="fas fa-times-circle clear-btn" onclick="clearField('reportStudentInput')"></i></div>"""
if old_html_report in content:
    content = content.replace(old_html_report, new_html_report)


with open('kutuphane/kutuphane.html', 'w') as f:
    f.write(content)

print("HTML Changes applied.")
