/**
 * Dibuja el pase en <canvas> y lo descarga como PNG.
 */

const W = 1400;
const H = 900;

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCorner(ctx, x, y, dx, dy, size) {
  ctx.beginPath();
  ctx.moveTo(x + dx * size, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dy * size);
  ctx.stroke();
}

function formatFecha(iso) {
  const date = new Date(iso);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} data
 */
export async function drawCertificate(canvas, data) {
  await document.fonts.ready.catch(() => undefined);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#0b1016";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(53, 224, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 40; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 40; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const inset = 48;
  ctx.strokeStyle = "#35e0ff";
  ctx.lineWidth = 3;
  roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, 28);
  ctx.stroke();
  ctx.strokeStyle = "rgba(57, 255, 136, 0.45)";
  ctx.lineWidth = 1;
  roundRect(ctx, inset + 14, inset + 14, W - (inset + 14) * 2, H - (inset + 14) * 2, 18);
  ctx.stroke();

  ctx.strokeStyle = "#35e0ff";
  ctx.lineWidth = 2;
  const c = inset + 28;
  drawCorner(ctx, c, c, 1, 1, 28);
  drawCorner(ctx, W - c, c, -1, 1, 28);
  drawCorner(ctx, c, H - c, 1, -1, 28);
  drawCorner(ctx, W - c, H - c, -1, -1, 28);

  ctx.fillStyle = "#35e0ff";
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText("LAB-05  //  HABILITACIÓN PREVIA AL TP", 110, 130);

  ctx.fillStyle = "#e8f4fa";
  ctx.font = '700 42px "JetBrains Mono", monospace';
  ctx.fillText("PASE DE LABORATORIO", 110, 188);

  ctx.fillStyle = "#39ff88";
  ctx.font = '600 24px "Inter", sans-serif';
  ctx.fillText("TP Reacciones químicas  ·  5° año", 110, 228);

  ctx.strokeStyle = "rgba(53, 224, 255, 0.35)";
  ctx.beginPath();
  ctx.moveTo(110, 256);
  ctx.lineTo(980, 256);
  ctx.stroke();

  ctx.fillStyle = "#8aa3b5";
  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.fillText("ESTUDIANTE", 110, 310);
  ctx.fillStyle = "#e8f4fa";
  ctx.font = '600 36px "Inter", sans-serif';
  ctx.fillText(data.apellidoNombre || "", 110, 358);

  const attempts = data.attempts || [0, 0, 0, 0];
  const total = attempts.reduce((s, n) => s + n, 0);
  const rows = [
    ["CURSO", data.curso || ""],
    ["GRUPO", `Grupo ${data.grupo || ""}`],
    ["FECHA Y HORA", data.timestamp ? formatFecha(data.timestamp) : ""],
    ["INTENTOS", `${total} totales — E1 ${attempts[0]} · E2 ${attempts[1]} · E3 ${attempts[2]} · E4 ${attempts[3]}`],
  ];
  let y = 420;
  for (const [label, value] of rows) {
    ctx.fillStyle = "#8aa3b5";
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.fillText(label, 110, y);
    ctx.fillStyle = "#e8f4fa";
    ctx.font = '600 22px "Inter", sans-serif';
    ctx.fillText(value, 110, y + 32);
    y += 72;
  }

  ctx.fillStyle = "rgba(18, 26, 36, 0.9)";
  roundRect(ctx, 980, 300, 310, 160, 16);
  ctx.fill();
  ctx.strokeStyle = "#35e0ff";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 980, 300, 310, 160, 16);
  ctx.stroke();
  ctx.fillStyle = "#8aa3b5";
  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.fillText("CÓDIGO DE VERIFICACIÓN", 1000, 338);
  ctx.fillStyle = "#35e0ff";
  ctx.font = '700 48px "JetBrains Mono", monospace';
  ctx.fillText(data.code || "------", 1000, 400);

  ctx.save();
  ctx.translate(1130, 620);
  ctx.rotate((-14 * Math.PI) / 180);
  ctx.beginPath();
  ctx.strokeStyle = "#39ff88";
  ctx.lineWidth = 6;
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#39ff88";
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("HABILITADO/A", 0, 0);
  ctx.restore();

  ctx.fillStyle = "#8aa3b5";
  ctx.font = '400 14px "Inter", sans-serif';
  ctx.fillText(
    "El código se genera con nombre + curso + fecha. El docente lo contrasta con la planilla.",
    110,
    830,
  );
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} data
 */
export async function downloadCertificatePng(canvas, data) {
  await drawCertificate(canvas, data);
  const slug = String(data.apellidoNombre || "estudiante")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9áéíóúñ-]/gi, "");
  const filename = `pase-laboratorio-${slug || "estudiante"}-${data.code || "pase"}.png`;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const url = blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (blob) setTimeout(() => URL.revokeObjectURL(url), 1500);
}
