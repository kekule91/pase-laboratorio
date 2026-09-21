import { BANK, COURSES, GROUPS, STATIONS, STORAGE_KEY } from "./questions.js";
import { flushPendingSubmissions, initOfflineQueue, submitToSheets } from "./api.js";

export const LETTERS = ["A", "B", "C", "D"];

export let state = {
  student: {},
  station: 0,
  attempts: [0, 0, 0, 0],
  failedIds: [],
  passed: false,
  code: null,
  timestamp: null,
  submitted: false,
  session: null,
};

export let showConsigna = false;
export function setShowConsigna(value) { showConsigna = value; }

let renderFn = () => {};
export function setRenderer(fn) { renderFn = fn; }
function render() { renderFn(); }

export function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.attempts)) return;
    state = { ...state, ...parsed };
  } catch {}
}

export function resetState() {
  state = {
    student: {}, station: 0, attempts: [0, 0, 0, 0], failedIds: [],
    passed: false, code: null, timestamp: null, submitted: false, session: null,
  };
}

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function normalizeNombre(raw) {
  return raw.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export function formatFecha(iso) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function totalAttempts() {
  return state.attempts.reduce((s, n) => s + n, 0);
}

export function drawQuestions(n) {
  const meta = STATIONS[n - 1];
  const pool = BANK.filter((q) => q.station === n);
  const picked = meta.all ? shuffle(pool) : shuffle(pool).slice(0, meta.count);
  return picked.map((q) => {
    const order = shuffle(q.options.map((_, i) => i));
    return { ...q, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
  });
}

export function startStation(n) {
  state.station = n;
  state.passed = false;
  state.attempts[n - 1] += 1;
  state.session = {
    questions: drawQuestions(n), index: 0, score: 0, phase: "ask",
    selected: null, isCorrect: null, passedStation: null,
  };
  saveState();
  render();
}

export function checkAnswer(optionIndex) {
  const session = state.session;
  if (!session || session.phase !== "ask") return;
  const q = session.questions[session.index];
  const isCorrect = optionIndex === q.correct;
  if (!isCorrect && !state.failedIds.includes(q.id)) state.failedIds.push(q.id);
  session.selected = optionIndex;
  session.isCorrect = isCorrect;
  session.score += isCorrect ? 1 : 0;
  session.phase = "feedback";
  saveState();
  render();
}

export function revealCorrect() {
  const session = state.session;
  if (!session || session.phase !== "feedback" || session.isCorrect) return;
  session.phase = "reveal";
  saveState();
  render();
}

export function evaluateStation() {
  const session = state.session;
  const meta = STATIONS[state.station - 1];
  session.phase = "result";
  session.passedStation = session.score >= meta.pass;
  saveState();
  render();
}

export function goNext() {
  const session = state.session;
  if (session.index >= session.questions.length - 1) { evaluateStation(); return; }
  session.index += 1;
  session.phase = "ask";
  session.selected = null;
  session.isCorrect = null;
  saveState();
  render();
}

async function generateCode(nombre, curso, timestamp) {
  const encoded = new TextEncoder().encode(`${nombre}${curso}${timestamp}`);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 6).toUpperCase();
}

export async function renderCertificate() {
  const timestamp = state.timestamp || new Date().toISOString();
  const code = state.code || (await generateCode(state.student.apellidoNombre, state.student.curso, timestamp));
  state.timestamp = timestamp;
  state.code = code;
  state.passed = true;
  state.station = 5;
  state.session = null;
  saveState();
  render();
  await submitPayload();
}

export async function submitPayload() {
  const payload = {
    timestamp: state.timestamp,
    apellidoNombre: state.student.apellidoNombre,
    curso: state.student.curso,
    grupo: state.student.grupo,
    codigo: state.code,
    intentosE1: state.attempts[0],
    intentosE2: state.attempts[1],
    intentosE3: state.attempts[2],
    intentosE4: state.attempts[3],
    erroresFrecuentes: state.failedIds,
    userAgent: navigator.userAgent,
  };
  const el = document.getElementById("sheet-status");
  if (el) el.textContent = "Enviando...";
  const status = await submitToSheets(payload);
  if (status === "ok") { state.submitted = true; saveState(); }
  if (el) {
    el.textContent = status === "ok"
      ? "Registrado en la planilla del docente"
      : "Sin conexion: se reenviara automaticamente";
  }
}

export function setSheetStatus(status) {
  const el = document.getElementById("sheet-status");
  if (!el) return;
  if (status === "ok") el.textContent = "Registrado en la planilla del docente";
  else if (status === "queued") el.textContent = "Sin conexion: se reenviara automaticamente";
  else el.textContent = "Enviando...";
}

export function escapeHtml(value) {
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  const gt = "&" + "gt;";
  const quot = "&" + "quot;";
  return String(value)
    .replaceAll("&", amp)
    .replaceAll("<", lt)
    .replaceAll(">", gt)
    .replaceAll('"', quot);
}

export { COURSES, GROUPS, STATIONS, STORAGE_KEY, initOfflineQueue, flushPendingSubmissions };
