// ===== IndexedDB Data Access Layer (Simplified) =====
var QuizDB = (function() {
    'use strict';

    var DB_NAME = 'QuizBankDB';
    var DB_VERSION = 4;
    var STORE_PROGRESS = 'quizProgress';
    var STORE_CUSTOM_BANKS = 'customBanks';
    var STORE_BANK_META = 'bankMeta';
    var STORE_GROUP_DEFS = 'groupDefs';
    var db = null;
    var HAS_OWN = Object.prototype.hasOwnProperty;

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
                if (!d.objectStoreNames.contains(STORE_CUSTOM_BANKS)) {
                    d.createObjectStore(STORE_CUSTOM_BANKS, { keyPath: 'id' });
                }
                if (!d.objectStoreNames.contains(STORE_BANK_META)) {
                    d.createObjectStore(STORE_BANK_META, { keyPath: 'bankId' });
                }
                if (!d.objectStoreNames.contains(STORE_GROUP_DEFS)) {
                    d.createObjectStore(STORE_GROUP_DEFS, { keyPath: 'name' });
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

    // ===== Shared Markdown parser =====
    function parseBankQuestions(md) {
        var blocks = splitQuestionBlocks(md);
        var usedIds = {};
        var nextAutoId = 1;
        var questions = [];

        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            var header = parseQuestionHeading(block.headerLine);
            if (!header) continue;

            var assigned = assignQuestionId(header.explicitId, usedIds, nextAutoId);
            nextAutoId = assigned.nextAutoId;

            var parsed = parseQuestionBody(header.title, block.bodyLines);
            var normalized = normalizeQuestionAnswer(parsed.answer, parsed.explanation);
            var type = detectQuestionType(parsed.text, parsed.options, normalized.answer);

            questions.push({
                id: assigned.id,
                type: type,
                text: parsed.text,
                options: parsed.options.length ? parsed.options : null,
                answer: normalized.answer,
                explanation: normalized.explanation
            });
        }

        return questions;
    }

    function splitQuestionBlocks(md) {
        var lines = String(md || '').replace(/\r\n?/g, '\n').split('\n');
        var blocks = [];
        var current = null;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (isQuestionHeading(line)) {
                if (current) blocks.push(current);
                current = { headerLine: line, bodyLines: [] };
            } else if (current) {
                current.bodyLines.push(line);
            }
        }

        if (current) blocks.push(current);
        return blocks;
    }

    function isQuestionHeading(line) {
        return /^(##|###)\s+\d+[.、]\s*/.test(line) ||
            /^###\s+题目[一二三四五六七八九十]+[：:]\s*/.test(line);
    }

    function parseQuestionHeading(line) {
        var numeric = line.match(/^(##|###)\s+(\d+)[.、]\s*([\s\S]*)$/);
        if (numeric) {
            return {
                explicitId: parseInt(numeric[2], 10),
                title: numeric[3] ? numeric[3].trim() : ''
            };
        }

        var named = line.match(/^###\s+题目([一二三四五六七八九十]+)[：:]\s*([\s\S]*)$/);
        if (named) {
            return {
                explicitId: null,
                title: named[2] ? named[2].trim() : ''
            };
        }

        return null;
    }

    function assignQuestionId(preferredId, usedIds, nextAutoId) {
        var id = preferredId;
        if (id && !usedIds[id]) {
            usedIds[id] = true;
            if (id >= nextAutoId) nextAutoId = id + 1;
            return { id: id, nextAutoId: nextAutoId };
        }

        while (usedIds[nextAutoId]) nextAutoId++;
        usedIds[nextAutoId] = true;
        return { id: nextAutoId, nextAutoId: nextAutoId + 1 };
    }

    function parseQuestionBody(title, lines) {
        var questionLines = [];
        var options = [];
        var answerLines = [];
        var explanationLines = [];
        var extraAnswerSections = [];
        var currentExtra = null;
        var mode = 'question';
        var inCodeFence = false;

        if (title) questionLines.push(title);

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();
            var genericLabel = !inCodeFence ? parseGenericBoldLabel(line) : null;

            if (!inCodeFence) {
                var labelInfo = parseSpecialLabel(line);
                if (labelInfo) {
                    if (currentExtra) {
                        extraAnswerSections.push(currentExtra);
                        currentExtra = null;
                    }

                    mode = labelInfo.type;
                    if (mode === 'subanswer') {
                        currentExtra = {
                            label: labelInfo.label,
                            lines: labelInfo.inlineContent ? [labelInfo.inlineContent] : []
                        };
                    } else if (mode === 'answer' && labelInfo.inlineContent) {
                        answerLines.push(labelInfo.inlineContent);
                    } else if (mode === 'explanation' && labelInfo.inlineContent) {
                        explanationLines.push(labelInfo.inlineContent);
                    }
                    continue;
                }
            }

            if (!inCodeFence && mode === 'subanswer' && genericLabel) {
                if (currentExtra) {
                    extraAnswerSections.push(currentExtra);
                    currentExtra = null;
                }
                mode = 'question';
            }

            if (!inCodeFence && trimmed === '---') {
                continue;
            }

            if (mode === 'question') {
                var parsedOptions = parseOptionLine(line);
                if (parsedOptions.length) {
                    options = options.concat(parsedOptions);
                } else {
                    questionLines.push(line);
                }
            } else if (mode === 'answer') {
                answerLines.push(line);
            } else if (mode === 'explanation') {
                explanationLines.push(line);
            } else if (currentExtra) {
                currentExtra.lines.push(line);
            }

            if (/^\s*```/.test(line)) {
                inCodeFence = !inCodeFence;
            }
        }

        if (currentExtra) extraAnswerSections.push(currentExtra);

        return {
            text: trimOuterBlankLines(questionLines),
            options: options,
            answer: buildAnswerText(answerLines, extraAnswerSections),
            explanation: trimOuterBlankLines(explanationLines)
        };
    }

    function parseSpecialLabel(line) {
        var match = line.match(/^\*\*(.+?)\*\*\s*(.*)$/);
        if (!match) return null;

        var label = match[1].trim();
        var inlineContent = match[2] ? match[2].trim() : '';

        if (label === '答案：' || label === '答案:') {
            return { type: 'answer', inlineContent: inlineContent };
        }
        if (label === '解析：' || label === '解析:') {
            return { type: 'explanation', inlineContent: inlineContent };
        }
        if (label.indexOf('答案') !== -1) {
            return {
                type: 'subanswer',
                label: normalizeSubAnswerLabel(label),
                inlineContent: inlineContent
            };
        }

        return null;
    }

    function parseGenericBoldLabel(line) {
        var match = line.match(/^\*\*(.+?)\*\*\s*(.*)$/);
        return match ? match[1].trim() : '';
    }

    function normalizeSubAnswerLabel(label) {
        return label
            .replace(/\s*答案[：:]?\s*$/, '')
            .replace(/[：:]\s*$/, '')
            .trim();
    }

    function parseOptionLine(line) {
        if (!/^\s*-\s+/.test(line)) return [];

        var body = line.replace(/^\s*-\s+/, '');
        var markerRe = /(?:^|\s)([A-Z])[.、]\s*/g;
        var markers = [];
        var match;

        while ((match = markerRe.exec(body)) !== null) {
            var labelIndex = match.index;
            if (body.charAt(labelIndex).trim() === '') {
                labelIndex += 1;
            }
            markers.push({
                label: match[1],
                start: labelIndex,
                textStart: markerRe.lastIndex
            });
        }

        if (!markers.length || markers[0].start !== 0) return [];

        var options = [];
        for (var i = 0; i < markers.length; i++) {
            var current = markers[i];
            var next = markers[i + 1];
            var text = body.substring(current.textStart, next ? next.start : body.length).trim();
            if (!text) continue;
            options.push({ label: current.label, text: text });
        }
        return options;
    }

    function buildAnswerText(answerLines, extraAnswerSections) {
        var sections = [];
        var mainAnswer = trimOuterBlankLines(answerLines);
        if (mainAnswer) sections.push(mainAnswer);

        for (var i = 0; i < extraAnswerSections.length; i++) {
            var section = extraAnswerSections[i];
            var body = trimOuterBlankLines(section.lines);
            if (section.label && body) {
                sections.push(section.label + '：' + '\n' + body);
            } else if (section.label) {
                sections.push(section.label + '：');
            } else if (body) {
                sections.push(body);
            }
        }

        return sections.join('\n\n');
    }

    function trimOuterBlankLines(lines) {
        var copy = lines.slice();
        while (copy.length && !copy[0].trim()) copy.shift();
        while (copy.length && !copy[copy.length - 1].trim()) copy.pop();
        return copy.join('\n');
    }

    function normalizeQuestionAnswer(answer, explanation) {
        var resultAnswer = String(answer || '').trim();
        var resultExplanation = String(explanation || '').trim();

        if (resultAnswer.indexOf('正确') === 0) {
            resultExplanation = mergeExplanation(resultAnswer.substring(2).trim(), resultExplanation);
            resultAnswer = '正确';
        } else if (resultAnswer.indexOf('错误') === 0) {
            resultExplanation = mergeExplanation(resultAnswer.substring(2).trim(), resultExplanation);
            resultAnswer = '错误';
        }

        return {
            answer: resultAnswer,
            explanation: resultExplanation
        };
    }

    function mergeExplanation(extra, explanation) {
        var prefix = String(extra || '').trim();
        var suffix = String(explanation || '').trim();
        if (!prefix) return suffix;
        if (!suffix) return prefix;
        return prefix + '\n' + suffix;
    }

    function detectQuestionType(questionText, options, answer) {
        if (options.length > 0) {
            return (/^[A-Z]{2,}$/.test(answer)) ? 'multiple' : 'single';
        }
        if (/^(正确|错误)$/.test(answer)) {
            return 'tf';
        }
        if (/_{3,}/.test(questionText)) {
            return 'fill';
        }
        if (answer.length > 200) {
            return 'analysis';
        }
        return 'short';
    }

    // ===== Compute type stats from markdown =====
    function computeTypeStats(md) {
        var types = { single: 0, multiple: 0, tf: 0, fill: 0, short: 0, analysis: 0 };
        var questions = parseBankQuestions(md);

        for (var i = 0; i < questions.length; i++) {
            var type = questions[i].type || 'short';
            types[type] = (types[type] || 0) + 1;
        }

        return { total: questions.length, types: types };
    }

    function applyMetaOverrides(target, meta) {
        if (!meta) return target;
        if (HAS_OWN.call(meta, 'name')) target.name = meta.name;
        if (HAS_OWN.call(meta, 'description')) target.description = meta.description;
        if (HAS_OWN.call(meta, 'icon')) target.icon = meta.icon;
        if (HAS_OWN.call(meta, 'group')) target.group = meta.group;
        return target;
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
                applyMetaOverrides(item, metaMap[b.id]);
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
                var result = {};
                for (var k in builtin) {
                    if (HAS_OWN.call(builtin, k)) result[k] = builtin[k];
                }
                return applyMetaOverrides(result, meta);
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
            var req = db.transaction(STORE_CUSTOM_BANKS, 'readwrite')
                .objectStore(STORE_CUSTOM_BANKS).put(bank);
            req.onsuccess = function() { resolve(); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function getCustomBank(id) {
        return new Promise(function(resolve, reject) {
            var req = db.transaction(STORE_CUSTOM_BANKS, 'readonly')
                .objectStore(STORE_CUSTOM_BANKS).get(id);
            req.onsuccess = function(e) { resolve(e.target.result || null); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function listCustomBanks() {
        return new Promise(function(resolve, reject) {
            var req = db.transaction(STORE_CUSTOM_BANKS, 'readonly')
                .objectStore(STORE_CUSTOM_BANKS).getAll();
            req.onsuccess = function(e) { resolve(e.target.result || []); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function deleteCustomBank(id) {
        return new Promise(function(resolve, reject) {
            var req = db.transaction(STORE_CUSTOM_BANKS, 'readwrite')
                .objectStore(STORE_CUSTOM_BANKS).delete(id);
            req.onsuccess = function() { resolve(); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    // ===== Bank Meta Overrides (for builtin banks) =====
    function saveBankMeta(bankId, meta) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(STORE_BANK_META, 'readwrite');
            var store = tx.objectStore(STORE_BANK_META);
            var getReq = store.get(bankId);
            getReq.onsuccess = function(e) {
                var data = e.target.result || { bankId: bankId };
                for (var k in meta) {
                    if (HAS_OWN.call(meta, k)) data[k] = meta[k];
                }
                var putReq = store.put(data);
                putReq.onsuccess = function() { resolve(); };
                putReq.onerror = function(err) { reject(err.target.error); };
            };
            getReq.onerror = function(e) { reject(e.target.error); };
        });
    }

    function getBankMeta(bankId) {
        return new Promise(function(resolve, reject) {
            var req = db.transaction(STORE_BANK_META, 'readonly')
                .objectStore(STORE_BANK_META).get(bankId);
            req.onsuccess = function(e) { resolve(e.target.result || null); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function getAllBankMeta() {
        return new Promise(function(resolve, reject) {
            var req = db.transaction(STORE_BANK_META, 'readonly')
                .objectStore(STORE_BANK_META).getAll();
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
        parseBankQuestions: parseBankQuestions,
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
