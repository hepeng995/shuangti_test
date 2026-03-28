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

    function showSelectPage() {
        var quizPage = document.getElementById('quiz-page');
        if (quizPage) quizPage.classList.add('hidden');
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
        }
    }

    function renderBankCards() {
        if (!banksContainer) return;
        banksContainer.innerHTML =
            '<div class="bank-card bank-skeleton"><div class="bank-card-header"><span class="skeleton-icon"></span><div class="skeleton-lines"><div class="skeleton-line skeleton-line-lg"></div><div class="skeleton-line skeleton-line-sm"></div></div></div><div class="bank-card-types"><span class="skeleton-chip"></span><span class="skeleton-chip"></span><span class="skeleton-chip"></span></div><div class="bank-card-footer"><span class="skeleton-line skeleton-line-xs"></span><div class="skeleton-progress"></div></div></div>' +
            '<div class="bank-card bank-skeleton"><div class="bank-card-header"><span class="skeleton-icon"></span><div class="skeleton-lines"><div class="skeleton-line skeleton-line-lg"></div><div class="skeleton-line skeleton-line-sm"></div></div></div><div class="bank-card-types"><span class="skeleton-chip"></span><span class="skeleton-chip"></span></div><div class="bank-card-footer"><span class="skeleton-line skeleton-line-xs"></span><div class="skeleton-progress"></div></div></div>';

        QuizDB.listBanks().then(function(banks) {
            banksContainer.innerHTML = '';
            if (banks.length === 0) {
                banksContainer.innerHTML =
                    '<div class="banks-empty">' +
                        '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' +
                        '<p>暂无题库</p>' +
                        '<p class="banks-empty-hint">在项目目录中添加 bank-*.js 文件即可引入新题库</p>' +
                    '</div>';
                return;
            }

            banks.forEach(function(bank) {
                var card = createBankCard(bank);
                banksContainer.appendChild(card);
            });
        }).catch(function(e) {
            banksContainer.innerHTML = '<div class="banks-error">加载失败: ' + e.message + '</div>';
        });
    }

    function createBankCard(bank) {
        var card = document.createElement('div');
        card.className = 'bank-card';
        card.setAttribute('data-bank-id', bank.id);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', bank.name);

        var sourceLabel = '';
        if (bank.source === 'builtin') sourceLabel = '<span class="bank-badge badge-builtin">内置</span>';

        var typeChips = '';
        var typeLabels = {
            single: '单选', multiple: '多选', tf: '判断',
            fill: '填空', short: '简答', analysis: '分析'
        };
        if (bank.typeStats) {
            for (var t in bank.typeStats) {
                if (bank.typeStats[t] > 0 && typeLabels[t]) {
                    typeChips += '<span class="type-chip">' + typeLabels[t] + ' ' + bank.typeStats[t] + '</span>';
                }
            }
        }

        var progressId = 'progress-' + bank.id;

        card.innerHTML =
            '<div class="bank-card-header">' +
                '<span class="bank-icon">' + getBankIconSVG(bank.icon) + '</span>' +
                '<div class="bank-info">' +
                    '<h3 class="bank-name">' + escapeHtml(bank.name) + '</h3>' +
                    '<p class="bank-desc">' + escapeHtml(bank.description || '') + '</p>' +
                '</div>' +
                sourceLabel +
            '</div>' +
            '<div class="bank-card-types">' + typeChips + '</div>' +
            '<div class="bank-card-footer">' +
                '<span class="bank-count">共 ' + bank.questionCount + ' 题</span>' +
                '<div class="bank-progress" id="' + progressId + '"></div>' +
            '</div>';

        card.addEventListener('click', function() {
            Router.navigate('/quiz/' + bank.id);
        });
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                Router.navigate('/quiz/' + bank.id);
            }
        });

        loadBankProgress(bank.id, progressId);
        return card;
    }

    function loadBankProgress(bankId, containerId) {
        QuizDB.getProgress(bankId).then(function(prog) {
            var el = document.getElementById(containerId);
            if (!el) return;
            if (!prog || !prog.revealed) {
                el.innerHTML = '<span class="progress-text">尚未开始</span>';
                return;
            }
            var revealed = (prog.revealed || []).length;
            el.innerHTML =
                '<div class="progress-bar-mini">' +
                    '<div class="progress-bar-mini-fill" style="width:' + Math.round(revealed / (prog._totalQuestions || 1) * 100) + '%"></div>' +
                '</div>' +
                '<span class="progress-text">已做 ' + revealed + ' 题</span>';
        }).catch(function() {});
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function init() {
        selectPage = document.getElementById('select-page');
        banksContainer = document.getElementById('banks-container');
    }

    return {
        init: init,
        showSelectPage: showSelectPage,
        renderBankCards: renderBankCards
    };
})();
