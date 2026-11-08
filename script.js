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
            item.querySelector('.acordeon-header')?.setAttribute('aria-expanded', 'false');
        });
        if (!isActive) {
            acordeonItem.classList.add('active');
            header.setAttribute('aria-expanded', 'true');
        }
    });
});

// ============================================
// 4. RULETA DE PROYECTOS (3D)
//    Flechas, puntos, teclado (← →), arrastre y clic en la tarjeta lateral.
//    Avanza sola cada 7 s; se pausa al pasar el mouse o al interactuar.
// ============================================
(() => {
    const ruleta = document.getElementById('ruleta');
    const escena = document.getElementById('ruletaEscena');
    if (!ruleta || !escena) return;
    const tarjetas = [...escena.querySelectorAll('.proy')];
    const puntos = [...document.querySelectorAll('#ruletaPuntos button')];
    const n = tarjetas.length;
    let actual = 0;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function pintar() {
        tarjetas.forEach((t, i) => {
            const off = (i - actual + n) % n;
            t.classList.remove('centro', 'izq', 'der');
            t.classList.add(off === 0 ? 'centro' : off === 1 ? 'der' : 'izq');
            t.setAttribute('aria-hidden', off === 0 ? 'false' : 'true');
        });
        puntos.forEach((p, i) => p.setAttribute('aria-selected', String(i === actual)));
    }

    function ir(i, porUsuario) {
        actual = (i + n) % n;
        pintar();
        if (porUsuario && typeof Sonido !== 'undefined') Sonido.tono(Sonido.NOTAS[actual + 3], 0.04, 0.3);
    }

    document.getElementById('ruletaPrev').addEventListener('click', () => ir(actual - 1, true));
    document.getElementById('ruletaNext').addEventListener('click', () => ir(actual + 1, true));
    puntos.forEach(p => p.addEventListener('click', () => ir(+p.dataset.ir, true)));

    // Clic en una tarjeta lateral la trae al frente
    tarjetas.forEach((t, i) => t.addEventListener('click', () => {
        if (arrastro) return;
        if (!t.classList.contains('centro')) ir(i, true);
    }));

    // Arrastre / deslizar
    let x0 = null, arrastro = false;
    escena.addEventListener('pointerdown', e => { x0 = e.clientX; arrastro = false; escena.classList.add('arrastrando'); });
    window.addEventListener('pointerup', e => {
        if (x0 === null) return;
        const dx = e.clientX - x0;
        escena.classList.remove('arrastrando');
        if (Math.abs(dx) > 50) { arrastro = true; ir(actual + (dx < 0 ? 1 : -1), true); setTimeout(() => { arrastro = false; }, 50); }
        x0 = null;
    });

    // Teclado ← → cuando la sección está en pantalla
    window.addEventListener('keydown', e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const r = ruleta.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        e.preventDefault();
        ir(actual + (e.key === 'ArrowRight' ? 1 : -1), true);
    });

    // Avance automático: lo marca la barra de progreso del punto activo
    if (!reducido) {
        puntos.forEach(p => p.addEventListener('animationend', () => {
            if (p.getAttribute('aria-selected') === 'true') ir(actual + 1, false);
        }));
    }
    ruleta.addEventListener('mouseenter', () => ruleta.classList.add('pausada'));
    ruleta.addEventListener('mouseleave', () => ruleta.classList.remove('pausada'));

    pintar();
})();

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
// 7. SONIDO PREMIUM DE LA INTERFAZ
//    Tonos cortos (menos de 300 ms), volumen bajo, una sola familia de
//    notas (escala pentatónica) y un eco muy leve. Se activa con el primer
//    clic del visitante y se puede apagar con el botón del altavoz.
// ============================================
const Sonido = (() => {
    let ctx = null, salida = null, eco = null;
    // Siempre parte con el sonido apagado; el visitante lo activa con el altavoz
    let activo = false;

    // Pentatónica mayor (Do-Re-Mi-Sol-La) en registro medio-agudo
    const NOTAS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

    // Saxofón tenor REAL: notas grabadas (Freesound, "Tenor Sax Stacatto" de clruwe,
    // licencia CC BY 4.0). Escala pentatónica de Re menor armada con 6 grabaciones;
    // las notas intermedias se obtienen afinando levemente la grabación más cercana.
    const ARCHIVOS = ['d2', 'f2'];
    // Registro más grave del saxo: solo las dos grabaciones más bajas (d2 y f2),
    // con ajustes de pocos semitonos para completar la escala pentatónica.
    const ESCALA_SAX = [
        ['d2', -5], ['d2', -2], ['d2', 0], ['f2', 0], ['f2', 2],
        ['f2', 4], ['d2', 5], ['d2', 7], ['f2', -2], ['d2', -7]
    ];
    const muestras = {};
    let cargando = false;
    function cargarMuestras() {
        if (cargando || !ctx) return;
        cargando = true;
        ARCHIVOS.forEach(n => {
            fetch('sonidos/sax-tenor-' + n + '.mp3')
                .then(r => r.arrayBuffer())
                .then(b => ctx.decodeAudioData(b))
                .then(buf => { muestras[n] = buf; })
                .catch(() => {});
        });
    }

    // Toca la nota i de la escala con el saxo real (o un tono sintético si aún no carga)
    function sax(i, vol = 0.34, dur = 1.6) {
        if (!listo()) return;
        const [n, semis] = ESCALA_SAX[((i % ESCALA_SAX.length) + ESCALA_SAX.length) % ESCALA_SAX.length];
        const buf = muestras[n];
        if (!buf) return tonoSint(NOTAS[i % NOTAS.length]);
        const t = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = Math.pow(2, semis / 12);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.setValueAtTime(vol, t + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(g);
        g.connect(salida);
        src.start(t);
        src.stop(t + dur + 0.05);
    }

    function iniciar() {
        if (ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        salida = ctx.createGain();
        salida.gain.value = 0.9;
        const filtro = ctx.createBiquadFilter();
        filtro.type = 'lowpass';
        filtro.frequency.value = 5200;
        // Eco corto generado (sin archivos externos)
        eco = ctx.createConvolver();
        const largo = ctx.sampleRate * 1.3;
        const ir = ctx.createBuffer(2, largo, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = ir.getChannelData(c);
            for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.2);
        }
        eco.buffer = ir;
        const ecoGain = ctx.createGain();
        ecoGain.gain.value = 0.2;
        salida.connect(filtro);
        filtro.connect(ctx.destination);
        filtro.connect(eco);
        eco.connect(ecoGain);
        ecoGain.connect(ctx.destination);
        cargarMuestras();
    }

    function listo() {
        if (!activo || !ctx) return false;
        if (ctx.state === 'suspended') ctx.resume();
        return true;
    }

    // Tono tipo "cristal": seno + armónico suave, ataque rápido y caída corta
    function tonoSint(freq, vol = 0.045, dur = 0.26) {
        if (!listo()) return;
        const t = ctx.currentTime;
        [[freq, 'sine', vol], [freq * 2, 'sine', vol * 0.18], [freq / 2, 'triangle', vol * 0.25]].forEach(([f, tipo, v]) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = tipo;
            osc.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(v, t + 0.006);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(g);
            g.connect(salida);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        });
    }

    // Clic suave: pequeño golpe filtrado + tono grave muy corto
    function clic() {
        if (!listo()) return;
        const t = ctx.currentTime;
        const n = ctx.sampleRate * 0.02;
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
        const ruido = ctx.createBufferSource();
        ruido.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2200;
        bp.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.value = 0.05;
        ruido.connect(bp); bp.connect(g); g.connect(salida);
        ruido.start(t);
        tonoSint(392, 0.02, 0.08);
    }

    function setActivo(v) {
        activo = v;
        try { localStorage.setItem('sonido', v ? 'on' : 'off'); } catch (e) {}
    }

    // API pública: tono(índice) toca la nota del saxo; NOTAS son índices de la escala
    function tono(i, vol, dur) { sax(i, vol === undefined ? undefined : vol * 7, dur === undefined ? undefined : Math.max(dur * 2.6, 1.4)); }
    return { iniciar, tono, clic, NOTAS: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], setActivo, get activo() { return activo; } };
})();

// El navegador solo permite audio después de una interacción
['pointerdown', 'keydown'].forEach(ev =>
    window.addEventListener(ev, () => Sonido.iniciar(), { once: true, passive: true })
);

// Badges: cada uno tiene su nota, al pasar el mouse suena una melodía suave
let ultimoTono = 0;
document.querySelectorAll('.badge').forEach((badge, i) => {
    badge.addEventListener('mouseenter', () => {
        const ahora = performance.now();
        if (ahora - ultimoTono < 70) return;
        ultimoTono = ahora;
        Sonido.tono(Sonido.NOTAS[i % Sonido.NOTAS.length]);
    });
});

// Clic suave en botones y enlaces
document.querySelectorAll('a, button, .slider').forEach(el =>
    el.addEventListener('click', () => Sonido.clic())
);

// Botón del altavoz
const soundBtn = document.getElementById('sound-toggle');
function pintarSonido() {
    if (!soundBtn) return;
    const on = Sonido.activo;
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Sonido de la interfaz: activado' : 'Sonido de la interfaz: desactivado');
    soundBtn.innerHTML = on ? '<i class="fas fa-volume-low" aria-hidden="true"></i>' : '<i class="fas fa-volume-xmark" aria-hidden="true"></i>';
}
if (soundBtn) {
    soundBtn.addEventListener('click', () => {
        Sonido.setActivo(!Sonido.activo);
        pintarSonido();
        if (Sonido.activo) { Sonido.iniciar(); Sonido.tono(Sonido.NOTAS[5]); }
    });
    pintarSonido();
}

// ============================================
// 7b. EL HERO SE ESCRIBE SOLO: título → bajada → presentación
//     El texto completo está en el HTML (lo leen buscadores y lectores
//     de pantalla); aquí solo se anima su aparición.
// ============================================
(() => {
    const textos = [...document.querySelectorAll('.tipeable')];
    if (!textos.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Ocultar mientras cargan las fuentes, para medir la altura real
    textos.forEach(el => { el.style.visibility = 'hidden'; });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(iniciar);
    function iniciar() {
    textos.forEach(el => { el.style.visibility = ''; });
    const velocidad = { 'hero-titulo': 70, 'hero-tagline': 26, 'hero-descripcion': 15 };

    // Preparar: guardar el HTML, reservar la altura y vaciar
    const tareas = textos.map(el => {
        const html = el.innerHTML;
        const vel = el.classList.contains('cod') ? 14 : (velocidad[el.id] || 18);
        el.style.minHeight = el.offsetHeight + 'px';
        el.setAttribute('aria-label', el.textContent.trim());
        const partes = [];
        el.childNodes.forEach(n => partes.push(
            n.nodeType === 3 ? { texto: n.textContent, molde: null } : { texto: n.textContent, molde: n.cloneNode(false) }
        ));
        el.innerHTML = '';
        return { el, html, partes, vel };
    });

    function escribir(t, listo) {
        let parte = 0, i = 0, nodo = null;
        t.el.classList.add('escribiendo');
        (function paso() {
            if (parte >= t.partes.length) {
                t.el.classList.remove('escribiendo');
                t.el.innerHTML = t.html;
                return listo();
            }
            const actual = t.partes[parte];
            if (i === 0) {
                nodo = actual.molde ? actual.molde.cloneNode(false) : document.createTextNode('');
                t.el.appendChild(nodo);
            }
            i++;
            nodo.textContent = actual.texto.slice(0, i);
            const c = actual.texto[i - 1];
            if (i >= actual.texto.length) { parte++; i = 0; }
            setTimeout(paso, c === '.' || c === ':' ? t.vel * 14 : c === ',' ? t.vel * 6 : t.vel);
        })();
    }

    let n = 0;
    (function siguiente() {
        if (n >= tareas.length) return;
        const t = tareas[n++];
        escribir(t, () => {
            // Al terminar la última línea de código, el cursor queda parpadeando
            if (n >= tareas.length && t.el.classList.contains('cod')) t.el.classList.add('final');
            setTimeout(siguiente, t.el.classList.contains('cod') ? 90 : 300);
        });
    })();
    }
})();

// ============================================
// 7b-2. BADGES: CADA GRUPO EN UNA FILA, AJUSTADO AL ANCHO DE PANTALLA
// ============================================
(() => {
    const cont = document.querySelector('.hero-especialidades');
    if (!cont) return;
    const grupos = [...cont.querySelectorAll('.badge-grupo')];
    function ajustar() {
        if (window.innerWidth <= 768) { cont.style.removeProperty('--escala-badges'); return; }
        cont.style.setProperty('--escala-badges', 1);
        const ancho = cont.clientWidth;
        // Ancho natural de cada fila = suma de sus elementos + espacios
        const anchoFila = g => {
            const hijos = [...g.children];
            const gap = parseFloat(getComputedStyle(g).columnGap) || 0;
            return hijos.reduce((a, h) => a + h.getBoundingClientRect().width, 0) + gap * (hijos.length - 1);
        };
        const maxFila = Math.max(...grupos.map(anchoFila));
        const escala = Math.min(1.12, Math.max(0.6, (ancho - 8) / maxFila));
        cont.style.setProperty('--escala-badges', escala.toFixed(3));
    }
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(ajustar, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
    ajustar();
})();

// ============================================
// 7c. NAVEGACIÓN POR SECCIONES CON EL TECLADO (↓ ↑ / AvPág RePág)
// ============================================
(() => {
    const ids = ['inicio', 'experiencia', 'proyectos', 'contacto'];
    const secciones = ids.map(id => document.getElementById(id)).filter(Boolean);
    const alto = () => (document.querySelector('header')?.offsetHeight || 64);
    function irA(dir) {
        const y = window.scrollY + alto() + 4;
        const tops = secciones.map(s => s.getBoundingClientRect().top + window.scrollY);
        let destino = null;
        if (dir > 0) {
            destino = tops.find(t => t > y + 8);
        } else {
            const previos = tops.filter(t => t < y - 8);
            destino = previos.length ? previos[previos.length - 1] : 0;
        }
        if (destino === undefined || destino === null) return false;
        window.scrollTo({ top: Math.max(0, destino - alto()), behavior: 'smooth' });
        return true;
    }
    window.addEventListener('keydown', (e) => {
        const t = e.target;
        // Solo se ignoran los campos donde se escribe; el switch de tema (checkbox) no bloquea las flechas
        const escribible = t && (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' ||
            (t.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|range)$/i.test(t.type)));
        if (escribible) return;
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        let dir = 0;
        if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1;
        if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1;
        if (!dir) return;
        if (irA(dir)) {
            e.preventDefault();
            if (typeof Sonido !== 'undefined') { Sonido.iniciar(); Sonido.tono(dir > 0 ? 0 : 2, 0.05, 0.6); }
        }
    });
})();

// ============================================
// 7d. COPIAR CORREO
// ============================================
document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
        const accion = btn.querySelector('.canal-accion');
        try {
            await navigator.clipboard.writeText(btn.dataset.copy);
            const antes = accion.innerHTML;
            accion.innerHTML = '<i class="fas fa-check"></i> Copiado';
            accion.classList.add('copiado');
            setTimeout(() => { accion.innerHTML = antes; accion.classList.remove('copiado'); }, 1800);
        } catch (e) {
            window.location.href = 'mailto:' + btn.dataset.copy;
        }
    });
});

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