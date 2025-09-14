# Aplikasi Pencatat Keuangan

Aplikasi sederhana untuk mencatat pengeluaran menggunakan Next.js dan Supabase.

## Fitur

### 💰 Manajemen Pengeluaran
- ✅ Input pengeluaran tunggal (divisi, jumlah, keterangan, kategori)
- ✅ Input pengeluaran multiple/bulk dengan grouping
- ✅ Tampilkan daftar pengeluaran dengan grouping berdasarkan batch
- ✅ Hitung total pengeluaran per batch dan keseluruhan
- ✅ Tracking pengeluaran dengan batch_id untuk grouping

### 🏢 Manajemen Divisi
- ✅ CRUD divisi (Create, Read, Update, Delete)
- ✅ Validasi divisi yang sedang digunakan
- ✅ Kategorisasi pengeluaran berdasarkan divisi

### 🎨 User Interface
- ✅ Layout modern dengan header dan sidebar
- ✅ Responsive design untuk mobile dan desktop
- ✅ Navigasi yang mudah digunakan
- ✅ UI components dengan shadcn/ui
- ✅ Mobile sidebar dengan overlay

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Jalankan SQL script dari file `supabase-schema.sql` di SQL Editor Supabase
3. Dapatkan URL dan Service Role Key dari Settings > API

### 3. Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Database

### Tabel `expenses`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| amount | DECIMAL(12,2) | Jumlah pengeluaran |
| description | TEXT | Keterangan pengeluaran |
| category | VARCHAR(100) | Kategori pengeluaran |
| created_at | TIMESTAMP | Waktu dibuat |

## Teknologi

- **Frontend**: Next.js 14 with App Router
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: None (menggunakan Service Role Key)
- **RLS**: Disabled (untuk kesederhanaan)

## Catatan Keamanan

⚠️ **Peringatan**: Aplikasi ini menggunakan Service Role Key dan tidak menggunakan RLS policy untuk kesederhanaan. Jangan gunakan di production tanpa implementasi keamanan yang proper.