// Mario-style Side-Scrolling Mini-Game with Pokémon Trainer that generates Love & Coins!

window.MarioPokemonGame = class MarioPokemonGame {
  constructor({ onCoinEarned, onLoveEarned, onQuestComplete }) {
    this.canvas = document.getElementById("marioCanvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");

    this.onCoinEarned = onCoinEarned || (() => {});
    this.onLoveEarned = onLoveEarned || (() => {});
    this.onQuestComplete = onQuestComplete || (() => {});

    this.loveLabel = document.getElementById("marioLoveLabel");
    this.coinLabel = document.getElementById("marioCoinLabel");
    this.resetBtn = document.getElementById("resetMarioBtn");
    this.playAgainBtn = document.getElementById("playMarioAgainBtn");
    this.victoryEl = document.getElementById("marioVictory");
    this.goalGifEl = document.getElementById("marioGoalGif");

    this.width = 640;
    this.height = 290;
    this.groundY = 244;
    this.gravity = 1180;

    this.images = {};
    this.keys = { left: false, right: false };
    this.player = {
      x: 54,
      y: 196,
      vx: 0,
      vy: 0,
      w: 42,
      h: 46,
      facing: "right",
      onGround: true,
      invulnTimer: 0
    };

    this.loveCollected = 0;
    this.coinCollected = 0;
    this.finished = false;
    this.questDone = false;
    this.cameraX = 0;
    this.worldWidth = 1860;
    this.blocks = [];
    this.items = [];
    this.popups = [];
    this.enemies = [];
    this.lastTime = 0;

    this.init();
  }

  async init() {
    const list = [
      ["front", "element/person-pokemon-front.png"],
      ["left", "element/person-pokemon-turn-left.png"],
      ["coin", "element/coin.png"],
      ["loveBlue", "element/many-love-blue.png"],
      ["lovePink", "element/pink-love.png"],
      ["lovePurple", "element/purple-heart.png"],
      ["gengar", "element/gengar.png"],
      ["cloud", "element/blue-cloud-1.png"]
    ];

    await Promise.all(
      list.map(
        ([k, src]) =>
          new Promise((res) => {
            const img = new Image();
            img.onload = () => {
              this.images[k] = img;
              res();
            };
            img.onerror = res;
            img.src = src;
          })
      )
    );

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.bindControls();
    this.resetLevel();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(300, Math.floor(rect.width));
    this.height = 290;
    this.groundY = this.height - 46;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  resetLevel() {
    this.player.x = 50;
    this.player.y = this.groundY - this.player.h;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onGround = true;
    this.player.invulnTimer = 0;
    this.cameraX = 0;
    this.finished = false;
    this.popups = [];
    if (this.victoryEl) this.victoryEl.classList.add("hidden");

    // Mario '?' Blocks & Brick Platforms (tuned so every block is easily jumpable!)
    this.blocks = [
      { x: 180, y: this.groundY - 92, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "love" },
      { x: 216, y: this.groundY - 92, w: 36, h: 36, type: "brick", used: false, bumpY: 0 },
      { x: 252, y: this.groundY - 92, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "coin" },

      { x: 430, y: this.groundY - 94, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "love" },
      { x: 466, y: this.groundY - 94, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "love" },

      { x: 690, y: this.groundY - 92, w: 36, h: 36, type: "brick", used: false, bumpY: 0 },
      { x: 726, y: this.groundY - 92, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "love" },
      { x: 762, y: this.groundY - 92, w: 36, h: 36, type: "brick", used: false, bumpY: 0 },
      { x: 726, y: this.groundY - 176, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "love" },

      { x: 1020, y: this.groundY - 94, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "coin" },
      { x: 1056, y: this.groundY - 94, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "love" },

      { x: 1320, y: this.groundY - 94, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "love" },
      { x: 1356, y: this.groundY - 94, w: 36, h: 36, type: "brick", used: false, bumpY: 0 },
      { x: 1392, y: this.groundY - 94, w: 36, h: 36, type: "q", used: false, bumpY: 0, reward: "love" }
    ];

    // Floating Love Hearts & Coins along the Mario course
    this.items = [
      { x: 130, y: this.groundY - 68, kind: "love", img: "lovePink", taken: false },
      { x: 310, y: this.groundY - 96, kind: "love", img: "loveBlue", taken: false },
      { x: 355, y: this.groundY - 124, kind: "love", img: "lovePurple", taken: false },
      { x: 540, y: this.groundY - 82, kind: "coin", img: "coin", taken: false },
      { x: 585, y: this.groundY - 110, kind: "love", img: "lovePink", taken: false },
      { x: 630, y: this.groundY - 82, kind: "love", img: "loveBlue", taken: false },
      { x: 860, y: this.groundY - 92, kind: "love", img: "lovePurple", taken: false },
      { x: 910, y: this.groundY - 122, kind: "love", img: "lovePink", taken: false },
      { x: 960, y: this.groundY - 92, kind: "coin", img: "coin", taken: false },
      { x: 1140, y: this.groundY - 102, kind: "love", img: "loveBlue", taken: false },
      { x: 1190, y: this.groundY - 132, kind: "love", img: "lovePink", taken: false },
      { x: 1240, y: this.groundY - 102, kind: "love", img: "lovePurple", taken: false },
      { x: 1480, y: this.groundY - 96, kind: "love", img: "loveBlue", taken: false },
      { x: 1530, y: this.groundY - 126, kind: "love", img: "lovePink", taken: false },
      { x: 1580, y: this.groundY - 96, kind: "love", img: "lovePurple", taken: false }
    ];

    // Gengar enemies: stomp from above = +1 Love, hit from side = -1 Love!
    this.enemies = [
      { x: 380, minX: 330, maxX: 470, y: this.groundY - 38, w: 38, h: 38, vx: 55 },
      { x: 890, minX: 830, maxX: 980, y: this.groundY - 38, w: 38, h: 38, vx: -62 },
      { x: 1260, minX: 1200, maxX: 1380, y: this.groundY - 38, w: 38, h: 38, vx: 65 }
    ];
  }

  jump() {
    if (this.finished) return;
    if (this.player.onGround) {
      this.player.vy = -565;
      this.player.onGround = false;
      window.pixelAudio.sfxThrow();
    }
  }

  bindControls() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.keys.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") this.keys.right = true;
      if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && document.activeElement === this.canvas) {
        e.preventDefault();
        this.jump();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.keys.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") this.keys.right = false;
    });

    document.querySelectorAll(".mario-pad-btn").forEach((btn) => {
      const act = btn.dataset.mario;
      const start = (e) => {
        e.preventDefault();
        if (act === "left") this.keys.left = true;
        if (act === "right") this.keys.right = true;
        if (act === "jump") this.jump();
      };
      const end = (e) => {
        e.preventDefault();
        if (act === "left") this.keys.left = false;
        if (act === "right") this.keys.right = false;
      };
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", end);
      btn.addEventListener("pointerleave", end);
      btn.addEventListener("pointercancel", end);
    });

    this.canvas.addEventListener("pointerdown", () => {
      this.canvas.focus();
      this.jump();
    });

    const doReset = () => {
      window.pixelAudio.sfxOpen();
      this.resetLevel();
    };
    if (this.resetBtn) this.resetBtn.addEventListener("click", doReset);
    if (this.playAgainBtn) this.playAgainBtn.addEventListener("click", doReset);
  }

  addPopup(x, y, text, color = "#f472b6") {
    this.popups.push({ x, y, text, color, life: 0.95 });
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt, now / 1000);
    this.draw(now / 1000);
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.finished) {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        this.popups[i].y -= 34 * dt;
        this.popups[i].life -= dt;
        if (this.popups[i].life <= 0) this.popups.splice(i, 1);
      }
      return;
    }

    const p = this.player;
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);

    const speed = 230;
    if (this.keys.left) {
      p.vx = -speed;
      p.facing = "left";
    } else if (this.keys.right) {
      p.vx = speed;
      p.facing = "right";
    } else {
      p.vx = 0;
    }

    p.x += p.vx * dt;
    p.x = Math.max(8, Math.min(this.worldWidth - p.w - 8, p.x));

    p.vy += this.gravity * dt;
    const prevY = p.y;
    p.y += p.vy * dt;
    p.onGround = false;

    if (p.y + p.h >= this.groundY) {
      p.y = this.groundY - p.h;
      p.vy = 0;
      p.onGround = true;
    }

    // Block collisions (stand on top or bump from below)
    for (const b of this.blocks) {
      if (b.bumpY < 0) b.bumpY = Math.min(0, b.bumpY + 60 * dt);

      const overlapX = p.x + p.w - 8 > b.x && p.x + 8 < b.x + b.w;
      if (!overlapX) continue;

      if (p.vy >= 0 && prevY + p.h <= b.y + 12 && p.y + p.h >= b.y) {
        p.y = b.y - p.h;
        p.vy = 0;
        p.onGround = true;
      } else if (p.vy < 0 && prevY >= b.y + b.h - 12 && p.y <= b.y + b.h) {
        p.y = b.y + b.h;
        p.vy = 60;
        b.bumpY = -10;
        if (b.type === "q" && !b.used) {
          b.used = true;
          if (b.reward === "love") {
            this.loveCollected += 3;
            this.onLoveEarned(3);
            window.pixelAudio.sfxLovePop(this.loveCollected);
            this.addPopup(b.x + 4, b.y - 12, "+3 LOVE!", "#f472b6");
          } else {
            this.coinCollected += 2;
            this.onCoinEarned(2);
            window.pixelAudio.sfxCoin();
            this.addPopup(b.x + 4, b.y - 12, "+2 COIN!", "#fde047");
          }
          this.syncLabels();
        } else {
          window.pixelAudio.sfxThrow();
        }
      }
    }

    // Collect floating hearts & coins
    for (const item of this.items) {
      if (item.taken) continue;
      const dist = Math.hypot(p.x + p.w / 2 - (item.x + 14), p.y + p.h / 2 - (item.y + 14));
      if (dist < 32) {
        item.taken = true;
        if (item.kind === "love") {
          this.loveCollected += 2;
          this.onLoveEarned(2);
          window.pixelAudio.sfxLovePop(this.loveCollected);
          this.addPopup(item.x, item.y - 8, "+2 LOVE", "#7dd3fc");
        } else {
          this.coinCollected += 2;
          this.onCoinEarned(2);
          window.pixelAudio.sfxCoin();
          this.addPopup(item.x, item.y - 8, "+2 COIN", "#fde047");
        }
        this.syncLabels();
      }
    }

    // Gengar enemies: stomp = +1 Love, side collision = -1 Love!
    for (const en of this.enemies) {
      en.x += en.vx * dt;
      if (en.x < en.minX || en.x > en.maxX) en.vx *= -1;
      const hit =
        p.x + p.w - 8 > en.x &&
        p.x + 8 < en.x + en.w &&
        p.y + p.h > en.y &&
        p.y < en.y + en.h;
      if (!hit) continue;

      if (p.vy > 0 && prevY + p.h <= en.y + 16) {
        p.vy = -380;
        this.loveCollected += 1;
        this.onLoveEarned(1);
        window.pixelAudio.sfxLovePop(this.loveCollected);
        this.addPopup(en.x, en.y - 12, "BOING! +1 LOVE", "#c084fc");
        this.syncLabels();
      } else if (p.invulnTimer <= 0) {
        p.invulnTimer = 1.1;
        p.vy = -260;
        p.x += p.x < en.x ? -26 : 26;
        this.loveCollected = Math.max(0, this.loveCollected - 1);
        this.onLoveEarned(-1);
        window.pixelAudio.sfxThrow();
        this.addPopup(p.x, p.y - 12, "AW! -1 LOVE!", "#fb7185");
        this.syncLabels();
      }
    }

    // Finish flag reached!
    if (p.x >= 1665) {
      this.finished = true;
      this.loveCollected += 5;
      this.coinCollected += 5;
      this.onLoveEarned(5);
      this.onCoinEarned(5);
      this.syncLabels();
      window.pixelAudio.sfxBirthdayFanfare();
      this.addPopup(1660, this.groundY - 90, "FINISH! +5 LOVE & +5 KOIN!", "#fde047");
      if (!this.questDone) {
        this.questDone = true;
        this.onQuestComplete("mario");
      }
      setTimeout(() => {
        if (this.victoryEl) this.victoryEl.classList.remove("hidden");
      }, 450);
    }

    const targetCam = p.x - this.width * 0.35;
    this.cameraX = Math.max(0, Math.min(this.worldWidth - this.width, targetCam));

    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.y -= 38 * dt;
      pop.life -= dt;
      if (pop.life <= 0) this.popups.splice(i, 1);
    }
  }

  syncLabels() {
    if (this.loveLabel) this.loveLabel.textContent = this.loveCollected;
    if (this.coinLabel) this.coinLabel.textContent = this.coinCollected;
  }

  draw(timeSec) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Sync animated cute-pokemon.gif at finish line
    if (this.goalGifEl) {
      const gifScreenX = 1724 - Math.round(this.cameraX);
      this.goalGifEl.style.left = `${gifScreenX}px`;
      this.goalGifEl.style.display = gifScreenX > -120 && gifScreenX < this.width + 40 ? "block" : "none";
    }

    if (this.images.cloud) {
      ctx.globalAlpha = 0.45;
      for (let cx = 60; cx < this.worldWidth; cx += 340) {
        const sx = cx - this.cameraX * 0.5;
        ctx.drawImage(this.images.cloud, sx, 26 + ((cx % 3) * 14), 86, 54);
      }
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(-Math.round(this.cameraX), 0);

    // Ground
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(0, this.groundY, this.worldWidth, 10);
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(0, this.groundY + 10, this.worldWidth, this.height - this.groundY);
    ctx.fillStyle = "#1d4ed8";
    for (let gx = 0; gx < this.worldWidth; gx += 32) {
      ctx.fillRect(gx + 2, this.groundY + 14, 28, 12);
    }

    // Blocks
    for (const b of this.blocks) {
      const by = b.y + b.bumpY;
      ctx.fillStyle = "#040b1d";
      ctx.fillRect(b.x, by, b.w, b.h);
      if (b.type === "q") {
        ctx.fillStyle = b.used ? "#475569" : "#f59e0b";
        ctx.fillRect(b.x + 3, by + 3, b.w - 6, b.h - 6);
        ctx.fillStyle = b.used ? "#94a3b8" : "#fef08a";
        ctx.font = "bold 18px monospace";
        ctx.fillText(b.used ? "-" : "?", b.x + 12, by + 24);
      } else {
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(b.x + 3, by + 3, b.w - 6, b.h - 6);
        ctx.fillStyle = "#93c5fd";
        ctx.fillRect(b.x + 3, by + 3, b.w - 6, 5);
      }
    }

    // Floating Hearts & Coins
    for (const item of this.items) {
      if (item.taken) continue;
      const img = this.images[item.img];
      const bob = Math.round(Math.sin(timeSec * 5 + item.x * 0.05) * 4);
      if (img) ctx.drawImage(img, item.x, item.y + bob, 28, 28);
    }

    // Enemies (Gengar)
    for (const en of this.enemies) {
      if (this.images.gengar) {
        ctx.drawImage(this.images.gengar, en.x, en.y, en.w, en.h);
      }
    }

    // Finish Flag
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(1696, this.groundY - 120, 6, 120);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(1702, this.groundY - 118, 36, 22);

    // Player (blinks when invulnerable after hitting Gengar)
    const p = this.player;
    const blinkHide = p.invulnTimer > 0 && Math.floor(timeSec * 16) % 2 === 0;
    const tImg = this.images.left || this.images.front;
    if (tImg && !blinkHide) {
      ctx.save();
      if (p.facing === "right") {
        ctx.translate(p.x + p.w, p.y);
        ctx.scale(-1, 1);
        ctx.drawImage(tImg, 0, 0, p.w, p.h);
      } else {
        ctx.drawImage(tImg, p.x, p.y, p.w, p.h);
      }
      ctx.restore();
    }

    // Popups
    for (const pop of this.popups) {
      ctx.fillStyle = pop.color;
      ctx.font = "bold 14px monospace";
      ctx.fillText(pop.text, pop.x, pop.y);
    }

    ctx.restore();
  }
};
