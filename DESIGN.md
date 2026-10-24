# DESIGN.md — Design System & Layout Guidelines
## Website Booking Kamar Hotel

Dokumen ini adalah **satu-satunya sumber kebenaran** untuk semua keputusan visual website. Tujuan utamanya: memastikan warna konsisten di seluruh halaman dan layout tetap jelas, teratur, serta mudah dipindai (scannable).

**Versi 1.1** — Perubahan utama: konten tidak lagi ditumpuk dalam satu landing page panjang, melainkan diorganisasi dalam **sistem Tab**. Ditambahkan **2 tab baru: Tentang dan Kontak & Lokasi**.

---

## 1. Prinsip Desain

| Prinsip | Artinya dalam praktik |
|---|---|
| **Konsisten** | Semua warna, ukuran, dan jarak hanya mengambil nilai dari token di dokumen ini. Tidak ada warna hard-code di luar token. |
| **Jelas** | Informasi utama (kamar kosong, harga, jam makan) selalu menjadi elemen paling menonjol di tab yang bersangkutan. |
| **Teratur** | Setiap tab memakai grid dan spacing yang sama; komponen sejenis tampil seragam di mana pun. |
| **Tab, bukan scroll panjang** | Satu tab = satu topik. Pengguna berpindah topik lewat tab, bukan menggulir satu halaman raksasa. |

---

## 2. Warna (Color System)

### 2.1 Palet Utama — "Warm Hospitality"

Konsep: hangat, bersih, terpercaya. Nuansa krem/emas dipakai untuk kesan hotel premium, hijau sage untuk aksen alami.

| Token | Hex | Peruntukan |
|---|---|---|
| `primary-900` | `#1B3A2F` | Judul besar, teks utama di atas background terang |
| `primary-700` | `#2D5A45` | Heading sekunder, ikon penting |
| `primary-500` | `#4A7C59` | **Aksen utama:** tombol utama, link, elemen interaktif |
| `primary-100` | `#DDE8DF` | Background section alternatif, highlight ringan |
| `primary-50`  | `#F2F7F3` | Background kartu lembut, chip status |

| Token | Hex | Peruntukan |
|---|---|---|
| `accent-500` | `#C9A227` | Harga, badge "Tersedia", garis penekanan (dipakai hemat) |
| `accent-100` | `#F5EBCB` | Background badge/highlight kuning lembut |

### 2.2 Netral (Grayscale)

| Token | Hex | Peruntukan |
|---|---|---|
| `neutral-900` | `#1A1A1A` | Teks utama body |
| `neutral-600` | `#5C5C5C` | Teks sekunder (deskripsi, metadata) |
| `neutral-400` | `#9E9E9E` | Placeholder, teks non-aktif |
| `neutral-200` | `#E5E5E5` | Border, divider |
| `neutral-100` | `#F5F5F5` | Background section |
| `neutral-0`   | `#FFFFFF` | Background kartu & tab aktif |

### 2.3 Warna Status (Wajib Konsisten di Semua Tab)

| Status | Token | Hex | Dipakai untuk |
|---|---|---|---|
| Sukses / Tersedia | `success` | `#2E7D32` | "X kamar tersedia", booking confirmed |
| Peringatan | `warning` | `#E8A13A` | Kamar sisa sedikit (≤ 2), booking pending |
| Error / Penuh | `error` | `#C0392B` | "Penuh", form error, booking cancelled |
| Info | `info` | `#2C6E9B` | Catatan, tooltip, jam makan aktif, tab hover ringan |

**Aturan status ketersediaan kamar (paling penting di website ini):**
- `success` — kamar tersedia > 2
- `warning` — kamar tersisa 1–2
- `error` — kamar penuh / tidak tersedia

### 2.4 Konfigurasi Tailwind

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#F2F7F3',
          100: '#DDE8DF',
          500: '#4A7C59',
          700: '#2D5A45',
          900: '#1B3A2F',
        },
        accent: {
          100: '#F5EBCB',
          500: '#C9A227',
        },
        neutral: {
          0:   '#FFFFFF',
          100: '#F5F5F5',
          200: '#E5E5E5',
          400: '#9E9E9E',
          600: '#5C5C5C',
          900: '#1A1A1A',
        },
        success: '#2E7D32',
        warning: '#E8A13A',
        error:   '#C0392B',
        info:    '#2C6E9B',
      },
    },
  },
}
```

### 2.5 Aturan Pemakaian Warna (Do & Don't)

**✅ Lakukan:**
- Tombol aksi utama (Cari Kamar, Booking Sekarang) selalu `primary-500` dengan teks `neutral-0`.
- Harga selalu `accent-500` agar konsisten terpindai sebagai "angka penting".
- Badge status ketersediaan kamar hanya memakai warna status di tabel 2.3.
- Tab aktif: background `primary-500`, teks `neutral-0`. Tab tidak aktif: teks `neutral-600`.
- Background halaman `neutral-0`, section dalam tab bergantian `neutral-100` / `primary-50`.

**❌ Jangan:**
- Jangan memakai warna di luar token (tidak ada `#3B82F6` biru default Tailwind, tidak ada hijau lain selain token).
- Jangan memakai `error` untuk dekorasi — hanya untuk kondisi gagal/penuh.
- Jangan menaruh teks `neutral-900` di atas `primary-700/900` tanpa teks putih.
- Jangan pakai warna status sebagai warna tombol utama.

### 2.6 Aksesibilitas Warna

- Rasio kontras teks terhadap background minimal **4.5:1** (AA).
- `primary-500` hanya untuk teks besar/tebal atau elemen non-teks; teks biasa di atasnya gunakan `primary-700/900`.
- Status tidak hanya ditandai warna — selalu ada label teks ("Tersedia", "Sisa 1", "Penuh") untuk pengguna dengan buta warna.

---

## 3. Tipografi

| Token | Font | Ukuran | Berat | Peruntukan |
|---|---|---|---|---|
| `font-display` | Playfair Display (serif) | 36–48px | 600/700 | Judul hero, heading halaman/tab |
| `font-heading` | Plus Jakarta Sans | 24–32px | 600 | Heading section, judul kartu |
| `font-body` | Plus Jakarta Sans | 16px | 400 | Paragraf, deskripsi |
| `font-small` | Plus Jakarta Sans | 14px | 400/500 | Metadata, keterangan kecil |
| `font-tiny` | Plus Jakarta Sans | 12px | 500 | Badge, label status |

- Line-height body: **1.6**; heading: **1.2**.
- Skala heading konsisten: H1 40px → H2 28px → H3 22px → H4 18px.

---

## 4. Spacing & Grid

### 4.1 Sistem Spacing (kelipatan 4px)

Gunakan utilitas Tailwind standar: `p-1 (4px)`, `p-2 (8px)`, `p-4 (16px)`, `p-6 (24px)`, `p-8 (32px)`, `p-12 (48px)`.

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `space-xs` | 8px | Jarak antar elemen kecil dalam satu komponen |
| `space-sm` | 16px | Padding kartu, jarak dalam form |
| `space-md` | 24px | Jarak antar kartu/komponen |
| `space-lg` | 48px | Jarak antar section di dalam satu tab |
| `space-xl` | 80px | Jarak section besar (hero → konten pertama) |

### 4.2 Layout Grid

```
┌──────────────────────────────────────────────────────────┐
│  CONTAINER (max-width 1200px, padding-x 24px)            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  HEADER (sticky, tinggi 72px)                      │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  TAB BAR (sticky di bawah header, tinggi 56px)     │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  PANEL TAB AKTIF (hanya SATU panel tampil)         │  │
│  │  (sesuai pola tab di bagian 6)                     │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  FOOTER (dark, primary-900)                        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- **Breakpoint:** `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px.
- **Container:** maksimal `1200px`, terpusat (`mx-auto`), padding horizontal `24px` (mobile) / `32px` (desktop).
- **Grid kartu:** 1 kolom (mobile) → 2 kolom (md) → 3 kolom (lg) → 4 kolom (xl, hanya untuk galeri).

### 4.3 Radius & Elevation

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `radius-sm` | 8px | Button, input, badge |
| `radius-md` | 12px | Kartu kecil (menu makan), TAB PILL aktif |
| `radius-lg` | 16px | Kartu utama (kamar, fasilitas) |
| `shadow-card` | `0 2px 8px rgba(0,0,0,0.08)` | Kartu default |
| `shadow-hover` | `0 8px 24px rgba(0,0,0,0.12)` | Kartu saat hover |

---

## 5. Komponen Inti

### 5.1 Sistem Tab (KOMPONEN BARU — NAVIGASI UTAMA)

Karena konten tidak lagi ditumpuk dalam satu landing page, seluruh navigasi konten memakai **Tab Bar** yang sticky di bawah header.

**Daftar tab (6 tab):**

| # | Tab | Isi | Status |
|---|---|---|---|
| 1 | **Beranda** | Hero, CTA utama, ringkasan singkat | Ada |
| 2 | **Kamar** | Ketersediaan + filter + grid kamar | Ada |
| 3 | **Fasilitas** | Daftar fasilitas hotel | Ada |
| 4 | **Jam Makan** | Jadwal waktu makan + menu/lauk | Ada |
| 5 | **Tentang** | Profil hotel, sejarah, keunggulan | **TAB BARU** |
| 6 | **Kontak & Lokasi** | Alamat, peta, telepon, email, jam layanan | **TAB BARU** |

**Aturan perilaku tab:**
- Hanya **satu panel tab yang tampil** dalam satu waktu; pindah tab tidak me-reload halaman (client-side state, mis. dengan Zustand atau `useState` di page induk).
- URL tetap bisa di-bookmark: sinkronkan tab aktif dengan **URL hash** — `#beranda`, `#kamar`, `#fasilitas`, `#makan`, `#tentang`, `#kontak`.
- Pindah tab **tidak menghapus state** tab lain (mis. tanggal yang sudah dipilih di tab Kamar tetap tersimpan saat pengguna bolak-balik).
- **Tab Kamar adalah tab default** setelah Beranda jika pengguna datang lewat CTA "Cari Kamar".

**Visual Tab Bar:**

```
Desktop (pill style, rata kiri dalam container):
┌──────────────────────────────────────────────────────────────┐
│ [Beranda] [Kamar] [Fasilitas] [Jam Makan] [Tentang] [Kontak] │
│          ▲ aktif: bg primary-500, teks putih, radius-md      │
└──────────────────────────────────────────────────────────────┘

Mobile: tab bar bisa di-scroll horizontal, panah indikator jika terpotong.
```

| Keadaan | Background | Teks | Indikator |
|---|---|---|---|
| Aktif | `primary-500` | `neutral-0` | — |
| Hover | `primary-50` | `primary-700` | — |
| Tidak aktif | transparan | `neutral-600` | — |
| Focus (keyboard) | `primary-100` | `primary-700` | ring `primary-500` |

### 5.2 Tombol

| Varian | Background | Teks | Pemakaian |
|---|---|---|---|
| Primary | `primary-500` (hover: `primary-700`) | `neutral-0` | Aksi utama: "Cari Kamar", "Booking Sekarang" |
| Secondary | border `primary-500`, bg transparan | `primary-500` | Aksi sekunder: "Lihat Detail", "Ubah Tanggal" |
| Ghost | transparan | `neutral-600` | Navigasi kecil, filter |
| Danger | `error` | `neutral-0` | Hanya aksi destruktif admin: "Batalkan Booking" |

Aturan: **maksimal 1 tombol Primary per layar/panel tab** agar mata langsung tertuju ke aksi terpenting.

### 5.3 Kartu Kamar (RoomCard)

```
┌──────────────────────────────┐
│  [Foto kamar, 16:10]         │
│  ┌─────────────┐             │
│  │ Deluxe Room │  Rp 850rb   │  ← nama (heading) + harga (accent-500)
│  │ 2 tamu · 30m²             │
│  ├────────────────────────── │
│  ● Tersedia 5 kamar          │  ← status dengan warna status + teks
│  [ Lihat Detail ] [ Booking ]│  ← secondary + primary
└──────────────────────────────┘
```

- Selalu menampilkan: foto, nama, harga/malam, kapasitas, **badge ketersediaan**.
- Badge ketersediaan: bulatan kecil + teks ("Tersedia 5", "Sisa 1", "Penuh").

### 5.4 Kartu Jadwal Makan (MealCard)

```
┌─────────────────────────────────┐
│ 🍳 SARAPAN     06.30 – 09.30    │  ← ikon + label + jam (info-500)
│ ─────────────────────────────── │
│ Lauk utama: Nasi goreng, ...    │
│ Sayur: ...        Minuman: ...  │
└─────────────────────────────────┘
```

- Ikon per waktu makan: 🍳 pagi · 🍽️ siang · 🌙 malam (ikon konsisten, jangan berganti-ganti).
- Menu yang belum diisi admin menampilkan: "Menu akan diumumkan" (`neutral-400`), **jangan** dibiarkan kosong.

### 5.5 Kartu Fasilitas (FacilityCard)

- Foto 16:9, nama fasilitas (heading), kategori sebagai chip kecil (`primary-100` bg, `primary-700` teks), deskripsi 2 baris maks.
- Ukuran kartu seragam — gunakan `line-clamp-2` untuk deskripsi.

### 5.6 Form & Input

- Input: border `neutral-200`, radius `radius-sm`, focus → border `primary-500` + ring `primary-100`.
- Label selalu di atas input, bukan placeholder sebagai pengganti label.
- Pesan error: teks `error` + ikon ⚠, muncul di bawah field terkait.

### 5.7 Navbar (sticky di semua halaman)

```
[Logo]                                     [Cek Booking] [Login]
```

- Navbar hanya berisi **logo dan aksi akun** — navigasi konten dipindah ke Tab Bar (§5.1) agar tidak ada duplikasi menu.
- Background `neutral-0` / 90% transparan blur; saat scroll diberi border bawah `neutral-200`.
- Tombol "Login" berubah jadi avatar/nama setelah masuk.

### 5.8 Footer

- Background `primary-900`, teks `neutral-0` / 70% opacity.
- Isi: alamat & kontak hotel singkat, jam makan ringkas, link cepat ke tab, copyright.

---

## 6. Pola Layout per Tab

Semua tab mengikuti kerangka sama: **Page Header (judul tab + deskripsi singkat) → Kontrol/filter → Konten Grid → CTA/Footer**. Konsistensi kerangka inilah yang membuat setiap tab terasa teratur.

### 6.1 Tab Beranda (`#beranda`)
Landing page dibuat **ringkas** — bukan tumpukan semua konten, melainkan pintu masuk ke tiap tab.
```
[Navbar]
[Tab Bar]
[Hero: foto hotel + tagline + CTA "Cari Kamar" → pindah ke tab Kamar]
[Section: 3 kartu pintasan]      ← "Lihat Kamar" / "Fasilitas" / "Jam Makan"
                                   (masing-masing 1 gambar + 1 kalimat, klik → tab terkait)
[Section: Mengapa memilih kami]  ← 3 poin keunggulan (primary-50 bg)
[Section: Testimoni singkat]     ← 1–2 testimoni
[Footer]
```
⛔ **Dilarang:** menampilkan ulang grid kamar lengkap, daftar fasilitas lengkap, atau menu makan di Beranda — itu tugas tab masing-masing.

### 6.2 Tab Kamar (`#kamar`) — TAB TERPENTING
```
[Navbar]
[Tab Bar]
[Page Header: "Kamar Tersedia" + subjudul tanggal]
[Filter Bar (sticky di atas panel): check-in | check-out | jumlah tamu | [Cari] ]
┌──────────────┬──────────────────────────────────┐
│  Filter      │  [RoomCard] [RoomCard]           │
│  samping     │  [RoomCard] [RoomCard]           │
│  (desktop)   │  [RoomCard] [RoomCard]           │
└──────────────┴──────────────────────────────────┘
Mobile: filter jadi dropdown di atas grid 1 kolom.
Empty state: ilustrasi + "Tidak ada kamar pada tanggal ini" + tombol "Ubah Tanggal".
```

### 6.3 Tab Fasilitas (`#fasilitas`)
```
[Navbar]
[Tab Bar]
[Page Header + deskripsi singkat]
[Chip kategori filter: Semua | Kolam Renang | Gym | Restoran | Spa | Lainnya]
[Grid kartu fasilitas 3 kolom]
```

### 6.4 Tab Jam Makan (`#makan`)
```
[Navbar]
[Tab Bar]
[Page Header: "Jam Makan & Menu"]
[Date picker: pilih tanggal]              ← default: hari ini
[3 kartu MealCard berdampingan (lg)]      ← Breakfast | Lunch | Dinner
[Catatan: alergi/khusus → hubungi petugas] ← info-500
```

### 6.5 Tab Tentang (`#tentang`) — **TAB BARU 1**
```
[Navbar]
[Tab Bar]
[Page Header: "Tentang [Nama Hotel]" + foto hotel/lobby lebar]
[Section: Cerita singkat hotel]        ← 2 paragraf maks + foto pendukung
[Section: Keunggulan]                  ← 3–4 poin dengan ikon
[Section: Kebijakan penting]           ← check-in/out, anak & hewan, dsb. (accordion)
[Section: Statistik (opsional)]        ← jumlah kamar, tahun berdiri, rating tamu
```

### 6.6 Tab Kontak & Lokasi (`#kontak`) — **TAB BARU 2**
```
[Navbar]
[Tab Bar]
[Page Header: "Kontak & Lokasi"]
┌──────────────────────┬──────────────────────────┐
│  [Peta / embed map]  │  📍 Alamat lengkap       │
│                      │  📞 Telepon / WhatsApp   │
│                      │  ✉️ Email                │
│                      │  🕐 Jam layanan front    │
│                      │     office               │
│                      │  [Tombol "Buka di Maps"] │
└──────────────────────┴──────────────────────────┘
[Section: Form pesan singkat (nama, email, pesan)] ← opsional, kirim ke email hotel
```
- Peta memakai embed Google Maps tanpa API key berat; tombol "Buka di Maps" membuka rute di tab baru.

### 6.7 Halaman Booking (`/booking`) — di luar tab
Booking tetap **halaman terpisah** (bukan tab) karena butuh fokus penuh tanpa distraksi tab.
```
[Navbar]
[Stepper: 1. Tanggal → 2. Data Tamu → 3. Konfirmasi]
[Kolom kiri (form)        | Kolom kanan (ringkasan):   ]
[ nama, email, tamu, dll ] [  foto kamar, tanggal,     ]
[                          [  harga/malam × n malam,   ]
[                          [  total (accent-500),       ]
[                          [  tombol Booking Sekarang ] ]
Mobile: ringkasan pindah ke bawah form.
```

### 6.8 Layout Admin (`/admin/*`)
- Sidebar kiri gelap (`primary-900`, 240px): Kamar, Fasilitas, Jam Makan, Booking, Dashboard.
- Konten kanan: header halaman + aksi utama (tombol "Tambah") + tabel/kartu.
- Tabel admin: header `primary-50`, zebra row `neutral-100`, aksi row berupa ikon edit/hapus dengan tooltip.
- Admin **tidak** menggunakan warna aksen emas untuk dekorasi — aksen hanya status.

---

## 7. Tata Letak & Hierarki Visual

1. **Satu tujuan per tab.** Tab Kamar fokus ke ketersediaan; jangan menyelipkan promo besar di sana.
2. **F-pattern / Z-pattern:** informasi terpenting (harga, status tersedia) diletakkan di area yang dibaca lebih dulu.
3. **Whitespace adalah alat.** Section dipisahkan `space-lg` (48px), bukan garis pembatas tebal.
4. **Alignment:** semua elemen dalam section sejajar ke kiri dengan gutter yang sama; tidak ada elemen melayang tanpa alasan.
5. **Urutan konten konsisten di semua kartu:** gambar → judul → metadata → status → aksi.
6. **Transisi antar tab halus:** fade/slide 150–200ms, tanpa efek berlebihan.

---

## 8. Responsivitas

| Elemen | Mobile (<768px) | Desktop (≥1024px) |
|---|---|---|
| Grid kamar | 1 kolom | 3 kolom + filter samping |
| Navbar | logo + tombol kompak | sama (navigasi sudah di tab bar) |
| Tab bar | scroll horizontal, pill kecil | pill penuh dalam satu baris |
| Filter ketersediaan | dropdown collapsible | bar sticky horizontal |
| MealCard | scroll horizontal | 3 kolom sejajar |
| Kontak & Lokasi | peta di atas, info di bawah | 2 kolom berdampingan |
| Tabel admin | kartu list | tabel penuh |
| Font H1 | 30px | 40px |

---

## 9. Ikon & Ilustrasi

- Ikon: satu set saja (mis. **Lucide** atau **Phosphor**), outline 1.5–2px, warna `neutral-600` atau `primary-700`.
- Ukuran ikon: 16px (inline), 24px (kartu), 48px (empty state).
- Ikon khusus yang dipakai konsisten di seluruh tab:
  - Tab Beranda: 🏠 · Kamar: 🛏️ · Fasilitas: 🏊 · Jam Makan: 🍽️ · Tentang: ℹ️ · Kontak: 📞
- Foto: rasio konsisten (16:10 kamar, 16:9 fasilitas), object-fit cover, placeholder `neutral-200` saat loading.
- Jangan mencampur gaya ikon filled dan outline.

---

## 10. Checklist Konsistensi (dipakai saat review)

- [ ] Semua warna berasal dari token §2 (cek tidak ada hex liar di kode)
- [ ] Badge status kamar memakai warna + teks sesuai §2.3
- [ ] Harga selalu `accent-500`
- [ ] Spacing hanya kelipatan 4px (§4.1)
- [ ] Maksimal 1 tombol Primary per panel tab
- [ ] Kontras teks ≥ 4.5:1
- [ ] Navbar & footer identik; navigasi konten hanya lewat Tab Bar §5.1
- [ ] Tab aktif tersinkron dengan URL hash (bisa di-bookmark)
- [ ] State filter/tanggal tidak hilang saat pindah tab
- [ ] Rasio foto sesuai §9
- [ ] Empty state tersedia untuk kamar penuh, menu kosong, dan hasil filter nol

---

**Versi 1.1 — Design System Hotel Booking System.**
Perubahan warna/layout/tab wajib diperbarui di dokumen ini terlebih dahulu sebelum diimplementasikan ke kode.
