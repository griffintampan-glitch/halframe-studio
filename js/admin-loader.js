document.addEventListener("DOMContentLoaded", () => {
    const adminSidebarPlaceholder = document.getElementById('admin-sidebar-placeholder');

    if (adminSidebarPlaceholder) {
        // Karena file HTML admin berada di dalam folder /admin/, path ke komponen naik satu tingkat (../components/...)
        fetch('../components/admin-sidebar.html')
            .then(response => response.text())
            .then(data => {
                adminSidebarPlaceholder.innerHTML = data;

                // 1. Logika otomatis memberi kelas 'active' pada menu yang sedang dikunjungi
                const currentPage = window.location.pathname.split('/').pop();
                const sidebarLinks = adminSidebarPlaceholder.querySelectorAll('.sidebar-link');
                
                sidebarLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href === currentPage) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });

                // 2. Logika tombol Log Out
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminName');
                        localStorage.removeItem('userRole');
                        alert('Anda telah keluar dari sesi admin.');
                        window.location.href = '../login.html';
                    });
                }
            })
            .catch(err => console.error("Gagal memuat sidebar admin:", err));
    }
});