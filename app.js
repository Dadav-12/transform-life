document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const STORAGE_KEY_REFLECTIONS = 'transform_life_reflections';
    const STORAGE_KEY_LAST_DATE = 'transform_life_last_date';
    const STORAGE_KEY_THEME = 'transform_life_theme';
    const STORAGE_KEY_STREAK = 'transform_life_streak';
    const STORAGE_KEY_LAST_STREAK_DATE = 'transform_life_last_streak_date';

    // Hardcoded verified Google Apps Script Web App URL for direct public submissions to Google Sheet
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxlCrbYjdcEZsSBKlit0ySRGCk5NUOm0-9CAVT-ct3yir-efw68pKw85pkrjk7I0Ll8/exec';
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

    const viewHome = document.getElementById('view-home');
    const viewBible = document.getElementById('view-bible');
    const viewSubmit = document.getElementById('view-submit');

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

    const streakCountHeader = document.getElementById('streak-count');
    const bannerStreakCount = document.getElementById('banner-streak-count');
    const streakCardCount = document.getElementById('streak-card-count');

    const historyList = document.getElementById('history-list');
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');

    // Navigation DOM Elements
    const navHome = document.getElementById('nav-home');
    const navBible = document.getElementById('nav-bible');
    const navSubmit = document.getElementById('nav-submit');
    const goToSubmitBtn = document.getElementById('go-to-submit-btn');
    const fullPageVersesList = document.getElementById('full-page-daily-verses-list');

    // ========================================================
    // PAGE VIEW SWITCHING LOGIC (Homepage vs Read Bible vs Submission)
    // ========================================================
    function showPage(viewName) {
        viewHome.classList.add('hidden');
        viewBible.classList.add('hidden');
        viewSubmit.classList.add('hidden');

        if (viewName === 'home') {
            viewHome.classList.remove('hidden');
            setActiveNavItem(navHome);
        } else if (viewName === 'bible') {
            viewBible.classList.remove('hidden');
            setActiveNavItem(navBible);
            renderFullPageDailyVerses();
        } else if (viewName === 'submit') {
            viewSubmit.classList.remove('hidden');
            setActiveNavItem(navSubmit);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function setActiveNavItem(selectedNavBtn) {
        [navHome, navBible, navSubmit].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        if (selectedNavBtn) selectedNavBtn.classList.add('active');
    }

    if (navHome) navHome.addEventListener('click', () => showPage('home'));
    if (navBible) navBible.addEventListener('click', () => showPage('bible'));
    if (navSubmit) navSubmit.addEventListener('click', () => showPage('submit'));
    if (goToSubmitBtn) goToSubmitBtn.addEventListener('click', () => showPage('submit'));

    // ========================================================
    // COMPLETE, FULL BIBLE VERSES DATABASE (NO "..." TRUNCATION)
    // ========================================================
    const verseDatabase = [
        {
            image: 'slide1.png',
            tag: 'ថ្ងៃនេះ • Today\'s Verse',
            title: 'សេចក្តីស្រឡាញ់ដ៏អស្ចារ្យនៃព្រះ',
            subtitle: "God's Unconditional Love for the World",
            passage: '"ដ្បិតព្រះទ្រង់ស្រឡាញ់មនុស្សលោកដល់ម៉្លេះ បានជាទ្រង់ប្រទានព្រះរាជបុត្រាទ្រង់តែមួយ ដើម្បីឲ្យអ្នកណាដែលជឿដល់ព្រះរាជបុត្រានោះ មិនត្រូវវិនាសឡើយ គឺឲ្យមានជីវិតអស់កល្បជានិច្ចវិញ។"',
            reference: 'យ៉ូហាន ៣:១៦ (John 3:16)'
        },
        {
            image: 'slide2.jpg',
            tag: 'ខគម្ពីរប្រចាំថ្ងៃ • Encouragement',
            title: 'ព្រះជាម្ចាស់ជាអ្នកគង្វាលរបស់ខ្ញុំ',
            subtitle: 'The Lord is My Shepherd',
            passage: '"ព្រះយេហូវ៉ាទ្រង់ជាអ្នកគង្វាលខ្ញុំ ខ្ញុំនឹងមិនខ្វះអ្វីឡើយ។ ទ្រង់ឲ្យខ្ញុំដេកសម្រាកនៅទីវាលស្មៅខៀវខ្ចី ហើយទ្រង់នាំខ្ញុំទៅឯក្បែរទឹកស្ងប់។"',
            reference: 'ទំនុកដំកើង ២៣:១-២ (Psalm 23:1-2)'
        },
        {
            image: 'slide3.jpg',
            tag: 'ខគម្ពីរប្រចាំថ្ងៃ • Strength & Faith',
            title: 'ខ្ញុំអាចធ្វើអ្វីៗទាំងអស់បាន ដោយសារព្រះអង្គ',
            subtitle: 'Strength Through Christ',
            passage: '"ខ្ញុំអាចធ្វើអ្វីៗទាំងអស់បាន ដោយសារព្រះអង្គដែលប្រទានកម្លាំងដល់ខ្ញុំ។"',
            reference: 'ភីលីព ៤:១៣ (Philippians 4:13)'
        },
        {
            image: 'slide4.jpg',
            tag: 'ខគម្ពីរប្រចាំថ្ងៃ • Hope & Peace',
            title: 'ទីពឹង និងសេចក្តីសង្ឃឹម',
            subtitle: 'Trust in the Lord With All Your Heart',
            passage: '"ចូលទីពឹងលើព្រះយេហូវ៉ាឲ្យអស់អំពីចិត្ត ចែកុំអាស្រ័យលើការយល់ដឹងរបស់ខ្លួនឡើយ។ ត្រូវឲ្យស្គាល់ទ្រង់នៅគ្រប់ទាំងផ្លូវរបស់អ្នក ហើយទ្រង់នឹងតម្រង់ផ្លូវតូចធំរបស់អ្នក។"',
            reference: 'សុភាសិត ៣:៥-៦ (Proverbs 3:5-6)'
        },
        {
            image: 'slide1.png',
            tag: 'ខគម្ពីរប្រចាំថ្ងៃ • Hope & Future',
            title: 'គម្រោងការណ៍ដ៏មានសេចក្តីសុខសាន្ត',
            subtitle: 'Plans to Prosper and Give You Hope',
            passage: '"ដ្បិតព្រះយេហូវ៉ាទ្រង់មានព្រះបន្ទូលថា៖ អញដឹងគំនិតដែលអញគិតពីអ្នករាល់គ្នា គឺជានិមិត្តរូបនៃសេចក្តីសុខសាន្ត មិនមែនជាសេចក្តីអាក្រក់ឡើយ ដើម្បីឲ្យអ្នករាល់គ្នាមានសេចក្តីសង្ឃឹមនៅចុងបញ្ចប់។"',
            reference: 'យេរេមា ២៩:១១ (Jeremiah 29:11)'
        },
        {
            image: 'slide2.jpg',
            tag: 'ខគម្ពីរប្រចាំថ្ងៃ • Protection & Courage',
            title: 'កុំភ័យខ្លាចឡើយ ដ្បិតព្រះគង់ជាមួយ',
            subtitle: 'Do Not Fear, For I Am With You',
            passage: '"កុំភ័យខ្លាចឡើយ ដ្បិតអញគង់ជាមួយនឹងអ្នក។ កុំរន្ធត់ចិត្តឡើយ ដ្បិតអញជាព្រះនៃអ្នក។ អញនឹងចម្រើនកម្លាំងដល់អ្នក អញនឹងជួយអ្នក ហើយអញនឹងទ្រទ្រង់អ្នកដោយដៃស្តាំនៃសេចក្តីសុចរិតរបស់អញ។"',
            reference: 'អេសាយ ៤១:១០ (Isaiah 41:10)'
        }
    ];

    function renderFullPageDailyVerses() {
        if (!fullPageVersesList) return;

        fullPageVersesList.innerHTML = verseDatabase.map((v, idx) => `
            <div class="full-verse-card">
                <div class="full-verse-header">
                    <span class="full-verse-badge">${v.tag}</span>
                    <span class="full-verse-ref">${v.reference}</span>
                </div>
                <div class="full-verse-title">${v.title}</div>
                <div class="full-verse-body">${v.passage}</div>
                <div class="full-verse-action">
                    <button class="use-verse-button select-full-verse-btn" data-ref="${v.reference}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>ជ្រើសរើសខនេះ (Use This Verse)</span>
                    </button>
                </div>
            </div>
        `).join('');

        fullPageVersesList.querySelectorAll('.select-full-verse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ref = btn.getAttribute('data-ref');
                bibleVerseInput.value = ref;
                showPage('submit');
                if (!formCard.classList.contains('hidden')) {
                    bibleVerseInput.focus();
                    bibleVerseInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                showToast(`Selected: ${ref}`);
            });
        });
    }

    function getTodayVerseIndex() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return dayOfYear % verseDatabase.length;
    }

    let currentSlideIndex = getTodayVerseIndex();
    const carouselImg = document.querySelector('.carousel-img');
    const slideTag = document.getElementById('slide-tag');
    const slideTitle = document.getElementById('slide-title');
    const slideSubtitle = document.getElementById('slide-subtitle');
    const slidePassage = document.getElementById('slide-passage');
    const slideReference = document.getElementById('slide-reference');
    const sliderPrevBtn = document.getElementById('slider-prev');
    const sliderNextBtn = document.getElementById('slider-next');
    const dotsContainer = document.getElementById('carousel-dots');

    function updateCarousel(index) {
        currentSlideIndex = (index + verseDatabase.length) % verseDatabase.length;
        const slide = verseDatabase[currentSlideIndex];

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

        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            if (idx === currentSlideIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    sliderNextBtn.addEventListener('click', () => updateCarousel(currentSlideIndex + 1));
    sliderPrevBtn.addEventListener('click', () => updateCarousel(currentSlideIndex - 1));

    dotsContainer.querySelectorAll('.dot').forEach((dot, idx) => {
        dot.addEventListener('click', () => updateCarousel(idx));
    });

    let touchStartX = 0;
    let touchEndX = 0;
    const carouselCard = document.querySelector('.verse-carousel-card');

    carouselCard.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    carouselCard.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 40) {
            updateCarousel(currentSlideIndex + 1);
        } else if (touchEndX - touchStartX > 40) {
            updateCarousel(currentSlideIndex - 1);
        }
    });

    // ========================================================
    // RETROACTIVE STREAK CALCULATION FROM REFLECTION HISTORY
    // ========================================================
    function getDaysDifference(d1Str, d2Str) {
        const d1 = new Date(d1Str);
        const d2 = new Date(d2Str);
        const diffTime = Math.abs(d2 - d1);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    function calculateStreakFromHistory() {
        if (!reflections || reflections.length === 0) {
            return 0;
        }

        const uniqueDates = Array.from(new Set(reflections.map(r => r.dateStr))).sort().reverse();
        if (uniqueDates.length === 0) return 0;

        const todayStr = getTodayString();
        const newestDate = uniqueDates[0];
        const daysFromNewest = getDaysDifference(newestDate, todayStr);

        if (daysFromNewest > 1) {
            return 0;
        }

        let streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const curr = uniqueDates[i];
            const prev = uniqueDates[i + 1];
            const diff = getDaysDifference(prev, curr);
            if (diff === 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    function updateStreakDisplay() {
        let streak = calculateStreakFromHistory();
        if (reflections.length > 0 && streak === 0) {
            streak = reflections.length;
        }

        localStorage.setItem(STORAGE_KEY_STREAK, streak.toString());

        if (streakCountHeader) streakCountHeader.textContent = streak;
        if (bannerStreakCount) bannerStreakCount.textContent = streak;
        if (streakCardCount) streakCardCount.textContent = streak;
    }

    function incrementStreak() {
        updateStreakDisplay();
        return parseInt(localStorage.getItem(STORAGE_KEY_STREAK) || '1', 10);
    }

    // ========================================================
    // GUARANTEED LOCAL AUDIO PLAYER (Acoustic Guitar & Piano)
    // ========================================================
    let isMusicPlaying = false;
    const bgAudio = new Audio('acoustic_guitar_piano.wav');
    bgAudio.loop = true;
    bgAudio.volume = 0.55;

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
            masterGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
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

        updateStreakDisplay();

        if (lastSubmittedDate === todayStr) {
            const todayEntry = reflections.find(r => r.dateStr === todayStr);
            showCompletedState(todayEntry);
        } else {
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

        updateStreakDisplay();
        startCountdownTimer();
    }

    // --- Countdown Timer to Midnight ---
    let timerInterval = null;
    function startCountdownTimer() {
        if (timerInterval) clearInterval(timerInterval);

        function updateTimer() {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);

            const diffMs = midnight - now;
            if (diffMs <= 0) {
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

        reflections = reflections.filter(r => r.dateStr !== todayStr);
        reflections.unshift(payload);
        localStorage.setItem(STORAGE_KEY_REFLECTIONS, JSON.stringify(reflections));
        localStorage.setItem(STORAGE_KEY_LAST_DATE, todayStr);

        const currentStreak = incrementStreak();

        try {
            const payloadBlob = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=utf-8' });
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                body: payloadBlob
            });
            showToast(`🔥 ${currentStreak} Day Streak! (Submitted to Google Sheet)`);
        } catch (err) {
            console.error('Webhook error:', err);
            showToast(`🔥 ${currentStreak} Day Streak recorded!`);
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
    showPage('home');
    updateCarousel(currentSlideIndex);
    updateStreakDisplay();
    renderHistory();
    checkDailyStatus();
});
