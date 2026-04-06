import re

with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

# 1. Insert stripRating and update normalizeStr/inputs
strip_func = """function stripRating(bookName) {
    if(!bookName) return "";
    let clean = bookName.trim();
    if(clean.startsWith("⭐")) {
        let parts = clean.split(" - ");
        if(parts.length > 1) {
            return parts.slice(1).join(" - ").trim();
        }
    }
    return clean;
}

function normalizeStr(str)"""
content = content.replace("function normalizeStr(str)", strip_func)
content = content.replace("document.getElementById('bookInput').value.trim()", "stripRating(document.getElementById('bookInput').value)")
content = content.replace("document.getElementById('newBookInput').value.trim()", "stripRating(document.getElementById('newBookInput').value)")


# 2. Update populateDatalists to format the rating inline
old_datalist = "bl.innerHTML += `<option value=\"${b}\">`;"
new_datalist = """            let key = normalizeStr(b);
            let stats = bookStatsMap[key];
            let avgScore = (stats && stats.ratingCount > 0) ? (stats.totalRating / stats.ratingCount).toFixed(1) : 0;
            let ratingStr = avgScore > 0 ? `⭐ ${avgScore} - ` : "";
            bl.innerHTML += `<option value="${ratingStr}${b}"></option>`;"""

pattern_datalist = re.compile(r"books\.sort\(\)\.forEach\(b => \{\s*bl\.innerHTML \+= `<option value=\"\$\{b\}\">`;\s*\}\);")
new_datalist_full = """books.sort().forEach(b => {
            let key = normalizeStr(b);
            let stats = bookStatsMap[key];
            let avgScore = (stats && stats.ratingCount > 0) ? (stats.totalRating / stats.ratingCount).toFixed(1) : 0;
            let ratingStr = avgScore > 0 ? `⭐ ${avgScore} - ` : "";
            bl.innerHTML += `<option value="${ratingStr}${b}"></option>`;
        });"""
content = re.sub(pattern_datalist, new_datalist_full, content)


# 3. Update deleteRecord for confirmation message
old_delete = 'if(confirm("Silmek istiyor musunuz?"))'
new_delete = 'if(confirm("DİKKAT: Bu işlemi geri alamazsınız!\\n\\nBu kaydı silmek istediğinizden emin misiniz? Sadece yanlışlıkla yapılan işlemleri iptal etmek için kullanın."))'
content = content.replace(old_delete, new_delete)


# 4. Update renderHistory to bold student name and add the delete button next to the return action
pattern_history = re.compile(r"let btnHtml = r\.status === \"Dışarıda\" \? `<button class=\"btn-action\" onclick=\"studentRateBook\('\$\{r\.id\}'\)\">İade Al</button>` : `<div style=\"font-size:0\.8rem; font-weight:bold; color:#10b981;\">✔️ Teslim Edildi</div>`;\s*let badge = r\.status === \"Dışarıda\" \? `<span class=\"status-badge bg-red\">Dışarıda</span>` : `<span class=\"status-badge bg-green\">İade Etti</span>`;\s*let ratingHtml = r\.rating \? ` <span style=\"color:#f59e0b; font-size:0\.85rem;\">\$\{ \"⭐\"\.repeat\(r\.rating\) \}</span>` : \"\";\s*let commentHtml = \(r\.status === \"İade Etti\" && r\.comment\) \? `<div style=\"font-size:0\.8rem; font-style:italic; margin-top:5px; color:var\(--text-sub\);\">\"\$\{r\.comment\}\"</div>` : \"\";\s*div\.innerHTML \+= `<div class=\"glass-panel\" style=\"padding:15px; margin-bottom:10px;\"><div style=\"display:flex; justify-content:space-between; align-items:flex-start;\"><div><div style=\"font-weight:600;\">\$\{r\.student\}</div><div style=\"font-size:0\.85rem; color:var\(--text-sub\); margin-top:3px;\">\$\{r\.book\} \$\{ratingHtml\}</div></div><div style=\"text-align:right;\">\$\{badge\}<div style=\"font-size:0\.75rem; color:var\(--text-sub\); margin-top:5px;\">\$\{r\.date\}</div>\$\{btnHtml\}</div></div>\$\{commentHtml\}</div>`;", re.MULTILINE)

new_history = """let btnHtml = r.status === "Dışarıda" ? `<button class="btn-action" onclick="studentRateBook('${r.id}')">İade Al</button> <button class="btn-delete" style="margin-top:5px;" onclick="deleteRecord('${r.id}')"><i class="fas fa-trash"></i> Sil</button>` : `<div style="font-size:0.8rem; font-weight:bold; color:#10b981;">✔️ Teslim Edildi</div>`;
            let badge = r.status === "Dışarıda" ? `<span class="status-badge bg-red">Dışarıda</span>` : `<span class="status-badge bg-green">İade Etti</span>`;
            let ratingHtml = r.rating ? ` <span style="color:#f59e0b; font-size:0.85rem;">${ "⭐".repeat(r.rating) }</span>` : "";
            let commentHtml = (r.status === "İade Etti" && r.comment) ? `<div style="font-size:0.8rem; font-style:italic; margin-top:5px; color:var(--text-sub);">"${r.comment}"</div>` : "";
            div.innerHTML += `<div class="glass-panel" style="padding:15px; margin-bottom:10px;"><div style="display:flex; justify-content:space-between; align-items:flex-start;"><div><div style="font-weight:800; font-size:1.1rem; color:var(--primary);">${r.student}</div><div style="font-size:0.85rem; color:var(--text-sub); margin-top:3px;">${r.book} ${ratingHtml}</div></div><div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end;">${badge}<div style="font-size:0.75rem; color:var(--text-sub); margin-top:5px; margin-bottom:5px;">${r.date}</div>${btnHtml}</div></div>${commentHtml}</div>`;"""

content = re.sub(pattern_history, new_history, content)


# 5. Update renderBookManager for performance, edit mode bug, and new stats
pattern_bookmanager = re.compile(r"function renderBookManager\(\) \{[\s\S]*?let activeBooksMap = \{\};", re.MULTILINE)

new_render_book_manager = """function renderBookManager() {
    const div = document.getElementById('bookManagerList');
    if(!div) return;

    // Calculate and update stats
    let totalCount = books.length;
    let outCount = Object.keys(activeBooksMap).length;
    let shelfCount = totalCount - outCount;

    let elTotal = document.getElementById('statTotalBooks');
    let elShelf = document.getElementById('statShelfBooks');
    let elOut = document.getElementById('statOutBooks');

    if(elTotal) elTotal.innerText = totalCount;
    if(elShelf) elShelf.innerText = shelfCount;
    if(elOut) elOut.innerText = outCount;

    const searchInput = document.getElementById('bookSearch');
    const search = searchInput ? searchInput.value.toLowerCase() : "";

    let filtered = books.filter(b => b.toLowerCase().includes(search));

    if (currentFilter === 'out') {
        filtered = filtered.filter(b => activeBooksMap[normalizeStr(b)]);
    } else if (currentFilter === 'rating') {
        filtered.sort((a,b) => {
            let sA = bookStatsMap[normalizeStr(a)]?.ratingCount > 0 ? (bookStatsMap[normalizeStr(a)].totalRating / bookStatsMap[normalizeStr(a)].ratingCount) : 0;
            let sB = bookStatsMap[normalizeStr(b)]?.ratingCount > 0 ? (bookStatsMap[normalizeStr(b)].totalRating / bookStatsMap[normalizeStr(b)].ratingCount) : 0;
            return sB - sA;
        });
    } else if (currentFilter === 'latest_review') {
        filtered.sort((a,b) => {
            let dA = bookStatsMap[normalizeStr(a)]?.lastReviewDate || 0;
            let dB = bookStatsMap[normalizeStr(b)]?.lastReviewDate || 0;
            return dB - dA;
        });
    }

    let htmlParts = [];

    filtered.forEach((b, index) => {
        let key = normalizeStr(b);
        let activeList = activeBooksMap[key] || [];
        let statusStr = activeList.length > 0 ? 'out' : 'in';
        let stats = bookStatsMap[key] || { readCount: 0, reviewCount: 0, totalRating: 0, ratingCount: 0 };
        let avgScore = stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0;
        let lastReader = lastHistoryMap[key];

        let item = {
            name: b, status: statusStr, activeList: activeList,
            lastReader: lastReader, pageCount: parseInt(bookPages[b]) || 0,
            avgScore: avgScore, readCount: stats.readCount, reviewCount: stats.reviewCount
        };

        let contentHtml = "";
        let badge = "";

        if(isEditMode) {
            contentHtml = `<div style="display:flex; flex-direction:column; gap:10px;">
                <input type="text" id="edit-name-${index}" class="edit-input" value="${item.name}">
                <div style="display:flex; gap:10px;">
                    <input type="number" id="edit-page-${index}" class="edit-input" style="width:80px;" value="${item.pageCount}" placeholder="Sayfa">
                    <button class="btn btn-primary" style="margin:0; flex:1;" onclick="event.stopPropagation(); saveBookEdits(${books.indexOf(item.name)})">Kaydet</button>
                    <button class="btn btn-danger" style="margin:0; width:auto;" onclick="event.stopPropagation(); delSingleBook('${item.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        } else {
            let ratingHtml = item.avgScore > 0 ? ` <span style="color:#f59e0b; font-size:0.85rem;">⭐${item.avgScore.toFixed(1)}</span>` : "";
            let pageHtml = item.pageCount > 0 ? `<span style="font-size:0.75rem; color:var(--text-sub); border:1px solid #ccc; padding:2px 6px; border-radius:8px; margin-left:5px;">${item.pageCount} Syf.</span>` : "";

            let details = "";
            if(item.status === 'out') {
                badge = `<span class="status-badge bg-red" style="color:#ef4444; font-weight:bold; font-size:0.8rem;">Dışarıda</span>`;
                item.activeList.forEach(r => {
                    let isOverdue = checkOverdue(r.date);
                    let warning = isOverdue ? `<span class="overdue-warning">⚠️ 15 Gün!</span>` : "";
                    let dateColor = isOverdue ? "#ef4444" : "inherit";
                    details += `<div style="font-size:0.85rem; margin-top:5px; display:flex; justify-content:space-between; align-items:center;"><span style="color:${dateColor}">🔴 <b>${r.student}</b> (${r.date}) ${warning}</span><button class="btn-delete" onclick="event.stopPropagation(); deleteRecord('${r.id}')">Sil</button></div>`;
                });
            } else {
                badge = `<span class="status-badge bg-green" style="color:#10b981; font-weight:bold; font-size:0.8rem;">Rafta</span>`;
                if(item.lastReader) details = `<span style="font-size:0.8rem; color:var(--text-sub);">Son: ${item.lastReader.student} (${item.lastReader.date})</span>`;
                else details = `<span style="font-size:0.8rem; color:var(--text-sub); opacity:0.7;">Hiç okunmadı</span>`;
            }
            contentHtml = `<div style="display:flex; justify-content:space-between; align-items:center;"><h4 style="margin:0; font-size:1rem; color:var(--text-main);">${item.name} ${ratingHtml} ${pageHtml}</h4>${badge}</div><div style="margin-top:5px;">${details}</div>`;
        }

        let treeHtml = `<div style="font-size:0.75rem; opacity:0.9; margin-top:8px; display:flex; align-items:center;"><span>Bilgi Ağacı İçin Tıkla 🌳</span>`;
        if (item.readCount > 0) {
            treeHtml += `<span style="margin-left:8px; background-color:#10b981; color:white; padding:2px 8px; border-radius:12px; font-weight:bold; font-size:0.7rem;" title="Okunma Sayısı">${item.readCount} Okuma</span>`;
        }
        if (item.reviewCount > 0) {
            treeHtml += `<span style="margin-left:4px; background-color:#8b5cf6; color:white; padding:2px 8px; border-radius:12px; font-weight:bold; font-size:0.7rem;" title="Yorum Sayısı">${item.reviewCount} Yorum</span>`;
        }
        treeHtml += `</div>`;

        let clickAttr = isEditMode ? "" : `onclick="openBookDetail('${item.name.replace(/'/g, "\\'")}')"`;
        let cursorStyle = isEditMode ? "cursor:default;" : "cursor:pointer;";

        htmlParts.push(`<div class="glass-panel" style="padding:15px; margin-bottom:10px; ${cursorStyle}" ${clickAttr}>${contentHtml}${treeHtml}</div>`);
    });

    div.innerHTML = htmlParts.join("");
}

let activeBooksMap = {};"""
content = re.sub(pattern_bookmanager, new_render_book_manager, content)


# 6. Update openBookDetail to use percentage for apples
old_apple = """        fruit.style.left = (20 + (i % 5) * 60) + "px";
        fruit.style.top = (50 + Math.floor(i / 5) * 60 + Math.random() * 20 - 10) + "px";"""
new_apple = """        // Generate positions using percentages to map to the tree SVG correctly (SVG width is 400, leaves are approx 10% to 90% wide, 10% to 60% high)
        fruit.style.left = (15 + Math.random() * 70) + "%";
        fruit.style.top = (10 + Math.random() * 45) + "%";"""
content = content.replace(old_apple, new_apple)

# 7. Update getRawRating to use bookStatsMap for O(1) instead of O(N) filtering
old_raw_rating = "function getRawRating(bookName) { let bookRecs = records.filter(r => normalizeStr(r.book) === normalizeStr(bookName) && r.rating); if(bookRecs.length === 0) return 0; return bookRecs.reduce((a, b) => a + parseInt(b.rating), 0) / bookRecs.length; }"
new_raw_rating = "function getRawRating(bookName) { let stats = bookStatsMap[normalizeStr(bookName)]; if(!stats || stats.ratingCount === 0) return 0; return stats.totalRating / stats.ratingCount; }"
content = content.replace(old_raw_rating, new_raw_rating)


with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(content)
