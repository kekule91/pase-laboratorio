import { consignaHtml } from "./consigna.js";
import {
  LETTERS, state, showConsigna, formatFecha, totalAttempts,
  escapeHtml, COURSES, GROUPS, STATIONS,
} from "./flow.js";

export function headerHtml() {
  const name = state.student.apellidoNombre || "Sin identificar";
  const inExam = state.station >= 1 && state.station <= 4;
  const label = showConsigna ? "Consigna del TP" : state.station >= 5 ? "Pase emitido" : inExam ? `Estación ${state.station}/4` : "Identificación";
  const segs = STATIONS.map((meta) => {
    let fill = 0;
    if (state.passed || state.station > meta.id) fill = 100;
    else if (state.station === meta.id && state.session) {
      const total = Math.max(state.session.questions.length, 1);
      const answered = state.session.phase === "ask" ? state.session.index : state.session.index + 1;
      fill = Math.round((answered / total) * 100);
    }
    return `<div class="seg"><div class="seg-fill" style="width:${fill}%"></div></div>`;
  }).join("");
  const sub = inExam && state.session && !showConsigna
    ? `<p class="mono muted">Pregunta ${state.session.index + 1}/${state.session.questions.length}</p>` : "";
  const consignaBtn = showConsigna ? "" : `<button type="button" class="btn ghost hud-btn" id="btn-consigna">Consigna</button>`;
  return `<header class="hud"><div class="hud-row"><div>
    <p class="kicker">Lab-05 · TP reacciones</p>
    <p class="hud-name">${escapeHtml(name)}</p></div>
    <div class="hud-right hud-actions">${consignaBtn}<div>
    <p class="kicker">${label}</p>${sub}</div></div></div>
    <div class="segs">${segs}</div></header>`;
}

function resetHtml() {
  return `<button type="button" class="reset" id="btn-reset">Reiniciar</button>
    <dialog id="reset-dialog"><h2>¿Reiniciar el pase?</h2>
    <p>Esto borra tu progreso en este dispositivo. El registro ya enviado a la planilla no se elimina.</p>
    <menu><button type="button" class="btn ghost" id="btn-cancel">Cancelar</button>
    <button type="button" class="btn primary" id="btn-confirm">Confirmar reinicio</button></menu></dialog>`;
}

export function renderIdentification() {
  const courseOpts = COURSES.map((c) => `<option value="${c}">${c}</option>`).join("");
  const groupOpts = GROUPS.map((g) => `<option value="${g}">Grupo ${g}</option>`).join("");
  const cards = STATIONS.map((s) => `<li class="mini"><p class="kicker">Estación ${s.id} · ${s.pass}/${s.count}</p><p>${s.title}</p></li>`).join("");
  return `${headerHtml()}<main class="wrap">
    <section class="panel"><p class="kicker">Sistema de habilitación</p>
    <h1>Pase de Laboratorio</h1>
    <p class="muted">Antes de entrar al TP de Reacciones químicas tenés que aprobar cuatro estaciones. Si las completás, se emite tu pase y queda registrado en la planilla del docente.</p>
    <ol class="grid2">${cards}</ol>
    <button type="button" class="btn primary" id="btn-leer-consigna">Leer la consigna del TP</button></section>
    <form class="panel" id="id-form" novalidate>
    <h2 class="kicker">Identificación</h2>
    <label>Apellido y nombre<input name="apellidoNombre" autocomplete="name" required placeholder="Pérez Lucía"></label>
    <label>Curso<select name="curso" required><option value="">Elegí el curso</option>${courseOpts}</select></label>
    <label>Grupo de trabajo<select name="grupo" required><option value="">Elegí el grupo</option>${groupOpts}</select></label>
    <label class="check"><input type="checkbox" name="leido"><span>Leí completa la consigna del TP y el Anotador de laboratorio.</span></label>
    <p class="error" id="id-error" hidden></p>
    <button class="btn primary" type="submit">Ingresar a las estaciones</button>
    </form></main>${resetHtml()}`;
}

export function renderQuestion() {
  const session = state.session;
  const meta = STATIONS[state.station - 1];
  const q = session.questions[session.index];
  const locked = session.phase !== "ask";
  const showCorrect = session.phase === "reveal" || session.isCorrect === true;
  const options = q.options.map((opt, i) => {
    let cls = "";
    if (locked && session.selected === i && session.isCorrect === false) cls = "wrong";
    else if (locked && showCorrect && i === q.correct) cls = "correct";
    return `<button type="button" class="option ${cls}" data-i="${i}" ${locked ? "disabled" : ""}><span class="letter">${LETTERS[i]}</span><span>${escapeHtml(opt)}</span></button>`;
  }).join("");
  const last = session.index >= session.questions.length - 1;
  let feedback = "";
  if (session.phase !== "ask") {
    feedback = `<div class="feed ${session.isCorrect ? "ok" : "bad"}" role="status"><p><strong>${session.isCorrect ? "Correcto." : "Esa no es."}</strong></p>${session.isCorrect === false ? `<p>${escapeHtml(q.feedback)}</p>` : ""}${session.phase === "reveal" ? `<p class="ok-text">La respuesta correcta es: ${escapeHtml(q.options[q.correct])}</p>` : ""}</div>`;
  }
  let actions = "";
  if (session.phase === "feedback" && session.isCorrect === false) actions = `<button type="button" class="btn amber" id="btn-entendido">Entendido</button>`;
  else if (session.phase === "reveal" || session.isCorrect === true) actions = `<button type="button" class="btn primary" id="btn-next">${last ? "Ver resultado de la estación" : "Siguiente pregunta"}</button>`;
  return `${headerHtml()}<main class="wrap">
    <p class="kicker">Estación ${meta.id}/4 · intento ${state.attempts[meta.id - 1]}</p>
    <h1>${meta.title}</h1>
    <p class="muted mono">${session.score}/${meta.pass} para aprobar · mínimo ${meta.pass}/${meta.count}</p>
    <section class="panel"><p class="muted mono">Pregunta ${session.index + 1} de ${session.questions.length}</p>
    <h2>${escapeHtml(q.prompt)}</h2><div class="options">${options}</div>${feedback}<div class="actions">${actions}</div></section>
    </main>${resetHtml()}`;
}

export function renderStationResult() {
  const session = state.session;
  const meta = STATIONS[state.station - 1];
  const passed = session.passedStation;
  const msg = passed ? (state.station >= 4 ? "Completaste las cuatro estaciones. Ahora se emite tu pase." : "Podés seguir a la próxima estación. No se puede volver atrás.") : (meta.id === 3 ? "En seguridad el estándar es 6/6. Se sortean de nuevo las preguntas." : "No alcanzaste el mínimo. Esta estación se vuelve a sortear.");
  const label = passed ? (state.station >= 4 ? "Emitir pase de laboratorio" : "Continuar") : "Reintentar estación";
  return `${headerHtml()}<main class="wrap"><section class="panel center">
    <p class="kicker">Estación ${meta.id}/4</p>
    <h1>${passed ? "Estación aprobada" : "Hay que repetir la estación"}</h1>
    <p class="mono">${session.score}/${session.questions.length} · mínimo ${meta.pass}/${meta.count}</p>
    <p class="muted">${msg}</p>
    <button type="button" class="btn primary" id="btn-continue">${label}</button>
    </section></main>${resetHtml()}`;
}

export function renderCert() {
  const s = state.student;
  const attempts = `E1 ${state.attempts[0]} · E2 ${state.attempts[1]} · E3 ${state.attempts[2]} · E4 ${state.attempts[3]}`;
  return `${headerHtml()}<main class="wrap"><p class="kicker">Emisión completa</p><h1>Pase de Laboratorio</h1>
    <article class="panel cert"><p class="kicker">Pase de laboratorio — TP reacciones químicas</p>
    <h2>${escapeHtml(s.apellidoNombre || "")}</h2>
    <dl><div><dt>Curso</dt><dd>${escapeHtml(s.curso || "")}</dd></div>
    <div><dt>Grupo</dt><dd>Grupo ${escapeHtml(s.grupo || "")}</dd></div>
    <div><dt>Fecha y hora</dt><dd>${state.timestamp ? formatFecha(state.timestamp) : ""}</dd></div>
    <div><dt>Intentos</dt><dd>${totalAttempts()} totales — ${attempts}</dd></div>
    <div><dt>Código</dt><dd class="code">${state.code || "------"}</dd></div></dl>
    <div class="stamp">Habilitado/a</div></article>
    <button type="button" class="btn primary" id="btn-png">Descargar pase (PNG)</button>
    <p id="sheet-status" class="status">${state.submitted ? "✓ Registrado en la planilla del docente" : "⏳ Enviando…"}</p>
    <canvas id="cert-canvas" hidden></canvas></main>${resetHtml()}`;
}

export function renderConsignaView() {
  const back = state.station === 0 ? "Volver a identificarme" : "Volver al pase";
  return `${headerHtml()}<main class="wrap">
    <button type="button" class="btn ghost" id="btn-cerrar-consigna">${back}</button>
    ${consignaHtml()}
    <div class="actions"><button type="button" class="btn primary" id="btn-cerrar-consigna-2">${back}</button></div>
    </main>${resetHtml()}`;
}
