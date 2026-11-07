// =============================================================
//  Piggy's Last Semester — story graph
//  Edit THIS file to change the story. No other code changes needed.
//
//  Node fields
//    kind     "video" | "image"   (what the team will produce for it)
//    media    path to the real file once it exists, e.g. "media/c1.mp4"
//             or "media/c1_safe.png". Leave null -> animated placeholder.
//    scene    placeholder look: { emoji, bg, tag }
//    lines    subtitles / dialogue: { who, text }
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
    chapter: "Prologue", title: "Meet Piggy", kind: "video", media: null, pos: [0, 1],
    scene: { emoji: "🧳🏠🐷", bg: "linear-gradient(135deg,#ffd6e7,#ffe9c7)", tag: "Move-in day · Hall room" },
    lines: [
      { who: "Piggy", text: "Hi. I'm Piggy. Inside me: HK$8,000 — Mia's ENTIRE semester of living money." },
      { who: "Mia", text: "New city, new uni, new me. What could possibly go wrong?" },
      { who: "Piggy", text: "...Famous last words." }
    ],
    next: "c1"
  },

  // ---------------- Chapter 1 · Task scam ----------------
  c1: {
    chapter: "Ch.1 The Dream Job", title: "A Text at Midnight", kind: "video", media: null, pos: [1, 1],
    scene: { emoji: "🛏️📱✨", bg: "linear-gradient(135deg,#2b2d5c,#6b5fa8)", tag: "Day 3 · 11:47 PM" },
    phone: { kind: "sms", from: "+852 5•••• ••••", text: "Hi dear 😊 Part-time job! Like videos from home, earn HK$800/day. No experience needed. Add Kelly on WhatsApp — only 5 spots left!" },
    lines: [
      { who: "Mia", text: "HK$800 a DAY?! That's rent money!" },
      { who: "Piggy", text: "That's also... suspiciously a lot of money for pressing a heart button." }
    ],
    redFlags: ["A stranger offers you a job out of nowhere", "Pay is way too high for too little work", "Fake urgency: \"only 5 spots left\"", "Pushes you to a private chat app"],
    choices: [
      { label: "Add \"Kelly from HR\" on WhatsApp", to: "c1_hook", safe: false },
      { label: "Delete it & report the number", to: "c1_safe", safe: true }
    ],
    timeoutTo: "c1_hook"
  },
  c1_safe: {
    chapter: "Ch.1 The Dream Job", title: "Blocked!", kind: "image", media: null, pos: [2, 0],
    scene: { emoji: "🛡️🐷💖", bg: "linear-gradient(135deg,#c8f7dc,#e6fff2)", tag: "Day 3 · 11:49 PM" },
    phone: { kind: "scan", from: "Scameter check", text: "⚠️ HIGH RISK — number reported for job scams" },
    lines: [{ who: "Piggy", text: "Look at you! Delete, block, report. I'm so proud I could cry coins." }],
    flag: "Ignored a too-good-to-be-true job",
    next: "c2"
  },
  c1_hook: {
    chapter: "Ch.1 The Dream Job", title: "The Bait", kind: "video", media: null, pos: [2, 2],
    scene: { emoji: "👍💸🎣", bg: "linear-gradient(135deg,#ffe3a3,#ffc2d1)", tag: "Day 3 · 11:58 PM" },
    enter: { money: +50 },
    phone: { kind: "chat", from: "Kelly from HR 💼", text: "You're a star 💕 HK$50 sent! Now join our VIP Task Group: deposit HK$1,000, earn HK$3,000 commission tonight!" },
    lines: [
      { who: "Mia", text: "Wait — she actually paid me fifty dollars!" },
      { who: "Piggy", text: "She... did? Okay, maybe she's legit?" }
    ],
    redFlags: ["A small real payout first — classic bait to build trust", "You must PAY to EARN", "\"Commission tonight\" — rushing you again"],
    choices: [
      { label: "Transfer HK$1,000 — easy money!", to: "c1_trap", safe: false },
      { label: "Check the number on Scameter first", to: "c1_check", safe: true }
    ],
    timeoutTo: "c1_trap"
  },
  c1_check: {
    chapter: "Ch.1 The Dream Job", title: "37 Reports", kind: "image", media: null, pos: [3, 1],
    scene: { emoji: "🔍🚨🐷", bg: "linear-gradient(135deg,#d7ecff,#f0f7ff)", tag: "Day 4 · 12:03 AM" },
    phone: { kind: "scan", from: "Scameter check", text: "⚠️ Reported 37 times — Employment fraud" },
    lines: [
      { who: "Mia", text: "She paid me fifty dollars... to steal a thousand." },
      { who: "Piggy", text: "Keep the fifty. Block her." }
    ],
    flag: "Checked before paying",
    next: "c2"
  },
  c1_trap: {
    chapter: "Ch.1 The Dream Job", title: "The 'Tax'", kind: "video", media: null, pos: [3, 2],
    scene: { emoji: "💸😵🐷", bg: "linear-gradient(135deg,#ffb3b3,#ffd9c2)", tag: "Day 4 · 12:20 AM" },
    enter: { money: -1000, lost: true },
    phone: { kind: "chat", from: "Kelly from HR 💼", text: "Congrats! Commission HK$3,000 🎉 To withdraw, pay the account activation tax: HK$2,000." },
    lines: [
      { who: "Mia", text: "Tax?! ...but if I stop now, I lose the thousand." },
      { who: "Piggy", text: "*faints* That's EXACTLY what they want you to think!" }
    ],
    redFlags: ["The 'balance' on their site is just a number they typed", "New fees keep appearing — that's the sunk-cost trap"],
    choices: [
      { label: "Pay the HK$2,000 \"tax\" to get it all back", to: "c1_recover", safe: false, effect: { money: -2000, lost: true } },
      { label: "Stop. Call 18222 now.", to: "c1_recover", safe: true }
    ],
    timeoutTo: "c1_recover"
  },
  c1_recover: {
    chapter: "Ch.1 The Dream Job", title: "Calling 18222", kind: "image", media: null, pos: [4, 2],
    scene: { emoji: "☎️🩹🐷", bg: "linear-gradient(135deg,#e3dcff,#f6f2ff)", tag: "Day 4 · 12:31 AM" },
    phone: { kind: "call", from: "Anti-Scam Helpline 18222", text: "Connected" },
    lines: [
      { who: "Helpline", text: "This is a task scam. The 'commission' never existed. Stop paying, keep your chat records, and report it — we'll try to intercept the transfer." },
      { who: "Mia", text: "Lesson: losing money once is bad. Chasing it is worse." }
    ],
    flag: "Stopped the sunk-cost trap & reported",
    next: "c2"
  },

  // ---------------- Chapter 2 · Fake officials ----------------
  c2: {
    chapter: "Ch.2 The Officer Calls", title: "Top Secret", kind: "video", media: null, pos: [5, 1],
    scene: { emoji: "📞👮📄", bg: "linear-gradient(135deg,#9fb8d9,#d8e3f2)", tag: "Week 2 · 9:15 AM" },
    phone: { kind: "doc", from: "Video call · 'Officer Wang'", text: "ARREST WARRANT\nSuspect: MIA CHEN\nCase: Cross-border money laundering" },
    lines: [
      { who: "Recording", text: "This is HK Express Courier. Your parcel to Shanghai contains 12 fake passports. Press 1 to speak to the Mainland Public Security Bureau." },
      { who: "Wang", text: "This case is TOP SECRET. Tell anyone — even your roommate — and you'll be charged too." }
    ],
    redFlags: ["A 'courier' call that transfers you to 'police'", "A warrant shown over video call", "Demands secrecy — don't tell anyone", "Mainland officers don't handle cases by phone in Hong Kong"],
    choices: [
      { label: "Hang up & call 18222", to: "c2_safe", safe: true },
      { label: "Cooperate quietly to clear my name", to: "c2_deep", safe: false }
    ],
    timeoutTo: "c2_deep"
  },
  c2_safe: {
    chapter: "Ch.2 The Officer Calls", title: "Hung Up", kind: "image", media: null, pos: [6, 0],
    scene: { emoji: "📵😎🐷", bg: "linear-gradient(135deg,#c8f7dc,#e6fff2)", tag: "Week 2 · 9:20 AM" },
    lines: [
      { who: "Helpline", text: "Real police never ask you to keep it secret, transfer money, or show a warrant by video call." },
      { who: "Jo", text: "Again?? Those guys call me every month." }
    ],
    flag: "Hung up on a fake official",
    next: "c3"
  },
  c2_deep: {
    chapter: "Ch.2 The Officer Calls", title: "The 'Safety Account'", kind: "video", media: null, pos: [6, 2],
    scene: { emoji: "👮🏨🔒", bg: "linear-gradient(135deg,#7f8fb3,#b9c3db)", tag: "Week 2 · 10:02 AM" },
    lines: [
      { who: "Wang", text: "To prove your innocence, transfer your funds to our 'safety supervision account'." },
      { who: "Wang", text: "Then check into a hotel ALONE. Turn off your phone to your family." },
      { who: "Piggy", text: "Mia... why is a policeman asking for ME?" }
    ],
    redFlags: ["Police never hold your money in a 'safety account'", "Isolating you from family and friends", "Fear + secrecy = scam"],
    choices: [
      { label: "Do it — pack a bag for the hotel", to: "c2_door", safe: false },
      { label: "Ask to meet at a real police station instead", to: "c2_crack", safe: true }
    ],
    timeoutTo: "c2_door"
  },
  c2_crack: {
    chapter: "Ch.2 The Officer Calls", title: "Vibe Check Failed", kind: "image", media: null, pos: [7, 1],
    scene: { emoji: "😡📴🐷", bg: "linear-gradient(135deg,#ffe0b3,#fff3e0)", tag: "Week 2 · 10:05 AM" },
    lines: [
      { who: "Wang", text: "You DARE question me?! *click*" },
      { who: "Mia", text: "Real police would WANT me at a police station." },
      { who: "Piggy", text: "Officer Wang just failed the vibe check." }
    ],
    flag: "Asked a question a scammer can't answer",
    next: "c3"
  },
  c2_door: {
    chapter: "Ch.2 The Officer Calls", title: "Midnight Suitcase", kind: "video", media: null, pos: [7, 2],
    scene: { emoji: "🧳🚪👀", bg: "linear-gradient(135deg,#3b2f63,#7a5a9e)", tag: "Week 2 · 11:58 PM" },
    enter: { money: -3000, lost: true },
    lines: [
      { who: "Narrator", text: "Mia has already transferred HK$3,000 'for verification'." },
      { who: "Wang (earpiece)", text: "Say nothing. Walk." },
      { who: "Jo", text: "Where are you going with a suitcase at midnight??" }
    ],
    redFlags: ["You're being told to lie to people who care about you", "This is how 'virtual kidnapping' starts"],
    choices: [
      { label: "Tell Jo everything", to: "c2_rescue", safe: true },
      { label: "Lie: \"Just a sleepover.\"", to: "end_dark", safe: false }
    ],
    timeoutTo: "end_dark"
  },
  c2_rescue: {
    chapter: "Ch.2 The Officer Calls", title: "Nosy Roommate Saves the Day", kind: "video", media: null, pos: [8, 2],
    scene: { emoji: "🙋‍♀️☎️🐷", bg: "linear-gradient(135deg,#d6f5ff,#effbff)", tag: "Week 3 · 12:04 AM" },
    enter: { money: +3000, recovered: true },
    phone: { kind: "call", from: "Anti-Scam Helpline 18222", text: "Connected" },
    lines: [
      { who: "Helpline", text: "This is a fake-official scam. Next they'd fake a video of you 'kidnapped' to get ransom from your parents." },
      { who: "Helpline", text: "We've contacted your bank — the HK$3,000 transfer is frozen." },
      { who: "Piggy", text: "Never underestimate a nosy roommate." }
    ],
    flag: "Broke the secrecy & got help",
    next: "c3"
  },

  // ---------------- Chapter 3 · Deepfake ----------------
  c3: {
    chapter: "Ch.3 Mom's Video Call", title: "Mom? At 2 AM?", kind: "video", media: null, pos: [9, 1],
    scene: { emoji: "🌙📹👩‍🦳", bg: "linear-gradient(135deg,#1f2340,#454a7a)", tag: "Week 5 · 2:03 AM", glitch: true },
    phone: { kind: "call", from: "Mom ❤️ (new account)", text: "Video call" },
    lines: [
      { who: "Mom?", text: "Sweetie, my phone broke, I'm on Auntie's account. Grandpa's in hospital — they need a HK$4,000 deposit NOW." },
      { who: "Mom?", text: "Don't call Dad, he's with the doctors. Hurry!" },
      { who: "Piggy", text: "Wait. Why does Mom blink like a screensaver?" }
    ],
    redFlags: ["A brand-new account", "Money, urgently, at 2 AM", "Stops you checking with other family", "Glitches: lip-sync, blinking, blurry face edges", "Pay to a third-party account"],
    choices: [
      { label: "Send HK$4,000 now — it's Mom!", to: "c3_sent", safe: false },
      { label: "Verify first", to: "c3_verify", safe: true }
    ],
    timeoutTo: "c3_sent"
  },
  c3_verify: {
    chapter: "Ch.3 Mom's Video Call", title: "The Dog Question", kind: "video", media: null, pos: [10, 0],
    scene: { emoji: "🐶❓👩‍🦳", bg: "linear-gradient(135deg,#ffe6f0,#fff5e6)", tag: "Week 5 · 2:05 AM" },
    lines: [
      { who: "Mia", text: "Mom, what was the name of our first dog?" },
      { who: "Mom?", text: "Sweetie… no time for g-g-games!  *call dropped*" },
      { who: "Real Mom", text: "Mia? It's 2 AM... Grandpa's fine, he's snoring right next to me." },
      { who: "Piggy", text: "AI can copy a face. It can't copy your memories." }
    ],
    flag: "Beat a deepfake with a secret question",
    branch: { ifLost: "end_comeback", else: "end_slayer" }
  },
  c3_sent: {
    chapter: "Ch.3 Mom's Video Call", title: "Ten Minutes Later", kind: "video", media: null, pos: [10, 2],
    scene: { emoji: "💸📩😱", bg: "linear-gradient(135deg,#ffb3b3,#ffe0e0)", tag: "Week 5 · 2:15 AM" },
    enter: { money: -4000, lost: true },
    phone: { kind: "sms", from: "Mom (real number)", text: "Why is Auntie asking if you're okay? I never called you." },
    lines: [
      { who: "Mia", text: "No. No no no." },
      { who: "Piggy", text: "Every minute counts now. Banks can freeze money — but only if you tell them FAST." }
    ],
    redFlags: ["Feeling ashamed is normal — staying silent is what scammers count on"],
    choices: [
      { label: "Call the bank + 18222 RIGHT NOW", to: "end_comeback", safe: true, effect: { money: +2000, recovered: true } },
      { label: "Too embarrassed. Tell no one.", to: "end_faceswap", safe: false }
    ],
    timeoutTo: "end_faceswap"
  },

  // ---------------- Endings ----------------
  end_slayer: {
    chapter: "Ending", title: "Scam Slayer", kind: "image", media: null, pos: [11, 0],
    scene: { emoji: "🐷🕶️🏆", bg: "linear-gradient(135deg,#fff1a8,#ffd6e7)", tag: "End of semester" },
    lines: [{ who: "Piggy", text: "Still chubby. Still rich. Best semester ever." }],
    ending: { badge: "🛡️", good: true, title: "SCAM SLAYER", text: "You spotted every trick. Now send this to the friend who clicks every link." }
  },
  end_comeback: {
    chapter: "Ending", title: "Comeback Kid", kind: "image", media: null, pos: [11, 1],
    scene: { emoji: "🐷🩹👍", bg: "linear-gradient(135deg,#d6f5ff,#ffe6f0)", tag: "End of semester" },
    lines: [{ who: "Piggy", text: "A little lighter. A lot wiser." }],
    ending: { badge: "🔁", good: true, title: "COMEBACK KID", text: "You got hooked — but you stopped, spoke up and reported. That's how money gets saved: fast action, no shame." }
  },
  end_dark: {
    chapter: "Ending", title: "Gone Dark", kind: "image", media: null, pos: [8, 3],
    scene: { emoji: "📱⬛😢", bg: "linear-gradient(135deg,#1a1a1a,#3a3a3a)", tag: "Two days later" },
    lines: [{ who: "Narrator", text: "Mia went silent. Two days later, her parents received a video of her 'kidnapped' — and a ransom demand." }],
    ending: { badge: "🌑", good: false, title: "GONE DARK", text: "Silence is a scammer's best friend. In real 'virtual kidnapping' cases, students were told to fake their own kidnapping. Tell someone. Always.", rewind: "c2_door" }
  },
  end_faceswap: {
    chapter: "Ending", title: "Face Swapped", kind: "image", media: null, pos: [11, 3],
    scene: { emoji: "🎭🐷🕳️", bg: "linear-gradient(135deg,#3a2a4a,#6a4a6a)", tag: "One week later" },
    lines: [{ who: "Piggy", text: "...echo... echo... I'm empty." }],
    ending: { badge: "🎭", good: false, title: "FACE SWAPPED", text: "A deepfake needs only seconds of a voice and a few selfies. Shame kept Mia quiet — and the money disappeared.", rewind: "c3_sent" }
  }
};

const HELP_LINES = [
  { label: "Anti-Scam Helpline", value: "18222" },
  { label: "Scameter (check numbers, sites, accounts)", value: "cyberdefender.hk" },
  { label: "Emergency", value: "999" }
];
