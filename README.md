# Jiake ZHU · 朱佳科

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-brightgreen?logo=github)](https://jiakezhu.github.io)
[![Status](https://img.shields.io/badge/status-live-success)](https://jiakezhu.github.io)
[![Languages](https://img.shields.io/badge/languages-EN%20%7C%20FR%20%7C%20ES%20%7C%20ZH-blue)](#)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

> Multilingual, multidisciplinary, and multi-industry — bridging technology, international business, and cross-cultural communication across three languages and four continents.
>
> 多语言、跨学科、多行业——以三门外语与四大洲的跨文化经验，连接科技、国际商务与人文交流。

---

## About · 关于

**[jiakezhu.github.io](https://jiakezhu.github.io)** is the personal portfolio of Jiake ZHU, a professional who combines technical fluency with deep international experience. Educated across China and France — double bachelor's in French Language & Cross-border E-commerce (ZJSU), Master's in International Business (SWUFE), and an exchange year in International & European Law at Paris 1 Panthéon-Sorbonne — Jiake brings a rare blend of coding ability and cross-cultural expertise to every project.

**[jiakezhu.github.io](https://jiakezhu.github.io)** 是朱佳科个人作品集网站。他拥有浙江工商大学法语与跨境电商双学位、西南财经大学国际商务硕士学位，并曾赴巴黎第一大学（先贤祠-索邦）交换学习国际与欧盟法。他将技术能力与跨文化国际经验相结合，是连接中西方的复合型人才。

**Languages · 语言能力:** Native Mandarin · IELTS 7.5 English · DALF C1 French · A2–B1 Spanish · 16+ countries visited

---

## Website Structure · 网站结构

The site is a single-page application with seven navigation sections, served as a pure static site via GitHub Pages.

网站为单页应用，通过 GitHub Pages 静态托管，包含七个导航模块。

| Section | Content · 内容 |
|---------|----------------|
| **About** | Bio, multilingual intro, profile · 个人简介与多语言介绍 |
| **Education** | Degree timeline with institutions · 学历时间线 |
| **Experience** | Professional roles & key achievements · 工作经历与核心成就 |
| **Projects** | Featured technical projects · 精选技术项目 |
| **Life** | Travel, culture, interests · 旅行、文化与兴趣 |
| **Journal** | Public technical blog and diary · 公开技术博客与日记 |
| **Language Toggle** | Switch between EN / FR / ES · 中英法西多语言切换 |

Embedded recommendation letters and trilingual parallel content (EN / FR / ES) are featured throughout.

网站全程提供英法西三语平行内容，并内嵌推荐信。

---

## Featured Projects · 项目展示

| Project | Description · 描述 | Tech Stack |
|---------|-------------------|------------|
| **[Habit-Orbit](https://github.com/jiakezhu/Habit-Oribt)** | Gamified habit-tracking app with AI coaching · 游戏化习惯追踪应用，内置 AI 辅导 | React · TypeScript · Gemini AI |
| **[english-tutor-lesson-prep](https://github.com/jiakezhu/english-tutor-lesson-prep)** | Claude Agent Skill for automated ESL lesson document generation · 基于 Claude Agent 的英语课备课文档自动生成工具 | Claude Agent SDK · Node.js |
| **[LingoVibe](https://github.com/jiakezhu/lingo-vibe)** | Trilingual context engine for language learners · 面向语言学习者的三语语境引擎 | Next.js · Supabase · TypeScript |
| **[student-budget-travel](https://github.com/jiakezhu/student-budget-travel)** | AI-powered student budget travel planning skill · 基于 AI Agent 的学生穷游行程规划工具 | Claude Agent SDK |

---

## Tech Stack · 技术实现

The public site remains static HTML/CSS/JavaScript. A small Node.js script turns Markdown posts into static article pages, a search index, a home-page preview, and RSS.

网站运行时仍是纯静态 HTML/CSS/JavaScript。日志内容通过 Node.js 将 Markdown 生成为独立文章页、搜索索引、主页预览和 RSS。

```
HTML5 · CSS3 · Vanilla JavaScript
Deployed via GitHub Pages (automatic from main branch)
```

- **Static publishing** — build Markdown posts locally and commit the generated files · 本地生成文章，提交静态页面即可发布
- **Trilingual content** — EN / FR / ES toggled via vanilla JS · 三语内容由原生 JS 切换
- **Responsive layout** — works on mobile and desktop · 响应式布局，移动端与桌面端均适配
- **Embedded assets** — recommendation letters rendered inline · 推荐信等资产内嵌渲染

---

## Local Development · 本地开发

No install required. Clone and open.

无需安装任何依赖，克隆后直接打开即可。

```bash
git clone https://github.com/jiakezhu/jiakezhu.github.io.git
cd jiakezhu.github.io
open index.html        # macOS
# xdg-open index.html  # Linux
# start index.html     # Windows
```

To deploy, push to `main` — GitHub Pages serves it automatically.

推送到 `main` 分支即可部署，GitHub Pages 自动生效。

```bash
git add .
git commit -m "your message"
git push origin main
```

---

## Honors · 荣誉

- National Scholarship (top 0.2% nationally) · 国家奖学金（全国前 0.2%）
- Provincial Scholarship · 省级奖学金
- Bronze Medal, "Internet+" Innovation Competition · "互联网+"创新创业大赛铜奖
- Multiple first-place wins in English competitions · 多项英语竞赛一等奖

---

## Contact · 联系方式

| Channel | Link |
|---------|------|
| Website | [jiakezhu.github.io](https://jiakezhu.github.io) |
| GitHub | [@jiakezhu](https://github.com/jiakezhu) |
| Email | jkzhusolo@gmail.com |

---

*Built with care. Deployed with one push.* · *用心搭建，一键部署。*


## 日志与日记 · Journal

- `journal/`：统一的公开日志，支持技术博客 / 日记分类、标题 / 正文 / 标签搜索、可分享筛选链接。
- `journal/write.html`：写作台，实时 Markdown 预览、本机自动保存、导入与导出。它没有后台或发布权限；本机草稿仅保存在当前浏览器。
- `journal/posts/<slug>/`：独立文章，正文和目录预先生成，不依赖 JavaScript 阅读。
- `journal/feed.xml`：RSS 订阅。

### 写作与发布

需要 Node.js 20 或更新版本：

```bash
npm ci
npm run build
npm test
npm run preview
```

打开 `http://localhost:4173/journal/write.html` 写作并导出 Markdown，放到 `content/posts/`。也可以直接复制 `content/posts/first-note.md` 模板。

```yaml
---
title: "我的第一篇记录"
date: "2026-10-02"
category: tech
tags: ["AI", "实践"]
summary: "这一篇记录的简介。"
slug: my-first-note
draft: false
---
```

`category` 为 `tech`（技术博客）或 `diary`（日记）。`slug` 可省略，默认使用 Markdown 文件名；必须为小写英文字母、数字及连字符。正文支持标题、段落、引用、列表、表格、图片和代码块。图片放在 `images/`，正文使用网站绝对路径，例如 `![说明](/images/photo.jpg)`。

写作台导出的文件默认 `draft: true`。准备发布时改成 `false`，运行 `npm run build`，然后提交 Markdown 和生成的 `index.html`、`journal/`、`assets/journal-data.js` 等文件，推送到 `main`，沿用现有 GitHub Pages 发布方式。仅编辑静态页面无需运行构建。文章内容保持原文，主页的语言切换不会翻译文章。

草稿与未来日期的文章不进入生成的阅读页、索引、主页预览或 RSS。日期以 Asia/Shanghai 为准；到日期后需要再次运行构建。修改文章为草稿或删除 Markdown 后再构建，会撤下此前生成的文章页。**公开仓库里的源码本身仍然可见；`draft` 不是私密权限，不要提交私人草稿。** 真正未发布的文字可先留在本机写作台，并导出备份。

构建前校验日期、分类、标签、链接名称和重复 slug；Markdown 的原始 HTML 与执行脚本链接不会被渲染。`assets/markdown-it.min.js` 随构建复制，保留上游 MIT 版权信息，写作预览无需外部 CDN。


### 互动界面

统一采用石墨黑 / 暖白 / 黄绿色主色，辅以淡紫和珊瑚色，并支持本机记忆的深浅主题。主页提供作品分类与介绍展开、滚动阅读进度、返回顶部、数值入场、轻量粒子背景、按钮与卡片反馈。四种语言切换同步更新交互控件。首页按姓名、身份介绍、作品入口和最近项目组织阅读顺序，配合圆角照片。通过编号章节、统一字阶和阅读宽度组织其他内容。产品封面复用原有图标和截图。手机使用单列作品，平板使用双列；背景动效离屏或切到后台后暂停，并尊重系统减少动态效果设置。

排版参考 Cynthia Ugwu 的个人作品集（[Awwwards Honorable Mention 官方记录](https://www.awwwards.com/websites/General%20Sans/)），吸收字阶对比和留白节奏，再按个人网站的阅读需求调整。

### 圆润字体

英文采用 [Nunito](https://github.com/google/fonts/tree/main/ofl/nunito)，中文采用 [Resource Han Rounded](https://github.com/CyanoHao/Resource-Han-Rounded) 的简体字形子集，内部字体名为 `Jiake Rounded`。字体在本站本地加载，使用 WOFF2 格式，均按 SIL Open Font License 分发。许可证与原始版权声明保存在 `assets/fonts/OFL-Nunito.txt` 和 `assets/fonts/OFL-Resource-Han-Rounded.md`。

中文子集包含 GB2312 常用汉字、中文标点和当前网站全部中文字符；其余字使用系统字体回退。需要扩展字形时，取得官方 v0.990 简体中文 Regular / Medium 字体，以及 Nunito 可变字体（保存为 `nunito.ttf`），放进同一个本机目录。安装 `fonttools` 和 `brotli` 后运行 `python3 scripts/build-fonts.py /字体目录`。常规写作和构建无需重新处理字体。

### 项目记录的选取

第一批公开记录来自 Codex 与 ChatGPT 的项目工作记录，选取 Lessonfold、Language House 和 AI 算力知识手册三个项目。按实际工作日（Asia/Shanghai）记录，同一项目的重复操作合并为里程碑。正文只概括项目目标、已完成结果、当前阶段与下一步；筹备、实施建议、本地验证和已上线版本分别说明。原始对话、客户或学生资料、账号信息与私人记录不进入文章。
