// ============================================
// 0. CINTAS DEL STACK
//    3 filas. Al inicio cada fila muestra todo, ordenado por división.
//    Clic en el título → muestra una división; cada clic pasa a la
//    siguiente y después de la última vuelve a "todo".
//    Cada serie se repite lo necesario para que la cinta no tenga huecos.
// ============================================
(() => {
    const BARRAS = { media: 1, alta: 2, avanzada: 3 };

    // Ícono + nombre + capa que aparece al pasar el mouse (experiencia o años)
    function prepararBoton(badge) {
        const icono = badge.querySelector('i');
        const nombre = badge.textContent.trim();
        badge.textContent = '';
        if (icono) badge.appendChild(icono);
        const n = document.createElement('span');
        n.className = 'badge-nombre';
        n.textContent = nombre;
        badge.appendChild(n);
        const v = document.createElement('span');
        if (badge.dataset.detalle) {
            v.className = 'badge-nivel exp-edu';
            v.innerHTML = '<span class="exp-texto"><small></small><b></b></span>';
            v.querySelector('small').textContent = badge.dataset.sub || '';
            v.querySelector('b').textContent = badge.dataset.detalle;
            badge.setAttribute('title', nombre + ' · ' + (badge.dataset.sub || '') + ' · ' + badge.dataset.detalle);
        } else {
            const exp = badge.dataset.exp || 'media';
            v.className = 'badge-nivel exp-' + exp;
            v.innerHTML =
                '<span class="barras b' + BARRAS[exp] + '" aria-hidden="true"><i></i><i></i><i></i></span>' +
                '<span class="exp-texto"><small>experiencia</small><b>' + exp.charAt(0).toUpperCase() + exp.slice(1) + '</b></span>';
            badge.setAttribute('title', nombre + ' · experiencia ' + exp);
        }
        badge.appendChild(v);
    }

    function mover(c) {
        const x = c.solo ? c.ancho - c.x : -c.x;
        c.pista.style.transform = 'translate3d(' + x.toFixed(2) + 'px, 0, 0)';
    }

    const VEL = 46;        // px por segundo (normal)
    const VEL_LENTA = 9;   // px por segundo (con el mouse encima)
    const cintas = [];

    // Arma la serie con los botones de la división pedida (o todos) y la repite
    function llenar(c) {
        const lista = c.division ? c.todos.filter(b => b.dataset.div === c.division) : c.todos;
        c.pista.textContent = '';
        const serie = document.createElement('div');
        serie.className = 'serie';
        lista.forEach((b, i) => {
            if (i) serie.appendChild(document.createTextNode(' '));
            serie.appendChild(b.cloneNode(true));
        });
        c.pista.appendChild(serie);
        const ancho = serie.getBoundingClientRect().width || 1;
        // Con una división elegida no se repite: los botones cruzan una vez y vuelven a entrar por la derecha
        c.solo = !!c.division;
        const copias = c.solo ? 1 : Math.max(2, Math.ceil(c.cinta.clientWidth / ancho) + 1);
        for (let i = 1; i < copias; i++) {
            const copia = serie.cloneNode(true);
            copia.setAttribute('aria-hidden', 'true');
            c.pista.appendChild(copia);
        }
        c.pista.querySelectorAll('.badge').forEach(b => {
            b.addEventListener('touchstart', () => b.classList.toggle('ver-nivel'), { passive: true });
        });
        c.ancho = c.cinta.clientWidth;
        c.paso = c.solo ? ancho + c.ancho : ancho;
        c.x = c.solo ? c.ancho : 0;   // parte visible desde la izquierda
        mover(c);
    }

    document.querySelectorAll('.cintas .badge-grupo').forEach(grupo => {
        const cinta = grupo.querySelector('.cinta');
        const pista = cinta && cinta.querySelector('.pista');
        const original = pista && pista.querySelector('.serie');
        if (!original) return;
        const todos = [...original.querySelectorAll('.badge')];
        todos.forEach(prepararBoton);
        grupo._todos = todos;
        const titulo = grupo.querySelector('.badge-titulo');
        const divs = (titulo.dataset.divs || '').split('|').filter(Boolean).map(d => {
            const [id, nombre] = d.split(':');
            return { id, nombre };
        });
        const c = { cinta, pista, todos, divs, indice: -1, division: null, paso: 1, x: 0, v: VEL, objetivo: VEL, hasta: 0 };
        llenar(c);
        cintas.push(c);

        titulo.addEventListener('click', () => {
            c.indice = c.indice + 1 >= c.divs.length ? -1 : c.indice + 1;
            const d = c.divs[c.indice];
            c.division = d ? d.id : null;
            cinta.classList.add('cambiando');
            titulo.classList.add('cambiando');
            if (typeof Sonido !== 'undefined') Sonido.tono(c.indice < 0 ? 2 : (c.indice % 8) + 1, 0.06, 0.8);
            setTimeout(() => {
                titulo.textContent = d ? d.nombre : titulo.dataset.titulo;
                titulo.classList.toggle('en-division', !!d);
                llenar(c);
                cinta.classList.remove('cambiando');
                titulo.classList.remove('cambiando');
            }, 320);
        });
    });

    // Si cambia el ancho de la ventana, se recalcula cuántas copias hacen falta
    let espera;
    window.addEventListener('resize', () => {
        clearTimeout(espera);
        espera = setTimeout(() => cintas.forEach(llenar), 250);
    });

    // Movimiento: velocidad normal y, sobre la cinta, frena suave sin detenerse
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cintas.forEach(c => {
        c.pista.style.animation = 'none';
        c.cinta.addEventListener('pointerenter', () => { c.objetivo = VEL_LENTA; });
        c.cinta.addEventListener('pointerleave', () => { c.objetivo = VEL; });
        c.cinta.addEventListener('touchstart', () => { c.objetivo = VEL_LENTA; c.hasta = performance.now() + 2500; }, { passive: true });
    });
    let ultimo = 0;
    function cuadro(t) {
        const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0;
        ultimo = t;
        cintas.forEach(c => {
            if (c.hasta && t > c.hasta) { c.hasta = 0; c.objetivo = VEL; }
            c.v += (c.objetivo - c.v) * Math.min(1, dt * 2.2);
            c.x = (c.x + c.v * dt) % c.paso;
            mover(c);
        });
        requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);
})();

// ============================================
// 0b. VENTANA "VER TODO" DE CADA FILA
//     Botón a la derecha de la fila → ventana sobre el hero (vidrio
//     esmerilado) con todas las tecnologías agrupadas por división,
//     qué es cada una y, solo cuando es real, dónde la usé.
// ============================================
(() => {
    const INFO = {
        'Photoshop': ['Edición profesional de imágenes.'],
        'Lightroom': ['Revelado y ajuste de fotografías.'],
        'Figma': ['Diseño de interfaces y prototipos web.'],
        'HTML · CSS': ['Estructura y estilo de las páginas web.', 'Aplicaciones web en MINEDUC y este sitio.'],
        'Angular': ['Framework de Google para aplicaciones web.', 'Sistema web de gestión de personas (MINEDUC).'],
        'TypeScript': ['JavaScript con tipos: más seguro en proyectos grandes.', 'Aplicaciones web en MINEDUC.'],
        'JavaScript': ['El lenguaje de la web: la interacción en el navegador.', 'Este sitio: cintas, sonidos y efectos.'],
        'Node.js': ['JavaScript en el servidor para construir APIs.', 'Backend del sistema web de gestión de personas.'],
        'Python': ['Lenguaje para automatizar procesos y analizar datos.', 'Procesos ETL y automatizaciones en MINEDUC.'],
        'APIs y servicios web': ['Conexiones para que los sistemas intercambien datos.', 'Robot de licencias médicas con el portal PIEE de FONASA.'],
        'SQL Server': ['Base de datos de Microsoft para grandes volúmenes.', 'Data Warehouse de gestión de personas (MINEDUC).'],
        'MySQL': ['Base de datos relacional de código abierto.', 'Base del sistema web de gestión de personas.'],
        'Pandas': ['Librería de Python para limpiar y cruzar datos.', 'Procesos ETL en MINEDUC.'],
        'Power BI': ['Dashboards e indicadores de Microsoft.', 'Dashboard de gestión de tienda en La Polar y dashboards ejecutivos en MINEDUC.'],
        'RPA asistido': ['Robots de software que hacen tareas repetitivas, con supervisión humana.', 'Tramitación de licencias médicas para los SLEP de todo Chile.'],
        'Power Automate': ['Flujos automáticos entre las aplicaciones de Microsoft 365.'],
        'VBA · Macros': ['Programación dentro de Excel para automatizarlo.', 'Calculadora de finiquitos en Hites.'],
        'Claude': ['Asistente de IA de Anthropic para programar y analizar.', 'Acelerar el desarrollo y optimizar consultas SQL.'],
        'GitHub Copilot': ['IA que sugiere código dentro del editor.', 'Acelerar el desarrollo en MINEDUC.'],
        'Cursor': ['Editor de código con IA integrada.', 'Acelerar el desarrollo en MINEDUC.'],
        'IA local · Ollama': ['Modelos de IA que corren en el propio computador, sin enviar datos afuera.', 'En curso: IA local para la gestión y desarrollo de personas.'],
        'Git': ['Control de versiones: el historial de cada cambio del código.', 'Este sitio se publica desde GitHub.'],
        'BUK': ['Plataforma chilena de gestión de personas y remuneraciones.', 'Personal, remuneraciones y bienestar en La Polar.'],
        'GeoVictoria': ['Control de asistencia y turnos.', 'Asistencia, licencias y permisos en La Polar.'],
        'Kronos': ['Control horario y marcaciones.', 'Revisión de asistencia en Hites.'],
        'Payroll': ['Sistema de cálculo de nómina (ERP).', 'Nómina mensual y liquidaciones en Hites.'],
        'PIEE · FONASA': ['Portal de licencias médicas electrónicas para empleadores.', 'Robot que automatiza su tramitación para los SLEP.'],
        'SAP': ['Sistema de gestión empresarial (ERP).'],
        'Excel avanzado': ['Tablas dinámicas, BUSCARV, cruces masivos y Power Query.', 'Base de mi trabajo en Hites y La Polar.'],
        'Word': ['Procesador de textos de Microsoft.'],
        'PowerPoint': ['Presentaciones de Microsoft.'],
        'Outlook': ['Correo y calendario de Microsoft.'],
        'Teams': ['Reuniones y trabajo en equipo de Microsoft.'],
        'SharePoint': ['Sitios y documentos compartidos en Microsoft 365.'],
        'Liceo técnico · Electrónica': ['Técnico de Nivel Medio en Electrónica.', 'Liceo Guillermo González Heinrich · 2002 – 2004'],
        'CFT Estatal · Programación': ['Técnico de Nivel Superior en Programación Computacional.', 'CFT Estatal Región Metropolitana · 2024 – 2025'],
        'USM · Ing. Ejecución en Software': ['Ingeniería de Ejecución en Software.', 'Universidad Técnica Federico Santa María · 2026, en curso'],
        'Legislación laboral vigente': ['Curso de legislación laboral chilena vigente.'],
    };
    const BARRAS = { media: 1, alta: 2, avanzada: 3 };

    // Ventana única, se llena según la fila
    const fondo = document.createElement('div');
    fondo.className = 'stack-ventana-fondo';
    fondo.hidden = true;
    fondo.innerHTML =
        '<div class="stack-ventana" role="dialog" aria-modal="true" aria-labelledby="stackVentanaTitulo">' +
        '<header><h3 id="stackVentanaTitulo"></h3>' +
        '<button type="button" class="stack-cerrar" aria-label="Cerrar"><i class="fas fa-xmark"></i></button></header>' +
        '<div class="stack-columnas"></div></div>';
    document.body.appendChild(fondo);
    const ventana = fondo.querySelector('.stack-ventana');
    const tituloV = fondo.querySelector('h3');
    const columnas = fondo.querySelector('.stack-columnas');
    let origen = null;

    const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function abrir(grupo, boton) {
        const titulo = grupo.querySelector('.badge-titulo');
        const divs = (titulo.dataset.divs || '').split('|').filter(Boolean).map(d => d.split(':'));
        const botones = [...grupo.querySelectorAll('.serie:first-child .badge')];
        // Plantilla original guardada por las cintas (incluye todos los botones)
        const todos = grupo._todos || botones;
        tituloV.textContent = titulo.dataset.titulo;
        columnas.style.setProperty('--cols', Math.min(4, divs.length));
        columnas.innerHTML = divs.map(([id, nombre]) => {
            const items = todos.filter(b => b.dataset.div === id).map(b => {
                const n = b.querySelector('.badge-nombre')?.textContent || b.textContent.trim();
                const ic = b.querySelector('i')?.className || '';
                const [que, uso] = INFO[n] || [''];
                const exp = b.dataset.exp;
                const nivel = exp
                    ? '<span class="barras b' + BARRAS[exp] + ' exp-' + exp + '" title="Experiencia ' + exp + '"><i></i><i></i><i></i></span>'
                    : '';
                return '<li><i class="' + esc(ic) + '"></i><div><p class="sv-nombre">' + esc(n) + nivel + '</p>' +
                    (que ? '<p class="sv-que">' + esc(que) + '</p>' : '') +
                    (uso ? '<p class="sv-uso">' + esc(uso) + '</p>' : '') + '</div></li>';
            }).join('');
            return '<section><h4>' + esc(nombre) + '</h4><ul>' + items + '</ul></section>';
        }).join('');
        origen = boton;
        fondo.hidden = false;
        requestAnimationFrame(() => fondo.classList.add('abierta'));
        document.documentElement.classList.add('ventana-abierta');
        fondo.querySelector('.stack-cerrar').focus({ preventScroll: true });
    }

    function cerrar() {
        if (fondo.hidden) return;
        fondo.classList.remove('abierta');
        document.documentElement.classList.remove('ventana-abierta');
        setTimeout(() => { fondo.hidden = true; }, 350);
        if (origen) origen.focus({ preventScroll: true });
    }

    document.querySelectorAll('.cintas .badge-grupo').forEach(grupo => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cinta-info';
        b.setAttribute('aria-label', 'Ver y explicar todas las tecnologías de ' + grupo.querySelector('.badge-titulo').dataset.titulo);
        b.title = 'Ver todo explicado';
        b.innerHTML = '<i class="fas fa-list-ul"></i>';
        b.addEventListener('click', () => abrir(grupo, b));
        grupo.appendChild(b);
    });

    fondo.addEventListener('click', e => { if (e.target === fondo) cerrar(); });
    fondo.querySelector('.stack-cerrar').addEventListener('click', cerrar);
    // En captura, para que la navegación con flechas no mueva la página detrás
    window.addEventListener('keydown', e => {
        if (fondo.hidden) return;
        if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
        else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) e.stopImmediatePropagation();
        else if (e.key === 'Tab') {
            e.preventDefault();
            fondo.querySelector('.stack-cerrar').focus();
        }
    }, true);
})();

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
// (delegado: las cintas rearman sus botones al cambiar de división)
document.addEventListener('mouseover', e => {
    const badge = e.target.closest && e.target.closest('.badge');
    if (!badge || (e.relatedTarget && badge.contains(e.relatedTarget))) return;
    const ahora = performance.now();
    if (ahora - ultimoTono < 70) return;
    ultimoTono = ahora;
    const i = [...badge.parentNode.children].indexOf(badge);
    Sonido.tono(Sonido.NOTAS[i % Sonido.NOTAS.length]);
});

// Clic suave en botones y enlaces
document.querySelectorAll('a, button:not(.badge-titulo), .slider').forEach(el =>
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
    // Título y presentación aparecen suaves (CSS); solo la bajada se escribe.
    // La presentación aparece cuando termina de escribirse la bajada.
    const tardios = document.querySelectorAll('.aparece-tarde');
    const mostrarTardios = () => tardios.forEach(el => el.classList.add('visible'));
    document.addEventListener('tipeo-listo', () => setTimeout(mostrarTardios, 150), { once: true });
    setTimeout(mostrarTardios, 9000); // respaldo por si algo falla
    const textos = [...document.querySelectorAll('.tipeable')];
    if (!textos.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { mostrarTardios(); return; }
    // Ocultar mientras cargan las fuentes, para medir la altura real
    textos.forEach(el => { el.style.visibility = 'hidden'; });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(iniciar);
    function iniciar() {
    textos.forEach(el => { el.style.visibility = ''; });
    // Ritmo base (ms por letra). Cada letra varía al azar, como al tipear a mano.
    const velocidad = { 'hero-titulo': 125, 'hero-tagline': 48, 'hero-descripcion': 34 };
    // Errores de tipeo que se corrigen (solo en bajada y presentación)
    const conErrores = { 'hero-tagline': 1, 'hero-descripcion': 3 };
    const VECINAS = { a: 'sq', b: 'vn', c: 'xv', d: 'sf', e: 'wr', f: 'dg', g: 'fh', h: 'gj', i: 'uo', l: 'kñ', m: 'n', n: 'bm', o: 'ip', p: 'o', r: 'et', s: 'ad', t: 'ry', u: 'yi', v: 'cb' };

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

    // Pausa humana para cada letra
    function demora(t, c, sig) {
        let d = t.vel * (0.45 + Math.random() * 1.1);           // irregular
        if (Math.random() < 0.08) d += t.vel * (2 + Math.random() * 4); // titubeo
        if (c === ' ' && Math.random() < 0.25) d += t.vel * 2;   // entre palabras
        if (c === ',') d += t.vel * 8;
        if (c === '.' || c === ':') d += t.vel * 16;
        if (sig === ' ' || !sig) d *= 0.85;
        return d;
    }

    function escribir(t, listo) {
        let parte = 0, i = 0, nodo = null;
        // Elegir al azar en qué letras habrá un error (lejos del inicio y del final)
        const total = t.partes.reduce((a, p) => a + p.texto.length, 0);
        const errores = new Set();
        const cuantos = conErrores[t.el.id] || 0;
        for (let k = 0; k < cuantos; k++) errores.add(Math.floor(total * (0.15 + 0.7 * (k + Math.random() * 0.6) / Math.max(cuantos, 1))));
        let pos = 0;
        t.el.classList.add('escribiendo');
        t.el.classList.remove('esperando');
        (function paso() {
            if (parte >= t.partes.length) {
                t.el.innerHTML = t.html;
                return listo();
            }
            const actual = t.partes[parte];
            if (i === 0) {
                nodo = actual.molde ? actual.molde.cloneNode(false) : document.createTextNode('');
                t.el.appendChild(nodo);
            }
            const c = actual.texto[i];
            const vec = c && VECINAS[c.toLowerCase()];
            if (errores.has(pos) && vec) {
                // Tecla equivocada → se da cuenta → borra → sigue
                errores.delete(pos);
                const malo = vec[Math.floor(Math.random() * vec.length)];
                nodo.textContent = actual.texto.slice(0, i) + malo;
                setTimeout(() => {
                    t.el.classList.add('esperando');
                    setTimeout(() => {
                        t.el.classList.remove('esperando');
                        nodo.textContent = actual.texto.slice(0, i);
                        setTimeout(paso, t.vel * 3);
                    }, 380 + Math.random() * 260);
                }, t.vel * 1.5);
                return;
            }
            i++; pos++;
            nodo.textContent = actual.texto.slice(0, i);
            const sig = actual.texto[i];
            if (i >= actual.texto.length) { parte++; i = 0; }
            setTimeout(paso, demora(t, c, sig));
        })();
    }

    let n = 0;
    // Antes de escribir, el cursor parpadea mientras aparece el título
    tareas[0].el.classList.add('escribiendo', 'esperando');
    setTimeout(siguiente, 1300);
    function siguiente() {
        if (n >= tareas.length) return;
        const t = tareas[n++];
        escribir(t, () => {
            // Pausa con el cursor parpadeando antes de pasar a la línea siguiente.
            // En la última, el cursor se queda parpadeando al final.
            t.el.classList.add('esperando');
            if (n >= tareas.length) { document.dispatchEvent(new Event('tipeo-listo')); return; }
            setTimeout(() => {
                t.el.classList.remove('escribiendo', 'esperando');
                siguiente();
            }, 650);
        });
    }
    }
})();

// ============================================
// 7b-2. BADGES: CADA GRUPO EN UNA FILA, AJUSTADO AL ANCHO DE PANTALLA
// ============================================
(() => {
    const cont = document.querySelector('.hero-especialidades');
    if (!cont || cont.classList.contains('cintas')) return; // las cintas no necesitan ajuste
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
// ============================================
// 3b. EXPERIENCIA: LOS 11 CARGOS SUBEN SIN PARAR
//     - Con el mouse encima frena suave.
//     - Clic en un cargo: la lista se detiene, el cargo queda a la vista
//       y se abre hacia abajo con su parte del relato.
//     - El botón del relato abre una ventana con la descripción del cargo
//       y mi aporte.
// ============================================
(() => {
    const ventana = document.querySelector('.exp-ventana');
    const pista = ventana && ventana.querySelector('.exp-pista');
    if (!pista) return;
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Copia de la lista para que el ciclo no tenga cortes
    const originales = [...pista.children];
    if (!quieto) {
        originales.forEach(li => {
            const c = li.cloneNode(true);
            c.setAttribute('aria-hidden', 'true');
            c.classList.add('copia');
            c.querySelectorAll('button').forEach(b => { b.tabIndex = -1; });
            pista.appendChild(c);
        });
        ventana.classList.add('en-movimiento');
    }
    const primeraCopia = pista.querySelector('.copia');
    const alto = () => primeraCopia ? primeraCopia.offsetTop - originales[0].offsetTop : 1;

    // ---------- Ventana con descripción y aporte ----------
    const fondo = document.createElement('div');
    fondo.className = 'stack-ventana-fondo cargo-ventana-fondo';
    fondo.hidden = true;
    fondo.innerHTML =
        '<div class="stack-ventana cargo-ventana" role="dialog" aria-modal="true" aria-labelledby="cargoVentanaTitulo">' +
        '<header><div><p class="cv-anios"></p><h3 id="cargoVentanaTitulo"></h3><p class="cv-empresa"></p></div>' +
        '<button type="button" class="stack-cerrar" aria-label="Cerrar"><i class="fas fa-xmark"></i></button></header>' +
        '<div class="cv-cuerpo"></div></div>';
    document.body.appendChild(fondo);
    let origenFoco = null;

    function abrirVentana(li, boton) {
        const fin = li.querySelector('.anio-fin').textContent;
        const ini = li.querySelector('.anio-ini').textContent;
        fondo.querySelector('.cv-anios').textContent = ini + ' – ' + fin;
        const t = li.querySelector('.exp-cargo-titulo').cloneNode(true);
        t.querySelector('.etapa-chip')?.remove();
        fondo.querySelector('h3').textContent = t.textContent.trim();
        fondo.querySelector('.cv-empresa').textContent = li.querySelector('.exp-cargo-empresa').textContent;
        fondo.querySelector('.cv-cuerpo').innerHTML = li.querySelector('.exp-detalle').innerHTML;
        origenFoco = boton;
        fondo.hidden = false;
        requestAnimationFrame(() => fondo.classList.add('abierta'));
        document.documentElement.classList.add('ventana-abierta');
        fondo.querySelector('.stack-cerrar').focus({ preventScroll: true });
    }
    function cerrarVentana() {
        if (fondo.hidden) return;
        fondo.classList.remove('abierta');
        document.documentElement.classList.remove('ventana-abierta');
        setTimeout(() => { fondo.hidden = true; }, 350);
        if (origenFoco) origenFoco.focus({ preventScroll: true });
    }
    fondo.addEventListener('click', e => { if (e.target === fondo) cerrarVentana(); });
    fondo.querySelector('.stack-cerrar').addEventListener('click', cerrarVentana);
    window.addEventListener('keydown', e => {
        if (fondo.hidden) return;
        if (e.key === 'Escape') { e.preventDefault(); cerrarVentana(); }
        else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) e.stopImmediatePropagation();
        else if (e.key === 'Tab') { e.preventDefault(); fondo.querySelector('.stack-cerrar').focus(); }
    }, true);

    // ---------- Movimiento ----------
    const VEL = 20, VEL_LENTA = 5;
    let y = 0, v = quieto ? 0 : VEL, objetivo = v, ultimo = 0, hasta = 0;
    let abierto = null;     // <li> abierto
    let enfoque = null;     // posición a la que se desliza para mostrar el cargo abierto

    function abrirCargo(li) {
        const yaAbierto = abierto === li;
        if (abierto) {
            abierto.classList.remove('abierto');
            abierto.querySelector('.exp-cargo-head').setAttribute('aria-expanded', 'false');
            abierto = null;
        }
        if (yaAbierto) {
            enfoque = null;
            objetivo = quieto ? 0 : VEL;
            return;
        }
        abierto = li;
        li.classList.add('abierto');
        li.querySelector('.exp-cargo-head').setAttribute('aria-expanded', 'true');
        v = 0; objetivo = 0;
        // Deja el cargo cerca del borde superior de la ventana
        enfoque = Math.max(0, li.offsetTop - 14);
        if (quieto) ventana.scrollTo({ top: enfoque, behavior: 'smooth' });
    }

    pista.addEventListener('click', e => {
        const mas = e.target.closest('.exp-mas');
        if (mas) { abrirVentana(mas.closest('.exp-cargo'), mas); return; }
        const head = e.target.closest('.exp-cargo-head');
        if (head) abrirCargo(head.closest('.exp-cargo'));
    });

    if (quieto) return;
    ventana.addEventListener('pointerenter', () => { if (!abierto) objetivo = VEL_LENTA; });
    ventana.addEventListener('pointerleave', () => { if (!abierto) objetivo = VEL; });
    ventana.addEventListener('touchstart', () => { if (!abierto) { objetivo = VEL_LENTA; hasta = performance.now() + 3000; } }, { passive: true });
    ventana.addEventListener('focusin', () => { if (!abierto) objetivo = 0; });
    ventana.addEventListener('focusout', () => { if (!abierto) objetivo = VEL; });

    function cuadro(t) {
        const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0;
        ultimo = t;
        if (hasta && t > hasta) { hasta = 0; if (!abierto) objetivo = VEL; }
        if (enfoque !== null) {
            // Deslizamiento suave hasta el cargo abierto
            y += (enfoque - y) * Math.min(1, dt * 5);
            if (abierto) enfoque = Math.max(0, abierto.offsetTop - 14);
            if (!abierto && Math.abs(enfoque - y) < 0.5) enfoque = null;
        } else {
            v += (objetivo - v) * Math.min(1, dt * 2.2);
            y += v * dt;
            const h = alto();
            if (y >= h) y -= h;
        }
        pista.style.transform = 'translate3d(0,' + (-y).toFixed(2) + 'px,0)';
        requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);
})();
