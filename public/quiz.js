/* ==========================================================================
   In Context English — test de nivel
   Portado del prototipo de Claude Design a JS sin dependencias.
   Las preguntas, el puntaje y los textos por nivel son los del diseño original.
   ========================================================================== */

/* Banco de preguntas. Cada persona recibe POR_BANDA de cada nivel, sorteadas
   del banco: así dos personas no hacen el mismo test y no se puede memorizar
   repitiéndolo. Cada ítem es un intercambio corto —el hueco va en una réplica,
   no en una frase suelta—, que es como se trabaja en clase.

   Revisado por Victoria Rossa el 6/8/2026. Para volver a someterlo a revisión:
   python3 contenido/_planilla.py arma la planilla leyendo este mismo banco. */
const BANCO = [
  // ---- A1 ----
  { banda: "A1", foco: "Preguntas con to be", q: "— Hi, I'm Marta. ___ your name?\n— Nice to meet you. I'm Tom.", opts: ["What's","How's","Which is","Who's"], a: 0 },
  { banda: "A1", foco: "To be en preguntas", q: "— Where ___ you from?\n— I'm from Córdoba, in Argentina.", opts: ["is","are","am","be"], a: 1 },
  { banda: "A1", foco: "Presente simple, auxiliar", q: "— ___ you drink coffee in the morning?\n— Yes, every single day.", opts: ["Are","Does","Do","Is"], a: 2 },
  { banda: "A1", foco: "There is / any", q: "— Is there any milk?\n— No, there ___ any. I'll buy some.", opts: ["aren't","don't","not is","isn't"], a: 3 },
  { banda: "A1", foco: "Can para pedidos", q: "— ___ you send me the address, please?\n— Sure, I'll text it to you now.", opts: ["Can","Do","Are","Have"], a: 0 },
  { banda: "A1", foco: "Preposiciones de tiempo", q: "— When is the meeting?\n— ___ Monday, at nine.", opts: ["In","On","At","To"], a: 1 },
  { banda: "A1", foco: "Posesivos", q: "— Is this ___ laptop?\n— No, mine is the black one.", opts: ["you","yours","your","you're"], a: 2 },
  { banda: "A1", foco: "There are, plural", q: "— How many people are in your team?\n— There ___ six of us.", opts: ["is","have","be","are"], a: 3 },
  { banda: "A1", foco: "Presente simple, primera persona", q: "— Do you like working from home?\n— Yes, I ___ it a lot.", opts: ["like","likes","am liking","am like"], a: 0 },
  { banda: "A1", foco: "Preposiciones de hora", q: "— What time do you start?\n— I start work ___ 8:30.", opts: ["in","at","from","on"], a: 1 },

  // ---- A2 ----
  { banda: "A2", foco: "Pasado simple irregular", q: "— How was Madrid?\n— Good. We ___ to a client meeting on Tuesday.", opts: ["go","gone","went","was going"], a: 2 },
  { banda: "A2", foco: "Presente continuo", q: "— Can you talk now?\n— Sorry, I ___ a report. Can I call you back?", opts: ["write","have write","writes","am writing"], a: 3 },
  { banda: "A2", foco: "Superlativo", q: "— How did it go?\n— It was ___ presentation I've ever given.", opts: ["the best","best","the better","more good"], a: 0 },
  { banda: "A2", foco: "Primer condicional", q: "— And if the weather is bad?\n— If it rains, we ___ the class online.", opts: ["would do","will do","did","do"], a: 1 },
  { banda: "A2", foco: "Going to, planes", q: "— What are your plans for Friday?\n— I ___ visit the new office.", opts: ["will going to","go to","am going to","am going"], a: 2 },
  { banda: "A2", foco: "Have to, obligación", q: "— Do I need to be there at eight?\n— Yes, everyone ___ sign in before the training starts.", opts: ["have to","must to","should to","has to"], a: 3 },
  { banda: "A2", foco: "Comparativo", q: "— Is the new system better?\n— It's ___ than the old one, yes.", opts: ["faster","more fast","fastest","the fastest"], a: 0 },
  { banda: "A2", foco: "Some en ofrecimientos", q: "— Would you like ___ help with the slides?\n— That would be great, thanks.", opts: ["any","some","a","much"], a: 1 },
  { banda: "A2", foco: "Posición del adverbio de frecuencia", q: "— Do you travel a lot?\n— I ___ to Chile, about twice a year.", opts: ["go sometimes","go always","sometimes go","am sometimes going"], a: 2 },
  { banda: "A2", foco: "Pasado continuo vs. simple", q: "— Why didn't you answer?\n— Sorry, I ___ when you called.", opts: ["drove","have driven","am driving","was driving"], a: 3 },

  // ---- B1 ----
  { banda: "B1", foco: "Present perfect con since", q: "— How long have you been with them?\n— I ___ in this company since 2019.", opts: ["have worked","am working","work","worked"], a: 0 },
  { banda: "B1", foco: "Estilo indirecto, pedido", q: "— What did Laura want?\n— She asked me ___ the file before Friday.", opts: ["sending","to send","that I send","send"], a: 1 },
  { banda: "B1", foco: "Conectores de contraste", q: "— The meeting was cancelled; ___, nobody told me.\n— I'm sorry about that.", opts: ["although","despite","however","in spite"], a: 2 },
  { banda: "B1", foco: "Estilo indirecto, backshift", q: "— What did he say exactly?\n— He said he ___ finish the proposal that evening.", opts: ["will","is going","won't","would"], a: 3 },
  { banda: "B1", foco: "Used to", q: "— Have you always worked in tech?\n— No, I ___ work in a bank.", opts: ["used to","use to","was used to","am used to"], a: 0 },
  { banda: "B1", foco: "Gerundio tras preposición", q: "— How did you improve so fast?\n— By ___ to podcasts on the way to work.", opts: ["listen","listening","listened","to listen"], a: 1 },
  { banda: "B1", foco: "Oraciones de relativo", q: "— Which one is Diego?\n— He's the colleague ___ organised the training.", opts: ["which","what","who","whose"], a: 2 },
  { banda: "B1", foco: "Modales de consejo", q: "— I'm nervous about the interview.\n— You ___ practise out loud. It really helps.", opts: ["would","must to","had","should"], a: 3 },
  { banda: "B1", foco: "Voz pasiva, presente", q: "— Who writes the reports?\n— They ___ by the finance team.", opts: ["are written","are writing","write","have written"], a: 0 },
  { banda: "B1", foco: "Enough", q: "— Can we fit another item into the agenda?\n— No, there isn't ___ time.", opts: ["too much","enough","too","many"], a: 1 },

  // ---- B2 ----
  { banda: "B2", foco: "Pasado perfecto", q: "— Were you ready for the call?\n— More than ready. By the time it started, I ___ the slides three times.", opts: ["reviewed","was reviewing","had reviewed","have reviewed"], a: 2 },
  { banda: "B2", foco: "Voz pasiva, pasado", q: "— Did anyone object to the cuts?\n— Nobody got the chance. The budget cuts ___ before we could speak.", opts: ["approved","was approve","have approving","were approved"], a: 3 },
  { banda: "B2", foco: "I'd rather + pasado", q: "— I signed it yesterday.\n— I'd rather you ___ me before making that decision.", opts: ["had called","called","would call","have called"], a: 0 },
  { banda: "B2", foco: "Phrasal verb: come up with", q: "— What's the deadline?\n— We need to ___ up with a solution by Monday.", opts: ["put","come","take","look"], a: 1 },
  { banda: "B2", foco: "Segundo condicional", q: "— Are you going to apply?\n— If I ___ more experience, I would.", opts: ["have","would have","had","am having"], a: 2 },
  { banda: "B2", foco: "Tercer condicional", q: "— Why didn't you tell me?\n— If I ___ known, I would have called you straight away.", opts: ["have","did","would have","had"], a: 3 },
  { banda: "B2", foco: "Verbo de reporte + gerundio", q: "— Did they admit the mistake?\n— Yes, they admitted ___ the wrong file.", opts: ["sending","to send","sent","send"], a: 0 },
  { banda: "B2", foco: "So / such", q: "— How was the feedback?\n— It was ___ detailed that we had to rewrite the whole section.", opts: ["such","so","very","too"], a: 1 },
  { banda: "B2", foco: "Cláusula de participio", q: "— How did you find out?\n— While ___ the report, I noticed the figures didn't add up.", opts: ["to read","read","reading","being read"], a: 2 },
  { banda: "B2", foco: "Futuro perfecto", q: "— Will it be ready for the launch?\n— By then we ___ the testing.", opts: ["will finish","would finish","finish","will have finished"], a: 3 },

  // ---- C1 ----
  { banda: "C1", foco: "Inversión: no sooner… than", q: "— Did they take long to reply?\n— ___ had I sent the email than the client replied.", opts: ["No sooner","Hardly","Rarely","Barely"], a: 0 },
  { banda: "C1", foco: "Phrasal verb: set back", q: "— How did the team take it?\n— The proposal was turned down, which ___ the project by months.", opts: ["set off","set back","set out","set up"], a: 1 },
  { banda: "C1", foco: "Condicional invertido", q: "— Her feedback made the difference, then.\n— Were it not for her feedback, the launch ___ a disaster.", opts: ["would be","will have been","would have been","had been"], a: 2 },
  { banda: "C1", foco: "Concesivo: albeit", q: "— What did you make of his argument?\n— His argument, ___ compelling, overlooked the cost side entirely.", opts: ["as","while","however","albeit"], a: 3 },
  { banda: "C1", foco: "Oración hendida (cleft)", q: "— So the price wasn't the issue?\n— No. ___ put them off was the timeline, not the price.", opts: ["What","That","Which","It"], a: 0 },
  { banda: "C1", foco: "Subjuntivo tras insist", q: "— What did legal say?\n— They insisted that the clause ___ removed before signing.", opts: ["is","be","was being","would be"], a: 1 },
  { banda: "C1", foco: "Colocación: bear in mind", q: "— Anything else before I send it?\n— Just ___ in mind that they read everything literally.", opts: ["hold","carry","bear","take"], a: 2 },
  { banda: "C1", foco: "Phrasal verb: get round to", q: "— Did you look at the contract?\n— Not yet, I haven't ___ round to it.", opts: ["gone","come","turned","got"], a: 3 },
  { banda: "C1", foco: "Might as well", q: "— Should I push back on the deadline?\n— You ___ as well ask. The worst they can say is no.", opts: ["might","should","would","could"], a: 0 },
  { banda: "C1", foco: "Conector formal: notwithstanding", q: "— They still went ahead?\n— ___ the delays, the project went live on time.", opts: ["Although","Notwithstanding","Even","However"], a: 1 },
];

const POR_BANDA = 4;

const NIVELES = {
  A1: {
    nombre: "Principiante", nombreEn: "Beginner",
    blurb: "Reconocés palabras y frases básicas. Podés presentarte y manejar situaciones muy simples, pero todavía te apoyás mucho en la traducción mental.",
    blurbEn: "You recognise basic words and phrases. You can introduce yourself and handle very simple situations, but you still rely a lot on translating in your head.",
    curso: "Clases 1:1 desde cero", cursoEn: "One-to-one from scratch",
    porque: "Empezamos armando una base sólida con situaciones cotidianas y del trabajo, a tu ritmo y sin presión de grupo.",
    porqueEn: "We start by building a solid base with everyday and work situations, at your own pace and with no group pressure.",
    foco: ["Presente simple y continuo en contexto", "Vocabulario de tu día a día laboral", "Perder el miedo a decir la primera frase"],
    focoEn: ["Present simple and continuous in context", "Vocabulary from your working day", "Losing the fear of saying your first sentence"],
  },
  A2: {
    nombre: "Básico", nombreEn: "Elementary",
    blurb: "Te manejás en intercambios simples y podés contar cosas del pasado, pero todavía se te traba la conversación cuando el tema se sale del guion.",
    blurbEn: "You handle simple exchanges and can talk about the past, but conversation still stalls when the topic goes off-script.",
    curso: "Clases 1:1 + grupo de speaking A2", cursoEn: "One-to-one + A2 speaking group",
    porque: "La combinación ideal en este nivel: estructura en la clase individual y práctica real con gente de tu mismo nivel.",
    porqueEn: "The ideal combination at this level: structure in your one-to-one, real practice with people at your own level.",
    foco: ["Pasados y futuros con seguridad", "Frases hechas para reuniones y mails", "Contar lo que hacés en tu trabajo sin trabarte"],
    focoEn: ["Past and future tenses with confidence", "Set phrases for meetings and emails", "Explaining what you do at work without freezing"],
  },
  B1: {
    nombre: "Intermedio", nombreEn: "Intermediate",
    blurb: "Ya sostenés una conversación de trabajo, pero seguís traduciendo mentalmente y perdés naturalidad cuando el tema se pone técnico o rápido.",
    blurbEn: "You can hold a work conversation, but you still translate in your head and lose fluency when things get technical or fast.",
    curso: "Grupo de speaking B1 + 1:1 quincenal", cursoEn: "B1 speaking group + fortnightly one-to-one",
    porque: "En este nivel lo que más rinde es hablar mucho. El grupo te da volumen de práctica y la clase individual afina lo tuyo.",
    porqueEn: "At this level what pays off most is speaking a lot. The group gives you practice volume; the one-to-one fine-tunes what's yours.",
    foco: ["Dejar de traducir palabra por palabra", "Present perfect vs. pasado simple en uso real", "Phrasal verbs frecuentes en tu industria"],
    focoEn: ["Stop translating word by word", "Present perfect vs. past simple in real use", "Frequent phrasal verbs in your industry"],
  },
  B2: {
    nombre: "Intermedio alto", nombreEn: "Upper-intermediate",
    blurb: "Te comunicás con soltura y podés argumentar. Lo que falta es precisión, registro y esa naturalidad que hace que no suene a traducción.",
    blurbEn: "You communicate comfortably and can argue a point. What's missing is precision, register and the naturalness that stops it sounding translated.",
    curso: "Clases 1:1 de inglés laboral o preparación de examen", cursoEn: "Work-focused one-to-one or exam prep",
    porque: "Es el nivel donde más se nota trabajar con el vocabulario específico de tu área, o apuntar directo a IELTS / TOEFL / Cambridge.",
    porqueEn: "This is where working with the specific vocabulary of your field — or aiming straight at IELTS / TOEFL / Cambridge — makes the biggest difference.",
    foco: ["Registro formal e informal según el interlocutor", "Estructuras condicionales y voz pasiva con naturalidad", "Presentaciones y negociación en inglés"],
    focoEn: ["Formal and informal register depending on who you're talking to", "Conditionals and passive voice used naturally", "Presentations and negotiating in English"],
  },
  C1: {
    nombre: "Avanzado", nombreEn: "Advanced",
    blurb: "Manejás el idioma con fluidez y matices. El trabajo ahora es de pulido: idiomaticidad, ritmo y esos detalles que separan «muy bueno» de «suena nativo».",
    blurbEn: "You use the language fluently and with nuance. The work now is polishing: idiomaticity, rhythm and the details between 'very good' and 'sounds native'.",
    curso: "1:1 avanzado o preparación C1/C2", cursoEn: "Advanced one-to-one or C1/C2 exam prep",
    porque: "Sesiones centradas en discurso: matiz, precisión léxica y las situaciones exactas donde necesitás rendir.",
    porqueEn: "Sessions centred on discourse: nuance, lexical precision and the exact situations where you need to perform.",
    foco: ["Inversión, énfasis y estructuras avanzadas", "Colocaciones e idioms de uso profesional", "Preparación de examen C1/C2 si te interesa certificar"],
    focoEn: ["Inversion, emphasis and advanced structures", "Professional collocations and idioms", "C1/C2 exam prep if you want to certify"],
  },
};

const ORDEN = ["A1", "A2", "B1", "B2", "C1"];
const WA_TEST = "5493515645110";

/* El test son 20 preguntas y unos 10 minutos, casi siempre en el teléfono: si
   entra una llamada a mitad de camino, sin esto se pierde todo. El progreso
   queda en el navegador de quien lo hace y el resultado se refleja en el hash,
   así se puede recargar o pasarle el link a alguien. */
const CLAVE_TEST = "ice-test";
const VENCE_MS = 7 * 24 * 60 * 60 * 1000;

const estado = { pantalla: "intro", i: 0, respuestas: [], resultado: null, ids: [] };

/* Las preguntas que le tocaron a esta persona, en orden de banda. Se sortean al
   cargar la página y se rearman al empezar de nuevo. `estado.ids` guarda de qué
   posición del banco salió cada una: sin eso, al retomar un test a medias las
   respuestas quedarían apuntando a otras preguntas. */
let PREGUNTAS = [];

const $ = (id) => document.getElementById(id);
const enIngles = () => document.documentElement.lang === "en";

/* Fisher-Yates sobre los índices de cada banda, y nos quedamos con POR_BANDA.
   Se sortea por banda y no sobre todo el banco para que el test siga teniendo
   la misma forma: cuatro preguntas de cada nivel, de la más fácil a la más
   difícil. De eso depende la regla de nivel. */
function sortear() {
  const elegidas = [];
  for (const banda of ORDEN) {
    const indices = [];
    BANCO.forEach((q, i) => q.banda === banda && indices.push(i));
    for (let k = indices.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [indices[k], indices[j]] = [indices[j], indices[k]];
    }
    elegidas.push(...indices.slice(0, POR_BANDA));
  }
  return elegidas;
}

function usar(ids) {
  estado.ids = ids;
  PREGUNTAS = ids.map((i) => BANCO[i]);
}

/* `registrar()` vive en app.js, que carga antes que este script en todas las
   páginas. Acá sólo se usa para los dos eventos del test. */

/* ---------- Cálculo del nivel -------------------------------------------- */

/* Tres de cada cuatro. Va como proporción y no como «3», para que siga
   valiendo si alguna banda deja de tener exactamente cuatro preguntas. */
const UMBRAL = 0.75;

function calcular(respuestas = estado.respuestas) {
  const porBanda = {};
  ORDEN.forEach((b) => (porBanda[b] = { ok: 0, total: 0 }));

  PREGUNTAS.forEach((q, i) => {
    porBanda[q.banda].total++;
    if (respuestas[i] === q.a) porBanda[q.banda].ok++;
  });

  /* El nivel es la banda más alta que cumple las dos condiciones. No se corta
     en la primera que falla: se recorren todas y gana la más alta que califica.
     Ver el porqué en CLAUDE.md — la regla anterior daba «A1» con 18/20. */
  let nivel = "A1";
  let ok = 0;
  let total = 0;
  for (const b of ORDEN) {
    ok += porBanda[b].ok;
    total += porBanda[b].total;
    const dominaLaBanda = porBanda[b].ok >= porBanda[b].total * UMBRAL;
    const sostieneElAcumulado = ok >= total * UMBRAL;
    if (dominaLaBanda && sostieneElAcumulado) nivel = b;
  }

  const puntaje = PREGUNTAS.reduce((n, q, i) => n + (respuestas[i] === q.a ? 1 : 0), 0);
  return { nivel, puntaje };
}

/* ---------- Progreso guardado y resultado en el hash --------------------- */

/* Las respuestas no salen del navegador: el registro anónimo sigue mandando
   sólo nivel y puntaje, como antes. */

function guardar(terminado = false) {
  try {
    localStorage.setItem(
      CLAVE_TEST,
      JSON.stringify({
        ids: estado.ids,
        i: estado.i,
        respuestas: estado.respuestas,
        terminado,
        ts: Date.now(),
      })
    );
  } catch {
    /* modo privado o sin espacio: el test funciona igual, sólo no se guarda */
  }
}

function olvidar() {
  try {
    localStorage.removeItem(CLAVE_TEST);
  } catch {
    /* idem */
  }
}

/* Lo que sale de localStorage lo pudo editar cualquiera, y tanto `ids` como
   `respuestas` se usan para indexar: se revisa entero antes de usarlo. Un
   guardado de antes del sorteo tampoco tiene `ids`, y cae por acá. */
function leerGuardado() {
  let d;
  try {
    d = JSON.parse(localStorage.getItem(CLAVE_TEST));
  } catch {
    return null;
  }
  if (!d || !Array.isArray(d.respuestas) || !Number.isInteger(d.i)) return null;
  if (!Number.isFinite(d.ts) || Date.now() - d.ts > VENCE_MS) return null;

  if (!Array.isArray(d.ids) || d.ids.length !== ORDEN.length * POR_BANDA) return null;
  if (!d.ids.every((i) => Number.isInteger(i) && i >= 0 && i < BANCO.length)) return null;
  if (new Set(d.ids).size !== d.ids.length) return null;
  // La forma tiene que seguir siendo POR_BANDA de cada nivel y en ese orden:
  // la regla de nivel cuenta con eso.
  const forma = ORDEN.flatMap((b) => Array(POR_BANDA).fill(b));
  if (!d.ids.every((idx, k) => BANCO[idx].banda === forma[k])) return null;
  if (d.i < 0 || d.i > d.ids.length) return null;

  const respuestas = d.ids.map((idx, i) => {
    const r = d.respuestas[i];
    return Number.isInteger(r) && r >= -1 && r < BANCO[idx].opts.length ? r : undefined;
  });
  return { ids: d.ids, i: d.i, respuestas, terminado: d.terminado === true };
}

/* replaceState y no location.hash: así no salta el scroll ni se suma una
   entrada al historial por cada test terminado. */
function escribirHash(nivel, puntaje) {
  try {
    history.replaceState(null, "", `#resultado=${nivel.toLowerCase()}-${puntaje}`);
  } catch {
    /* sin history: el test anda igual, sólo no queda el link */
  }
}

function limpiarHash() {
  try {
    history.replaceState(null, "", location.pathname);
  } catch {
    /* idem */
  }
}

function leerHash() {
  const m = /^#resultado=([a-z]\d)-(\d{1,2})$/i.exec(location.hash);
  if (!m) return null;
  const nivel = m[1].toUpperCase();
  const puntaje = Number(m[2]);
  if (!ORDEN.includes(nivel) || puntaje > PREGUNTAS.length) return null;
  return { nivel, puntaje };
}

/* ---------- Render ------------------------------------------------------- */

function mostrarPantalla(cual) {
  estado.pantalla = cual;
  $("pantalla-intro").hidden = cual !== "intro";
  $("pantalla-quiz").hidden = cual !== "quiz";
  $("pantalla-resultado").hidden = cual !== "resultado";
}

function pintarPregunta() {
  const en = enIngles();
  const q = PREGUNTAS[estado.i];

  $("quiz-progreso").textContent =
    (en ? "QUESTION " : "PREGUNTA ") + (estado.i + 1) + " / " + PREGUNTAS.length;
  $("quiz-banda").textContent = q.banda;
  $("quiz-barra-relleno").style.width =
    Math.round((estado.i / PREGUNTAS.length) * 100) + "%";
  $("quiz-pregunta").textContent = q.q;

  const cont = $("quiz-opciones");
  cont.textContent = "";
  q.opts.forEach((texto, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "opcion";
    const letra = document.createElement("b");
    letra.textContent = "ABCD"[idx];
    const span = document.createElement("span");
    span.textContent = texto;
    btn.append(letra, span);
    btn.addEventListener("click", () => responder(idx));
    cont.append(btn);
  });

  $("btn-anterior").disabled = estado.i === 0;
  $("btn-anterior").style.visibility = estado.i === 0 ? "hidden" : "visible";
}

function pintarResultado() {
  const en = enIngles();
  const { nivel, puntaje } = estado.resultado ?? calcular();
  const L = NIVELES[nivel];

  /* Si el resultado llegó por un link compartido no tenemos las respuestas:
     se muestra el nivel, pero no el repaso, que sin ellas no existe. */
  const conRespuestas = estado.respuestas.some((r) => r !== undefined);

  $("res-nivel").textContent = nivel;
  $("res-nombre").textContent = en ? L.nombreEn : L.nombre;
  /* Saltar cuenta igual que errar —quien saltea no sabía la respuesta—, pero
     no es lo mismo de cara a quien lee su resultado: sin esto, «14/20» hace
     pensar que erró seis cuando en realidad dejó tres en blanco. */
  const salteadas = conRespuestas
    ? estado.respuestas.filter((r) => r === -1 || r === undefined).length
    : 0;
  $("res-puntaje").textContent =
    puntaje +
    "/" +
    PREGUNTAS.length +
    (en ? " correct" : " correctas") +
    (salteadas ? (en ? ` · ${salteadas} unanswered` : ` · ${salteadas} sin contestar`) : "");
  $("res-blurb").textContent = en ? L.blurbEn : L.blurb;
  $("res-curso").textContent = en ? L.cursoEn : L.curso;
  $("res-porque").textContent = en ? L.porqueEn : L.porque;

  const foco = $("res-foco");
  foco.textContent = "";
  (en ? L.focoEn : L.foco).forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    foco.append(li);
  });

  const marcador = `${nivel} (${puntaje}/${PREGUNTAS.length})`;
  const texto = conRespuestas
    ? en
      ? `Hi Vicky! I did the level test on the site: ${marcador}. I'd like to know more about classes.`
      : `¡Hola Vicky! Hice el test de nivel en la web: ${marcador}. Me gustaría saber más sobre las clases.`
    : en
      ? `Hi Vicky! I'm looking at a level test result: ${marcador}. I'd like to know more about classes.`
      : `¡Hola Vicky! Estoy viendo un resultado del test de nivel: ${marcador}. Me gustaría saber más sobre las clases.`;
  $("res-wa").href = `https://wa.me/${WA_TEST}?text=${encodeURIComponent(texto)}`;

  const repaso = $("res-repaso");
  repaso.textContent = "";
  repaso.closest(".repaso").hidden = !conRespuestas;
  if (!conRespuestas) return;

  PREGUNTAS.forEach((q, i) => {
    const dada = estado.respuestas[i];
    const ok = dada === q.a;
    const salteada = dada === -1 || dada === undefined;

    const li = document.createElement("li");
    const marca = document.createElement("span");
    marca.className = "marca " + (ok ? "marca--ok" : "marca--no");
    marca.textContent = ok ? "✓" : salteada ? "–" : "✕";

    const cuerpo = document.createElement("div");
    const preg = document.createElement("div");
    preg.className = "pregunta";
    preg.textContent = q.q;
    const det = document.createElement("div");
    det.className = "detalle";
    det.textContent =
      (en ? "Correct: " : "Correcta: ") +
      q.opts[q.a] +
      (ok || salteada ? "" : (en ? " · you chose: " : " · elegiste: ") + q.opts[dada]);

    cuerpo.append(preg, det);
    li.append(marca, cuerpo);
    repaso.append(li);
  });
}

function render() {
  if (estado.pantalla === "quiz") pintarPregunta();
  if (estado.pantalla === "resultado") pintarResultado();
}

/* ---------- Interacción -------------------------------------------------- */

function responder(idx) {
  estado.respuestas[estado.i] = idx;
  const siguiente = estado.i + 1;
  estado.i = siguiente;

  if (siguiente >= PREGUNTAS.length) {
    const { nivel, puntaje } = calcular();
    estado.resultado = { nivel, puntaje };
    guardar(true);
    escribirHash(nivel, puntaje);
    mostrarPantalla("resultado");
    pintarResultado();
    registrar("resultado", {
      nivel,
      puntaje,
      contestadas: estado.respuestas.filter((r) => r !== -1 && r !== undefined).length,
    });
  } else {
    guardar();
    pintarPregunta();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Empezar de cero incluye sortear preguntas nuevas: quien rehace el test no
   recibe las mismas, que es el punto de tener banco. */
function desdeCero() {
  usar(sortear());
  estado.i = 0;
  estado.respuestas = [];
  estado.resultado = null;
  olvidar();
  limpiarHash();
  $("btn-continuar").hidden = true;
}

document.addEventListener("DOMContentLoaded", () => {
  if (!$("pantalla-intro")) return;

  usar(sortear());
  const guardado = leerGuardado();
  const compartido = leerHash();

  $("btn-empezar").addEventListener("click", () => {
    desdeCero();
    mostrarPantalla("quiz");
    pintarPregunta();
    registrar("inicio");
  });

  $("btn-saltar").addEventListener("click", () => responder(-1));

  $("btn-anterior").addEventListener("click", () => {
    estado.i = Math.max(0, estado.i - 1);
    guardar();
    pintarPregunta();
  });

  $("btn-reiniciar").addEventListener("click", () => {
    desdeCero();
    mostrarPantalla("intro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("btn-compartir").addEventListener("click", async () => {
    const { nivel, puntaje } = estado.resultado ?? calcular();
    const url = `${location.origin}${location.pathname}#resultado=${nivel.toLowerCase()}-${puntaje}`;
    const en = enIngles();
    const btn = $("btn-compartir");
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          text: en
            ? `My English level is ${nivel} (${puntaje}/${PREGUNTAS.length}).`
            : `Mi nivel de inglés es ${nivel} (${puntaje}/${PREGUNTAS.length}).`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      btn.textContent = en ? "Link copied ✓" : "Link copiado ✓";
      setTimeout(() => {
        btn.textContent = enIngles() ? btn.dataset.en : btn.dataset.es;
      }, 2000);
    } catch {
      /* cancelar el diálogo de compartir entra por acá, y no hay nada que hacer */
    }
  });

  /* Un resultado en el hash manda sobre todo lo demás: es alguien que recargó
     su resultado o que abrió el link de otra persona. */
  if (compartido) {
    estado.resultado = compartido;
    // Si el guardado coincide, es quien hizo el test: le mostramos su repaso.
    // Hay que calcular sobre las preguntas que le tocaron a él, no sobre las
    // que acabamos de sortear, o el puntaje no daría nunca.
    if (guardado?.terminado) {
      usar(guardado.ids);
      const propio = calcular(guardado.respuestas);
      if (propio.nivel === compartido.nivel && propio.puntaje === compartido.puntaje) {
        estado.respuestas = guardado.respuestas;
        estado.i = PREGUNTAS.length;
      } else {
        usar(sortear()); // el link es de otra persona: que tenga un test nuevo
      }
    }
    mostrarPantalla("resultado");
    pintarResultado();
  } else if (guardado && !guardado.terminado && guardado.i > 0 && guardado.i < guardado.ids.length) {
    $("btn-continuar").hidden = false;
    $("continuar-detalle").textContent = `${guardado.i}/${guardado.ids.length}`;
    $("btn-continuar").addEventListener("click", () => {
      usar(guardado.ids);
      estado.i = guardado.i;
      estado.respuestas = guardado.respuestas;
      mostrarPantalla("quiz");
      pintarPregunta();
    });
  }

  // Cuando app.js cambia el idioma, repintamos lo que se genera por JS.
  document.addEventListener("idiomacambiado", render);
});
