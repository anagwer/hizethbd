// Uses global pixelAudio and PokemonMiniGame so file:// double-click & web hosting both work

// ==================== STATE ====================
let coins = 0;
let loveCount = 0;
const completedQuests = new Set();

const TARGET_COINS = 50;
const TARGET_LOVE = 75;

const coinCountEl = document.getElementById("coinCount");
const questProgressCountEl = document.getElementById("questProgressCount");
const hudLoveCountEl = document.getElementById("hudLoveCount");
const finaleLoveCountEl = document.getElementById("finaleLoveCount");
const audioToggleBtn = document.getElementById("audioToggleBtn");
const toastEl = document.getElementById("pixelToast");

let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add("hidden"), 2800);
}

function syncVaultProgress() {
  const vaultCoinNow = document.getElementById("vaultCoinNow");
  const vaultLoveNow = document.getElementById("vaultLoveNow");
  const reqCoins = document.getElementById("reqCoins");
  const reqLove = document.getElementById("reqLove");
  const reqCoinsIcon = document.getElementById("reqCoinsIcon");
  const reqLoveIcon = document.getElementById("reqLoveIcon");
  const claimBtn = document.getElementById("claimRewardBtn");
  if (!vaultCoinNow) return;

  vaultCoinNow.textContent = coins;
  vaultLoveNow.textContent = loveCount;

  const coinOk = coins >= TARGET_COINS;
  const loveOk = loveCount >= TARGET_LOVE;

  reqCoins.classList.toggle("done", coinOk);
  reqLove.classList.toggle("done", loveOk);
  reqCoinsIcon.textContent = coinOk ? "✅" : "⬜";
  reqLoveIcon.textContent = loveOk ? "✅" : "⬜";

  if (coinOk && loveOk) {
    claimBtn.classList.remove("btn-vault-locked");
    claimBtn.classList.add("btn-vault-ready");
    claimBtn.textContent = "🎁 BUKA HADIAH UTAMA SEKARANG!";
  }
}

function addCoins(amount) {
  coins += amount;
  coinCountEl.textContent = coins;
  syncVaultProgress();
}

function addLove(amount) {
  loveCount = Math.max(0, loveCount + amount);
  hudLoveCountEl.textContent = loveCount;
  if (finaleLoveCountEl) finaleLoveCountEl.textContent = loveCount;
  syncVaultProgress();
}

function completeQuest(key, toastMsg) {
  if (completedQuests.has(key)) return;
  completedQuests.add(key);
  questProgressCountEl.textContent = completedQuests.size;
  if (toastMsg) showToast(toastMsg);
}

function syncAudioBtn(playing) {
  audioToggleBtn.textContent = playing ? "♪ ON" : "♪ OFF";
  audioToggleBtn.classList.toggle("on", playing);
}

// ==================== BACKGROUND SKY EFFECTS ====================
function initSkyDecor() {
  const starsLayer = document.getElementById("starsLayer");
  for (let i = 0; i < 18; i++) {
    const img = document.createElement("img");
    img.src = i % 3 === 0 ? "element/sparkle-yellow.png" : "element/star.png";
    img.alt = "";
    img.className = "bg-star pixel-art";
    img.style.left = `${(i * 19 + 7) % 96}%`;
    img.style.top = `${(i * 23 + 5) % 88}%`;
    img.style.width = `${12 + (i % 3) * 5}px`;
    img.style.height = "auto";
    img.style.animationDelay = `${(i * 0.37).toFixed(2)}s`;
    starsLayer.appendChild(img);
  }

  const shootingStar = document.getElementById("shootingStar");
  setInterval(() => {
    shootingStar.classList.remove("fly");
    void shootingStar.offsetWidth;
    shootingStar.style.top = `${8 + Math.random() * 26}%`;
    shootingStar.classList.add("fly");
  }, 7500);
}

// ==================== PROLOG: HERO & PROPS ====================
function initHeroStage() {
  const pressStartBtn = document.getElementById("pressStartBtn");
  const levelUpCard = document.getElementById("levelUpCard");

  audioToggleBtn.addEventListener("click", () => {
    const playing = pixelAudio.toggleBGM();
    syncAudioBtn(playing);
  });

  pressStartBtn.addEventListener("click", () => {
    pixelAudio.startBGM();
    syncAudioBtn(true);
    pixelAudio.sfxLevelUp();
    levelUpCard.classList.remove("hidden");
    completeQuest("prolog", "★ Prolog terbuka! Baca dulu lalu klik Lanjut ke Chapter 1.");
  });

  const heroCoinImg = document.getElementById("heroCoinImg");
  document.getElementById("heroCoinBtn").addEventListener("click", () => {
    pixelAudio.sfxCoin();
    addCoins(1);
    heroCoinImg.src = "element/coin-spin.png";
    setTimeout(() => {
      heroCoinImg.src = "element/coin.png";
    }, 320);
    showToast("+1 Birthday Coin buat hizetblue!");
  });

  let giftOpened = false;
  document.getElementById("heroGiftBtn").addEventListener("click", (e) => {
    pixelAudio.sfxOpen();
    addCoins(5);
    const img = e.currentTarget.querySelector("img");
    if (!giftOpened) {
      giftOpened = true;
      img.src = "element/mushroom.png";
      showToast("1-UP Mushroom! +5 Coins & ekstra semangat hari ini!");
    } else {
      showToast("Kado manis buat hizetblue: semoga tahun ini penuh kejutan baik!");
    }
  });

  const gems = ["element/gems-pink.png", "element/gems-purple.png", "element/gems-yellow.png", "element/diamond.png"];
  let gemIdx = 0;
  document.getElementById("heroChestBtn").addEventListener("click", (e) => {
    pixelAudio.sfxCoin();
    addCoins(3);
    const img = e.currentTarget.querySelector("img");
    img.src = gems[gemIdx % gems.length];
    gemIdx++;
    showToast("Rare Gem ditemukan! +3 Coins!");
  });

  document.getElementById("heroStarBtn").addEventListener("click", () => {
    pixelAudio.sfxLevelUp();
    addCoins(2);
    showToast("★ Star Power aktif! hizetblue mode tak terkalahkan!");
  });
}

// ==================== CHAPTER 2: PIXEL CAKE & TIUP LILIN ====================
function initCakeStage() {
  const canvas = document.getElementById("cakeCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const candlesLeftLabel = document.getElementById("candlesLeftLabel");
  const micStatusPill = document.getElementById("micStatusPill");
  const blowAllBtn = document.getElementById("blowAllBtn");
  const micBlowBtn = document.getElementById("micBlowBtn");
  const relightBtn = document.getElementById("relightBtn");
  const wishReveal = document.getElementById("cakeWishReveal");

  const candlePositions = [96, 128, 160, 192, 224];
  let candles = candlePositions.map((x, i) => ({ x, lit: true, flicker: i * 1.3 }));
  let smokes = [];
  let micStream = null;
  let micRaf = null;
  let lastBlowTime = 0;

  function updateCandleLabel() {
    const litCount = candles.filter((c) => c.lit).length;
    candlesLeftLabel.textContent = `${litCount} / ${candles.length}`;
    if (litCount === 0 && wishReveal.classList.contains("hidden")) {
      wishReveal.classList.remove("hidden");
      pixelAudio.sfxBirthdayFanfare();
      addCoins(5);
      completeQuest("cake", "🎂 Lilin berhasil ditiup! Chapter 2 selesai (+5 Coins)!");
      stopMic();
    }
  }

  function spawnSmoke(x, y) {
    for (let i = 0; i < 6; i++) {
      smokes.push({
        x: x + (Math.random() - 0.5) * 8,
        y,
        vy: -22 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 14,
        life: 0.9 + Math.random() * 0.4,
        size: 4 + Math.floor(Math.random() * 3)
      });
    }
  }

  function extinguishCandle(idx) {
    const c = candles[idx];
    if (!c || !c.lit) return;
    c.lit = false;
    pixelAudio.sfxBlow();
    spawnSmoke(c.x, 76);
    updateCandleLabel();
  }

  function extinguishNext() {
    const idx = candles.findIndex((c) => c.lit);
    if (idx !== -1) extinguishCandle(idx);
  }

  function relightAll() {
    candles.forEach((c) => {
      c.lit = true;
    });
    smokes = [];
    wishReveal.classList.add("hidden");
    updateCandleLabel();
    pixelAudio.sfxOpen();
  }

  function stopMic() {
    if (micRaf) cancelAnimationFrame(micRaf);
    micRaf = null;
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    micStatusPill.textContent = "Mode: Tap / Klik";
    micStatusPill.classList.remove("active");
    micBlowBtn.textContent = "🎤 Tiup Pakai Mic";
  }

  async function toggleMic() {
    if (micStream) {
      stopMic();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Browser ini nggak mendukung mic — langsung tap lilinnya aja ya!");
      return;
    }
    try {
      pixelAudio.ensureContext();
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const micCtx = new AudioCtx();
      const src = micCtx.createMediaStreamSource(micStream);
      const analyser = micCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      micStatusPill.textContent = "Mic Aktif: Tiup sekarang!";
      micStatusPill.classList.add("active");
      micBlowBtn.textContent = "🔇 Matikan Mic";
      showToast("🎤 Tiup ke arah mikrofon untuk memadamkan lilin!");

      const detectBlow = () => {
        if (!micStream) {
          micCtx.close();
          return;
        }
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const now = performance.now();
        if (avg > 42 && now - lastBlowTime > 260) {
          lastBlowTime = now;
          extinguishNext();
        }
        micRaf = requestAnimationFrame(detectBlow);
      };
      detectBlow();
    } catch {
      showToast("Izin mic ditolak — tap lilin atau klik tombol Tiup Lilin aja ya!");
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((e.clientY - rect.top) / rect.height) * canvas.height;

    let hit = false;
    candles.forEach((c, idx) => {
      if (c.lit && Math.abs(cx - c.x) < 22 && cy < 130) {
        extinguishCandle(idx);
        hit = true;
      }
    });
    if (!hit) extinguishNext();
  });

  blowAllBtn.addEventListener("click", () => {
    const litIndices = candles.map((c, i) => (c.lit ? i : -1)).filter((i) => i !== -1);
    litIndices.forEach((idx, order) => {
      setTimeout(() => extinguishCandle(idx), order * 150);
    });
  });

  micBlowBtn.addEventListener("click", toggleMic);
  relightBtn.addEventListener("click", relightAll);

  // Draw crisp pixel-art cake loop
  let lastT = performance.now();
  function drawCake(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const t = now / 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Plate
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(48, 206, 224, 12);
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(58, 202, 204, 6);

    // Bottom cake tier (rich sky blue + cream band)
    ctx.fillStyle = "#040b1d";
    ctx.fillRect(66, 152, 188, 52);
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(70, 156, 180, 44);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(70, 156, 180, 14);
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(70, 178, 180, 6);

    // Pixel icing drips on bottom tier
    for (let x = 74; x <= 238; x += 16) {
      ctx.fillStyle = "#bae6fd";
      ctx.fillRect(x, 168, 8, (x % 32 === 10 ? 10 : 6));
    }

    // Top cake tier
    ctx.fillStyle = "#040b1d";
    ctx.fillRect(86, 108, 148, 46);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(90, 112, 140, 38);
    ctx.fillStyle = "#7dd3fc";
    ctx.fillRect(90, 112, 140, 12);

    // Pixel sprinkles & blueberries on top tier
    const sprinkles = [
      [102, 134, "#fde047"], [124, 128, "#f472b6"], [150, 136, "#fde047"],
      [178, 128, "#c084fc"], [206, 135, "#f472b6"], [136, 188, "#fde047"],
      [172, 188, "#f472b6"], [104, 188, "#38bdf8"], [206, 188, "#38bdf8"]
    ];
    sprinkles.forEach(([sx, sy, col]) => {
      ctx.fillStyle = col;
      ctx.fillRect(sx, sy, 6, 6);
    });

    // 5 Candles + flames
    candles.forEach((c) => {
      // Candle outline & stripes
      ctx.fillStyle = "#040b1d";
      ctx.fillRect(c.x - 5, 78, 10, 32);
      ctx.fillStyle = "#eff6ff";
      ctx.fillRect(c.x - 3, 80, 6, 28);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(c.x - 3, 86, 6, 5);
      ctx.fillRect(c.x - 3, 96, 6, 5);
      // Wick
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(c.x - 1, 73, 2, 6);

      if (c.lit) {
        const sway = Math.round(Math.sin(t * 11 + c.flicker) * 2);
        // Glow halo
        ctx.fillStyle = "rgba(253, 224, 71, 0.22)";
        ctx.fillRect(c.x - 10 + sway, 52, 20, 22);
        // Outer orange/yellow flame
        ctx.fillStyle = "#fb923c";
        ctx.fillRect(c.x - 4 + sway, 58, 8, 14);
        ctx.fillRect(c.x - 2 + sway, 54, 4, 6);
        // Inner bright core
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(c.x - 2 + sway, 62, 4, 9);
      }
    });

    // Smoke particles
    for (let i = smokes.length - 1; i >= 0; i--) {
      const s = smokes[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        smokes.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(224, 242, 254, ${Math.min(0.85, s.life)})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
    }

    requestAnimationFrame(drawCake);
  }

  requestAnimationFrame(drawCake);
}

// ==================== CHAPTER 4: INTERACTIVE LETTER DECK & GACHA ====================
const LETTER_CARDS = [
  {
    art: "element/scroll-letter.png",
    title: "1. Hai hizetblue!",
    body: "Selamat ulang tahun ya! Makasih udah hadir dan jadi partner terbaik di hari-hariku — dari hal-hal kecil yang bikin ketawa sampai momen sederhana yang selalu kerasa hangat."
  },
  {
    art: "element/clover.png",
    title: "2. Doa di Umur Baru",
    body: "Di umur yang baru ini, aku harap semua yang lagi kamu usahain dilancarin, badan selalu sehat, pikiran tetap tenang, dan makin banyak hal baik yang datang ke hidup kamu."
  },
  {
    art: "element/many-love-blue.png",
    title: "3. Tetap Jadi Kamu 💙",
    body: "Nggak perlu yang ribet-ribet, cukup terus jadi diri kamu sendiri yang selalu aku sayang. Happy birthday, hizetblue! — anagwer"
  }
];

const GACHA_PRIZES = [
  {
    id: "cat",
    img: "element/cat-screaming.png",
    title: "🐾 Kucing Penjaga Teriak!",
    desc: "MEOW! Jangan lupa makan enak & jangan kebanyakan begadang ya, hizetblue!"
  },
  {
    id: "bottle",
    img: "element/bottle.png",
    title: "🍾 Message in a Bottle",
    desc: "Semoga semua hal baik yang lagi kamu simpan dalam doa pelan-pelan terkabul tahun ini."
  },
  {
    id: "plane",
    img: "element/paper-plane.png",
    title: "✈️ Paper Plane",
    desc: "Ke mana pun langkahmu pergi tahun ini, semoga selalu ketemu jalan yang aman & bikin senyum."
  },
  {
    id: "clover",
    img: "element/clover.png",
    title: "🍀 4-Leaf Clover",
    desc: "Extra luck +100% buat hizetblue di kerjaan, hobi, dan semua rencana ke depan!"
  }
];

function initQuestStage() {
  const envelopeBtn = document.getElementById("envelopeBtn");
  const envelopeImg = document.getElementById("envelopeImg");
  const envelopeHint = document.getElementById("envelopeHint");
  const scrollBox = document.getElementById("scrollBox");
  const reactFeedback = document.getElementById("reactFeedback");

  const deckArt = document.getElementById("deckArt");
  const deckTitle = document.getElementById("deckTitle");
  const deckBody = document.getElementById("deckBody");
  const deckPageLabel = document.getElementById("deckPageLabel");
  const prevCardBtn = document.getElementById("prevCardBtn");
  const nextCardBtn = document.getElementById("nextCardBtn");

  let cardIdx = 0;
  let envelopeOpenedOnce = false;
  let reactedOnce = false;

  function renderCard() {
    const c = LETTER_CARDS[cardIdx];
    deckArt.src = c.art;
    deckTitle.textContent = c.title;
    deckBody.textContent = c.body;
    deckPageLabel.textContent = `KARTU ${cardIdx + 1} / ${LETTER_CARDS.length}`;
    prevCardBtn.disabled = cardIdx === 0;
    nextCardBtn.disabled = cardIdx === LETTER_CARDS.length - 1;
  }

  envelopeBtn.addEventListener("click", () => {
    pixelAudio.sfxOpen();
    const isHidden = scrollBox.classList.contains("hidden");
    if (isHidden) {
      envelopeImg.src = "element/envelope-open.png";
      envelopeHint.textContent = "Klik lagi untuk tutup amplop";
      scrollBox.classList.remove("hidden");
      renderCard();
      if (!envelopeOpenedOnce) {
        envelopeOpenedOnce = true;
        addCoins(2);
        completeQuest("letter", "✉️ Dek surat terbuka! (+2 Coins)");
      }
    } else {
      envelopeImg.src = "element/envelope-close.png";
      envelopeHint.textContent = "✨ Tap untuk pecahkan segel surat!";
      scrollBox.classList.add("hidden");
    }
  });

  prevCardBtn.addEventListener("click", () => {
    if (cardIdx > 0) {
      cardIdx--;
      pixelAudio.sfxOpen();
      renderCard();
    }
  });

  nextCardBtn.addEventListener("click", () => {
    if (cardIdx < LETTER_CARDS.length - 1) {
      cardIdx++;
      pixelAudio.sfxOpen();
      renderCard();
    }
  });

  document.querySelectorAll(".react-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".react-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      reactFeedback.textContent = `Terkirim ke anagwer: "${btn.dataset.reply}"`;
      reactFeedback.classList.remove("hidden");
      pixelAudio.sfxLovePop(3);
      if (!reactedOnce) {
        reactedOnce = true;
        addCoins(2);
        addLove(2);
        showToast("Reaksi terkirim! +2 Coins & +2 Love!");
      }
    });
  });

  // Mystery Gacha Machine
  const gachaSpinBtn = document.getElementById("gachaSpinBtn");
  const gachaOrbImg = document.getElementById("gachaOrbImg");
  const gachaCountLabel = document.getElementById("gachaCountLabel");
  const gachaPrizeImg = document.getElementById("gachaPrizeImg");
  const gachaPrizeTitle = document.getElementById("gachaPrizeTitle");
  const gachaPrizeDesc = document.getElementById("gachaPrizeDesc");

  const unlockedGacha = new Set();
  let gachaCursor = 0;

  gachaSpinBtn.addEventListener("click", () => {
    gachaOrbImg.classList.remove("spinning");
    void gachaOrbImg.offsetWidth;
    gachaOrbImg.classList.add("spinning");
    pixelAudio.sfxCat();

    const prize = GACHA_PRIZES[gachaCursor % GACHA_PRIZES.length];
    gachaCursor++;

    setTimeout(() => {
      gachaPrizeImg.src = prize.img;
      gachaPrizeTitle.textContent = prize.title;
      gachaPrizeDesc.textContent = prize.desc;

      if (!unlockedGacha.has(prize.id)) {
        unlockedGacha.add(prize.id);
        gachaCountLabel.textContent = `${unlockedGacha.size} / ${GACHA_PRIZES.length} Terbuka`;
        addCoins(2);
        addLove(2);
        pixelAudio.sfxCoin();
        showToast(`🎲 Gacha baru terbuka! +2 Coins & +2 Love!`);
      } else {
        addLove(1);
        pixelAudio.sfxLovePop(gachaCursor);
      }
    }, 280);
  });
}

// ==================== CHAPTER 4: MEMORY GALLERY ====================
const FRAMES = ["element/frame-cute.png", "element/frame-gold.png", "element/frame-woods.png"];

const MEMORY_ITEMS = [
  { type: "image", src: "element/us/4494ab79-e1e9-4b22-9450-08291667caa3.JPG", caption: "Favorite snap #1" },
  { type: "image", src: "element/us/D242E260-202A-432E-9FD9-91ECD14FF4FD.JPG", caption: "Favorite snap #2" },
  { type: "image", src: "element/us/f173be5a-ebd8-441b-9604-5383c99d6df7.JPG", caption: "Favorite snap #3" },
  { type: "image", src: "element/us/IMG_8537.JPG", caption: "Good times together" },
  { type: "image", src: "element/us/IMG_8538.JPG", caption: "Always fun with you" },
  { type: "image", src: "element/us/IMG_8641.JPG", caption: "Sweet memory" },
  { type: "image", src: "element/us/IVBN8293.JPEG", caption: "Another favorite moment" },
  { type: "image", src: "element/us/IMG_1665.jpg", caption: "Little moment #8" },
  { type: "image", src: "element/us/IMG_5384.jpg", caption: "Little moment #9" },
  { type: "image", src: "element/us/IMG_5534.jpg", caption: "Little moment #10" },
  { type: "image", src: "element/us/IMG_5554.jpg", caption: "Little moment #11" },
  { type: "image", src: "element/us/IMG_5587.jpg", caption: "Little moment #12" },
  { type: "image", src: "element/us/IMG_8172.jpg", caption: "Little moment #13" },
  { type: "image", src: "element/us/IMG_8187.jpg", caption: "Little moment #14" },
  { type: "image", src: "element/us/IMG_8571.jpg", caption: "Little moment #15" },
  { type: "image", src: "element/us/IMG_8577.jpg", caption: "Little moment #16" },
  { type: "video", src: "element/us/196e28ead8ab4ecfbcb0b061caea2cbd.mp4", caption: "Video memory #1 (Tap to play)" },
  { type: "video", src: "element/us/eb7ec422666f454c9365a42b1fd4a7a4.mp4", caption: "Video memory #2 (Tap to play)" }
];

function initGallery() {
  const grid = document.getElementById("galleryGrid");
  const lightbox = document.getElementById("lightbox");
  const lightboxMedia = document.getElementById("lightboxMedia");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  const backdrop = document.getElementById("lightboxBackdrop");

  function openLightbox(item) {
    pixelAudio.sfxOpen();
    lightboxMedia.innerHTML = "";
    if (item.type === "video") {
      const vid = document.createElement("video");
      vid.src = item.src;
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true;
      lightboxMedia.appendChild(vid);
    } else {
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.caption;
      lightboxMedia.appendChild(img);
    }
    lightboxCaption.textContent = item.caption;
    lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightboxMedia.innerHTML = "";
  }

  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);

  MEMORY_ITEMS.forEach((item, idx) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "memory-card";

    const frameWrap = document.createElement("div");
    frameWrap.className = "frame-wrap";

    if (item.type === "video") {
      const vid = document.createElement("video");
      vid.src = item.src;
      vid.muted = true;
      vid.preload = "metadata";
      vid.playsInline = true;
      vid.className = "frame-photo";
      frameWrap.appendChild(vid);

      const badge = document.createElement("span");
      badge.className = "video-badge";
      badge.textContent = "▶ VIDEO";
      frameWrap.appendChild(badge);
    } else {
      const photo = document.createElement("img");
      photo.src = item.src;
      photo.alt = item.caption;
      photo.loading = "lazy";
      photo.className = "frame-photo";
      frameWrap.appendChild(photo);
    }

    const frameOverlay = document.createElement("img");
    frameOverlay.src = FRAMES[idx % FRAMES.length];
    frameOverlay.alt = "";
    frameOverlay.className = "frame-overlay pixel-art";
    frameWrap.appendChild(frameOverlay);

    const cap = document.createElement("p");
    cap.className = "memory-caption";
    cap.textContent = item.caption;

    card.appendChild(frameWrap);
    card.appendChild(cap);
    card.addEventListener("click", () => openLightbox(item));
    grid.appendChild(card);
  });
}

// ==================== CHAPTER 5 (EPILOG): PIXELLANCE LOVE BURST ====================
function initFinaleLoveBurst() {
  const posterBtn = document.getElementById("pixellanceBtn");
  const loveRainBtn = document.getElementById("loveRainBtn");
  const milestoneMsg = document.getElementById("milestoneMsg");
  const canvas = document.getElementById("loveBurstCanvas");
  const ctx = canvas.getContext("2d");

  const heartSpriteSrcs = [
    "element/many-love-blue.png",
    "element/pink-love.png",
    "element/pink-love-sparkle.png",
    "element/purple-heart.png",
    "element/sparkle-yellow.png"
  ];
  const heartSprites = [];
  heartSpriteSrcs.forEach((src) => {
    const img = new Image();
    img.src = src;
    heartSprites.push(img);
  });

  const RAINBOW_COLORS = [
    "#38bdf8", "#60a5fa", "#2563eb", "#22d3ee",
    "#f472b6", "#c084fc", "#fde047", "#34d399", "#fb7185"
  ];

  const HEART_PIXELS = [
    [0, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0]
  ];

  const particles = [];

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function spawnLoveBurst(originX, originY, count = 14) {
    for (let i = 0; i < count; i++) {
      const useSprite = Math.random() > 0.52;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const speed = 150 + Math.random() * 260;
      particles.push({
        x: originX + (Math.random() - 0.5) * 40,
        y: originY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        gravity: 260,
        life: 1.5 + Math.random() * 0.8,
        useSprite,
        sprite: heartSprites[Math.floor(Math.random() * heartSprites.length)],
        color: RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)],
        pixelSize: 3 + Math.floor(Math.random() * 3),
        spriteSize: 24 + Math.floor(Math.random() * 18)
      });
    }
  }

  function updateLoveCounter() {
    addLove(1);
    completeQuest("finale");

    if (loveCount === 25) {
      milestoneMsg.textContent = "25+ Love! hizetblue's happiness meter is charging up!";
      pixelAudio.sfxLevelUp();
    } else if (loveCount === 50) {
      milestoneMsg.textContent = "50+ Love! Dikit lagi menuju 75 Love buat buka Hadiah Utama!";
      pixelAudio.sfxLevelUp();
    } else if (loveCount === 75) {
      milestoneMsg.textContent = "75+ Love tercapai! Cek Kado Utama di bawah sekarang!";
      pixelAudio.sfxLevelUp();
    } else if (loveCount >= 100 && loveCount % 25 === 0) {
      milestoneMsg.textContent = `${loveCount} Love terkirim! Unlimited love dari anagwer buat hizetblue!`;
    }
  }

  // Final Reward Vault Claim (25 Coins + 50 Love)
  const claimRewardBtn = document.getElementById("claimRewardBtn");
  const rewardUnlockedBox = document.getElementById("rewardUnlockedBox");
  const vaultIcon = document.getElementById("vaultIcon");
  let rewardClaimed = false;

  claimRewardBtn.addEventListener("click", () => {
    const needCoins = Math.max(0, TARGET_COINS - coins);
    const needLove = Math.max(0, TARGET_LOVE - loveCount);
    if (needCoins > 0 || needLove > 0) {
      pixelAudio.sfxThrow();
      showToast(`Masih kurang ${needCoins} Koin & ${needLove} Love lagi untuk buka kado!`);
      return;
    }
    if (!rewardClaimed) {
      rewardClaimed = true;
      vaultIcon.src = "element/treasure.png";
      rewardUnlockedBox.classList.remove("hidden");
      claimRewardBtn.textContent = "✅ HADIAH UTAMA TERBUKA!";
      pixelAudio.sfxBirthdayFanfare();
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          spawnLoveBurst(
            window.innerWidth * (0.2 + Math.random() * 0.6),
            window.innerHeight * 0.5,
            18
          );
        }, i * 140);
      }
      showToast("🎁 Selamat! Tunggu hadiah kaosnya sampai di tangan kamu ya!");
    }
  });

  posterBtn.addEventListener("pointerdown", (e) => {
    const rect = posterBtn.getBoundingClientRect();
    const ox = e.clientX || rect.left + rect.width / 2;
    const oy = e.clientY || rect.top + rect.height / 2;

    posterBtn.classList.add("is-popping");
    setTimeout(() => posterBtn.classList.remove("is-popping"), 90);

    updateLoveCounter();
    pixelAudio.sfxLovePop(loveCount);
    spawnLoveBurst(ox, oy, 16);
  });

  loveRainBtn.addEventListener("click", () => {
    pixelAudio.sfxLevelUp();
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        spawnLoveBurst(
          window.innerWidth * (0.15 + Math.random() * 0.7),
          window.innerHeight * 0.45,
          18
        );
      }, i * 120);
    }
    updateLoveCounter();
    showToast("★ Love Rain untuk hizetblue!");
  });

  let last = performance.now();
  function animateHearts(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.min(1, p.life / 0.6);
      if (p.useSprite && p.sprite.complete && p.sprite.naturalWidth > 0) {
        ctx.drawImage(p.sprite, p.x - p.spriteSize / 2, p.y - p.spriteSize / 2, p.spriteSize, p.spriteSize);
      } else {
        ctx.fillStyle = p.color;
        const ps = p.pixelSize;
        const startX = p.x - (7 * ps) / 2;
        const startY = p.y - (6 * ps) / 2;
        for (let r = 0; r < HEART_PIXELS.length; r++) {
          for (let c = 0; c < HEART_PIXELS[r].length; c++) {
            if (HEART_PIXELS[r][c]) {
              ctx.fillRect(Math.round(startX + c * ps), Math.round(startY + r * ps), ps, ps);
            }
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(animateHearts);
  }
  requestAnimationFrame(animateHearts);
}

// ==================== BOOTSTRAP ====================
document.addEventListener("DOMContentLoaded", () => {
  initSkyDecor();
  initHeroStage();
  initCakeStage();
  initQuestStage();
  initGallery();
  initFinaleLoveBurst();

  new PokemonMiniGame({
    onCoinEarned: (amount) => addCoins(amount),
    onQuestComplete: (key) => completeQuest(key, "🏆 Chapter 1 selesai! Lanjut Mario Love Run di Chapter 2!")
  });

  new MarioPokemonGame({
    onCoinEarned: (amount) => addCoins(amount),
    onLoveEarned: (amount) => addLove(amount),
    onQuestComplete: (key) => completeQuest(key, "🍄 Chapter 2 selesai! Love & Koin bertambah — ayo Tiup Lilin!")
  });
});
