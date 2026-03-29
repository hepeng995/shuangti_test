// ===== IndexedDB Data Access Layer (Simplified) =====
var QuizDB = (function() {
    'use strict';

    var DB_NAME = 'QuizBankDB';
    var DB_VERSION = 3;
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
                if (!d.objectStoreNames.contains('customBanks')) {
                    d.createObjectStore('customBanks', { keyPath: 'id' });
                }
                if (!d.objectStoreNames.contains('bankMeta')) {
                    d.createObjectStore('bankMeta', { keyPath: 'bankId' });
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

    // ===== Bank queries (merge builtin + custom + meta overrides) =====
    function listBanks() {
        return Promise.all([
            listCustomBanks(),
            getAllBankMeta()
        ]).then(function(results) {
            var custom = results[0] || [];
            var metaArr = results[1] || [];
            var metaMap = {};
            for (var mi = 0; mi < metaArr.length; mi++) {
                metaMap[metaArr[mi].bankId] = metaArr[mi];
            }
            var all = [];
            // Builtin banks
            for (var i = 0; i < registeredBanks.length; i++) {
                var b = registeredBanks[i];
                var item = {
                    id: b.id, name: b.name, description: b.description,
                    icon: b.icon, source: b.source || 'builtin',
                    questionCount: b.questionCount, typeStats: b.typeStats,
                    createdAt: b.createdAt, updatedAt: b.updatedAt, group: b.group
                };
                if (metaMap[b.id]) {
                    var m = metaMap[b.id];
                    if (m.name) item.name = m.name;
                    if (m.description) item.description = m.description;
                    if (m.icon) item.icon = m.icon;
                    if (m.group) item.group = m.group;
                }
                all.push(item);
            }
            // Custom banks
            for (var ci = 0; ci < custom.length; ci++) {
                var c = custom[ci];
                all.push({
                    id: c.id, name: c.name, description: c.description,
                    icon: c.icon, source: 'custom',
                    questionCount: c.questionCount, typeStats: c.typeStats,
                    createdAt: c.createdAt, updatedAt: c.updatedAt, group: c.group
                });
            }
            return all;
        });
    }

    function getBank(id) {
        var builtin = null;
        for (var i = 0; i < registeredBanks.length; i++) {
            if (registeredBanks[i].id === id) { builtin = registeredBanks[i]; break; }
        }
        if (builtin) {
            return getBankMeta(id).then(function(meta) {
                if (!meta) return builtin;
                var result = {};
                for (var k in builtin) {
                    if (builtin.hasOwnProperty(k)) result[k] = builtin[k];
                }
                if (meta.name) result.name = meta.name;
                if (meta.description) result.description = meta.description;
                if (meta.icon) result.icon = meta.icon;
                if (meta.group) result.group = meta.group;
                return result;
            });
        }
        return getCustomBank(id);
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

    // ===== Custom Banks CRUD =====
    function saveCustomBank(bank) {
        return new Promise(function(resolve, reject) {
            var req = db.transaction('customBanks', 'readwrite')
                .objectStore('customBanks').put(bank);
            req.onsuccess = function() { resolve(); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function getCustomBank(id) {
        return new Promise(function(resolve, reject) {
            var req = db.transaction('customBanks', 'readonly')
                .objectStore('customBanks').get(id);
            req.onsuccess = function(e) { resolve(e.target.result || null); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function listCustomBanks() {
        return new Promise(function(resolve, reject) {
            var req = db.transaction('customBanks', 'readonly')
                .objectStore('customBanks').getAll();
            req.onsuccess = function(e) { resolve(e.target.result || []); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function deleteCustomBank(id) {
        return new Promise(function(resolve, reject) {
            var req = db.transaction('customBanks', 'readwrite')
                .objectStore('customBanks').delete(id);
            req.onsuccess = function() { resolve(); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    // ===== Bank Meta Overrides (for builtin banks) =====
    function saveBankMeta(bankId, meta) {
        return new Promise(function(resolve, reject) {
            var data = { bankId: bankId };
            for (var k in meta) {
                if (meta.hasOwnProperty(k)) data[k] = meta[k];
            }
            var req = db.transaction('bankMeta', 'readwrite')
                .objectStore('bankMeta').put(data);
            req.onsuccess = function() { resolve(); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function getBankMeta(bankId) {
        return new Promise(function(resolve, reject) {
            var req = db.transaction('bankMeta', 'readonly')
                .objectStore('bankMeta').get(bankId);
            req.onsuccess = function(e) { resolve(e.target.result || null); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function getAllBankMeta() {
        return new Promise(function(resolve, reject) {
            var req = db.transaction('bankMeta', 'readonly')
                .objectStore('bankMeta').getAll();
            req.onsuccess = function(e) { resolve(e.target.result || []); };
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
        computeTypeStats: computeTypeStats,
        saveCustomBank: saveCustomBank,
        getCustomBank: getCustomBank,
        listCustomBanks: listCustomBanks,
        deleteCustomBank: deleteCustomBank,
        saveBankMeta: saveBankMeta,
        getBankMeta: getBankMeta
    };
})();

// Global shorthand for bank-*.js files to call
function registerBank(data) { QuizDB.registerBank(data); }
