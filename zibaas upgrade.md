# Panduan Spesifikasi Upgrade API ZiBaaS (ZiBaaS Auth & Row-Level Security)

Dokumen ini adalah spesifikasi teknis resmi perubahan dan peningkatan API pada **ZiBaaS** (`https://zibaas.netlify.app`) agar mendukung **Autentikasi Berbasis Pengguna (JWT User Session)** dan **Proteksi Data Otomatis (Row-Level Security)** untuk platform **Zenon Analytics Studio**.

---

## 1. Ringkasan Perubahan Arsitektur

Saat ini ZiBaaS mengandalkan satu `x-api-key: zibaas-vendor-101` (Vendor Level) yang mengembalikan semua data ke publik.

### Arsitektur Baru yang Diterapkan:
1. **Pemisahan Kredensial**:
   - `x-api-key`: Tetap dipertahankan hanya untuk registrasi, exchange token, atau keperluan server-to-server/admin.
   - `Authorization: Bearer <user_jwt_token>`: Wajib digunakan oleh klien pengguna aplikasi untuk seluruh operasi data.
2. **Server-Side Row-Level Security (RLS)**:
   - ZiBaaS mengekstrak `user_id` dan `email` langsung dari **JWT payload**.
   - Setiap query database (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) otomatis diberi filter `WHERE user_id = :auth_user_id` tanpa mengandalkan parameter query dari frontend.

---

## 2. Endpoint Baru yang Perlu Dibuat di ZiBaaS

### A. Endpoint Login / Token Exchange
Menukar token autentikasi Google (atau kredensial pengguna) menjadi **ZiBaaS User Session JWT**.

- **URL**: `POST /api/v1/auth/login` (atau `POST /api/v1/auth/google`)
- **Headers**:
  ```http
  Content-Type: application/json
  x-api-key: zibaas-vendor-101
  ```
- **Request Body**:
  ```json
  {
    "provider": "google",
    "credential": "<google_id_token_jwt>"
  }
  ```
- **Logic di Sisi ZiBaaS Backend**:
  1. Decode/verifikasi JWT Google untuk mendapatkan `email`, `name`, `sub` (Google User ID), dan `picture`.
  2. Cari di tabel `zenon_users` berdasarkan `email`:
     - Jika belum ada: Insert baris baru dengan `tier = 'FREE'`, `config = '{}'`, `shared_context_arrays = '[]'`.
     - Jika sudah ada: Ambil record user tersebut.
  3. Terbitkan **ZiBaaS JWT** yang memuat payload:
     ```json
     {
       "sub": "<user_uuid_atau_google_id>",
       "user_id": "<user_id_di_tabel_zenon_users>",
       "email": "<user_email>",
       "name": "<user_name>",
       "tier": "FREE" // atau BUDGET / PREMIUM
     }
     ```
- **Response Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "d74094d6-c063-430b-ac9b-79d59427ed57",
      "name": "Ziddan Strife",
      "email": "ziddanstrife@gmail.com",
      "tier": "PREMIUM",
      "shared_context_arrays": "[]",
      "config": "{}"
    }
  }
  ```

---

### B. Endpoint Lookup Email Pengguna (Aman / Sanitasi)
Digunakan saat user ingin menambahkan kolaborator di Shared Context tanpa membocorkan seluruh isi tabel pengguna.

- **URL**: `GET /api/v1/zenon_users/lookup?email=user@example.com`
- **Headers**:
  ```http
  Authorization: Bearer <user_jwt_token>
  ```
- **Response Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "4816a584-f54d-4c23-83fb-bccdc97aa1c1",
      "name": "Ziddan Putra",
      "email": "ziddanputra2121@gmail.com"
    }
  }
  ```
  *(Catatan: Hanya kembalikan data publik `id`, `name`, dan `email`. Jangan kembalikan config atau data sensitif).*

---

## 3. Spesifikasi Middleware & Aturan Akses (RLS) pada Endpoint yang Ada

Setiap request ke endpoint di bawah ini **WAJIB** memvalidasi `Authorization: Bearer <user_token>`.

### A. Tabel Proyek (`zenon_workspace_projects`)

#### 1. `GET /api/v1/zenon_workspace_projects`
- **Logika Filter Database (RLS)**:
  Tampilkan hanya proyek yang:
  - Dibuat oleh user tersebut (`user_id = :auth_user_id`), **ATAU**
  - Proyek milik user lain yang membagikan akses ke email user ini (`shared_context_arrays` owner memuat email `:auth_email`).
- **SQL Logic**:
  ```sql
  SELECT p.*, 
         u.name as owner_name,
         CASE WHEN p.user_id = :auth_user_id THEN 'OWNER' ELSE 'SHARED' END as access_type
  FROM zenon_workspace_projects p
  LEFT JOIN zenon_users u ON u.id = p.user_id OR u.email = p.user_id
  WHERE p.user_id = :auth_user_id 
     OR p.user_id IN (
       SELECT id FROM zenon_users 
       WHERE shared_context_arrays::text ILIKE '%' || :auth_email || '%'
     );
  ```

#### 2. `POST /api/v1/zenon_workspace_projects`
- **Aturan Keamanan**:
  - Kolom `user_id` **TIDAK BOLEH** diambil dari request body klien.
  - ZiBaaS wajib meng-override `user_id = :auth_user_id` yang diambil dari token JWT.

#### 3. `PUT /api/v1/zenon_workspace_projects/:id`
- **Aturan Otorisasi**:
  - Hanya boleh jika:
    - User adalah Owner (`user_id = :auth_user_id`), **ATAU**
    - User memiliki role `EDITOR` pada shared context owner proyek tersebut.
  - Jika kolaborator hanya `VIEWER`, tolak dengan status `403 Forbidden`.

#### 4. `DELETE /api/v1/zenon_workspace_projects/:id`
- **Aturan Otorisasi**:
  - **HANYA OWNER** (`user_id = :auth_user_id`) yang boleh menghapus proyek.
  - Kolaborator (baik Viewer maupun Editor) **DILARANG** menghapus proyek (return `403 Forbidden`).

---

### B. Tabel Dataset (`zenon_workspace_datasets`)

#### 1. `GET /api/v1/zenon_workspace_datasets?project_id=:project_id`
- **Aturan Keamanan**:
  - Cek terlebih dahulu apakah `:project_id` boleh diakses oleh `:auth_user_id` (sebagai Owner atau Shared Collaborator).
  - Jika tidak berhak, tolak dengan `403 Forbidden`.

#### 2. `POST /api/v1/zenon_workspace_datasets`
- **Aturan Keamanan**:
  - Cek izin pada `project_id`. Hanya diizinkan jika Owner atau Editor.
  - `user_id` diisi otomatis dari token (`:auth_user_id`).

#### 3. `PUT /api/v1/zenon_workspace_datasets/:id` (Edit Cell/Tabel)
- **Aturan Keamanan**:
  - Hanya diizinkan untuk Owner atau kolaborator dengan role `EDITOR`.
  - Tolak dengan `403 Forbidden` jika user hanya `VIEWER`.

#### 4. `DELETE /api/v1/zenon_workspace_datasets/:id`
- **Aturan Keamanan**:
  - Hanya diizinkan untuk Owner proyek.

---

### C. Tabel Widget Grafik (`zenon_workspace_widgets`)

- Mengikuti aturan kepemilikan yang sama dengan dataset:
  - `GET`: Boleh diakses jika user punya izin buka `project_id`.
  - `POST` / `PUT`: Diizinkan untuk Owner dan Editor.
  - `DELETE`: Diizinkan untuk Owner (dan opsional Editor).

---

### D. Tabel Pengguna (`zenon_users`)

#### 1. `GET /api/v1/zenon_users/me` (Rekomendasi Endpoint Baru)
- Mengambil profil akun pengguna yang sedang login berdasarkan token JWT.
- Tidak perlu lagi query `GET /zenon_users?email=...`.

#### 2. `PUT /api/v1/zenon_users/:id`
- **Aturan Keamanan**:
  - User hanya boleh mengubah record miliknya sendiri (`WHERE id = :auth_user_id`).
  - Jika mencoba mengubah record milik ID orang lain, kembalikan `403 Forbidden`.
  - Kolom `email` tidak boleh dapat diubah (`read-only`).
  - Kolom `tier` hanya dapat diubah melalui flow payment/upgrade terverifikasi.

---

## 4. Matriks Ringkasan Izin Akses (RBAC Matrix)

| Aksi / Endpoint | Owner Proyek | Kolaborator (EDITOR) | Kolaborator (VIEWER) | Pengguna Lain |
| :--- | :---: | :---: | :---: | :---: |
| Lihat Daftar Proyek (`GET`) |  Ya |  Ya |  Ya | ❌ Blokir |
| Buat Proyek Baru (`POST`) |  Ya (Milik Sendiri) | - | - | - |
| Edit Nama/Desc Proyek (`PUT`) |  Ya |  Ya | ❌ 403 Forbidden | ❌ 403 Forbidden |
| Hapus Proyek (`DELETE`) |  Ya | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| Lihat Data & Grafik (`GET`) |  Ya |  Ya |  Ya | ❌ 403 Forbidden |
| Upload Dataset Baru (`POST`) |  Ya |  Ya | ❌ 403 Forbidden | ❌ 403 Forbidden |
| Edit Isi Tabel Dataset (`PUT`) |  Ya |  Ya | ❌ 403 Forbidden | ❌ 403 Forbidden |
| Hapus Dataset (`DELETE`) |  Ya | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| Tambah/Edit Widget (`POST`/`PUT`)|  Ya |  Ya | ❌ 403 Forbidden | ❌ 403 Forbidden |
| Kelola Shared Context |  Ya (Tier Premium) | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |

---

## 5. Rencana Penerapan Bertahap (Roadmap)

1. **Langkah 1**: Buat endpoint `POST /api/v1/auth/login` di ZiBaaS untuk memvalidasi login Google dan menerbitkan JWT User Token.
2. **Langkah 2**: Buat middleware autentikasi di ZiBaaS yang memvalidasi header `Authorization: Bearer <token>`.
3. **Langkah 3**: Terapkan filter `WHERE user_id = :auth_user_id` pada endpoint proyek dan dataset.
4. **Langkah 4**: Terapkan logika pengecekan `shared_context_arrays` untuk akses kolaborator (Viewer vs Editor).
5. **Langkah 5**: Sinkronkan frontend Zenon di `src/services/baasService.ts` untuk mulai mengirimkan Bearer token pengguna.
