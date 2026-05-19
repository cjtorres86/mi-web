// ============================================
// 1. MENÚ HAMBURGUESA PARA MÓVILES
// ============================================
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// ============================================
// 2. DESPLAZAMIENTO SUAVE (SCROLL ELEGANTE)
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        const headerOffset = 80;
        const startPosition = window.pageYOffset;
        const targetPosition = targetElement.getBoundingClientRect().top + startPosition - headerOffset;
        const distance = targetPosition - startPosition;
        const duration = 1300;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            const easeProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            window.scrollTo(0, startPosition + distance * easeProgress);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    });
});

// ============================================
// 3. ACORDEÓN DE EXPERIENCIA
// ============================================
document.querySelectorAll('.acordeon-header').forEach(header => {
    header.addEventListener('click', () => {
        const acordeonItem = header.parentElement;
        const isActive = acordeonItem.classList.contains('active');
        document.querySelectorAll('.acordeon-item').forEach(item => {
            item.classList.remove('active');
        });
        if (!isActive) {
            acordeonItem.classList.add('active');
        }
    });
});

// ============================================
// 4. CARRUSEL INFINITO
// ============================================
const track = document.getElementById('carruselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const indicadoresContainer = document.getElementById('indicadores');

let currentIndex = 0;
let isAnimating = false;
let totalOriginalCards = 3;
let gap = 16;

const originalCards = Array.from(document.querySelectorAll('.carrusel-track .proyecto-card:not(.clone)'));
totalOriginalCards = originalCards.length;
const originalHTML = originalCards.map(card => card.outerHTML);

function buildCarousel() {
    track.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        originalHTML.forEach(html => {
            const div = document.createElement('div');
            div.innerHTML = html;
            const card = div.firstChild;
            card.classList.add('clone');
            track.appendChild(card);
        });
    }
    currentIndex = Math.floor(track.children.length / 2);
    updateCenterClass();
    generateIndicators();
    setTimeout(() => { centrarTarjetaInstantaneo(); }, 50);
}

function centrarTarjetaInstantaneo() {
    const cards = document.querySelectorAll('.carrusel-track .proyecto-card');
    const container = document.querySelector('.carrusel-wrapper');
    if (cards.length === 0) return;
    const containerWidth = container.clientWidth;
    const currentCard = cards[currentIndex];
    const currentCardWidth = currentCard.offsetWidth;
    let accumulated = 0;
    for (let i = 0; i < currentIndex; i++) {
        accumulated += cards[i].offsetWidth + gap;
    }
    const centerOffset = (containerWidth - currentCardWidth) / 2;
    const translateX = -(accumulated - centerOffset);
    track.style.transition = 'none';
    track.style.transform = `translateX(${translateX}px)`;
    track.offsetHeight;
}

function centrarTarjetaAnimado() {
    const cards = document.querySelectorAll('.carrusel-track .proyecto-card');
    const container = document.querySelector('.carrusel-wrapper');
    if (cards.length === 0) return;
    const containerWidth = container.clientWidth;
    const currentCard = cards[currentIndex];
    const currentCardWidth = currentCard.offsetWidth;
    let accumulated = 0;
    for (let i = 0; i < currentIndex; i++) {
        accumulated += cards[i].offsetWidth + gap;
    }
    const centerOffset = (containerWidth - currentCardWidth) / 2;
    const translateX = -(accumulated - centerOffset);
    track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    track.style.transform = `translateX(${translateX}px)`;
}

function updateCenterClass() {
    const cards = document.querySelectorAll('.carrusel-track .proyecto-card');
    cards.forEach((card, idx) => {
        card.classList.remove('proyecto-centro');
        if (idx === currentIndex) {
            card.classList.add('proyecto-centro');
        }
    });
    updateIndicators();
}

function nextSlide() {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex++;
    updateCenterClass();
    setTimeout(() => {
        centrarTarjetaAnimado();
        setTimeout(() => { isAnimating = false; }, 500);
    }, 30);
}

function prevSlide() {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex--;
    updateCenterClass();
    setTimeout(() => {
        centrarTarjetaAnimado();
        setTimeout(() => { isAnimating = false; }, 500);
    }, 30);
}

function generateIndicators() {
    indicadoresContainer.innerHTML = '';
    for (let i = 0; i < totalOriginalCards; i++) {
        const ind = document.createElement('div');
        ind.classList.add('indicador');
        ind.addEventListener('click', () => {
            if (isAnimating) return;
            const baseIndex = Math.floor(currentIndex / totalOriginalCards) * totalOriginalCards;
            currentIndex = baseIndex + i;
            updateCenterClass();
            setTimeout(() => { centrarTarjetaAnimado(); }, 30);
        });
        indicadoresContainer.appendChild(ind);
    }
}

function updateIndicators() {
    const baseIndex = Math.floor(currentIndex / totalOriginalCards) * totalOriginalCards;
    let originalIndex = currentIndex - baseIndex;
    if (originalIndex < 0) originalIndex += totalOriginalCards;
    if (originalIndex >= totalOriginalCards) originalIndex -= totalOriginalCards;
    document.querySelectorAll('.indicador').forEach((ind, i) => {
        if (i === originalIndex) {
            ind.classList.add('active');
        } else {
            ind.classList.remove('active');
        }
    });
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => { centrarTarjetaInstantaneo(); }, 200);
});

prevBtn.addEventListener('click', () => { prevSlide(); });
nextBtn.addEventListener('click', () => { nextSlide(); });
buildCarousel();

// ============================================
// 5. EFECTO PARALLAX
// ============================================
function actualizarParallax() {
    const scrollY = window.scrollY;
    const foto = document.querySelector('.hero-foto-circular');
    if (foto) { foto.style.transform = `translateY(${scrollY * 0.15}px)`; }
    const titulo = document.querySelector('.hero h1');
    if (titulo) { titulo.style.transform = `translateY(${scrollY * 0.1}px)`; }
    if (scrollY > 50) {
        document.body.classList.add('scrolled');
    } else {
        document.body.classList.remove('scrolled');
    }
}

let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            actualizarParallax();
            ticking = false;
        });
        ticking = true;
    }
});
actualizarParallax();

// ============================================
// 6. EFECTO DE APARICIÓN DE SECCIONES
// ============================================
const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); }
    });
}, observerOptions);
document.querySelectorAll('.seccion-header').forEach(section => { observer.observe(section); });

// ============================================
// 7. SONIDO ELEGANTE PARA BADGES (CAMPANITA SUAVE)
// ============================================

// Esta función crea un sonido tipo "campanita elegante"
function playElegantClick() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        
        // Nodo principal - tono agudo elegante
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc1.type = 'sine';
        osc1.frequency.value = 620; // Tono inicial (campanita)
        gain1.gain.setValueAtTime(0.12, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        osc1.frequency.setValueAtTime(620, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.12);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.18);
        
        // Nodo secundario - armónico para más riqueza
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.type = 'sine';
        osc2.frequency.value = 780;
        gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
        osc2.frequency.setValueAtTime(780, ctx.currentTime + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(620, ctx.currentTime + 0.1);
        osc2.start(ctx.currentTime + 0.02);
        osc2.stop(ctx.currentTime + 0.14);
        
        setTimeout(() => { ctx.close(); }, 200);
    } catch(e) { 
        console.log('Audio no disponible'); 
    }
}

// Activar sonido al pasar el mouse sobre badges
const badgesList = document.querySelectorAll('.badge');
let audioAllowed = false;

function enableAudio() {
    if (audioAllowed) return;
    audioAllowed = true;
    playElegantClick();
    console.log('🎵 Sonido campanita activado');
}

// Agregar evento a todos los badges
badgesList.forEach(badge => {
    badge.addEventListener('mouseenter', () => {
        if (audioAllowed) {
            playElegantClick();
        }
    });
});

// Activar audio con el primer clic en cualquier badge
badgesList.forEach(badge => {
    badge.addEventListener('click', () => {
        if (!audioAllowed) {
            enableAudio();
        }
    });
});

// También activar con cualquier clic en la página
document.body.addEventListener('click', () => {
    if (!audioAllowed) {
        enableAudio();
    }
}, { once: true });

console.log('🎵 Sistema de sonido campanita listo. Haz clic en cualquier badge para activar.');

// ============================================
// 8. MODO OSCURO / CLARO (SIEMPRE INICIA EN CLARO)
// ============================================
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Forzar modo claro al cargar la página (ignorar cualquier preferencia guardada)
localStorage.removeItem('theme');
body.classList.remove('dark-mode');
themeToggle.checked = false;

// Función para cambiar tema (el usuario puede activar oscuro si quiere)
function toggleTheme() {
    if (themeToggle.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
}

themeToggle.addEventListener('change', toggleTheme);