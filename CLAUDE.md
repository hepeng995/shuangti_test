# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

零依赖、纯原生 PWA 单页题库应用。支持多题库管理、答题、错题重做、书签、导入导出、暗色模式、键盘快捷键、管理后台等功能。

**无构建系统、无包管理器、无框架。** 直接用浏览器打开 `index.html` 即可运行。

## Architecture

模块化 IIFE 架构，每个 JS 文件导出一个全局单例模块。通过 hash 路由实现三页 SPA。

### 文件职责

```
index.html      — 页面骨架（header + select/quiz/admin 三页区 + 4 个 modal）+ 内联启动脚本
db.js           — IndexedDB 数据访问层（题库注册、进度 CRUD、自定义题库、localStorage 迁移）
router.js       — Hash-based SPA 路由：#/（选题库）、#/quiz/{bankId}（答题）、#/admin（管理）
quiz-core.js    — 核心答题逻辑（解析器、状态管理、渲染、事件、持久化）— 匿名 IIFE，暴露有限全局接口
quiz-select.js  — 题库选择页（搜索、卡片渲染、进度展示）
admin.js        — 管理面板（SHA-256+salt 密码认证、题库上传 MD/JSON、行内编辑）
bank-java.js    — 内置 Java 题库数据（194 题，调用 registerBank() 注册）
style.css       — 完整设计系统（~90 CSS 变量，明暗双主题，三档响应式）
sw.js           — Service Worker（cache-first 本地资源 + stale-while-revalidate Google Fonts）
manifest.json   — PWA 配置
tiku/*.md       — 题目源数据（Markdown 格式，仅作参考，运行时使用 JS 中嵌入的数据）
```

### 脚本加载顺序（index.html 底部）

`db.js` → `router.js` → `quiz-core.js` → `quiz-select.js` → `admin.js` → `bank-java.js` → 内联启动脚本

### 数据流

1. **启动**: 各模块 IIFE 执行 → `bank-java.js` 调用 `QuizDB.registerBank()` 注册内置题库 → 内联脚本初始化路由 → 根据 hash 渲染对应页面
2. **答题**: 路由导航至 `#/quiz/{bankId}` → `QuizDB.getBank()` 获取题库 → `parseQuestions()` 解析 Markdown → `QuizDB.getProgress()` 加载进度 → 渲染 UI
3. **交互**: `selectOption()` → `revealAnswer()` → 动画反馈 → 答对自动跳下一题 → `debouncedSaveState()`（300ms 防抖）→ `QuizDB.saveProgress()` 写入 IndexedDB
4. **持久化**: 所有状态通过 IndexedDB（非 localStorage）持久化。导出为 JSON 文件，导入时验证后恢复

### 状态管理

答题状态集中在 `state` 对象（`currentIndex`, `answers`, `revealed`(Set), `filter`, `searchQuery`, `theme`, `redoMode`, `redoQuestionIds`(Set), `savedSnapshot`, `bookmarked`(Set), `shuffleOrder`, `navDirection`(transient)）。

### 题目类型检测（启发式）

解析时推断，非显式标注：多字母答案→多选，单字母→单选，"正确/错误"→判断，含 `___`→填空，答案>200字→分析题，其余→简答。其中仅 `single`/`multiple`/`tf` 三种类型自动评分。

## Key Patterns

- **IIFE 模块隔离**: 每个模块封装私有状态，仅暴露最小公共 API（`QuizDB`, `Router`, `QuizSelect`, `AdminPanel`）
- **DOM 缓存**: `initDom()` 启动时一次性查询所有 DOM 元素存入 `dom` 对象，后续通过引用操作
- **事件委托**: 选项容器和题号网格绑定在父元素上，通过 `e.target.closest()` 识别目标
- **Stale Callback Guard**: `initQuizPage()` 使用 generation 计数器，异步回调检查世代号防止过期更新
- **完整清理**: `destroyQuizPage()` 移除所有 document 级监听器、清除定时器、置空 DOM 引用，防止内存泄漏
- **主题切换动画**: View Transitions API 圆形扩展效果，旧浏览器回退到临时 overlay div
- **错题重做快照**: 进入时快照状态到 `savedSnapshot`、清除错题答案，退出时仅合并答对结果
- **方向感知动画**: 导航设置 `navDirection`，渲染时应用对应方向的 CSS 动画类

## Design System (CSS)

- 明暗双主题通过 `[data-theme="dark"]` 切换，约 90 个 CSS 变量定义于 `:root`
- 三档响应式断点: 1024px（sidebar 变抽屉）、768px（header 收缩）、640px（移动端底部导航栏）
- 字体: Plus Jakarta Sans（标题）+ Inter + 中文回退（PingFang SC, Microsoft YaHei）
- 支持 `prefers-reduced-motion` 无障碍媒体查询
- 5 级阴影深度系统（xs/sm/md/lg/xl）
- 题目类型通过左边框颜色区分（6 种类型各有独立颜色）

## Development

无构建命令。修改后直接刷新浏览器即可。

### 更新题库数据

修改 `tiku/*.md` 源文件后，将其内容复制到 `bank-java.js`（或新建的 bank JS 文件）的 `registerBank()` 调用的模板字符串中。

### Service Worker 缓存更新

缓存名为 `quiz-platform-v5`（在 `sw.js` 中定义）。更新静态资源后必须递增缓存名，否则客户端无法获取新版本。`CACHE_FILES` 数组列出了所有预缓存的文件，新增 JS 文件需同步更新此数组。

### 添加新题库

1. 创建新的 `bank-xxx.js` 文件，调用 `QuizDB.registerBank({ id, name, mdContent })` 注册
2. 在 `index.html` 中 `bank-java.js` 之后添加 `<script src="bank-xxx.js"></script>`
3. 更新 `sw.js` 的 `CACHE_FILES` 数组
4. 递增 `sw.js` 中的缓存名
