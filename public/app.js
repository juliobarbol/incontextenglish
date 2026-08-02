/* ==========================================================================
   In Context English — comportamiento común a todas las páginas
   1) selector de idioma ES/EN con persistencia
   2) menú mobile
   3) formulario de contacto -> WhatsApp (sin backend)
   4) registro anónimo de uso (visitas, clics, scroll)
   ========================================================================== */

const WA = "5493515645110";
const CLAVE_IDIOMA = "ice-lang";

/* ---------- 1. Idioma ---------------------------------------------------- */

function idiomaGuardado() {
  try {
    const v = localStorage.getItem(CLAVE_IDIOMA);
    return v === "en" || v === "es" ? v : "es";
  } catch {
    return "es";
  }
}

function aplicarIdioma(lang) {
  // Textos simples: guardamos el original en castellano la primera vez.
  document.querySelectorAll("[data-en]").forEach((el) => {
    if (el.dataset.es === undefined) el.dataset.es = el.textContent;
    const quiero = lang === "en" ? el.dataset.en : el.dataset.es;
    if (el.textContent !== quiero) el.textContent = quiero;
  });

  // Textos con marcado interno (por ejemplo el <em> del titular).
  document.querySelectorAll("[data-en-html]").forEach((el) => {
    if (el.dataset.esHtml === undefined) el.dataset.esHtml = el.innerHTML;
    el.innerHTML = lang === "en" ? el.dataset.enHtml : el.dataset.esHtml;
  });

  document.querySelectorAll("[data-lang-btn]").forEach((b) => {
    b.innerHTML =
      lang === "en"
        ? '<span style="opacity:.45">ES</span> / EN'
        : 'ES / <span style="opacity:.45">EN</span>';
  });

  document.documentElement.lang = lang;

  try {
    localStorage.setItem(CLAVE_IDIOMA, lang);
  } catch {
    /* modo privado: seguimos igual, sólo no persiste */
  }

  document.dispatchEvent(new CustomEvent("idiomacambiado", { detail: { lang } }));
}

function idiomaActual() {
  return document.documentElement.lang === "en" ? "en" : "es";
}

/* ---------- 2. Menú mobile ---------------------------------------------- */

function iniciarMenu() {
  const btn = document.getElementById("menu-btn");
  const nav = document.getElementById("nav");
  if (!btn || !nav) return;

  const cerrar = () => {
    nav.classList.remove("abierto");
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", () => {
    const abierto = nav.classList.toggle("abierto");
    btn.setAttribute("aria-expanded", String(abierto));
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) cerrar();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrar();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".site-header")) cerrar();
  });
}

/* ---------- 3. Formulario -> WhatsApp ------------------------------------ */

function iniciarFormulario() {
  const form = document.getElementById("form-contacto");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const motivo = form.motivo.options[form.motivo.selectedIndex].textContent.trim();
    const mensaje = form.mensaje.value.trim();
    const en = idiomaActual() === "en";

    if (!nombre) {
      form.nombre.focus();
      form.nombre.setAttribute("aria-invalid", "true");
      return;
    }
    form.nombre.removeAttribute("aria-invalid");

    const lineas = en
      ? [
          `Hi Vicky! I'm ${nombre}.`,
          `I need English for: ${motivo}.`,
          mensaje && `\n${mensaje}`,
          email && `\nMy email: ${email}`,
        ]
      : [
          `¡Hola Vicky! Soy ${nombre}.`,
          `Necesito el inglés para: ${motivo}.`,
          mensaje && `\n${mensaje}`,
          email && `\nMi email: ${email}`,
        ];

    const texto = lineas.filter(Boolean).join(" ");
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    // Acá, y no en el botón: sólo cuenta si el formulario pasó la validación.
    registrar("clic", { detalle: "formulario-enviado" });
  });
}

/* ---------- 4. Registro anónimo ------------------------------------------ */

/* Manda un evento a /api/evento y se olvida. No guarda nada personal y los
   eventos no se correlacionan entre sí: se cuentan sueltos, así que se puede
   saber «hubo 200 visitas y 30 clics a WhatsApp» pero nunca seguir a alguien
   por el sitio. Si falla, falla en silencio: esto no puede molestar a nadie.

   La usa también quiz.js para los eventos del test — por eso vive acá, que es
   el script que cargan todas las páginas. */
function registrar(evento, datos = {}) {
  try {
    fetch("/api/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento, idioma: idiomaActual(), ...datos }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* navegador viejo o sin fetch: seguimos igual */
  }
}

/* Los elementos que queremos contar llevan data-evento="etiqueta" en el HTML.
   Es explícito a propósito: hay siete links a WhatsApp con el mismo href y lo
   que interesa es saber cuál de todos se toca. */
function iniciarClics() {
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest("[data-evento]");
      if (el) registrar("clic", { detalle: el.dataset.evento });
    },
    { capture: true }
  );
}

/* Hasta dónde llega la gente. Cada umbral se manda una sola vez por visita. */
function iniciarScroll() {
  const pendientes = [25, 50, 75, 100];
  const medir = () => {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    if (alto <= 0) return;
    const pct = ((window.scrollY / alto) * 100);
    while (pendientes.length && pct >= pendientes[0]) {
      registrar("scroll", { detalle: String(pendientes.shift()) });
    }
    if (!pendientes.length) window.removeEventListener("scroll", alPasar);
  };
  let esperando = false;
  const alPasar = () => {
    if (esperando) return;
    esperando = true;
    requestAnimationFrame(() => {
      esperando = false;
      medir();
    });
  };
  window.addEventListener("scroll", alPasar, { passive: true });
}

/* ---------- Arranque ----------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  aplicarIdioma(idiomaGuardado());
  iniciarMenu();
  iniciarFormulario();

  document.querySelectorAll("[data-lang-btn]").forEach((b) => {
    b.addEventListener("click", () => aplicarIdioma(idiomaActual() === "en" ? "es" : "en"));
  });

  registrar("pagina", { detalle: location.pathname });
  iniciarClics();
  iniciarScroll();
});
