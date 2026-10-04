// js/slider.js

document.addEventListener("DOMContentLoaded", () => {
    // Cari semua elemen yang dibungkus dengan class 'slider-container'
    const sliders = document.querySelectorAll('.slider-container');
    
    sliders.forEach(slider => {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing'; // Ubah kursor saat ditarik
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault(); 
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Angka 2 adalah kecepatan geser
            slider.scrollLeft = scrollLeft - walk;
        });
    });
});