const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./db');

// INISIALISASI EXPRESS (Harus diletakkan di atas sebelum memakai app.use)
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS yang mengizinkan semua akses port lokal
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

/* =========================================
   SETUP MULTER & FOLDER UPLOAD
========================================= */
// Buat folder 'uploads' otomatis jika belum ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Konfigurasi tempat penyimpanan file gambar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Izinkan browser untuk mengakses folder /uploads
app.use('/uploads', express.static('uploads'));


/* =========================================
   API ENDPOINTS: GENERAL
========================================= */
// Rute tes awal
app.get('/', (req, res) => {
    res.json({ message: "Backend Halframe Studio berhasil terhubung ke Supabase!" });
});


/* =========================================
   API ENDPOINTS: BOOKINGS
========================================= */
// 1. Ambil semua data booking (untuk Admin Panel)
app.get('/api/bookings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bookings ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 2. Tambah booking baru (dari halaman publik / form klien)
app.post('/api/bookings', async (req, res) => {
    try {
        // Menangkap client_phone dari frontend
        const { booking_id, client_name, client_email, client_phone, service, target_date, project_brief } = req.body;
        
        const newBooking = await pool.query(
            `INSERT INTO bookings (booking_id, client_name, client_email, client_phone, service, target_date, project_brief, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *`,
            [booking_id, client_name, client_email, client_phone, service, target_date, project_brief]
        );

        res.json({ message: "Booking berhasil disimpan!", data: newBooking.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 3. Update status booking berdasarkan ID
app.put('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, deliverable_link } = req.body;
        const updateBooking = await pool.query(
            `UPDATE bookings SET status = COALESCE($1, status), deliverable_link = COALESCE($2, deliverable_link) 
             WHERE id = $3 RETURNING *`,
            [status, deliverable_link, id]
        );
        res.json({ message: "Status booking berhasil diperbarui!", data: updateBooking.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 4. Hapus data booking berdasarkan ID
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
        res.json({ message: "Booking berhasil dihapus permanen!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/* =========================================
   API ENDPOINTS: WORKS (PORTFOLIO)
========================================= */
// 1. Ambil semua data karya portofolio
app.get('/api/works', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM works ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 2. Tambah karya baru (Bisa via Link URL atau File Upload dengan Multer)
app.post('/api/works', upload.single('image_file'), async (req, res) => {
    try {
        const { title, category, work_date, location, description } = req.body;
        let finalImageUrl = req.body.image_url || '';

        // Jika ada file fisik yang diunggah, timpa URL dengan path lokal server
        if (req.file) {
            finalImageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        const newWork = await pool.query(
            `INSERT INTO works (title, category, work_date, location, description, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, category, work_date, location, description, finalImageUrl]
        );

        res.json({ message: "Proyek berhasil ditambahkan!", data: newWork.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 4. Ambil detail 1 karya berdasarkan ID (Untuk halaman Work Detail)
app.get('/api/works/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM works WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Proyek tidak ditemukan" });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 3. Hapus karya portofolio berdasarkan ID
app.delete('/api/works/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM works WHERE id = $1', [id]);
        res.json({ message: "Proyek berhasil dihapus!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 4. Update karya portofolio berdasarkan ID (Bisa via Link URL atau File Upload)
app.put('/api/works/:id', upload.single('image_file'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, work_date, location, description } = req.body;
        
        // Ambil gambar lama dari database (berjaga-jaga jika admin tidak mengupload gambar baru saat diedit)
        const oldWork = await pool.query('SELECT image_url FROM works WHERE id = $1', [id]);
        if (oldWork.rows.length === 0) return res.status(404).json({ message: "Proyek tidak ditemukan" });
        
        // Default gunakan gambar dari form URL (jika diisi), atau gambar lama
        let finalImageUrl = req.body.image_url || oldWork.rows[0].image_url;

        // Jika admin memilih upload file fisik baru, timpa URL tersebut
        if (req.file) {
            finalImageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        const updateWork = await pool.query(
            `UPDATE works SET title = $1, category = $2, work_date = $3, location = $4, description = $5, image_url = $6 
             WHERE id = $7 RETURNING *`,
            [title, category, work_date, location, description, finalImageUrl, id]
        );

        res.json({ message: "Proyek berhasil diperbarui!", data: updateWork.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/* =========================================
   API ENDPOINTS: AUTHENTICATION (LOGIN)
========================================= */
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const userResult = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Email atau password salah!" });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Email atau password salah!" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, // Masukkan role ke token juga
            process.env.JWT_SECRET || 'kunci_rahasia_halframe_2026', 
            { expiresIn: '1d' }
        );

        // PERBAIKAN: Tambahkan 'role: user.role' di dalam objek user
        res.json({ 
            message: "Login berhasil!", 
            token: token,
            user: { 
                nama: user.nama_lengkap, 
                email: user.email, 
                role: user.role // <-- INI YANG KURANG SEBELUMNYA
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});

/* === API ENDPOINTS: TEAM (KRU HALFRAME) === */

// 1. Ambil semua data tim
app.get('/api/team', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM team_members ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Ambil detail 1 kru berdasarkan ID (Untuk halaman Team Detail)
app.get('/api/team/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM team_members WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Kru tidak ditemukan" });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 2. Tambah anggota tim baru
app.post('/api/team', upload.single('image_file'), async (req, res) => {
    try {
        const { full_name, nickname, pob, dob, role, education, portfolio_link, bio } = req.body;
        let photo_url = req.body.photo_url || '';
        
        if (req.file) {
            photo_url = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        const newTeam = await pool.query(
            `INSERT INTO team_members 
            (full_name, nickname, pob, dob, role, education, portfolio_link, bio, photo_url) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [full_name, nickname, pob, dob, role, education, portfolio_link, bio, photo_url]
        );
        res.json({ message: "Kru berhasil ditambahkan!", data: newTeam.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 3. Edit data anggota tim
app.put('/api/team/:id', upload.single('image_file'), async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, nickname, pob, dob, role, education, portfolio_link, bio } = req.body;
        
        const oldTeam = await pool.query('SELECT photo_url FROM team_members WHERE id = $1', [id]);
        if (oldTeam.rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan" });
        
        let finalPhotoUrl = req.body.photo_url || oldTeam.rows[0].photo_url;

        if (req.file) {
            finalPhotoUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        const updateTeam = await pool.query(
            `UPDATE team_members SET 
            full_name = $1, nickname = $2, pob = $3, dob = $4, role = $5, 
            education = $6, portfolio_link = $7, bio = $8, photo_url = $9 
            WHERE id = $10 RETURNING *`,
            [full_name, nickname, pob, dob, role, education, portfolio_link, bio, finalPhotoUrl, id]
        );

        res.json({ message: "Profil kru berhasil diperbarui!", data: updateTeam.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 4. Hapus anggota tim
app.delete('/api/team/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM team_members WHERE id = $1', [id]);
        res.json({ message: "Kru berhasil dihapus!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/* === API ENDPOINTS: INSIGHTS (ARTIKEL/BLOG) === */

// 1. Ambil semua artikel
app.get('/api/insights', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM insights ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 2. Tambah artikel baru
app.post('/api/insights', upload.single('cover_image'), async (req, res) => {
    try {
        const { title, category, status, publish_date, content } = req.body;
        let cover_image = '';
        
        if (req.file) {
            cover_image = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        // Jika publish_date kosong, set ke null agar tidak error format tanggal di database
        const finalDate = publish_date && publish_date.trim() !== '' ? publish_date : null;

        const newInsight = await pool.query(
            `INSERT INTO insights (title, category, status, publish_date, cover_image, content) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, category, status || 'Draft', finalDate, cover_image, content || '']
        );
        res.json({ message: "Artikel berhasil disimpan!", data: newInsight.rows[0] });
    } catch (err) {
        console.error("ERROR SUPABASE:", err.message); // Cetak detail error di terminal
        res.status(500).json({ message: err.message });
    }
});

// 3. Edit artikel
app.put('/api/insights/:id', upload.single('cover_image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, status, publish_date, content } = req.body;
        
        const oldInsight = await pool.query('SELECT cover_image FROM insights WHERE id = $1', [id]);
        if (oldInsight.rows.length === 0) return res.status(404).json({ message: "Artikel tidak ditemukan" });
        
        let finalImage = oldInsight.rows[0].cover_image;
        if (req.file) {
            finalImage = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        const finalDate = publish_date && publish_date.trim() !== '' ? publish_date : null;

        const updateInsight = await pool.query(
            `UPDATE insights SET title = $1, category = $2, status = $3, publish_date = $4, cover_image = $5, content = $6 
             WHERE id = $7 RETURNING *`,
            [title, category, status, finalDate, finalImage, content, id]
        );
        res.json({ message: "Artikel berhasil diperbarui!", data: updateInsight.rows[0] });
    } catch (err) {
        console.error("ERROR SUPABASE:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// 4. Hapus artikel
app.delete('/api/insights/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM insights WHERE id = $1', [id]);
        res.json({ message: "Artikel berhasil dihapus!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// API UNTUK PENGATURAN BERANDA (HOME SETUP)
// ==========================================

// A. Endpoint untuk MENYIMPAN pengaturan dari panel Admin (Mendukung Upload File & Link)
app.post('/api/settings/home', upload.array('slide_files'), async (req, res) => {
    const { pinned_works, slideshow_images } = req.body;
    
    try {
        // 1. Ambil URL yang sudah ada atau parsing dari body
        let finalImages = [];
        if (slideshow_images) {
            finalImages = typeof slideshow_images === 'string' ? JSON.parse(slideshow_images) : slideshow_images;
        }

        // 2. Jika ada file fisik baru yang di-upload melalui multer, ubah menjadi URL server permanen
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                finalImages.push(`http://localhost:5000/uploads/${file.filename}`);
            });
        }

        // 3. Reset semua karya menjadi TIDAK di-pin (is_pinned = false)
        await pool.query('UPDATE works SET is_pinned = false');

        // 4. Set karya yang dipilih admin menjadi di-pin (is_pinned = true)
        if (pinned_works) {
            const parsedPinned = typeof pinned_works === 'string' ? JSON.parse(pinned_works) : pinned_works;
            if (parsedPinned.length > 0) {
                await pool.query('UPDATE works SET is_pinned = true WHERE id = ANY($1::int[])', [parsedPinned]);
            }
        }

        // 5. Simpan daftar URL Slideshow secara permanen ke tabel home_settings (UPSERT PostgreSQL)
        await pool.query(
            `INSERT INTO home_settings (id, slideshow_images) VALUES (1, $1) 
             ON CONFLICT (id) DO UPDATE SET slideshow_images = $1`,
            [finalImages]
        );

        res.status(200).json({ message: 'Pengaturan Beranda berhasil disinkronkan secara permanen!' });
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ message: 'Terjadi kesalahan pada server database', error: err.message });
    }
});

// B. Endpoint untuk MENARIK data Slideshow (Digunakan oleh Admin & Website Publik)
app.get('/api/settings/home', async (req, res) => {
    try {
        const result = await pool.query('SELECT slideshow_images FROM home_settings WHERE id = 1');
        
        if (result.rows.length === 0) {
            return res.status(200).json({ slideshow_images: [] });
        }
        
        // Kirimkan data ke frontend
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Fetch Settings Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// API ENDPOINTS: REGISTRASI USER BARU
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // 1. Cek apakah email sudah terdaftar
        const existingUser = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "Email sudah terdaftar! Silakan login." });
        }

        // 2. Enkripsi password dengan bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Simpan dengan role default 'user'
        const newUser = await pool.query(
            `INSERT INTO admins (nama_lengkap, email, password_hash, role) VALUES ($1, $2, $3, 'user') RETURNING id, nama_lengkap, email, role`,
            [fullname, email, hashedPassword]
        );

        res.status(201).json({ 
            message: "Registrasi berhasil! Akun Anda terdaftar sebagai user.", 
            data: newUser.rows[0] 
        });

    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({ message: "Terjadi kesalahan pada server database." });
    }
});

// ==========================================
// API ENDPOINTS: PENGATURAN PROFIL (ACCOUNT)
// ==========================================

// Middleware Keamanan: Mengecek Token Login
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Mengambil token dari format "Bearer TOKEN"
    
    if (!token) return res.status(401).json({ message: "Akses ditolak. Silakan login kembali." });

    jwt.verify(token, process.env.JWT_SECRET || 'kunci_rahasia_halframe_2026', (err, user) => {
        if (err) return res.status(403).json({ message: "Sesi login tidak valid atau telah berakhir." });
        req.user = user; 
        next();
    });
};

// A. Tarik Data Profil User
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nama_lengkap, email, role FROM admins WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Akun tidak ditemukan" });
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Profile Fetch Error:", err.message);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// B. Simpan Perubahan Profil & Password
app.put('/api/profile', authenticateToken, async (req, res) => {
    const { nama_lengkap, old_password, new_password } = req.body;
    
    try {
        const userRes = await pool.query('SELECT * FROM admins WHERE id = $1', [req.user.id]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: "Akun tidak ditemukan" });
        
        const user = userRes.rows[0];
        let finalPasswordHash = user.password_hash; // Secara default gunakan password lama

        // Jika user mengisi form ubah password
        if (old_password && new_password) {
            const isMatch = await bcrypt.compare(old_password, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ message: "Kata sandi lama yang Anda masukkan salah!" });
            }
            finalPasswordHash = await bcrypt.hash(new_password, 10);
        }

        const updateRes = await pool.query(
            'UPDATE admins SET nama_lengkap = $1, password_hash = $2 WHERE id = $3 RETURNING id, nama_lengkap, email, role',
            [nama_lengkap, finalPasswordHash, req.user.id]
        );

        res.json({ message: "Profil berhasil diperbarui!", user: updateRes.rows[0] });
    } catch (err) {
        console.error("Profile Update Error:", err.message);
        res.status(500).json({ message: "Terjadi kesalahan saat menyimpan data" });
    }
});

// C. Tarik Data Booking Khusus User yang Sedang Login
app.get('/api/my-bookings', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM bookings WHERE client_email = $1 ORDER BY id DESC', 
            [req.user.email]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch My Bookings Error:", err.message);
        res.status(500).json({ message: "Terjadi kesalahan saat menarik data booking." });
    }
});

// ==========================================
// API ENDPOINTS: MANAGE USERS (ADMIN ONLY)
// ==========================================

// 1. Ambil Semua Daftar Pengguna
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        // Hanya tarik data penting, jangan tarik password_hash
        const result = await pool.query('SELECT id, nama_lengkap, email, role FROM admins ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Users Error:", err.message);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// 2. Update Role & Nama Pengguna
app.put('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_lengkap, role } = req.body;
        
        // Cek apakah user mencoba mengubah rolenya sendiri (opsional, untuk mencegah Super Admin tak sengaja turun pangkat)
        if (req.user.id === parseInt(id) && role !== req.user.role) {
            return res.status(403).json({ message: "Anda tidak bisa mengubah role Anda sendiri di sini. Gunakan Pengaturan Akun." });
        }

        const updateUser = await pool.query(
            `UPDATE admins SET nama_lengkap = $1, role = $2 WHERE id = $3 RETURNING id, nama_lengkap, email, role`,
            [nama_lengkap, role, id]
        );
        
        res.json({ message: "Data akun berhasil diperbarui!", data: updateUser.rows[0] });
    } catch (err) {
        console.error("Update User Error:", err.message);
        res.status(500).json({ message: "Gagal memperbarui akun" });
    }
});

// 3. Hapus Pengguna Permanen
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Mencegah Admin menghapus dirinya sendiri
        if (req.user.id === parseInt(id)) {
            return res.status(403).json({ message: "Anda tidak bisa menghapus akun Anda sendiri!" });
        }

        await pool.query('DELETE FROM admins WHERE id = $1', [id]);
        res.json({ message: "Akun berhasil dihapus permanen!" });
    } catch (err) {
        console.error("Delete User Error:", err.message);
        res.status(500).json({ message: "Gagal menghapus akun. Pastikan tidak ada data booking yang terikat." });
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server Halframe berjalan di http://localhost:${PORT}`);
});

module.exports = app;