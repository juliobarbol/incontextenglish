/* ==========================================================================
   In Context English — comportamiento común a todas las páginas
   1) selector de idioma ES/EN con persistencia
   2) menú mobile
   3) formulario de contacto -> WhatsApp (sin backend)
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
  });
}

/* ---------- Arranque ----------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  aplicarIdioma(idiomaGuardado());
  iniciarMenu();
  iniciarFormulario();

  document.querySelectorAll("[data-lang-btn]").forEach((b) => {
    b.addEventListener("click", () => aplicarIdioma(idiomaActual() === "en" ? "es" : "en"));
  });
});
