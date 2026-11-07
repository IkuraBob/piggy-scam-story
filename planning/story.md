# 《Piggy's Last Semester》——互动防诈故事

> GTSC2066 · Idea 2 Video about Fraud Prevention（加强版：视频 + 互动网页）

## 一句话梗概

刚来香港读大一的 Mia，整个学期的生活费 **HK$8,000** 都装在她的粉色存钱罐 **Piggy** 里。Piggy 会说话、爱吐槽、很怕死。接下来五周，Mia 会接连碰上三种香港学生最常遇到的骗局：**刷单兼职 → 假冒内地公安 → AI 深伪"妈妈"视频通话**。每段视频结束后，观众替 Mia 做选择，Piggy 的存款会跟着涨跌。

**有意思在哪：**
- **叙述者是存钱罐。** Mia 每被骗一次，Piggy 就瘦一圈、晕一次。吐槽让故事好笑，变瘦又让观众直观看到"钱真的没了"。
- **倒计时就是骗局本身。** 选择框带 15 秒倒计时，超时就自动替你选"慌乱的那个选项"。这正是骗子的套路：不给你时间想。
- **AI 课讲 AI 诈骗。** 最后一章是深伪视频通话，正好接上课程的 Gen AI 主题。在 Insights 部分可以讨论"我们用来做视频的技术，骗子也在用"。
- **错了能救回来。** 选错不会直接 Game Over。每章都有"止损/求救"的回归路线，能把你带回主线。这也对应真实防诈的核心信息：**发现被骗时立刻停手、说出来、报警，钱还有机会追回来。**

---

## 角色

| 角色 | 设定 | 视觉锁定（每段 prompt 都要原样写上） |
|---|---|---|
| **Mia Chen** | 大一新生，乐观、有点冲动，第一次离家 | young East Asian woman, 18, shoulder-length black hair, oversized mustard-yellow hoodie, round glasses |
| **Piggy** | 粉色陶瓷存钱罐，旁白兼吐槽担当 | small glossy pink ceramic piggy bank with big cartoon eyes, coin slot on top |
| **Jo** | 室友，八卦、多管闲事，关键时刻救命 | young woman, short dyed-blue hair, grey pajamas |
| **"Kelly from HR"** | 刷单骗子（只以聊天消息出现，**不需要拍人**） | — |
| **"Officer Wang"** | 假冒内地公安 | middle-aged man in a dark generic uniform with **no badges, no logos**, plain grey wall behind |
| **"Mom"（深伪）** | AI 换脸假妈妈 | middle-aged woman, dim lighting, face slightly too smooth, stiff expression |

> 所有人物都是虚构的。为遵守课程的伦理要求（slide 8），不使用真人肖像，也不出现真实机构的 logo。

**统一画风：** `2D pastel animation style, soft lighting, cozy university dorm`（和学长 PDF 里的示例一致：2D 粉彩风更容易保持一致）。

---

## 故事结构（分支 + 交叉回归）

```
                    ┌─ c1_safe ───────────────┐
intro ─ c1 刷单 ─────┤                          │
                    └─ c1_hook ─┬─ c1_check ───┤
                                └─ c1_trap ─ c1_recover ─┤   ← 选错也能回主线
                                                         ▼
                    ┌─ c2_safe ───────────────────────── c3 深伪妈妈
       c2 假公安 ────┤                                    ▲
                    └─ c2_deep ─┬─ c2_crack ──────────────┤
                                └─ c2_door ─┬─ c2_rescue ─┘   ← 室友救场，回主线
                                            └─ 💀 END: Gone Dark（虚拟绑架）

       c3 ─┬─ c3_verify ─┬─ 🛡️ END: Scam Slayer（一分没丢）
           │             └─ 🔁 END: Comeback Kid（丢过钱但止损了）
           └─ c3_sent ───┬─ 🔁 END: Comeback Kid（立刻报警，追回一部分）
                         └─ 💀 END: Face Swapped（羞于开口，钱全没）
```

- **4 个结局**：2 好（Scam Slayer / Comeback Kid）+ 2 坏（Gone Dark / Face Swapped）
- **坏结局都有"倒带"按钮**，可以回到最后一个选择点重新选，也就是"做对了就能回到正确故事线"
- **交叉点**：c1 的 4 条路最后都汇到 c2，c2 的 3 条活路都汇到 c3。所以视频总数可控，同时每个观众的体验都不一样

---

## 逐场剧本 + ModelArk 分镜 Prompt

**写法说明：**
- 每个节点 = 1 个视频片段（10–15 秒）
- Prompt 按学长 PDF 的 **五段公式**：SUBJECT / ACTION / SETTING / CAMERA / CONSTRAINTS
- **手机屏幕、聊天记录、通缉令这些文字一律不进视频**（PDF Tip：AI 会把屏幕文字生成成乱码）。这些文字由网页用 HTML 叠加在视频上面，清晰、可改，还能翻译
- 所有片段都上传同一张 Mia 参考图（PDF Tip 3：锁定角色）；Output sound 设为 close，配音后期再加（PDF：避免音频版权报错）

### intro · 开场（12s）
**剧情：** Mia 拖着行李箱进宿舍，把存钱罐放到桌上。Piggy 睁开眼睛。
- 🐷 Piggy："Hi. I'm Piggy. Inside me: HK$8,000 — Mia's ENTIRE semester of living money."
- 👩 Mia："New city, new uni, new me. What could possibly go wrong?"
- 🐷 Piggy："...Famous last words."

> **Prompt：** SHOT 1 · ESTABLISH: wide shot, young East Asian woman, 18, shoulder-length black hair, mustard-yellow hoodie, round glasses, rolls a suitcase into a small cozy university dorm room, slow push-in. SHOT 2 · REVEAL: close-up, she places a small glossy pink ceramic piggy bank on the desk, the piggy bank opens big cartoon eyes. 2D pastel animation style, soft warm lighting. No text, no logo, no watermark, no duplicate characters.

---

### 第一章 · The Dream Job（刷单骗局）

**c1（12s）Day 3, 11:47 PM.** Mia 躺床上刷手机，突然坐起来，眼睛发光。
- 📱 *网页叠加 SMS：* "Hi dear 😊 Part-time job! Like videos from home, earn HK$800/day. No experience needed. Add Kelly on WhatsApp — only 5 spots left!"
- 👩 "HK$800 a DAY?! That's rent money!"
- 🐷 "That's also... suspiciously a lot of money for pressing a heart button."
- **选择：** ① Add "Kelly from HR" on WhatsApp → c1_hook　② Delete it & report the number → c1_safe　（超时 → c1_hook）
- 🚩 红旗：陌生人主动发工作邀约 / 工作量少、报酬高得离谱 / "只剩 5 个名额"制造紧迫感 / 要你转去私聊 App

> **Prompt：** young woman (same as reference) lying on a bed scrolling a phone, suddenly sits up with sparkling excited eyes; dim dorm room at night lit by phone glow; medium shot then close-up on face; phone screen faces away from camera. 2D pastel. No readable screen, no text, no logo.

**c1_safe（10s）** Mia 把号码丢进 Scameter 查一查，结果是高风险。删除、拉黑、举报。
- 🐷 "Look at you! Delete, block, report. I'm so proud I could cry coins." → **回主线 c2**

**c1_hook（15s）** Kelly 发来"任务一：给 3 条视频点赞"，Mia 照做，**真的收到 HK$50**。
- 🐷 "She... actually paid? Okay, maybe she's legit?"
- 📱 Kelly："You're a star 💕 Join our VIP Task Group: deposit HK$1,000, earn HK$3,000 commission tonight!"
- **选择：** ① Transfer HK$1,000 — easy money! → c1_trap　② Check the number on Scameter first → c1_check
- 🚩 红旗：先给小甜头建立信任（放饵）/ "先交钱才能赚钱"

**c1_check（10s）** Scameter：已被举报 37 次，类别为求职骗案。
- 👩 "She paid me fifty dollars... to steal a thousand." 🐷 "Keep the fifty. Block her." → **回主线 c2**

**c1_trap（15s）** Mia 转了 HK$1,000（Piggy 瘦一圈）。后台显示"佣金 HK$3,000 🎉"，但提现前要先交 HK$2,000"账户激活税"。
- 👩 "Tax?! ...but if I stop now, I lose the thousand."
- 🐷（晕倒）"That's EXACTLY what they want you to think!"
- **选择：** ① Pay the HK$2,000 "tax" to get it all back（再 −2,000）→ c1_recover　② Stop. Call 18222 now → c1_recover
- 🚩 红旗："沉没成本"陷阱：骗子会一直编新的费用

**c1_recover（15s）** Mia 打防骗易热线 18222。
- ☎️ "This is a task scam. The 'commission' never existed. Stop paying, keep your chat records, and report it — we'll try to intercept the transfer."
- 👩 "Lesson: losing money once is bad. Chasing it is worse." → **交叉回归主线 c2**

---

### 第二章 · The Officer Calls（假冒内地公安 / 虚拟绑架）

**c2（15s）Week 2, 9:15 AM.** 来电，先是"快递公司"录音，然后转接"Officer Wang"视频通话，屏幕上举着一张"通缉令"。
- ☎️ "This is HK Express Courier. Your parcel to Shanghai contains 12 fake passports. Press 1 to speak to the Mainland Public Security Bureau."
- 👮 Wang："This case is TOP SECRET. Tell anyone — even your roommate — and you'll be charged too."
- 📄 *网页叠加：* ARREST WARRANT · Suspect: MIA CHEN · Case: Cross-border money laundering
- **选择：** ① Hang up & call 18222 → c2_safe　② Cooperate quietly to clear my name → c2_deep　（超时 → c2_deep）
- 🚩 红旗：快递电话"转接"到公安 / 隔着屏幕出示"通缉令" / 要求保密，不准告诉任何人 / 内地执法人员不会通过电话在香港办案

> **Prompt：** SHOT 1: medium shot, young woman (reference) at her desk answering a phone call, relaxed then freezing, slow push-in. SHOT 2: close-up, her face turns pale and scared, camera still. SHOT 3: over-the-shoulder on phone video call showing a stern middle-aged man in a dark generic uniform with no badges, plain grey wall, he holds up a blank sheet of paper. 2D pastel, cool blue tone. No readable text, no logos, no police insignia.

**c2_safe（10s）** 18222："Real police never ask you to keep it secret, transfer money, or show a warrant by video call." Jo 探头："Again?? Those guys call me every month." → **回主线 c3**

**c2_deep（15s）** Wang："To prove your innocence, transfer your funds to our 'safety supervision account'. Then check into a hotel ALONE. Turn off your phone to your family."
- **选择：** ① Do it — pack a bag for the hotel → c2_door　② Ask to meet at a real police station instead → c2_crack

**c2_crack（10s）** Wang 恼羞成怒，咆哮后挂断。
- 👩 "Real police would WANT me at a police station." 🐷 "Officer Wang just failed the vibe check." → **交叉回归 c3**

**c2_door（15s）** 半夜，Mia 已经转出 HK$3,000"验资"（Piggy 再瘦一圈），拖着行李箱正要出门，Jo 刚好开门。耳机里 Wang 低声说："Say nothing. Walk."
- 🧑 Jo："Where are you going with a suitcase at midnight??"
- **选择：** ① Tell Jo everything → c2_rescue　② Lie: "Just a sleepover." → 💀 END Gone Dark　（超时 → Gone Dark）

> **Prompt：** dim dorm corridor at midnight, young woman (reference) with a suitcase and an earphone, nervous; roommate with short blue hair in grey pajamas opens a door and stares at her; medium two-shot, then close-up on the young woman hesitating. 2D pastel, moody purple lighting. No text, no logo.

**c2_rescue（15s）** Jo 一把抢过手机，打 18222。
- ☎️ "This is a fake-official scam. Their next step was 'virtual kidnapping' — faking a video of you 'kidnapped' to get ransom from your parents. We're contacting your bank to freeze the transfer."
- 🐷 "Never underestimate a nosy roommate." → **交叉回归 c3**（追回 HK$3,000）

---

### 第三章 · Mom's Video Call（AI 深伪诈骗）

**c3（15s）Week 5, 2:03 AM.** 一个"新账号"打来视频通话，显示是"Mom ❤️"。画面很暗，妈妈的脸几乎不动，口型对不上。
- 👩‍🦳 "Sweetie, my phone broke, I'm on Auntie's account. Grandpa's in hospital — they need a HK$4,000 deposit NOW. Don't call Dad, he's with the doctors. Hurry!"
- 🐷 "Wait. Why does Mom blink like a screensaver?"
- **选择：** ① Send HK$4,000 now — it's Mom! → c3_sent　② Verify first → c3_verify　（超时 → c3_sent）
- 🚩 红旗：新账号 / 凌晨催钱 / 不让你联系其他家人 / 画面破绽（口型、眨眼、边缘模糊）/ 转账到第三方账户

> **Prompt：** dark dorm room at 2am, young woman (reference) sitting up in bed holding a phone video call, worried; over-the-shoulder view of the call showing a middle-aged woman in dim light with an unnaturally smooth stiff face, subtle digital flicker at the edges of her face; slow push-in. 2D pastel, cold screen glow. No readable text, no logo.
> 💡 **演讲亮点：** 这里可以故意让 AI 生成的"妈妈"有瑕疵，和一段"正常"的生成片段并排对比，用来说明深伪会露出哪些破绽（这部分可以放进 Insights）。

**c3_verify（15s）** Mia："Mom, what was the name of our first dog?" 假妈妈卡顿、画面闪烁："Sweetie… no time for games!"，然后通话断了。Mia 打妈妈原来的号码，真妈妈迷迷糊糊地接起来：
- 👩‍🦳 "Mia? It's 2am... Grandpa's fine, he's snoring right next to me."
- 🐷 "AI can copy a face. It can't copy your memories."
- → 一分没丢 = 🛡️ **Scam Slayer**；之前丢过钱 = 🔁 **Comeback Kid**

**c3_sent（15s）** 转了 HK$4,000。十分钟后真妈妈发来信息："Why is Auntie asking if you're okay? I never called you."
- **选择：** ① Call the bank + 18222 RIGHT NOW → 🔁 Comeback Kid（及时冻结，追回 HK$2,000）　② Too embarrassed. Tell no one. → 💀 Face Swapped

---

### 四个结局（每个 10s，配上结尾字卡）

| 结局 | 画面 | 结语 |
|---|---|---|
| 🛡️ **Scam Slayer** | 学期末，Piggy 圆滚滚的，和 Mia 一起戴墨镜 | "You spotted every trick. Now send this to the friend who clicks every link." |
| 🔁 **Comeback Kid** | Piggy 瘦了但贴着创可贴竖大拇指 | "You got hooked — but you stopped, spoke up and reported. Fast action, no shame." |
| 💀 **Gone Dark** | Mia 的手机屏幕变黑；远方父母收到一段视频 | "Silence is a scammer's best friend. In real cases, students were told to fake their own kidnapping." |
| 💀 **Face Swapped** | Piggy 空空的，倒在桌上 | "Deepfakes need only seconds of a voice and a few selfies. Shame keeps victims silent — don't let it." |

所有结局最后都显示：**防骗易热线 18222 · Scameter 防骗视伏器（cyberdefender.hk）· 紧急情况 999**

---

## 视频预算与剪辑方案（Seedance 2.0 · 480P 省钱版）

**统一参数：** Seedance 2.0 · Ref-to-video（全程用同一张 Mia 参考图）· 16:9 · **480P** · Output sound **close**（配音和音效后期加）· 每次只出 1 条（Quantity 1）。

**分两档省钱：**

| 档位 | 节点 | 做法 | 数量 |
|---|---|---|---|
| 🎬 **视频节点** | intro, c1, c1_hook, c1_trap, c2, c2_deep, c2_door, c2_rescue, c3, c3_verify, c3_sent | Seedance 2.0 生成，**10 秒**（关键剧情可以到 12–15 秒） | 11 段 |
| 🖼️ **图片节点** | c1_safe, c1_check, c1_recover, c2_safe, c2_crack + 4 个结局 | 只生成**一张图**（用 Seedance 的首帧或任意出图工具），网页给它加缓慢推镜、Piggy 抖动等 CSS 动效，配字幕和配音 | 9 张 |

- **额度估算：** 11 段视频 × 平均 3 次 ≈ 33 次，加上重试和调参，大约 40–45 次。离老师给的 80 次上限还有很多余量，可以留一部分做"短 prompt vs 详细 prompt"这类对比实验，正好给演讲当素材
- **480P 不清楚的问题：** 网页播放器的尺寸限制在大约 854×480 以内，看起来就不会糊；2D 粉彩画风本来就对分辨率不敏感；所有文字都由 HTML 叠加，所以 480P 不会影响可读性
- **省钱技巧：** 写 prompt 之前先在网页原型里把整条故事线走一遍，确认剧情没问题再生成；生成时遵循 PDF 的 "Extend / Fix" 原则，只重做效果差的那一段
- **2 分钟演讲主片（Deliverable）：** 剪 **"Comeback Kid" 路线**：intro → c1 → c1_hook → c1_trap → c1_recover → c2 → c2_crack → c3 → c3_verify → 结局。犯错、止损、回归、深伪识破都包含在内，戏剧性最强，约 120 秒
- **网页：** 20 个节点全部放上去，观众自己选

## 演讲时可用的 Insights 素材（对应评分第 4 项）

1. **AI 屏幕文字乱码 → 改成 HTML 叠加**：把模型的局限变成了设计上的优势（字幕可以翻译、可以修改）
2. **我们自己就能做出"假妈妈"**：亲身体会到深伪的门槛有多低。讨论伦理和平台责任
3. **倒计时实验**：可以让同学在有倒计时和没有倒计时两种情况下各玩一遍，比较选错率，作为一个小型用户测试
4. **网页可以收集匿名的"选择统计"**（可选功能），例如"62% 的人在 c1 加了 Kelly"，现场展示数据
