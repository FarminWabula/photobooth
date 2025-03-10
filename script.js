// Ambil elemen video, canvas, dan tombol
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snap = document.getElementById('snap');
const burst = document.getElementById('burst');
const filterSelect = document.getElementById('filter');
const gallery = document.getElementById('gallery');
const timer = document.getElementById('timer');

let currentFilter = 'none';
let burstPhotos = []; // Menyimpan foto dari mode burst
let countdownInterval; // Untuk mengatur interval countdown

// Akses webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        video.srcObject = stream;
    })
    .catch((err) => {
        console.error("Error accessing the webcam: ", err);
    });

// Ambil foto
snap.addEventListener('click', () => {
    takePhoto();
    snap.blur(); // Hilangkan fokus dari tombol setelah diklik
});

// Mode burst (ambil 3 foto dengan jeda 3 detik)
burst.addEventListener('click', async () => {
    burstPhotos = []; // Reset array foto burst
    for (let i = 0; i < 3; i++) {
        takePhoto(true); // Ambil foto dan simpan ke array burstPhotos
        if (i < 2) { // Jeda hanya diperlukan antara foto, bukan setelah foto terakhir
            await startCountdown(3); // Mulai countdown 3 detik
        }
    }
    // Setelah semua foto diambil, gabungkan dan tampilkan
    combineBurstPhotos();
    burst.blur(); // Hilangkan fokus dari tombol setelah diklik
});

// Fungsi untuk memulai countdown
function startCountdown(seconds) {
    return new Promise((resolve) => {
        let counter = seconds;
        timer.style.display = 'block'; // Tampilkan timer
        timer.textContent = counter;

        countdownInterval = setInterval(() => {
            counter--;
            timer.textContent = counter;

            if (counter <= 0) {
                clearInterval(countdownInterval);
                timer.style.display = 'none'; // Sembunyikan timer
                resolve();
            }
        }, 1000); // Update setiap 1 detik
    });
}

// Terapkan filter
filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    video.style.filter = getFilterStyle(currentFilter);
});

// Fungsi untuk mendapatkan style filter berdasarkan pilihan
function getFilterStyle(filter) {
    switch (filter) {
        case 'grayscale':
            return 'grayscale(100%)';
        case 'sepia':
            return 'sepia(100%)';
        case 'invert':
            return 'invert(100%)';
        case 'blur':
            return 'blur(5px)';
        case 'brightness':
            return 'brightness(150%)';
        case 'contrast':
            return 'contrast(200%)';
        case 'hue-rotate':
            return 'hue-rotate(90deg)';
        case 'saturate':
            return 'saturate(200%)';
        case 'glasses':
            return 'none'; // Filter kacamata akan dihandle secara terpisah
        default:
            return 'none';
    }
}

// Fungsi untuk mengambil foto
function takePhoto(isBurst = false) {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Terapkan filter ke canvas
    context.filter = getFilterStyle(currentFilter);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Jika filter kacamata dipilih, tambahkan gambar kacamata
    if (currentFilter === 'glasses') {
        const glasses = new Image();
        glasses.src = 'glasses.png'; // Pastikan file glasses.png ada di folder yang sama
        glasses.onload = () => {
            context.drawImage(glasses, 0, 0, canvas.width, canvas.height);
            savePhoto(isBurst);
        };
    } else {
        savePhoto(isBurst);
    }
}

// Fungsi untuk menyimpan foto
function savePhoto(isBurst) {
    const imageData = canvas.toDataURL('image/png');

    if (isBurst) {
        // Simpan foto ke array burstPhotos
        burstPhotos.push(imageData);
    } else {
        // Tampilkan foto di gallery
        displayPhoto(imageData);
    }
}

// Fungsi untuk menampilkan foto di gallery
function displayPhoto(imageData) {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'gallery-item';

    const img = document.createElement('img');
    img.src = imageData;

    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Download';
    downloadBtn.className = 'download-btn';
    downloadBtn.addEventListener('click', () => {
        downloadImage(imageData);
    });

    imgContainer.appendChild(img);
    imgContainer.appendChild(downloadBtn);
    gallery.appendChild(imgContainer);

    // Scroll ke bawah galeri secara otomatis
    gallery.scrollTop = gallery.scrollHeight;
}

// Fungsi untuk menggabungkan foto burst menjadi satu gambar panjang
function combineBurstPhotos() {
    const combinedCanvas = document.createElement('canvas');
    const context = combinedCanvas.getContext('2d');

    // Ukuran canvas gabungan
    const photoWidth = video.videoWidth;
    const photoHeight = video.videoHeight;
    combinedCanvas.width = photoWidth;
    combinedCanvas.height = photoHeight * burstPhotos.length;

    // Gambar setiap foto ke canvas gabungan
    burstPhotos.forEach((photo, index) => {
        const img = new Image();
        img.src = photo;
        img.onload = () => {
            context.drawImage(img, 0, index * photoHeight, photoWidth, photoHeight);
            // Jika ini adalah foto terakhir, tampilkan dan tambahkan tombol download
            if (index === burstPhotos.length - 1) {
                const combinedImageData = combinedCanvas.toDataURL('image/png');
                displayPhoto(combinedImageData);
            }
        };
    });
}

// Fungsi untuk mendownload gambar
function downloadImage(imageData) {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `photobooth-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}