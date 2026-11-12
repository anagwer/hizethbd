// Uses global window.pixelAudio from js/audio.js

const SQUAD_DATA = [
  {
    id: "squirtle",
    name: "SQUIRTLE",
    src: "element/Squirtle.png",
    msg: "Squirtle squad melapor! Semoga hari-hari hizetblue selalu adem, tenang, dan penuh hal baik."
  },
  {
    id: "pikachu",
    name: "PIKACHU",
    src: "element/pikachu.png",
    msg: "Pika-pi! Energi positif penuh buat hizetblue — makasih ya udah selalu bikin suasana seru."
  },
  {
    id: "bulbasaur",
    name: "BULBASAUR",
    src: "element/Bulbasaur.png",
    msg: "Bulbasaur titip doa: semoga semua rencana dan impianmu tahun ini tumbuh lancar satu per satu."
  },
  {
    id: "charmander",
    name: "CHARMANDER",
    src: "element/Charmanders.png",
    msg: "Semangat terus ngejar hal-hal yang kamu suka, hizetblue! I'm always cheering for you."
  },
  {
    id: "jigglypuff",
    name: "JIGGLYPUFF",
    src: "element/Jigglypuff.png",
    msg: "Jigglypuff nyanyi lagu ulang tahun versi pixel dulu — jangan lupa istirahat yang cukup juga ya."
  },
  {
    id: "gengar",
    name: "GENGAR",
    src: "element/gengar.png",
    msg: "Gengar ikut ngerayain! Katanya kalau kamu senyum hari ini, level ganteng & hokinya nambah 100x."
  }
];

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

window.PokemonMiniGame = class PokemonMiniGame {
  constructor({ onCoinEarned, onSquadUpdate, onQuestComplete }) {
    this.arena = document.getElementById("gameArena");
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.victoryEl = document.getElementById("gameVictory");
    this.scoreLabel = document.getElementById("gameScoreLabel");
    this.dialogAvatar = document.getElementById("dialogAvatar");
    this.dialogSpeaker = document.getElementById("dialogSpeaker");
    this.dialogMessage = document.getElementById("dialogMessage");

    this.onCoinEarned = onCoinEarned;
    this.onSquadUpdate = onSquadUpdate || (() => {});
    this.onQuestComplete = onQuestComplete || (() => {});

    this.images = {};
    this.keys = { up: false, down: false, left: false, right: false };
    this.trainer = { x: 140, y: 200, w: 48, h: 52, facing: "front", speed: 210 };
    this.pokemons = [];
    this.balls = [];
    this.pickups = [];
    this.particles = [];
    this.caughtCount = 0;
    this.finished = false;
    this.lastTime = 0;
    this.pickupTimer = 0;
    this.width = 640;
    this.height = 360;

    this.init();
  }

  async init() {
    const assetsToLoad = [
      ["front", "element/person-pokemon-front.png"],
      ["left", "element/person-pokemon-turn-left.png"],
      ["pokeball", "element/pokeball.png"],
      ["sparkle", "element/sparkle.png"],
      ["sparkleYellow", "element/sparkle-yellow.png"],
      ["star", "element/star-mario.png"],
      ["diamond", "element/diamond.png"],
      ["ditto", "element/ditto.png"],
      ["tree", "element/tree.png"],
      ["pine", "element/pine-tree.png"]
    ];
    for (const p of SQUAD_DATA) {
      assetsToLoad.push([p.id, p.src]);
    }

    const loaded = await Promise.all(assetsToLoad.map(async ([k, src]) => [k, await loadImage(src)]));
    loaded.forEach(([k, img]) => {
      this.images[k] = img;
    });

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.bindControls();
    this.resetGame();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    const rect = this.arena.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(300, Math.floor(rect.width));
    this.height = Math.max(260, Math.floor(rect.height));
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;

    this.trainer.x = Math.min(this.trainer.x, this.width - 54);
    this.trainer.y = Math.min(this.trainer.y, this.height - 58);
  }

  resetGame() {
    this.caughtCount = 0;
    this.finished = false;
    this.balls = [];
    this.particles = [];
    this.pickups = [];
    this.victoryEl.classList.add("hidden");

    this.trainer.x = this.width * 0.5 - 24;
    this.trainer.y = this.height * 0.72;
    this.trainer.facing = "front";

    this.pokemons = SQUAD_DATA.map((p, idx) => {
      const cols = 3;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 48 + col * ((this.width - 120) / 2);
      const y = 36 + row * 92;
      const dirX = idx % 2 === 0 ? 1 : -1;
      const dirY = idx % 3 === 0 ? 1 : -1;
      return {
        ...p,
        x: Math.max(24, Math.min(this.width - 74, x)),
        y: Math.max(28, Math.min(this.height * 0.65, y)),
        size: 52,
        vx: dirX * (45 + idx * 7),
        vy: dirY * (32 + idx * 5),
        caught: false,
        bobOffset: idx * 0.9
      };
    });

    // Spawn 1 bonus Ditto
    this.pickups.push({
      type: "ditto",
      imgKey: "ditto",
      x: this.width * 0.2,
      y: this.height * 0.45,
      size: 40,
      coins: 5
    });

    this.updateScoreUI();
    this.setDialog(
      "element/pokeball.png",
      "PROF. BLUE",
      "Tap Pokémon di arena atau gerakkan trainer untuk menangkap semua 6 Birthday Squad!"
    );
  }

  updateScoreUI() {
    this.scoreLabel.textContent = `${this.caughtCount} / ${SQUAD_DATA.length}`;
    this.onSquadUpdate(this.caughtCount);
  }

  setDialog(avatarSrc, speaker, text) {
    this.dialogAvatar.src = avatarSrc;
    this.dialogSpeaker.textContent = speaker;
    this.dialogMessage.textContent = text;
  }

  bindControls() {
    const keyMap = {
      ArrowUp: "up", KeyW: "up",
      ArrowDown: "down", KeyS: "down",
      ArrowLeft: "left", KeyA: "left",
      ArrowRight: "right", KeyD: "right"
    };

    window.addEventListener("keydown", (e) => {
      if (keyMap[e.code]) {
        if (document.activeElement === this.arena) e.preventDefault();
        this.keys[keyMap[e.code]] = true;
      }
      if (e.code === "Space" && document.activeElement === this.arena) {
        e.preventDefault();
        this.throwAtNearest();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (keyMap[e.code]) {
        this.keys[keyMap[e.code]] = false;
      }
    });

    // Touch D-Pad
    document.querySelectorAll(".dpad-btn").forEach((btn) => {
      const dir = btn.dataset.dir;
      const start = (e) => {
        e.preventDefault();
        this.keys[dir] = true;
      };
      const end = (e) => {
        e.preventDefault();
        this.keys[dir] = false;
      };
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", end);
      btn.addEventListener("pointerleave", end);
      btn.addEventListener("pointercancel", end);
    });

    document.getElementById("throwBallBtn").addEventListener("click", () => {
      this.throwAtNearest();
    });

    document.getElementById("resetGameBtn").addEventListener("click", () => {
      pixelAudio.sfxOpen();
      this.resetGame();
    });

    document.getElementById("playGameAgainBtn").addEventListener("click", () => {
      pixelAudio.sfxOpen();
      this.resetGame();
    });

    // Tap directly on arena/Pokémon to aim & throw Pokeball
    this.canvas.addEventListener("pointerdown", (e) => {
      if (this.finished) return;
      const rect = this.canvas.getBoundingClientRect();
      const tx = e.clientX - rect.left;
      const ty = e.clientY - rect.top;

      // Check if user tapped close to an active pokemon -> auto-aim at its center
      let targetX = tx;
      let targetY = ty;
      for (const p of this.pokemons) {
        if (p.caught) continue;
        const cx = p.x + p.size / 2;
        const cy = p.y + p.size / 2;
        if (Math.hypot(tx - cx, ty - cy) < 48) {
          targetX = cx;
          targetY = cy;
          break;
        }
      }
      this.throwToward(targetX, targetY);
    });
  }

  throwAtNearest() {
    if (this.finished) return;
    const active = this.pokemons.filter((p) => !p.caught);
    if (!active.length) return;
    const tx = this.trainer.x + this.trainer.w / 2;
    const ty = this.trainer.y + this.trainer.h / 2;
    let nearest = active[0];
    let bestDist = Infinity;
    for (const p of active) {
      const d = Math.hypot(p.x + p.size / 2 - tx, p.y + p.size / 2 - ty);
      if (d < bestDist) {
        bestDist = d;
        nearest = p;
      }
    }
    this.throwToward(nearest.x + nearest.size / 2, nearest.y + nearest.size / 2);
  }

  throwToward(targetX, targetY) {
    const startX = this.trainer.x + this.trainer.w / 2;
    const startY = this.trainer.y + this.trainer.h / 2;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 440;

    if (dx < -10) this.trainer.facing = "left";
    else if (dx > 10) this.trainer.facing = "right";
    else this.trainer.facing = "front";

    this.balls.push({
      x: startX,
      y: startY,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      radius: 13,
      rot: 0
    });
    pixelAudio.sfxThrow();
  }

  spawnSparkles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 60 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        life: 0.65,
        maxLife: 0.65,
        imgKey: i % 2 === 0 ? "sparkleYellow" : "sparkle",
        size: 22
      });
    }
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt, now / 1000);
    this.draw(now / 1000);
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt, timeSec) {
    // Move trainer
    let mx = 0;
    let my = 0;
    if (this.keys.left) mx -= 1;
    if (this.keys.right) mx += 1;
    if (this.keys.up) my -= 1;
    if (this.keys.down) my += 1;

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      this.trainer.x += (mx / len) * this.trainer.speed * dt;
      this.trainer.y += (my / len) * this.trainer.speed * dt;
      if (mx < 0) this.trainer.facing = "left";
      else if (mx > 0) this.trainer.facing = "right";
      else this.trainer.facing = "front";
    }

    this.trainer.x = Math.max(8, Math.min(this.width - this.trainer.w - 8, this.trainer.x));
    this.trainer.y = Math.max(24, Math.min(this.height - this.trainer.h - 8, this.trainer.y));

    // Periodic bonus pickups (Star / Diamond)
    if (!this.finished) {
      this.pickupTimer += dt;
      if (this.pickupTimer > 5.5 && this.pickups.length < 3) {
        this.pickupTimer = 0;
        const isStar = Math.random() > 0.45;
        this.pickups.push({
          type: isStar ? "star" : "diamond",
          imgKey: isStar ? "star" : "diamond",
          x: 36 + Math.random() * (this.width - 96),
          y: 44 + Math.random() * (this.height - 110),
          size: 32,
          coins: isStar ? 3 : 2
        });
      }
    }

    // Trainer pickup collision
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const item = this.pickups[i];
      const dist = Math.hypot(
        this.trainer.x + this.trainer.w / 2 - (item.x + item.size / 2),
        this.trainer.y + this.trainer.h / 2 - (item.y + item.size / 2)
      );
      if (dist < 38) {
        this.spawnSparkles(item.x + item.size / 2, item.y + item.size / 2, 6);
        pixelAudio.sfxCoin();
        this.onCoinEarned(item.coins);
        if (item.type === "ditto") {
          this.setDialog("element/ditto.png", "DITTO BONUS!", "Ditto berubah jadi +5 Birthday Coins buat hizetblue!");
        }
        this.pickups.splice(i, 1);
      }
    }

    // Move active Pokémon
    for (const p of this.pokemons) {
      if (p.caught) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 14 || p.x > this.width - p.size - 14) {
        p.vx *= -1;
        p.x = Math.max(14, Math.min(this.width - p.size - 14, p.x));
      }
      if (p.y < 18 || p.y > this.height - p.size - 56) {
        p.vy *= -1;
        p.y = Math.max(18, Math.min(this.height - p.size - 56, p.y));
      }
    }

    // Move balls & check collisions
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += 12 * dt;

      if (b.x < -20 || b.x > this.width + 20 || b.y < -20 || b.y > this.height + 20) {
        this.balls.splice(i, 1);
        continue;
      }

      let hit = false;
      for (const p of this.pokemons) {
        if (p.caught) continue;
        const cx = p.x + p.size / 2;
        const cy = p.y + p.size / 2;
        if (Math.hypot(b.x - cx, b.y - cy) < p.size * 0.56) {
          p.caught = true;
          hit = true;
          this.caughtCount++;
          this.spawnSparkles(cx, cy, 10);
          pixelAudio.sfxCatch();
          this.onCoinEarned(2);
          this.updateScoreUI();
          this.setDialog(p.src, `GOTCHA! ${p.name}`, p.msg);

          if (this.caughtCount >= SQUAD_DATA.length) {
            this.finished = true;
            this.onQuestComplete("squad");
            setTimeout(() => {
              pixelAudio.sfxLevelUp();
              this.victoryEl.classList.remove("hidden");
            }, 450);
          }
          break;
        }
      }
      if (hit) {
        this.balls.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    this._timeSec = timeSec;
  }

  draw(timeSec) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Pixel grid floor tiles (blue meadow)
    ctx.fillStyle = "rgba(147, 197, 253, 0.08)";
    const tile = 32;
    for (let x = 0; x < this.width; x += tile * 2) {
      for (let y = Math.floor(this.height * 0.58); y < this.height; y += tile * 2) {
        ctx.fillRect(x, y, tile, tile);
        ctx.fillRect(x + tile, y + tile, tile, tile);
      }
    }

    // Decorative pixel trees at horizon
    if (this.images.tree) {
      ctx.globalAlpha = 0.45;
      ctx.drawImage(this.images.tree, 14, this.height * 0.42, 46, 52);
      ctx.drawImage(this.images.pine, this.width - 54, this.height * 0.40, 38, 56);
      ctx.globalAlpha = 1;
    }

    // Pickups
    for (const item of this.pickups) {
      const img = this.images[item.imgKey];
      const bob = Math.round(Math.sin(timeSec * 5) * 3);
      if (img) ctx.drawImage(img, item.x, item.y + bob, item.size, item.size);
    }

    // Active Pokémon
    for (const p of this.pokemons) {
      if (p.caught) continue;
      const img = this.images[p.id];
      const bob = Math.round(Math.sin(timeSec * 5 + p.bobOffset) * 3);
      // Pixel shadow
      ctx.fillStyle = "rgba(4, 11, 29, 0.45)";
      ctx.fillRect(p.x + 8, p.y + p.size - 4, p.size - 16, 6);
      if (img) ctx.drawImage(img, p.x, p.y + bob, p.size, p.size);
    }

    // Trainer
    const tImg = this.trainer.facing === "front" ? this.images.front : this.images.left;
    ctx.fillStyle = "rgba(4, 11, 29, 0.5)";
    ctx.fillRect(this.trainer.x + 8, this.trainer.y + this.trainer.h - 4, this.trainer.w - 16, 7);
    if (tImg) {
      ctx.save();
      if (this.trainer.facing === "right") {
        ctx.translate(this.trainer.x + this.trainer.w, this.trainer.y);
        ctx.scale(-1, 1);
        ctx.drawImage(tImg, 0, 0, this.trainer.w, this.trainer.h);
      } else {
        ctx.drawImage(tImg, this.trainer.x, this.trainer.y, this.trainer.w, this.trainer.h);
      }
      ctx.restore();
    }

    // Pokéballs
    for (const b of this.balls) {
      const img = this.images.pokeball;
      if (img) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.drawImage(img, -b.radius, -b.radius, b.radius * 2, b.radius * 2);
        ctx.restore();
      }
    }

    // Particles
    for (const pt of this.particles) {
      const img = this.images[pt.imgKey];
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      if (img) ctx.drawImage(img, pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      ctx.globalAlpha = 1;
    }
  }
}

