// js/admin.js (VERSI FINAL - BERSIH DARI DUPLIKASI)

document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // 0. PENGAMAN AKSES HALAMAN ADMIN
    // =========================================
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert("Akses ditolak! Silakan masuk (login) terlebih dahulu.");
        window.location.href = '../login.html'; 
        return; 
    }

    // A. Atur Nama Admin
    const adminWelcomeName = document.getElementById('adminWelcomeName');
    const savedName = localStorage.getItem('adminName');
    if (adminWelcomeName && savedName) {
        adminWelcomeName.textContent = savedName;
    }

    // B. Atur Warna Badge & Bingkai Ikon Berdasarkan Role
    const userRole = localStorage.getItem('userRole'); // 'super_admin' atau 'admin'
    const adminRoleBadge = document.getElementById('adminRoleBadge');
    const adminUserIcon = document.getElementById('adminUserIcon');

    if (userRole === 'super_admin') {
        if (adminRoleBadge) {
            adminRoleBadge.textContent = "Super Admin";
            adminRoleBadge.style.color = "#ffb703"; // Warna Emas
        }
        if (adminUserIcon) {
            adminUserIcon.style.borderColor = "#ffb703"; // Border Lingkaran Emas
            adminUserIcon.style.boxShadow = "0 0 10px rgba(255, 183, 3, 0.4)";
            const svgIcon = adminUserIcon.querySelector('svg');
            if (svgIcon) svgIcon.style.color = "#ffb703"; // Warna Ikon Emas
        }
    } else if (userRole === 'admin') {
        if (adminRoleBadge) {
            adminRoleBadge.textContent = "Admin Staff";
            adminRoleBadge.style.color = "#2ecc71"; // Warna Hijau
        }
        if (adminUserIcon) {
            adminUserIcon.style.borderColor = "#2ecc71"; // Border Lingkaran Hijau
            adminUserIcon.style.boxShadow = "0 0 10px rgba(46, 204, 113, 0.4)";
            const svgIcon = adminUserIcon.querySelector('svg');
            if (svgIcon) svgIcon.style.color = "#2ecc71"; // Warna Ikon Hijau
        }
    }
    
    /* =========================================
       1. AMBIL DAN TAMPILKAN DATA BOOKING DARI DATABASE
    ========================================= */
    const bookingsTableBody = document.querySelector('#bookingsTable tbody');

    async function fetchBookings() {
        if (!bookingsTableBody) return;
        
        try {
            const response = await fetch('http://localhost:5000/api/bookings');
            const bookings = await response.json();

            bookingsTableBody.innerHTML = '';

            if (bookings.length === 0) {
                bookingsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888;">Belum ada data booking.</td></tr>';
                return;
            }

            bookings.forEach(b => {
                const tr = document.createElement('tr');
                const statusLower = (b.status || 'pending').toLowerCase();
                tr.setAttribute('data-status', statusLower);
                
                const formattedDate = b.target_date ? new Date(b.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

                let actionButtons = `
                    <button class="btn-icon view" title="View Details">👁️</button>
                    <button class="btn-icon approve" title="Approve">✔️</button>
                    <button class="btn-icon reject" title="Reject">❌</button>
                    <button class="btn-icon delete" title="Delete" data-id="${b.id}">🗑️</button>
                `;

                if (statusLower === 'approved') {
                    actionButtons = `
                        <button class="btn-icon view" title="View Details">👁️</button>
                        <button class="btn-icon complete" title="Mark as Completed">🏁</button>
                        <button class="btn-icon delete" title="Delete" data-id="${b.id}">🗑️</button>
                    `;
                } else if (statusLower === 'completed') {
                    actionButtons = `
                        <button class="btn-icon review" data-link="${b.deliverable_link || '#'}" title="Review Project" style="font-size:12px; padding:5px 10px; border-radius:4px; background:transparent; color:var(--text-light); border:1px solid var(--border-color);">📝 Review</button>
                        <button class="btn-icon delete" title="Delete" data-id="${b.id}">🗑️</button>
                    `;
                }

                tr.innerHTML = `
                    <td>${b.booking_id || '#B-' + b.id}</td>
                    <td>
                        <strong>${b.client_name}</strong><br>
                        <span style="font-size: 0.8rem; color: #888;">${b.client_email}</span>
                    </td>
                    <td>${b.service}</td>
                    <td>${formattedDate}</td>
                    <td><span class="badge ${statusLower}">${b.status || 'Pending'}</span></td>
                    <td class="table-actions">
                        ${actionButtons}
                    </td>
                `;
                
                tr.dataset.id = b.id; 
                tr.dataset.clientName = b.client_name;
                tr.dataset.clientEmail = b.client_email;
                tr.dataset.service = b.service;
                tr.dataset.targetDate = formattedDate;
                tr.dataset.projectBrief = b.project_brief || '-';

                bookingsTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error('Gagal mengambil data booking:', err);
        }
    }

    fetchBookings();

    /* =========================================
       2. FILTER TABEL BOOKING
    ========================================= */
    const filterBtns = document.querySelectorAll('.admin-filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            const tableRows = document.querySelectorAll('#bookingsTable tbody tr');
            tableRows.forEach(row => {
                if (filterValue === 'all' || row.getAttribute('data-status') === filterValue) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    /* =========================================
       3. LOGIKA TOMBOL AKSI & MODAL DETAIL
    ========================================= */
    const detailModal = document.getElementById('bookingModal');
    const addModal = document.getElementById('addBookingModal');

    const tableBody = document.querySelector('#bookingsTable tbody');
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const row = e.target.closest('tr');
            if (!row) return;

            const statusBadge = row.querySelector('.badge');
            const actionCell = row.querySelector('.table-actions');

            if (e.target.closest('.view')) {
                document.getElementById('detail-client').textContent = `${row.dataset.clientName} (${row.dataset.clientEmail})`;
                document.getElementById('detail-service').textContent = row.dataset.service;
                document.getElementById('detail-date').textContent = row.dataset.targetDate;
                document.getElementById('detail-brief').textContent = row.dataset.projectBrief;
                detailModal.classList.add('show');
            }
            else if (e.target.closest('.approve')) {
                const bookingId = row.dataset.id;
                try {
                    await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Approved' })
                    });
                    statusBadge.className = 'badge approved';
                    statusBadge.textContent = 'Approved';
                    row.setAttribute('data-status', 'approved');
                    actionCell.innerHTML = `
                        <button class="btn-icon view" title="View Details">👁️</button>
                        <button class="btn-icon complete" title="Mark as Completed">🏁</button>
                        <button class="btn-icon delete" title="Delete" data-id="${bookingId}">🗑️</button>
                    `;
                } catch (err) {
                    console.error('Gagal mengupdate status:', err);
                }
            }
            else if (e.target.closest('.reject')) {
                const bookingId = row.dataset.id;
                try {
                    await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Rejected' })
                    });
                    statusBadge.className = 'badge rejected';
                    statusBadge.textContent = 'Rejected';
                    row.setAttribute('data-status', 'rejected');
                    actionCell.innerHTML = `
                        <button class="btn-icon view" title="View Details">👁️</button>
                        <button class="btn-icon delete" title="Delete" data-id="${bookingId}">🗑️</button>
                    `;
                } catch (err) {
                    console.error('Gagal mengupdate status:', err);
                }
            }
            else if (e.target.closest('.complete')) {
                actionCell.innerHTML = `
                    <input type="url" class="gdocs-input" placeholder="Paste link file..." style="width: 140px; padding: 4px; font-size: 11px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-dark); color: white; margin-right: 5px;">
                    <button class="btn-icon save-link" title="Save Link">✔️</button>
                    <button class="btn-icon cancel-link" title="Cancel">❌</button>
                `;
            }
            else if (e.target.closest('.cancel-link')) {
                actionCell.innerHTML = `
                    <button class="btn-icon view" title="View Details">👁️</button>
                    <button class="btn-icon complete" title="Mark as Completed">🏁</button>
                    <button class="btn-icon delete" title="Delete">🗑</button>
                `;
            }
            else if (e.target.closest('.save-link')) {
                const inputField = actionCell.querySelector('.gdocs-input');
                let link = inputField.value.trim();

                if (!link) {
                    alert("Silakan masukkan link dokumen terlebih dahulu!");
                    return;
                }

                if (!link.startsWith('http')) link = 'https://' + link;

                const bookingId = row.dataset.id; 

                try {
                    await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            status: 'Completed', 
                            deliverable_link: link 
                        })
                    });

                    statusBadge.className = 'badge completed';
                    statusBadge.textContent = 'Completed';
                    row.setAttribute('data-status', 'completed');
                    
                    actionCell.innerHTML = `
                        <button class="btn-icon review" data-link="${link}" title="Review Project" style="font-size:12px; padding:5px 10px; border-radius:4px; background:transparent; color:var(--text-light); border:1px solid var(--border-color);">📝 Review</button>
                        <button class="btn-icon delete" title="Delete" data-id="${bookingId}">🗑️</button>
                    `;
                } catch (err) {
                    console.error('Gagal mengupdate status ke Completed:', err);
                    alert('Terjadi kesalahan saat menyimpan ke database.');
                }
            }
            else if (e.target.closest('.review')) {
                const link = e.target.closest('.review').getAttribute('data-link');
                if (link && link !== '#') window.open(link, '_blank');
                else alert("Link dokumen tidak ditemukan.");
            }
            else if (e.target.closest('.delete')) {
                const bookingId = row.dataset.id; 
                if (confirm("Apakah kamu yakin ingin menghapus data booking ini permanen?")) {
                    try {
                        const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
                            method: 'DELETE'
                        });
                        
                        if (response.ok) {
                            row.remove(); 
                        } else {
                            alert("Gagal menghapus data dari database.");
                        }
                    } catch (err) {
                        console.error('Error saat menghapus:', err);
                        alert("Terjadi kesalahan koneksi saat menghapus.");
                    }
                }
            }
        });
    }

    document.querySelectorAll('.detail-close, .detail-close-btn').forEach(btn => {
        btn.addEventListener('click', () => detailModal.classList.remove('show'));
    });

    const openAddBtn = document.getElementById('openAddBookingBtn');
    if (openAddBtn) openAddBtn.addEventListener('click', () => addModal.classList.add('show'));

    document.querySelectorAll('.add-close, .add-close-btn').forEach(btn => {
        btn.addEventListener('click', () => addModal.classList.remove('show'));
    });

    window.addEventListener('click', (e) => {
        if (detailModal && e.target === detailModal) detailModal.classList.remove('show');
        if (addModal && e.target === addModal) addModal.classList.remove('show');
    });

    /* =========================================
       4. SUBMIT TAMBAH BOOKING BARU KE SUPABASE
    ========================================= */
    const addForm = document.getElementById('addBookingForm');
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const client_name = document.getElementById('addName').value;
            const client_email = document.getElementById('addEmail').value;
            const service = document.getElementById('addService').value;
            const target_date = document.getElementById('addDate').value;
            
            const booking_id = 'HLF-' + Math.floor(10000 + Math.random() * 90000);
            const project_brief = 'Ditambahkan manual melalui panel admin.';

            try {
                const response = await fetch('http://localhost:5000/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ booking_id, client_name, client_email, service, target_date, project_brief })
                });

                if (response.ok) {
                    alert('Booking berhasil ditambahkan ke database!');
                    addModal.classList.remove('show');
                    addForm.reset();
                    fetchBookings(); 
                } else {
                    alert('Gagal menyimpan ke database.');
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Terjadi kesalahan koneksi ke server.');
            }
        });
    }

    /* =========================================
       5. DOWNLOAD LAPORAN PROYEK (DENGAN POP-UP & FILTER)
    ========================================= */
    const downloadReportBtns = document.querySelectorAll('#downloadReportBtn, #dashboardReportBtn');
    const exportModal = document.getElementById('exportModal');
    const confirmExportBtn = document.getElementById('confirmExportBtn');

    if (exportModal) {
        // Buka modal saat tombol export diklik
        downloadReportBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    exportModal.classList.add('show');
                });
            }
        });

        // Tutup modal
        document.querySelectorAll('.export-close, .export-close-btn').forEach(btn => {
            btn.addEventListener('click', () => exportModal.classList.remove('show'));
        });

        window.addEventListener('click', (e) => {
            if (e.target === exportModal) exportModal.classList.remove('show');
        });

        // Proses Ekspor saat tombol konfirmasi diklik
        if (confirmExportBtn) {
            confirmExportBtn.addEventListener('click', async () => {
                const startDateInput = document.getElementById('exportStartDate').value;
                const endDateInput = document.getElementById('exportEndDate').value;
                const format = document.getElementById('exportFormat').value;

                try {
                    const response = await fetch('http://localhost:5000/api/bookings');
                    let bookings = await response.json();

                    if (bookings.length === 0) {
                        alert("Belum ada data laporan untuk di-export.");
                        return;
                    }

                    // Filter berdasarkan rentang tanggal (jika diisi)
                    if (startDateInput || endDateInput) {
                        bookings = bookings.filter(b => {
                            if (!b.target_date) return false;
                            const bDate = new Date(b.target_date).toISOString().split('T')[0];
                            if (startDateInput && bDate < startDateInput) return false;
                            if (endDateInput && bDate > endDateInput) return false;
                            return true;
                        });

                        if (bookings.length === 0) {
                            alert("Tidak ada data dalam rentang tanggal tersebut.");
                            return;
                        }
                    }

                    const fileName = `Halframe_Report_${new Date().toISOString().split('T')[0]}`;

                    // A. FORMAT CSV
                    if (format === 'csv') {
                        let csvContent = "data:text/csv;charset=utf-8,";
                        csvContent += "Booking ID,Client Name,Email,Service,Target Date,Status\r\n";

                        bookings.forEach(b => {
                            const row = [
                                b.booking_id || ('#B-' + b.id),
                                `"${b.client_name || ''}"`,
                                b.client_email || '',
                                `"${b.service || ''}"`,
                                b.target_date ? new Date(b.target_date).toLocaleDateString('en-US') : '',
                                b.status || 'Pending'
                            ];
                            csvContent += row.join(",") + "\r\n";
                        });

                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `${fileName}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }

                    // B. FORMAT EXCEL (.xlsx)
                    else if (format === 'excel') {
                        const excelData = bookings.map(b => ({
                            "Booking ID": b.booking_id || ('#B-' + b.id),
                            "Client Name": b.client_name,
                            "Email": b.client_email,
                            "Service": b.service,
                            "Target Date": b.target_date ? new Date(b.target_date).toLocaleDateString('en-US') : '-',
                            "Status": b.status || 'Pending'
                        }));

                        const worksheet = XLSX.utils.json_to_sheet(excelData);
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings Report");
                        XLSX.writeFile(workbook, `${fileName}.xlsx`);
                    }

                    // C. FORMAT PDF (.pdf)
                    else if (format === 'pdf') {
                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF();

                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(16);
                        doc.text("HALFRAME STUDIO - PROJECT REPORT", 14, 20);

                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        doc.text(`Diciptakan pada: ${new Date().toLocaleDateString()}`, 14, 28);

                        const tableColumn = ["Booking ID", "Client Name", "Service", "Target Date", "Status"];
                        const tableRows = [];

                        bookings.forEach(b => {
                            tableRows.push([
                                b.booking_id || ('#B-' + b.id),
                                b.client_name,
                                b.service,
                                b.target_date ? new Date(b.target_date).toLocaleDateString('en-US') : '-',
                                b.status || 'Pending'
                            ]);
                        });

                        doc.autoTable({
                            head: [tableColumn],
                            body: tableRows,
                            startY: 35,
                            theme: 'grid',
                            styles: { fontSize: 9 },
                            headStyles: { fillColor: [20, 20, 20] }
                        });

                        doc.save(`${fileName}.pdf`);
                    }

                    exportModal.classList.remove('show');
                } catch (err) {
                    console.error("Gagal mendownload laporan:", err);
                    alert("Terjadi kesalahan saat memproses laporan.");
                }
            });
        }
    }

/* =========================================
       6. LOGIKA MANAGE WORKS (PORTFOLIO DATABASE)
    ========================================= */
    const workModal = document.getElementById('workModal');
    const openWorkModalBtn = document.getElementById('openAddWorkBtn');
    const workModalTitle = document.getElementById('workModalTitle');
    const workForm = document.getElementById('workForm');
    const worksGrid = document.querySelector('.admin-works-grid');

    if (workModal && worksGrid) {
        
        // A. Fungsi Tampil Data
        async function fetchWorks() {
            try {
                const response = await fetch('http://localhost:5000/api/works');
                const works = await response.json();
                
                worksGrid.innerHTML = ''; 
                
                if (works.length === 0) {
                    worksGrid.innerHTML = '<p style="color:#888; grid-column: 1/-1; text-align:center;">Belum ada karya di portofolio.</p>';
                    return;
                }
                
                works.forEach(work => {
                    const card = document.createElement('div');
                    card.className = 'admin-work-card';
                    card.dataset.id = work.id; 
                    
                    // Simpan data lengkap di elemen agar mudah dipanggil saat tombol Edit diklik
                    card.dataset.title = work.title;
                    card.dataset.category = work.category;
                    card.dataset.date = work.work_date ? new Date(work.work_date).toISOString().split('T')[0] : '';
                    card.dataset.location = work.location || '';
                    card.dataset.description = work.description || '';
                    card.dataset.image = work.image_url || '';
                    
                    const imageUrl = work.image_url || 'https://images.unsplash.com/photo-1604242692760-2f7b0c26856d?q=80&w=400&auto=format&fit=crop';
                    
                    card.innerHTML = `
                        <img src="${imageUrl}" alt="${work.title}">
                        <div class="admin-work-info">
                            <h4>${work.title}</h4>
                            <span class="work-category">${work.category}</span>
                            <div class="admin-work-actions">
                                <button class="btn-edit" data-id="${work.id}">Edit</button>
                                <button class="btn-delete" data-id="${work.id}">Delete</button>
                            </div>
                        </div>
                    `;
                    worksGrid.appendChild(card);
                });
            } catch (err) {
                console.error("Gagal memuat portofolio:", err);
            }
        }

        fetchWorks();

        // B. Logika Toggle Radio Button (Link vs Upload)
        const useLinkBtn = document.getElementById('useLink');
        const useUploadBtn = document.getElementById('useUpload');
        const linkGroup = document.getElementById('linkInputGroup');
        const uploadGroup = document.getElementById('uploadInputGroup');

        if (useLinkBtn && useUploadBtn) {
            useLinkBtn.addEventListener('change', () => {
                linkGroup.style.display = 'block';
                uploadGroup.style.display = 'none';
            });
            useUploadBtn.addEventListener('change', () => {
                linkGroup.style.display = 'none';
                uploadGroup.style.display = 'block';
            });
        }

        // C. Buka Modal untuk "Tambah Data Baru"
        if (openWorkModalBtn) {
            openWorkModalBtn.addEventListener('click', () => {
                workModalTitle.textContent = "Add New Project";
                if(workForm) {
                    workForm.reset();
                    workForm.dataset.mode = 'add'; // Tandai bahwa form sedang mode Tambah
                    workForm.dataset.editId = '';
                }
                if(useLinkBtn) useLinkBtn.click(); 
                workModal.classList.add('show');
            });
        }

        document.querySelectorAll('.work-close, .work-close-btn').forEach(btn => {
            btn.addEventListener('click', () => workModal.classList.remove('show'));
        });

        // D. Aksi Klik pada Grid (Edit & Delete)
        worksGrid.addEventListener('click', async (e) => {
            // Aksi Hapus
            if (e.target.closest('.btn-delete')) {
                const btn = e.target.closest('.btn-delete');
                const workId = btn.dataset.id;
                if (confirm("Apakah kamu yakin ingin menghapus karya ini?")) {
                    try {
                        const response = await fetch(`http://localhost:5000/api/works/${workId}`, { method: 'DELETE' });
                        if (response.ok) fetchWorks(); 
                        else alert("Gagal menghapus proyek.");
                    } catch (err) {
                        console.error("Error saat menghapus:", err);
                    }
                }
            }

            // Aksi Edit
            if (e.target.closest('.btn-edit')) {
                const btn = e.target.closest('.btn-edit');
                const card = btn.closest('.admin-work-card');
                
                // Ubah judul pop-up dan tandai mode form menjadi Edit
                workModalTitle.textContent = "Edit Project";
                workForm.dataset.mode = 'edit';
                workForm.dataset.editId = card.dataset.id;
                
                // Isi otomatis form dengan data yang ada di card
                document.getElementById('workTitle').value = card.dataset.title;
                document.getElementById('workCategory').value = card.dataset.category;
                document.getElementById('workDate').value = card.dataset.date;
                document.getElementById('workLocation').value = card.dataset.location;
                document.getElementById('workDescription').value = card.dataset.description;
                
                // Kembalikan ke opsi Link dan isi URL lama
                if(useLinkBtn) useLinkBtn.click();
                document.getElementById('workImageUrl').value = card.dataset.image;
                
                workModal.classList.add('show');
            }
        });

        // E. Submit Data (Tambah atau Update)
        if (workForm) {
            workForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                let formData = new FormData();
                formData.append('title', document.getElementById('workTitle').value);
                formData.append('category', document.getElementById('workCategory').value);
                formData.append('work_date', document.getElementById('workDate').value);
                formData.append('location', document.getElementById('workLocation').value);
                formData.append('description', document.getElementById('workDescription').value);

                const isUploadMode = document.getElementById('useUpload').checked;

                if (isUploadMode) {
                    const fileInput = document.getElementById('workImageFile');
                    if (fileInput.files.length > 0) {
                        formData.append('image_file', fileInput.files[0]);
                    } 
                    // Jika mode edit dan tidak upload gambar baru, biarkan kosong (backend akan menanganinya)
                    else if (workForm.dataset.mode === 'add') {
                        alert("Silakan pilih file gambar untuk diupload!");
                        return;
                    }
                } else {
                    const urlInput = document.getElementById('workImageUrl').value;
                    if (!urlInput && workForm.dataset.mode === 'add') {
                        alert("Silakan masukkan link gambar!");
                        return;
                    }
                    formData.append('image_url', urlInput);
                }

                // Cek apakah sedang mode Add atau Edit untuk menentukan URL dan Method
                const mode = workForm.dataset.mode || 'add';
                const url = mode === 'edit' ? `http://localhost:5000/api/works/${workForm.dataset.editId}` : 'http://localhost:5000/api/works';
                const method = mode === 'edit' ? 'PUT' : 'POST';

                try {
                    const response = await fetch(url, {
                        method: method,
                        body: formData 
                    });
                    
                    if (response.ok) {
                        alert(mode === 'edit' ? "Proyek berhasil diperbarui!" : "Proyek berhasil ditambahkan ke Portofolio!");
                        workModal.classList.remove('show');
                        workForm.reset();
                        fetchWorks(); 
                    } else {
                        alert("Gagal menyimpan ke database.");
                    }
                } catch (err) {
                    console.error("Error menyimpan proyek:", err);
                    alert("Terjadi kesalahan pada server.");
                }
            });
        }
    }
   
    /* =========================================
       7. LOGIKA MANAGE INSIGHT (ARTIKEL DATABASE)
    ========================================= */
    const insightModal = document.getElementById('insightModal');
    const openInsightBtn = document.getElementById('openAddInsightBtn');
    const insightModalTitle = document.getElementById('insightModalTitle');
    const insightForm = document.getElementById('insightForm');
    const insightTableBody = document.querySelector('#insightTable tbody');

    if (insightModal && insightTableBody) {
        
        // A. Fungsi Ambil Data Artikel dari Database
        async function fetchInsights() {
            try {
                const response = await fetch('http://localhost:5000/api/insights');
                const insights = await response.json();

                insightTableBody.innerHTML = '';

                if (insights.length === 0) {
                    insightTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">Belum ada artikel.</td></tr>';
                    return;
                }

                insights.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.dataset.id = item.id;
                    tr.dataset.title = item.title;
                    tr.dataset.category = item.category;
                    tr.dataset.status = item.status;
                    tr.dataset.date = item.publish_date ? new Date(item.publish_date).toISOString().split('T')[0] : '';
                    tr.dataset.content = item.content || '';
                    tr.dataset.image = item.cover_image || '';

                    const formattedDate = item.publish_date ? new Date(item.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                    const statusLower = (item.status || 'draft').toLowerCase();
                    const badgeClass = statusLower === 'published' ? 'approved' : 'pending';
                    const titleDisplay = statusLower === 'draft' ? `Draft: ${item.title}` : item.title;

                    let actionButtons = `
                        <button class="btn-icon edit-insight" title="Edit Article">✏️</button>
                        <button class="btn-icon delete-insight" title="Delete">🗑️</button>
                    `;

                    if (statusLower === 'draft') {
                        actionButtons = `
                            <button class="btn-icon edit-insight" title="Edit Article">✏️</button>
                            <button class="btn-icon publish-insight" title="Publish Now">🚀</button>
                            <button class="btn-icon delete-insight" title="Delete">🗑️</button>
                        `;
                    }

                    tr.innerHTML = `
                        <td>${formattedDate}</td>
                        <td><strong>${titleDisplay}</strong></td>
                        <td>${item.category}</td>
                        <td><span class="badge ${badgeClass}">${item.status}</span></td>
                        <td class="table-actions">
                            ${actionButtons}
                        </td>
                    `;

                    insightTableBody.appendChild(tr);
                });
            } catch (err) {
                console.error("Gagal memuat artikel:", err);
            }
        }

        fetchInsights();

        // B. Buka Modal "Write New Article"
        if (openInsightBtn) {
            openInsightBtn.addEventListener('click', () => {
                insightModalTitle.textContent = "Write New Article";
                if(insightForm) {
                    insightForm.reset();
                    insightForm.dataset.mode = 'add';
                    insightForm.dataset.editId = '';
                }
                insightModal.classList.add('show');
            });
        }

        // Tutup Modal
        document.querySelectorAll('.insight-close, .insight-close-btn').forEach(btn => {
            btn.addEventListener('click', () => insightModal.classList.remove('show'));
        });

        // C. Aksi pada Tabel (Edit, Delete, Quick Publish)
        insightTableBody.addEventListener('click', async (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            const insightId = row.dataset.id;

            // Hapus Artikel
            if (e.target.closest('.delete-insight')) {
                if (confirm("Yakin ingin menghapus artikel ini?")) {
                    try {
                        const response = await fetch(`http://localhost:5000/api/insights/${insightId}`, { method: 'DELETE' });
                        if (response.ok) fetchInsights();
                        else alert("Gagal menghapus artikel.");
                    } catch (err) {
                        console.error("Error menghapus:", err);
                    }
                }
            }

            // Edit Artikel
            if (e.target.closest('.edit-insight')) {
                insightModalTitle.textContent = "Edit Article";
                insightForm.dataset.mode = 'edit';
                insightForm.dataset.editId = insightId;

                document.getElementById('insightTitle').value = row.dataset.title;
                document.getElementById('insightCategory').value = row.dataset.category;
                document.getElementById('insightStatus').value = row.dataset.status;
                document.getElementById('insightDate').value = row.dataset.date;
                document.getElementById('insightContent').value = row.dataset.content;

                insightModal.classList.add('show');
            }

            // Publish Cepat (Dari Draft ke Published langsung dari tabel)
            if (e.target.closest('.publish-insight')) {
                try {
                    const response = await fetch(`http://localhost:5000/api/insights/${insightId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: row.dataset.title,
                            category: row.dataset.category,
                            status: 'Published',
                            publish_date: new Date().toISOString().split('T')[0],
                            content: row.dataset.content
                        })
                    });

                    if (response.ok) {
                        fetchInsights();
                    } else {
                        alert("Gagal mempublikasikan artikel.");
                    }
                } catch (err) {
                    console.error("Error publishing:", err);
                }
            }
        });

        // D. Submit Form (Tambah atau Update Artikel)
        if (insightForm) {
            insightForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitBtn = insightForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = "Menyimpan...";
                submitBtn.disabled = true;

                let formData = new FormData();
                formData.append('title', document.getElementById('insightTitle').value);
                formData.append('category', document.getElementById('insightCategory').value);
                formData.append('status', document.getElementById('insightStatus').value);
                formData.append('publish_date', document.getElementById('insightDate').value);
                formData.append('content', document.getElementById('insightContent').value);

                const fileInput = document.getElementById('insightImage');
                if (fileInput.files.length > 0) {
                    formData.append('cover_image', fileInput.files[0]);
                }

                const mode = insightForm.dataset.mode || 'add';
                const url = mode === 'edit' ? `http://localhost:5000/api/insights/${insightForm.dataset.editId}` : 'http://localhost:5000/api/insights';
                const method = mode === 'edit' ? 'PUT' : 'POST';

                try {
                    const response = await fetch(url, {
                        method: method,
                        body: formData
                    });

                    if (response.ok) {
                        alert(mode === 'edit' ? "Artikel berhasil diperbarui!" : "Artikel baru berhasil disimpan!");
                        insightModal.classList.remove('show');
                        insightForm.reset();
                        fetchInsights();
                    } else {
                        alert("Gagal menyimpan artikel ke database.");
                    }
                } catch (err) {
                    console.error("Error menyimpan insight:", err);
                    alert("Terjadi kesalahan pada server.");
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }

    /* =========================================
       8. GLOBAL CLOSE MODAL UPDATE
    ========================================= */
    window.addEventListener('click', (e) => {
        const dModal = document.getElementById('bookingModal');
        const aModal = document.getElementById('addBookingModal');
        const wModal = document.getElementById('workModal');
        const iModal = document.getElementById('insightModal');
        const tModal = document.getElementById('teamModal'); 

        if (dModal && e.target === dModal) dModal.classList.remove('show');
        if (aModal && e.target === aModal) aModal.classList.remove('show');
        if (wModal && e.target === wModal) wModal.classList.remove('show');
        if (iModal && e.target === iModal) iModal.classList.remove('show');
        if (tModal && e.target === tModal) tModal.classList.remove('show');
    });

   /* =========================================
       9. LOGIKA MANAGE TEAM (KRU HALFRAME)
    ========================================= */
    const teamModal = document.getElementById('teamModal');
    const openAddTeamBtn = document.getElementById('openAddTeamBtn');
    const teamModalTitle = document.getElementById('teamModalTitle');
    const teamForm = document.getElementById('teamForm');
    const teamGrid = document.querySelector('.admin-team-grid');

    if (teamModal && teamGrid) {
        
        // A. Tarik Data Tim dari Database
        async function fetchTeam() {
            try {
                const response = await fetch('http://localhost:5000/api/team');
                const teamMembers = await response.json();
                
                teamGrid.innerHTML = ''; 
                
                if (teamMembers.length === 0) {
                    teamGrid.innerHTML = '<p style="color:#888; grid-column: 1/-1; text-align:center;">Belum ada data kru.</p>';
                    return;
                }
                
                teamMembers.forEach(member => {
                    const card = document.createElement('div');
                    card.className = 'admin-team-card';
                    card.dataset.id = member.id; 
                    
                    card.dataset.fullname = member.full_name;
                    card.dataset.nickname = member.nickname;
                    card.dataset.pob = member.pob;
                    card.dataset.dob = member.dob ? new Date(member.dob).toISOString().split('T')[0] : '';
                    card.dataset.role = member.role;
                    card.dataset.education = member.education;
                    card.dataset.portfolio = member.portfolio_link || '';
                    card.dataset.bio = member.bio || '';
                    card.dataset.photo = member.photo_url || '';
                    
                    const photoUrl = member.photo_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop';
                    
                    card.innerHTML = `
                        <img src="${photoUrl}" alt="${member.nickname}">
                        <div class="admin-team-info">
                            <h4>${member.nickname}</h4>
                            <span class="work-category">${member.role}</span>
                            <div class="admin-work-actions">
                                <button class="btn-edit" data-id="${member.id}">Edit</button>
                                <button class="btn-delete" data-id="${member.id}">Remove</button>
                            </div>
                        </div>
                    `;
                    teamGrid.appendChild(card);
                });
            } catch (err) {
                console.error("Gagal memuat data tim:", err);
            }
        }

        fetchTeam();

        // B. Buka Modal Tambah Baru
        if (openAddTeamBtn) {
            openAddTeamBtn.addEventListener('click', () => {
                teamModalTitle.textContent = "Add New Member";
                if(teamForm) {
                    teamForm.reset();
                    teamForm.dataset.mode = 'add'; 
                    teamForm.dataset.editId = '';
                }
                teamModal.classList.add('show');
            });
        }

        document.querySelectorAll('.team-close, .team-close-btn').forEach(btn => {
            btn.addEventListener('click', () => teamModal.classList.remove('show'));
        });

        // C. Aksi Klik pada Grid (Edit & Remove)
        teamGrid.addEventListener('click', async (e) => {
            
            // Hapus Kru
            if (e.target.closest('.btn-delete')) {
                const btn = e.target.closest('.btn-delete');
                const memberId = btn.dataset.id;
                if (confirm("Yakin ingin menghapus profil kru ini dari sistem?")) {
                    try {
                        const response = await fetch(`http://localhost:5000/api/team/${memberId}`, { method: 'DELETE' });
                        if (response.ok) fetchTeam(); 
                        else alert("Gagal menghapus data.");
                    } catch (err) {
                        console.error("Error menghapus:", err);
                    }
                }
            }

            // Edit Kru
            if (e.target.closest('.btn-edit')) {
                const btn = e.target.closest('.btn-edit');
                const card = btn.closest('.admin-team-card');
                
                teamModalTitle.textContent = "Edit Member Profile";
                teamForm.dataset.mode = 'edit';
                teamForm.dataset.editId = card.dataset.id;
                
                document.getElementById('teamFullName').value = card.dataset.fullname;
                document.getElementById('teamNickname').value = card.dataset.nickname;
                document.getElementById('teamPOB').value = card.dataset.pob;
                document.getElementById('teamDOB').value = card.dataset.dob;
                document.getElementById('teamRole').value = card.dataset.role;
                document.getElementById('teamEducation').value = card.dataset.education;
                document.getElementById('teamPortfolio').value = card.dataset.portfolio;
                document.getElementById('teamProfile').value = card.dataset.bio;
                
                teamModal.classList.add('show');
            }
        });

        // D. Submit Form (Tambah atau Update)
        if (teamForm) {
            teamForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = teamForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = "Menyimpan...";
                submitBtn.disabled = true;

                let formData = new FormData();
                formData.append('full_name', document.getElementById('teamFullName').value);
                formData.append('nickname', document.getElementById('teamNickname').value);
                formData.append('pob', document.getElementById('teamPOB').value);
                formData.append('dob', document.getElementById('teamDOB').value);
                formData.append('role', document.getElementById('teamRole').value);
                formData.append('education', document.getElementById('teamEducation').value);
                formData.append('portfolio_link', document.getElementById('teamPortfolio').value);
                formData.append('bio', document.getElementById('teamProfile').value);

                const fileInput = document.getElementById('teamPhoto');
                if (fileInput.files.length > 0) {
                    formData.append('image_file', fileInput.files[0]);
                } else if (teamForm.dataset.mode === 'add') {
                    alert("Wajib mengunggah foto profil untuk kru baru!");
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    return;
                }

                const mode = teamForm.dataset.mode || 'add';
                const url = mode === 'edit' ? `http://localhost:5000/api/team/${teamForm.dataset.editId}` : 'http://localhost:5000/api/team';
                const method = mode === 'edit' ? 'PUT' : 'POST';

                try {
                    const response = await fetch(url, {
                        method: method,
                        body: formData 
                    });
                    
                    if (response.ok) {
                        alert(mode === 'edit' ? "Profil kru berhasil diperbarui!" : "Kru baru berhasil ditambahkan!");
                        teamModal.classList.remove('show');
                        teamForm.reset();
                        fetchTeam(); 
                    } else {
                        alert("Gagal menyimpan ke database.");
                    }
                } catch (err) {
                    console.error("Error menyimpan kru:", err);
                    alert("Terjadi kesalahan pada server.");
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }

/* =========================================
    10. LOGIKA LOG OUT
========================================= */
const logoutBtns = document.querySelectorAll('.logout-btn');

logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        if (confirm("Apakah kamu yakin ingin keluar dari panel admin?")) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminName');
            
            window.location.href = '../login.html'; 
        }
    });
});

/* =========================================
       11. LOGIKA DASHBOARD OVERVIEW & STATISTIK
    ========================================= */
    const statPending = document.getElementById('stat-pending');
    const statApproved = document.getElementById('stat-approved');
    const statCompleted = document.getElementById('stat-completed');
    const dashboardTableBody = document.getElementById('dashboardTableBody');

    if (statPending && dashboardTableBody) {
        async function fetchDashboardData() {
            try {
                const response = await fetch('http://localhost:5000/api/bookings');
                const bookings = await response.json();

                // 1. Hitung jumlah berdasarkan status
                let pendingCount = 0;
                let approvedCount = 0;
                let completedCount = 0;

                bookings.forEach(b => {
                    const status = (b.status || '').toLowerCase();
                    if (status === 'pending') pendingCount++;
                    else if (status === 'approved') approvedCount++;
                    else if (status === 'completed') completedCount++;
                });

                // Tampilkan ke kotak statistik
                statPending.textContent = pendingCount;
                statApproved.textContent = approvedCount;
                statCompleted.textContent = completedCount;

                // 2. Tampilkan 3 data booking terbaru di tabel
                dashboardTableBody.innerHTML = '';

                if (bookings.length === 0) {
                    dashboardTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">Belum ada data booking.</td></tr>';
                    return;
                }

                // Ambil 3 data teratas (paling baru)
                const recentBookings = bookings.slice(0, 3);

                recentBookings.forEach(b => {
                    const tr = document.createElement('tr');
                    const statusLower = (b.status || 'pending').toLowerCase();
                    const formattedDate = b.target_date ? new Date(b.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

                    let actionLink = `<a href="manage-bookings.html" class="action-link">🔍 Details</a>`;
                    if (statusLower === 'completed') {
                        actionLink = `<a href="manage-bookings.html" class="action-link" style="color:var(--accent);">📝 Review</a>`;
                    }

                    tr.innerHTML = `
                        <td>${formattedDate}</td>
                        <td><strong>${b.client_name}</strong></td>
                        <td>${b.service}</td>
                        <td><span class="badge ${statusLower}">${b.status || 'Pending'}</span></td>
                        <td>${actionLink}</td>
                    `;

                    dashboardTableBody.appendChild(tr);
                });

            } catch (err) {
                console.error("Gagal memuat data statistik dashboard:", err);
            }
        }

        fetchDashboardData();
    }

    /* =========================================
       12. FITUR PENCARIAN REAL-TIME DI PANEL ADMIN
    ========================================= */
    const adminSearchInput = document.getElementById('adminSearchInput');

    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();

            // A. Pencarian di Tabel Booking (manage-bookings.html)
            const bookingRows = document.querySelectorAll('#bookingsTable tbody tr');
            if (bookingRows.length > 0) {
                bookingRows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(keyword) ? '' : 'none';
                });
            }

            // B. Pencarian di Grid Portofolio (manage-works.html)
            const workCards = document.querySelectorAll('.admin-works-grid .admin-work-card');
            if (workCards.length > 0) {
                workCards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(keyword) ? '' : 'none';
                });
            }

            // C. Pencarian di Tabel Insight / Artikel (manage-insight.html)
            const insightRows = document.querySelectorAll('#insightTable tbody tr');
            if (insightRows.length > 0) {
                insightRows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(keyword) ? '' : 'none';
                });
            }

            // D. Pencarian di Grid Team / Kru (manage-team.html)
            const teamCards = document.querySelectorAll('.admin-admin-team-grid .admin-team-card, .admin-team-grid .admin-team-card');
            if (teamCards.length > 0) {
                teamCards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(keyword) ? '' : 'none';
                });
            }
        });
    }

});