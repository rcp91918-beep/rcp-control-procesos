/* CONEXIÓN CON DRIVE (Google Apps Script) */
const API_URL = "https://script.google.com/macros/s/AKfycbxMtQkbagMPvafgXhxXQHyKOQMWFqwWsA4SAkrPknShFYXE-1kKy4UVDC7yhWAiFIc__A/exec";

const cache = {};

async function cargar(id) {
  const clave = id || "root";
  if (cache[clave]) return cache[clave];
  const url = id ? API_URL + "?id=" + encodeURIComponent(id) : API_URL;
  try {
    const r = await fetch(url);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    cache[clave] = d;
    try { localStorage.setItem("rcp_" + clave, JSON.stringify(d)); } catch (e) {}
    return d;
  } catch (e) {
    // Sin internet: usar la última copia guardada de esta carpeta
    let guardado = null;
    try { guardado = localStorage.getItem("rcp_" + clave); } catch (e2) {}
    if (guardado) {
      const d = JSON.parse(guardado);
      cache[clave] = d;
      return d;
    }
    throw new Error("sin conexión y esta carpeta aún no se ha abierto antes");
  }
}
