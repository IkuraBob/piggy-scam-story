// =============================================================
//  Piggy's Last Semester — story graph
//  Edit THIS file to change the story. No other code changes needed.
//
//  Node fields
//    kind     "video" | "image"   (what the team will produce for it)
//    media    path to the real file once it exists, e.g. "media/c1.mp4"
//             or "media/c1_safe.png". Leave null -> animated placeholder.
//    scene    placeholder look: { emoji, bg, tag }
//    lines    subtitles / dialogue: { who, text, t? } (t = seconds)
//             Text fields use { en, zh }; branching fields stay unchanged.
//    phone    HTML overlay (AI video can't render readable text):
//             { kind: "sms"|"chat"|"call"|"doc"|"scan", from, text }
//    enter    effect applied on arrival: { money, lost, recovered }
//    flag     red-flag badge earned on arrival (string)
//    redFlags list shown by "Spot the red flags"
//    choices  [{ label, to, safe, effect }]   (shown when clip ends)
//    timeoutTo node chosen automatically when the countdown hits 0
//    next     auto-continue target (no choice)
//    branch   { ifLost, else } — pick by whether money was ever lost
//    ending   { title, badge, good, text, rewind }
//    pos      [column, row] on the story map
// =============================================================

const START_MONEY = 8000;

const STORY = {
  intro: {
    chapter: { en: "Prologue", zh: "序章" }, title: { en: "Meet Piggy", zh: "认识 Piggy" }, kind: "video", media: null, pos: [0, 1],
    scene: { emoji: "🧳🏠🐷", bg: "linear-gradient(135deg,#ffd6e7,#ffe9c7)", tag: { en: "Move-in day · Hall room", zh: "搬入宿舍 · 房间" } },
    lines: [
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "Hi. I'm Piggy. Inside me: HK$8,000 — Mia's ENTIRE semester of living money.", zh: "嗨，我是 Piggy。我肚子里装着港币 8,000 元——Mia 整个学期的生活费。" }, t: 3.3 },
      { who: { en: "Mia", zh: "Mia" }, text: { en: "New city, new uni, new me. What could possibly go wrong?", zh: "新城市，新大学，全新的我。能出什么问题呢？" }, t: 7.4 },
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "...Famous last words.", zh: "……这话听着就不妙。" }, t: 13.5 }
    ],
    next: "c1"
  },

  // ---------------- Chapter 1 · Task scam ----------------
  c1: {
    chapter: { en: "Ch.1 The Dream Job", zh: "第一章 · 梦想兼职" }, title: { en: "A Text at Midnight", zh: "午夜短信" }, kind: "video", media: null, pos: [1, 1],
    scene: { emoji: "🛏️📱✨", bg: "linear-gradient(135deg,#2b2d5c,#6b5fa8)", tag: { en: "Day 3 · 11:47 PM", zh: "第 3 天 · 晚上 11:47" } },
    phone: { kind: "sms", from: { en: "+852 5•••• ••••", zh: "+852 5•••• ••••" }, text: { en: "Hi dear 😊 Part-time job! Like videos from home, earn HK$800/day. No experience needed. Add Kelly on WhatsApp — only 5 spots left!", zh: "亲 😊 招兼职！在家给视频点赞，日赚港币 800 元，无需经验。WhatsApp 加 Kelly——只剩 5 个名额！" } },
    lines: [
      { who: { en: "Mia", zh: "Mia" }, text: { en: "HK$800 a DAY?! That's rent money!", zh: "一天港币 800 元？！够交房租了！" }, t: 2.6 },
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "That's also... suspiciously a lot of money for pressing a heart button.", zh: "只是点个爱心就赚这么多……可疑得很。" }, t: 7.1 }
    ],
    redFlags: [{ en: "A stranger offers you a job out of nowhere", zh: "陌生人主动给你介绍工作" }, { en: "Pay is way too high for too little work", zh: "工作量很少，报酬却高得离谱" }, { en: "Fake urgency: \"only 5 spots left\"", zh: "“只剩 5 个名额”制造虚假紧迫感" }, { en: "Pushes you to a private chat app", zh: "催你转到私人聊天软件" }],
    choices: [
      { label: { en: "Add \"Kelly from HR\" on WhatsApp", zh: "在 WhatsApp 加“人事部 Kelly”" }, to: "c1_hook", safe: false },
      { label: { en: "Delete it & report the number", zh: "删除短信并举报号码" }, to: "c1_safe", safe: true }
    ],
    timeoutTo: "c1_hook"
  },
  c1_safe: {
    chapter: { en: "Ch.1 The Dream Job", zh: "第一章 · 梦想兼职" }, title: { en: "Blocked!", zh: "已拉黑！" }, kind: "image", media: null, pos: [2, 0],
    scene: { emoji: "🛡️🐷💖", bg: "linear-gradient(135deg,#c8f7dc,#e6fff2)", tag: { en: "Day 3 · 11:49 PM", zh: "第 3 天 · 晚上 11:49" } },
    phone: { kind: "scan", from: { en: "Scameter check", zh: "防骗视伏器查询" }, text: { en: "⚠️ HIGH RISK — number reported for job scams", zh: "⚠️ 高风险——该号码曾被举报涉及求职诈骗" } },
    lines: [{ who: { en: "Piggy", zh: "Piggy" }, text: { en: "Look at you! Delete, block, report. I'm so proud I could cry coins.", zh: "看看你！删除、拉黑、举报。我骄傲得都快哭出硬币了。" } }],
    flag: { en: "Ignored a too-good-to-be-true job", zh: "识破好得不真实的工作邀约" },
    next: "c2"
  },
  c1_hook: {
    chapter: { en: "Ch.1 The Dream Job", zh: "第一章 · 梦想兼职" }, title: { en: "The Bait", zh: "诱饵" }, kind: "video", media: null, pos: [2, 2],
    scene: { emoji: "👍💸🎣", bg: "linear-gradient(135deg,#ffe3a3,#ffc2d1)", tag: { en: "Day 3 · 11:58 PM", zh: "第 3 天 · 晚上 11:58" } },
    enter: { money: +50 },
    phone: { kind: "chat", from: { en: "Kelly from HR 💼", zh: "人事部 Kelly 💼" }, text: { en: "You're a star 💕 HK$50 sent! Now join our VIP Task Group: deposit HK$1,000, earn HK$3,000 commission tonight!", zh: "你太棒了 💕 港币 50 元已到账！现在加入 VIP 任务群：先存港币 1,000 元，今晚赚港币 3,000 元佣金！" } },
    lines: [
      { who: { en: "Mia", zh: "Mia" }, text: { en: "Wait — she actually paid me fifty dollars!", zh: "等等——她真的给了我五十块！" }, t: 2.8 },
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "She... did? Okay, maybe she's legit?", zh: "她……真给了？难道是正规的？" }, t: 6.9 }
    ],
    redFlags: [{ en: "A small real payout first — classic bait to build trust", zh: "先付一小笔真钱——用诱饵建立信任" }, { en: "You must PAY to EARN", zh: "想赚钱，却得先付钱" }, { en: "\"Commission tonight\" — rushing you again", zh: "“今晚拿佣金”——又在催你" }],
    choices: [
      { label: { en: "Transfer HK$1,000 — easy money!", zh: "转港币 1,000 元——这钱真好赚！" }, to: "c1_trap", safe: false },
      { label: { en: "Check the number on Scameter first", zh: "先用防骗视伏器查号码" }, to: "c1_check", safe: true }
    ],
    timeoutTo: "c1_trap"
  },
  c1_check: {
    chapter: { en: "Ch.1 The Dream Job", zh: "第一章 · 梦想兼职" }, title: { en: "37 Reports", zh: "37 次举报" }, kind: "image", media: null, pos: [3, 1],
    scene: { emoji: "🔍🚨🐷", bg: "linear-gradient(135deg,#d7ecff,#f0f7ff)", tag: { en: "Day 4 · 12:03 AM", zh: "第 4 天 · 凌晨 12:03" } },
    phone: { kind: "scan", from: { en: "Scameter check", zh: "防骗视伏器查询" }, text: { en: "⚠️ Reported 37 times — Employment fraud", zh: "⚠️ 已被举报 37 次——求职诈骗" } },
    lines: [
      { who: { en: "Mia", zh: "Mia" }, text: { en: "She paid me fifty dollars... to steal a thousand.", zh: "她给我五十块……是为了骗走一千块。" } },
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "Keep the fifty. Block her.", zh: "五十块留下。把她拉黑。" } }
    ],
    flag: { en: "Checked before paying", zh: "付款前先核查" },
    next: "c2"
  },
  c1_trap: {
    chapter: { en: "Ch.1 The Dream Job", zh: "第一章 · 梦想兼职" }, title: { en: "The 'Tax'", zh: "所谓的“税”" }, kind: "video", media: null, pos: [3, 2],
    scene: { emoji: "💸😵🐷", bg: "linear-gradient(135deg,#ffb3b3,#ffd9c2)", tag: { en: "Day 4 · 12:20 AM", zh: "第 4 天 · 凌晨 12:20" } },
    enter: { money: -1000, lost: true },
    phone: { kind: "chat", from: { en: "Kelly from HR 💼", zh: "人事部 Kelly 💼" }, text: { en: "Congrats! Commission HK$3,000 🎉 To withdraw, pay the account activation tax: HK$2,000.", zh: "恭喜！佣金港币 3,000 元 🎉 提现前请先支付账户激活税：港币 2,000 元。" } },
    lines: [
      { who: { en: "Mia", zh: "Mia" }, text: { en: "Tax?! ...but if I stop now, I lose the thousand.", zh: "税？！……可我现在停手，那一千块就没了。" }, t: 0.1 },
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "*faints* That's EXACTLY what they want you to think!", zh: "*晕倒* 他们就是想让你这么想！" }, t: 7.0 }
    ],
    redFlags: [{ en: "The 'balance' on their site is just a number they typed", zh: "网站上的“余额”只是他们输入的数字" }, { en: "New fees keep appearing — that's the sunk-cost trap", zh: "新费用接连出现——这就是沉没成本陷阱" }],
    choices: [
      { label: { en: "Pay the HK$2,000 \"tax\" to get it all back", zh: "付港币 2,000 元“税”，把钱全拿回来" }, to: "c1_recover", safe: false, effect: { money: -2000, lost: true } },
      { label: { en: "Stop. Call 18222 now.", zh: "停手。马上打 18222。" }, to: "c1_recover", safe: true }
    ],
    timeoutTo: "c1_recover"
  },
  c1_recover: {
    chapter: { en: "Ch.1 The Dream Job", zh: "第一章 · 梦想兼职" }, title: { en: "Calling 18222", zh: "拨打 18222" }, kind: "image", media: null, pos: [4, 2],
    scene: { emoji: "☎️🩹🐷", bg: "linear-gradient(135deg,#e3dcff,#f6f2ff)", tag: { en: "Day 4 · 12:31 AM", zh: "第 4 天 · 凌晨 12:31" } },
    phone: { kind: "call", from: { en: "Anti-Scam Helpline 18222", zh: "防骗易热线 18222" }, text: { en: "Connected", zh: "已接通" } },
    lines: [
      { who: { en: "Helpline", zh: "热线人员" }, text: { en: "This is a task scam. The 'commission' never existed. Stop paying, keep your chat records, and report it — we'll try to intercept the transfer.", zh: "这是刷单诈骗。所谓的“佣金”从未存在。停止付款，保留聊天记录并报案——我们会尝试拦截转账。" } },
      { who: { en: "Mia", zh: "Mia" }, text: { en: "Lesson: losing money once is bad. Chasing it is worse.", zh: "学到了：亏一次钱已经够糟，为了追回来继续付钱更糟。" } }
    ],
    flag: { en: "Stopped the sunk-cost trap & reported", zh: "停止追加付款并报案" },
    next: "c2"
  },

  // ---------------- Chapter 2 · Fake officials ----------------
  c2: {
    chapter: { en: "Ch.2 The Officer Calls", zh: "第二章 · 警官来电" }, title: { en: "Top Secret", zh: "绝对保密" }, kind: "video", media: null, pos: [5, 1],
    scene: { emoji: "📞👮📄", bg: "linear-gradient(135deg,#9fb8d9,#d8e3f2)", tag: { en: "Week 2 · 9:15 AM", zh: "第 2 周 · 上午 9:15" } },
    phone: { kind: "doc", from: { en: "Video call · 'Officer Wang'", zh: "视频通话 · “王警官”" }, text: { en: "ARREST WARRANT\nSuspect: MIA CHEN\nCase: Cross-border money laundering", zh: "通缉令\n嫌疑人：MIA CHEN\n案由：跨境洗钱" } },
    lines: [
      { who: { en: "Recording", zh: "录音" }, text: { en: "HK Express Courier. Your parcel holds 12 fake passports. Press 1 for the Mainland police.", zh: "HK Express 快递。你的包裹里有 12 本假护照。按 1 转接内地公安。" }, t: 0.4 },
      { who: { en: "Wang", zh: "王警官" }, text: { en: "This case is TOP SECRET. Tell anyone — even your roommate — and you're charged too.", zh: "本案绝对保密。告诉任何人——包括室友——你也会被起诉。" }, t: 7.7 }
    ],
    redFlags: [{ en: "A 'courier' call that transfers you to 'police'", zh: "“快递公司”来电转接到“公安”" }, { en: "A warrant shown over video call", zh: "通过视频通话出示通缉令" }, { en: "Demands secrecy — don't tell anyone", zh: "要求保密，不许告诉任何人" }, { en: "Mainland officers don't handle cases by phone in Hong Kong", zh: "内地执法人员不会通过电话在香港办案" }],
    choices: [
      { label: { en: "Hang up & call 18222", zh: "挂断电话并拨打 18222" }, to: "c2_safe", safe: true },
      { label: { en: "Cooperate quietly to clear my name", zh: "悄悄配合，证明自己清白" }, to: "c2_deep", safe: false }
    ],
    timeoutTo: "c2_deep"
  },
  c2_safe: {
    chapter: { en: "Ch.2 The Officer Calls", zh: "第二章 · 警官来电" }, title: { en: "Hung Up", zh: "挂断了" }, kind: "image", media: null, pos: [6, 0],
    scene: { emoji: "📵😎🐷", bg: "linear-gradient(135deg,#c8f7dc,#e6fff2)", tag: { en: "Week 2 · 9:20 AM", zh: "第 2 周 · 上午 9:20" } },
    lines: [
      { who: { en: "Helpline", zh: "热线人员" }, text: { en: "Real police never ask you to keep it secret, transfer money, or show a warrant by video call.", zh: "真正的警察不会要求你保密、转账，或通过视频通话出示通缉令。" } },
      { who: { en: "Jo", zh: "Jo" }, text: { en: "Again?? Those guys call me every month.", zh: "又来？？这些人每个月都给我打电话。" } }
    ],
    flag: { en: "Hung up on a fake official", zh: "挂断假冒执法人员的来电" },
    next: "c3"
  },
  c2_deep: {
    chapter: { en: "Ch.2 The Officer Calls", zh: "第二章 · 警官来电" }, title: { en: "The 'Safety Account'", zh: "所谓的“安全账户”" }, kind: "video", media: null, pos: [6, 2],
    scene: { emoji: "👮🏨🔒", bg: "linear-gradient(135deg,#7f8fb3,#b9c3db)", tag: { en: "Week 2 · 10:02 AM", zh: "第 2 周 · 上午 10:02" } },
    lines: [
      { t: 0.0, who: { en: "Wang", zh: "王警官" }, text: { en: "Prove your innocence: move your money to our 'safety account'.", zh: "要证明清白，就把钱转到我们的\"安全账户\"。" } },
      { t: 4.0, who: { en: "Wang", zh: "王警官" }, text: { en: "Then stay in a hotel. Alone. Tell no one.", zh: "然后去酒店住。一个人。谁也别告诉。" } },
      { t: 9.6, who: { en: "Piggy", zh: "Piggy" }, text: { en: "Why does a policeman want ME?", zh: "警察为什么要我？" } }
    ],
    redFlags: [{ en: "Police never hold your money in a 'safety account'", zh: "警方不会用“安全账户”保管你的钱" }, { en: "Isolating you from family and friends", zh: "让你与亲友隔绝" }, { en: "Fear + secrecy = scam", zh: "恐惧加保密，就是骗局" }],
    choices: [
      { label: { en: "Do it — pack a bag for the hotel", zh: "照做——收拾行李去酒店" }, to: "c2_door", safe: false },
      { label: { en: "Ask to meet at a real police station instead", zh: "要求改到真正的警署见面" }, to: "c2_crack", safe: true }
    ],
    timeoutTo: "c2_door"
  },
  c2_crack: {
    chapter: { en: "Ch.2 The Officer Calls", zh: "第二章 · 警官来电" }, title: { en: "Vibe Check Failed", zh: "露馅了" }, kind: "image", media: null, pos: [7, 1],
    scene: { emoji: "😡📴🐷", bg: "linear-gradient(135deg,#ffe0b3,#fff3e0)", tag: { en: "Week 2 · 10:05 AM", zh: "第 2 周 · 上午 10:05" } },
    lines: [
      { who: { en: "Wang", zh: "王警官" }, text: { en: "You DARE question me?! *click*", zh: "你敢质疑我？！*挂断*" } },
      { who: { en: "Mia", zh: "Mia" }, text: { en: "Real police would WANT me at a police station.", zh: "真正的警察应该巴不得我去警署。" } },
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "Officer Wang just failed the vibe check.", zh: "王警官这下露馅了。" } }
    ],
    flag: { en: "Asked a question a scammer can't answer", zh: "提出骗子答不上来的问题" },
    next: "c3"
  },
  c2_door: {
    chapter: { en: "Ch.2 The Officer Calls", zh: "第二章 · 警官来电" }, title: { en: "Midnight Suitcase", zh: "午夜行李箱" }, kind: "video", media: null, pos: [7, 2],
    scene: { emoji: "🧳🚪👀", bg: "linear-gradient(135deg,#3b2f63,#7a5a9e)", tag: { en: "Week 2 · 11:58 PM", zh: "第 2 周 · 晚上 11:58" } },
    enter: { money: -3000, lost: true },
    lines: [
      { t: 0.5, who: { en: "Narrator", zh: "旁白" }, text: { en: "Mia has already transferred HK$3,000 'for verification'.", zh: "Mia 已经转出港币 3,000 元“验资费”。" } },
      { t: 6.4, who: { en: "Wang (earpiece)", zh: "王警官（耳机里）" }, text: { en: "Say nothing. Walk.", zh: "什么都别说。走。" } },
      { t: 9.6, who: { en: "Jo", zh: "Jo" }, text: { en: "Where are you going with a suitcase at midnight??", zh: "大半夜拖着行李箱，你要去哪？？" } }
    ],
    redFlags: [{ en: "You're being told to lie to people who care about you", zh: "有人让你欺骗关心你的人" }, { en: "This is how 'virtual kidnapping' starts", zh: "“虚拟绑架”就是这样开始的" }],
    choices: [
      { label: { en: "Tell Jo everything", zh: "把一切告诉 Jo" }, to: "c2_rescue", safe: true },
      { label: { en: "Lie: \"Just a sleepover.\"", zh: "撒谎：“去朋友家过夜。”" }, to: "end_dark", safe: false }
    ],
    timeoutTo: "end_dark"
  },
  c2_rescue: {
    chapter: { en: "Ch.2 The Officer Calls", zh: "第二章 · 警官来电" }, title: { en: "Nosy Roommate Saves the Day", zh: "多管闲事的室友救了场" }, kind: "video", media: null, pos: [8, 2],
    scene: { emoji: "🙋‍♀️☎️🐷", bg: "linear-gradient(135deg,#d6f5ff,#effbff)", tag: { en: "Week 3 · 12:04 AM", zh: "第 3 周 · 凌晨 12:04" } },
    enter: { money: +3000, recovered: true },
    phone: { kind: "call", from: { en: "Anti-Scam Helpline 18222", zh: "防骗易热线 18222" }, text: { en: "Connected", zh: "已接通" } },
    lines: [
      { t: 0.1, who: { en: "Helpline", zh: "热线人员" }, text: { en: "It's a fake-official scam. Next, they'd fake your kidnapping to get ransom from your parents.", zh: "这是冒充官员诈骗。下一步，他们会伪造你被绑架，向你父母勒索赎金。" } },
      { t: 5.9, who: { en: "Helpline", zh: "热线人员" }, text: { en: "Your HK$3,000 transfer is frozen.", zh: "你那笔港币 3,000 元的转账已被冻结。" } },
      { t: 9.3, who: { en: "Piggy", zh: "Piggy" }, text: { en: "Never underestimate a nosy roommate.", zh: "永远别小看爱管闲事的室友。" } }
    ],
    flag: { en: "Broke the secrecy & got help", zh: "打破保密要求，主动求助" },
    next: "c3"
  },

  // ---------------- Chapter 3 · Deepfake ----------------
  c3: {
    chapter: { en: "Ch.3 Mom's Video Call", zh: "第三章 · 妈妈的视频通话" }, title: { en: "Mom? At 2 AM?", zh: "妈妈？凌晨两点？" }, kind: "video", media: null, pos: [9, 1],
    scene: { emoji: "🌙📹👩‍🦳", bg: "linear-gradient(135deg,#1f2340,#454a7a)", tag: { en: "Week 5 · 2:03 AM", zh: "第 5 周 · 凌晨 2:03" }, glitch: true },
    phone: { kind: "call", from: { en: "Mom ❤️ (new account)", zh: "妈妈 ❤️（新账号）" }, text: { en: "Video call", zh: "视频通话" } },
    lines: [
      { who: { en: "Mom?", zh: "妈妈？" }, text: { en: "Sweetie, my phone broke. Grandpa's in hospital — send HK$4,000 to Auntie's account NOW.", zh: "宝贝，我手机坏了。外公住院了——马上转港币 4,000 元到阿姨的账户。" } },
      { who: { en: "Mom?", zh: "妈妈？" }, text: { en: "Don't call Dad. Hurry!", zh: "别打给爸爸。快点！" } },
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "Why does Mom blink like a screensaver?", zh: "妈妈眨眼怎么像屏幕保护程序？" } }
    ],
    redFlags: [{ en: "A brand-new account", zh: "全新的账号" }, { en: "Money, urgently, at 2 AM", zh: "凌晨两点急着要钱" }, { en: "Stops you checking with other family", zh: "阻止你找其他家人核实" }, { en: "Glitches: lip-sync, blinking, blurry face edges", zh: "画面破绽：口型、眨眼和模糊的脸部边缘" }, { en: "Pay to a third-party account", zh: "要求转账到第三方账户" }],
    choices: [
      { label: { en: "Send HK$4,000 now — it's Mom!", zh: "马上转港币 4,000 元——她是妈妈！" }, to: "c3_sent", safe: false },
      { label: { en: "Verify first", zh: "先核实身份" }, to: "c3_verify", safe: true }
    ],
    timeoutTo: "c3_sent"
  },
  c3_verify: {
    chapter: { en: "Ch.3 Mom's Video Call", zh: "第三章 · 妈妈的视频通话" }, title: { en: "The Dog Question", zh: "关于小狗的问题" }, kind: "video", media: null, pos: [10, 0],
    scene: { emoji: "🐶❓👩‍🦳", bg: "linear-gradient(135deg,#ffe6f0,#fff5e6)", tag: { en: "Week 5 · 2:05 AM", zh: "第 5 周 · 凌晨 2:05" } },
    lines: [
      { who: { en: "Mia", zh: "Mia" }, text: { en: "Mom, what was our first dog's name?", zh: "妈，我们家第一只狗叫什么？" } },
      { who: { en: "Mom?", zh: "妈妈？" }, text: { en: "No time for g-g-games! *call dropped*", zh: "没时间玩、玩游戏！*通话断开*" } },
      { who: { en: "Real Mom", zh: "真正的妈妈" }, text: { en: "Mia? It's 2 AM. Grandpa's fine — he's snoring next door.", zh: "Mia？凌晨两点了。外公没事——他在隔壁房间打呼噜呢。" } },
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "AI can copy a face. Not your memories.", zh: "AI 能复制脸，复制不了回忆。" } }
    ],
    flag: { en: "Beat a deepfake with a secret question", zh: "用共同记忆的问题识破深伪" },
    branch: { ifLost: "end_comeback", else: "end_slayer" }
  },
  c3_sent: {
    chapter: { en: "Ch.3 Mom's Video Call", zh: "第三章 · 妈妈的视频通话" }, title: { en: "Ten Minutes Later", zh: "十分钟后" }, kind: "video", media: null, pos: [10, 2],
    scene: { emoji: "💸📩😱", bg: "linear-gradient(135deg,#ffb3b3,#ffe0e0)", tag: { en: "Week 5 · 2:15 AM", zh: "第 5 周 · 凌晨 2:15" } },
    enter: { money: -4000, lost: true },
    phone: { kind: "sms", from: { en: "Mom (real number)", zh: "妈妈（原号码）" }, text: { en: "Why is Auntie asking if you're okay? I never called you.", zh: "阿姨怎么问起你有没有事？我没打过电话给你啊。" } },
    lines: [
      { who: { en: "Mia", zh: "Mia" }, text: { en: "No. No no no.", zh: "不。不不不。" } },
      { who: { en: "Piggy", zh: "Piggy" }, text: { en: "Every minute counts now. Banks can freeze money — but only if you tell them FAST.", zh: "现在每一分钟都重要。银行可以冻结款项——但你得马上告诉他们。" } }
    ],
    redFlags: [{ en: "Feeling ashamed is normal — staying silent is what scammers count on", zh: "感到羞耻很正常——骗子就指望你保持沉默" }],
    choices: [
      { label: { en: "Call the bank + 18222 RIGHT NOW", zh: "马上联系银行并拨打 18222" }, to: "end_comeback", safe: true, effect: { money: +2000, recovered: true } },
      { label: { en: "Too embarrassed. Tell no one.", zh: "太丢脸了。谁也不告诉。" }, to: "end_faceswap", safe: false }
    ],
    timeoutTo: "end_faceswap"
  },

  // ---------------- Endings ----------------
  end_slayer: {
    chapter: { en: "Ending", zh: "结局" }, title: { en: "Scam Slayer", zh: "骗局终结者" }, kind: "image", media: null, pos: [11, 0],
    scene: { emoji: "🐷🕶️🏆", bg: "linear-gradient(135deg,#fff1a8,#ffd6e7)", tag: { en: "End of semester", zh: "学期结束" } },
    lines: [{ who: { en: "Piggy", zh: "Piggy" }, text: { en: "Still chubby. Still rich. Best semester ever.", zh: "还是圆滚滚的，还是有钱。最棒的一个学期。" } }],
    ending: { badge: "🛡️", good: true, title: { en: "SCAM SLAYER", zh: "骗局终结者" }, text: { en: "You spotted every trick. Now send this to the friend who clicks every link.", zh: "你识破了每个圈套。现在把这个故事发给那个见链接就点的朋友。" } }
  },
  end_comeback: {
    chapter: { en: "Ending", zh: "结局" }, title: { en: "Comeback Kid", zh: "及时止损者" }, kind: "image", media: null, pos: [11, 1],
    scene: { emoji: "🐷🩹👍", bg: "linear-gradient(135deg,#d6f5ff,#ffe6f0)", tag: { en: "End of semester", zh: "学期结束" } },
    lines: [{ who: { en: "Piggy", zh: "Piggy" }, text: { en: "A little lighter. A lot wiser.", zh: "轻了一点。也聪明了很多。" } }],
    ending: { badge: "🔁", good: true, title: { en: "COMEBACK KID", zh: "及时止损者" }, text: { en: "You got hooked — but you stopped, spoke up and reported. That's how money gets saved: fast action, no shame.", zh: "你上过钩，但你停了手、说了出来，也报了案。保住钱靠的就是及时行动，不必羞于求助。" } }
  },
  end_dark: {
    chapter: { en: "Ending", zh: "结局" }, title: { en: "Gone Dark", zh: "失联" }, kind: "image", media: null, pos: [8, 3],
    scene: { emoji: "📱⬛😢", bg: "linear-gradient(135deg,#1a1a1a,#3a3a3a)", tag: { en: "Two days later", zh: "两天后" } },
    lines: [{ who: { en: "Narrator", zh: "旁白" }, text: { en: "Mia went silent. Two days later, her parents received a video of her 'kidnapped' — and a ransom demand.", zh: "Mia 失联了。两天后，她的父母收到她“被绑架”的视频，以及索要赎金的信息。" } }],
    ending: { badge: "🌑", good: false, title: { en: "GONE DARK", zh: "失联" }, text: { en: "Silence is a scammer's best friend. In real 'virtual kidnapping' cases, students were told to fake their own kidnapping. Tell someone. Always.", zh: "沉默是骗子最好的朋友。在真实的“虚拟绑架”案件中，学生曾被要求假装自己遭到绑架。一定要告诉别人。" }, rewind: "c2_door" }
  },
  end_faceswap: {
    chapter: { en: "Ending", zh: "结局" }, title: { en: "Face Swapped", zh: "换脸陷阱" }, kind: "image", media: null, pos: [11, 3],
    scene: { emoji: "🎭🐷🕳️", bg: "linear-gradient(135deg,#3a2a4a,#6a4a6a)", tag: { en: "One week later", zh: "一周后" } },
    lines: [{ who: { en: "Piggy", zh: "Piggy" }, text: { en: "Four thousand dollars... gone. And Mia hasn't told a single soul.", zh: "四千块……没了。而 Mia 一个人都没告诉。" } }],
    ending: { badge: "🎭", good: false, title: { en: "FACE SWAPPED", zh: "换脸陷阱" }, text: { en: "A deepfake needs only seconds of a voice and a few selfies. Shame kept Mia quiet — and the money disappeared.", zh: "深伪只需要几秒语音和几张自拍。羞耻感让 Mia 保持沉默，钱也随之消失。" }, rewind: "c3_sent" }
  }
};

const HELP_LINES = [
  { label: { en: "Anti-Scam Helpline", zh: "防骗易热线" }, value: "18222" },
  { label: { en: "Scameter (check numbers, sites, accounts)", zh: "防骗视伏器（查询号码、网站及账户）" }, value: "cyberdefender.hk" },
  { label: { en: "Emergency", zh: "紧急求助" }, value: "999" }
];

// Quiz content lives beside the story; it does not change story choices.
const QUIZ = [
  {
    question: { en: 'A task group pays you HK$50, then asks for a deposit. What should you do?', zh: '任务群先付给你港币 50 元，随后要求交押金。你会怎么做？' },
    answers: [{ en: 'Pay to unlock the larger commission', zh: '付款，解锁更高佣金' }, { en: 'Stop and check before paying', zh: '停下来，付款前先核查' }], correct: 1,
    explanation: { en: 'The small payout is bait. In Mia’s story, paying led to more invented fees.', zh: '小额付款是诱饵。在 Mia 的故事中，付款后又出现了更多编造的费用。' }
  },
  {
    question: { en: 'An “officer” demands secrecy and a transfer to a “safety account”. What next?', zh: '“警官”要求保密，并让你转账到“安全账户”。下一步呢？' },
    answers: [{ en: 'Hang up, tell someone and call 18222', zh: '挂断电话，告诉他人并拨打 18222' }, { en: 'Cooperate quietly to clear your name', zh: '悄悄配合，证明自己清白' }], correct: 0,
    explanation: { en: 'Secrecy isolates Mia. Telling Jo gives her a way to stop and seek help.', zh: '保密要求让 Mia 陷入孤立。告诉 Jo，让她有机会停下来并求助。' }
  },
  {
    question: { en: '“Mom” calls from a new account asking for urgent money. How do you verify?', zh: '“妈妈”用新账号来电，急着要钱。你如何核实？' },
    answers: [{ en: 'Trust the familiar face on the screen', zh: '相信屏幕上熟悉的脸' }, { en: 'Call Mom’s known number before transferring', zh: '转账前先拨打妈妈原来的号码' }], correct: 1,
    explanation: { en: 'Mia checks through Mom’s known number. A familiar face alone is not enough to verify a call.', zh: 'Mia 通过妈妈原来的号码核实。仅凭熟悉的脸，不能确认来电身份。' }
  }
];
