# 💙 Blue Pixel Birthday Quest — for `hizetblue`

Website ucapan ulang tahun interaktif bergaya retro pixel game (Mario × Pokémon, tema dominan biru) yang dibuat khusus oleh **anagwer** untuk **hizetblue**.

## ✨ Alur Cerita (5 Chapter)
1. **Prolog — Title Screen**: Layar pembuka game retro dengan koin, kotak hadiah, peti harta karun, dan tombol **Mulai Petualangan** yang menyalakan BGM chiptune 8-bit.
2. **Chapter 01 — Catch the Birthday Squad**: Mini-game Pokémon interaktif (gerakkan trainer pakai Arrow/WASD atau D-Pad HP, atau tap langsung Pokémon-nya untuk melempar Pokéball dan membaca ucapan dari tiap Pokémon).
3. **Chapter 02 — Make a Wish & Tiup Lilin**: Kue ulang tahun pixel art dengan 5 lilin menyala yang bisa ditiup lewat tap layar, tombol **Tiup Lilin**, atau langsung ditiup lewat **Mikrofon** HP/laptop!
4. **Chapter 03 — Surat Rahasia & Kucing Penjaga**: Amplop surat efek ketik (*typewriter*) dari `anagwer`, kucing penjaga yang bisa dibangunkan, serta *Message Bottle*, *Paper Plane*, dan *4-Leaf Clover*.
5. **Chapter 04 — Frames of Us**: Galeri foto dan video kenangan dalam bingkai pixel (`frame-cute`, `frame-gold`, `frame-woods`) lengkap dengan *lightbox*.
6. **Epilog — Poster `Pixellance` Love Burst**: Ketuk poster transparan `Pixellance.png` sebanyak mungkin untuk memunculkan ledakan & hujan love warna-warni.

## 🛠️ Teknologi
- **HTML5 + CSS3**: `@font-face` (`stairsnslabs.ttf` & `rainyhearts.ttf`), `image-rendering: pixelated`, animasi bertangga `steps()`, responsif untuk desktop dan HP.
- **Vanilla JavaScript**: HTML5 `<canvas>` game loop (`requestAnimationFrame` + delta time), partikel love warna-warni, dan **Web Audio API** (synthesizer BGM 8-bit + efek suara retro + deteksi tiupan mikrofon).

## 🚀 Cara Menjalankan & Membagikan
- **Buka langsung**: Klik dua kali `index.html` di browser (sudah kompatibel tanpa perlu server lokal).
- **Online lewat link (HP & Desktop)**: Unggah seluruh folder proyek ini ke **Netlify Drop**, **Vercel**, atau **GitHub Pages** lalu bagikan link-nya ke `hizetblue`.

## ✏️ Kustomisasi Cepat
- Edit isi surat ulang tahun (`BIRTHDAY_LETTER`) dan caption galeri (`MEMORY_ITEMS`) di `js/main.js`.
- Edit pesan tiap Pokémon (`SQUAD_DATA`) di `js/game.js`.

---
Made with 💙 by **anagwer** for **hizetblue**.

