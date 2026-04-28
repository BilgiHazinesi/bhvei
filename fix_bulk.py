import re

with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

toggle_all_class = """
function toggleAllClass() {
    let cb = document.getElementById('allClassCheck');
    let sInput = document.getElementById('studentInput');
    if (cb && cb.checked) {
        sInput.value = "TÜM SINIF";
        sInput.disabled = true;
        handleInput(sInput);
    } else {
        sInput.value = "";
        sInput.disabled = false;
        handleInput(sInput);
    }
}
"""

content = content.replace("function lendBook() { ", toggle_all_class + "\nfunction lendBook() { ")

old_lend_book = """function lendBook() {
    const sInput = document.getElementById('studentInput');
    const bInput = document.getElementById('bookInput');
    const s = sInput.value.trim().toLocaleUpperCase('tr-TR');
    const b = stripRating(bInput.value);

    if(!s || !b) { alert("Eksik bilgi!"); return; }
    if(!students.includes(s)) { students.push(s); students.sort(); }
    if(!books.includes(b)) books.push(b);

    records.unshift({ id: String(Date.now()), date: getLocalTime(), student: s, book: b, status: "Okuyor", returnDate: "-" });

    bInput.value = "";
    sInput.value = "";
    handleInput(bInput);
    handleInput(sInput);

    updateUI();
    syncData();

    sInput.focus();
}"""

new_lend_book = """function getTargetStudents(sVal) {
    let cb = document.getElementById('allClassCheck');
    if (cb && cb.checked) {
        return students.slice();
    }
    return sVal.split(',').map(x => x.trim().toLocaleUpperCase('tr-TR')).filter(x => x);
}

function getTargetBooks(bVal) {
    return bVal.split(',').map(x => stripRating(x)).filter(x => x);
}

function lendBook() {
    const sInput = document.getElementById('studentInput');
    const bInput = document.getElementById('bookInput');
    const sVal = sInput.value;
    const bVal = bInput.value;

    let targetStudents = getTargetStudents(sVal);
    let targetBooks = getTargetBooks(bVal);

    if(targetStudents.length === 0 || targetBooks.length === 0) { alert("Öğrenci ve Kitap bilgisi eksik!"); return; }

    targetStudents.forEach(s => {
        if(!students.includes(s)) { students.push(s); }
    });
    students.sort();

    targetBooks.forEach(b => {
        if(!books.includes(b)) books.push(b);
    });

    let now = Date.now();
    let timeStr = getLocalTime();

    // Reverse loops to maintain unshift order visually
    for (let i = targetStudents.length - 1; i >= 0; i--) {
        for (let j = targetBooks.length - 1; j >= 0; j--) {
            records.unshift({ id: String(now++), date: timeStr, student: targetStudents[i], book: targetBooks[j], status: "Okuyor", returnDate: "-" });
        }
    }

    bInput.value = "";
    handleInput(bInput);

    let cb = document.getElementById('allClassCheck');
    if (!cb || !cb.checked) {
        sInput.value = "";
        handleInput(sInput);
        sInput.focus();
    } else {
        bInput.focus();
    }

    updateUI();
    syncData();
}

function bulkReturnBooks() {
    const sInput = document.getElementById('studentInput');
    const bInput = document.getElementById('bookInput');
    const sVal = sInput.value;
    const bVal = bInput.value;

    let targetStudents = getTargetStudents(sVal);
    let targetBooks = getTargetBooks(bVal);

    if(targetStudents.length === 0) { alert("İade alacak öğrenci(leri) belirtin!"); return; }

    let timeStr = getLocalTime();
    let returnedCount = 0;

    records.forEach(r => {
        if (r.status === "Okuyor" && targetStudents.includes(r.student)) {
            // If books are specified, only return those. Otherwise return ALL open books for student.
            if (targetBooks.length === 0 || targetBooks.includes(r.book)) {
                r.status = "İade Etti";
                r.returnDate = timeStr;
                returnedCount++;
            }
        }
    });

    if (returnedCount > 0) {
        bInput.value = "";
        handleInput(bInput);

        let cb = document.getElementById('allClassCheck');
        if (!cb || !cb.checked) {
            sInput.value = "";
            handleInput(sInput);
            sInput.focus();
        }

        updateUI();
        syncData();
        alert(`${returnedCount} kitap hızlı iade alındı!`);
    } else {
        alert("İade edilecek açık kayıt bulunamadı.");
    }
}
"""

content = content.replace(old_lend_book, new_lend_book)

with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(content)
