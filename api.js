/** Pegá acá la URL de la aplicación web de Apps Script. */
export const SHEETS_ENDPOINT = "PEGAR_URL_DEL_WEB_APP";

const PENDING_KEY = "pendingSubmissions";
const SUBMITTED_KEY = "paseLab_submittedCodes";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function isConfigured() {
  return SHEETS_ENDPOINT.startsWith("http") && !SHEETS_ENDPOINT.includes("PEGAR_URL");
}

function submittedCodes() {
  return readJson(SUBMITTED_KEY, []);
}

function markSubmitted(code) {
  const set = new Set(submittedCodes());
  set.add(code);
  writeJson(SUBMITTED_KEY, [...set]);
}

function isSubmitted(code) {
  return submittedCodes().includes(code);
}

function pendingQueue() {
  return readJson(PENDING_KEY, []);
}

function enqueue(payload) {
  const queue = pendingQueue().filter((item) => item.codigo !== payload.codigo);
  queue.push(payload);
  writeJson(PENDING_KEY, queue);
}

function dequeue(code) {
  writeJson(
    PENDING_KEY,
    pendingQueue().filter((item) => item.codigo !== code),
  );
}

async function postPayload(payload) {
  if (!isConfigured()) return false;
  if (!navigator.onLine) return false;
  try {
    await fetch(SHEETS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Envía el resultado a Google Sheets. Si falla, queda en cola offline.
 * Evita el doble envío con un flag por código.
 * @param {object} payload
 * @returns {Promise<"ok"|"queued">}
 */
export async function submitToSheets(payload) {
  if (!payload?.codigo) return "queued";
  if (isSubmitted(payload.codigo)) return "ok";
  const sent = await postPayload(payload);
  if (sent) {
    markSubmitted(payload.codigo);
    dequeue(payload.codigo);
    return "ok";
  }
  enqueue(payload);
  return "queued";
}

/**
 * Reintenta la cola pendiente.
 */
export async function flushPendingSubmissions() {
  for (const payload of pendingQueue()) {
    if (isSubmitted(payload.codigo)) {
      dequeue(payload.codigo);
      continue;
    }
    const sent = await postPayload(payload);
    if (sent) {
      markSubmitted(payload.codigo);
      dequeue(payload.codigo);
    }
  }
}

export function initOfflineQueue() {
  window.addEventListener("online", () => {
    void flushPendingSubmissions();
  });
  void flushPendingSubmissions();
}
