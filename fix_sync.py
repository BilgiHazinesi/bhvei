with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

# Replace syncData with debounced version
old_sync_logic = """function syncData() {
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
        settings: settings
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
}"""

new_sync_logic = """let syncTimeout = null;

function syncData() {
    const syncEl = document.getElementById('syncStatus');

    if(syncEl) {
        syncEl.style.opacity = "1";
        syncEl.innerHTML = `<i class="fas fa-save" style="color:#f59e0b;"></i> <span style="color:#f59e0b; font-weight:bold;">Sıraya Alındı...</span>`;
    }

    if (syncTimeout) {
        clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(() => {
        if(syncEl) {
            syncEl.innerHTML = `<i class="fas fa-spinner fa-spin" style="color:#ef4444;"></i> <span style="color:#ef4444; font-weight:bold;">Kaydediliyor...</span>`;
        }

        const payload = {
            students: students,
            studentPass: studentPassObj,
            books: books,
            bookPages: bookPages,
            records: records,
            settings: settings
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
    }, 1500); // 1.5 saniye bekle
}"""

content = content.replace(old_sync_logic, new_sync_logic)

with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(content)
