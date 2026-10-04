# Jiake ZHU

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

**[jiakezhu.github.io](https://jiakezhu.github.io)** 是 Jack Zhu 的个人作品集网站。他拥有浙江工商大学法语与跨境电商双学位、西南财经大学国际商务硕士学位，并曾赴巴黎第一大学（先贤祠-索邦）交换学习国际与欧盟法。他将技术能力与跨文化国际经验相结合，是连接中西方的复合型人才。

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
| **Story** | Project journal, personal notes and growth comic · 项目日志、日记与成长漫画 |
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

- `story/`：统一的 Story 阅读页，收录项目日志、日记与成长漫画；支持技术博客 / 日记分类、标题 / 正文 / 标签搜索、可分享筛选链接。旧 `journal/` 地址保留跳转，并传递搜索参数。
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

写作台导出的文件默认 `draft: true`。准备发布时改成 `false`，运行 `npm run build`，然后提交 Markdown 和生成的 `index.html`、`story/index.html`、`journal/`、`assets/journal-data.js` 等文件，推送到 `main`，沿用现有 GitHub Pages 发布方式。仅编辑静态页面无需运行构建。文章标题、摘要、全文、目录和返回链接支持中、英、法、西四种语言，语言选择会随页面导航保留。

草稿与未来日期的文章不进入生成的阅读页、索引、主页预览或 RSS。日期以 Asia/Shanghai 为准；到日期后需要再次运行构建。修改文章为草稿或删除 Markdown 后再构建，会撤下此前生成的文章页。**公开仓库里的源码本身仍然可见；`draft` 不是私密权限，不要提交私人草稿。** 真正未发布的文字可先留在本机写作台，并导出备份。

每篇公开文章还需要 `content/post-translations/<slug>.json`，包含 `en`、`fr`、`es` 三个对象；每个对象提供 `title`、`summary` 和 Markdown 格式的 `body`。中文继续以 `content/posts/` 的 Markdown 为来源。构建会在写入之前检查译文是否齐全，草稿与未来日期的文章无需译文。正文在本地生成，不使用在线翻译请求。

构建前校验日期、分类、标签、链接名称和重复 slug；Markdown 的原始 HTML 与执行脚本链接不会被渲染。`assets/markdown-it.min.js` 随构建复制，保留上游 MIT 版权信息，写作预览无需外部 CDN。


### 互动界面

统一采用石墨黑 / 暖白 / 黄绿色主色，辅以淡紫和珊瑚色，并支持本机记忆的深浅主题。主页提供作品分类与介绍展开、滚动阅读进度、返回顶部、数值入场、轻量粒子背景、按钮与卡片反馈。四种语言切换同步更新交互控件。首页按姓名、身份介绍、作品入口和最近项目组织阅读顺序，配合圆角照片。通过编号章节、统一字阶和阅读宽度组织其他内容。产品封面复用原有图标和截图。手机使用单列作品，平板使用双列；背景动效离屏或切到后台后暂停，并尊重系统减少动态效果设置。

首页右侧固定展示多学科、多语言、多行业及相应 Logo；姓名下方的头衔和简短座右铭自动逐项切换，搭配各自的颜色和图标。Journey 使用本地 Leaflet 和打包的地理数据，提供世界、中国与欧洲视图、求学路线、地点卡片和全部足迹索引；地图靠近视口时才加载数据，地点照片按需加载。更新地图原始数据后运行 `npm run build` 生成 `assets/maps/atlas-data.js`。

排版参考 Cynthia Ugwu 的个人作品集（[Awwwards Honorable Mention 官方记录](https://www.awwwards.com/websites/General%20Sans/)），吸收字阶对比和留白节奏，再按个人网站的阅读需求调整。

### 圆润字体

英文采用 [Nunito](https://github.com/google/fonts/tree/main/ofl/nunito)，中文采用 [Resource Han Rounded](https://github.com/CyanoHao/Resource-Han-Rounded) 的简体字形子集，内部字体名为 `Jiake Rounded`。字体在本站本地加载，使用 WOFF2 格式，均按 SIL Open Font License 分发。许可证与原始版权声明保存在 `assets/fonts/OFL-Nunito.txt` 和 `assets/fonts/OFL-Resource-Han-Rounded.md`。

中文子集包含 GB2312 常用汉字、中文标点和当前网站全部中文字符；其余字使用系统字体回退。需要扩展字形时，取得官方 v0.990 简体中文 Regular / Medium 字体，以及 Nunito 可变字体（保存为 `nunito.ttf`），放进同一个本机目录。安装 `fonttools` 和 `brotli` 后运行 `python3 scripts/build-fonts.py /字体目录`。常规写作和构建无需重新处理字体。

### 项目记录的选取

第一批公开记录来自 Codex 与 ChatGPT 的项目工作记录，选取 Lessonfold、Language House 和 AI 算力知识手册三个项目。按实际工作日（Asia/Shanghai）记录，同一项目的重复操作合并为里程碑。正文只概括项目目标、已完成结果、当前阶段与下一步；筹备、实施建议、本地验证和已上线版本分别说明。原始对话、客户或学生资料、账号信息与私人记录不进入文章。

### 成长漫画与开场

首页最后保留一个 Story 入口，进入 `story/` 统一阅读项目日志、生活记录与成长漫画。首页不展示章节或文章列表；日志构建仅更新记录数量与最新日期。文章永久地址与 RSS 保持兼容。

成长漫画《I Wanted to See the World》由作者在本次对话中提供的口述经历制作，包括高中毕业后持续教英语、巴黎一年的西班牙语学习，以及作者已确认的五阶段人物形象。高中至大学术前保留严重地包天的视觉特征；当前人物采用作者确认的漫画化便装形象。场景为根据口述设计的插画，不声称复原真实旧照片、证书或病历。

`story/` 的成长漫画标签接入四个章节入口；`story/comic/` 是完整16页的正式网页阅读器，`story/comic/transcript.html` 是完整文字版。漫画入口、旁白、标题、章节导航、替代文字与文字版均支持中、英、法、西四种语言，跟随网站的 `jiake-language` 偏好；阅读途中切换保留当前页与图片地址。旁白作为真实 HTML 文字紧贴对应画格，只展示一次，支持复制、检索与屏幕阅读器。图片不包含旁白。禁用 JavaScript 时可阅读完整英文文字版。

`content/story/comic-manifest.json` 保存英文原文、章节和画格边界；`content/story/comic-translations.json` 保存其余三种语言的完整翻译及四语言控件。`scripts/build-comic.mjs` 与 `scripts/localize-comic.mjs` 生成静态阅读页和语言字典，并更新现有 Story 入口，保留日志和公众号内容；缺失翻译会阻止生成不完整页面。`assets/growth-comic-language.js` 接入全站语言偏好。`npm run build` 同时构建日志与漫画。每个画稿文件包含多个画格，网页通过 CSS 展示对应区域，使用相同图片地址避免重复下载。只有当前页会设置图片地址；直接进入 `#page-15` 时不会提前请求其他漫画页。

`images/comic/` 存放1400像素以内的 WebP 与640像素的响应式版本，随网站代码提交即可沿用 GitHub Pages 静态托管。高分辨率PNG原稿与完整生成提示词保存在网站 checkout 外的本地 `漫画素材/`，不参与网页加载。需要重新编码时，可运行 `scripts/prepare-comic-images.py`；正常构建直接使用仓库里的WebP。旧折叠封面和中文试画保留为设计参考。浏览器不调用图像模型，也不需要公开 API Key。

`assets/intro.js` / `assets/intro.css` 使用真实素材组成爆开式开场：36 种语言的问候组成 168 个文字片段铺满首帧，姓名位于最前层并保持清晰；照片、学校与公司标识、项目截图在姓名后方交叠，约 1.7 秒时同时向四周爆开，围住同屏的 Always Day One 和 Pragmatic Romantism；约 4.3 秒时再次向外飞出，背景随之退去，主页在下方同步入场。桌面共 18 张，手机保留 12 张，均来自作者现有本地素材。理念仍使用居中海报排版，首字母大写；配合扩散光圈、椭圆轨迹和播放进度。每个浏览器会话首次进入首页时播放，约 5.4 秒结束；可点击跳过、按 Escape 退出或通过首页“重播开场”再次体验。深链接进入时跳过开场，系统开启减少动态效果时不播放。动画异常时也会自动结束，避免遮挡页面。

当前所有修改仅用于本地预览和本地提交。未得到作者后续明确发布指令前，不推送远端或部署。

首页右上角、主题切换旁的 `assets/music.js` / `assets/music.css` 已使用作者提供的完整 Sunflower MP3，保存为 `assets/audio/sunflower.mp3`（约3.7 MiB，约162秒）。首页脚本的 `data-audio-src` 指向仓库内音频；默认在开场时尝试播放，浏览器阻止有声自动播放时，在首次真实点击、触摸或按键后继续。开场结束后，右上角出现音乐提示：播放时可关闭，关闭时可开启，浏览器阻止播放时可点击播放。即使之前记住了关闭偏好，也显示开启入口；12秒后自动收起。支持单曲循环、关闭偏好与音量记忆、真实进度及四语言控件；主动关闭后不会在后续点击或刷新时重新开启。已经移除 SoundCloud 试听及 Widget API。切换语言不会重载音频，进入另一个静态页面会停止当前页的播放。

开场设计参考 Awwwards 收录的 [Giats Loading Animation](https://www.awwwards.com/inspiration/loading-animation-https-giats-me) 和 [Eduard Bodak Page transition](https://www.awwwards.com/inspiration/page-transition-eduard-bodak-portfolio)，以本站的圆润字体、真实旅行照片和配色重新设计。没有引入这些网站的媒体文件或代码。

首屏的多学科、多语言、多行业按此顺序同时显示，标识位于各关键词右侧。`assets/home-v3.css` 调整这些关键词及页尾入口的层级。

首页四语言使用一致的标题字阶。`assets/home-language-layout.js` 在当前屏宽与字体下预先测量四种语言，为正文、卡片与按钮保留最长译文所需的空间；切换时保留当前阅读位置、作品筛选和展开状态。导航链接按当前译文宽度排列。字体加载、窗口变化或展开内容时会重新测量，正常切换不重新测量整页，也不会持久保存测量过程中的临时语言。

`assets/book-transition.js` / `assets/book-transition.css` 的书本过场包含三章目录、LingoVibe 项目手记、罗马旅行照片、语言短句及成长漫画首页插画，内页文字随网站语言切换。沿用本地素材，翻页后短暂停留，总时长约 2.1 秒；支持跳过、Escape 与浏览器返回，系统减少动态效果时直接进入故事页。

### 足迹地图和 Sales Buddy 素材

`assets/journey.js` / `assets/journey.css` 使用本地 Natural Earth 国家边界与原有个人足迹坐标，去过的国家以浅紫突出，重要节点用荧绿连接。保留拖动、缩放、城市点击定位与还原视野；支持语言与主题切换。已移除失效的在线瓦片请求。数据来源和公共领域授权见 `assets/maps/README.md`；原有 Leaflet 1.9.4 保存在 `assets/vendor/`，包含许可证。

Sales Buddy 的正式标识与新增截图来自作者指定的 `/Users/jake/Downloads/deck`，来源记录见 `images/sales-buddy-deck/README.md`。项目页使用客户列表、单客作战、会议证据核对和全景报告素材，并引用路演中明确描述的 24 个情报字段、50 个结构化业务落点。手机语音演示使用原视频，`preload="none"`，由读者点击播放。

2026-10-03 再按作者新提供的 Logo 图片制作透明版本；原图与内置图像模型的透明输出各自保存，提示词见 `content/brand/sales-buddy-logo-v3-prompt.md`。深色主题直接展示透明标识；浅色主题使用 Buddy 字样为深蓝色的透明版本，移除了所有深色底板。浅色版提示词见 `content/brand/sales-buddy-logo-v4-prompt.md`。首页 Sales Buddy 卡片右侧与介绍页首屏使用真实 HTML 首页的浏览器截图 `cover-v5.png`，没有外加 HTML 标签、顶栏或底栏；点击图片可打开 `sales-buddy-deck/` 的实际首屏。

### Story 补充记录 · 2026-10-03

此次从作者公开 GitHub 的项目说明与提交记录、近期公众号工作中补充 8 篇记录，目前共 11 篇。LingoVibe、Habit-Orbit、旅行 Skill 使用作者授权的旅行叙事，文末注明创作性还原；功能、阶段与日期依据实际项目记录。公众号一篇只记写作过程和个人思考，尚未标注为已发布。具体来源与筛选规则见 `content/story/project-sources.md`。

首页三个关键词按“多学科、多语言、多行业”排列，对应标识位于右侧。姓名与关键词之间的六个头衔与两句座右铭每3.2秒逐条轮换；系统减少动态效果时取消切换动画。`assets/home-personality.js` 接入四语言姓名：中文 Jiake Zhu、英文 Jack Zhu、法文 Jake Zhu、西文 Jacobo Zhu；左上角保留固定 Jiake ZHU。四语言主标题均沿用 Nunito；开场姓名始终为 Jiake ZHU，不随语言改变。Email、LinkedIn、WeChat、GitHub、Instagram、X 均显示文字名称。首页及页尾的微信按钮打开同一个可键盘操作的原生对话框，包含个人微信号 Acoolcopper 与公众号“小朱还在想”，支持复制、搜索指引和跳转公众号文章。当前项目位于照片下方。首页到 Story、Story 到漫画、漫画返回和日志返回均使用明确的 index.html 链接，兼容静态文件直接打开和 GitHub Pages；书本过场同时识别目录与明确文件地址。

音乐图标打开向下的面板，可控制播放、音量和进度；播放时图标高亮，点击外部或按 Escape 收起面板。

头衔区采用粗体无衬线字和简短色条，逐条自动向上切换；已移除“写作者”、手动按钮、序号和进度线。中文采用系统苹方等无衬线字体，拉丁文字采用 Helvetica Neue / Arial；鼠标停留时暂停，减少动态效果时取消动画。桌面导航保持单行，850px 以下使用带文字的导航菜单，开关与语言同步。中文语言按钮统一使用 CN；首页四面国旗在桌面与手机均保留。

`assets/home-classic.css` 参考归档旧版的章节节奏，将大标题和章节标签居中；中文标题使用宋体，拉丁标题使用本地 Instrument Serif，统计数字改用清晰的 Nunito 半粗体，重新调整留白与标题层级。中文导航单独增加字阶、点击区和链接间距，仍保持桌面一行。`assets/home-motion.js` 恢复旧版标题的随机字符逐步还原效果，滚入视口和鼠标移入时触发，离屏或切换语言时恢复完整原文。`assets/interactions.js` 的数字入场延迟220ms后从零增长，避免在卡片还未显现时就结束；离开后再返回可重新触发。章节和卡片仍在进入视口时浮入，照片随滚动轻微位移。离屏与后台停止相关计算，并遵循系统减少动态效果设置。

### 城市介绍与网站历史 · 2026-10-04

`assets/maps/city-guide.json` 为全部 65 个已有地点提供中、英、法、西四语名称与简短介绍，并保留官方旅游、政府或 UNESCO 的资料入口。地理文化介绍与作者已有的个人记忆分开呈现，不新增未经提供的旅行经历。咸祥的沿海村庄背景与大学经历来自作者口述；其他地点简介为资料的简短改写。更新介绍后运行 `npm run build`。

公开旧版已保存至 `history/2026-08-26/site/`，对应 `main` 提交 `6a98c9919e5b3316fd119eaddaf90409b32d0aec`；保存时已确认首页与线上一致。64 个原始 HTML/图片文件保持原样，SHA-256 清单位于 `snapshot.json`。入口页 `history/2026-08-26/index.html` 带四语提示及返回链接；外部字体、地图和链接保持原目的地。历史页面仅在读者打开入口时加载。

网站新旧记录按作者要求合并为一篇 `personal-website-redesign`《我的个人网站：留下旧版，继续向前》，配新旧真实浏览器截图、旧版入口及四语完整正文。归档入口的返回链接指向这篇文章，不再展示单独的归档日志。此次共有 12 篇日志，生成页面、漫画、音频与旧版归档一起纳入网站版本控制。`npm test` 校验 65 地点四语覆盖、归档完整性、合并文章的内部链接，以及列表、搜索和 RSS 均只保留一个网站记录。

首页章节高亮由 `assets/navigation.js` 根据各章节起始位置更新，支持很长的作品集区域，不依赖整块章节的可见比例；选中项带 `aria-current="location"`。作品集标题沿用归档旧版的四语文本，首页所有联系按钮使用相同颜色。

首次访问默认英文，语言链接优先于已记住的个人选择。首页在 head 阶段设置开场遮罩，动画控制器紧接动画内容加载；Leaflet 移到正文之后，四语言布局测量在开场结束后空闲时执行。若控制器加载失败，遮罩在 5 秒内解除，之后不会突然播放迟到的动画。减少动态效果、章节直达和同会话再次访问继续直接进入正文。手机端经历名称与 Logo 使用固定图标列和可换行文字列，避免较长名称把图标挤到上一行。

### 图片加载优化 · 2026-10-04

当前首页照片与缩略图使用 `images/web/` 内的 WebP 衍生文件。`assets/web-image-sources.json` 记录原图和生成尺寸，`scripts/prepare-web-images.py` 在带 Pillow 的 Python 环境中生成图片及 `assets/web-images.json` 清单；常规 Node 构建直接使用提交后的文件，不要求 Python。原图和历史网站保留。首页照片提供 400 / 800 / 1082 像素版本，响应式预加载与图片的 srcset、sizes 一致。开场拼贴仅在首次播放或重播时请求；弹窗图片仅在打开该弹窗时请求；其余图片使用浏览器延迟加载。图片设置固有尺寸，保持既有显示比例。

原首页立即加载的 50 种图片共 16,797,129 字节；优化后的首屏与开场在选择最大响应式版本时约 430 KB，其余分段加载。这是图片资源预算，不是页面实测耗时。自动检查限制首屏与开场图片预算低于 450 KB，并验证 WebP 文件、资源路径与预加载一致性。
