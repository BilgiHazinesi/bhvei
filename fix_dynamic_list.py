with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

# Replace stripRating to correctly get only the book name, stripping everything up to the first dash or ignoring standard emojis
# Previous implementation assumed only the star character. Now it might have circles and tags.
new_strip_rating = """
function stripRating(val) {
    if(!val) return "";
    let clean = val.trim();
    if(clean.includes(" - ")) {
        // Find the last occurrence of ' - ' and return what follows it, because the book name might have a dash
        // Actually, we prepend things like "🔴 📗 ⭐ 4,5 - Kitap Adı", so we just need everything after the first " - "
        let parts = clean.split(" - ");
        if(parts.length > 1) {
            return parts.slice(1).join(" - ").trim();
        }
    }
    return clean;
}
"""
import re
content = re.sub(r'function stripRating\(bookName\) \{.*?\n    return clean;\n\}', new_strip_rating.strip(), content, flags=re.DOTALL)

# Add updateDynamicBookList function, and update populateDatalists to use it initially
new_populate = """
function populateDatalists() {
    let sl = document.getElementById('studentList'); sl.innerHTML = '';
    let sLogin = document.getElementById('studentListLogin'); if(sLogin) sLogin.innerHTML = '';
    students.sort().forEach(s => { sl.innerHTML += `<option value="${s}">`; if(sLogin) sLogin.innerHTML += `<option value="${s}">`; });
    updateDynamicBookList();
}

function updateDynamicBookList() {
    let bl = document.getElementById('bookList');
    if(!bl) return;
    bl.innerHTML = '';

    // Get currently typed student
    let studentInput = document.getElementById('studentInput');
    let sVal = studentInput ? studentInput.value.trim().toLocaleUpperCase('tr-TR') : "";

    // Determine which books the student has read or is reading
    let studentBooksMap = {};
    records.forEach(r => {
        if(r.student === sVal) {
            studentBooksMap[normalizeStr(r.book)] = true;
        }
    });

    let bookInfoList = books.map(b => {
        let key = normalizeStr(b);
        let isRead = studentBooksMap[key] ? true : false;

        // Rafta / Dışarıda
        let isOut = activeBooksMap[key] && activeBooksMap[key].length > 0;

        let stats = bookStatsMap[key];
        let rawAvg = (stats && stats.ratingCount > 0) ? (stats.totalRating / stats.ratingCount) : 0;

        return {
            name: b,
            isRead: isRead,
            isOut: isOut,
            rawAvg: rawAvg,
            avgStr: formatRating(rawAvg)
        };
    });

    // Sırlama Kriterleri:
    // 1. Okunmamış olanlar (Kırmızı) ÖNCE
    // 2. Kendi içinde Puana göre yüksekten düşüğe (desc)
    // 3. Puanı aynıysa, Rafta olanlar (Yeşil kitap simgesi) ÖNCE
    bookInfoList.sort((a, b) => {
        if (a.isRead !== b.isRead) {
            return a.isRead ? 1 : -1; // Unread (-1) comes before Read (1)
        }
        if (b.rawAvg !== a.rawAvg) {
            return b.rawAvg - a.rawAvg;
        }
        if (a.isOut !== b.isOut) {
            return a.isOut ? 1 : -1; // Shelf (-1) comes before Out (1)
        }
        return a.name.localeCompare(b.name, 'tr');
    });

    bookInfoList.forEach(item => {
        let readIcon = item.isRead ? "🟢" : "🔴";
        let statusIcon = item.isOut ? "🚫" : "📗";
        let ratingStr = item.avgStr != 0 ? `⭐${item.avgStr}` : "⭐0";

        // Örn: "🔴 📗 ⭐4,5 - Küçük Prens"
        let displayStr = `${readIcon} ${statusIcon} ${ratingStr} - ${item.name}`;
        bl.innerHTML += `<option value="${displayStr}"></option>`;
    });
}
"""

content = re.sub(r'function populateDatalists\(\) \{.*?\n\}', new_populate.strip(), content, flags=re.DOTALL)

with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(content)
