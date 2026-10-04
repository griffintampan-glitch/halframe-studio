// js/auth.js

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. LOGIKA REGISTER (register.html)
    // ==========================================
    const registerForm = document.querySelector('body.auth-page form');
    
    // Pastikan ini dijalankan di halaman register (cek keberadaan input fullname)
    const fullnameInput = document.getElementById('fullname');
    if (registerForm && fullnameInput) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = registerForm.querySelector('.auth-submit');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = "Processing...";
            submitBtn.style.opacity = "0.7";
            submitBtn.style.pointerEvents = "none";

            const fullname = fullnameInput.value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:5000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullname, email, password })
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message || "Registrasi berhasil! Silakan login.");
                    window.location.href = 'login.html';
                } else {
                    alert(result.message || "Registrasi gagal.");
                    submitBtn.textContent = originalText;
                    submitBtn.style.opacity = "1";
                    submitBtn.style.pointerEvents = "auto";
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Gagal terhubung ke server. Pastikan backend sudah menyala.');
                submitBtn.textContent = originalText;
                submitBtn.style.opacity = "1";
                submitBtn.style.pointerEvents = "auto";
            }
        });
    }

    // ==========================================
    // 2. LOGIKA LOGIN & REDIRECT ROLE (login.html)
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const btn = loginForm.querySelector('.auth-submit');
            const originalText = btn.textContent;
            
            btn.textContent = "Processing...";
            btn.style.opacity = "0.7";
            btn.style.pointerEvents = "none";
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Simpan data sesi ke localStorage
                    localStorage.setItem('adminToken', result.token);
                    localStorage.setItem('adminName', result.user.nama);
                    localStorage.setItem('userRole', result.user.role); // Simpan role untuk pengecekan hak akses
                    
                    alert(`Login berhasil! Selamat datang, ${result.user.nama}`);

                    // REDIRECT BERDASARKAN 3 ROLE
                    const userRole = result.user.role;

                    if (userRole === 'super_admin' || userRole === 'admin') {
                        // Jika Raja atau Admin, masuk ke Dashboard Panel Admin
                        window.location.href = 'admin/dashboard.html'; 
                    } else {
                        // Jika User biasa, kembalikan ke halaman utama website publik
                        window.location.href = 'index.html';
                    }

                } else {
                    alert(result.message || "Email atau password salah.");
                    
                    btn.textContent = originalText;
                    btn.style.opacity = "1";
                    btn.style.pointerEvents = "auto";
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Gagal terhubung ke server. Pastikan backend sudah menyala.');
                
                btn.textContent = originalText;
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
            }
        });
    }
});