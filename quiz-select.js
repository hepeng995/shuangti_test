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
    var bankGroupTabs = null;
    var bankGroupFilter = '';

    // ===== Utility =====
    // Use shared esc() from quiz-core.js when available, fallback to DOM-based method
    var escapeHtml = (typeof esc === 'function') ? esc : function(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    };

    // ===== Group helpers =====

    // Get unique group names from bank list
    function getUniqueGroups() {
        var groups = [];
        for (var i = 0; i < allBanks.length; i++) {
            var g = allBanks[i].group || '';
            if (!g) g = '其他';
            if (groups.indexOf(g) === -1) groups.push(g);
        }
        groups.sort();
        return groups;
    }

    // Render group tab buttons
    function renderGroupTabs(groups) {
        if (!bankGroupTabs) return;

        // 0 or 1 group → hide tabs entirely
        if (groups.length <= 1) {
            bankGroupTabs.classList.add('hidden');
            return;
        }

        bankGroupTabs.classList.remove('hidden');
        bankGroupTabs.innerHTML = '';

        // "全部" tab
        var allTab = document.createElement('button');
        allTab.className = 'bank-group-tab' + (bankGroupFilter === '' ? ' active' : '');
        allTab.textContent = '全部';
        allTab.setAttribute('data-group', '');
        allTab.addEventListener('click', function() {
            bankGroupFilter = '';
            filterAndRenderBanks();
        });
        bankGroupTabs.appendChild(allTab);

        // One tab per group
        for (var i = 0; i < groups.length; i++) {
            var tab = document.createElement('button');
            tab.className = 'bank-group-tab' + (bankGroupFilter === groups[i] ? ' active' : '');
            tab.textContent = groups[i];
            tab.setAttribute('data-group', groups[i]);
            tab.addEventListener('click', function() {
                bankGroupFilter = this.getAttribute('data-group');
                filterAndRenderBanks();
            });
            bankGroupTabs.appendChild(tab);
        }
    }

    // Create group title element
    function createGroupTitle(groupName, count, questionCount) {
        var el = document.createElement('div');
        el.className = 'bank-group-title';
        el.innerHTML =
            '<h3>' + escapeHtml(groupName) + '</h3>' +
            '<span class="bank-group-count">' + count + ' 个题库' + (questionCount > 0 ? ' · ' + questionCount + ' 题' : '') + '</span>' +
            '<div class="bank-group-line"></div>';
        return el;
    }

    // ===== Page switching =====

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

    // ===== Data loading =====

    function loadBankProgress(bankId) {
        return QuizDB.getProgress(bankId).then(function(prog) {
            if (!prog) return { answered: 0, total: 0, pct: 0 };
            var answers = prog.answers || {};
            var answered = 0;
            for (var k in answers) {
                if (answers.hasOwnProperty(k)) answered++;
            }
            var total = 0;
            // Find bank to get questionCount
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

    // ===== Card rendering =====

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

        // Load progress asynchronously
        loadBankProgress(bank.id).then(function(prog) {
            var fill = card.querySelector('[data-bank="' + bank.id + '"]');
            var text = card.querySelector('[data-bank-text="' + bank.id + '"]');
            if (fill) fill.style.width = prog.pct + '%';
            if (text) text.textContent = prog.pct + '%';
        });

        return card;
    }

    // ===== Main render =====

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

        // Step 1: Search filter
        var filtered = allBanks.filter(function(bank) {
            if (!query) return true;
            var name = (bank.name || '').toLowerCase();
            var desc = (bank.description || '').toLowerCase();
            var group = (bank.group || '').toLowerCase();
            // Also match type names
            var typeStr = '';
            var typeNames = { single: '单选', multiple: '多选', tf: '判断', fill: '填空', short: '简答', analysis: '分析' };
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
                   group.indexOf(query) !== -1 ||
                   typeStr.indexOf(query) !== -1;
        });

        // Step 2: Group filter
        if (bankGroupFilter) {
            filtered = filtered.filter(function(bank) {
                var g = bank.group || '其他';
                return g === bankGroupFilter;
            });
        }

        // Step 3: Render group tabs
        var groups = getUniqueGroups();
        renderGroupTabs(groups);

        // Step 4: Update search count
        if (bankSearchCount) {
            if (query) {
                bankSearchCount.textContent = filtered.length + ' 个结果';
                bankSearchCount.classList.remove('hidden');
            } else {
                bankSearchCount.classList.add('hidden');
            }
        }

        // Step 5: Empty state
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

        // Step 6: Decide rendering mode
        var hasMultipleGroups = groups.length > 1;

        if (hasMultipleGroups) {
            // Grouped rendering
            var grouped = {};
            for (var i = 0; i < filtered.length; i++) {
                var g = filtered[i].group || '其他';
                if (!grouped[g]) grouped[g] = [];
                grouped[g].push(filtered[i]);
            }

            // Sort group names
            var groupNames = Object.keys(grouped).sort();

            for (var gi = 0; gi < groupNames.length; gi++) {
                var groupName = groupNames[gi];
                var groupBanks = grouped[groupName];

                // Group title
                var groupQuestionCount = 0;
                for (var qi = 0; qi < groupBanks.length; qi++) {
                    groupQuestionCount += (groupBanks[qi].questionCount || 0);
                }
                banksContainer.appendChild(createGroupTitle(groupName, groupBanks.length, groupQuestionCount));

                // Cards in this group
                for (var bi = 0; bi < groupBanks.length; bi++) {
                    banksContainer.appendChild(createBankCard(groupBanks[bi]));
                }
            }
        } else {
            // Flat rendering (0 or 1 group)
            for (var fi = 0; fi < filtered.length; fi++) {
                banksContainer.appendChild(createBankCard(filtered[fi]));
            }
        }
    }

    // ===== Search binding =====

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

    // ===== Init =====

    function init() {
        selectPage = document.getElementById('select-page');
        banksContainer = document.getElementById('banks-container');
        bankSearchInput = document.getElementById('bank-search-input');
        bankSearchClear = document.getElementById('bank-search-clear');
        bankSearchCount = document.getElementById('bank-search-count');
        bankGroupTabs = document.getElementById('bank-group-tabs');
        bindBankSearchEvents();
    }

    return {
        init: init,
        showSelectPage: showSelectPage,
        renderBankCards: renderBankCards
    };
})();
