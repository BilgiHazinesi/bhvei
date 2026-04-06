with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

start_idx = content.find("function printCertificate() {")
end_idx = content.find("function resetAllData() {")

old_func = content[start_idx:end_idx]

new_func = """function printCertificate() {
    const s = document.getElementById('reportStudentInput').value.trim().toLocaleUpperCase('tr-TR');
    if(!s) return alert("Lütfen önce bir öğrenci seçin.");
    let myRecs = records.filter(r => r.student === s && r.status === "İade Etti");
    let totalP = 0;
    myRecs.forEach(r => totalP += (parseInt(bookPages[r.book])||0));
    let html = `
    <html>
    <head>
        <meta charset="utf-8">
        <title>Kitap Kurdu Belgesi</title>
        <style>
            @page { size: A4 landscape; margin: 0; }
            body {
                margin: 0; padding: 0;
                display: flex; justify-content: center; align-items: center;
                height: 100vh; background: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                -webkit-print-color-adjust: exact; color-adjust: exact;
            }
            .cert-container {
                width: 297mm; height: 210mm;
                position: relative; overflow: hidden;
            }
            .bg-svg {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;
            }
            .content {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                text-align: center;
            }
            .title {
                font-size: 4rem; font-weight: 900; color: #1e3a8a;
                text-transform: uppercase; letter-spacing: 2px;
                margin-top: -20px;
                text-shadow: 2px 2px 0px #fff, 4px 4px 0px rgba(0,0,0,0.1);
            }
            .subtitle {
                font-size: 1.5rem; color: #475569; margin: 10px 0 40px 0; font-style: italic;
            }
            .student-name {
                font-size: 4.5rem; font-weight: bold; color: #ea580c;
                border-bottom: 4px solid #ea580c; padding: 0 40px 10px 40px; margin-bottom: 30px;
                font-family: 'Georgia', serif;
            }
            .desc {
                font-size: 1.5rem; color: #1e293b; max-width: 80%; line-height: 1.5; margin-bottom: 40px;
            }
            .stats-row {
                display: flex; gap: 50px; margin-bottom: 40px;
            }
            .stat-box {
                background: rgba(255, 255, 255, 0.9); border: 3px solid #3b82f6; border-radius: 20px;
                padding: 15px 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .stat-val { font-size: 2.5rem; font-weight: 800; color: #2563eb; }
            .stat-lbl { font-size: 1.1rem; color: #64748b; font-weight: bold; text-transform: uppercase;}
            .signature {
                position: absolute; bottom: 50px; right: 80px; text-align: center;
            }
            .sig-line { width: 250px; border-bottom: 2px solid #0f172a; margin-bottom: 10px; }
            .sig-name { font-size: 1.5rem; font-weight: bold; color: #0f172a; font-family: 'Georgia', serif; font-style: italic;}
            .date-stamp { position: absolute; bottom: 50px; left: 80px; font-size: 1.2rem; color: #64748b; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="cert-container">
            <svg class="bg-svg" viewBox="0 0 1122 793" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fdfbfb" />
                        <stop offset="100%" stop-color="#ebedee" />
                    </linearGradient>
                    <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.5" fill="#cbd5e1" opacity="0.4" />
                    </pattern>
                </defs>
                <rect width="1122" height="793" fill="url(#bgGrad)"/>
                <rect width="1122" height="793" fill="url(#dotPattern)"/>
                <!-- Outer Border -->
                <rect x="40" y="40" width="1042" height="713" rx="20" fill="none" stroke="#3b82f6" stroke-width="15" opacity="0.2"/>
                <rect x="50" y="50" width="1022" height="693" rx="15" fill="none" stroke="#f59e0b" stroke-width="4"/>

                <!-- Corner Accents -->
                <path d="M 40 100 L 40 40 L 100 40" fill="none" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/>
                <path d="M 1082 100 L 1082 40 L 1022 40" fill="none" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/>
                <path d="M 40 693 L 40 753 L 100 753" fill="none" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/>
                <path d="M 1082 693 L 1082 753 L 1022 753" fill="none" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/>

                <!-- Space Elements -->
                <circle cx="950" cy="150" r="60" fill="#fef08a" opacity="0.8"/>
                <circle cx="950" cy="150" r="80" fill="none" stroke="#fef08a" stroke-width="2" opacity="0.5"/>

                <path d="M 120 600 Q 150 550 200 580 Q 250 610 280 550" fill="none" stroke="#10b981" stroke-width="8" stroke-linecap="round" opacity="0.3"/>

                <!-- Stars -->
                <path d="M 150 150 L 155 165 L 170 165 L 158 175 L 162 190 L 150 180 L 138 190 L 142 175 L 130 165 L 145 165 Z" fill="#f59e0b" opacity="0.6"/>
                <path d="M 850 650 L 855 665 L 870 665 L 858 675 L 862 690 L 850 680 L 838 690 L 842 675 L 830 665 L 845 665 Z" fill="#f59e0b" opacity="0.6"/>
                <path d="M 300 100 L 305 115 L 320 115 L 308 125 L 312 140 L 300 130 L 288 140 L 292 125 L 280 115 L 295 115 Z" fill="#3b82f6" opacity="0.4"/>

                <!-- Rocket -->
                <g transform="translate(80, 200) rotate(45) scale(0.6)" opacity="0.3">
                    <path d="M 50 0 L 100 100 L 80 100 L 80 150 L 20 150 L 20 100 L 0 100 Z" fill="#ef4444"/>
                    <circle cx="50" cy="80" r="15" fill="#fff"/>
                    <path d="M 30 150 L 50 180 L 70 150 Z" fill="#f59e0b"/>
                </g>
            </svg>
            <div class="content">
                <div class="title">Kitap Kurdu Belgesi</div>
                <div class="subtitle">Bu belge, okuma evreninde parlayan yıldızımıza takdim edilmiştir.</div>

                <div class="student-name">${s}</div>

                <div class="desc">
                    Kitapların sonsuz galaksisinde gösterdiği üstün başarıdan,
                    kelimelerle kurduğu eşsiz bağdan ve hayal gücünün sınırlarını aşan
                    okuma azminden dolayı seni içtenlikle kutlarım.
                </div>

                <div class="stats-row">
                    <div class="stat-box">
                        <div class="stat-val">${myRecs.length}</div>
                        <div class="stat-lbl">Okunan Kitap</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-val">${totalP.toLocaleString()}</div>
                        <div class="stat-lbl">Aşılan Sayfa</div>
                    </div>
                </div>

                <div class="date-stamp">${new Date().toLocaleDateString('tr-TR')}</div>
                <div class="signature">
                    <div class="sig-line"></div>
                    <div class="sig-name">Zeynal Öğretmen</div>
                </div>
            </div>
        </div>
        <script>
            setTimeout(() => { window.print(); }, 500);
        </script>
    </body>
    </html>
    `;
    let win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

"""
content = content[:start_idx] + new_func + content[end_idx:]

with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(content)
