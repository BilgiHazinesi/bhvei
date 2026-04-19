import re

with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

whatsapp_func = """function sendOverdueWhatsApp(student, book) {
    let teacherNameStr = settings.teacherName || "Zeynal Öğretmen";
    let text = `Sayın Velim,\n\nÖğrencimiz *${student}*, kütüphanemizden almış olduğu *"${book}"* adlı kitabı belirtilen süre içerisinde henüz teslim etmemiştir.\n\nKitabın okunup en kısa sürede kütüphaneye iade edilmesi konusunda desteğinizi rica ederim.\n\nİyi günler dilerim.\n${teacherNameStr}`;
    navigator.clipboard.writeText(text);
    let url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, '_blank');
}
"""

content = content.replace("function populateDatalists() {", whatsapp_func + "\nfunction populateDatalists() {")


# Now find the place where we set dateIndicator = "🔴 " and add a whatsapp button.
old_history_logic = """                    if (diffDays <= 4) {
                        dateColor = "#10b981";
                        dateIndicator = "🟢 ";
                    } else if (diffDays <= 7) {
                        dateColor = "#f59e0b";
                        dateIndicator = "🟠 ";
                    } else {
                        dateColor = "#ef4444";
                        dateIndicator = "🔴 ";
                    }

                    dateDisplay = `<span style="color:${dateColor}; font-weight:bold;">${dateIndicator}<i class="far fa-calendar-alt" style="margin-right:4px;"></i>${r.date}</span>`;"""

new_history_logic = """                    let waBtn = "";
                    if (diffDays <= 4) {
                        dateColor = "#10b981";
                        dateIndicator = "🟢 ";
                    } else if (diffDays <= 7) {
                        dateColor = "#f59e0b";
                        dateIndicator = "🟠 ";
                    } else {
                        dateColor = "#ef4444";
                        dateIndicator = "🔴 ";
                        // Add WhatsApp reminder button
                        waBtn = `<button class="btn" style="background: none; border: none; color: #25d366; cursor: pointer; padding: 0 5px;" onclick="sendOverdueWhatsApp('${r.student.replace(/'/g, "\\'")}', '${r.book.replace(/'/g, "\\'")}')" title="Veliye WhatsApp'tan Hatırlat"><i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i></button>`;
                    }

                    dateDisplay = `<div style="display:flex; align-items:center;"><span style="color:${dateColor}; font-weight:bold;">${dateIndicator}<i class="far fa-calendar-alt" style="margin-right:4px;"></i>${r.date}</span> ${waBtn}</div>`;"""

content = content.replace(old_history_logic, new_history_logic)

with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(content)
