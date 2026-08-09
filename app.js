document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const STORAGE_KEY_REFLECTIONS = 'transform_life_reflections';
    const STORAGE_KEY_LAST_DATE = 'transform_life_last_date';
    const STORAGE_KEY_THEME = 'transform_life_theme';

    // Hardcoded verified Google Apps Script Web App URL for direct public submissions to Google Sheet
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwn1tGsys00gLzpZQveTyLvKlvRgEksGPSYyiVjmSfkhQu3g-FV_g2Tgi-8DGxHvfrs/exec';
    let reflections = JSON.parse(localStorage.getItem(STORAGE_KEY_REFLECTIONS)) || [];
    
    // Set initial theme
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // --- DOM Elements ---
    const musicToggleBtn = document.getElementById('music-toggle');
    const eqBars = document.getElementById('eq-bars');
    const musicIconOff = document.getElementById('music-icon-off');

    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentDateEl = document.getElementById('current-date');

    const formCard = document.getElementById('form-card');
    const completedCard = document.getElementById('completed-card');
    const reflectionForm = document.getElementById('reflection-form');
    const fullNameInput = document.getElementById('fullName');
    const bibleVerseInput = document.getElementById('bibleVerse');
    const reflectionInput = document.getElementById('reflection');
    const submitBtn = document.getElementById('submit-btn');

    const previewName = document.getElementById('preview-name');
    const previewVerse = document.getElementById('preview-verse');
    const previewReflection = document.getElementById('preview-reflection');
    const editTodayBtn = document.getElementById('edit-today-btn');
    const countdownTimerEl = document.getElementById('countdown-timer');

    const historyList = document.getElementById('history-list');
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');

    // ========================================================
    // GUARANTEED LOCAL AUDIO PLAYER (Acoustic Guitar & Piano)
    // ========================================================
    let isMusicPlaying = false;
    
    // Local Audio File (acoustic_guitar_piano.wav)
    const bgAudio = new Audio('acoustic_guitar_piano.wav');
    bgAudio.loop = true;
    bgAudio.volume = 0.55; // Clear, comfortable volume level

    // Backup Web Audio API Synthesizer Engine
    let audioCtx = null;
    let musicInterval = null;
    let masterGain = null;

    const guitarPianoChords = [
        { piano: [261.63, 329.63, 392.00], guitar: [130.81, 196.00, 261.63, 329.63] },
        { piano: [196.00, 246.94, 293.66], guitar: [98.00, 146.83, 196.00, 246.94] },
        { piano: [220.00, 261.63, 329.63], guitar: [110.00, 164.81, 220.00, 261.63] },
        { piano: [174.61, 220.00, 261.63], guitar: [87.31, 130.81, 174.61, 220.00] }
    ];

    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0.4, audioCtx.currentTime); // Audible gain
            masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playAcousticGuitarPluck(freq, delaySec = 0) {
        if (!audioCtx || !isMusicPlaying) return;
        const now = audioCtx.currentTime + delaySec;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 1.8);
    }

    function playSoftPianoChord(freqs) {
        if (!audioCtx || !isMusicPlaying) return;
        const now = audioCtx.currentTime;

        freqs.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.6);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 4.5);
        });
    }

    let chordStep = 0;
    function playNextGuitarPianoSequence() {
        if (!isMusicPlaying) return;
        const item = guitarPianoChords[chordStep];
        playSoftPianoChord(item.piano);
        item.guitar.forEach((freq, idx) => {
            playAcousticGuitarPluck(freq, idx * 0.35);
        });
        chordStep = (chordStep + 1) % guitarPianoChords.length;
    }

    async function toggleMusic() {
        isMusicPlaying = !isMusicPlaying;

        if (isMusicPlaying) {
            musicToggleBtn.classList.add('playing');
            eqBars.classList.remove('hidden');
            musicIconOff.classList.add('hidden');

            try {
                // Play local WAV file
                bgAudio.currentTime = 0;
                await bgAudio.play();
                showToast('Playing acoustic guitar & soft piano 🎸🎹');
            } catch (err) {
                console.log('Using synth fallback:', err);
                initAudioContext();
                playNextGuitarPianoSequence();
                if (musicInterval) clearInterval(musicInterval);
                musicInterval = setInterval(playNextGuitarPianoSequence, 4000);
                showToast('Playing acoustic guitar & soft piano 🎸🎹');
            }
        } else {
            musicToggleBtn.classList.remove('playing');
            eqBars.classList.add('hidden');
            musicIconOff.classList.remove('hidden');

            bgAudio.pause();
            if (musicInterval) clearInterval(musicInterval);
            showToast('Music paused 🔇');
        }
    }

    musicToggleBtn.addEventListener('click', toggleMusic);

    // ========================================================
    // DAILY BIBLE VERSE CAROUSEL SLIDER LOGIC
    // ========================================================
    const carouselSlides = [
        {
            image: 'slide1.png',
            tag: 'ព្រះបន្ទូលប្រចាំថ្ងៃ • Daily Bread',
            title: 'រៀន និងលូតលាស់ក្នុងព្រះបន្ទូលរៀងរាល់ថ្ងៃ',
            subtitle: "Learn and transform your life daily through God's Word",
            passage: '"ដ្បិតព្រះទ្រង់ស្រឡាញ់មនុស្សលោកដល់ម៉្លេះ បានជាទ្រង់ប្រទានព្រះរាជបុត្រាទ្រង់តែមួយ ដើម្បីឲ្យអ្នកណាដែលជឿដល់ព្រះរាជបុត្រានោះ មិនត្រូវវិនាសឡើយ..."',
            reference: 'យ៉ូហាន ៣:១៦ (John 3:16)'
        },
        {
            image: 'slide2.jpg',
            tag: 'ព្រះបន្ទូលប្រចាំថ្ងៃ • Encouragement',
            title: 'ព្រះជាម្ចាស់ជាអ្នកគង្វាលរបស់ខ្ញុំ',
            subtitle: 'The Lord is my shepherd; I shall not want.',
            passage: '"ព្រះយេហូវ៉ាទ្រង់ជាអ្នកគង្វាលខ្ញុំ ខ្ញុំនឹងមិនខ្វះអ្វីឡើយ ទ្រង់ឲ្យខ្ញុំដេកសម្រាកនៅទីវាលស្មៅខៀវខ្ចី..."',
            reference: 'ទំនុកដំកើង ២៣:១ (Psalm 23:1)'
        },
        {
            image: 'slide3.jpg',
            tag: 'ព្រះបន្ទូលប្រចាំថ្ងៃ • Strength & Faith',
            title: 'ខ្ញុំអាចធ្វើអ្វីៗទាំងអស់បាន ដោយសារព្រះអង្គ',
            subtitle: 'I can do all things through Christ who strengthens me.',
            passage: '"ខ្ញុំអាចធ្វើអ្វីៗទាំងអស់បាន ដោយសារព្រះអង្គដែលប្រទានកម្លាំងដល់ខ្ញុំ..."',
            reference: 'ភីលីព ៤:១៣ (Philippians 4:13)'
        },
        {
            image: 'slide4.jpg',
            tag: 'ព្រះបន្ទូលប្រចាំថ្ងៃ • Hope & Peace',
            title: 'ទីពឹង និងសេចក្តីសង្ឃឹម',
            subtitle: 'Trust in the Lord with all your heart.',
            passage: '"ចៅហ្វាយនាយនៃសេចក្តីសុខសាន្ត ចូលទីពឹងលើព្រះយេហូវ៉ាឲ្យអស់អំពីចិត្ត ចែកុំអាស្រ័យលើការយល់ដឹងរបស់ខ្លួនឡើយ..."',
            reference: 'សុភាសិត ៣:៥-៦ (Proverbs 3:5-6)'
        }
    ];

    let currentSlideIndex = 0;
    const carouselImg = document.querySelector('.carousel-img');
    const slideTag = document.getElementById('slide-tag');
    const slideTitle = document.getElementById('slide-title');
    const slideSubtitle = document.getElementById('slide-subtitle');
    const slidePassage = document.getElementById('slide-passage');
    const slideReference = document.getElementById('slide-reference');
    const sliderPrevBtn = document.getElementById('slider-prev');
    const sliderNextBtn = document.getElementById('slider-next');
    const dotsContainer = document.getElementById('carousel-dots');
    const useVerseBtn = document.getElementById('use-verse-btn');

    function updateCarousel(index) {
        currentSlideIndex = (index + carouselSlides.length) % carouselSlides.length;
        const slide = carouselSlides[currentSlideIndex];

        // Smooth image and text transition
        const contentArea = document.querySelector('.carousel-slide-inner');
        carouselImg.style.opacity = '0.3';
        carouselImg.style.transform = 'scale(0.98)';
        contentArea.style.opacity = '0.4';
        contentArea.style.transform = 'translateX(-10px)';

        setTimeout(() => {
            carouselImg.src = slide.image;
            slideTag.textContent = slide.tag;
            slideTitle.textContent = slide.title;
            slideSubtitle.textContent = slide.subtitle;
            slidePassage.textContent = slide.passage;
            slideReference.textContent = slide.reference;

            carouselImg.style.opacity = '1';
            carouselImg.style.transform = 'scale(1)';
            contentArea.style.opacity = '1';
            contentArea.style.transform = 'translateX(0)';
        }, 200);

        // Update Dots
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            if (idx === currentSlideIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    sliderNextBtn.addEventListener('click', () => {
        updateCarousel(currentSlideIndex + 1); // Move Left
    });

    sliderPrevBtn.addEventListener('click', () => {
        updateCarousel(currentSlideIndex - 1); // Move Right
    });

    dotsContainer.querySelectorAll('.dot').forEach((dot, idx) => {
        dot.addEventListener('click', () => updateCarousel(idx));
    });

    // Touch Swipe Support (Move Left to next slide)
    let touchStartX = 0;
    let touchEndX = 0;
    const carouselCard = document.querySelector('.verse-carousel-card');

    carouselCard.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    carouselCard.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 40) {
            // Swiped Left -> Next Slide
            updateCarousel(currentSlideIndex + 1);
        } else if (touchEndX - touchStartX > 40) {
            // Swiped Right -> Prev Slide
            updateCarousel(currentSlideIndex - 1);
        }
    });

    // Auto-fill selected verse into Question 2
    useVerseBtn.addEventListener('click', () => {
        const slide = carouselSlides[currentSlideIndex];
        bibleVerseInput.value = slide.reference;

        if (!formCard.classList.contains('hidden')) {
            bibleVerseInput.focus();
            bibleVerseInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast(`Selected: ${slide.reference}`);
        } else {
            showToast('You have already completed today\'s entry!');
        }
    });

    // --- Date Utilities ---
    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatFriendlyDate(dateObj = new Date()) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return dateObj.toLocaleDateString('km-KH', options) || dateObj.toDateString();
    }

    currentDateEl.textContent = formatFriendlyDate();

    // --- Theme Toggle ---
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    });

    // --- One Day One Time Rule Check ---
    function checkDailyStatus() {
        const todayStr = getTodayString();
        const lastSubmittedDate = localStorage.getItem(STORAGE_KEY_LAST_DATE);

        if (lastSubmittedDate === todayStr) {
            // User already completed today! Find today's entry
            const todayEntry = reflections.find(r => r.dateStr === todayStr);
            showCompletedState(todayEntry);
        } else {
            // Show form for new entry
            formCard.classList.remove('hidden');
            completedCard.classList.add('hidden');
        }
    }

    function showCompletedState(entry) {
        formCard.classList.add('hidden');
        completedCard.classList.remove('hidden');

        if (entry) {
            previewName.textContent = entry.fullName;
            previewVerse.textContent = entry.bibleVerse;
            previewReflection.textContent = entry.reflection;
        }

        startCountdownTimer();
    }

    // --- Countdown Timer to Midnight ---
    let timerInterval = null;
    function startCountdownTimer() {
        if (timerInterval) clearInterval(timerInterval);

        function updateTimer() {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0); // 12:00 AM next day

            const diffMs = midnight - now;
            if (diffMs <= 0) {
                // Reset at midnight
                localStorage.removeItem(STORAGE_KEY_LAST_DATE);
                checkDailyStatus();
                return;
            }

            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

            countdownTimerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    // --- Form Submission ---
    reflectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = fullNameInput.value.trim();
        const bibleVerse = bibleVerseInput.value.trim();
        const reflection = reflectionInput.value.trim();
        const todayStr = getTodayString();

        if (!fullName || !bibleVerse || !reflection) {
            showToast('Please fill out all fields.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Submitting...';

        const payload = {
            id: Date.now().toString(),
            dateStr: todayStr,
            formattedDate: new Date().toLocaleString(),
            fullName,
            bibleVerse,
            reflection
        };

        // Save locally
        reflections = reflections.filter(r => r.dateStr !== todayStr);
        reflections.unshift(payload);
        localStorage.setItem(STORAGE_KEY_REFLECTIONS, JSON.stringify(reflections));
        localStorage.setItem(STORAGE_KEY_LAST_DATE, todayStr);

        // Submit to Google Sheets via Webhook URL
        try {
            const payloadBlob = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=utf-8' });
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                body: payloadBlob
            });
            showToast('បានផ្ញើទៅ Google Sheet រួចរាល់! (Submitted to Google Sheet)');
        } catch (err) {
            console.error('Webhook error:', err);
            showToast('Submission recorded!');
        }

        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Submit Reflection';
        reflectionForm.reset();

        renderHistory();
        showCompletedState(payload);
    });

    // --- Edit Today's Entry ---
    editTodayBtn.addEventListener('click', () => {
        const todayStr = getTodayString();
        const todayEntry = reflections.find(r => r.dateStr === todayStr);

        if (todayEntry) {
            fullNameInput.value = todayEntry.fullName;
            bibleVerseInput.value = todayEntry.bibleVerse;
            reflectionInput.value = todayEntry.reflection;
        }

        completedCard.classList.add('hidden');
        formCard.classList.remove('hidden');
        formCard.scrollIntoView({ behavior: 'smooth' });
    });

    // --- History List Rendering ---
    function renderHistory() {
        if (reflections.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No past reflections yet.</div>';
            return;
        }

        historyList.innerHTML = reflections.map(item => `
            <div class="history-item">
                <div class="history-top">
                    <span class="history-verse">${escapeHtml(item.bibleVerse)}</span>
                    <span class="history-date">${item.formattedDate}</span>
                </div>
                <div class="history-text">
                    <strong>${escapeHtml(item.fullName)}:</strong> ${escapeHtml(item.reflection)}
                </div>
            </div>
        `).join('');
    }

    // --- Toast Utility ---
    function showToast(message) {
        toastText.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3500);
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // Initialize
    updateCarousel(0);
    renderHistory();
    checkDailyStatus();
});
