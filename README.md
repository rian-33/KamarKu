# KamarKu

Website informasi dan pemesanan kamar hotel dalam bahasa Indonesia.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Build produksi dapat dibuat dengan `npm run build` dan dijalankan dengan `npm start`.

## Fitur yang tersedia

- Enam panel navigasi yang dapat dibookmark melalui hash URL.
- Filter ketersediaan berdasarkan tanggal dan jumlah tamu.
- Alur pemesanan dengan nomor dan foto KTP, pembayaran Midtrans, kode booking, cek status, dan permintaan pembatalan.
- Ketersediaan dihitung server-side dengan aturan overlap dan diperiksa ulang dalam transaksi SQLite saat booking dibuat.
- Login admin menggunakan `ADMIN_EMAIL`, bcrypt `ADMIN_PASSWORD_HASH`, dan cookie HttpOnly bertanda tangan (`AUTH_SECRET`). Admin dapat mengelola status booking, fasilitas, menu per tanggal, dan jam makan; kamar dapat ditambahkan.
- Informasi fasilitas, menu, profil hotel, dan lokasi ditampilkan; konten tersebut masih berupa contoh statis.

## Catatan implementasi

Runtime saat ini memakai `node:sqlite` melalui `src/lib/db.ts`; `prisma/schema.prisma` belum dipakai oleh route aplikasi dan bukan skema database aktif. Jalankan aplikasi pada satu proses Node dengan file database persisten. Jangan gunakan data hotel contoh, foto stok, alamat, nomor kontak, maupun kebijakan contoh sebagai informasi operasional sebelum diverifikasi.

Notifikasi pembayaran Midtrans harus diarahkan ke endpoint webhook dan diuji pada sandbox sebelum transaksi nyata. Endpoint booking publik hanya menampilkan ringkasan berdasarkan kode booking; endpoint administrasi yang memuat data tamu mengirim header `Cache-Control: no-store`.

Salin `.env.example` ke `.env.local`, lalu buat hash password dan secret sebelum login admin dan checkout:

```bash
node --input-type=module -e "import bcrypt from 'bcrypt'; console.log(await bcrypt.hash('GantiDenganPasswordKuat', 12))"
node --input-type=module -e "import crypto from 'node:crypto'; console.log(crypto.randomBytes(32).toString('hex'))"
```

Tempatkan hash pada `ADMIN_PASSWORD_HASH`, secret pada `AUTH_SECRET`, dan kunci acak 32-byte kedua pada `PII_ENCRYPTION_KEY` (64 karakter hex). Isi `ADMIN_EMAIL` serta `MIDTRANS_SERVER_KEY` dari akun Midtrans sandbox untuk mengaktifkan pembayaran; `MIDTRANS_IS_PRODUCTION=false` memakai sandbox. Atur URL notifikasi Midtrans ke `https://<domain-anda>/api/payments/midtrans`. Pembayaran lokal tidak dapat dikonfirmasi oleh webhook Midtrans sampai endpoint tersebut dapat dijangkau dari internet.

Admin masuk melalui `/admin/login`; area `/admin` memiliki layout dan sesi terpisah dari website tamu. Data nomor dan foto KTP dienkripsi dan dijadwalkan untuk dihapus 30 hari setelah checkout atau pembatalan. Saat ini pembersihan berlangsung ketika aplikasi berikutnya mengakses database, sehingga deployment produksi perlu job terjadwal untuk menjalankannya tepat waktu. Database SQLite dibuat dan diisi dengan tipe kamar awal pada permintaan pertama. Jalankan server Node pada satu host dengan direktori database yang persisten.

Di `.env.local`, escape setiap tanda `$` dalam hash bcrypt dengan garis miring terbalik (contoh pola: `\$2b\$12\$...`). Next.js memperluas variabel `$` saat membaca file env. Setelah mengubah `.env.local`, restart server development. Jangan kirim secret Midtrans atau KTP melalui chat atau commit ke repository.

## Pekerjaan lanjutan sebelum peluncuran publik

Database saat ini memakai SQLite bawaan Node, bukan adapter Prisma dari skema yang ada. Deployment multi-instance/serverless perlu database terkelola dengan transaksi dan migrasi. Rate limiting, pencatatan log, job penghapusan KTP, dan pipeline CI belum dibuat. Isi alamat, menu, foto, harga, hash password, dan kebijakan hotel dengan data asli sebelum menerima tamu.
