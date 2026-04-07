// --- ZEYNAL ÖĞRETMEN V64 (FIREBASE ENTEGRASYONU) ---

// Firebase Configuration
// (Bunu kendi Firebase projenizin yapılandırmasıyla değiştirmeniz gerekebilir)
// Uygulamanızda bu kısmı kendi config ayarlarınız ile değiştirin.
const firebaseConfig = {
  apiKey: "AIzaSyCzWg0ArosPt_O4t-veaqD8HdiSR9ygvFw",
  authDomain: "bhveri.firebaseapp.com",
  databaseURL: "https://bhveri-default-rtdb.firebaseio.com",
  projectId: "bhveri",
  storageBucket: "bhveri.firebasestorage.app",
  messagingSenderId: "902116400674",
  appId: "1:902116400674:web:96fa6356cea3d7499bf47b",
  measurementId: "G-85JNVZ1KT0"
};

// Initialize Firebase (eğer henüz başlatılmadıysa)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const DB_REF = "/"; // Firebacse'de verilerin tutulacağı düğüm

// Global Değişkenler
let settings = { classTarget: 500, silverLimit: 3, goldLimit: 5 };
let students = []; 
let books = []; 
let bookPages = {}; 
let records = []; 
let studentPassObj = {};
let teacherPassword = ""; 
let currentFilter = 'all'; 
let statsSortMode = 'book_desc'; 
let loginMode = 'teacher'; 
let loggedInStudent = "";
let isDataLoaded = false;
let tempReturnId = null;
let currentRating = 0;
let isEditMode = false;

// Sabitler
const RANKS = [{c:0, t:"🌱 Başlangıç"}, {c:5, t:"🥉 Okuma Çırağı"}, {c:10, t:"📖 Kitap Kurdu"},{c:15, t:"🚀 Bilgi Kaşifi"}, {c:20, t:"🏹 Kelime Avcısı"}, {c:25, t:"👑 Kütüphane Muhafızı"},{c:30, t:"🎩 Edebiyat Ustası"}, {c:35, t:"🌍 Bilge Okur"}, {c:40, t:"💎 EFSANE"}];
const EXIT_CARDS = {"1":{title:"Macera Hatırası",prompt:"En unutulmaz sahne neydi?"},"2":{title:"Öğrenen Profil",prompt:"Karakter hangi özelliği taşıyor?"},"3":{title:"Duygu Kartı",prompt:"Hangi duyguları hissettin?"},"4":{title:"Bağlantı Kartı",prompt:"Nasıl bir bağ kurdun?"},"5":{title:"Eleştiri Kartı",prompt:"Katılmadığın bir olay var mı?"},"6":{title:"Soru Kartı",prompt:"Seni düşündüren soru neydi?"},"7":{title:"Yaratıcı Son",prompt:"Sonunu nasıl değiştirirdin?"},"8":{title:"Gelişim Kartı",prompt:"Hangi becerini geliştirdi?"},"9":{title:"Tavsiye Kartı",prompt:"Tavsiye eder misin?"}};

// --- Başlangıç ---
window.onload = function() {
    console.log("Sistem başlatılıyor... Firebase Entegreli Sürüm");
    if(localStorage.getItem('theme') === 'dark') { document.body.classList.add('dark-mode'); document.getElementById('themeIcon').innerText = '☀️'; } else { document.getElementById('themeIcon').innerText = '🌙'; }
    
    let select = document.getElementById('exitCardSelect'); 
    if(select) {
        select.innerHTML = '<option value="">Bir Kart Seç...</option>'; 
        for (const [key, value] of Object.entries(EXIT_CARDS)) { let opt = document.createElement('option'); opt.value = key; opt.innerText = value.title; select.appendChild(opt); }
    }

    fetchData(true);
};

// --- Veri Çekme (Firebase) ---
function fetchData(isFirstLoad) {
    db.ref(DB_REF).once('value').then((snapshot) => {
        const data = snapshot.val() || {};
        processData(data);
        if(isFirstLoad) {
            document.getElementById('loader').style.display = 'none';
            isDataLoaded = true; 
            updateUI(); 
        }
    }).catch(err => {
        document.getElementById('loader').innerText = "Bağlantı Hatası! Lütfen sayfayı yenileyin.";
        console.error("Fetch Hatası:", err);
    });
}

function processData(data) {
    // Firebase boş dizileri null/undefined olarak ya da sparse array'leri nesne olarak getirebilir.
    // Object.values() ile düzeltiyoruz.
    let rawStudents = data.students || [];
    students = Array.isArray(rawStudents) ? rawStudents : Object.values(rawStudents);
    
    let rawBooks = data.books || [];
    books = Array.isArray(rawBooks) ? rawBooks : Object.values(rawBooks);
    
    let rawRecords = data.records || [];
    let recordsArray = Array.isArray(rawRecords) ? rawRecords : Object.values(rawRecords);
    
    records = recordsArray.map(r => {
        if(r) r.id = String(r.id); 
        return r;
    }).filter(r => r != null); // Boş elemanları filtrele
    
    studentPassObj = data.studentPass || {};
    bookPages = data.bookPages || {};
    
    if(data.settings) settings = { ...settings, ...data.settings };
    if(data.auth_password) teacherPassword = data.auth_password.toString();
    else if(data.teacherPass) teacherPassword = data.teacherPass.toString();
    
    records.sort((a,b) => parseFloat(b.id) - parseFloat(a.id));
    
    let targetInput = document.getElementById('set-target');
    if(targetInput) {
        targetInput.value = settings.classTarget;
        document.getElementById('set-silver').value = settings.silverLimit;
        document.getElementById('set-gold').value = settings.goldLimit;
    }
}

// --- Arayüz Güncelleme ---
function updateUI() { 
    try {
        analyzeData(); 
        populateDatalists(); 
        renderHistory(); 
        renderBookManager(); 
        renderRanking(); 
        updateProgressBar(); 
        if(document.getElementById('studentPassList')) renderPassManager();
    } catch(e) {
        console.error("Arayüz güncellenirken hata oluştu:", e);
    }
}

// --- DEĞERLENDİRME & DÜZENLEME ---
function studentRateBook(id) {
    tempReturnId = String(id);
    let rec = records.find(r => r.id === tempReturnId);
    
    if(rec) {
        currentRating = rec.rating || 0;
        document.getElementById('exitCardSelect').value = rec.cardId || "";
        document.getElementById('returnComment').value = rec.comment || "";
    } else {
        console.error("Kayıt bulunamadı ID:", tempReturnId);
        currentRating = 0;
        document.getElementById('exitCardSelect').value = "";
        document.getElementById('returnComment').value = "";
    }
    
    updateStars();
    updateCardPrompt();
    document.getElementById('ratingOverlay').style.display = 'flex';
}

function returnBook(id) { 
    studentRateBook(id); 
}

function submitReturn() {
    if (!tempReturnId) return;

    let rec = records.find(r => r.id === String(tempReturnId));
    
    if(!rec) {
        alert("Hata: Kayıt bulunamadı. Lütfen sayfayı yenileyin.");
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

    if(loginMode === 'student') renderStudentPanel(); else updateUI();
    syncData();
    closeRatingModal();
}

// --- RENDER FUNCTIONS ---
function renderBookManager() {
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
        let rawAvg = stats.ratingCount > 0 ? (stats.totalRating / stats.ratingCount) : 0;
        let avgScore = formatRating(rawAvg);
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
                    <button class="btn btn-danger" style="margin:0; width:auto;" onclick="event.stopPropagation(); delSingleBook('${item.name.replace(/'/g, "\'")}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        } else {
            let ratingHtml = item.avgScore != 0 ? ` <span style="color:#f59e0b; font-size:0.85rem;">⭐${item.avgScore}</span>` : "";
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

        let clickAttr = isEditMode ? "" : `onclick="openBookDetail('${item.name.replace(/'/g, "\'")}')"`;
        let cursorStyle = isEditMode ? "cursor:default;" : "cursor:pointer;";
        
        htmlParts.push(`<div class="glass-panel" style="padding:15px; margin-bottom:10px; ${cursorStyle}" ${clickAttr}>${contentHtml}${treeHtml}</div>`);
    });
    
    div.innerHTML = htmlParts.join("");
}

let activeBooksMap = {};
let lastHistoryMap = {};
let bookStatsMap = {};

function analyzeData() { 
    activeBooksMap = {}; 
    lastHistoryMap = {}; 
    bookStatsMap = {};
    records.forEach(r => { 
        let key = normalizeStr(r.book); 
        if(!bookStatsMap[key]) bookStatsMap[key] = { readCount: 0, reviewCount: 0, totalRating: 0, ratingCount: 0, lastReviewDate: 0 };
        
        if(r.status === "Okuyor") { 
            if(!activeBooksMap[key]) activeBooksMap[key] = []; 
            activeBooksMap[key].push(r); 
        } else if (r.status === "İade Etti") { 
            if(!lastHistoryMap[key]) lastHistoryMap[key] = { student: r.student, date: r.returnDate }; 
            bookStatsMap[key].readCount++;
            if (r.comment) bookStatsMap[key].reviewCount++;
            if (r.rating && r.rating > 0) {
                bookStatsMap[key].totalRating += r.rating;
                bookStatsMap[key].ratingCount++;
            }
            let recId = parseFloat(r.id);
            if (recId > bookStatsMap[key].lastReviewDate) {
                bookStatsMap[key].lastReviewDate = recId;
            }
        } 
    }); 
    
    let totalPagesRead = 0; 
    records.forEach(r => { 
        if(r.status === "İade Etti") totalPagesRead += (parseInt(bookPages[r.book]) || 0); 
    }); 
    if(document.getElementById('statTotalPages')) document.getElementById('statTotalPages').innerText = totalPagesRead.toLocaleString(); 
}

function stripRating(bookName) {
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

function normalizeStr(str) { return str ? str.toString().trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR') : ""; }

function formatRating(score) {
    if (!score) return 0;
    let num = parseFloat(score);
    if (isNaN(num)) return 0;
    let formatted = num.toFixed(1);
    if (formatted.endsWith('.0')) {
        return parseInt(formatted).toString();
    }
    return formatted.replace('.', ',');
}

function checkOverdue(dateStr) { if(!dateStr) return false; let parts = dateStr.split('.'); if(parts.length !== 3) return false; let bookDate = new Date(parts[2], parts[1]-1, parts[0]); let diffTime = Math.abs(new Date() - bookDate); return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) > 15; }
function getRawRating(bookName) { let stats = bookStatsMap[normalizeStr(bookName)]; if(!stats || stats.ratingCount === 0) return 0; return stats.totalRating / stats.ratingCount; }

function handleInput(input) { let btn = input.nextElementSibling; if(btn && btn.classList.contains('clear-btn')) { btn.style.display = input.value.length > 0 ? 'block' : 'none'; } }
function clearField(id, callback) { let input = document.getElementById(id); input.value = ""; handleInput(input); if (callback) callback(); }
function toggleTheme() { document.body.classList.toggle('dark-mode'); let isDark = document.body.classList.contains('dark-mode'); document.getElementById('themeIcon').innerText = isDark ? '☀️' : '🌙'; localStorage.setItem('theme', isDark ? 'dark' : 'light'); }
function getLocalTime() { let now = new Date(); return now.toLocaleDateString('tr-TR') + " " + now.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}); }

// --- Veri Kaydetme (Firebase) ---
function syncData() {
    const syncEl = document.getElementById('syncStatus');
    
    if(syncEl) {
        syncEl.style.opacity = "1";
        syncEl.innerHTML = `<i class="fas fa-spinner fa-spin" style="color:#ef4444;"></i> <span style="color:#ef4444; font-weight:bold;">Kaydediliyor...</span>`;
    }

    const payload = { 
        students: students, 
        studentPass: studentPassObj, 
        books: books, 
        bookPages: bookPages, 
        records: records, 
        settings: settings, 
        auth_password: teacherPassword 
    };
    
    db.ref(DB_REF).set(payload).then(() => { 
        if(syncEl) {
            syncEl.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> <span style="color:#10b981; font-weight:bold;">Senkronize</span>`;
            setTimeout(() => { syncEl.style.opacity = "0.7"; }, 3000);
        }
    }).catch(err => {
        if(syncEl) {
            syncEl.innerHTML = `<i class="fas fa-times-circle" style="color:#ef4444;"></i> <span style="color:#ef4444; font-weight:bold;">Bağlantı Hatası!</span>`;
        }
        console.error("Senkronizasyon Hatası:", err);
    });
}

function setLoginMode(mode) {
    loginMode = mode;
    document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
    if(mode === 'teacher') {
        document.getElementById('tabTeacher').classList.add('active');
        document.getElementById('teacherLoginForm').style.display = 'block';
        document.getElementById('studentLoginForm').style.display = 'none';
    } else {
        document.getElementById('tabStudent').classList.add('active');
        document.getElementById('teacherLoginForm').style.display = 'none';
        document.getElementById('studentLoginForm').style.display = 'block';
    }
}

function login() {
    if(!isDataLoaded) return alert("Veriler yükleniyor, lütfen bekleyin...");
    if(loginMode === 'teacher') {
        let pass = document.getElementById('appPassword').value;
        if(String(pass).trim() === String(teacherPassword).trim()) { 
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
            document.getElementById('teacherContainer').style.display = 'block';
            document.getElementById('teacherNav').style.display = 'flex';
            updateUI();
        } else { alert("Hatalı Şifre!"); }
    } else {
        let sPass = document.getElementById('studentLoginPass').value.trim();
        let foundStudent = Object.keys(studentPassObj).find(key => String(studentPassObj[key]).trim() === String(sPass));
        if(foundStudent) {
            loggedInStudent = foundStudent;
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
            document.getElementById('studentContainer').style.display = 'block';
            document.getElementById('studentNav').style.display = 'flex';
            document.getElementById('mainTitle').innerText = "Öğrenci Paneli";
            renderStudentPanel();
        } else { alert("Şifre bulunamadı!"); }
    }
}

function lendBook() { 
    const s = document.getElementById('studentInput').value.trim().toLocaleUpperCase('tr-TR'); 
    const b = stripRating(document.getElementById('bookInput').value); 
    if(!s || !b) { alert("Eksik bilgi!"); return; } 
    if(!students.includes(s)) { students.push(s); students.sort(); } 
    if(!books.includes(b)) books.push(b); 
    records.unshift({ id: String(Date.now()), date: getLocalTime(), student: s, book: b, status: "Okuyor", returnDate: "-" }); 
    document.getElementById('bookInput').value = ""; 
    handleInput(document.getElementById('bookInput')); 
    updateUI(); 
    syncData(); 
}

function renderHistory() { 
    const sVal = document.getElementById('studentInput').value.trim().toLocaleUpperCase('tr-TR');
    const div = document.getElementById('historyList'); 
    if(!div) return;
    div.innerHTML = ""; 
    let list; 
    if(sVal) list = records.filter(r => r.student === sVal);
    else list = records.filter(r => r.status === "Okuyor"); 
    
    if(list.length === 0) div.innerHTML = "<p style='text-align:center; opacity:0.7;'>Kayıt yok.</p>";
    
    list.forEach(r => { 
        let actionBtn = ""; 
        let dateDisplay = `<i class="far fa-calendar-alt" style="opacity:0.7; margin-right:4px;"></i>${r.date}`; 

        if (r.status === "Okuyor") { 
            actionBtn = `<button class="btn-return" onclick="returnBook('${r.id}')">İade Al</button>`; 
            
            if (r.date) {
                let datePart = r.date.split(' ')[0];
                let parts = datePart.split('.');
                if (parts.length === 3) {
                    let bookDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    let now = new Date();
                    bookDate.setHours(0, 0, 0, 0);
                    now.setHours(0, 0, 0, 0);
                    
                    let diffDays = Math.floor((now - bookDate) / (1000 * 60 * 60 * 24));
                    let dateColor = "inherit";
                    let dateIndicator = "";

                    if (diffDays <= 4) {
                        dateColor = "#10b981"; 
                        dateIndicator = "🟢 ";
                    } else if (diffDays <= 7) {
                        dateColor = "#f59e0b"; 
                        dateIndicator = "🟠 ";
                    } else {
                        dateColor = "#ef4444"; 
                        dateIndicator = "🔴 ";
                    }

                    dateDisplay = `<span style="color:${dateColor}; font-weight:bold;">${dateIndicator}<i class="far fa-calendar-alt" style="margin-right:4px;"></i>${r.date}</span>`;
                }
            }

        } else { 
            if(sVal) actionBtn = `<button class="btn-comment" onclick="returnBook('${r.id}')"><i class="fas fa-edit"></i> Yorumla</button>`; 
            else actionBtn = `<span style="font-size:0.8rem;"><i class="far fa-calendar-check" style="opacity:0.7; margin-right:4px;"></i>${r.returnDate}</span>`; 
        } 
        
        div.innerHTML += `<div class="list-item"><div class="item-content"><h4>${r.book}</h4><div style="margin-top:5px; font-size:0.85rem; color:var(--text-sub); display:flex; flex-direction:column; gap:4px;"><span><i class="far fa-user" style="opacity:0.7; margin-right:4px;"></i>${r.student}</span><span>${dateDisplay}</span></div></div>${actionBtn}</div>`; 
    });
}

function updateProgressBar() { 
    let completed = records.filter(r => r.status === "İade Etti").length; 
    let percent = Math.min(100, Math.floor((completed / settings.classTarget) * 100)); 
    let pBar = document.getElementById('progressBar');
    if(pBar) {
        pBar.style.width = percent + "%"; 
        document.getElementById('progressPercent').innerText = percent + "%"; 
        document.getElementById('targetText').innerText = `${completed} / ${settings.classTarget} Kitap`; 
    }
}

function switchTab(id, btn) { document.querySelectorAll('.section').forEach(el => el.classList.remove('active')); document.getElementById('tab-' + id).classList.add('active'); document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); btn.classList.add('active'); }

function selectStar(n) { currentRating = n; updateStars(); }
function updateStars() { let btns = document.getElementById('starGroup').children; for(let i=0; i<btns.length; i++) { if(i < currentRating) btns[i].classList.add('selected'); else btns[i].classList.remove('selected'); } }
function updateCardPrompt() { let val = document.getElementById('exitCardSelect').value; let box = document.getElementById('cardPromptBox'); let wrap = document.getElementById('commentWrapper'); if(val && EXIT_CARDS[val]) { box.innerHTML = `<i class="fas fa-question-circle"></i> ${EXIT_CARDS[val].prompt}`; box.style.display = 'flex'; wrap.style.display = 'block'; } else { box.style.display = 'none'; wrap.style.display = 'block'; } }
function closeRatingModal() { document.getElementById('ratingOverlay').style.display = 'none'; tempReturnId = null; }

function toggleEditMode() { isEditMode = !isEditMode; document.getElementById('editToggleBtn').classList.toggle('active'); document.getElementById('editToggleBtn').innerText = isEditMode ? '✅ Bitir' : '✏️ Düzenle'; renderBookManager(); }
function saveBookEdits(index) { let oldName = books[index]; let nameInput = document.getElementById(`edit-name-${index}`); let pageInput = document.getElementById(`edit-page-${index}`); if (!nameInput || !pageInput) return; let newName = nameInput.value.trim(); let newPage = parseInt(pageInput.value) || 0; if(!newName) return alert("Kitap adı boş olamaz."); if(newName !== oldName) { books[index] = newName; if(bookPages[oldName]) delete bookPages[oldName]; records.forEach(r => { if(r.book === oldName) r.book = newName; }); } bookPages[newName] = newPage; alert("Kaydedildi!"); books.sort(); renderBookManager(); updateUI(); syncData(); }
function filterBooks(type, el) { currentFilter = type; document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active')); el.classList.add('active'); renderBookManager(); }

function openBookDetail(bookName) {
    document.getElementById('bdTitle').innerText = bookName;
    let bookRecs = records.filter(r => normalizeStr(r.book) === normalizeStr(bookName) && r.status === "İade Etti");
    document.getElementById('bdStats').innerText = `${bookRecs.length} Meyve Toplandı`;
    let fruitsContainer = document.getElementById('treeFruitsContainer');
    fruitsContainer.innerHTML = "";
    bookRecs.forEach((r, i) => {
        let icon = r.comment ? "🍎" : "🍏";
        let fruit = document.createElement('div');
        fruit.className = 'tree-fruit';
        fruit.innerText = icon;
        fruit.style.left = (40 + Math.random() * 320) + "px";
        fruit.style.top = (30 + Math.random() * 250) + "px";
        fruit.onclick = () => showFruitDetail(r);
        fruitsContainer.appendChild(fruit);
    });
    let listContainer = document.getElementById('bdReviews');
    listContainer.innerHTML = "";
    if(bookRecs.length === 0) listContainer.innerHTML = "<div style='text-align:center; padding:10px; color:#ccc;'>Henüz yorum yok.</div>";
    bookRecs.sort((a,b) => parseFloat(b.id) - parseFloat(a.id)).forEach(r => {
        let starStr = r.rating ? "⭐".repeat(r.rating) : "";
        let cardHtml = r.cardTitle ? `<span class="rc-badge">${r.cardTitle}</span>` : "";
        let commentHtml = r.comment ? `<div class="rc-text">"${r.comment}"</div>` : "<div class='rc-text' style='opacity:0.5'>(Yorumsuz)</div>";
        listContainer.innerHTML += `<div class="review-card"><div class="rc-header"><span>${r.student}</span><span>${starStr}</span></div>${cardHtml}${commentHtml}<div style="font-size:0.7rem; color:var(--text-sub); text-align:right;">${r.returnDate}</div></div>`;
    });
    document.getElementById('fruitDetailBox').style.display = 'none';
    document.getElementById('bookDetailOverlay').style.display = 'flex';
}

function showFruitDetail(rec) {
    let box = document.getElementById('fruitDetailBox');
    let starStr = rec.rating ? "⭐".repeat(rec.rating) : "";
    document.getElementById('fdStudent').innerText = `${rec.student} ${starStr}`;
    document.getElementById('fdCard').innerText = rec.cardTitle || "Standart Okuma";
    document.getElementById('fdComment').innerText = rec.comment ? `"${rec.comment}"` : "(Yorum yok)";
    box.style.display = 'block';
}
function closeBookDetail() { document.getElementById('bookDetailOverlay').style.display = 'none'; }

function genReport() { 
    const s = document.getElementById('reportStudentInput').value.trim().toLocaleUpperCase('tr-TR'); 
    if(!s) return; 
    let myRecs = records.filter(r => r.student === s).sort((a,b) => parseFloat(a.id) - parseFloat(b.id)); 
    let currentlyReading = myRecs.filter(r => r.status === "Okuyor"); 
    // .reverse() ekleyerek listeyi en yeniden en eskiye çeviriyoruz
    let history = myRecs.filter(r => r.status === "İade Etti").reverse(); 
    let totalP = 0; 
    history.forEach(r => totalP += (parseInt(bookPages[r.book])||0)); 
    let txt = `Sayın Velimiz,\n\n✨ "Her kitap keşfedilmeyi bekleyen ayrı bir dünyadır."\n\nÖğrencimiz *${s}*, bu dönem kütüphanemizden toplam *${myRecs.length}* kitap okuyarak yeni dünyalar keşfetmiştir.\nToplam Okunan Sayfa: *${totalP}*\n\n`; 
    if (currentlyReading.length > 0) { txt += `⏳ *Şu An Okuduğu:* \n`; currentlyReading.forEach(r => { txt += `- ${r.book} (Alış: ${r.date})\n`; }); txt += `\n`; } 
    if (history.length > 0) { 
        txt += `📚 *Keşfettiği Dünyalar:* \n`; 
        // Liste tersine çevrildiği için sıralamanın büyükten küçüğe (Örn: 30, 29, 28...) görünmesini sağlıyoruz.
        history.forEach((r, i) => { txt += `✅ ${history.length - i}. ${r.book}\n`; }); 
    } 
    txt += `\nİlginiz ve desteğiniz için teşekkür ederiz.\nZeynal Öğretmen`; 
    document.getElementById('reportOutput').innerText = txt; 
    renderSpaceJourney(myRecs.length, 'spaceJourney', 'journeySvg'); 
}

function renderSpaceJourney(count, containerId, svgId) { 
    if(!containerId) containerId = 'spaceJourney';
    if(!svgId) svgId = 'journeySvg';
    const cont = document.getElementById(containerId); 
    const svg = document.getElementById(svgId); 
    if(!cont || !svg) return; 
    cont.querySelectorAll('.station-node, .astronaut').forEach(e => e.remove()); 
    svg.innerHTML = ""; 
    const points = [ {x: 15, y: 90}, {x: 85, y: 80}, {x: 15, y: 65}, {x: 85, y: 55}, {x: 15, y: 40}, {x: 85, y: 30}, {x: 15, y: 20}, {x: 85, y: 10}, {x: 50, y: 5} ]; 
    const w = cont.offsetWidth; 
    const h = cont.offsetHeight; 
    let d = `M ${w*points[0].x/100} ${h*points[0].y/100}`; 
    for(let i=1; i<points.length; i++) { d += ` L ${w*points[i].x/100} ${h*points[i].y/100}`; } 
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path"); 
    path.setAttribute("d", d); path.setAttribute("fill", "none"); path.setAttribute("stroke", "rgba(255, 255, 255, 0.2)"); path.setAttribute("stroke-width", "4"); path.setAttribute("stroke-dasharray", "8,8"); svg.appendChild(path); 
    points.forEach((p, i) => { 
        let rank = RANKS[i]; 
        let isReached = count >= rank.c; 
        let node = document.createElement('div'); 
        node.className = `station-node ${isReached ? 'active' : ''}`; 
        node.style.left = p.x + "%"; 
        node.style.top = p.y + "%"; 
        node.innerHTML = `<div>${rank.t.split(' ')[0]}</div><div class="station-label">${rank.t}<br>${rank.c}</div>`; 
        if(count >= rank.c && (i === RANKS.length-1 || count < RANKS[i+1].c)) { 
            let astro = document.createElement('div'); astro.className = "astronaut"; astro.innerText = "👨‍🚀"; astro.style.left = p.x + "%"; astro.style.top = (p.y - 6) + "%"; cont.appendChild(astro); 
        } 
        cont.appendChild(node); 
    }); 
}

function saveSettings() { let t = parseInt(document.getElementById('set-target').value); let s = parseInt(document.getElementById('set-silver').value); let g = parseInt(document.getElementById('set-gold').value); if(!t || !s || !g) { alert("Lütfen geçerli sayılar girin."); return; } settings.classTarget = t; settings.silverLimit = s; settings.goldLimit = g; updateUI(); syncData(); alert("Ayarlar kaydedildi!"); }

function addSingleStudent() { 
    let name = document.getElementById('single-student-add').value.trim().toLocaleUpperCase('tr-TR'); 
    let pass = document.getElementById('single-student-pass').value.trim(); 
    if(name && !students.includes(name)) { students.push(name); students.sort(); studentPassObj[name] = pass; updateUI(); syncData(); document.getElementById('single-student-add').value=""; document.getElementById('single-student-pass').value=""; alert("Öğrenci ve şifresi eklendi."); } else { alert("İsim boş veya zaten var."); } 
}

function delSingleStudent() { 
    let name = document.getElementById('single-student-del').value.trim().toLocaleUpperCase('tr-TR'); 
    if(name && students.includes(name)) { if(confirm("DİKKAT: " + name + " silinsin mi?")) { students = students.filter(s => s !== name); delete studentPassObj[name]; records = records.filter(r => r.student !== name); updateUI(); syncData(); document.getElementById('single-student-del').value=""; alert("Silindi."); } } else { alert("Öğrenci bulunamadı."); } 
}

function renderPassManager() { let div = document.getElementById('studentPassList'); div.innerHTML = ""; students.sort().forEach(s => { let pass = studentPassObj[s] || ""; div.innerHTML += `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid rgba(0,0,0,0.1); padding:5px;"><span style="font-size:0.9rem; font-weight:600;">${s}</span><input type="text" value="${pass}" placeholder="Şifre Yok" style="width:80px; padding:4px; font-size:0.8rem; text-align:center; border:1px solid #ccc; border-radius:4px;" onchange="updateStudentPass('${s}', this.value)"></div>`; }); }
function updateStudentPass(name, newPass) { studentPassObj[name] = newPass; syncData(); }
function addNewBook() { let name = stripRating(document.getElementById('newBookInput').value); if(!name) return alert("Kitap adı girin."); let page = prompt("Sayfa sayısı:", "100"); if(!books.includes(name)) { books.push(name); books.sort(); } bookPages[name] = parseInt(page) || 0; document.getElementById('newBookInput').value = ""; updateUI(); syncData(); }
function delSingleBook(name) { if(confirm(name + " kitabı silinsin mi?")) { books = books.filter(b => b !== name); delete bookPages[name]; updateUI(); syncData(); } }
function copyReport() { navigator.clipboard.writeText(document.getElementById('reportOutput').innerText); alert("Kopyalandı!"); }
function populateDatalists() { 
    let sl = document.getElementById('studentList'); sl.innerHTML = ''; 
    let sLogin = document.getElementById('studentListLogin'); if(sLogin) sLogin.innerHTML = ''; 
    students.sort().forEach(s => { sl.innerHTML += `<option value="${s}">`; if(sLogin) sLogin.innerHTML += `<option value="${s}">`; }); 
    let bl = document.getElementById('bookList'); bl.innerHTML = ''; 
    books.sort().forEach(b => { 
        let key = normalizeStr(b);
        let stats = bookStatsMap[key];
        let rawAvg = (stats && stats.ratingCount > 0) ? (stats.totalRating / stats.ratingCount) : 0;
        let avgScore = formatRating(rawAvg);
        let ratingStr = avgScore != 0 ? `⭐ ${avgScore} - ` : "";
        bl.innerHTML += `<option value="${ratingStr}${b}"></option>`;
    }); 
}
function resetAllData() { let p = prompt("TÜM VERİLERİ SİLMEK İÇİN ŞİFREYİ GİRİN:"); if(p === teacherPassword) { if(confirm("Emin misiniz? Tüm öğrenciler, kitaplar ve kayıtlar silinecek!")) { students = []; books = []; records = []; bookPages = {}; studentPassObj={}; settings = { classTarget: 500, silverLimit: 3, goldLimit: 5 }; updateUI(); syncData(); alert("Sıfırlandı."); } } else { alert("Hatalı şifre!"); } }
function getMedals(count) { let goldCount = Math.floor(count / settings.goldLimit); let silverCount = Math.floor(count / settings.silverLimit); let medals = ""; for(let i=0; i<goldCount; i++) medals += "🥇"; for(let i=0; i<silverCount; i++) medals += "🥈"; return medals; }
function getRank(count) { if(count >= 40) return "💎 EFSANE"; if(count >= 35) return "🌍 Bilge Okur"; if(count >= 30) return "🎩 Edebiyat Ustası"; if(count >= 25) return "👑 Kütüphane Muhafızı"; if(count >= 20) return "🏹 Kelime Avcısı"; if(count >= 15) return "🚀 Bilgi Kaşifi"; if(count >= 10) return "📖 Kitap Kurdu"; if(count >= 5)  return "🥉 Okuma Çırağı"; return "🌱 Başlangıç"; }
function toggleStatsSort() { if(statsSortMode === 'book_desc') { statsSortMode = 'book_asc'; document.getElementById('sortBtnIcon').innerText = "Sırala: Kitap ⬆"; } else if (statsSortMode === 'book_asc') { statsSortMode = 'page_desc'; document.getElementById('sortBtnIcon').innerText = "Sırala: Sayfa ⬇"; } else { statsSortMode = 'book_desc'; document.getElementById('sortBtnIcon').innerText = "Sırala: Kitap ⬇"; } renderRanking(); }
function renderRanking() { let counts = {}; let pageCounts = {}; records.forEach(r => { if(r.status === "İade Etti") { counts[r.student] = (counts[r.student]||0)+1; let p = parseInt(bookPages[r.book]) || 0; pageCounts[r.student] = (pageCounts[r.student]||0) + p; } }); let sorted = Object.keys(counts).map(k => ({n:k, c:counts[k], p:pageCounts[k]})); if(sorted.length > 0) { let topReader = sorted.reduce((prev, current) => (prev.c > current.c) ? prev : current); document.getElementById('statTopReader').innerText = topReader.n; } else { document.getElementById('statTopReader').innerText = "-"; } if(statsSortMode === 'book_desc') sorted.sort((a,b) => b.c - a.c); else if(statsSortMode === 'book_asc') sorted.sort((a,b) => a.c - b.c); else if(statsSortMode === 'page_desc') sorted.sort((a,b) => b.p - a.p); let html = ""; sorted.forEach((s,i) => { let rank = getRank(s.c); let medals = getMedals(s.c); let highlight = (i === 0 && statsSortMode !== 'book_asc') ? "color:#f59e0b;" : "color:var(--text-sub);"; let rankNum = (i === sorted.length - 1 && sorted.length > 1) ? `<span style="color:#ef4444; font-size:0.7rem;">(Son)</span>` : `${i+1}.`; if (i === 0) rankNum = "👑"; html += `<div class="list-item"><div class="item-content"><span style="font-weight:bold; ${highlight} margin-right:10px; min-width:20px; display:inline-block;">${rankNum}</span><span style="font-weight:600;">${s.n}</span><div class="rank-info">${rank}</div><div class="medal-container">${medals}</div></div><div style="text-align:right;"><div style="font-weight:800; color:var(--primary); font-size:1.1rem;">${s.c} Kitap</div><div style="font-size:0.75rem; color:var(--text-sub); margin-top:2px;">${s.p.toLocaleString()} Sayfa</div></div></div>`; }); document.getElementById('rankingList').innerHTML = html; }

// --- YENİLENEN PANEL FONKSİYONU ---
function renderStudentPanel() {
    let myRecs = records.filter(r => r.student === loggedInStudent);
    let completedRecs = myRecs.filter(r => r.status === "İade Etti");
    let totalBooks = completedRecs.length;
    let totalPages = 0;
    completedRecs.forEach(r => totalPages += (parseInt(bookPages[r.book]) || 0));

    document.getElementById('stName').innerText = loggedInStudent;
    document.getElementById('stRank').innerText = getRank(totalBooks); 
    document.getElementById('stMedals').innerText = getMedals(totalBooks); 
    document.getElementById('stBookCount').innerText = totalBooks;
    document.getElementById('stPageCount').innerText = totalPages;

    renderSpaceJourney(totalBooks, 'studentSpaceJourney', 'studentJourneySvg');

    const listDiv = document.getElementById('studentMyBooksList');
    listDiv.innerHTML = "";
    if(myRecs.length === 0) listDiv.innerHTML = "<p style='text-align:center; opacity:0.6;'>Henüz bir macera başlamadı.</p>";
    
    myRecs.sort((a,b) => parseFloat(b.id) - parseFloat(a.id));

    myRecs.forEach(r => {
        let statusHtml = r.status === "Okuyor" ? `<span style="color:#2563eb; font-weight:bold;">Okuyorsun</span>` : `<span style="color:#10b981; font-weight:bold;">Teslim Ettin</span>`;
        let actionBtn = "";
        
        if(r.status === "İade Etti") {
            if(!r.rating) {
                // Henüz değerlendirilmemiş -> Standart Buton
                actionBtn = `<button class="btn-comment" onclick="studentRateBook('${r.id}')">Değerlendir</button>`;
            } else {
                // Değerlendirilmiş -> PUAN GÖSTER + YEŞİL BUTON
                actionBtn = `
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:3px;">
                    <span style="font-size:0.9rem; color:#f59e0b; font-weight:bold; margin-right:2px;">Puanın: ${r.rating}/5 ⭐</span>
                    <button onclick="studentRateBook('${r.id}')" style="
                        background-color: #10b981; 
                        color: white; 
                        border: none; 
                        padding: 5px 12px; 
                        border-radius: 15px; 
                        font-size: 0.8rem; 
                        cursor: pointer; 
                        box-shadow: 0 2px 5px rgba(16, 185, 129, 0.3);
                        display:flex; align-items:center; gap:5px;
                    ">
                        <i class="fas fa-check"></i> Düzenle
                    </button>
                </div>`;
            }
        }
        listDiv.innerHTML += `<div class="list-item"><div class="item-content"><h4>${r.book}</h4><p>${r.date} • ${statusHtml}</p></div>${actionBtn}</div>`;
    });
}

function deleteRecord(id) { 
    if(confirm("DİKKAT: Bu işlemi geri alamazsınız!\n\nBu kaydı silmek istediğinizden emin misiniz? Sadece yanlışlıkla yapılan işlemleri iptal etmek için kullanın.")) { 
        records = records.filter(r => String(r.id) !== String(id)); 
        updateUI(); 
        syncData(); 
    }
}function printCertificate() {
    const s = document.getElementById('reportStudentInput').value.trim().toLocaleUpperCase('tr-TR'); 
    if(!s) return alert("Lütfen önce bir öğrenci seçin."); 
    let myRecs = records.filter(r => r.student === s && r.status === "İade Etti"); 
    let totalP = 0; 
    myRecs.forEach(r => totalP += (parseInt(bookPages[r.book])||0)); 
    let html = `
    <html>
    <head>
        <meta charset="utf-8">
        <title>KİTAP KURDU BELGESİ</title>
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
                font-family: 'Arial Black', Impact, sans-serif;
                font-size: 4rem; font-weight: 900; color: #1e3a8a;
                letter-spacing: 2px;
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
                <div class="title">KİTAP KURDU BELGESİ</div>
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

function resetAllData() { let p = prompt("TÜM VERİLERİ SİLMEK İÇİN ŞİFREYİ GİRİN:"); if(p === teacherPassword) { if(confirm("Emin misiniz? Tüm öğrenciler, kitaplar ve kayıtlar silinecek!")) { students = []; books = []; records = []; bookPages = {}; studentPassObj={}; settings = { classTarget: 500, silverLimit: 3, goldLimit: 5 }; updateUI(); syncData(); alert("Sıfırlandı."); } } else { alert("Hatalı şifre!"); } }
function getMedals(count) { let goldCount = Math.floor(count / settings.goldLimit); let silverCount = Math.floor(count / settings.silverLimit); let medals = ""; for(let i=0; i<goldCount; i++) medals += "🥇"; for(let i=0; i<silverCount; i++) medals += "🥈"; return medals; }
function getRank(count) { if(count >= 40) return "💎 EFSANE"; if(count >= 35) return "🌍 Bilge Okur"; if(count >= 30) return "🎩 Edebiyat Ustası"; if(count >= 25) return "👑 Kütüphane Muhafızı"; if(count >= 20) return "🏹 Kelime Avcısı"; if(count >= 15) return "🚀 Bilgi Kaşifi"; if(count >= 10) return "📖 Kitap Kurdu"; if(count >= 5)  return "🥉 Okuma Çırağı"; return "🌱 Başlangıç"; }
function toggleStatsSort() { if(statsSortMode === 'book_desc') { statsSortMode = 'book_asc'; document.getElementById('sortBtnIcon').innerText = "Sırala: Kitap ⬆"; } else if (statsSortMode === 'book_asc') { statsSortMode = 'page_desc'; document.getElementById('sortBtnIcon').innerText = "Sırala: Sayfa ⬇"; } else { statsSortMode = 'book_desc'; document.getElementById('sortBtnIcon').innerText = "Sırala: Kitap ⬇"; } renderRanking(); }
function renderRanking() { let counts = {}; let pageCounts = {}; records.forEach(r => { if(r.status === "İade Etti") { counts[r.student] = (counts[r.student]||0)+1; let p = parseInt(bookPages[r.book]) || 0; pageCounts[r.student] = (pageCounts[r.student]||0) + p; } }); let sorted = Object.keys(counts).map(k => ({n:k, c:counts[k], p:pageCounts[k]})); if(sorted.length > 0) { let topReader = sorted.reduce((prev, current) => (prev.c > current.c) ? prev : current); document.getElementById('statTopReader').innerText = topReader.n; } else { document.getElementById('statTopReader').innerText = "-"; } if(statsSortMode === 'book_desc') sorted.sort((a,b) => b.c - a.c); else if(statsSortMode === 'book_asc') sorted.sort((a,b) => a.c - b.c); else if(statsSortMode === 'page_desc') sorted.sort((a,b) => b.p - a.p); let html = ""; sorted.forEach((s,i) => { let rank = getRank(s.c); let medals = getMedals(s.c); let highlight = (i === 0 && statsSortMode !== 'book_asc') ? "color:#f59e0b;" : "color:var(--text-sub);"; let rankNum = (i === sorted.length - 1 && sorted.length > 1) ? `<span style="color:#ef4444; font-size:0.7rem;">(Son)</span>` : `${i+1}.`; if (i === 0) rankNum = "👑"; html += `<div class="list-item"><div class="item-content"><span style="font-weight:bold; ${highlight} margin-right:10px; min-width:20px; display:inline-block;">${rankNum}</span><span style="font-weight:600;">${s.n}</span><div class="rank-info">${rank}</div><div class="medal-container">${medals}</div></div><div style="text-align:right;"><div style="font-weight:800; color:var(--primary); font-size:1.1rem;">${s.c} Kitap</div><div style="font-size:0.75rem; color:var(--text-sub); margin-top:2px;">${s.p.toLocaleString()} Sayfa</div></div></div>`; }); document.getElementById('rankingList').innerHTML = html; }

// --- YENİLENEN PANEL FONKSİYONU ---
function renderStudentPanel() {
    let myRecs = records.filter(r => r.student === loggedInStudent);
    let completedRecs = myRecs.filter(r => r.status === "İade Etti");
    let totalBooks = completedRecs.length;
    let totalPages = 0;
    completedRecs.forEach(r => totalPages += (parseInt(bookPages[r.book]) || 0));

    document.getElementById('stName').innerText = loggedInStudent;
    document.getElementById('stRank').innerText = getRank(totalBooks); 
    document.getElementById('stMedals').innerText = getMedals(totalBooks); 
    document.getElementById('stBookCount').innerText = totalBooks;
    document.getElementById('stPageCount').innerText = totalPages;

    renderSpaceJourney(totalBooks, 'studentSpaceJourney', 'studentJourneySvg');

    const listDiv = document.getElementById('studentMyBooksList');
    listDiv.innerHTML = "";
    if(myRecs.length === 0) listDiv.innerHTML = "<p style='text-align:center; opacity:0.6;'>Henüz bir macera başlamadı.</p>";
    
    myRecs.sort((a,b) => parseFloat(b.id) - parseFloat(a.id));

    myRecs.forEach(r => {
        let statusHtml = r.status === "Okuyor" ? `<span style="color:#2563eb; font-weight:bold;">Okuyorsun</span>` : `<span style="color:#10b981; font-weight:bold;">Teslim Ettin</span>`;
        let actionBtn = "";
        
        if(r.status === "İade Etti") {
            if(!r.rating) {
                // Henüz değerlendirilmemiş -> Standart Buton
                actionBtn = `<button class="btn-comment" onclick="studentRateBook('${r.id}')">Değerlendir</button>`;
            } else {
                // Değerlendirilmiş -> PUAN GÖSTER + YEŞİL BUTON
                actionBtn = `
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:3px;">
                    <span style="font-size:0.9rem; color:#f59e0b; font-weight:bold; margin-right:2px;">Puanın: ${r.rating}/5 ⭐</span>
                    <button onclick="studentRateBook('${r.id}')" style="
                        background-color: #10b981; 
                        color: white; 
                        border: none; 
                        padding: 5px 12px; 
                        border-radius: 15px; 
                        font-size: 0.8rem; 
                        cursor: pointer; 
                        box-shadow: 0 2px 5px rgba(16, 185, 129, 0.3);
                        display:flex; align-items:center; gap:5px;
                    ">
                        <i class="fas fa-check"></i> Düzenle
                    </button>
                </div>`;
            }
        }
        listDiv.innerHTML += `<div class="list-item"><div class="item-content"><h4>${r.book}</h4><p>${r.date} • ${statusHtml}</p></div>${actionBtn}</div>`;
    });
}

function deleteRecord(id) { 
    if(confirm("DİKKAT: Bu işlemi geri alamazsınız!\n\nBu kaydı silmek istediğinizden emin misiniz? Sadece yanlışlıkla yapılan işlemleri iptal etmek için kullanın.")) { 
        records = records.filter(r => String(r.id) !== String(id)); 
        updateUI(); 
        syncData(); 
    }
}
