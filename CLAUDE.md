# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Java 编程语言题库 Web 应用——一个零依赖、纯原生的 PWA 单页应用。194 道 Java 题目嵌入在 JS 中，支持答题、错题重做、书签、导入导出、暗色模式、键盘快捷键等功能。

**无构建系统、无包管理器、无框架。** 直接用浏览器打开 `index.html` 即可运行。

## Architecture

```
index.html   — 页面骨架（header + sidebar + main content + 3 个 modal）
quiz.js      — 全部应用逻辑 + 嵌入的题库数据（IIFE，~3055 行）
style.css    — 完整设计系统（~90 个 CSS 变量，明暗双主题）
sw.js        — Service Worker（cache-first 离线策略）
manifest.json — PWA 配置
z.md         — 题目源数据（Markdown 格式，1670 行）
```

### 数据流

1. **启动**: IIFE 执行 → `parseQuestions()` 解析 `RAW_MD`（嵌入的 z.md 原文）→ 生成 `quizData[]` 数组 → `loadState()` 从 `localStorage` 恢复状态 → 渲染 UI
2. **答题**: 用户选选项 → `selectOption()` 更新 `state.answers` → 提交后 `revealAnswer()` 判断对错 → 动画反馈 → 答对自动跳下一题
3. **持久化**: 每次状态变更都调用 `saveState()` 写入 `localStorage`（key: `quiz_state`，版本: `STORAGE_VERSION = 3`）

### 状态管理

所有状态集中在 `state` 对象中（`currentIndex`, `answers`, `revealed`, `filter`, `searchQuery`, `theme`, `redoMode`, `redoQuestionIds`, `savedSnapshot`, `bookmarked`）。导出为 JSON 文件，导入时验证后恢复。

### 题目类型检测（启发式）

题目类型在解析时推断，非显式标注：多字母答案→多选，单字母→单选，"正确/错误"→判断，含 `___`→填空，答案>200字→分析题，其余→简答。

## Key Patterns

- **DOM 缓存模式**: 启动时一次性查询所有需要的 DOM 元素，后续通过引用操作
- **事件委托**: 选项容器和题号网格使用事件委托而非逐个绑定
- **主题切换动画**: 使用 View Transitions API 实现圆形扩展效果，旧浏览器回退到临时 overlay div
- **错题重做**: 进入时快照状态、清除错题答案，退出时仅合并答对的结果
- **方向感知动画**: 前进/后退导航时使用不同的卡片滑入方向

## Design System (CSS)

- 明暗双主题通过 `[data-theme="dark"]` 切换，`~90` 个 CSS 变量
- 三档响应式断点: 1024px（sidebar 变抽屉）、768px（header 收缩）、640px（移动端布局）
- 字体: Plus Jakarta Sans（标题）+ Inter + 中文回退（PingFang SC, Microsoft YaHei）
- 支持 `prefers-reduced-motion` 无障碍媒体查询

## Development

无构建命令。修改后直接刷新浏览器即可。如需更新题目数据，修改 `z.md` 后将其内容复制到 `quiz.js` 中的 `RAW_MD` 模板字符串里。

Service Worker 缓存名为 `java-quiz-v1`，更新后需修改缓存名以使客户端获取新版本。
