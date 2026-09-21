import { drawCertificate, downloadCertificatePng } from "./certificate.js";
import {
  state, showConsigna, setShowConsigna, setRenderer,
  loadState, resetState, normalizeNombre, startStation, checkAnswer,
  revealCorrect, goNext, renderCertificate, submitPayload, setSheetStatus,
  COURSES, GROUPS, STORAGE_KEY, initOfflineQueue, flushPendingSubmissions,
} from "./flow.js";
import {
  renderIdentification, renderQuestion, renderStationResult,
  renderCert, renderConsignaView,
} from "./ui.js";

const app = document.getElementById("app");

function bindConsigna() {
  const open = () => { setShowConsigna(true); window.scrollTo(0, 0); render(); };
  const close = () => { setShowConsigna(false); window.scrollTo(0, 0); render(); };
  document.getElementById("btn-consigna")?.addEventListener("click", open);
  document.getElementById("btn-leer-consigna")?.addEventListener("click", open);
  document.getElementById("btn-cerrar-consigna")?.addEventListener("click", close);
  document.getElementById("btn-cerrar-consigna-2")?.addEventListener("click", close);
}

function bindCommon() {
  document.getElementById("btn-reset")?.addEventListener("click", () => document.getElementById("reset-dialog")?.showModal());
  document.getElementById("btn-cancel")?.addEventListener("click", () => document.getElementById("reset-dialog")?.close());
  document.getElementById("btn-confirm")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    resetState();
    setShowConsigna(false);
    render();
  });
}

function render() {
  if (showConsigna) { app.innerHTML = renderConsignaView(); bindConsigna(); bindCommon(); return; }
  if (state.station === 0) {
    app.innerHTML = renderIdentification();
    document.getElementById("id-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      const apellidoNombre = String(data.get("apellidoNombre") || "");
      const curso = String(data.get("curso") || "");
      const grupo = String(data.get("grupo") || "");
      const leido = form.leido.checked;
      const error = document.getElementById("id-error");
      if (apellidoNombre.trim().split(/\s+/).length < 2) { error.hidden = false; error.textContent = "Ingresá apellido y nombre."; return; }
      if (!COURSES.includes(curso) || !GROUPS.includes(grupo)) { error.hidden = false; error.textContent = "Elegí curso y grupo."; return; }
      if (!leido) { error.hidden = false; error.textContent = "Tenés que confirmar que leíste la consigna y el Anotador."; return; }
      state.student = { apellidoNombre: normalizeNombre(apellidoNombre), curso, grupo };
      startStation(1);
    });
  } else if (state.station >= 1 && state.station <= 4) {
    if (!state.session) { startStation(state.station); return; }
    if (state.session.phase === "result") {
      app.innerHTML = renderStationResult();
      document.getElementById("btn-continue").addEventListener("click", () => {
        if (state.session.passedStation) {
          if (state.station >= 4) { void renderCertificate(); return; }
          startStation(state.station + 1);
        } else startStation(state.station);
      });
    } else {
      app.innerHTML = renderQuestion();
      app.querySelectorAll(".option").forEach((btn) => btn.addEventListener("click", () => checkAnswer(Number(btn.dataset.i))));
      document.getElementById("btn-entendido")?.addEventListener("click", revealCorrect);
      document.getElementById("btn-next")?.addEventListener("click", goNext);
    }
  } else {
    app.innerHTML = renderCert();
    const canvas = document.getElementById("cert-canvas");
    const data = {
      apellidoNombre: state.student.apellidoNombre, curso: state.student.curso,
      grupo: state.student.grupo, timestamp: state.timestamp, code: state.code,
      attempts: state.attempts,
    };
    void drawCertificate(canvas, data);
    document.getElementById("btn-png").addEventListener("click", () => { void downloadCertificatePng(canvas, data); });
    if (state.submitted) setSheetStatus("ok"); else void submitPayload();
  }
  bindCommon();
  bindConsigna();
}

setRenderer(render);
loadState();
initOfflineQueue();
window.addEventListener("online", () => {
  void flushPendingSubmissions();
  if (state.passed && state.code && !state.submitted) void submitPayload();
});
render();
