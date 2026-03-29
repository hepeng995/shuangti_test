// ===== Application Logic =====
// Expose parseQuestions globally
var parseQuestions;
// Expose toggleTheme globally for bootstrap binding on select page
var toggleTheme;
var currentBankId = null;

(function() {
'use strict';

// ===== Type Constants =====
var TYPE_LABELS = {
    single: '单选题', multiple: '多选题', tf: '判断题',
    fill: '填空题', short: '简答题', analysis: '分析题'
};
var BADGE_CLASS = {
    single: '', multiple: 'type-multiple', tf: 'type-tf',
    fill: 'type-fill', short: 'type-short', analysis: 'type-analysis'
};
var SCORABLE = ['single', 'multiple', 'tf'];

// ===== State =====
var quizData = [];

var autoJumpTimer = null;
var _eventsBound = false;
var _stateLoaded = false;
var _confirmCallback = null;
var _initGeneration = 0;

// Document-level event handler references (for cleanup)
var _docKeyHandler = null;
var _docTouchStartHandler = null;
var _docTouchEndHandler = null;
var _searchTimer = null;

// Filtered list cache
var _filteredCache = null;

// Touch swipe state
var _touchStartX = 0, _touchStartY = 0, _touchStartTime = 0;

var state = {
    currentIndex: 0,
    answers: {},
    revealed: new Set(),
    filter: 'all',
    searchQuery: '',
    theme: (function() { try { return localStorage.getItem('quiz_theme') || 'light'; } catch(e) { return 'light'; } })(),
    redoMode: false,
    redoQuestionIds: new Set(),
    savedSnapshot: null,
    bookmarked: new Set(),
};

// ===== DOM Cache =====
var dom = {};

function initDom() {
    dom.badge = document.getElementById('question-badge');
    dom.number = document.getElementById('question-number');
    dom.text = document.getElementById('question-text');
    dom.options = document.getElementById('question-options');
    dom.showBtn = document.getElementById('show-answer-btn');
    dom.ansContent = document.getElementById('answer-content');
    dom.ansText = document.getElementById('correct-answer-text');
    dom.explArea = document.getElementById('explanation-area');
    dom.explText = document.getElementById('explanation-text');
    dom.prev = document.getElementById('prev-btn');
    dom.next = document.getElementById('next-btn');
    dom.progress = document.getElementById('nav-progress');
    dom.submitBtn = document.getElementById('submit-btn');
    dom.grid = document.getElementById('question-grid');
    dom.filters = document.getElementById('filter-tabs');
    dom.statAns = document.getElementById('stat-answered');
    dom.statTotal = document.getElementById('stat-total');
    dom.statOk = document.getElementById('stat-correct');
    dom.statWrong = document.getElementById('stat-incorrect');
    dom.modal = document.getElementById('result-modal');
    dom.summary = document.getElementById('result-summary');
    dom.review = document.getElementById('review-btn');
    dom.restart = document.getElementById('restart-btn');
    dom.sidebar = document.getElementById('sidebar');
    dom.sidebarToggle = document.getElementById('sidebar-toggle');
    dom.sidebarBackdrop = document.getElementById('sidebar-backdrop');
    dom.sidebarAnswered = document.getElementById('sidebar-answered');
    dom.sidebarCorrect = document.getElementById('sidebar-correct');
    dom.sidebarIncorrect = document.getElementById('sidebar-incorrect');
    dom.progressFill = document.getElementById('progress-fill');
    dom.progressPct = document.getElementById('progress-pct');
    dom.searchInput = document.getElementById('search-input');
    dom.themeToggle = document.getElementById('theme-toggle');
    dom.modalTitle = document.getElementById('modal-title');
    dom.bookmarkBtn = document.getElementById('bookmark-btn');
    dom.exportBtn = document.getElementById('export-btn');
    dom.importBtn = document.getElementById('import-btn');
    dom.importFile = document.getElementById('import-file');
    dom.searchClear = document.getElementById('search-clear');
    dom.confirmModal = document.getElementById('confirm-modal');
    dom.confirmMsg = document.getElementById('confirm-message');
    dom.confirmOk = document.getElementById('confirm-ok');
    dom.confirmCancel = document.getElementById('confirm-cancel');
    dom.card = document.getElementById('question-card');
    dom.navBar = document.querySelector('.navigation-bar');
    dom.appContainer = document.getElementById('app-container');
    dom.appHeader = document.getElementById('app-header');
    dom.searchCount = document.getElementById('search-count');
}

// ===== Utilities =====
var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s) {
    return String(s).replace(/[&<>"']/g, function(c) { return ESC_MAP[c]; });
}

function formatText(t) {
    if (!t) return '';
    return esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
}

var _savedScrollY = 0;
function lockScroll() {
    _savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _savedScrollY + 'px';
    document.body.style.width = '100%';
}
function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, _savedScrollY);
}
function setBgAriaHidden(hidden) {
    var el = dom.appContainer;
    var hdr = dom.appHeader;
    if (el) hidden ? el.setAttribute('aria-hidden', 'true') : el.removeAttribute('aria-hidden');
    if (hdr) hidden ? hdr.setAttribute('aria-hidden', 'true') : hdr.removeAttribute('aria-hidden');
}
function showConfirm(message, onConfirm) {
    dom.confirmMsg.textContent = message;
    _confirmCallback = onConfirm;
    dom.confirmModal.classList.remove('hidden');
    lockScroll();
    setBgAriaHidden(true);
    dom.confirmOk.focus();
}

// ===== Parser =====
function parseQuestions(md) {
    var qs = [];
    var blocks = md.split(/\n(?=## \d+[.、])/);
    for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i].trim();
        if (!b) continue;
        var hm = b.match(/^## (\d+)[.、]\s*([\s\S]*)/);
        if (!hm) continue;
        var num = parseInt(hm[1]);
        var content = hm[2];

        // Options
        var opts = [];
        var orx = /^- ([A-Z])[.、]\s*(.*)/gm;
        var om;
        while ((om = orx.exec(content)) !== null) {
            opts.push({ label: om[1], text: om[2].trim() });
        }

        // Answer
        var am = content.match(/\*\*答案[：:]\*\*\s*([\s\S]*?)(?=\n\*\*解析|$)/);
        var ans = am ? am[1].trim() : '';

        // Explanation
        var em = content.match(/\*\*解析[：:]\*\*\s*([\s\S]*)/);
        var expl = em ? em[1].trim() : '';

        // Question text
        var qt = content;
        var cutOpt = qt.search(/\n- [A-Z]/);
        var cutAns = qt.search(/\*\*答案/);
        var cut = qt.length;
        if (cutOpt > -1) cut = Math.min(cut, cutOpt);
        if (cutAns > -1) cut = Math.min(cut, cutAns);
        qt = qt.substring(0, cut).trim();

        // Type detection
        var type;
        if (opts.length > 0) {
            type = (/^[A-Z]{2,}$/.test(ans)) ? 'multiple' : 'single';
        } else if (/^(正确|错误)$/.test(ans)) {
            type = 'tf';
        } else if (/_{3,}/.test(qt)) {
            type = 'fill';
        } else if (ans.length > 200) {
            type = 'analysis';
        } else {
            type = 'short';
        }

        qs.push({
            id: num, type: type, text: qt,
            options: opts.length > 0 ? opts : null,
            answer: ans, explanation: expl
        });
    }
    return qs;
}
// Expose parseQuestions globally
window.parseQuestions = parseQuestions;
window.initQuizPage = initQuizPage;
window.destroyQuizPage = destroyQuizPage;
window.esc = esc;

// ===== Helpers =====
function invalidateFilterCache() {
    _filteredCache = null;
}

function getFiltered() {
    if (_filteredCache !== null) return _filteredCache;
    var list;
    if (state.redoMode) {
        var ids = state.redoQuestionIds;
        list = quizData.filter(function(q) { return ids.has(q.id); });
    } else {
        list = quizData;
        if (state.filter !== 'all') {
            if (state.filter === 'wrong') {
                list = list.filter(function(q) { return isRevealed(q) && isScorable(q) && !checkCorrect(q); });
            } else if (state.filter === 'bookmarked') {
                list = list.filter(function(q) { return state.bookmarked.has(q.id); });
            } else {
                list = list.filter(function(q) { return q.type === state.filter; });
            }
        }
    }
    if (state.searchQuery) {
        var kw = state.searchQuery.toLowerCase();
        list = list.filter(function(q) {
            return q.text.toLowerCase().indexOf(kw) !== -1 ||
                   (q.options && q.options.some(function(o) { return o.text.toLowerCase().indexOf(kw) !== -1; }));
        });
    }
    _filteredCache = list;
    return list;
}

function isScorable(q) {
    return SCORABLE.indexOf(q.type) !== -1;
}

function isRevealed(q) {
    return state.revealed.has(q.id);
}

// ===== Shared Stats Helper =====
function getStats() {
    var answered = 0, correct = 0, incorrect = 0, viewed = 0;
    var pool = state.redoMode
        ? quizData.filter(function(q) { return state.redoQuestionIds.has(q.id); })
        : quizData;
    pool.forEach(function(q) {
        if (!isRevealed(q)) return;
        answered++;
        if (isScorable(q)) {
            if (checkCorrect(q)) correct++;
            else incorrect++;
        } else {
            viewed++;
        }
    });
    return {
        answered: answered, correct: correct, incorrect: incorrect, viewed: viewed,
        total: pool.length,
        scorableTotal: pool.filter(function(q) { return isScorable(q); }).length
    };
}

function checkCorrect(q) {
    var ua = state.answers[q.id];
    if (ua === undefined || ua === '') return false;
    if (q.type === 'multiple') {
        return ua.split('').sort().join('') === q.answer.split('').sort().join('');
    }
    if (q.type === 'fill') {
        return ua.trim().replace(/\s+/g, '') === q.answer.trim().replace(/\s+/g, '');
    }
    return ua === q.answer;
}

// ===== Grid =====
function isHiddenByFilter(q) {
    if (state.redoMode) return !state.redoQuestionIds.has(q.id);
    if (state.filter === 'wrong') return !(isRevealed(q) && isScorable(q) && !checkCorrect(q));
    if (state.filter === 'bookmarked') return !state.bookmarked.has(q.id);
    if (state.filter !== 'all') return q.type !== state.filter;
    return false;
}

function renderGrid() {
    var html = '';
    quizData.forEach(function(q) {
        var cls = 'grid-btn';
        var hide = isHiddenByFilter(q);
        if (hide) cls += ' hidden-by-filter';
        if (state.bookmarked.has(q.id)) cls += ' bookmarked';
        if (isRevealed(q)) {
            if (isScorable(q)) {
                cls += checkCorrect(q) ? ' correct' : ' incorrect';
            } else {
                cls += ' revealed';
            }
        }
        var statusText = '';
        if (isRevealed(q)) {
            if (isScorable(q)) statusText = checkCorrect(q) ? ' 正确' : ' 错误';
            else statusText = ' 已查看';
        } else { statusText = ' 未答'; }
        var bmText = state.bookmarked.has(q.id) ? ' 已收藏' : '';
        html += '<button class="' + cls + '" data-id="' + q.id + '" aria-label="第' + q.id + '题 ' + (TYPE_LABELS[q.type] || '') + statusText + bmText + '">' + q.id + '</button>';
    });
    dom.grid.innerHTML = html;
    updateGridActive();
}

function updateGridActive() {
    var filtered = getFiltered();
    var cur = filtered[state.currentIndex];
    if (!cur) return;
    dom.grid.querySelectorAll('.grid-btn').forEach(function(btn) {
        btn.classList.toggle('active', parseInt(btn.dataset.id) === cur.id);
    });
}

function updateSearchCount() {
    var searchCountEl = dom.searchCount;
    if (!searchCountEl) return;
    if (state.searchQuery) {
        var count = getFiltered().length;
        searchCountEl.textContent = count;
        searchCountEl.classList.remove('hidden');
    } else {
        searchCountEl.classList.add('hidden');
    }
}

function updateGridButton(q) {
    var btn = dom.grid.querySelector('.grid-btn[data-id="' + q.id + '"]');
    if (!btn) return;
    btn.className = 'grid-btn';
    var hide = isHiddenByFilter(q);
    if (hide) btn.classList.add('hidden-by-filter');
    if (state.bookmarked.has(q.id)) btn.classList.add('bookmarked');
    if (isRevealed(q)) {
        if (isScorable(q)) {
            btn.classList.add(checkCorrect(q) ? 'correct' : 'incorrect');
        } else {
            btn.classList.add('revealed');
        }
    }
    var filtered = getFiltered();
    var cur = filtered[state.currentIndex];
    if (cur && cur.id === q.id) btn.classList.add('active');
}

// ===== Render Question =====
function renderQuestion() {
    // Direction-aware fade-in animation (only on navigation, not option selection)
    var card = dom.card;
    if (card && state.navDirection) {
        card.classList.remove('fade-in');
        card.classList.remove('fade-in-forward');
        card.classList.remove('fade-in-backward');
        void card.offsetWidth; // force reflow
        card.classList.add(state.navDirection === 'forward' ? 'fade-in-forward' : 'fade-in-backward');
        state.navDirection = null; // reset so option clicks don't replay animation
    }

    var filtered = getFiltered();
    if (filtered.length === 0) {
        dom.text.innerHTML = '<div class="empty-state">' +
            '<div class="empty-state-icon">' + (state.searchQuery ? '🔍' : '📋') + '</div>' +
            '<div class="empty-state-text">' +
                (state.searchQuery ? '未找到包含"' + esc(state.searchQuery) + '"的题目' : '该分类下暂无题目') +
            '</div>' +
            '<div class="empty-state-hint">' + (state.searchQuery ? '换个关键词试试，或清除搜索' : '试试切换其他分类') +
            '</div>' +
            '</div>';
        dom.options.innerHTML = '';
        dom.showBtn.classList.add('hidden');
        dom.ansContent.classList.add('hidden');
        dom.prev.disabled = true;
        dom.next.disabled = true;
        dom.progress.textContent = '0 / 0';
        return;
    }

    if (state.currentIndex >= filtered.length) state.currentIndex = filtered.length - 1;
    if (state.currentIndex < 0) state.currentIndex = 0;

    var q = filtered[state.currentIndex];
    var revealed = isRevealed(q);
    var scorable = isScorable(q);
    var userAns = state.answers[q.id];

    // Header
    dom.badge.textContent = TYPE_LABELS[q.type] || '未知';
    dom.badge.className = 'question-badge ' + (BADGE_CLASS[q.type] || '');
    // Apply type class to card for colored left border
    var typeClass = BADGE_CLASS[q.type] || '';
    card.className = card.className.replace(/type-\w+/g, '').trim();
    if (typeClass) card.classList.add(typeClass);
    dom.number.textContent = '第 ' + q.id + ' 题';

    // Question text
    dom.text.innerHTML = formatText(q.text);

    // Options
    if (q.type === 'single') {
        dom.options.innerHTML = buildSingleOpts(q, revealed, userAns);
    } else if (q.type === 'multiple') {
        dom.options.innerHTML = buildMultiOpts(q, revealed, userAns);
    } else if (q.type === 'tf') {
        dom.options.innerHTML = buildTfOpts(q, revealed, userAns);
    } else if (q.type === 'fill') {
        dom.options.innerHTML = '';
    } else {
        dom.options.innerHTML = '';
    }

    // Answer button
    dom.showBtn.classList.remove('hidden');
    if (revealed) {
        dom.showBtn.textContent = scorable ? '已提交' : '已显示';
        dom.showBtn.disabled = true;
    } else if (scorable) {
        dom.showBtn.textContent = '提交答案';
        dom.showBtn.disabled = (userAns === undefined || userAns === '');
    } else {
        dom.showBtn.textContent = '显示答案与解析';
        dom.showBtn.disabled = false;
    }

    // Answer content
    if (revealed) {
        dom.ansContent.classList.remove('hidden');
        if (scorable) {
            var ok = checkCorrect(q);
            var prefix = ok ? '✓ 回答正确' : '✗ 回答错误';
            var color = ok ? 'var(--correct)' : 'var(--incorrect)';
            dom.ansText.innerHTML = '<span style="color:' + color + ';font-weight:700">' + prefix + '</span><br>' +
                '正确答案：' + esc(q.answer) +
                (userAns !== undefined ? '<br>你的答案：' + esc(userAns) : '');
        } else {
            dom.ansText.innerHTML = formatText(q.answer);
        }
        if (q.explanation) {
            dom.explArea.classList.remove('hidden');
            dom.explText.innerHTML = formatText(q.explanation);
        } else {
            dom.explArea.classList.add('hidden');
        }
    } else {
        dom.ansContent.classList.add('hidden');
        dom.explArea.classList.add('hidden');
    }

    // Navigation
    dom.prev.disabled = state.currentIndex === 0;
    dom.next.disabled = state.currentIndex >= filtered.length - 1;
    dom.progress.textContent = (state.currentIndex + 1) + ' / ' + filtered.length;

    // Bookmark button
    if (dom.bookmarkBtn) {
        dom.bookmarkBtn.classList.toggle('active', state.bookmarked.has(q.id));
    }

    updateGridActive();

    // Update mobile nav progress line
    var navBar = dom.navBar;
    if (navBar) {
        var navPct = filtered.length > 0 ? ((state.currentIndex + 1) / filtered.length * 100) : 0;
        navBar.style.setProperty('--nav-progress-pct', navPct + '%');
    }

    // Update search count
    updateSearchCount();

    debouncedSaveState();
}

function buildSingleOpts(q, revealed, userAns) {
    if (!q.options) return '';
    var h = '';
    q.options.forEach(function(o) {
        var c = 'option-card';
        if (revealed) {
            c += ' disabled';
            if (o.label === q.answer) c += ' correct-option';
            else if (o.label === userAns) c += ' incorrect-option';
        } else if (userAns === o.label) {
            c += ' selected';
        }
        var checked = (userAns === o.label) ? 'true' : 'false';
        h += '<div class="' + c + '" data-label="' + o.label + '" role="radio" aria-checked="' + checked + '" tabindex="0">' +
            '<span class="option-label">' + o.label + '</span>' +
            '<span class="option-text">' + formatText(o.text) + '</span></div>';
    });
    return h;
}

function buildMultiOpts(q, revealed, userAns) {
    if (!q.options) return '';
    var sel = userAns ? userAns.split('') : [];
    var cor = q.answer.split('');
    var hint = '';
    if (!revealed) {
        hint = '<div class="multi-hint">请选择 ' + cor.length + ' 项 · 已选 ' + sel.length + ' 项</div>';
    }
    var h = hint;
    q.options.forEach(function(o) {
        var c = 'option-card';
        if (revealed) {
            c += ' disabled';
            if (cor.indexOf(o.label) !== -1) c += ' correct-option';
            else if (sel.indexOf(o.label) !== -1) c += ' incorrect-option';
        } else if (sel.indexOf(o.label) !== -1) {
            c += ' selected';
        }
        var checked = (sel.indexOf(o.label) !== -1) ? 'true' : 'false';
        h += '<div class="' + c + '" data-label="' + o.label + '" role="checkbox" aria-checked="' + checked + '" tabindex="0">' +
            '<span class="option-label">' + o.label + '</span>' +
            '<span class="option-text">' + formatText(o.text) + '</span></div>';
    });
    return h;
}

function buildTfOpts(q, revealed, userAns) {
    var items = [{ label: '正确', icon: '✓' }, { label: '错误', icon: '✗' }];
    var h = '<div class="tf-options">';
    items.forEach(function(it) {
        var c = 'tf-btn';
        if (revealed) {
            c += ' disabled';
            if (it.label === q.answer) c += ' correct-option';
            else if (it.label === userAns) c += ' incorrect-option';
        } else if (userAns === it.label) {
            c += ' selected';
        }
        h += '<button class="' + c + '" data-label="' + it.label + '" aria-pressed="' + (userAns === it.label ? 'true' : 'false') + '">' +
            '<span class="tf-icon">' + it.icon + '</span> ' + it.label + '</button>';
    });
    h += '</div>';
    return h;
}

function buildFillInput() {
    return '';
}

// ===== Stats =====
function updateStats() {
    var s = getStats();
    dom.statAns.textContent = s.answered;
    dom.statTotal.textContent = s.total;
    dom.statOk.textContent = s.correct;
    dom.statWrong.textContent = s.incorrect;
    if (dom.sidebarAnswered) dom.sidebarAnswered.textContent = s.answered;
    if (dom.sidebarCorrect) dom.sidebarCorrect.textContent = s.correct;
    if (dom.sidebarIncorrect) dom.sidebarIncorrect.textContent = s.incorrect;
    var pct = s.total > 0 ? Math.round(s.answered / s.total * 100) : 0;
    if (dom.progressFill) {
        dom.progressFill.style.width = pct + '%';
        dom.progressFill.classList.remove('pulse');
        void dom.progressFill.offsetWidth;
        dom.progressFill.classList.add('pulse');
    }
    if (dom.progressPct) dom.progressPct.textContent = pct + '%';
}

// ===== Actions =====
function selectOption(label) {
    var filtered = getFiltered();
    if (!filtered.length) return;
    var q = filtered[state.currentIndex];
    if (!q || isRevealed(q)) return;

    if (q.type === 'single' || q.type === 'tf') {
        state.answers[q.id] = label;
        // Direct DOM update instead of full re-render
        dom.options.querySelectorAll('[data-label]').forEach(function(el) {
            var isSelected = el.dataset.label === label;
            el.classList.toggle('selected', isSelected);
            if (el.getAttribute('role') === 'radio') el.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            if (el.getAttribute('aria-pressed') !== null) el.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            if (isSelected) {
                el.classList.add('just-selected');
                setTimeout(function() { el.classList.remove('just-selected'); }, 200);
            }
        });
    } else if (q.type === 'multiple') {
        var cur = state.answers[q.id] || '';
        var idx = cur.indexOf(label);
        if (idx === -1) cur += label;
        else cur = cur.substring(0, idx) + cur.substring(idx + 1);
        cur = cur.split('').sort().join('');
        if (cur) state.answers[q.id] = cur;
        else delete state.answers[q.id];
        // Direct DOM update for multi-select
        var sel = cur ? cur.split('') : [];
        dom.options.querySelectorAll('[data-label]').forEach(function(el) {
            var isSelected = sel.indexOf(el.dataset.label) !== -1;
            el.classList.toggle('selected', isSelected);
            if (el.getAttribute('role') === 'checkbox') el.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        });
        var hintEl = dom.options.querySelector('.multi-hint');
        if (hintEl) {
            hintEl.textContent = '请选择 ' + q.answer.split('').length + ' 项 · 已选 ' + sel.length + ' 项';
        }
    }

    // Update submit button state
    var userAns = state.answers[q.id];
    dom.showBtn.disabled = (userAns === undefined || userAns === '');

    saveState();
}

function revealAnswer() {
    var filtered = getFiltered();
    if (!filtered.length) return;
    var q = filtered[state.currentIndex];
    if (!q || isRevealed(q)) return;
    state.revealed.add(q.id);
    invalidateFilterCache(); // wrong filter depends on revealed state
    renderQuestion();
    updateGridButton(q);
    updateStats();

    // Feedback animation for scorable questions
    if (isScorable(q)) {
        var card = dom.card;
        var btn = dom.grid.querySelector('.grid-btn[data-id="' + q.id + '"]');
        var ok = checkCorrect(q);
        // Announce feedback for screen readers
        var feedbackEl = document.getElementById('answer-feedback');
        if (feedbackEl) {
            feedbackEl.textContent = ok ? '回答正确' : '回答错误，正确答案是：' + q.answer;
        }
        if (card) {
            card.classList.add(ok ? 'feedback-correct' : 'feedback-incorrect');
            setTimeout(function() {
                card.classList.remove('feedback-correct', 'feedback-incorrect');
            }, ok ? 600 : 400);
        }
        if (ok && btn) {
            btn.classList.add('bounce');
            setTimeout(function() { btn.classList.remove('bounce'); }, 350);
        }
    }

    // Auto-jump to next question on correct answer (scorable types)
    if (autoJumpTimer) { clearTimeout(autoJumpTimer); autoJumpTimer = null; }
    if (isScorable(q) && checkCorrect(q) && state.currentIndex < filtered.length - 1) {
        var jumpIdx = state.currentIndex;
        autoJumpTimer = setTimeout(function() {
            autoJumpTimer = null;
            var cur = getFiltered()[state.currentIndex];
            if (cur && cur.id === q.id) goNext();
        }, 300);
    }

    // Redo mode: update banner and check completion
    if (state.redoMode) {
        updateRedoBanner();
        var allRevealed = Array.from(state.redoQuestionIds).every(function(id) {
            return state.revealed.has(id);
        });
        if (allRevealed) {
            setTimeout(function() {
                showRedoResults();
            }, 800);
        }
    }
}

function goTo(idx) {
    var filtered = getFiltered();
    if (idx < 0 || idx >= filtered.length) return;
    state.currentIndex = idx;
    renderQuestion();
}

function goPrev() {
    if (autoJumpTimer) { clearTimeout(autoJumpTimer); autoJumpTimer = null; }
    state.navDirection = 'backward';
    goTo(state.currentIndex - 1);
}
function goNext() {
    if (autoJumpTimer) { clearTimeout(autoJumpTimer); autoJumpTimer = null; }
    state.navDirection = 'forward';
    goTo(state.currentIndex + 1);
}

// ===== Redo Mode =====
function enterRedoMode() {
    var wrongIds = [];
    quizData.forEach(function(q) {
        if (isRevealed(q) && isScorable(q) && !checkCorrect(q)) {
            wrongIds.push(q.id);
        }
    });

    if (wrongIds.length === 0) {
        dom.text.innerHTML = '<div class="loading-screen"><p>暂无错题，无法进入重做模式</p><p style="font-size:0.85rem;color:var(--text-muted)">请先正常答题并提交答案后，再做错题重做。</p></div>';
        dom.options.innerHTML = '';
        dom.showBtn.classList.add('hidden');
        dom.ansContent.classList.add('hidden');
        setTimeout(function() {
            setFilter('all');
        }, 1500);
        return;
    }

    state.savedSnapshot = {
        answers: JSON.parse(JSON.stringify(state.answers)),
        revealed: new Set(state.revealed)
    };

    invalidateFilterCache();
    state.redoMode = true;
    state.redoQuestionIds = new Set(wrongIds);

    wrongIds.forEach(function(id) {
        delete state.answers[id];
        state.revealed.delete(id);
    });

    state.currentIndex = 0;

    dom.filters.querySelectorAll('button').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'wrong') btn.classList.add('active');
    });

    if (dom.searchInput) {
        dom.searchInput.disabled = true;
        dom.searchInput.value = '';
        state.searchQuery = '';
    }

    showRedoBanner(wrongIds.length);
    renderGrid();
    renderQuestion();
    updateStats();
    saveState();
}

function exitRedoMode(mergeResults) {
    if (!state.redoMode) return;

    if (mergeResults && state.savedSnapshot) {
        var origAnswers = state.savedSnapshot.answers;
        var origRevealed = state.savedSnapshot.revealed;

        state.redoQuestionIds.forEach(function(id) {
            var q = null;
            for (var i = 0; i < quizData.length; i++) {
                if (quizData[i].id === id) { q = quizData[i]; break; }
            }
            if (q && state.revealed.has(id) && isScorable(q) && checkCorrect(q)) {
                origAnswers[id] = state.answers[id];
                if (!origRevealed.has(id)) origRevealed.add(id);
            }
        });

        state.answers = origAnswers;
        state.revealed = origRevealed;
    } else if (state.savedSnapshot) {
        state.answers = state.savedSnapshot.answers;
        state.revealed = state.savedSnapshot.revealed;
    }

    state.redoMode = false;
    state.redoQuestionIds = new Set();
    state.savedSnapshot = null;
    state.currentIndex = 0;
    state.filter = 'all';
    invalidateFilterCache();

    dom.filters.querySelectorAll('button').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
    if (dom.searchInput) dom.searchInput.disabled = false;

    hideRedoBanner();
    renderGrid();
    renderQuestion();
    updateStats();
    saveState();
}

function showRedoBanner(count) {
    var existing = document.getElementById('redo-banner');
    if (existing) existing.remove();

    var banner = document.createElement('div');
    banner.id = 'redo-banner';
    banner.className = 'redo-banner';
    banner.innerHTML = '<span class="redo-banner-text">重做模式 — 共 ' + count + ' 道错题</span>' +
        '<button class="redo-banner-exit" id="redo-exit-btn">退出重做</button>';

    var main = document.getElementById('main-content');
    main.insertBefore(banner, main.firstChild);

    document.getElementById('redo-exit-btn').addEventListener('click', function() {
        exitRedoMode(true);
    });
}

function hideRedoBanner() {
    var banner = document.getElementById('redo-banner');
    if (banner) banner.remove();
}

function updateRedoBanner() {
    if (!state.redoMode) return;
    var banner = document.getElementById('redo-banner');
    if (!banner) return;
    var textEl = banner.querySelector('.redo-banner-text');
    if (!textEl) return;

    var revealed = 0;
    state.redoQuestionIds.forEach(function(id) {
        if (state.revealed.has(id)) revealed++;
    });
    textEl.textContent = '重做模式 — 已答 ' + revealed + ' / ' + state.redoQuestionIds.size + ' 道错题';
}

function showRedoResults() {
    var correct = 0, incorrect = 0, unanswered = 0;
    var stillWrongIds = [];

    state.redoQuestionIds.forEach(function(id) {
        var q = null;
        for (var i = 0; i < quizData.length; i++) {
            if (quizData[i].id === id) { q = quizData[i]; break; }
        }
        if (!q) return;
        if (!state.revealed.has(id)) {
            unanswered++;
        } else if (checkCorrect(q)) {
            correct++;
        } else {
            incorrect++;
            stillWrongIds.push(id);
        }
    });

    var total = state.redoQuestionIds.size;
    var pct = total > 0 ? Math.round(correct / total * 100) : 0;

    var html = '<div class="result-score">' + pct + '%</div>' +
        '<div class="result-detail">' +
        '<div class="result-item"><div class="label">重做题目</div><div class="value">' + total + '</div></div>' +
        '<div class="result-item correct-item"><div class="label">已掌握</div><div class="value">' + correct + '</div></div>' +
        '<div class="result-item incorrect-item"><div class="label">仍错误</div><div class="value">' + incorrect + '</div></div>' +
        (unanswered > 0 ? '<div class="result-item"><div class="label">未答完</div><div class="value">' + unanswered + '</div></div>' : '') +
        '</div>';

    if (stillWrongIds.length > 0) {
        html += '<div class="redo-still-wrong"><div class="label">仍需练习的题目：第 ' + stillWrongIds.join('、') + ' 题</div></div>';
    }

    dom.summary.innerHTML = html;
    dom.modalTitle.textContent = '重做结果';
    dom.review.textContent = '查看重做详情';
    dom.restart.textContent = '结束重做';

    dom.modal.classList.remove('hidden');
    var firstBtn = dom.modal.querySelector('.modal-actions button');
    if (firstBtn) firstBtn.focus();
}

function setFilter(f) {
    if (f === 'wrong') {
        enterRedoMode();
        return;
    }
    if (state.redoMode) {
        exitRedoMode(true);
    }
    invalidateFilterCache();
    state.filter = f;
    state.currentIndex = 0;
    dom.filters.querySelectorAll('button').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.filter === f);
    });
    renderGrid();
    renderQuestion();
    saveState();
}

function viewStats() {
    var s = getStats();
    var pool = state.redoMode
        ? quizData.filter(function(q) { return state.redoQuestionIds.has(q.id); })
        : quizData;
    var scorableTotal = pool.filter(function(q) { return isScorable(q); }).length;
    var pct = scorableTotal > 0 ? Math.round(s.correct / scorableTotal * 100) : 0;
    var title = state.redoMode ? '重做统计' : '测验结果';

    dom.summary.innerHTML =
        '<div class="result-score">' + pct + '%</div>' +
        '<div class="result-detail">' +
        '<div class="result-item"><div class="label">已答题目</div><div class="value">' + s.answered + ' / ' + s.total + '</div></div>' +
        '<div class="result-item correct-item"><div class="label">回答正确</div><div class="value">' + s.correct + '</div></div>' +
        '<div class="result-item incorrect-item"><div class="label">回答错误</div><div class="value">' + s.incorrect + '</div></div>' +
        '<div class="result-item"><div class="label">已看非判分题</div><div class="value">' + s.viewed + '</div></div>' +
        '</div>';
    dom.modalTitle.textContent = title;
    dom.review.textContent = state.redoMode ? '继续重做' : '查看答题情况';
    dom.restart.textContent = state.redoMode ? '结束重做' : '重新开始';
    dom.modal.classList.remove('hidden');
    lockScroll();
    setBgAriaHidden(true);
    var firstBtn = dom.modal.querySelector('.modal-actions button');
    if (firstBtn) firstBtn.focus();
}

function closeModal() {
    dom.modal.classList.add('closing');
    unlockScroll();
    setBgAriaHidden(false);
    setTimeout(function() {
        dom.modal.classList.add('hidden');
        dom.modal.classList.remove('closing');
    }, 250);
}

function restart() {
    if (state.redoMode) {
        closeModal();
        exitRedoMode(true);
        return;
    }
    showConfirm('确定要重新开始吗？所有答题进度将被清除。', function() {
        invalidateFilterCache();
        state.answers = {};
        state.currentIndex = 0;
        state.filter = 'all';
        dom.filters.querySelectorAll('button').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.filter === 'all');
        });
        renderGrid();
        renderQuestion();
        updateStats();
        saveState();
        dom.modal.classList.add('hidden');
        dom.modal.classList.remove('closing');
    });
}

// ===== Export / Import =====
function exportProgress() {
    var data = {
        v: STORAGE_VERSION,
        exportTime: new Date().toISOString(),
        currentIndex: state.currentIndex,
        answers: state.answers,
        revealed: Array.from(state.revealed),
        filter: state.filter,
        theme: state.theme,
        bookmarked: Array.from(state.bookmarked)
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'java-quiz-progress-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function validateImportData(d) {
    if (!d || typeof d !== 'object') return false;
    if (d.v !== undefined && d.v > STORAGE_VERSION) return false;
    if (d.answers !== undefined && typeof d.answers !== 'object') return false;
    if (d.revealed !== undefined && !Array.isArray(d.revealed)) return false;
    if (d.bookmarked !== undefined && !Array.isArray(d.bookmarked)) return false;
    if (d.currentIndex !== undefined && typeof d.currentIndex !== 'number') return false;
    if (d.filter !== undefined && typeof d.filter !== 'string') return false;
    if (d.theme !== undefined && d.theme !== 'light' && d.theme !== 'dark') return false;
    return true;
}

function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var d = JSON.parse(e.target.result);
            if (!validateImportData(d)) {
                showConfirm('导入失败：文件格式不正确', function() {});
                return;
            }
            showConfirm('导入将覆盖当前进度，确定继续吗？', function() {
                invalidateFilterCache();
                state.answers = d.answers || {};
                state.revealed = new Set(d.revealed || []);
                state.filter = d.filter || 'all';
                state.theme = d.theme || 'light';
                state.bookmarked = new Set(d.bookmarked || []);
                state.currentIndex = (typeof d.currentIndex === 'number') ? d.currentIndex : 0;
                state.redoMode = false;
                state.redoQuestionIds = new Set();
                state.savedSnapshot = null;
                applyTheme();
                dom.filters.querySelectorAll('button').forEach(function(btn) {
                    btn.classList.toggle('active', btn.dataset.filter === state.filter);
                });
                hideRedoBanner();
                renderGrid();
                renderQuestion();
                updateStats();
                saveState();
            });
        } catch (err) {
            showConfirm('导入失败：无法解析文件', function() {});
        }
    };
    reader.readAsText(file);
}

// ===== Theme =====
toggleTheme = function() {
    var toggle = dom.themeToggle || document.getElementById('theme-toggle');
    if (!toggle) return;

    var newTheme = state.theme === 'dark' ? 'light' : 'dark';
    var rect = toggle.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    var endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
    );

    // === Try View Transitions API first ===
    if (document.startViewTransition) {
        var transition = document.startViewTransition(function() {
            state.theme = newTheme;
            applyTheme();
            saveState();
        });

        transition.ready.then(function() {
            // Animate the new snapshot expanding as a circle from the toggle button
            document.documentElement.animate({
                clipPath: [
                    'circle(0px at ' + x + 'px ' + y + 'px)',
                    'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)'
                ]
            }, {
                duration: 450,
                easing: 'ease-in-out',
                pseudoElement: '::view-transition-new(root)'
            });
        });
    } else {
        // === Fallback: circle clip-path via inline overlay ===
        var targetColor = newTheme === 'dark' ? '#0f172a' : '#f8fafc';
        var overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;inset:0;z-index:9999;pointer-events:none;' +
            'background:' + targetColor + ';' +
            'clip-path:circle(0px at ' + x + 'px ' + y + 'px);' +
            'transition:clip-path 0.45s ease-in-out;';
        document.body.appendChild(overlay);

        // Expand circle from button position
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                overlay.style.clipPath = 'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)';
            });
        });

        // Apply theme behind the expanding circle, then remove overlay
        setTimeout(function() {
            state.theme = newTheme;
            applyTheme();
            saveState();
            setTimeout(function() { overlay.remove(); }, 100);
        }, 430);
    }
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    var toggle = dom.themeToggle || document.getElementById('theme-toggle');
    var lightIcon = toggle ? toggle.querySelector('.theme-icon-light') : null;
    var darkIcon = toggle ? toggle.querySelector('.theme-icon-dark') : null;
    if (lightIcon) lightIcon.classList.toggle('hidden', state.theme === 'dark');
    if (darkIcon) darkIcon.classList.toggle('hidden', state.theme === 'light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = state.theme === 'dark' ? '#0f172a' : '#f8fafc';
    // Save theme globally
    try { localStorage.setItem('quiz_theme', state.theme); } catch (e) {}
}

// ===== Persistence =====
var STORAGE_VERSION = 3;
var _saveTimer = null;
function debouncedSaveState() {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function() {
        saveState();
        _saveTimer = null;
    }, 300);
}

var _storageWarned = false;

function saveState() {
    if (!currentBankId) return;
    try {
        QuizDB.saveProgress(currentBankId, {
            quizBankId: currentBankId,
            currentIndex: state.currentIndex,
            answers: state.answers,
            revealed: Array.from(state.revealed),
            filter: state.filter,
            theme: state.theme,
            redoMode: state.redoMode,
            redoQuestionIds: Array.from(state.redoQuestionIds),
            savedSnapshot: state.savedSnapshot,
            bookmarked: Array.from(state.bookmarked),
            lastAccessedAt: new Date().toISOString()
        }).catch(function(e) {
            console.warn('saveState IDB:', e);
        });
        _storageWarned = false;
    } catch (e) {
        console.warn('saveState:', e.message);
    }
}

// ===== Events =====
function bindEvents() {
    if (_eventsBound) return;
    _eventsBound = true;
    dom.options.addEventListener('click', function(e) {
        var el = e.target.closest('[data-label]');
        if (el) selectOption(el.dataset.label);
    });
    // Keyboard support for option cards (Enter/Space)
    dom.options.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            var el = e.target.closest('[data-label]');
            if (el) { selectOption(el.dataset.label); e.preventDefault(); }
        }
    });

    dom.showBtn.addEventListener('click', revealAnswer);

    function toggleBookmark() {
        var filtered = getFiltered();
        if (!filtered.length) return;
        var q = filtered[state.currentIndex];
        if (!q) return;
        var wasBookmarked = state.bookmarked.has(q.id);
        if (wasBookmarked) state.bookmarked.delete(q.id);
        else state.bookmarked.add(q.id);
        invalidateFilterCache();
        dom.bookmarkBtn.classList.toggle('active', !wasBookmarked);
        updateGridButton(q);
        saveState();
    }

    if (dom.bookmarkBtn) {
        dom.bookmarkBtn.addEventListener('click', toggleBookmark);
    }

    dom.prev.addEventListener('click', goPrev);
    dom.next.addEventListener('click', goNext);

    dom.filters.addEventListener('click', function(e) {
        var btn = e.target.closest('button[data-filter]');
        if (btn) setFilter(btn.dataset.filter);
    });

    dom.grid.addEventListener('click', function(e) {
        var btn = e.target.closest('.grid-btn');
        if (!btn) return;
        var id = parseInt(btn.dataset.id);
        var filtered = getFiltered();
        for (var i = 0; i < filtered.length; i++) {
            if (filtered[i].id === id) { goTo(i); break; }
        }
        if (window.innerWidth <= 1024) {
            dom.sidebar.classList.remove('open');
            if (dom.sidebarBackdrop) {
                dom.sidebarBackdrop.classList.remove('show');
                dom.sidebarBackdrop.setAttribute('aria-hidden', 'true');
            }
        }
    });

    dom.submitBtn.addEventListener('click', viewStats);
    dom.review.addEventListener('click', closeModal);
    dom.restart.addEventListener('click', function() {
        if (state.redoMode) {
            closeModal();
            exitRedoMode(true);
        } else {
            restart();
        }
    });
    dom.modal.querySelector('.modal-overlay').addEventListener('click', closeModal);

    // Confirm modal events
    dom.confirmCancel.addEventListener('click', function() {
        dom.confirmModal.classList.add('hidden');
        _confirmCallback = null;
        unlockScroll();
        setBgAriaHidden(false);
    });
    dom.confirmOk.addEventListener('click', function() {
        dom.confirmModal.classList.add('hidden');
        unlockScroll();
        setBgAriaHidden(false);
        if (_confirmCallback) { _confirmCallback(); _confirmCallback = null; }
    });
    dom.confirmModal.querySelector('.modal-overlay').addEventListener('click', function() {
        dom.confirmModal.classList.add('hidden');
        _confirmCallback = null;
        unlockScroll();
        setBgAriaHidden(false);
    });

    // Keyboard shortcuts
    _docKeyHandler = function(e) {
        // Shortcut modal handling
        var shortcutModal = document.getElementById('shortcut-modal');
        if (shortcutModal && !shortcutModal.classList.contains('hidden')) {
            if (e.key === 'Escape') { toggleShortcutModal(); e.preventDefault(); }
            return;
        }
        // Confirm modal handling
        if (!dom.confirmModal.classList.contains('hidden')) {
            if (e.key === 'Escape') { dom.confirmModal.classList.add('hidden'); _confirmCallback = null; unlockScroll(); setBgAriaHidden(false); e.preventDefault(); }
            else if (e.key === 'Enter') { dom.confirmOk.click(); e.preventDefault(); }
            return;
        }
        // Focus trap for modal
        if (!dom.modal.classList.contains('hidden')) {
            if (e.key === 'Escape') { closeModal(); e.preventDefault(); return; }
            if (e.key === 'Tab') {
                var focusable = dom.modal.querySelectorAll('button:not([disabled])');
                if (focusable.length === 0) return;
                var first = focusable[0], last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
                else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
                return;
            }
        }
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === '?') {
            toggleShortcutModal();
            e.preventDefault();
            return;
        }
        if (e.key === 'b' || e.key === 'B') {
            toggleBookmark();
            e.preventDefault();
            return;
        }
        if (e.key === 'ArrowLeft') { goPrev(); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { goNext(); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === ' ') {
            var filtered = getFiltered();
            if (filtered.length > 0) {
                var q = filtered[state.currentIndex];
                if (q && isScorable(q) && !isRevealed(q) && state.answers[q.id]) revealAnswer();
            }
            e.preventDefault();
        }
        else if (e.key >= '1' && e.key <= '9') {
            var filtered = getFiltered();
            if (filtered.length > 0) {
                var q = filtered[state.currentIndex];
                if (q && q.options && !isRevealed(q)) {
                    var idx = parseInt(e.key) - 1;
                    if (idx < q.options.length) selectOption(q.options[idx].label);
                }
            }
            e.preventDefault();
        }
        else if (e.key.length === 1 && 'ABCDE'.indexOf(e.key.toUpperCase()) !== -1) {
            var filtered = getFiltered();
            if (filtered.length > 0) {
                var q = filtered[state.currentIndex];
                if (q && q.options && !isRevealed(q)) {
                    var label = e.key.toUpperCase();
                    var found = q.options.some(function(o) { return o.label === label; });
                    if (found) selectOption(label);
                }
            }
            e.preventDefault();
        }
    };
    document.addEventListener('keydown', _docKeyHandler);

    dom.sidebarToggle.addEventListener('click', function() {
        dom.sidebar.classList.toggle('open');
        var isOpen = dom.sidebar.classList.contains('open');
        if (dom.sidebarBackdrop) {
            dom.sidebarBackdrop.classList.toggle('show', isOpen);
            dom.sidebarBackdrop.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        }
    });
    if (dom.sidebarBackdrop) {
        dom.sidebarBackdrop.addEventListener('click', function() {
            dom.sidebar.classList.remove('open');
            dom.sidebarBackdrop.classList.remove('show');
            dom.sidebarBackdrop.setAttribute('aria-hidden', 'true');
        });
    }

    // Search with debounce
    if (dom.searchInput) {
        dom.searchInput.addEventListener('input', function() {
            var val = this.value.trim();
            if (dom.searchClear) dom.searchClear.classList.toggle('hidden', !val);
            if (_searchTimer) clearTimeout(_searchTimer);
            _searchTimer = setTimeout(function() {
                state.searchQuery = val;
                state.currentIndex = 0;
                invalidateFilterCache();
                renderGrid();
                renderQuestion();
                updateSearchCount();
                _searchTimer = null;
            }, 200);
        });
    }

    // Search clear button
    if (dom.searchClear) {
        dom.searchClear.addEventListener('click', function() {
            if (dom.searchInput) { dom.searchInput.value = ''; dom.searchInput.focus(); }
            dom.searchClear.classList.add('hidden');
            state.searchQuery = '';
            state.currentIndex = 0;
            invalidateFilterCache();
            renderGrid();
            renderQuestion();
        });
    }

    // Touch swipe for sidebar
    _docTouchStartHandler = function(e) {
        _touchStartX = e.touches[0].clientX;
        _touchStartY = e.touches[0].clientY;
        _touchStartTime = Date.now();
    };
    _docTouchEndHandler = function(e) {
        if (Date.now() - _touchStartTime > 500) return;
        var dx = e.changedTouches[0].clientX - _touchStartX;
        var dy = Math.abs(e.changedTouches[0].clientY - _touchStartY);
        if (dy > Math.abs(dx)) return;
        if (dx > 60 && !dom.sidebar.classList.contains('open')) {
            dom.sidebar.classList.add('open');
            if (dom.sidebarBackdrop) dom.sidebarBackdrop.classList.add('show');
        } else if (dx < -60 && dom.sidebar.classList.contains('open')) {
            dom.sidebar.classList.remove('open');
            if (dom.sidebarBackdrop) dom.sidebarBackdrop.classList.remove('show');
        }
    };
    document.addEventListener('touchstart', _docTouchStartHandler, { passive: true });
    document.addEventListener('touchend', _docTouchEndHandler, { passive: true });

    // Theme Toggle — already bound in bootstrap (index.html)

    // Export / Import
    if (dom.exportBtn) {
        dom.exportBtn.addEventListener('click', exportProgress);
    }
    if (dom.importBtn && dom.importFile) {
        dom.importBtn.addEventListener('click', function() { dom.importFile.click(); });
        dom.importFile.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                importProgress(this.files[0]);
                this.value = '';
            }
        });
    }
}

// ===== Shortcut Modal =====
function toggleShortcutModal() {
    var modal = document.getElementById('shortcut-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        lockScroll();
        setBgAriaHidden(true);
        var closeBtn = modal.querySelector('.shortcut-close-btn');
        if (closeBtn) closeBtn.focus();
    } else {
        modal.classList.add('hidden');
        unlockScroll();
        setBgAriaHidden(false);
    }
}

// ===== Init =====
function initQuizPage(bankId) {
    _initGeneration++;
    var myGeneration = _initGeneration;

    currentBankId = bankId;
    resetState();
    initDom();

    QuizDB.getBank(bankId).then(function(bank) {
        if (myGeneration !== _initGeneration) return; // stale callback
        if (!bank || !bank.mdContent) {
            dom.text.innerHTML = '<div class="error-message"><h3>无法加载题库</h3><p>题库数据未找到</p></div>';
            return;
        }

        quizData = parseQuestions(bank.mdContent);
        if (quizData.length === 0) {
            dom.text.innerHTML = '<div class="error-message"><h3>无法加载题库</h3><p>没有解析到任何题目</p></div>';
            return;
        }

        // Update header with bank name
        var titleEl = document.querySelector('.header-left h1');
        var subtitleEl = document.querySelector('.header-left .header-subtitle');
        if (titleEl) titleEl.textContent = bank.name;
        if (subtitleEl) subtitleEl.textContent = '共 ' + quizData.length + ' 题 · 在线刷题';

        // Update stat total
        var statTotal = document.getElementById('stat-total');
        if (statTotal) statTotal.textContent = quizData.length;

        // Load progress from IndexedDB
        QuizDB.getProgress(bankId).then(function(prog) {
            if (myGeneration !== _initGeneration) return; // stale callback
            if (prog) {
                state.currentIndex = prog.currentIndex || 0;
                state.answers = prog.answers || {};
                state.revealed = new Set(prog.revealed || []);
                state.filter = prog.filter || 'all';
                state.theme = prog.theme || localStorage.getItem('quiz_theme') || 'light';
                state.redoMode = prog.redoMode || false;
                state.redoQuestionIds = new Set(prog.redoQuestionIds || []);
                state.savedSnapshot = prog.savedSnapshot || null;
                state.bookmarked = new Set(prog.bookmarked || []);
            } else {
                state.theme = localStorage.getItem('quiz_theme') || 'light';
            }
            _stateLoaded = true;

            applyTheme();

            // Restore redo mode UI
            if (state.redoMode && state.redoQuestionIds.size > 0) {
                showRedoBanner(state.redoQuestionIds.size);
                if (dom.searchInput) {
                    dom.searchInput.disabled = true;
                    dom.searchInput.value = '';
                }
            }

            dom.filters.querySelectorAll('button').forEach(function(btn) {
                if (state.redoMode) {
                    btn.classList.toggle('active', btn.dataset.filter === 'wrong');
                } else {
                    btn.classList.toggle('active', btn.dataset.filter === state.filter);
                }
            });

            renderGrid();
            renderQuestion();
            updateStats();
            bindEvents();
        });
    }).catch(function(e) {
        console.error('initQuizPage:', e);
        dom.text.innerHTML = '<div class="error-message"><h3>加载失败</h3><p>' + e.message + '</p></div>';
    });
}

function resetState() {
    quizData = [];
    if (autoJumpTimer) { clearTimeout(autoJumpTimer); autoJumpTimer = null; }
    state = {
        currentIndex: 0,
        answers: {},
        revealed: new Set(),
        filter: 'all',
        searchQuery: '',
        theme: 'light',
        redoMode: false,
        redoQuestionIds: new Set(),
        savedSnapshot: null,
        bookmarked: new Set(),
    };
}

function destroyQuizPage() {
    // Save current state before leaving
    if (currentBankId && _stateLoaded) {
        try { saveState(); } catch (e) { /* ignore */ }
    }

    // Remove document-level event listeners to prevent duplication
    if (_docKeyHandler) { document.removeEventListener('keydown', _docKeyHandler); _docKeyHandler = null; }
    if (_docTouchStartHandler) { document.removeEventListener('touchstart', _docTouchStartHandler); _docTouchStartHandler = null; }
    if (_docTouchEndHandler) { document.removeEventListener('touchend', _docTouchEndHandler); _docTouchEndHandler = null; }
    if (_searchTimer) { clearTimeout(_searchTimer); _searchTimer = null; }

    // Remove redo banner if present
    var banner = document.getElementById('redo-banner');
    if (banner) banner.remove();

    // Invalidate cached data
    invalidateFilterCache();

    // Reset
    currentBankId = null;
    _stateLoaded = false;
    _eventsBound = false;
    quizData = [];
}

// ===== Expose globally =====
// parseQuestions is already defined in IIFE scope; expose it
// (assignment happens at parseQuestions definition)

})();
