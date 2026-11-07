# 网页方案：Piggy's Last Semester（互动防诈视频网站）

> 可以把这份文档连同 `site/` 文件夹一起交给 Codex。**写任何 UI 之前，必须先读 [design-guide.md](design-guide.md) 并打开 `styleboard.html`。视觉相关的决定以这两份为准，Codex 只负责执行，不要自创风格。**
>`site/` 里已经有一个**能跑的原型**，Codex 只需要在它的基础上继续完善，不用从零开始写。

## 1. 产品目标

- 观众看完一段 10 秒左右的短片，接着做一个选择，然后跳到对应的下一段故事
- 分支之间可以**交叉回归**：选错了也能通过"止损/求救"的路线回到主线；坏结局可以"倒带"回到最后一个选择点
- 目标用户：香港大学生（含交换生和内地生）。界面用英文，后续可以再加中文版本
- 课程交付物：可公开访问的网址，写进 PPT Appendix 的 "link to the working prototype"

## 2. 现有原型（`site/`）

| 文件 | 作用 |
|---|---|
| `index.html` | 页面结构：顶栏 HUD、16:9 播放舞台、选择浮层、结局页、故事地图 |
| `style.css` | 2D 粉彩风格，支持手机竖屏和深色模式 |
| `story.js` | **全部剧情数据**（20 个节点）。改剧情只需要改这个文件 |
| `app.js` | 引擎（不依赖任何库）：播放、字幕、选择、倒计时、金钱/红旗统计、倒带、故事地图、结局收集 |

**已实现的功能：**
1. **分支 + 交叉**：节点用 `choices` / `next` / `branch` 连接。`branch.ifLost` 会根据玩家之前有没有丢过钱，决定进哪个结局
2. **Piggy 余额 HUD**：钱变少时小猪图标会缩小、抖动；有 `+HK$`/`−HK$` 的提示
3. **Pressure mode（压力模式）**：每次选择有 15 秒倒计时，超时自动选"慌乱选项"，并弹出提示 "Scammers LOVE a ticking clock"。可以关掉
4. **🚩 Spot the red flags**：点击后显示这一节点的诈骗红旗，同时暂停倒计时（顺便传达"慢下来"这个信息）
5. **手机/文件叠加层**：短信、聊天、来电、通缉令、Scameter 查询结果这些文字都用 HTML 渲染，不放进 AI 视频里（AI 生成的屏幕文字会变成乱码）
6. **素材自动切换**：`media` 字段为空时显示动画占位卡；填上 `media/c1.mp4` 就播放视频，填 `.png/.jpg` 就显示图片加推镜动效
7. **结局收集**：4 个结局，记录在 localStorage 里，开始页显示"已找到 x/4"
8. **故事地图**：显示所有节点和连线（绿色实线代表正确选择，红色虚线代表危险选择），已走过的节点高亮，未解锁的结局显示 "???"
9. **键盘**：按 A/B 键直接选择

**本地运行：**
```bash
cd site && python3 -m http.server 8765
```
然后打开 http://localhost:8765

## 3. 素材规格（Seedance 2.0 · 480P）

- 视频：`media/<节点id>.mp4`，16:9，**480P**，10–15 秒，H.264，**无音轨或后期配音**（ModelArk Output sound 设为 close）
- 网页播放前先压缩：`ffmpeg -i in.mp4 -vf scale=854:-2 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 96k -movflags +faststart out.mp4`，每段大约 1–2 MB
- 图片节点：`media/<节点id>.jpg`，1280×720
- 节点和素材的对应关系见 `story.js` 里每个节点的 `kind` 字段（`video` / `image`）

## 4. 交给 Codex 的任务清单（按优先级排）

> 可以直接复制给 Codex：
>
> "This repo contains a working interactive-story prototype (vanilla HTML/CSS/JS, story data in `story.js`). Keep the architecture and data format. **Follow `planning/design-guide.md`, `tokens.css` and `styleboard.html` strictly for every visual decision — do not introduce new colours, fonts or styles.** Also do a security pass: no secrets in the repo, no third-party trackers, escape any user-visible dynamic text, CSP-friendly code. Please:"

**P0（演示必须有）**
1. 把真实素材放进 `site/media/`，并在 `story.js` 里填好对应的 `media` 路径
2. 下一段视频提前预加载：当前片段播放时，就用 `<link rel="preload">` 或隐藏的 `<video preload>` 加载可能的下一段，避免选完之后黑屏等待
3. 声音：手机浏览器要求用户先点击才能播放声音。在开始按钮的点击事件里先解锁音频
4. 字幕时间轴：在 `lines` 里支持可选的 `t`（秒）字段，用来和配音精确对齐；没有 `t` 时沿用现在的平均分配
5. 在手机（iOS Safari、Android Chrome）上测试，竖屏时舞台要自适应

**P1（加分项）**
6. **选择统计**：每次做选择时匿名记录一次（节点 id + 选了哪个），结局页显示 "62% of players added Kelly"。可以用 Supabase、Firebase 或 Cloudflare Workers KV 的免费额度；**不收集任何个人信息**
7. **中英切换**：`story.js` 的文本改成 `{ en, zh }` 结构，右上角加一个语言切换按钮
8. **分享结局**：生成一张结局卡片图（canvas），加上"复制链接"按钮
9. 结局页加上"防诈小测验"（3 题），和课程的教育目标呼应

**P2（可选）**
10. 加一个 `?node=c2` 参数，可以直接跳到某个节点，方便演讲时现场演示
11. 演讲模式：按 `F` 全屏，同时隐藏顶栏

## 5. 部署方案（公开网址）

这个网站是**纯静态网页**（HTML/JS/视频文件），不需要后端服务器。以下几种都可以免费部署，并且网址里带你的用户名：

| 方案 | 网址形式 | 说明 |
|---|---|---|
| ⭐ **GitHub Pages** | `https://<你的GitHub用户名>.github.io/piggy-scam-story/` | 最符合"后缀带主页名"的需求。仓库设为 Public，在 Settings → Pages 里选 `main` 分支和 `/site` 目录 |
| Vercel / Netlify | `https://piggy-scam-story.vercel.app` | 关联 GitHub 仓库后，每次 push 都会自动部署 |
| Cloudflare Pages | `https://piggy.pages.dev` | 带宽不限，视频多的话最稳 |

**关于"部署到 OpenAI 服务器上"：** 据我所知，Codex 本身只是写代码和运行任务的环境，**不提供公开网页托管**，所以最终网站还是要部署到上面这类平台。比较顺的流程是：用 Codex 把代码 push 到 GitHub，然后开启 GitHub Pages。

**视频体积：** 11 段 480P 视频加 9 张图，总共大约 15–25 MB，GitHub Pages 完全够用（单个文件限制 100 MB，站点建议 1 GB 以内）。

## 6. 验收清单

- [ ] 4 个结局都能走到，坏结局的"倒带"回到正确的选择点，而且余额也恢复
- [ ] 每条路线的余额计算正确（例如：c1 加 Kelly → 付 1,000 → 付税 → c2 合作 → 室友救场 → 验证妈妈 = HK$5,050，Comeback Kid）
- [ ] 倒计时超时会走 `timeoutTo` 指定的节点；点"红旗"按钮会暂停倒计时
- [ ] 手机竖屏下，视频、字幕、选择按钮都没有被遮挡
- [ ] 页脚有课程免责声明和求助热线（18222 / Scameter / 999）
