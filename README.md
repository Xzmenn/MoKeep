# Mokeep — Aplikasi Pencatat Keuangan Pribadi Modern

**Mokeep** adalah aplikasi web pencatat dan pengelola keuangan pribadi yang lengkap, modern, *production-ready*, aman, dan mudah dikembangkan. Aplikasi ini dibangun dengan standar UI/UX modern ala fintech (Emerald/Fintech aesthetic), mendukung multi-akun, transfer antar rekening, anggaran bulanan, target tabungan, laporan visual interaktif, ekspor/impor data, hingga PWA (*Progressive Web App*).

---

## 🌟 Fitur Utama

### 1. Autentikasi & Akun Pengguna
- **Pendaftaran & Masuk**: Register akun baru dengan *bootstrap* otomatis kategori & akun dasar.
- **Login Demo 1-Klik**: Tombol instan untuk mengisi kredensial akun demo (`demo@mokeep.id` / `password123`).
- **Lupa & Setel Ulang Kata Sandi**: Mekanisme reset token aman dengan waktu kedaluwarsa 1 jam.
- **Manajemen Profil**: Ubah nama, email, foto avatar, kata sandi, dan mata uang default (`IDR`, `USD`, `EUR`, `SGD`, `MYR`).
- **Keamanan**: Password di-hash menggunakan `bcryptjs` (salt 10 rounds), proteksi sesi JWT terenkripsi NextAuth.

### 2. Multi-Akun & Dompet (Wallets)
- **Jenis Akun Lengkap**: Kas/Tunai (`CASH`), Rekening Bank (`BANK`), E-Wallet (`EWALLET`), Kartu Kredit (`CREDIT_CARD`), dan Investasi (`INVESTMENT`).
- **Saldo Real-Time**: Perhitungan saldo awal + pergerakan seluruh transaksi masuk/keluar.
- **Transfer Antar Rekening**: Memindahkan dana dari akun sumber ke akun tujuan secara atomik.
- **Validasi Saldo**: Mencegah transaksi atau transfer bernilai minus pada akun biasa (kecuali akun jenis Kartu Kredit).
- **Arsip Akun**: Akun yang memiliki riwayat transaksi dapat diarsipkan secara aman tanpa merusak integritas relasi foreign key.

### 3. Kategori & Subkategori
- **Kategori Bawaan**: Makan & Minum, Transportasi, Tagihan, Belanja, Hiburan, Gaji, Freelance, Investasi, dll.
- **Subkategori**: Hirarki terstruktur (misal: Makan Siang, Kopi, Groceries).
- **Kustomisasi Visual**: Pilihan ikon Lucide dan palet warna per kategori.
- **Tipe Transaksi**: Pengeluaran (`EXPENSE`), Pemasukan (`INCOME`), dan Transfer (`TRANSFER`).

### 4. Transaksi Lengkap (CRUD)
- **Pencatatan Cepat**: Modal popup "+ Catat Transaksi" dapat diakses dari header mana saja.
- **Field Data**: Tanggal, Jumlah, Akun Sumber, Akun Tujuan, Kategori, Subkategori, Catatan, dan Tag.
- **Pencarian & Filter**: Filter berdasarkan jenis, akun, kategori, rentang tanggal, dan teks pencarian.
- **Paginasi & Sorting**: Navigasi halaman cepat dan terstruktur.
- **Rollback Saldo Atomik**: Mengubah atau menghapus transaksi otomatis memulihkan saldo akun ke nilai sebelumnya secara presisi.

### 5. Anggaran Bulanan (Budget)
- **Batas Pengeluaran per Kategori**: Tetapkan alokasi anggaran bulanan per pos belanja.
- **Progress Bar Interaktif**:
  - 🟢 **Hijau (Normal)**: Pemakaian belanja di bawah ambang batas.
  - 🟡 **Kuning (Peringatan)**: Pemakaian mendekati batas (misal: $\ge$ 80%).
  - 🔴 **Merah (Defisit / Bahaya)**: Pemakaian melampaui 100% dari anggaran.
- **Banner Peringatan Dini**: Muncul otomatis di dashboard jika ada kategori yang terancam boncos.

### 6. Target Tabungan & Impian (Goals)
- **Perencanaan Finansial**: Target tabungan dengan nominal impian, tenggat waktu (*deadline*), dan akun rekening terkait.
- **Setor Tabungan**: Tombol kontribusi untuk menambahkan dana tabungan secara berkala.
- **Indikator Kemajuan**: Persentase tercapai, sisa dana yang harus dikumpulkan, serta hitung mundur hari tersisa.

### 7. Dashboard & Laporan Analisis
- **Ringkasan Finansial**: Total Kekayaan Bersih (*Net Worth*), Pemasukan, Pengeluaran, dan Tabungan Bersih (*Net Surplus*).
- **Grafik Interaktif Recharts**:
  - Tren Arus Kas multi-bulan (*AreaChart* dan *BarChart*).
  - Donut Chart komposisi pengeluaran per kategori.
- **Filter Periode Dinamis**: Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini, dan Rentang Tanggal Kustom.
- **Ekspor Dokumen**:
  - Unduh **CSV / Spreadsheet Excel**.
  - Cetak / **Export PDF** siap pakai dengan styling `@media print` rapi.

### 8. Utilitas & Integrasi
- **Impor CSV**: Impor riwayat transaksi dari file CSV dengan pemetaan otomatis akun dan kategori.
- **Cadangan Penuh (JSON Backup)**: Unduh seluruh dump basis data (akun, kategori, anggaran, goals, transaksi) untuk pencadangan lokal.
- **Mode Gelap / Terang**: Switcher tema elegan yang tersimpan di *local storage*.
- **PWA (Progressive Web App)**: Web app dapat di-*install* langsung ke desktop atau layar utama smartphone.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
| :--- | :--- |
| **Framework** | [Next.js 14+ (App Router)](https://nextjs.org/) |
| **Bahasa** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Komponen UI** | Desain berbasis [shadcn/ui](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/) |
| **Database & ORM**| [Prisma ORM](https://www.prisma.io/) + SQLite (Lokal) / PostgreSQL (Produksi) |
| **Autentikasi** | [NextAuth.js](https://next-auth.js.org/) (Credentials Provider + JWT Session) |
| **Validasi & Form**| [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) |
| **Grafik & Visual**| [Recharts](https://recharts.org/) |
| **Tanggal** | [date-fns](https://date-fns.org/) (dengan locale Bahasa Indonesia) |
| **Notifikasi** | [Sonner](https://sonner.emilkowal.ski/) |
| **Unit Testing** | [Vitest](https://vitest.dev/) |

---

## 📁 Struktur Direktori Lengkap

```text
keuangan-app/
├── prisma/
│   ├── schema.prisma            # Skema lengkap Prisma database
│   ├── seed.ts                  # Skrip seed data realistis Bahasa Indonesia
│   └── dev.db                   # Database SQLite lokal
├── public/
│   ├── manifest.json            # Konfigurasi PWA installable
│   └── favicon.ico              # Ikon aplikasi
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx           # Halaman Masuk (+ Tombol Akun Demo)
│   │   │   ├── register/page.tsx        # Halaman Pendaftaran Akun
│   │   │   ├── forgot-password/page.tsx # Halaman Permintaan Reset Sandi
│   │   │   └── reset-password/page.tsx  # Halaman Setel Ulang Kata Sandi
│   │   ├── accounts/page.tsx            # Halaman Akun & Dompet (Wallets)
│   │   ├── budgets/page.tsx             # Halaman Anggaran Bulanan
│   │   ├── categories/page.tsx          # Halaman Kategori & Subkategori
│   │   ├── dashboard/page.tsx           # Halaman Dashboard Utama
│   │   ├── goals/page.tsx               # Halaman Target Tabungan
│   │   ├── reports/page.tsx             # Halaman Laporan & Analitik
│   │   ├── settings/page.tsx            # Halaman Pengaturan & Backup
│   │   ├── transactions/page.tsx        # Halaman Riwayat Transaksi & Filter
│   │   ├── api/
│   │   │   ├── accounts/                # Endpoint Akun & Transfer
│   │   │   ├── auth/                    # Endpoint NextAuth, Register, Reset
│   │   │   ├── budgets/                 # Endpoint Anggaran & Perhitungan
│   │   │   ├── categories/              # Endpoint Kategori & Subkategori
│   │   │   ├── export/                  # Endpoint Ekspor CSV & JSON
│   │   │   ├── goals/                   # Endpoint Target & Kontribusi
│   │   │   ├── import/                  # Endpoint Impor CSV Transaksi
│   │   │   ├── recurring/               # Endpoint Transaksi Berulang
│   │   │   ├── reports/                 # Endpoint Ringkasan, Kategori, Arus Kas
│   │   │   ├── transactions/            # Endpoint Transaksi & Rollback Saldo
│   │   │   └── user/profile/            # Endpoint Profil & Sandi
│   │   ├── globals.css                  # Variabel CSS tema gelap/terang & print
│   │   ├── layout.tsx                   # Root Layout Next.js
│   │   └── page.tsx                     # Landing / Hero Page
│   ├── components/
│   │   ├── accounts/account-dialog.tsx  # Modal Tambah/Ubah Akun
│   │   ├── budgets/budget-dialog.tsx    # Modal Atur Anggaran Bulanan
│   │   ├── goals/                       # Modal Target & Setor Tabungan
│   │   ├── layout/                      # Sidebar & Header
│   │   ├── transactions/                # Modal Transaksi Multi-Tab
│   │   ├── ui/                          # Komponen Button, Input, Card, Modal, dll
│   │   ├── category-icon.tsx            # Pemetaan Ikon Lucide
│   │   ├── theme-provider.tsx           # Provider Tema
│   │   └── theme-toggle.tsx             # Switcher Mode Gelap / Terang
│   ├── lib/
│   │   ├── auth.ts                      # Konfigurasi NextAuth Provider
│   │   ├── balance.ts                   # Logika kalkulasi saldo atomik & validasi
│   │   ├── logger.ts                    # Logger aplikasi terstruktur
│   │   ├── prisma.ts                    # Singleton PrismaClient
│   │   ├── session.ts                   # Helper sesi & respons API
│   │   ├── utils.ts                     # Format Rupiah & tanggal Bahasa Indonesia
│   │   ├── utils.test.ts                # Unit tests untuk utilitas mata uang & tanggal
│   │   └── validations.ts               # Skema validasi Zod
│   └── types/
│       └── next-auth.d.ts               # Definisi tipe TypeScript NextAuth
├── .env.example                         # Contoh variabel lingkungan
├── next.config.mjs                      # Konfigurasi Next.js
├── package.json                         # Dependencies & skrip npm
├── tailwind.config.ts                   # Konfigurasi Tailwind & palet warna
└── tsconfig.json                        # Konfigurasi TypeScript
```

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Prasyarat
- **Node.js** versi 18.17+ atau versi 20+ / 22+
- **npm** atau **pnpm** / **yarn**

### 2. Kloning / Buka Direktori
Masuk ke direktori proyek `keuangan-app`:
```bash
cd keuangan-app
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi file `.env` untuk pengujian lokal:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="mokeep-super-secret-key-32-chars-minimum"
```

> **Catatan untuk PostgreSQL (Mode Produksi):**
> Jika ingin menghubungkan ke database PostgreSQL, ubah provider di `prisma/schema.prisma` menjadi `provider = "postgresql"` dan isi `DATABASE_URL="postgresql://user:pass@localhost:5432/mokeep?schema=public"`.

### 4. Sinkronisasi Database & Generate Prisma Client
Jalankan perintah push schema:
```bash
npx prisma db push
```

### 5. Jalankan Seed Data Demo
Isi database dengan akun demo dan puluhan transaksi realistis:
```bash
npm run seed
```

Hasil kredensial demo:
- **Email**: `demo@mokeep.id`
- **Kata Sandi**: `password123`

### 6. Jalankan Server Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pengujian Unit & Kualitas Kode

Aplikasi ini dilengkapi pengujian unit otomatis menggunakan **Vitest** untuk memverifikasi logika kritis:
1. Pemformatan mata uang Rupiah (`Rp 1.500.000` dan nominal negatif `-Rp 50.000`).
2. Pembersihan *input string* menjadi angka numerik presisi (`parseCurrency`).
3. Pemformatan tanggal lokal Indonesia (`formatDateShort`, `formatDateIndo`).
4. Label tipe akun dan transaksi.

Jalankan pengujian unit dengan:
```bash
npm test
```

Untuk memverifikasi build produksi dan tipe TypeScript secara utuh:
```bash
npm run build
```

---

## 📋 Acceptance Criteria & Panduan Pengujian Manual

| Skenario | Langkah Pengujian | Hasil yang Diharapkan |
| :--- | :--- | :--- |
| **Login Akun Demo** | 1. Buka `/login`<br>2. Klik tombol *"Isi Akun Demo"*<br>3. Klik *"Masuk"* | Berhasil login dan langsung dialihkan ke `/dashboard` dengan data transaksi demo. |
| **Catat Pengeluaran** | 1. Klik tombol *"+ Tambah"* di header<br>2. Pilih tab *"Pengeluaran"*<br>3. Isi jumlah `50000`, pilih Akun *"Dompet Tunai"*, Kategori *"Makanan & Minuman"*<br>4. Simpan | Transaksi tercatat, saldo *"Dompet Tunai"* berkurang Rp 50.000 secara otomatis. |
| **Validasi Saldo Minus** | 1. Catat pengeluaran sebesar Rp 999.000.000 pada akun Tunai/Bank | Muncul pesan peringatan error bahwa saldo tidak mencukupi, transaksi ditolak. |
| **Transfer Antar Akun** | 1. Buka `/accounts`<br>2. Klik *"Transfer Antar Rekening"*<br>3. Dari *"Bank BCA"* ke *"GoPay"* sebesar Rp 200.000 | Saldo BCA berkurang Rp 200.000 dan saldo GoPay bertambah Rp 200.000 secara serentak. |
| **Peringatan Anggaran** | 1. Buka `/budgets`<br>2. Amati kategori belanja yang terpakai $\ge 80\%$ atau $\ge 100\%$ | Progress bar berubah warna kuning/merah dan status *"Mendekati Batas"* / *"Melebihi Batas"* muncul. |
| **Setor Target Impian** | 1. Buka `/goals`<br>2. Klik *"Setor Tabungan"* pada *"Dana Darurat"* sebesar Rp 500.000 | Nilai terkumpul bertambah, persentase naik, dan riwayat setoran tercatat. |
| **Ekspor CSV & JSON** | 1. Buka `/settings`<br>2. Klik *"Unduh Cadangan JSON"* & *"Unduh Spreadsheet CSV"* | File cadangan terunduh langsung ke komputer pengguna. |
| **Impor CSV** | 1. Buka `/transactions`<br>2. Klik *"Import CSV"* dan pilih file CSV | Transaksi baru masuk ke tabel dan saldo akun terkait disesuaikan. |
| **Ganti Tema** | 1. Klik ikon matahari/bulan di sudut kanan atas | Tampilan seketika berpindah mulus antara tema gelap dan terang. |

---

## 💡 Asumsi & Keputusan Desain

1. **Database Default**: SQLite digunakan secara *default* agar dapat langsung dijalankan secara lokal tanpa konfigurasi Docker atau database server terpisah. Skema dirancang 100% kompatibel untuk beralih ke PostgreSQL cukup dengan mengubah konfigurasi `datasource` dan `DATABASE_URL`.
2. **Keamanan Data**: Setiap kueri pada seluruh API route menyertakan filter ketat `where: { userId: session.user.id }` untuk menjamin isolasi data pengguna secara absolut.
3. **Penyimpanan Nilai Uang**: Nilai mata uang disimpan dalam tipe numerik float murni tanpa desimal pecahan untuk Rupiah, sehingga kalkulasi agregasi `SUM`, `MIN`, `MAX` di Prisma berjalan sangat cepat dan akurat.
4. **PWA Standalone**: Manifest PWA disertakan agar aplikasi dapat dipasang (*Add to Home Screen*) di Android / iOS / Desktop dan terasa seperti aplikasi native.
