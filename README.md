# Dokumentasi Aplikasi Resep NestJS

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 📋 Daftar Isi

- [Deskripsi Proyek](#deskripsi-proyek)
- [Prasyarat Sistem](#prasyarat-sistem)
- [Setup Awal](#setup-awal)
- [Setup Database](#setup-database)
- [Setup Database User & Permission](#setup-database-user--permission-detail)
- [Penanganan Error & Troubleshooting](#%EF%B8%8F-penanganan-error--troubleshooting)
- [Struktur Proyek](#struktur-proyek)
- [Dokumentasi Arsitektur](#dokumentasi-arsitektur)
- [Menjalankan Aplikasi](#%E2%96%B6%EF%B8%8F-menjalankan-aplikasi)
- [Testing](#testing)
- [Panduan Deployment](#panduan-deployment)

---

## 🎯 Deskripsi Proyek

Aplikasi ini adalah sistem manajemen resep yang dibangun menggunakan **NestJS** dan **TypeScript**. Aplikasi menyediakan fitur lengkap untuk:

- **Manajemen Pengguna**: Registrasi, login, dan manajemen profil
- **Autentikasi**: JWT dan OAuth 2.0 (Google)
- **Manajemen Resep**: CRUD resep dengan gambar dan bahan-bahan
- **Favorit**: Simpan resep favorit
- **Review**: Berikan rating dan komentar pada resep
- **Upload File**: Manajemen avatar dan gambar resep

**Stack Teknologi**:

- Node.js + TypeScript
- NestJS Framework
- Prisma ORM
- MySQL Database
- JWT Authentication
- Multer (File Upload)
- Sharp (Image Processing)

---

## 💻 Prasyarat Sistem

Sebelum memulai, pastikan Anda memiliki:

1. **Node.js** v18 atau lebih tinggi
   - Download dari: https://nodejs.org/

2. **npm** v9 atau lebih tinggi (biasanya menyertai Node.js)
   - Verifikasi: `npm --version`

3. **MySQL Server** v8.0 atau lebih tinggi
   - Download dari: https://www.mysql.com/downloads/
   - Atau gunakan **MySQL Community Edition** (gratis)

4. **Git** (opsional untuk version control)

5. **Text Editor/IDE** seperti:
   - Visual Studio Code
   - IntelliJ IDEA
   - Sublime Text

---

## 🚀 Setup Awal

### Langkah 1: Clone atau Download Proyek

```bash
# Jika menggunakan git
git clone <repository-url>
cd nest-app

# Atau jika download langsung
cd nest-app
```

### Langkah 2: Install Dependencies

```bash
npm install
```

Perintah ini akan menginstall semua package yang diperlukan sesuai file `package.json`.

### Langkah 3: Konfigurasi Environment Variables

Buat file `.env` di root folder proyek:

```bash
# Linux/Mac
touch .env

# Windows (PowerShell)
New-Item -ItemType File -Name ".env"
```

**Isi file `.env`:**

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/nama_database"

# JWT
JWT_SECRET="your-secret-key-here-change-this-in-production"
JWT_EXPIRATION="24h"

# Google OAuth (opsional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Server
PORT=3000
NODE_ENV="development"
```

**Penjelasan Variabel:**

- `DATABASE_URL`: Connection string ke database MySQL dengan format `mysql://user:password@host:port/database`
- `JWT_SECRET`: Kunci rahasia untuk signing JWT tokens (ganti dengan string random yang kuat)
- `JWT_EXPIRATION`: Durasi token JWT berlaku (24 jam)
- `GOOGLE_CLIENT_ID/SECRET`: Kredensial Google OAuth (jika menggunakan Google login)
- `PORT`: Port tempat server berjalan (default 3000)
- `NODE_ENV`: Environment (development/production)

---

## 🗄️ Setup Database

### Langkah 1: Membuat Database di MySQL

Buka MySQL Command Line Client atau MySQL Workbench:

#### **Opsi A: Tanpa User Khusus (Quick Setup)**

```sql
-- Membuat database baru dengan charset UTF-8
CREATE DATABASE nama_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Menggunakan database yang baru dibuat
USE nama_database;

-- Verifikasi database terbuat
SHOW DATABASES;
```

Gunakan user `root` (default MySQL) dengan password di `.env`:

```env
DATABASE_URL="mysql://root:password-root@localhost:3306/nama_database"
```

#### **Opsi B: Dengan User Khusus (Recommended untuk Production)**

```sql
-- Membuat database baru
CREATE DATABASE nama_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Membuat user khusus aplikasi
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password_here_minimal_8_char';

-- Memberikan permission dasar (CRUD operations)
GRANT SELECT, INSERT, UPDATE, DELETE ON nama_database.* TO 'app_user'@'localhost';

-- Jika perlu schema modifications (untuk migration)
GRANT ALTER, CREATE, DROP, INDEX ON nama_database.* TO 'app_user'@'localhost';

-- Update permission cache
FLUSH PRIVILEGES;

-- Verifikasi permissions
SHOW GRANTS FOR 'app_user'@'localhost';

-- Test koneksi (login dengan user baru)
mysql -u app_user -p -h localhost
```

Update `.env` dengan kredensial baru:

```env
DATABASE_URL="mysql://app_user:strong_password_here_minimal_8_char@localhost:3306/nama_database"
```

### Permission Explanation (Penjelasan Hak Akses)

| Permission       | Fungsi                   | Kebutuhan               |
| ---------------- | ------------------------ | ----------------------- |
| `SELECT`         | Membaca data             | ✅ Wajib                |
| `INSERT`         | Menambah data baru       | ✅ Wajib                |
| `UPDATE`         | Mengubah data            | ✅ Wajib                |
| `DELETE`         | Menghapus data           | ✅ Wajib                |
| `ALTER`          | Mengubah struktur tabel  | ⚠️ Hanya saat migration |
| `CREATE`         | Membuat tabel baru       | ⚠️ Hanya saat migration |
| `DROP`           | Menghapus tabel          | ⚠️ Hanya development    |
| `INDEX`          | Membuat index (performa) | ⚠️ Saat optimization    |
| `ALL PRIVILEGES` | Semua permission         | ❌ Jangan di production |

### Langkah 2: Migrasi Database dengan Prisma

Setelah MySQL setup, jalankan migrasi Prisma:

```bash
# Menjalankan semua migration ke database
npx prisma migrate deploy

# Atau jika pertama kali setup development (dengan interactive prompt)
npx prisma migrate dev --name init
```

Perintah ini akan:

1. ✅ Membaca semua file migration di `prisma/migrations/`
2. ✅ Membuat semua tabel sesuai `prisma/schema.prisma`
3. ✅ Generate Prisma Client (dependency dalam aplikasi)
4. ✅ Menjalankan seed script jika ada di `prisma/seed.ts`

**Verifikasi Migrasi:**

```bash
# Melihat status migrasi
npx prisma migrate status

# Membuka Prisma Studio (UI untuk melihat data)
npx prisma studio
```

Buka http://localhost:5555 untuk melihat data secara visual.

### Langkah 3: Reset Database (Jika Diperlukan)

Gunakan hanya saat development:

```bash
# ⚠️ HATI-HATI: Ini akan menghapus semua data!
npx prisma migrate reset

# Akan meminta konfirmasi, ketik 'y' untuk lanjut
```

### Langkah 4: Membuat Folder Upload

Buat folder untuk menyimpan file yang di-upload pengguna:

```bash
# Linux/Mac
mkdir -p uploads/avatars
mkdir -p uploads/recipes

# Windows (PowerShell)
New-Item -ItemType Directory -Path "uploads/avatars" -Force
New-Item -ItemType Directory -Path "uploads/recipes" -Force
```

Tambahkan `.gitignore` untuk folder ini (jangan commit file upload):

```
uploads/
```

---

## � Setup Database User & Permission Detail

### A. Setup Database User (Pembuatan User Database)

#### **1. Login ke MySQL sebagai Root**

```bash
# Windows Command Prompt atau PowerShell
mysql -u root -p

# Linux/Mac
mysql -u root -p
```

Masukkan password root MySQL Anda saat diminta.

#### **2. Membuat Database**

```sql
-- Membuat database baru dengan karakter set UTF-8 (support emoji, bahasa Indonesia, dll)
CREATE DATABASE resep_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verifikasi database terbuat
SHOW DATABASES;

-- Output yang diharapkan:
-- +--------------------+
-- | Database           |
-- +--------------------+
-- | information_schema |
-- | mysql              |
-- | performance_schema |
-- | resep_db           | <-- Database baru kami
-- +--------------------+
```

#### **3. Membuat User Database untuk Development**

```sql
-- Membuat user dengan password
CREATE USER 'dev_user'@'localhost' IDENTIFIED BY 'dev_password_123';

-- Verifikasi user terbuat
SELECT User, Host FROM mysql.user WHERE User='dev_user';

-- Output:
-- +----------+-----------+
-- | User     | Host      |
-- +----------+-----------+
-- | dev_user | localhost |
-- +----------+-----------+
```

#### **4. Membuat User Database untuk Production**

```sql
-- Membuat user production dengan password kuat
CREATE USER 'prod_user'@'localhost' IDENTIFIED BY 'Str0ng_Pr0d_P@ssw0rd_2025!';

-- Verifikasi user terbuat
SELECT User, Host FROM mysql.user WHERE User='prod_user';
```

#### **5. Membuat User Database untuk Backup**

```sql
-- User khusus untuk backup (read-only permission)
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'backup_password_secure_123';

-- Verifikasi user terbuat
SELECT User, Host FROM mysql.user WHERE User='backup_user';
```

---

### B. Memberikan Grant Permission (Hak Akses)

#### **1. Grant Permission untuk Development User**

```sql
-- Memberikan permission CRUD (Create, Read, Update, Delete)
GRANT SELECT, INSERT, UPDATE, DELETE ON resep_db.* TO 'dev_user'@'localhost';

-- Memberikan permission untuk migration (ALTER, CREATE, DROP)
-- Hanya saat development, gunakan saat ngubah schema
GRANT ALTER, CREATE, DROP, INDEX ON resep_db.* TO 'dev_user'@'localhost';

-- Memberikan permission untuk trigger dan stored procedures (opsional)
GRANT CREATE ROUTINE, ALTER ROUTINE ON resep_db.* TO 'dev_user'@'localhost';

-- Update permission cache (WAJIB setelah grant)
FLUSH PRIVILEGES;

-- Verifikasi permission dev_user
SHOW GRANTS FOR 'dev_user'@'localhost';

-- Output yang diharapkan:
-- +-----------------------------------------------------+
-- | Grants for dev_user@localhost                      |
-- +-----------------------------------------------------+
-- | GRANT USAGE ON *.* TO 'dev_user'@'localhost'      |
-- | GRANT SELECT, INSERT, UPDATE, DELETE, ALTER, ...  |
-- |   ON `resep_db`.* TO 'dev_user'@'localhost'       |
-- +-----------------------------------------------------+
```

#### **2. Grant Permission untuk Production User (Minimal Privilege)**

```sql
-- Memberikan HANYA permission CRUD (production tidak butuh ALTER/DROP)
GRANT SELECT, INSERT, UPDATE, DELETE ON resep_db.* TO 'prod_user'@'localhost';

-- Jika perlu migration di production, buat user terpisah
CREATE USER 'migration_user'@'localhost' IDENTIFIED BY 'Migration_User_Pass_2025!';
GRANT ALTER, CREATE, INDEX ON resep_db.* TO 'migration_user'@'localhost';

-- Update permission cache
FLUSH PRIVILEGES;

-- Verifikasi permission prod_user
SHOW GRANTS FOR 'prod_user'@'localhost';

-- Output:
-- +-----------------------------------------------------+
-- | Grants for prod_user@localhost                     |
-- +-----------------------------------------------------+
-- | GRANT USAGE ON *.* TO 'prod_user'@'localhost'    |
-- | GRANT SELECT, INSERT, UPDATE, DELETE              |
-- |   ON `resep_db`.* TO 'prod_user'@'localhost'      |
-- +-----------------------------------------------------+
```

#### **3. Grant Permission untuk Backup User (Read-Only)**

```sql
-- Memberikan HANYA permission SELECT (backup hanya baca, tidak bisa ubah/hapus)
GRANT SELECT ON resep_db.* TO 'backup_user'@'localhost';

-- Permission untuk menggunakan mysqldump
GRANT LOCK TABLES ON resep_db.* TO 'backup_user'@'localhost';

-- Update permission cache
FLUSH PRIVILEGES;

-- Verifikasi permission backup_user
SHOW GRANTS FOR 'backup_user'@'localhost';

-- Output:
-- +--------------------------------------------------+
-- | Grants for backup_user@localhost               |
-- +--------------------------------------------------+
-- | GRANT USAGE ON *.* TO 'backup_user'@localhost |
-- | GRANT SELECT, LOCK TABLES ON `resep_db`.*     |
-- +--------------------------------------------------+
```

#### **4. Grant Permission - Penjelasan Lengkap**

| Permission       | Fungsi                    | Siapa Gunakan       | SQL                                          |
| ---------------- | ------------------------- | ------------------- | -------------------------------------------- |
| `SELECT`         | Membaca data dari tabel   | Semua user          | `GRANT SELECT ON db.* TO user@host;`         |
| `INSERT`         | Menambah data ke tabel    | Dev, Prod           | `GRANT INSERT ON db.* TO user@host;`         |
| `UPDATE`         | Mengubah data di tabel    | Dev, Prod           | `GRANT UPDATE ON db.* TO user@host;`         |
| `DELETE`         | Menghapus data dari tabel | Dev, Prod           | `GRANT DELETE ON db.* TO user@host;`         |
| `ALTER`          | Mengubah struktur tabel   | Migration, Dev only | `GRANT ALTER ON db.* TO user@host;`          |
| `CREATE`         | Membuat tabel baru        | Migration, Dev only | `GRANT CREATE ON db.* TO user@host;`         |
| `DROP`           | Menghapus tabel           | Dev only ⚠️         | `GRANT DROP ON db.* TO user@host;`           |
| `INDEX`          | Membuat index (optimasi)  | Dev, Migration      | `GRANT INDEX ON db.* TO user@host;`          |
| `LOCK TABLES`    | Lock table saat backup    | Backup user         | `GRANT LOCK TABLES ON db.* TO user@host;`    |
| `CREATE ROUTINE` | Membuat stored procedure  | Dev optional        | `GRANT CREATE ROUTINE ON db.* TO user@host;` |

#### **5. Test Koneksi dengan User Baru**

```bash
# Test dev_user
mysql -u dev_user -p -h localhost resep_db

# Masukkan password: dev_password_123
# Jika berhasil akan masuk ke MySQL CLI

# Test query
SHOW TABLES;
```

---

### C. Mencabut Permission (REVOKE)

#### **1. Mencabut Permission Spesifik**

```sql
-- Mencabut permission ALTER dari dev_user (tapi SELECT, INSERT, UPDATE, DELETE tetap)
REVOKE ALTER ON resep_db.* FROM 'dev_user'@'localhost';

-- Mencabut permission DROP
REVOKE DROP ON resep_db.* FROM 'dev_user'@'localhost';

-- Update cache
FLUSH PRIVILEGES;

-- Verifikasi
SHOW GRANTS FOR 'dev_user'@'localhost';
```

#### **2. Mencabut Semua Permission (Jika User Tidak Perlu)**

```sql
-- Mencabut SEMUA permission
REVOKE ALL PRIVILEGES ON resep_db.* FROM 'dev_user'@'localhost';

-- Update cache
FLUSH PRIVILEGES;

-- Verifikasi
SHOW GRANTS FOR 'dev_user'@'localhost';
```

#### **3. Menghapus User**

```sql
-- Hapus user sekaligus dengan semua permission-nya
DROP USER 'dev_user'@'localhost';

-- Verifikasi user sudah dihapus
SELECT User, Host FROM mysql.user WHERE User='dev_user';

-- Output kosong berarti user sudah dihapus
```

---

### D. Scenario Praktis Setup User

#### **Scenario 1: Development Environment (Solo Developer)**

```sql
-- Login sebagai root
mysql -u root -p

-- 1. Buat database
CREATE DATABASE resep_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Buat user
CREATE USER 'resep_dev'@'localhost' IDENTIFIED BY 'dev_pass_123_changeme';

-- 3. Grant permission lengkap (karena development)
GRANT ALL PRIVILEGES ON resep_dev.* TO 'resep_dev'@'localhost';
FLUSH PRIVILEGES;

-- 4. Test koneksi
-- Keluar dari MySQL CLI dulu (ketik: exit)
-- Kemudian login dengan user baru
mysql -u resep_dev -p -h localhost resep_dev
-- Masukkan password: dev_pass_123_changeme
```

Update `.env`:

```env
DATABASE_URL="mysql://resep_dev:dev_pass_123_changeme@localhost:3306/resep_dev"
```

#### **Scenario 2: Production Environment (Best Practice)**

```sql
-- Login sebagai root
mysql -u root -p

-- 1. Buat database
CREATE DATABASE resep_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Buat user untuk aplikasi (minimal privilege)
CREATE USER 'app_prod'@'localhost' IDENTIFIED BY 'Str0ng_App_P@ss_2025!';

-- 3. Grant HANYA CRUD permission
GRANT SELECT, INSERT, UPDATE, DELETE ON resep_prod.* TO 'app_prod'@'localhost';

-- 4. Buat user terpisah untuk migration (hanya saat deploy)
CREATE USER 'migration_prod'@'localhost' IDENTIFIED BY 'Migration_P@ss_2025!';
GRANT ALTER, CREATE, DROP, INDEX ON resep_prod.* TO 'migration_prod'@'localhost';

-- 5. Buat user backup (read-only)
CREATE USER 'backup_prod'@'localhost' IDENTIFIED BY 'Backup_P@ss_2025!';
GRANT SELECT, LOCK TABLES ON resep_prod.* TO 'backup_prod'@'localhost';

-- 6. Update cache dan verifikasi
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'app_prod'@'localhost';
SHOW GRANTS FOR 'migration_prod'@'localhost';
SHOW GRANTS FOR 'backup_prod'@'localhost';
```

Update `.env` production:

```env
# User aplikasi (production)
DATABASE_URL="mysql://app_prod:Str0ng_App_P@ss_2025!@localhost:3306/resep_prod"

# User migration (hanya saat deploy migration)
# DATABASE_MIGRATION_URL="mysql://migration_prod:Migration_P@ss_2025!@localhost:3306/resep_prod"

# User backup (hanya saat backup)
# DATABASE_BACKUP_USER="backup_prod"
# DATABASE_BACKUP_PASS="Backup_P@ss_2025!"
```

#### **Scenario 3: Team Development (Multiple Developers)**

```sql
-- Login sebagai root
mysql -u root -p

-- 1. Buat database
CREATE DATABASE resep_team CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Buat user untuk setiap developer
CREATE USER 'dev_hari'@'localhost' IDENTIFIED BY 'Hari_Dev_Pass_2025!';
CREATE USER 'dev_agus'@'localhost' IDENTIFIED BY 'Agus_Dev_Pass_2025!';
CREATE USER 'dev_budi'@'localhost' IDENTIFIED BY 'Budi_Dev_Pass_2025!';

-- 3. Grant permission yang sama untuk semua
GRANT ALL PRIVILEGES ON resep_team.* TO 'dev_hari'@'localhost';
GRANT ALL PRIVILEGES ON resep_team.* TO 'dev_agus'@'localhost';
GRANT ALL PRIVILEGES ON resep_team.* TO 'dev_budi'@'localhost';

-- 4. Update cache
FLUSH PRIVILEGES;

-- 5. Verifikasi
SELECT User, Host FROM mysql.user WHERE User LIKE 'dev_%';
```

---

## ⚠️ Penanganan Error & Troubleshooting

### 1. Error Database Connection

#### **Error: "Access denied for user 'app_user'@'localhost' (using password: YES)"**

**Penyebab:**

- Password salah di `.env`
- User belum di-create
- Permission tidak diberikan

**Solusi:**

```bash
# 1. Verifikasi user ada dan password benar
# Login sebagai root
mysql -u root -p

# Cek list user
SELECT User, Host FROM mysql.user WHERE User='app_user';

# Cek grant permission
SHOW GRANTS FOR 'app_user'@'localhost';

# 2. Jika user tidak ada, buat ulang
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'correct_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON database_name.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;

# 3. Test koneksi dengan user baru
mysql -u app_user -p -h localhost
# Masukkan password yang benar

# 4. Update .env dengan password yang benar
```

#### **Error: "Can't connect to MySQL server on 'localhost' (10061)"**

**Penyebab:**

- MySQL server tidak running
- Port 3306 tidak accessible
- Firewall mengblock koneksi

**Solusi - Windows:**

```powershell
# 1. Cek apakah MySQL service berjalan
Get-Service -Name MySQL80  # atau nama service MySQL Anda

# 2. Jika belum berjalan, start service
Start-Service -Name MySQL80

# 3. Cek port 3306
netstat -ano | findstr :3306

# 4. Jika tetap error, restart MySQL
Restart-Service -Name MySQL80

# 5. Test koneksi
mysql -u root -p
```

**Solusi - Linux:**

```bash
# 1. Cek status MySQL
sudo systemctl status mysql

# 2. Start MySQL jika belum berjalan
sudo systemctl start mysql

# 3. Cek port 3306
sudo netstat -tulpn | grep 3306

# 4. Jika perlu restart
sudo systemctl restart mysql

# 5. Test koneksi
mysql -u root -p
```

#### **Error: "Unknown database 'nama_database'"**

**Penyebab:**

- Database belum di-create
- Nama database di `.env` salah
- User tidak punya permission akses database

**Solusi:**

```bash
# 1. Login ke MySQL
mysql -u root -p

# 2. Verifikasi database ada
SHOW DATABASES;

# 3. Jika tidak ada, buat
CREATE DATABASE nama_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 4. Grant permission ke user
GRANT ALL PRIVILEGES ON nama_database.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;

# 5. Verifikasi permission
SHOW GRANTS FOR 'app_user'@'localhost';

# 6. Update .env dengan nama database yang benar
```

---

### 2. Error Migration

#### **Error: "Prisma Migrate: Access Denied for 'ALTER' command"**

**Penyebab:**

- User tidak punya permission ALTER/CREATE/DROP
- Permission belum di-grant

**Solusi:**

```sql
-- Login sebagai root
mysql -u root -p

-- Berikan permission migration ke user
GRANT ALTER, CREATE, DROP, INDEX ON nama_database.* TO 'app_user'@'localhost';

-- Update cache
FLUSH PRIVILEGES;

-- Verifikasi
SHOW GRANTS FOR 'app_user'@'localhost';
```

Kemudian jalankan migration lagi:

```bash
npx prisma migrate dev --name init
```

#### **Error: "Prisma: Migration conflict or drift detected"**

**Penyebab:**

- Database sudah ada struktur tabel
- Migration history tidak match
- Schema di database berbeda dengan schema.prisma

**Solusi:**

```bash
# 1. Check status migration
npx prisma migrate status

# 2. Jika ada drift, reset (HANYA di development!)
npx prisma migrate reset
# Ketik 'y' saat diminta konfirmasi

# 3. Atau jika ingin resolve drift
npx prisma migrate resolve --rolled-back <migration_name>

# 4. Jalankan migration lagi
npx prisma migrate dev --name init
```

#### **Error: "Relation doesn't exist" saat query**

**Penyebab:**

- Tabel belum di-create
- Migration tidak ter-execute dengan baik
- Prisma Client belum di-generate

**Solusi:**

```bash
# 1. Regenerate Prisma Client
npx prisma generate

# 2. Check migration status
npx prisma migrate status

# 3. Deploy migration
npx prisma migrate deploy

# 4. Buka Prisma Studio untuk verifikasi
npx prisma studio
```

---

### 3. Error Permission

#### **Error: "User has insufficient privileges"**

**Penyebab:**

- User tidak punya permission untuk operasi tertentu
- Permission-nya di-revoke
- User baru dibuat tapi FLUSH PRIVILEGES belum dijalankan

**Solusi:**

```sql
-- Login sebagai root
mysql -u root -p

-- Cek permission user saat ini
SHOW GRANTS FOR 'app_user'@'localhost';

-- Jika kurang permission, grant
GRANT ALTER, CREATE ON database_name.* TO 'app_user'@'localhost';

-- WAJIB update cache
FLUSH PRIVILEGES;

-- Verifikasi lagi
SHOW GRANTS FOR 'app_user'@'localhost';
```

---

### 4. Error Authentication

#### **Error: "ECONNREFUSED 127.0.0.1:3306" (Connection Refused)**

**Penyebab:**

- MySQL belum start
- Port 3306 blocked
- DATABASE_URL format salah

**Solusi:**

```bash
# 1. Verifikasi format DATABASE_URL di .env
# Format benar:
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# 2. Start MySQL service
# Windows:
net start MySQL80

# Linux:
sudo systemctl start mysql

# 3. Test koneksi manual
mysql -u root -p -h localhost

# 4. Jika tetap error, check port
netstat -ano | findstr :3306

# 5. Update .env dengan format yang benar
```

#### **Error: "ER_NOT_SUPPORTED_AUTH_PLUGIN"**

**Penyebab:**

- MySQL menggunakan auth plugin yang tidak didukung
- Biasanya MySQL 8.0+ menggunakan `caching_sha2_password`

**Solusi:**

```sql
-- Login sebagai root
mysql -u root -p

-- Ubah auth plugin user ke mysql_native_password
ALTER USER 'app_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';

-- Update cache
FLUSH PRIVILEGES;

-- Verifikasi
SHOW GRANTS FOR 'app_user'@'localhost';
```

---

### 5. Error Prisma Studio

#### **Error: "Cannot start Prisma Studio - Port 5555 already in use"**

**Penyebab:**

- Prisma Studio sudah berjalan di port 5555
- Ada aplikasi lain menggunakan port 5555

**Solusi:**

```bash
# 1. Gunakan port berbeda
npx prisma studio -p 5556

# 2. Atau kill proses yang menggunakan port 5555
# Windows:
netstat -ano | findstr :5555
taskkill /PID <PID> /F

# Linux:
lsof -i :5555
kill -9 <PID>

# 3. Jalankan Prisma Studio lagi
npx prisma studio
```

---

### 6. Error Data & Query

#### **Error: "Unique constraint failed on the fields: email"**

**Penyebab:**

- Email sudah terdaftar di database
- Constraint `@unique` melindungi duplicate data

**Solusi:**

```typescript
// Di service, cek email sudah ada sebelum create
async create(createUserDto: CreateUserDto) {
  const existingUser = await this.prisma.user.findUnique({
    where: { email: createUserDto.email },
  });

  if (existingUser) {
    throw new BadRequestException('Email sudah terdaftar');
  }

  return this.prisma.user.create({
    data: createUserDto,
  });
}
```

Atau di database, cek data:

```sql
-- Check email yang sudah ada
SELECT id, email, name FROM users WHERE email = 'email@example.com';

-- Jika ingin hapus (production harus hati-hati!)
DELETE FROM users WHERE email = 'email@example.com';
```

#### **Error: "Foreign key constraint fails"**

**Penyebab:**

- Mencoba akses/hapus parent record yang memiliki child
- Foreign key tidak ada di tabel

**Solusi:**

```typescript
// Cek ada child records sebelum delete parent
async deleteUser(id: number) {
  // Cek apakah user punya recipes
  const userWithRecipes = await this.prisma.user.findUnique({
    where: { id },
    include: { recipes: true },
  });

  if (userWithRecipes?.recipes.length > 0) {
    throw new BadRequestException(
      'Tidak bisa hapus user yang masih punya recipes'
    );
  }

  return this.prisma.user.delete({
    where: { id },
  });
}
```

---

### 7. Error File Upload

#### **Error: "ENOENT: no such file or directory 'uploads/avatars'"**

**Penyebab:**

- Folder uploads belum di-create

**Solusi:**

```bash
# Buat folder uploads
# Windows (PowerShell):
New-Item -ItemType Directory -Path "uploads/avatars" -Force
New-Item -ItemType Directory -Path "uploads/recipes" -Force

# Linux/Mac:
mkdir -p uploads/avatars
mkdir -p uploads/recipes

# Verifikasi folder ada
dir uploads   # Windows
ls uploads    # Linux/Mac
```

#### **Error: "File too large"**

**Penyebab:**

- File upload terlalu besar
- Limit file size di config multer terlalu kecil

**Solusi:**

Di `config/multer.config.ts`:

```typescript
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and GIF are allowed'));
    }
  },
};
```

---

## 📋 Checklist Setup Lengkap

Gunakan checklist ini untuk memastikan semua setup sudah benar:

### Database Setup

- [ ] MySQL Server sudah installed dan running
- [ ] Database `resep_db` sudah di-create
- [ ] User database sudah di-create (dev_user, app_user, etc)
- [ ] Grant permission sudah diberikan dan FLUSH PRIVILEGES sudah dijalankan
- [ ] Test koneksi dengan user baru berhasil
- [ ] `.env` sudah di-create dengan DATABASE_URL yang benar

### Prisma Setup

- [ ] `npm install` sudah dijalankan
- [ ] `npx prisma migrate dev --name init` berhasil
- [ ] Semua tabel sudah ter-create di database
- [ ] `npx prisma studio` bisa diakses (lihat data via UI)

### Application Setup

- [ ] `.env` lengkap dengan semua variabel yang diperlukan
- [ ] `npm run build` berhasil (tidak ada error)
- [ ] `npm run start:dev` berjalan tanpa error
- [ ] API bisa diakses di `http://localhost:3000`
- [ ] Folder `uploads/avatars` dan `uploads/recipes` sudah di-create

### Security

- [ ] Password database BUKAN password default
- [ ] JWT_SECRET sudah di-generate (random string panjang)
- [ ] File `.env` sudah di-add ke `.gitignore` (jangan commit ke git)
- [ ] Permission user database minimal (tidak ALL PRIVILEGES di production)

---

## �📁 Struktur Proyek

```
nest-app/
├── src/                          # Source code utama aplikasi
│   ├── main.ts                   # Entry point - start aplikasi di sini
│   ├── app.module.ts             # Root module - import semua feature module
│   ├── app.controller.ts         # Root controller - route basic
│   ├── app.service.ts            # Root service - business logic basic
│   │
│   ├── auth/                     # 🔐 Authentication module
│   │   ├── auth.module.ts        # Module definition - export AuthService
│   │   ├── auth.service.ts       # Business logic: signup, login, JWT verify
│   │   ├── auth.controller.ts    # Routes: /auth/signup, /auth/login, etc
│   │   ├── guards/               # JWT & Role permission guards
│   │   │   └── jwt-auth.guard.ts # Guard untuk protected routes
│   │   ├── strategies/           # Passport authentication strategies
│   │   │   ├── jwt.strategy.ts   # JWT token parsing & validation
│   │   │   └── google.strategy.ts# Google OAuth strategy
│   │   └── decorators/           # Custom decorators
│   │       └── current-user.decorator.ts # @CurrentUser() helper
│   │
│   ├── users/                    # 👤 User management module
│   │   ├── users.module.ts       # Module definition
│   │   ├── users.service.ts      # CRUD: create, read, update, delete user
│   │   ├── users.controller.ts   # Routes: GET/POST/PATCH/DELETE /users
│   │   └── dto/                  # Data Transfer Objects (validation)
│   │       ├── create-user.dto.ts    # Validasi saat membuat user
│   │       └── update-user.dto.ts    # Validasi saat update user
│   │
│   ├── recipes/                  # 🍳 Recipe management module
│   │   ├── recipes.module.ts     # Module definition
│   │   ├── recipes.service.ts    # CRUD recipes, handle image upload
│   │   ├── recipes.controller.ts # Routes: GET/POST/PATCH/DELETE /recipes
│   │   ├── dto/
│   │   │   ├── create-recipe.dto.ts
│   │   │   └── update-recipe.dto.ts
│   │   └── entities/
│   │       └── recipe.entity.ts  # Recipe response structure
│   │
│   ├── ingredients/              # 🥘 Ingredient module
│   │   ├── ingredients.module.ts
│   │   ├── ingredients.service.ts
│   │   ├── ingredients.controller.ts
│   │   └── dto/
│   │
│   ├── favorites/                # ⭐ Favorite recipes module
│   │   ├── favorites.module.ts
│   │   ├── favorites.service.ts
│   │   └── favorites.controller.ts
│   │
│   ├── reviews/                  # ⭐ Review/Rating module
│   │   ├── reviews.module.ts
│   │   ├── reviews.service.ts
│   │   ├── reviews.controller.ts
│   │   └── dto/
│   │
│   ├── prisma/                   # 🗄️ Database ORM setup
│   │   ├── prisma.module.ts      # Provide PrismaService globally
│   │   └── prisma.service.ts     # Wrapper untuk Prisma Client
│   │
│   ├── common/                   # 🔧 Shared utilities & helpers
│   │   ├── filters/              # Exception filters - error handling
│   │   ├── interceptors/         # Response interceptors - format response
│   │   ├── pipes/                # Validation pipes
│   │   └── service/              # Shared business logic
│   │
│   └── config/                   # ⚙️ Configuration files
│       └── multer.config.ts      # File upload configuration
│
├── prisma/                       # 🗄️ Database configuration & migrations
│   ├── schema.prisma             # Database schema definition
│   │                             # Define models (tables) & relationships
│   └── migrations/               # Migration history (auto-generated)
│       ├── migration_lock.toml   # Lock file (jangan edit)
│       └── 20251027004323_xxx/   # Folder untuk setiap migration
│           └── migration.sql     # SQL files yang dijalankan
│
├── test/                         # 🧪 Testing files
│   ├── app.e2e-spec.ts          # End-to-end tests
│   └── jest-e2e.json            # Jest config untuk E2E
│
├── scripts/                      # 🛠️ Helper scripts
│   ├── seed.ts                   # Database seeding (insert sample data)
│   └── migrate-recipe-data.ts    # Data migration helpers
│
├── uploads/                      # 📁 File storage (gitignore)
│   ├── avatars/                  # User profile pictures
│   └── recipes/                  # Recipe images
│
├── generated/                    # 🔄 Auto-generated Prisma files
│   └── prisma/                   # Prisma Client (jangan edit)
│
├── .env                          # 🔒 Environment variables (gitignore)
├── .env.example                  # 📋 Template untuk .env
├── .gitignore                    # Files to ignore dalam git
├── package.json                  # NPM dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── tsconfig.build.json           # TypeScript build config
├── jest.config.js                # Testing configuration
├── nest-cli.json                 # NestJS CLI configuration
├── eslint.config.mjs             # Code linting rules
└── README.md                     # 📖 Dokumentasi ini
```

---

## 🏗️ Dokumentasi Arsitektur

### 1. Module Pattern (Pola Modularisasi)

Setiap fitur terorganisir dalam sebuah **Module** yang terdiri dari 3 komponen utama:

```typescript
// Contoh: users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // ✅ Import dependencies
  controllers: [UsersController], // ✅ Route handlers
  providers: [UsersService], // ✅ Business logic (Services, Guards, etc)
  exports: [UsersService], // ✅ Export untuk digunakan modul lain
})
export class UsersModule {}
```

**Penjelasan:**

- **imports**: Module yang digunakan (dependencies injection)
- **controllers**: Menangani HTTP requests
- **providers**: Services dan dependency yang disediakan
- **exports**: Apa yang bisa diakses oleh module lain

### 2. Controller Pattern (Pola Controller)

Controller menangani HTTP requests dan memanggil service untuk business logic.

```typescript
// Contoh: users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users') // Base route: /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/:id
  // Public route
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findOne(parseInt(id));
  }

  // POST /users
  // Public route
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // GET /users/profile
  // Protected route (require JWT token)
  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  // PATCH /users/:id
  // Update user data
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(parseInt(id), updateUserDto);
  }

  // DELETE /users/:id
  // Delete user account
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: string) {
    return this.usersService.remove(parseInt(id));
  }
}
```

**HTTP Method Decorators:**
| Decorator | HTTP Method | Fungsi |
|-----------|-------------|--------|
| `@Get()` | GET | Membaca data |
| `@Post()` | POST | Membuat data baru |
| `@Put()` | PUT | Update seluruh resource |
| `@Patch()` | PATCH | Update sebagian resource |
| `@Delete()` | DELETE | Menghapus data |

**Decorator Penting:**
| Decorator | Fungsi | Contoh |
|-----------|--------|---------|
| `@Param('id')` | Ambil dari URL path | `/users/123` → id = '123' |
| `@Query('page')` | Ambil dari query string | `/users?page=1` → page = '1' |
| `@Body()` | Ambil dari request body | POST data |
| `@Headers('authorization')` | Ambil header | JWT token |
| `@Request()` | Seluruh request object | Akses token, user info |
| `@UseGuards()` | Middleware untuk validasi | Auth checking |

### 3. Service Pattern (Pola Service/Business Logic)

Service berisi semua business logic dan database operations (CRUD).

```typescript
// Contoh: users.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ✅ CREATE - Buat user baru
  async create(createUserDto: CreateUserDto) {
    // Cek email sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  // ✅ READ - Cari satu user berdasarkan ID
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        recipes: true,      // Include resep milik user
        favorites: true,    // Include resep favorit
      },
    });

    if (!user) {
      throw new NotFoundException(\`User dengan ID \${id} tidak ditemukan\`);
    }

    return user;
  }

  // ✅ READ - Cari berdasarkan email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // ✅ READ - Cari semua user
  async findAll() {
    return this.prisma.user.findMany({
      include: { recipes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ UPDATE - Update user data
  async update(id: number, updateUserDto: UpdateUserDto) {
    // Verifikasi user ada
    await this.findOne(id);

    // Hash password jika diupdate
    const data = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // ✅ DELETE - Hapus user
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }

  // 🔑 VERIFY PASSWORD - Validasi password
  async verifyPassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
```

**CRUD Operations:**
| Operasi | SQL | Prisma | Fungsi |
|---------|-----|--------|--------|
| CREATE | INSERT | `.create()` | Tambah data baru |
| READ | SELECT | `.findUnique()`, `.findMany()` | Baca data |
| UPDATE | UPDATE | `.update()`, `.updateMany()` | Ubah data |
| DELETE | DELETE | `.delete()`, `.deleteMany()` | Hapus data |

### 4. DTO (Data Transfer Objects)

DTO mendefinisikan struktur dan validasi data yang diterima API.

```typescript
// Contoh: create-user.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  @Matches(/[A-Z]/, { message: 'Password harus contain huruf besar' })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

// Contoh: update-user.dto.ts
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  darkModeEnabled?: boolean;
}
```

**Decorators Class-Validator:**
| Decorator | Validasi | Contoh |
|-----------|----------|---------|
| `@IsString()` | Harus string | "John" ✅, 123 ❌ |
| `@IsEmail()` | Format email | "john@example.com" ✅ |
| `@IsNumber()` | Harus angka | 25 ✅, "25" ❌ |
| `@MinLength(n)` | Minimum panjang | MinLength(6): password min 6 char |
| `@MaxLength(n)` | Maximum panjang | MaxLength(100) |
| `@IsOptional()` | Optional field | Tidak wajib diisi |
| `@Matches(regex)` | Pattern matching | Matches(/[A-Z]/) = ada huruf besar |
| `@IsBoolean()` | True/false | enabled: true ✅ |
| `@IsEnum(enum)` | Enum value | Role.ADMIN, Role.USER |

### 5. Prisma ORM (Object-Relational Mapping)

Prisma adalah modern ORM untuk TypeScript/Node.js yang handle semua database operations.

#### **Schema Definition (prisma/schema.prisma)**

```prisma
// ✅ Data Source - Koneksi ke database
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ✅ Generator - Generate Prisma Client
generator client {
  provider = "prisma-client-js"
}

// ✅ Model - Definisi tabel User
model User {
  // Field definition
  id       Int     @id @default(autoincrement())  // Primary key, auto increment
  uuid     String  @unique @default(uuid())       // Unique identifier
  name     String                                  // Required field
  email    String  @unique                        // Unique, no duplicates
  password String
  avatar   String?                                // Optional field (nullable)

  // Settings
  notificationsEnabled Boolean @default(true)
  darkModeEnabled      Boolean @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations (Relationship dengan tabel lain)
  recipes   Recipe[]     // User punya banyak recipes
  favorites Favorite[]   // User punya banyak favorites
  reviews   Review[]     // User punya banyak reviews

  @@map("users")  // Nama table di database
}

// ✅ Model - Definisi tabel Recipe
model Recipe {
  id          Int     @id @default(autoincrement())
  title       String
  description String? @db.Text  // Text field (panjang)
  mainImage   String  @db.Text
  difficulty  String
  prepTime    Int?
  cookTime    Int?
  servings    Int?
  isPublic    Boolean @default(true)

  // Foreign Key - User yang membuat resep
  userId      Int
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Relations - Bahan & langkah resep
  ingredients Ingredient[]
  steps       RecipeStep[]
  favorites   Favorite[]
  reviews     Review[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("recipes")
}

// ✅ Model - Favorite (Many-to-Many relationship)
model Favorite {
  id        Int     @id @default(autoincrement())
  userId    Int
  recipeId  Int

  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe    Recipe  @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  // Composite unique constraint - User tidak bisa favorite resep yang sama 2x
  @@unique([userId, recipeId])
  @@map("favorites")
}
```

**Prisma Field Attributes:**
| Atribut | Fungsi |
|---------|--------|
| `@id` | Primary key (unique identifier) |
| `@unique` | Unique constraint (no duplicates) |
| `@default()` | Default value saat create |
| `@updatedAt` | Auto-update timestamp saat update |
| `@db.Text` | Text field untuk panjang >255 char |
| `@relation()` | Foreign key relationship |
| `onDelete: Cascade` | Hapus child saat parent dihapus |

#### **Operasi Prisma di Service**

```typescript
// ✅ CREATE - Buat data baru
const newUser = await prisma.user.create({
  data: {
    name: 'John',
    email: 'john@example.com',
    password: 'hashed_password',
  },
});

// ✅ READ - Cari satu record
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { recipes: true }, // Include related data
});

// ✅ READ - Cari banyak records
const users = await prisma.user.findMany({
  where: { darkModeEnabled: true }, // Filter
  include: { recipes: true },
  orderBy: { createdAt: 'desc' }, // Sort
  take: 10, // Limit
  skip: 0, // Offset
});

// ✅ UPDATE - Update satu record
const updated = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Jane' },
});

// ✅ DELETE - Hapus satu record
const deleted = await prisma.user.delete({
  where: { id: 1 },
});

// ✅ AGGREGATE - Aggregasi data
const count = await prisma.user.count();
const average = await prisma.review.aggregate({
  _avg: { rating: true },
  _max: { rating: true },
});
```

### 6. Authentication & Guards

**JWT Guard** melindungi routes yang memerlukan autentikasi.

```typescript
// auth/guards/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Ambil token dari header Authorization
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    try {
      // Verify token dan ambil payload
      const payload = await this.authService.verifyToken(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token invalid atau expired');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

**Penggunaan pada Controller:**

```typescript
// Protected route - hanya user yang login bisa akses
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req) {
  return {
    userId: req.user.id,
    email: req.user.email,
  };
}

// Public route - siapa saja bisa akses
@Get('recipes')
async getAllRecipes() {
  return this.recipesService.findAll();
}
```

### 7. Error Handling

Gunakan Exception Filter untuk centralized error handling:

```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    this.logger.error(
      \`HTTP Exception: \${JSON.stringify(exceptionResponse)}\`,
    );

    response.status(status).json({
      statusCode: status,
      message:
        typeof exceptionResponse === 'object'
          ? exceptionResponse['message']
          : exceptionResponse,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**Penggunaan Exception:**

```typescript
// Throw exception dengan message
throw new BadRequestException('Email sudah terdaftar');
throw new UnauthorizedException('Password salah');
throw new NotFoundException('User tidak ditemukan');
throw new InternalServerErrorException('Terjadi error di server');
```

---

## ▶️ Menjalankan Aplikasi

### Development Mode (dengan auto-reload)

```bash
npm run start:dev
```

Server akan berjalan di `http://localhost:3000`

**Fitur:**

- ✅ Auto reload saat file berubah
- ✅ Source map untuk debugging
- ✅ Lebih lambat tapi mudah development

### Production Mode (Build dulu)

```bash
# 1. Build aplikasi (compile TypeScript → JavaScript)
npm run build

# 2. Jalankan versi production (file .js di folder dist/)
npm run start:prod
```

**Fitur:**

- ✅ Optimized untuk performa
- ✅ Tidak ada source code
- ✅ File size lebih kecil

### Debug Mode

```bash
npm run start:debug
```

Aplikasi akan berjalan dalam debug mode dengan inspector aktif.

### Health Check

```bash
# Test apakah server running
curl http://localhost:3000/health

# Atau gunakan PowerShell
Invoke-WebRequest -Uri http://localhost:3000/health
```

---

## 🧪 Testing

### Unit Tests (Test komponen individual)

```bash
# Jalankan semua unit tests
npm run test

# Watch mode (auto-rerun saat file berubah)
npm run test:watch

# Coverage report (persentase code yang di-test)
npm run test:cov
```

### End-to-End (E2E) Tests (Test seluruh flow aplikasi)

```bash
npm run test:e2e
```

**Contoh E2E Test:**

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('User E2E Tests', () => {
  let app: INestApplication;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          userId = response.body.id;
        });
    });
  });

  describe('GET /users/:id', () => {
    it('should return user data', () => {
      return request(app.getHttpServer())
        .get(\`/users/\${userId}\`)
        .expect(200)
        .then((response) => {
          expect(response.body.email).toBe('john@example.com');
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## 📦 Database Relationships (Hubungan Antar Tabel)

```
┌─────────────┐
│    User     │ (Pengguna aplikasi)
└──────┬──────┘
       │
       ├─────────────┬──────────────┬──────────────┐
       │             │              │              │
       ▼             ▼              ▼              ▼
   ┌────────┐  ┌────────┐   ┌──────────┐   ┌──────────┐
   │ Recipe │  │ Favorite│  │ Review   │   │RefreshTkn│
   └────────┘  └────────┘   └──────────┘   └──────────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
       ▼             ▼              ▼
  ┌──────────┐ ┌────────────┐ ┌──────────┐
  │Ingredient│ │ RecipeStep │ │  Review  │
  └──────────┘ └────────────┘ └──────────┘
```

**Relationship Penjelasan:**

1. **User → Recipe** (One-to-Many)
   - Satu user bisa membuat **banyak** resep
   - Saat user dihapus, semua resepnya juga dihapus (CASCADE)

2. **User → Favorite** (One-to-Many)
   - User bisa mem-favorite **banyak** resep
   - Satu kombinasi (user, recipe) harus **unik** (tidak bisa favorite 2x)

3. **User → Review** (One-to-Many)
   - User bisa membuat **banyak** review
   - Satu user hanya bisa **1 review per resep** (@@unique)

4. **Recipe → Ingredient** (One-to-Many)
   - Resep punya **banyak** bahan
   - Urutan bahan disimpan dengan field `order`

5. **Recipe → RecipeStep** (One-to-Many)
   - Resep punya **banyak** langkah pembuatan
   - Urutan langkah dengan field `stepNumber`

---

## 🔒 Security Best Practices

### 1. Environment Variables

❌ **JANGAN:**

```env
DATABASE_URL="mysql://admin:password123@localhost:3306/app"
JWT_SECRET="secret123"
```

✅ **LAKUKAN:**

```env
DATABASE_URL="mysql://app_user:strong_random_password_min_16_char@localhost:3306/app"
JWT_SECRET="use_random_generator_like_openssl_rand_-hex_32"
```

Gunakan random generator:

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
[Convert]::ToHexString((Get-Random -Count 32 -InputObject (0..255)))
```

### 2. Password Hashing

```typescript
// ✅ BENAR - Hash password sebelum save
import * as bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 10);
await prisma.user.create({
  data: { email, password: hashedPassword },
});

// ❌ SALAH - Simpan plain text
await prisma.user.create({
  data: { email, password }, // 🚫 Jangan!
});
```

### 3. JWT Configuration

```env
# Token yang terlalu panjang rawan di-intercept
JWT_EXPIRATION="24h"    # ✅ Reasonable

# Password strength
JWT_SECRET="must_be_random_and_long_at_least_32_chars"
```

### 4. Input Validation

```typescript
// ✅ Gunakan DTO dengan class-validator
@Post()
async create(@Body() createUserDto: CreateUserDto) {
  // Automatically validated
  return this.usersService.create(createUserDto);
}

// ❌ Jangan trust user input langsung
@Post()
async create(@Body() data: any) {
  // 🚫 Data tidak divalidasi!
  return this.usersService.create(data);
}
```

### 5. Database User Permissions

```sql
-- ✅ Development (Isolated privileges)
CREATE USER 'dev_user'@'localhost' IDENTIFIED BY 'dev_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON dev_db.* TO 'dev_user'@'localhost';

-- ✅ Production (Minimal privileges)
CREATE USER 'prod_user'@'prod_server' IDENTIFIED BY 'strong_production_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON prod_db.* TO 'prod_user'@'prod_server';

-- ❌ Jangan gunakan
GRANT ALL PRIVILEGES ON *.* TO 'app_user'@'%';  -- 🚫 Terlalu permisif!
```

### 6. Rate Limiting

```typescript
// Install @nestjs/throttler
npm install @nestjs/throttler

// Gunakan di module
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,      // 1 menit
        limit: 10,       // Max 10 requests per menit
      },
    ]),
  ],
})
export class AppModule {}

// Atau di controller
@Throttle(5, 60)  // 5 requests per 60 seconds
@Post('login')
async login(@Body() credentials) {
  // ...
}
```

### 7. CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// ❌ Jangan gunakan
app.enableCors(); // 🚫 Terlalu open!
```

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Build aplikasi: `npm run build`
- [ ] Run tests: `npm run test`
- [ ] Update `.env` dengan production variables
- [ ] Generate strong JWT_SECRET
- [ ] Setup production MySQL database
- [ ] Jalankan migration: `npx prisma migrate deploy`
- [ ] Test endpoints di staging environment
- [ ] Setup HTTPS/SSL certificate
- [ ] Backup database lama
- [ ] Plan rollback strategy

### Database Backup

```bash
# Backup MySQL database
mysqldump -u app_user -p nama_database > backup_$(date +%Y%m%d).sql

# Restore dari backup
mysql -u app_user -p nama_database < backup_20250101.sql
```

### Deployment Platforms

#### **Option 1: Heroku (PaaS)**

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set DATABASE_URL="mysql://..."
heroku config:set JWT_SECRET="..."

# Deploy
git push heroku main

# Run migration
heroku run npx prisma migrate deploy

# View logs
heroku logs --tail
```

#### **Option 2: Railway**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway deploy

# Link database
railway link
```

#### **Option 3: DigitalOcean / AWS / Azure VPS**

```bash
# 1. Setup VPS (Ubuntu 20.04 LTS recommended)
# 2. Install dependencies
sudo apt update
sudo apt install nodejs npm mysql-server

# 3. Clone repository
git clone <repo-url>
cd nest-app

# 4. Install & build
npm install
npm run build

# 5. Setup environment
nano .env  # Edit dengan production variables

# 6. Run migration
npx prisma migrate deploy

# 7. Start dengan PM2 (process manager)
npm install -g pm2
pm2 start dist/main.js --name "nest-app"
pm2 save
pm2 startup

# 8. Setup Nginx reverse proxy
sudo apt install nginx
# Configure /etc/nginx/sites-available/default
sudo systemctl restart nginx
```

### Health Check di Production

```bash
# Test API health
curl https://your-api.com/health

# Monitor logs
pm2 logs nest-app

# Check status
pm2 status
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module @prisma/client"

```bash
# Reinstall Prisma
npm install @prisma/client prisma

# Generate Prisma Client
npx prisma generate

# Verify
npx prisma --version
```

### Error: "Connection timeout to database"

**Diagnosis:**

```bash
# Test MySQL connection
mysql -u app_user -p -h localhost
# Atau check connection string di .env

# Verify MySQL running
sudo systemctl status mysql

# Test port 3306
netstat -an | grep 3306
```

**Solusi:**

- ✅ Pastikan MySQL server sedang berjalan
- ✅ Check DATABASE_URL di `.env` format benar
- ✅ Verifikasi username/password valid
- ✅ Check firewall tidak block port 3306

### Error: "JWT token expired"

**Penyebab:** Token sudah melampaui waktu expiration

**Solusi:**

- User perlu login kembali untuk mendapat token baru
- Atau gunakan refresh token untuk refresh akses token

```typescript
// Cek token expiry
const decoded = jwt.decode(token);
console.log(decoded.exp); // Unix timestamp expiration
```

### Port 3000 Sudah Digunakan

```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3000

# Kill proses
Stop-Process -Id <PID> -Force

# Atau ganti port di .env
PORT=3001
```

### Migration Error

```bash
# Reset database (development only)
npx prisma migrate reset

# Atau manual fix
npx prisma migrate resolve --rolled-back "migration_name"

# Check status
npx prisma migrate status
```

---

## 📚 Referensi & Resources

### Official Documentation

- [NestJS Documentation](https://docs.nestjs.com) - Framework utama
- [Prisma Documentation](https://www.prisma.io/docs) - Database ORM
- [TypeScript Handbook](https://www.typescriptlang.org/docs) - Language

### Related Technologies

- [Express.js](https://expressjs.com) - Web framework yang digunakan NestJS
- [MySQL](https://dev.mysql.com/doc/) - Database
- [JWT.io](https://jwt.io) - Token authentication
- [Passport.js](http://www.passportjs.org/) - Authentication middleware

### Learning Resources

- [NestJS Course (udemy, Pluralsight)](https://www.udemy.com)
- [Prisma Tutorial](https://www.prisma.io/blog/backend-development)
- [REST API Best Practices](https://restfulapi.net/)

---

## 👥 Kontribusi

Untuk berkontribusi pada proyek ini:

1. **Fork** repository
2. **Buat branch** fitur: `git checkout -b fitur/AmazingFeature`
3. **Commit** perubahan: `git commit -m 'Add: AmazingFeature'`
4. **Push** ke branch: `git push origin fitur/AmazingFeature`
5. **Buat Pull Request** dengan deskripsi jelas

### Panduan Coding

- Gunakan **TypeScript** untuk semua kode
- Follow **eslint rules** yang sudah setup
- Tulis **unit tests** untuk fitur baru
- Dokumentasikan API dengan comments

---

## 📄 Lisensi

Proyek ini menggunakan lisensi **UNLICENSED**. Lihat file `LICENSE` untuk detail lengkap.

---

## 👨‍💻 Author & Credits

Dibuat dengan ❤️ untuk komunitas developer Indonesia.

**Contributors:**

- Hari Prasetyo
- Tim Development

**Last Updated:** 27 November 2025  
**NestJS Version:** 11.1.7  
**Prisma Version:** 6.19.0  
**Node.js:** v18+

---

## 📞 Support & Contact

Jika ada pertanyaan atau issue:

1. **Check Troubleshooting section** di dokumentasi ini
2. **Buka GitHub Issue** dengan detail error
3. **Hubungi developer team**

---

**Happy Coding! 🚀**
