// ===== IndexedDB Data Access Layer (Simplified) =====
var QuizDB = (function() {
    'use strict';

    var DB_NAME = 'QuizBankDB';
    var DB_VERSION = 2;
    var STORE_PROGRESS = 'quizProgress';
    var db = null;

    // ===== Registered banks (from bank-*.js files) =====
    var registeredBanks = [];

    function registerBank(bank) {
        var stats = computeTypeStats(bank.mdContent);
        bank.questionCount = stats.total;
        bank.typeStats = stats.types;
        if (!bank.source) bank.source = 'builtin';
        registeredBanks.push(bank);
    }

    // ===== Open / Upgrade =====
    function init() {
        return new Promise(function(resolve, reject) {
            var req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function(e) {
                var d = e.target.result;
                // Remove old quizBanks store if exists
                if (d.objectStoreNames.contains('quizBanks')) {
                    d.deleteObjectStore('quizBanks');
                }
                if (!d.objectStoreNames.contains(STORE_PROGRESS)) {
                    var prog = d.createObjectStore(STORE_PROGRESS, { keyPath: 'quizBankId' });
                    prog.createIndex('last_access_idx', 'lastAccessedAt', { unique: false });
                }
            };
            req.onsuccess = function(e) {
                db = e.target.result;
                migrateFromLocalStorage().then(resolve);
            };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    // ===== Migrate old localStorage data =====
    function migrateFromLocalStorage() {
        return new Promise(function(resolve) {
            var flag = localStorage.getItem('idb_migration_done');
            if (flag) { resolve(); return; }

            // Find the first registered bank to migrate progress to
            if (registeredBanks.length === 0) {
                localStorage.setItem('idb_migration_done', '1');
                resolve();
                return;
            }

            var old = localStorage.getItem('quiz_state');
            if (!old) {
                localStorage.setItem('idb_migration_done', '1');
                resolve();
                return;
            }

            try {
                var d = JSON.parse(old);
                if (!d || !d.v) { resolve(); return; }
                var bankId = registeredBanks[0].id;
                saveProgress(bankId, {
                    quizBankId: bankId,
                    currentIndex: d.currentIndex || 0,
                    answers: d.answers || {},
                    revealed: d.revealed || [],
                    bookmarked: d.bookmarked || [],
                    filter: d.filter || 'all',
                    theme: d.theme || 'light',
                    redoMode: d.redoMode || false,
                    redoQuestionIds: d.redoQuestionIds || [],
                    savedSnapshot: d.savedSnapshot || null,
                    lastAccessedAt: new Date().toISOString()
                }).then(function() {
                    localStorage.setItem('idb_migration_done', '1');
                    resolve();
                });
            } catch (e) {
                localStorage.setItem('idb_migration_done', '1');
                resolve();
            }
        });
    }

    // ===== Compute type stats from markdown =====
    function computeTypeStats(md) {
        var types = { single: 0, multiple: 0, tf: 0, fill: 0, short: 0, analysis: 0 };
        var total = 0;
        var blocks = md.split(/\n(?=## \d+[.、])/);
        for (var i = 0; i < blocks.length; i++) {
            var b = blocks[i].trim();
            if (!b) continue;
            var hm = b.match(/^## (\d+)[.、]\s*([\s\S]*)/);
            if (!hm) continue;
            total++;
            var content = hm[2];
            var opts = [];
            var orx = /^- ([A-Z])[.、]\s*(.*)/gm;
            var om;
            while ((om = orx.exec(content)) !== null) { opts.push(om[1]); }
            var am = content.match(/\*\*答案[：:]\*\*\s*([\s\S]*?)(?=\n\*\*解析|$)/);
            var ans = am ? am[1].trim() : '';
            var qt = content;
            var cutOpt = qt.search(/\n- [A-Z]/);
            var cutAns = qt.search(/\*\*答案/);
            var cut = qt.length;
            if (cutOpt > -1) cut = Math.min(cut, cutOpt);
            if (cutAns > -1) cut = Math.min(cut, cutAns);
            qt = qt.substring(0, cut).trim();
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
            types[type] = (types[type] || 0) + 1;
        }
        return { total: total, types: types };
    }

    // ===== Bank queries (from registered banks, not IndexedDB) =====
    function listBanks() {
        return Promise.resolve(registeredBanks.map(function(b) {
            return {
                id: b.id,
                name: b.name,
                description: b.description,
                icon: b.icon,
                source: b.source,
                questionCount: b.questionCount,
                typeStats: b.typeStats,
                createdAt: b.createdAt,
                updatedAt: b.updatedAt
            };
        }));
    }

    function getBank(id) {
        for (var i = 0; i < registeredBanks.length; i++) {
            if (registeredBanks[i].id === id) return Promise.resolve(registeredBanks[i]);
        }
        return Promise.resolve(null);
    }

    // ===== Progress CRUD (still in IndexedDB) =====
    function getStore(name, mode) {
        return db.transaction(name, mode).objectStore(name);
    }

    function getProgress(quizBankId) {
        return new Promise(function(resolve, reject) {
            var req = getStore(STORE_PROGRESS, 'readonly').get(quizBankId);
            req.onsuccess = function(e) { resolve(e.target.result || null); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function saveProgress(quizBankId, data) {
        return new Promise(function(resolve, reject) {
            data.quizBankId = quizBankId;
            data.lastAccessedAt = new Date().toISOString();
            var req = getStore(STORE_PROGRESS, 'readwrite').put(data);
            req.onsuccess = function() { resolve(); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function deleteProgress(quizBankId) {
        return new Promise(function(resolve, reject) {
            var req = getStore(STORE_PROGRESS, 'readwrite').delete(quizBankId);
            req.onsuccess = function() { resolve(); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    return {
        init: init,
        registerBank: registerBank,
        listBanks: listBanks,
        getBank: getBank,
        getProgress: getProgress,
        saveProgress: saveProgress,
        deleteProgress: deleteProgress,
        computeTypeStats: computeTypeStats
    };
})();

// Global shorthand for bank-*.js files to call
function registerBank(data) { QuizDB.registerBank(data); }
