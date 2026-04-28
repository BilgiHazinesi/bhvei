with open('kutuphane/kutuphane.html', 'r') as f:
    content = f.read()

old_lend_ui = """            <div id="tab-lend" class="section active">
                <div class="glass-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="margin:0; color:var(--primary);">Hızlı İşlem</h3>
                        <label style="font-size:0.85rem; color:var(--text-sub); display:flex; align-items:center; gap:5px; cursor:pointer;">
                            <input type="checkbox" id="allClassCheck" onchange="toggleAllClass()"> Tüm Sınıf
                        </label>
                    </div>
                    <p style="font-size:0.75rem; color:var(--text-sub); margin-bottom:10px; margin-top:-10px;">Çoklu işlem için isim/kitap arasına virgül (,) koyun.</p>
                    <div class="input-wrapper"><input type="text" list="studentList" id="studentInput" placeholder="Öğrenci Seçiniz (Ali, Ayşe...)" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" oninput="handleInput(this); renderHistory();" onchange="updateDynamicBookList()" onkeydown="if(event.key === 'Enter') document.getElementById('bookInput').focus();"><i class="fas fa-times-circle clear-btn" onclick="clearField('studentInput', () => { renderHistory(); updateDynamicBookList(); })"></i></div>
                    <div class="input-wrapper"><input type="text" list="bookList" id="bookInput" placeholder="Kitap Seçiniz..." autocomplete="off" autocorrect="off" spellcheck="false" oninput="handleInput(this)" onkeydown="if(event.key === 'Enter') lendBook();"><i class="fas fa-times-circle clear-btn" onclick="clearField('bookInput')"></i></div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" style="flex: 1;" onclick="lendBook()">Kitabı Ver</button>
                        <button class="btn btn-primary" style="flex: 1; background-color: #f59e0b;" onclick="bulkReturnBooks()">Kitabı Geri Al</button>
                    </div>
                </div>
                <div class="glass-panel">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><h4 style="margin:0; color:var(--text-main);">Son Hareketler</h4><span id="syncStatus" style="font-size:0.75rem; color:var(--text-sub); opacity:0.7;">Senkronize</span></div>
                    <div id="historyList"></div>
                </div>
            </div>"""

new_lend_ui = """            <div id="tab-lend" class="section active">
                <div class="glass-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="margin:0; color:var(--primary);"><i class="fas fa-bolt" style="color:#f59e0b;"></i> Öğrenci Masası</h3>
                        <button class="btn btn-danger" style="margin:0; padding:5px 10px; font-size:0.8rem;" onclick="clearStagingDesk()">Masayı Temizle</button>
                    </div>

                    <div class="input-wrapper" style="margin-bottom: 10px;">
                        <input type="text" list="studentList" id="stageStudentInput" placeholder="Sıradaki öğrencinin adını yaz ve Enter'a bas..." autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" onchange="stageStudentFromInput()" onkeydown="if(event.key === 'Enter') stageStudentFromInput();">
                    </div>

                    <div id="stagedStudentsContainer" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:15px; padding:10px; background:rgba(0,0,0,0.05); border-radius:8px; min-height:40px;">
                        <div style="color:var(--text-sub); font-size:0.8rem; width:100%; text-align:center; opacity:0.7;">Henüz öğrenci eklenmedi.</div>
                    </div>

                    <div id="deskActionArea" style="display:none;">
                        <div class="login-tabs" style="margin-bottom:10px;">
                            <button class="login-tab active" id="deskTabReturn" onclick="switchDeskTab('return')">İade Alınacaklar</button>
                            <button class="login-tab" id="deskTabLend" onclick="switchDeskTab('lend')">Yeni Kitap Ver</button>
                        </div>

                        <div id="deskReturnPanel">
                            <div id="deskReturnList" style="margin-bottom:10px; max-height:250px; overflow-y:auto; border:1px solid rgba(0,0,0,0.1); border-radius:8px; padding:5px;"></div>
                            <button class="btn btn-primary" style="background-color:#f59e0b;" onclick="startSequentialReturn()">Seçili Kitapları İade Al ve Puanla</button>
                        </div>

                        <div id="deskLendPanel" style="display:none;">
                            <p style="font-size:0.8rem; color:var(--text-sub); margin-bottom:5px;">Aşağıdaki listeye eklediğiniz kitaplar, seçili olan <b id="lendTargetCount">0</b> öğrenciye verilecektir.</p>
                            <div class="input-wrapper" style="margin-bottom:5px;">
                                <input type="text" list="bookList" id="stageBookInput" placeholder="Kitap Seç ve Enter'a bas..." autocomplete="off" autocorrect="off" spellcheck="false" onchange="stageBookFromInput()" onkeydown="if(event.key === 'Enter') stageBookFromInput();">
                            </div>
                            <div id="stagedBooksContainer" style="display:flex; flex-direction:column; gap:5px; margin-bottom:10px; padding:5px; background:rgba(59,130,246,0.05); border-radius:8px; min-height:30px;"></div>
                            <button class="btn btn-primary" onclick="submitStagedLends()">Kitapları Masadaki Öğrencilere Ver</button>
                        </div>
                    </div>
                </div>

                <div class="glass-panel">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><h4 style="margin:0; color:var(--text-main);">Tüm Hareketler</h4><span id="syncStatus" style="font-size:0.75rem; color:var(--text-sub); opacity:0.7;">Senkronize</span></div>
                    <div class="input-wrapper"><input type="text" list="studentList" id="studentInput" placeholder="Öğrenci Geçmişi Ara..." autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" oninput="handleInput(this); renderHistory();"><i class="fas fa-times-circle clear-btn" onclick="clearField('studentInput', () => { renderHistory(); })"></i></div>
                    <div id="historyList"></div>
                </div>
            </div>"""

content = content.replace(old_lend_ui, new_lend_ui)

with open('kutuphane/kutuphane.html', 'w') as f:
    f.write(content)
