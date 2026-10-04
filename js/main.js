// js/main.js (KODE FINAL BERSIH BEBAS ERROR)

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 0. MEMUAT NAVBAR PUBLIK & LOGIKA TOMBOL LOGIN
    // ==========================================
    const navPlaceholder = document.getElementById('public-nav-placeholder');
    
    if (navPlaceholder) {
        fetch('components/public-nav.html')
            .then(response => response.text())
            .then(data => {
                navPlaceholder.innerHTML = data;

                // Logika Tombol Login Dinamis
                const authBtn = document.getElementById('auth-btn');
                if (authBtn) {
                    const token = localStorage.getItem('adminToken');
                    const userRole = localStorage.getItem('userRole');

                    if (token) {
                        if (userRole === 'super_admin' || userRole === 'admin') {
                            authBtn.textContent = 'Dashboard';
                            authBtn.href = 'admin/dashboard.html';
                            authBtn.style.color = '#ffb703';
                        } else {
                            authBtn.textContent = 'My Account';
                            authBtn.href = 'account.html';
                        }
                    }
                }
            })
            .catch(err => console.error("Gagal memuat navbar:", err));

            // ==========================================
    // MEMUAT FOOTER PUBLIK OTOMATIS
    // ==========================================
    const footerPlaceholder = document.getElementById('public-footer-placeholder');
    
    if (footerPlaceholder) {
        fetch('components/public-footer.html')
            .then(response => response.text())
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(err => console.error("Gagal memuat footer:", err));
    }
    }

    // ==========================================
    // RENDER OTOMATIS AMBIENT GLOW BACKGROUND
    // ==========================================
    if (!document.querySelector('.ambient-background')) {
        const ambientDiv = document.createElement('div');
        ambientDiv.className = 'ambient-background';
        ambientDiv.innerHTML = `
            <div class="glow-orb glow-1"></div>
            <div class="glow-orb glow-2"></div>
            <div class="glow-orb glow-3"></div>
        `;
        document.body.prepend(ambientDiv);
    }

    // ==========================================
    // 1. EFEK NAVBAR SCROLL (Glassmorphism)
    // ==========================================
    window.addEventListener("scroll", () => {
        const navbar = document.getElementById("navbar");
        
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.background = "rgba(10, 10, 10, 0.4)"; 
                navbar.style.backdropFilter = "blur(15px)"; 
                navbar.style.webkitBackdropFilter = "blur(15px)"; 
                navbar.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)"; 
                navbar.style.padding = "15px 5%";
            } else {
                navbar.style.background = "transparent";
                navbar.style.backdropFilter = "none";
                navbar.style.webkitBackdropFilter = "none";
                navbar.style.borderBottom = "none";
                navbar.style.padding = "20px 5%";
            }
        }
    });

    // ==========================================
    // 2. LOGIKA FILTER PORTFOLIO (SANGAT AKURAT)
    // ==========================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioGrid = document.getElementById('portfolio-grid');

    if (filterButtons.length > 0 && portfolioGrid) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const filterValue = button.getAttribute('data-filter').toLowerCase().trim();
                const portfolioItems = portfolioGrid.querySelectorAll('.portfolio-item, .card');

                portfolioItems.forEach(item => {
                    const itemCategory = (item.getAttribute('data-category') || '').toLowerCase();

                    if (filterValue === 'all' || itemCategory.includes(filterValue)) {
                        item.classList.remove('hide');
                        item.style.display = '';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            item.classList.add('hide');
                            item.style.display = 'none';
                        }, 300); 
                    }
                });
            });
        });
    }

    // ==========================================
    // 3. AUTO-SELECT SERVICE DI FORM BOOKING
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam) {
        const serviceSelect = document.getElementById('service-select');
        if (serviceSelect) {
            const optionToSelect = Array.from(serviceSelect.options).find(opt => opt.value === serviceParam);
            if (optionToSelect) optionToSelect.selected = true;
        }
    }

    // ==========================================
    // 4. LOGIKA HERO SLIDESHOW DINAMIS
    // ==========================================
    const heroSlideshowContainer = document.querySelector('.hero-slideshow');
    
    if (heroSlideshowContainer) {
        async function loadSlideshow() {
            try {
                const response = await fetch('http://localhost:5000/api/settings/home');
                const data = await response.json();
                const images = data.slideshow_images || [];

                if (images.length > 0) {
                    heroSlideshowContainer.innerHTML = ''; 
                    
                    images.forEach((url, index) => {
                        const slide = document.createElement('div');
                        slide.className = index === 0 ? 'slide active' : 'slide';
                        slide.style.backgroundImage = `url('${url}')`;
                        heroSlideshowContainer.appendChild(slide);
                    });

                    const slides = document.querySelectorAll('.hero-slideshow .slide');
                    let currentSlide = 0;
                    if (slides.length > 1) {
                        setInterval(() => {
                            slides[currentSlide].classList.remove('active');
                            currentSlide = (currentSlide + 1) % slides.length;
                            slides[currentSlide].classList.add('active');
                        }, 5000); 
                    }
                }
            } catch (err) {
                console.error("Gagal memuat slideshow:", err);
            }
        }
        loadSlideshow();
    }

    // ==========================================
    // 5. INTEGRASI FORM BOOKING KE BACKEND
    // ==========================================
    const bookingForm = document.getElementById('bookingForm');
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');

    if (bookingForm) {
        
        // --- KODE BARU: AUTO-FILL & LOCK EMAIL JIKA LOGIN ---
        const token = localStorage.getItem('adminToken');
        if (token) {
            fetch('http://localhost:5000/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(userData => {
                if (userData && userData.email) {
                    const nameInput = document.getElementById('name');
                    const emailInput = document.getElementById('email');
                    
                    if (nameInput) nameInput.value = userData.nama_lengkap;
                    if (emailInput) {
                        emailInput.value = userData.email;
                        emailInput.readOnly = true; // Kunci agar tidak bisa diedit
                        emailInput.style.opacity = '0.6';
                        emailInput.style.cursor = 'not-allowed';
                        emailInput.style.backgroundColor = "rgba(0,0,0,0.5)";
                    }
                }
            })
            .catch(err => console.log("Abaikan jika user memang belum login."));
        }
        // ----------------------------------------------------

        bookingForm.addEventListener('submit', async function (e) {
            e.preventDefault(); 
            // ... (sisa kode submit tetap sama) 
            const submitBtn = bookingForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Mengirim...";
            submitBtn.style.pointerEvents = "none";
            submitBtn.style.opacity = "0.7";

            const client_name = document.getElementById('name').value;
            const client_email = document.getElementById('email').value;
            const client_phone = document.getElementById('phone').value; 
            const service = document.getElementById('service-select').value;
            const target_date = document.getElementById('date').value;
            const project_brief = document.getElementById('details').value;
            const booking_id = 'HLF-' + Math.floor(10000 + Math.random() * 90000);

            try {
                const response = await fetch('http://localhost:5000/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ booking_id, client_name, client_email, client_phone, service, target_date, project_brief })
                });

                if (response.ok) {
                    this.reset();
                    successModal.classList.add('show');
                } else {
                    const result = await response.json();
                    alert('Gagal mengirim pemesanan: ' + (result.message || 'Terjadi kesalahan'));
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Gagal terhubung ke server backend.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.style.pointerEvents = "auto";
                submitBtn.style.opacity = "1";
            }
        });
    }

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            successModal.classList.remove('show');
            window.location.href = 'index.html'; 
        });
    }

    // ==========================================
    // 6. MENARIK DATA PORTOFOLIO DARI SUPABASE
    // ==========================================
    if (portfolioGrid) {
        async function fetchWorksForPublic() {
            try {
                const response = await fetch('http://localhost:5000/api/works');
                const works = await response.json();
                portfolioGrid.innerHTML = ''; 

                if (works.length === 0) {
                    portfolioGrid.innerHTML = '<p style="color:#888; text-align:center; grid-column:1/-1;">Belum ada karya yang diunggah.</p>';
                    return;
                }

                works.forEach(work => {
                    const dbCategory = (work.category || '').toLowerCase(); 
                    const imageUrl = work.image_url || 'https://images.unsplash.com/photo-1604242692760-2f7b0c26856d?q=80&w=400&auto=format&fit=crop';

                    const card = document.createElement('div');
                    card.className = 'card portfolio-item reveal active'; 
                    card.setAttribute('data-category', dbCategory); 
                    
                    card.innerHTML = `
                        <a href="work-detail.html?id=${work.id}" style="text-decoration: none; color: inherit; display: block; height: 100%;">
                            <div class="card-image">
                                <img src="${imageUrl}" alt="${work.title}">
                            </div>
                            <div class="card-info">
                                <h3>${work.title}</h3>
                                <p>${work.category}</p>
                            </div>
                        </a>
                    `;
                    portfolioGrid.appendChild(card);
                });
            } catch (err) {
                console.error('Gagal memuat portofolio publik:', err);
                portfolioGrid.innerHTML = '<p style="color:red; text-align:center; grid-column:1/-1;">Gagal terhubung ke database.</p>';
            }
        }
        fetchWorksForPublic();
    }

    // ==========================================
    // 7. MENARIK KARYA UNGGULAN / PINNED (index.html)
    // ==========================================
    const latestWorksGrid = document.getElementById('latest-works-grid');
    if (latestWorksGrid) {
        async function fetchPinnedWorks() {
            try {
                const response = await fetch('http://localhost:5000/api/works');
                const works = await response.json();
                latestWorksGrid.innerHTML = ''; 

                const pinnedWorks = works.filter(work => work.is_pinned === true).slice(0, 3);

                if (pinnedWorks.length === 0) {
                    latestWorksGrid.innerHTML = '<p style="color:#888; text-align:center; grid-column:1/-1;">Belum ada karya unggulan yang diatur admin.</p>';
                    return;
                }

                pinnedWorks.forEach(work => {
                    const imageUrl = work.image_url || 'https://images.unsplash.com/photo-1604242692760-2f7b0c26856d?q=80&w=400&auto=format&fit=crop';
                    const card = document.createElement('div');
                    card.className = 'card reveal active'; 
                    
                    card.innerHTML = `
                        <a href="work-detail.html?id=${work.id}" style="text-decoration: none; color: inherit; display: block; height: 100%;">
                            <div class="card-image"><img src="${imageUrl}" alt="${work.title}"></div>
                            <div class="card-info">
                                <h3>${work.title}</h3>
                                <p>${work.category}</p>
                            </div>
                        </a>
                    `;
                    latestWorksGrid.appendChild(card);
                });
            } catch (err) {
                console.error('Gagal memuat karya unggulan:', err);
            }
        }
        fetchPinnedWorks();
    }

    // ==========================================
    // 8. MENARIK DATA KRU (team.html)
    // ==========================================
    const publicTeamGrid = document.getElementById('public-team-grid');
    if (publicTeamGrid) {
        async function fetchPublicTeam() {
            try {
                const response = await fetch('http://localhost:5000/api/team');
                const team = await response.json();
                publicTeamGrid.innerHTML = ''; 

                if (team.length === 0) {
                    publicTeamGrid.innerHTML = '<p style="color:#888; text-align:center; grid-column:1/-1;">Belum ada profil kru yang dipublikasikan.</p>';
                    return;
                }

                team.forEach(member => {
                    const photoUrl = member.photo_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop';
                    const card = document.createElement('div');
                    card.className = 'team-card reveal active'; 
                    card.style.cssText = "border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; overflow: hidden; transition: transform 0.3s ease, border-color 0.3s ease;";
                    
                    card.onmouseover = () => { card.style.borderColor = "rgba(255, 255, 255, 0.8)"; card.style.transform = "translateY(-5px)"; };
                    card.onmouseout = () => { card.style.borderColor = "rgba(255, 255, 255, 0.15)"; card.style.transform = "translateY(0)"; };
                    
                    card.innerHTML = `
                        <a href="team-detail.html?id=${member.id}" style="text-decoration: none; color: inherit; display: block; height: 100%;">
                            <div class="team-image" style="border-bottom: 1px solid rgba(255, 255, 255, 0.15);">
                                <img src="${photoUrl}" alt="${member.nickname}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                            </div>
                            <div class="team-info" style="padding: 20px; text-align: center;">
                                <h3 style="margin-bottom: 5px;">${member.nickname}</h3>
                                <p class="role" style="color: var(--accent); font-size: 0.9rem; margin-bottom: 15px;">${member.role}</p>
                                <div class="team-social" style="font-size: 0.85rem; color: var(--text-muted);">Klik untuk lihat profil &rarr;</div>
                            </div>
                        </a>
                    `;
                    publicTeamGrid.appendChild(card);
                });
            } catch (err) {
                console.error('Gagal memuat data kru publik:', err);
            }
        }
        fetchPublicTeam();
    }

    // ==========================================
    // 9. MENARIK ARTIKEL JURNAL (insight.html)
    // ==========================================
    const publicInsightSection = document.getElementById('public-insight-section');
    if (publicInsightSection) {
        async function fetchPublicInsights() {
            try {
                const response = await fetch('http://localhost:5000/api/insights');
                const insights = await response.json();
                publicInsightSection.innerHTML = '';

                const publishedArticles = insights.filter(item => (item.status || '').toLowerCase() === 'published');
                if (publishedArticles.length === 0) {
                    publicInsightSection.innerHTML = '<p style="color:#888; text-align:center; padding: 40px;">Belum ada artikel jurnal yang dipublikasikan.</p>';
                    return;
                }

                const featured = publishedArticles[0];
                const featuredImg = featured.cover_image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop';
                const featuredDate = featured.publish_date ? new Date(featured.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

                let htmlContent = `
                    <a href="insight-detail.html?id=${featured.id}" style="text-decoration: none; color: inherit; display: flex; width: 100%;" class="featured-insight reveal active">
                        <div class="featured-image" style="flex: 1.5;"><img src="${featuredImg}" alt="${featured.title}" style="width:100%; height:100%; object-fit:cover;"></div>
                        <div class="featured-content" style="flex: 1;">
                            <span class="category">${featured.category}</span>
                            <h2>${featured.title}</h2>
                            <p class="excerpt">${featured.content ? featured.content.substring(0, 120) + '...' : ''}</p>
                            <div class="meta-data">${featuredDate}</div>
                            <span class="read-more">Read Article &rarr;</span>
                        </div>
                    </a>
                    <div class="insight-grid">
                `;

                const restArticles = publishedArticles.slice(1);
                restArticles.forEach(article => {
                    const cardImg = article.cover_image || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=600&auto=format&fit=crop';
                    const cardDate = article.publish_date ? new Date(article.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

                    htmlContent += `
                        <a href="insight-detail.html?id=${article.id}" style="text-decoration: none; color: inherit; display: block;" class="card insight-card reveal active">
                            <div style="border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; overflow: hidden; height: 100%;">
                                <div class="card-image"><img src="${cardImg}" alt="${article.title}"></div>
                                <div class="card-info insight-card-content" style="padding: 20px;">
                                    <span class="category" style="color: var(--accent); font-size: 0.8rem; text-transform: uppercase;">${article.category}</span>
                                    <h3 style="font-size: 1.1rem; margin-top: 8px; margin-bottom: 10px;">${article.title}</h3>
                                    <div class="meta-data" style="font-size: 0.8rem; color: var(--text-muted);">${cardDate}</div>
                                </div>
                            </div>
                        </a>
                    `;
                });

                htmlContent += `</div>`;
                publicInsightSection.innerHTML = htmlContent;
            } catch (err) {
                console.error("Gagal memuat insight publik:", err);
            }
        }
        fetchPublicInsights();
    }

    // ==========================================
    // 10. FITUR PENCARIAN REAL-TIME
    // ==========================================
    const publicSearchInput = document.getElementById('publicSearchInput');
    if (publicSearchInput) {
        publicSearchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();

            const insightCards = document.querySelectorAll('#public-insight-section .card, #public-insight-section .featured-insight');
            insightCards.forEach(card => card.style.display = card.textContent.toLowerCase().includes(keyword) ? '' : 'none');

            const teamCards = document.querySelectorAll('#public-team-grid .team-card');
            teamCards.forEach(card => card.style.display = card.textContent.toLowerCase().includes(keyword) ? '' : 'none');

            const workCards = document.querySelectorAll('#portfolio-grid .portfolio-item');
            workCards.forEach(card => card.style.display = card.textContent.toLowerCase().includes(keyword) ? '' : 'none');
        });
    }

    // ==========================================
    // 11. MENARIK DETAIL ARTIKEL (insight-detail.html)
    // ==========================================
    const insightDetailContent = document.getElementById('insight-detail-content');
    
    if (insightDetailContent) {
        async function fetchInsightDetail() {
            const urlParams = new URLSearchParams(window.location.search);
            const articleId = urlParams.get('id');
            
            if (!articleId) {
                insightDetailContent.innerHTML = '<p style="text-align:center;">Artikel tidak ditemukan.</p>';
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/insights');
                const insights = await response.json();
                
                const article = insights.find(item => item.id == articleId);

                if (!article) {
                    insightDetailContent.innerHTML = '<p style="text-align:center;">Artikel tidak ditemukan.</p>';
                    return;
                }

                const featuredImg = article.cover_image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop';
                const publishDate = article.publish_date ? new Date(article.publish_date).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' }) : '-';

                insightDetailContent.innerHTML = `
                    <div style="max-width: 800px; margin: 0 auto; text-align: left;">
                        <span style="color: var(--accent); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">${article.category}</span>
                        <h1 style="font-size: 2.5rem; margin: 15px 0; font-family: var(--font-head); line-height: 1.3;">${article.title}</h1>
                        <p style="color: var(--text-muted); margin-bottom: 30px; font-size: 0.9rem;">Dipublikasikan pada ${publishDate}</p>
                        
                        <div style="width: 100%; height: auto; max-height: 500px; overflow: hidden; border-radius: 8px; margin-bottom: 40px; border: 1px solid var(--border-color);">
                            <img src="${featuredImg}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        
                        <div style="font-size: 1.05rem; line-height: 1.8; color: var(--text-light); white-space: pre-wrap; font-family: var(--font-body);">
                            ${article.content}
                        </div>
                    </div>
                `;
            } catch (err) {
                console.error("Gagal memuat detail artikel:", err);
                insightDetailContent.innerHTML = '<p style="color:red; text-align:center;">Gagal terhubung ke database server.</p>';
            }
        }
        fetchInsightDetail();
    }
});