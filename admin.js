// ===== Admin Panel Module =====
var AdminPanel = (function() {
    'use strict';

    // ===== DOM refs (set in init) =====
    var adminPage = null;
    var uploadArea = null;
    var fileInput = null;
    var uploadForm = null;
    var uploadNameInput = null;
    var uploadDescInput = null;
    var uploadIconInput = null;
    var uploadPreview = null;
    var uploadConfirmBtn = null;
    var uploadCancelBtn = null;
    var bankListEl = null;

    // ===== State =====
    var allBanks = [];
    var pendingUpload = null;
    var editingBankId = null;

    // ===== Auth — SHA-256 hashed, salted =====
    var ADMIN_SALT = 'quiz_admin_salt_v1';
    var ADMIN_PWD_HASH = '3b091b1374484e2c1a5e5abae15faecde3370068f0f12b08789220bc25777620';
    var ADMIN_SESSION_TOKEN = '3b091b1374484e2c';

    // ===== Utilities =====
    var escapeHtml = (typeof esc === 'function') ? esc : function(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    };

    function generateId(name) {
        var base = 'custom-' + Date.now().toString(36);
        var id = base;
        var counter = 1;
        for (var i = 0; i < allBanks.length; i++) {
            if (allBanks[i].id === id) {
                id = base + '-' + counter;
                counter++;
                i = -1;
            }
        }
        return id;
    }

    function showAdminError(prefix, err) {
        var msg = (err && err.message) ? err.message : '未知错误';
        showToast(prefix + ': ' + msg, 'error', 5000);
    }

    // SHA-256 hash helper (uses Web Crypto API, async)
    function sha256(text) {
        var data = new TextEncoder().encode(text);
        return crypto.subtle.digest('SHA-256', data).then(function(buf) {
            var arr = new Uint8Array(buf);
            var hex = '';
            for (var i = 0; i < arr.length; i++) {
                hex += ('0' + arr[i].toString(16)).slice(-2);
            }
            return hex;
        });
    }

    // Constant-time string comparison (prevents timing attacks)
    function constantTimeEqual(a, b) {
        if (a.length !== b.length) return false;
        var result = 0;
        for (var i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }

    // ===== Auth =====
    function checkAuth(callback) {
        var token = sessionStorage.getItem('admin_auth');
        if (token && constantTimeEqual(token, ADMIN_SESSION_TOKEN)) {
            if (callback) callback();
            return;
        }
        showPwdModal(callback);
    }

    function showPwdModal(callback) {
        var modal = document.getElementById('admin-pwd-modal');
        var input = document.getElementById('admin-pwd-input');
        var error = document.getElementById('admin-pwd-error');
        var okBtn = document.getElementById('admin-pwd-ok');
        var cancelBtn = document.getElementById('admin-pwd-cancel');
        if (!modal) { if (callback) callback(); return; }

        modal.classList.remove('hidden');
        if (input) { input.value = ''; setTimeout(function() { input.focus(); }, 100); }
        if (error) error.classList.add('hidden');

        function onOk() {
            var pwd = input ? input.value : '';
            sha256(pwd + ADMIN_SALT).then(function(hash) {
                if (constantTimeEqual(hash, ADMIN_PWD_HASH)) {
                    sessionStorage.setItem('admin_auth', ADMIN_SESSION_TOKEN);
                    modal.classList.add('hidden');
                    cleanup();
                    if (callback) callback();
                } else {
                    if (error) { error.classList.remove('hidden'); error.textContent = '密码错误，请重试'; }
                    if (input) { input.value = ''; input.focus(); }
                }
            });
        }
        function onCancel() {
            modal.classList.add('hidden');
            cleanup();
            if (typeof Router !== 'undefined') Router.navigate('/');
        }
        function onKey(e) {
            if (e.key === 'Enter') onOk();
            if (e.key === 'Escape') onCancel();
        }
        var overlay = modal.querySelector('.modal-overlay');
        function cleanup() {
            if (okBtn) okBtn.removeEventListener('click', onOk);
            if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
            if (input) input.removeEventListener('keydown', onKey);
            if (overlay) overlay.removeEventListener('click', onCancel);
        }

        if (okBtn) okBtn.addEventListener('click', onOk);
        if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
        if (input) input.addEventListener('keydown', onKey);
        if (overlay) overlay.addEventListener('click', onCancel);
    }

    // ===== Page Navigation =====
    function showAdminPage() {
        checkAuth(function() {
            doShowAdminPage();
        });
    }

    function doShowAdminPage() {
        var selectPage = document.getElementById('select-page');
        var quizPage = document.getElementById('quiz-page');
        if (selectPage) selectPage.classList.add('hidden');
        if (quizPage) quizPage.classList.add('hidden');
        if (adminPage) adminPage.classList.remove('hidden');
        updateHeaderForAdmin();
        loadAndRender();
    }

    function updateHeaderForAdmin() {
        var headerLeft = document.querySelector('.header-left');
        var headerStats = document.getElementById('header-stats');
        var headerActions = document.querySelector('.header-actions');
        if (headerLeft) {
            headerLeft.innerHTML = '<h1>管理员面板</h1>' +
                '<span class="header-subtitle">管理题库</span>';
        }
        if (headerStats) headerStats.style.display = 'none';
        if (headerActions) {
            var btns = headerActions.querySelectorAll('button');
            for (var i = 0; i < btns.length; i++) {
                btns[i].style.display = 'none';
            }
            // Show back button
            var backBtn = document.getElementById('back-to-list-btn');
            if (backBtn) {
                backBtn.classList.remove('hidden');
                backBtn.style.display = '';
            }
            // Show theme toggle
            var themeBtn = document.getElementById('theme-toggle');
            if (themeBtn) themeBtn.style.display = '';
        }
    }

    // ===== Skeleton Loading =====
    function showBankListSkeleton() {
        if (!bankListEl) return;
        bankListEl.innerHTML = '';
        for (var i = 0; i < 3; i++) {
            var item = document.createElement('div');
            item.className = 'admin-bank-item admin-bank-skeleton';
            item.innerHTML =
                '<div class="admin-bank-info">' +
                    '<span class="admin-bank-icon skeleton-icon"></span>' +
                    '<div class="admin-bank-meta">' +
                        '<div class="skeleton-lines">' +
                            '<div class="skeleton-line skeleton-line-lg"></div>' +
                            '<div class="skeleton-line skeleton-line-sm"></div>' +
                            '<div class="skeleton-line skeleton-line-xs"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="admin-bank-actions">' +
                    '<span class="admin-btn" style="visibility:hidden"></span>' +
                '</div>';
            bankListEl.appendChild(item);
        }
    }

    // ===== Data Loading =====
    function loadAndRender() {
        showBankListSkeleton();
        QuizDB.listBanks().then(function(banks) {
            allBanks = banks || [];
            renderBankList();
        }).catch(function(e) {
            if (bankListEl) bankListEl.innerHTML = '<div class="admin-empty">加载失败</div>';
            showAdminError('加载管理员数据失败', e);
        });
    }

    // ===== Upload =====
    function bindUploadEvents() {
        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });

        fileInput.addEventListener('change', function() {
            if (fileInput.files && fileInput.files[0]) {
                handleFile(fileInput.files[0]);
            }
        });

        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('admin-upload-dragover');
        });
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('admin-upload-dragover');
        });
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('admin-upload-dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        if (uploadConfirmBtn) {
            uploadConfirmBtn.addEventListener('click', confirmUpload);
        }
        if (uploadCancelBtn) {
            uploadCancelBtn.addEventListener('click', cancelUpload);
        }

    }

    function handleFile(file) {
        var ext = file.name.split('.').pop().toLowerCase();
        if (['md', 'txt', 'markdown', 'json'].indexOf(ext) === -1) {
            showToast('请上传 .md、.txt 或 .json 格式的文件', 'error');
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            var content = e.target.result;
            if (ext === 'json') {
                handleJsonFile(content, file.name);
            } else {
                handleMdFile(content, file.name);
            }
        };
        reader.readAsText(file);
    }

    function handleMdFile(content, fileName) {
        var stats = QuizDB.computeTypeStats(content);
        if (stats.total === 0) {
            showToast('未能识别出有效题目，请确保每题使用 "##/### 数字." 或 "### 题目一：" 这类标题', 'error', 5000);
            return;
        }
        pendingUpload = { mdContent: content, stats: stats, fileName: fileName, meta: null };
        showUploadForm();
    }

    function handleJsonFile(content, fileName) {
        var data;
        try { data = JSON.parse(content); }
        catch (e) { showToast('JSON 解析失败: ' + e.message, 'error'); return; }

        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
            showToast('JSON 文件中未找到有效的 questions 数组', 'error', 5000);
            return;
        }

        var md = jsonToMarkdown(data);
        var stats = QuizDB.computeTypeStats(md);
        if (stats.total === 0) {
            showToast('JSON 转换后未能识别出有效题目', 'error');
            return;
        }

        var meta = {
            name: data.name || '',
            description: data.description || '',
            icon: data.icon || '📚'
        };
        pendingUpload = { mdContent: md, stats: stats, fileName: fileName, meta: meta };
        showUploadForm();
    }

    // JSON → Markdown converter
    function jsonToMarkdown(data) {
        var LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var md = '';
        if (data.name) md += '# ' + data.name + '\n\n';
        if (data.description) md += '> ' + data.description + '\n\n';

        for (var i = 0; i < data.questions.length; i++) {
            var q = data.questions[i];
            if (!q.question) continue;
            md += '## ' + (i + 1) + '. ' + q.question + '\n\n';

            if (q.options) {
                if (Array.isArray(q.options)) {
                    for (var j = 0; j < q.options.length && j < 26; j++) {
                        md += '- ' + LABELS[j] + '. ' + q.options[j] + '\n';
                    }
                } else if (typeof q.options === 'object') {
                    for (var key in q.options) {
                        if (q.options.hasOwnProperty(key)) {
                            md += '- ' + key + '. ' + q.options[key] + '\n';
                        }
                    }
                }
                md += '\n';
            }

            if (q.answer !== undefined && q.answer !== null && q.answer !== '') {
                md += '**答案：** ' + q.answer + '\n\n';
            }
            if (q.explanation) {
                md += '**解析：** ' + q.explanation + '\n\n';
            }
        }
        return md;
    }

    function showUploadForm() {
        if (!pendingUpload) return;
        uploadArea.classList.add('hidden');
        uploadForm.classList.remove('hidden');

        var meta = pendingUpload.meta || {};
        var baseName = pendingUpload.fileName.replace(/\.(md|txt|markdown|json)$/i, '');
        if (uploadNameInput) uploadNameInput.value = meta.name || baseName;
        if (uploadDescInput) uploadDescInput.value = meta.description || ('共 ' + pendingUpload.stats.total + ' 道题');
        if (uploadIconInput) uploadIconInput.value = meta.icon || '📚';

        if (uploadPreview) {
            var typeNames = {
                single: '单选', multiple: '多选', tf: '判断',
                fill: '填空', short: '简答', analysis: '分析'
            };
            var html = '<div class="admin-preview-stats">';
            html += '<span class="admin-preview-total">共 ' + pendingUpload.stats.total + ' 题</span>';
            for (var t in pendingUpload.stats.types) {
                if (pendingUpload.stats.types[t] > 0 && typeNames[t]) {
                    html += '<span class="type-chip">' + typeNames[t] + ' ' + pendingUpload.stats.types[t] + '</span>';
                }
            }
            html += '</div>';
            uploadPreview.innerHTML = html;
        }
    }

    function confirmUpload() {
        if (!pendingUpload) return;
        clearAllFieldErrors(uploadForm);

        var name = uploadNameInput ? uploadNameInput.value.trim() : '';
        if (!name) {
            if (uploadNameInput) showFieldError(uploadNameInput, '请输入题库名称');
            return;
        }

        var desc = uploadDescInput ? uploadDescInput.value.trim() : '';
        var icon = uploadIconInput ? uploadIconInput.value.trim() : '📚';

        // Loading state
        if (uploadConfirmBtn) uploadConfirmBtn.classList.add('loading');

        var bankData = {
            id: generateId(name),
            name: name,
            description: desc,
            icon: icon || '📚',
            source: 'custom',
            mdContent: pendingUpload.mdContent,
            questionCount: pendingUpload.stats.total,
            typeStats: pendingUpload.stats.types,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        QuizDB.saveCustomBank(bankData).then(function() {
            if (uploadConfirmBtn) uploadConfirmBtn.classList.remove('loading');
            showToast('题库「' + name + '」上传成功', 'success');
            cancelUpload();
            loadAndRender();
        }).catch(function(e) {
            if (uploadConfirmBtn) uploadConfirmBtn.classList.remove('loading');
            showToast('保存失败: ' + e.message, 'error', 5000);
        });
    }

    function cancelUpload() {
        pendingUpload = null;
        if (uploadArea) uploadArea.classList.remove('hidden');
        if (uploadForm) uploadForm.classList.add('hidden');
        if (fileInput) fileInput.value = '';
    }

    // ===== Bank List =====
    function renderBankList() {
        if (!bankListEl) return;
        bankListEl.innerHTML = '';
        if (allBanks.length === 0) {
            bankListEl.innerHTML = '<div class="admin-empty">暂无题库</div>';
            return;
        }
        for (var i = 0; i < allBanks.length; i++) {
            bankListEl.appendChild(createBankItem(allBanks[i]));
        }
    }

    function createBankItem(bank) {
        var item = document.createElement('div');
        item.className = 'admin-bank-item';
        item.setAttribute('data-bank-id', bank.id);

        var isCustom = bank.source === 'custom';
        var sourceBadge = isCustom
            ? '<span class="admin-badge admin-badge-custom">自定义</span>'
            : '<span class="admin-badge admin-badge-builtin">内置</span>';

        var typeNames = {
            single: '单选', multiple: '多选', tf: '判断',
            fill: '填空', short: '简答', analysis: '分析'
        };
        var typesHtml = '';
        if (bank.typeStats) {
            for (var t in bank.typeStats) {
                if (bank.typeStats[t] > 0 && typeNames[t]) {
                    typesHtml += '<span class="type-chip">' + typeNames[t] + ' ' + bank.typeStats[t] + '</span>';
                }
            }
        }

        item.innerHTML =
            '<div class="admin-bank-info">' +
                '<span class="admin-bank-icon">' + (bank.icon || '📚') + '</span>' +
                '<div class="admin-bank-meta">' +
                    '<div class="admin-bank-name-row">' +
                        '<strong class="admin-bank-name">' + escapeHtml(bank.name) + '</strong>' +
                        sourceBadge +
                    '</div>' +
                    '<div class="admin-bank-desc">' + escapeHtml(bank.description || '') + '</div>' +
                    '<div class="admin-bank-count">共 ' + (bank.questionCount || 0) + ' 题</div>' +
                    '<div class="admin-bank-types">' + typesHtml + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="admin-bank-actions">' +
                '<button class="admin-btn admin-btn-edit" data-action="edit" title="编辑">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                '</button>' +
                (isCustom ? '<button class="admin-btn admin-btn-delete" data-action="delete" title="删除"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : '') +
            '</div>';

        var editBtn = item.querySelector('[data-action="edit"]');
        var deleteBtn = item.querySelector('[data-action="delete"]');

        if (editBtn) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                startEditBank(bank.id, item);
            });
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                showConfirm('确认删除', '确定要删除题库「' + bank.name + '」吗？此操作不可恢复。', function() {
                    QuizDB.deleteCustomBank(bank.id).then(function() {
                        return QuizDB.deleteProgress(bank.id);
                    }).then(function() {
                        showToast('题库「' + bank.name + '」已删除', 'success');
                        loadAndRender();
                    }).catch(function(err) {
                        showAdminError('删除题库失败', err);
                    });
                });
            });
        }
        return item;
    }

    // ===== Inline Bank Editing =====
    function startEditBank(bankId, itemEl) {
        if (editingBankId === bankId) return;
        editingBankId = bankId;

        var bank = null;
        for (var i = 0; i < allBanks.length; i++) {
            if (allBanks[i].id === bankId) { bank = allBanks[i]; break; }
        }
        if (!bank) return;

        var form = document.createElement('div');
        form.className = 'admin-edit-form';
        form.innerHTML =
            '<div class="admin-form-row">' +
                '<div class="admin-form-group">' +
                    '<label>名称</label>' +
                    '<input type="text" class="admin-input" id="edit-name-' + bankId + '" value="' + escapeHtml(bank.name) + '">' +
                '</div>' +
                '<div class="admin-form-group admin-form-icon">' +
                    '<label>图标</label>' +
                    '<input type="text" class="admin-input" id="edit-icon-' + bankId + '" value="' + escapeHtml(bank.icon || '📚') + '" maxlength="4">' +
                '</div>' +
            '</div>' +
            '<div class="admin-form-group">' +
                '<label>描述</label>' +
                '<input type="text" class="admin-input" id="edit-desc-' + bankId + '" value="' + escapeHtml(bank.description || '') + '">' +
            '</div>' +
            '<div class="admin-form-actions">' +
                '<button class="btn-nav admin-edit-cancel">取消</button>' +
                '<button class="btn-submit admin-edit-save">保存</button>' +
            '</div>';

        itemEl.innerHTML = '';
        itemEl.appendChild(form);

        var saveBtn = form.querySelector('.admin-edit-save');
        var cancelBtn = form.querySelector('.admin-edit-cancel');

        saveBtn.addEventListener('click', function() {
            var newName = document.getElementById('edit-name-' + bankId).value.trim();
            var newDesc = document.getElementById('edit-desc-' + bankId).value.trim();
            var newIcon = document.getElementById('edit-icon-' + bankId).value.trim();

            if (!newName) {
                var nameInput = document.getElementById('edit-name-' + bankId);
                if (nameInput) showFieldError(nameInput, '名称不能为空');
                return;
            }
            saveBankMeta(bankId, bank.source === 'custom', {
                name: newName,
                description: newDesc,
                icon: newIcon || '📚'
            });
        });

        cancelBtn.addEventListener('click', function() {
            editingBankId = null;
            loadAndRender();
        });
    }

    function saveBankMeta(bankId, isCustom, meta) {
        if (isCustom) {
            return QuizDB.getCustomBank(bankId).then(function(bank) {
                if (!bank) throw new Error('题库不存在');
                bank.name = meta.name;
                bank.description = meta.description;
                bank.icon = meta.icon;
                bank.updatedAt = new Date().toISOString();
                return QuizDB.saveCustomBank(bank);
            }).then(function() {
                editingBankId = null;
                showToast('题库信息已更新', 'success');
                loadAndRender();
            }).catch(function(e) {
                showAdminError('更新题库信息失败', e);
            });
        } else {
            return QuizDB.saveBankMeta(bankId, meta).then(function() {
                editingBankId = null;
                showToast('题库信息已更新', 'success');
                loadAndRender();
            }).catch(function(e) {
                showAdminError('更新题库信息失败', e);
            });
        }
    }

    // ===== Init =====
    function init() {
        adminPage = document.getElementById('admin-page');
        uploadArea = document.getElementById('admin-upload-area');
        fileInput = document.getElementById('admin-file-input');
        uploadForm = document.getElementById('admin-upload-form');
        uploadNameInput = document.getElementById('admin-upload-name');
        uploadDescInput = document.getElementById('admin-upload-desc');
        uploadIconInput = document.getElementById('admin-upload-icon');
        uploadPreview = document.getElementById('admin-upload-preview');
        uploadConfirmBtn = document.getElementById('admin-upload-confirm');
        uploadCancelBtn = document.getElementById('admin-upload-cancel');
        bankListEl = document.getElementById('admin-bank-list');

        bindUploadEvents();
    }

    return {
        init: init,
        showAdminPage: showAdminPage
    };
})();
