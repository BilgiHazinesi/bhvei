with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

# Remove old getTargetStudents, getTargetBooks, toggleAllClass, lendBook, bulkReturnBooks
import re
content = re.sub(r'function getTargetStudents.*?function renderHistory', 'function renderHistory', content, flags=re.DOTALL)


desk_logic = """
let stagedStudents = [];
let stagedBooks = [];
let returnQueue = [];
let currentReturnIndex = -1;

function clearStagingDesk() {
    stagedStudents = [];
    stagedBooks = [];
    renderDesk();
}

function stageStudentFromInput() {
    let input = document.getElementById('stageStudentInput');
    let val = input.value.trim().toLocaleUpperCase('tr-TR');
    if(!val) return;

    if(!stagedStudents.includes(val)) {
        stagedStudents.push(val);
        if(!students.includes(val)) { students.push(val); students.sort(); }
    }

    input.value = "";
    input.focus();
    renderDesk();
}

function unstageStudent(name) {
    stagedStudents = stagedStudents.filter(s => s !== name);
    renderDesk();
}

function stageBookFromInput() {
    let input = document.getElementById('stageBookInput');
    let val = stripRating(input.value);
    if(!val) return;

    if(!stagedBooks.includes(val)) {
        stagedBooks.push(val);
        if(!books.includes(val)) { books.push(val); books.sort(); }
    }

    input.value = "";
    input.focus();
    renderDesk();
}

function unstageBook(name) {
    stagedBooks = stagedBooks.filter(b => b !== name);
    renderDesk();
}

function switchDeskTab(tab) {
    document.getElementById('deskTabReturn').classList.remove('active');
    document.getElementById('deskTabLend').classList.remove('active');
    document.getElementById('deskReturnPanel').style.display = 'none';
    document.getElementById('deskLendPanel').style.display = 'none';

    if(tab === 'return') {
        document.getElementById('deskTabReturn').classList.add('active');
        document.getElementById('deskReturnPanel').style.display = 'block';
    } else {
        document.getElementById('deskTabLend').classList.add('active');
        document.getElementById('deskLendPanel').style.display = 'block';
        document.getElementById('stageBookInput').focus();
    }
}

function renderDesk() {
    let sc = document.getElementById('stagedStudentsContainer');
    let da = document.getElementById('deskActionArea');
    if(!sc || !da) return;

    // Render Students
    if(stagedStudents.length === 0) {
        sc.innerHTML = '<div style="color:var(--text-sub); font-size:0.8rem; width:100%; text-align:center; opacity:0.7;">Henüz öğrenci eklenmedi.</div>';
        da.style.display = 'none';
        return;
    }

    da.style.display = 'block';
    sc.innerHTML = "";
    stagedStudents.forEach(s => {
        sc.innerHTML += `<div style="background:var(--primary); color:white; padding:4px 10px; border-radius:15px; font-size:0.85rem; display:flex; align-items:center; gap:5px;">${s} <i class="fas fa-times" style="cursor:pointer;" onclick="unstageStudent('${s}')"></i></div>`;
    });
    document.getElementById('lendTargetCount').innerText = stagedStudents.length;

    // Render Open Books for Returns
    let rl = document.getElementById('deskReturnList');
    rl.innerHTML = "";
    let openRecords = records.filter(r => r.status === "Okuyor" && stagedStudents.includes(r.student));

    if(openRecords.length === 0) {
        rl.innerHTML = '<div style="font-size:0.8rem; text-align:center; color:var(--text-sub); padding:10px;">Bu öğrencilerin üzerinde teslim edilecek kitap bulunmuyor.</div>';
    } else {
        openRecords.forEach(r => {
            rl.innerHTML += `<div style="display:flex; align-items:center; gap:10px; margin-bottom:5px; background:white; padding:5px; border-radius:5px;">
                <input type="checkbox" id="chk_${r.id}" class="desk-return-chk" value="${r.id}" checked>
                <label for="chk_${r.id}" style="font-size:0.85rem; cursor:pointer; flex:1;"><b>${r.student}</b>: ${r.book}</label>
            </div>`;
        });
    }

    // Render Staged Books for Lending
    let bc = document.getElementById('stagedBooksContainer');
    if(stagedBooks.length === 0) {
        bc.innerHTML = '<div style="color:var(--text-sub); font-size:0.8rem; width:100%; text-align:center; opacity:0.7;">Verilecek kitap eklenmedi.</div>';
    } else {
        bc.innerHTML = "";
        stagedBooks.forEach(b => {
            bc.innerHTML += `<div style="display:flex; justify-content:space-between; background:white; padding:5px 10px; border-radius:5px; font-size:0.85rem;"><span>${b}</span> <i class="fas fa-trash" style="color:#ef4444; cursor:pointer;" onclick="unstageBook('${b.replace(/'/g, "\\'")}')"></i></div>`;
        });
    }
}

function submitStagedLends() {
    if(stagedStudents.length === 0 || stagedBooks.length === 0) return alert("Öğrenci veya Kitap seçilmedi!");

    let now = Date.now();
    let timeStr = getLocalTime();

    for (let i = stagedStudents.length - 1; i >= 0; i--) {
        for (let j = stagedBooks.length - 1; j >= 0; j--) {
            records.unshift({ id: String(now++), date: timeStr, student: stagedStudents[i], book: stagedBooks[j], status: "Okuyor", returnDate: "-" });
        }
    }

    stagedBooks = [];
    renderDesk();
    updateUI();
    syncData();
    alert("Kitaplar başarıyla verildi!");
    document.getElementById('stageStudentInput').focus();
}

function startSequentialReturn() {
    let checkboxes = document.querySelectorAll('.desk-return-chk:checked');
    if(checkboxes.length === 0) return alert("İade alınacak kitap seçilmedi!");

    returnQueue = Array.from(checkboxes).map(cb => cb.value);
    currentReturnIndex = 0;
    processNextReturn();
}

function processNextReturn() {
    if(currentReturnIndex >= returnQueue.length) {
        // Queue finished
        returnQueue = [];
        currentReturnIndex = -1;
        updateUI();
        syncData();
        renderDesk();
        return;
    }

    let recId = returnQueue[currentReturnIndex];
    let rec = records.find(r => r.id === String(recId));
    if(!rec) {
        currentReturnIndex++;
        return processNextReturn();
    }

    document.getElementById('ratingContextLabel').innerText = `${rec.student} ➔ ${rec.book}`;
    tempReturnId = String(recId);
    currentRating = rec.rating || 0;
    document.getElementById('exitCardSelect').value = rec.cardId || "";
    document.getElementById('returnComment').value = rec.comment || "";

    updateStars();
    updateCardPrompt();
    document.getElementById('ratingOverlay').style.display = 'flex';
}

function submitReturn() {
    if (!tempReturnId) return;

    let rec = records.find(r => r.id === String(tempReturnId));
    if(!rec) {
        closeRatingModal();
        return;
    }

    let cardId = document.getElementById('exitCardSelect').value;
    let comment = document.getElementById('returnComment').value;

    rec.status = "İade Etti";
    if(!rec.returnDate || rec.returnDate === "-") rec.returnDate = getLocalTime();

    if(currentRating > 0) rec.rating = currentRating;

    if(cardId) {
        rec.cardId = cardId;
        rec.cardTitle = EXIT_CARDS[cardId].title;
    }
    rec.comment = comment;

    closeRatingModal();

    if(currentReturnIndex !== -1) {
        currentReturnIndex++;
        processNextReturn();
    } else {
        if(loginMode === 'student') renderStudentPanel(); else updateUI();
        syncData();
    }
}
"""

content = content.replace("function submitReturn() {\n    if (!tempReturnId) return;\n\n    let rec = records.find(r => r.id === String(tempReturnId));\n    \n    if(!rec) {\n        alert(\"Hata: Kayıt bulunamadı. Lütfen sayfayı yenileyin.\");\n        closeRatingModal();\n        return;\n    }\n\n    let cardId = document.getElementById('exitCardSelect').value;\n    let comment = document.getElementById('returnComment').value;\n\n    rec.status = \"İade Etti\";\n    if(!rec.returnDate || rec.returnDate === \"-\") rec.returnDate = getLocalTime();\n    \n    if(currentRating > 0) rec.rating = currentRating;\n    \n    if(cardId) { \n        rec.cardId = cardId; \n        rec.cardTitle = EXIT_CARDS[cardId].title; \n    }\n    rec.comment = comment;\n\n    if(loginMode === 'student') renderStudentPanel(); else updateUI();\n    syncData();\n    closeRatingModal();\n}", desk_logic + "\n")

with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(content)
