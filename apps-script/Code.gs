/**
 * Backend del Pase de Laboratorio.
 * Pegá este archivo en Extensiones → Apps Script de la hoja de cálculo.
 *
 * Implementar → Nueva implementación → Aplicación web
 * Ejecutar como: Yo
 * Quién tiene acceso: Cualquier usuario
 */

var SHEET_NAME = "Pases";
var HEADERS = [
  "Fecha",
  "Apellido y Nombre",
  "Curso",
  "Grupo",
  "Código",
  "Int. E1",
  "Int. E2",
  "Int. E3",
  "Int. E4",
  "Preguntas falladas",
  "Dispositivo",
  "Observaciones",
];

function doGet() {
  return ContentService.createTextOutput("OK");
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = parseBody_(e);
    var sheet = getOrCreateSheet_();
    ensureHeaders_(sheet);

    var row = [
      data.timestamp || new Date().toISOString(),
      data.apellidoNombre || "",
      data.curso || "",
      data.grupo || "",
      data.codigo || "",
      data.intentosE1 || 0,
      data.intentosE2 || 0,
      data.intentosE3 || 0,
      data.intentosE4 || 0,
      formatFailed_(data.erroresFrecuentes),
      data.userAgent || "",
      "",
    ];

    var existing = findRowByStudent_(
      sheet,
      String(data.apellidoNombre || ""),
      String(data.curso || ""),
    );
    if (existing > 0) {
      var previousObs = String(sheet.getRange(existing, 12).getValue() || "");
      var suffix = "(reintento)";
      row[11] = previousObs ? previousObs + " " + suffix : suffix;
      sheet.getRange(existing, 1, 1, HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Cuerpo vacío");
  }
  return JSON.parse(e.postData.contents);
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    return;
  }
  var first = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (String(first[0]).trim() === "") {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function findRowByStudent_(sheet, nombre, curso) {
  if (!nombre || !curso) return -1;
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var values = sheet.getRange(2, 2, last - 1, 2).getValues();
  var keyNombre = String(nombre).toLowerCase().trim();
  var keyCurso = String(curso).toLowerCase().trim();
  for (var i = 0; i < values.length; i++) {
    var rowNombre = String(values[i][0] || "").toLowerCase().trim();
    var rowCurso = String(values[i][1] || "").toLowerCase().trim();
    if (rowNombre === keyNombre && rowCurso === keyCurso) return i + 2;
  }
  return -1;
}

function formatFailed_(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value ? String(value) : "";
}
