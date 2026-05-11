// ===== Quiz Select Page =====
function getBankIconSVG(icon) {
    var icons = {
        'default': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
    };
    return icons[icon] || icons['default'];
}

var QuizSelect = (function() {
    'use strict';

    var selectPage = null;
    var banksContainer = null;
    var bankSearchInput = null;
    var bankSearchClear = null;
    var bankSearchCount = null;
    var bankSearchQuery = '';
    var allBanks = [];
    var bankSearchTimer = null;

    var escapeHtml = (typeof esc === 'function') ? esc : function(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    };

    function showSelectPage() {
        var quizPage = document.getElementById('quiz-page');
        var adminPage = document.getElementById('admin-page');
        if (quizPage) quizPage.classList.add('hidden');
        if (adminPage) adminPage.classList.add('hidden');
        if (selectPage) selectPage.classList.remove('hidden');
        updateHeaderForSelect();
        renderBankCards();
    }

    function updateHeaderForSelect() {
        var headerLeft = document.querySelector('.header-left');
        var headerStats = document.getElementById('header-stats');
        var headerActions = document.querySelector('.header-actions');
        if (headerLeft) {
            headerLeft.innerHTML = '<h1>题库刷题</h1>' +
                '<span class="header-subtitle">选择题库开始练习</span>';
        }
        if (headerStats) headerStats.style.display = 'none';
        if (headerActions) {
            var exportBtn = headerActions.querySelector('#export-btn');
            var importBtn = headerActions.querySelector('#import-btn');
            var importFile = headerActions.querySelector('#import-file');
            var sidebarToggle = headerActions.querySelector('#sidebar-toggle');
            var backBtn = headerActions.querySelector('#back-to-list-btn');
            if (exportBtn) exportBtn.style.display = 'none';
            if (importBtn) importBtn.style.display = 'none';
            if (importFile) importFile.style.display = 'none';
            if (sidebarToggle) sidebarToggle.style.display = 'none';
            if (backBtn) backBtn.classList.add('hidden');
            var adminBtn = headerActions.querySelector('#admin-btn');
            if (adminBtn) { adminBtn.classList.remove('hidden'); adminBtn.style.display = ''; }
        }
    }

    function loadBankProgress(bankId) {
        return QuizDB.getProgress(bankId).then(function(prog) {
            if (!prog) return { answered: 0, total: 0, pct: 0 };
            var answers = prog.answers || {};
            var answered = 0;
            for (var k in answers) {
                if (answers.hasOwnProperty(k)) answered++;
            }
            var total = 0;
            for (var i = 0; i < allBanks.length; i++) {
                if (allBanks[i].id === bankId) {
                    total = allBanks[i].questionCount || 0;
                    break;
                }
            }
            return {
                answered: answered,
                total: total,
                pct: total > 0 ? Math.round((answered / total) * 100) : 0
            };
        });
    }

    function createBankCard(bank) {
        var card = document.createElement('div');
        card.className = 'bank-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', '选择题库: ' + bank.name);

        var icon = bank.icon ? '<span class="bank-icon">' + bank.icon + '</span>' :
            '<span class="bank-icon">' + getBankIconSVG('default') + '</span>';

        var typesHtml = '';
        if (bank.typeStats) {
            var typeNames = {
                single: '单选', multiple: '多选', tf: '判断',
                fill: '填空', short: '简答', analysis: '分析'
            };
            for (var t in bank.typeStats) {
                if (bank.typeStats[t] > 0 && typeNames[t]) {
                    typesHtml += '<span class="type-chip">' + typeNames[t] + ' ' + bank.typeStats[t] + '</span>';
                }
            }
        }

        card.innerHTML =
            '<div class="bank-card-header">' +
                icon +
                '<div class="bank-info">' +
                    '<p class="bank-name">' + escapeHtml(bank.name) + '</p>' +
                    '<p class="bank-desc">' + escapeHtml(bank.description || '') + '</p>' +
                '</div>' +
            '</div>' +
            '<div class="bank-card-types">' + typesHtml + '</div>' +
            '<div class="bank-card-footer">' +
                '<span class="bank-count">共 ' + (bank.questionCount || 0) + ' 题</span>' +
                '<div class="bank-progress">' +
                    '<div class="progress-bar-mini"><div class="progress-bar-mini-fill" data-bank="' + bank.id + '" style="width:0%"></div></div>' +
                    '<span class="progress-text" data-bank-text="' + bank.id + '">0%</span>' +
                '</div>' +
            '</div>';

        card.addEventListener('click', function() {
            Router.navigate('quiz/' + bank.id);
        });
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                Router.navigate('quiz/' + bank.id);
            }
        });

        loadBankProgress(bank.id).then(function(prog) {
            var fill = card.querySelector('[data-bank="' + bank.id + '"]');
            var text = card.querySelector('[data-bank-text="' + bank.id + '"]');
            if (fill) fill.style.width = prog.pct + '%';
            if (text) text.textContent = prog.pct + '%';
        });

        return card;
    }

    function renderBankCards() {
        QuizDB.listBanks().then(function(banks) {
            allBanks = banks || [];
            filterAndRenderBanks();
        });
    }

    function filterAndRenderBanks() {
        if (!banksContainer) return;
        banksContainer.innerHTML = '';

        var query = bankSearchQuery.toLowerCase().trim();
        var filtered = allBanks.filter(function(bank) {
            if (!query) return true;
            var name = (bank.name || '').toLowerCase();
            var desc = (bank.description || '').toLowerCase();
            var typeStr = '';
            var typeNames = {
                single: '单选', multiple: '多选', tf: '判断',
                fill: '填空', short: '简答', analysis: '分析'
            };
            if (bank.typeStats) {
                for (var t in bank.typeStats) {
                    if (bank.typeStats[t] > 0 && typeNames[t]) {
                        typeStr += typeNames[t] + ' ';
                    }
                }
            }
            typeStr = typeStr.toLowerCase();
            return name.indexOf(query) !== -1 ||
                desc.indexOf(query) !== -1 ||
                typeStr.indexOf(query) !== -1;
        });

        if (bankSearchCount) {
            if (query) {
                bankSearchCount.textContent = filtered.length + ' 个结果';
                bankSearchCount.classList.remove('hidden');
            } else {
                bankSearchCount.classList.add('hidden');
            }
        }

        if (filtered.length === 0) {
            if (query) {
                banksContainer.innerHTML =
                    '<div class="banks-search-empty banks-empty">' +
                        '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                        '<p>没有找到匹配的题库</p>' +
                        '<p class="banks-empty-hint">请尝试其他关键词</p>' +
                    '</div>';
            } else {
                banksContainer.innerHTML =
                    '<div class="banks-empty">' +
                        '<p>暂无题库</p>' +
                        '<p class="banks-empty-hint">请添加题库文件后刷新页面</p>' +
                    '</div>';
            }
            return;
        }

        for (var i = 0; i < filtered.length; i++) {
            banksContainer.appendChild(createBankCard(filtered[i]));
        }
    }

    function bindBankSearchEvents() {
        if (!bankSearchInput) return;

        bankSearchInput.addEventListener('input', function() {
            clearTimeout(bankSearchTimer);
            bankSearchTimer = setTimeout(function() {
                bankSearchQuery = bankSearchInput.value;
                if (bankSearchClear) {
                    bankSearchClear.classList.toggle('hidden', !bankSearchQuery);
                }
                filterAndRenderBanks();
            }, 200);
        });

        if (bankSearchClear) {
            bankSearchClear.addEventListener('click', function() {
                bankSearchQuery = '';
                bankSearchInput.value = '';
                bankSearchClear.classList.add('hidden');
                if (bankSearchCount) bankSearchCount.classList.add('hidden');
                filterAndRenderBanks();
            });
        }
    }

    function init() {
        selectPage = document.getElementById('select-page');
        banksContainer = document.getElementById('banks-container');
        bankSearchInput = document.getElementById('bank-search-input');
        bankSearchClear = document.getElementById('bank-search-clear');
        bankSearchCount = document.getElementById('bank-search-count');
        bindBankSearchEvents();
    }

    return {
        init: init,
        showSelectPage: showSelectPage,
        renderBankCards: renderBankCards
    };
})();
