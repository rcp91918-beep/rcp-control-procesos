let raiz = null;      // datos de la carpeta raíz
let camino = [];      // [{id, name}]
let actual = null;    // carpeta abierta
let enInicio = true;  // true = pantalla principal (solo semestres)

const esSemestre = (n) => /^semestre/i.test(n.trim());

/* ICONOS (trazos simples, mismo estilo en todo el menú) */
const IC = {
  casa: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  aviso: "M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01",
  oferta: "M3 12V4h8l10 10-8 8zM7.5 8.5h.01",
  malla: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  video: "M5 4l14 8-14 8z",
  estrella: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  carpeta: "M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  archivo: "M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5",
  perfil: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c.8-4 4-6 8-6s7.2 2 8 6",
  escuela: "M4 21V9l8-5 8 5v12M9 21v-6h6v6",
  libro: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21h15",
  musica: "M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z",
  compartir: "M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5",
  der: "M9 5l7 7-7 7",
  abajo: "M5 9l7 7 7-7",
  arriba: "M5 15l7-7 7 7",
  externo: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
};
const svgIcono = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function fechaCorta(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return d.getDate() + " " + MESES[d.getMonth()];
}
function haceTexto(ms) {
  const dias = Math.floor((Date.now() - ms) / 86400000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return "hace " + dias + " días";
  return "el " + fechaCorta(ms);
}
function tipoArchivo(nombre) {
  const m = /\.([a-z0-9]+)$/i.exec(nombre.trim());
  const ext = m ? m[1].toLowerCase() : "";
  let clase = "";
  if (ext === "pdf") clase = "pdf";
  else if (/^(jpe?g|png|gif|webp|bmp|heic|heif)$/.test(ext)) clase = "img";
  else if (/^(docx?|odt|rtf|txt)$/.test(ext)) clase = "doc";
  else if (/^(xlsx?|csv|ods)$/.test(ext)) clase = "xls";
  else if (/^(pptx?|odp)$/.test(ext)) clase = "ppt";
  const etiqueta = ext === "jpeg" ? "JPG" : (ext ? ext.slice(0, 4).toUpperCase() : "ARCH");
  return { etiqueta: etiqueta, clase: clase };
}
function nombreSinExt(nombre) { return nombre.replace(/\.[a-z0-9]{1,5}$/i, ""); }


/* NOVEDADES: se compara la última modificación en Drive con lo que el usuario ya vio */
const VISTO_KEY = "rcp_visto";
let umbralNuevo = null; // fecha a partir de la cual un archivo cuenta como nuevo
function leerVisto() {
  try { return JSON.parse(localStorage.getItem(VISTO_KEY)) || {}; } catch (e) { return {}; }
}
function marcarVisto(id, t) {
  const v = leerVisto();
  v[id] = t;
  try { localStorage.setItem(VISTO_KEY, JSON.stringify(v)); } catch (e) {}
}
const fechaCarpeta = (f) => f.latest || f.updated || 0;
const esNuevo = (f) => fechaCarpeta(f) > (leerVisto()[f.id] || 0);
function crearBadge(t) {
  const s = document.createElement("span");
  s.className = "nuevo";
  s.textContent = t;
  return s;
}

/* DIAGNÓSTICO: abrir la página con ?debug al final de la dirección */
function mostrarDebug() {
  const av = raiz.folders.find(f => /^avisos/i.test(f.name.trim()));
  let box = document.getElementById("debugBox");
  if (!box) {
    box = document.createElement("pre");
    box.id = "debugBox";
    box.style.cssText = "background:#111;color:#0f0;padding:12px;margin:0;font-size:13px;white-space:pre-wrap;position:relative;z-index:60;";
    document.body.insertBefore(box, document.body.firstChild);
  }
  box.textContent = "VERSION v2.10\nCarpetas recibidas: " + raiz.folders.length +
    "\nAVISOS: " + (av ? "encontrado" : "NO encontrado") +
    (av ? "\nlatest: " + av.latest + "\nupdated: " + av.updated +
          "\nvisto antes: " + (leerVisto()[av.id] || "nunca") +
          "\nnuevo: " + esNuevo(av) : "");
}

function mostrarError(e) {
  document.getElementById("contenido").innerHTML =
    '<p class="msg error">No se pudo cargar: ' + e.message + '</p>';
}

/* HISTORIAL: el botón o gesto "Atrás" del celular sube un nivel */
let restaurando = false;
let primeraVista = true;
let origenMenu = false;  // true si la carpeta se abrió desde el menú de las tres rayitas
let vistaPrevia = null;  // dónde estaba la persona antes de abrir esa carpeta del menú
let favBase = 0;  // si es mayor que 0, la carpeta se abrió desde Favoritos (largo del camino de esa carpeta)
function vistaActual() { return { v: enInicio ? "i" : "c", camino: camino.slice(), m: origenMenu, fb: favBase }; }
function registrarVista() {
  if (restaurando) return;
  const est = vistaActual();
  if (primeraVista) {
    primeraVista = false;
    try { history.replaceState(est, ""); } catch (e) {}
    return;
  }
  const prev = history.state;
  if (prev && prev.v === est.v && JSON.stringify(prev.camino) === JSON.stringify(est.camino)) return;
  try { history.pushState(est, ""); } catch (e) {}
}

/* PANTALLA PRINCIPAL: solo semestres; el resto va al menú */
async function irInicio() {
  cerrarMenu();
  favBase = 0;
  document.getElementById("buscador").value = "";
  document.getElementById("contenido").innerHTML = '<p class="msg">Cargando...</p>';
  try {
    raiz = await cargar(null);
    umbralNuevo = null;
    origenMenu = false;
    camino = [{ id: raiz.id, name: raiz.name }];
    enInicio = true;
    actual = {
      id: raiz.id,
      name: "Semestres",
      folders: raiz.folders.filter(f => esSemestre(f.name)),
      files: []
    };
    dibujar(actual);
    armarMenu();
    registrarVista();
    dibujarAviso();
  } catch (e) { mostrarError(e); }
}

/* Tarjeta "Último aviso" de la pantalla principal */
async function dibujarAviso() {
  const cont = document.getElementById("avisoDestacado");
  cont.style.display = "none";
  cont.innerHTML = "";
  const av = raiz && raiz.folders.find(f => /^avisos/i.test(f.name.trim()));
  if (!av) return;
  try {
    const d = await cargar(av.id);
    if (!enInicio) return;
    const ult = d.files.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
    if (!ult) return;
    const b = document.createElement("button");
    b.className = "aviso-card";
    b.innerHTML = '<span class="ico">' + svgIcono(IC.aviso) + '</span><span class="cuerpo"><span class="rot"></span><div class="nom"></div><div class="cuando"></div></span><span class="trail">' + svgIcono(IC.der) + '</span>';
    const rot = b.querySelector(".rot");
    rot.appendChild(document.createTextNode("Último aviso"));
    if (esNuevo(av)) rot.appendChild(crearBadge("✓ Nuevo"));
    b.querySelector(".nom").textContent = nombreSinExt(ult.name);
    b.querySelector(".cuando").textContent = "Subido " + haceTexto(ult.updated || 0);
    b.onclick = () => abrirCarpetaMenu(av);
    cont.appendChild(b);
    cont.style.display = "block";
  } catch (e) { /* sin datos: no se muestra la tarjeta */ }
}

let icpAbierto = false;
function abrirCarpetaMenu(f) {
  cerrarMenu();
  favBase = 0;
  const previo = leerVisto()[f.id];
  umbralNuevo = previo !== undefined ? previo : null;
  marcarVisto(f.id, fechaCarpeta(f));
  if (!origenMenu) vistaPrevia = vistaActual();
  origenMenu = true;
  camino = [{ id: raiz.id, name: raiz.name }];
  abrir(f.id, f.name);
  armarMenu();
}

function iconoCarpetaMenu(nombre) {
  if (/aviso/i.test(nombre)) return IC.aviso;
  if (/informaci/i.test(nombre)) return IC.info;
  if (/oferta|maestro/i.test(nombre)) return IC.oferta;
  if (/malla/i.test(nombre)) return IC.malla;
  return IC.carpeta;
}

function itemMenu(lista, o) {
  const b = document.createElement("button");
  b.className = "menu-item";
  const ico = document.createElement("span");
  ico.className = "ico" + (o.alerta ? " alerta" : "");
  ico.innerHTML = svgIcono(o.icono);
  const tx = document.createElement("span");
  tx.className = "txt";
  tx.textContent = o.texto;
  b.appendChild(ico);
  b.appendChild(tx);
  if (o.nuevo) b.appendChild(crearBadge("✓ Nuevo"));
  const tr = document.createElement("span");
  tr.className = "trail";
  tr.innerHTML = svgIcono(o.trail || IC.der);
  b.appendChild(tr);
  b.onclick = o.onclick;
  lista.appendChild(b);
  return b;
}

function tituloMenu(lista, texto) {
  const t = document.createElement("div");
  t.className = "menu-titulo";
  t.textContent = texto;
  lista.appendChild(t);
}

function armarMenu() {
  const lista = document.getElementById("menuLista");
  lista.innerHTML = "";
  itemMenu(lista, { texto: "Inicio", icono: IC.casa, onclick: irInicio });

  let hayNuevo = false;
  const carpetasMenu = raiz.folders.filter(f => !esSemestre(f.name));
  if (carpetasMenu.length || raiz.files.length) tituloMenu(lista, "Contenido");
  carpetasMenu.forEach(f => {
    const nuevo = esNuevo(f);
    if (nuevo) hayNuevo = true;
    itemMenu(lista, { texto: f.name.trim(), icono: iconoCarpetaMenu(f.name), nuevo: nuevo, alerta: nuevo, onclick: () => abrirCarpetaMenu(f) });
  });
  document.getElementById("puntoNuevo").style.display = hayNuevo ? "block" : "none";
  if (/debug/.test(location.search)) mostrarDebug();

  raiz.files.forEach(a => {
    itemMenu(lista, { texto: a.name, icono: IC.archivo, onclick: () => { cerrarMenu(); abrirVisor(a, raiz.files); } });
  });

  /* enlaces externos: se abren en otra pestaña y el menú queda abierto, así al volver estás en el menú */
  const externo = (texto, icono, url) => itemMenu(lista, { texto: texto, icono: icono, trail: IC.externo, onclick: () => window.open(url, "_blank", "noopener") });

  tituloMenu(lista, "Enlaces");
  externo("Perfil UAGRM", IC.perfil, "https://perfil.uagrm.edu.bo/estudiantes/default.php");
  externo("UAGRM Presencial", IC.escuela, "https://presencial.uagrm.edu.bo/");

  /* Mi Carrera (ICP): submenú desplegable */
  const BASE_ICP = "https://www.uagrm.edu.bo/carreras/fcet-cicp";
  const SECCIONES_ICP = [
    ["Bienvenida", "bienvenida"], ["Creación", "creacion"], ["Marco Institucional", "marco-institucional"],
    ["Objetivo", "objetivo"], ["Perfil Profesional", "perfil-profesional"], ["Campo laboral", "campo-laboral"],
    ["Laboratorio", "laboratorio"], ["Malla Curricular", "malla-curricular"], ["Contacto", "contacto"]
  ];
  itemMenu(lista, { texto: "Mi Carrera (ICP)", icono: IC.libro, trail: icpAbierto ? IC.arriba : IC.abajo, onclick: () => { icpAbierto = !icpAbierto; armarMenu(); } });
  if (icpAbierto) {
    const sub = document.createElement("div");
    sub.className = "submenu";
    SECCIONES_ICP.forEach(([texto, ancla]) => {
      const b = document.createElement("button");
      b.className = "menu-item";
      b.textContent = texto;
      b.onclick = () => window.open(BASE_ICP + "#" + ancla, "_blank", "noopener");
      sub.appendChild(b);
    });
    lista.appendChild(sub);
  }

  tituloMenu(lista, "Síguenos");
  externo("TikTok RCP", IC.musica, "https://www.tiktok.com/@rcp_reaccionaprocesos");

  /* Pie: Compartir app (hoja de compartir del teléfono; si no existe, WhatsApp directo) */
  const pie = document.getElementById("menuPie");
  pie.innerHTML = "";
  const compartir = document.createElement("button");
  compartir.className = "btn-compartir";
  compartir.innerHTML = svgIcono(IC.compartir) + "<span>Compartir app</span>";
  compartir.onclick = async () => {
    const enlace = "https://rcp91918-beep.github.io/rcp-control-procesos/";
    const texto = "🔵🔴 ¡Entra a la app de RCP! Encuentra los materiales de tus 10 semestres, avisos, malla curricular y más. Compártela con tus compañeros 👇\n" + enlace;
    if (navigator.share) {
      try { await navigator.share({ text: texto }); } catch (e) { /* el usuario canceló */ }
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank", "noopener");
    }
  };
  pie.appendChild(compartir);
  const ver = document.createElement("div");
  ver.className = "menu-ver";
  ver.textContent = "RCP · versión v2.10";
  pie.appendChild(ver);
}

/* FAVORITOS: se guardan en este celular (cada estudiante arma los suyos) */
const FAV_KEY = "rcp_fav";
function leerFav() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
}
function guardarFav(lista) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(lista)); } catch (e) {}
}
const esFav = (id) => leerFav().some(f => f.id === id);
function alternarFav(item) {
  const lista = leerFav();
  const i = lista.findIndex(f => f.id === item.id);
  if (i >= 0) lista.splice(i, 1); else lista.push(item);
  guardarFav(lista);
  return i < 0;
}
/* estrellita tocable; no abre la fila donde está */
function crearEstrella(item, alCambiar) {
  const e = document.createElement("span");
  e.setAttribute("role", "button");
  e.tabIndex = 0;
  const pintar = () => {
    const on = esFav(item.id);
    e.className = "estrella" + (on ? " on" : "");
    e.setAttribute("aria-label", on ? "Quitar de favoritos" : "Agregar a favoritos");
    e.innerHTML = svgIcono(IC.estrella);
  };
  pintar();
  const accion = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    alternarFav(item);
    pintar();
    if (alCambiar) alCambiar();
  };
  e.onclick = accion;
  e.onkeydown = (ev) => { if (ev.key === "Enter" || ev.key === " ") accion(ev); };
  return e;
}
const rutaTexto = (ruta) => ruta.slice(1).map(p => p.name.trim()).join(" › ");

/* Pantalla de favoritos */
function mostrarFavoritos() {
  favBase = 0;
  enInicio = false;
  origenMenu = false;
  camino = [{ id: raiz.id, name: raiz.name }, { id: "fav", name: "Favoritos" }];
  actual = null;
  document.getElementById("avisoDestacado").style.display = "none";
  document.getElementById("titulo").innerText = "Favoritos";
  document.getElementById("navFila").style.display = "flex";
  document.getElementById("buscador").style.display = "none";
  const ruta = document.getElementById("ruta");
  ruta.innerHTML = "";
  const a = document.createElement("a");
  a.textContent = "Inicio";
  a.onclick = irInicio;
  ruta.appendChild(a);
  ruta.insertAdjacentHTML("beforeend", "<span>›</span>");
  const u = document.createElement("a");
  u.textContent = "Favoritos";
  ruta.appendChild(u);

  const cont = document.getElementById("contenido");
  cont.innerHTML = "";
  const lista = leerFav();
  if (!lista.length) {
    cont.innerHTML = '<p class="msg">Aún no tienes favoritos. Toca la estrella ☆ en una materia o un archivo para guardarlo aquí.</p>';
  } else {
    const g = document.createElement("div");
    g.className = "lista";
    lista.forEach(f => {
      const r = document.createElement(f.tipo === "c" ? "button" : "a");
      r.className = "fila";
      if (f.tipo === "c") {
        r.innerHTML = '<span class="ico-carpeta">' + svgIcono(IC.carpeta) + '</span><span class="txt"><div class="nom"></div><div class="fec"></div></span>';
        r.onclick = () => {
          umbralNuevo = null;
          camino = f.camino.slice();
          favBase = camino.length + 1;
          abrir(f.id, f.name);
        };
      } else {
        const tipo = tipoArchivo(f.name);
        r.href = f.url;
        r.target = "_blank";
        r.rel = "noopener";
        r.innerHTML = '<span class="ext"></span><span class="txt"><div class="nom"></div><div class="fec"></div></span>';
        const ext = r.querySelector(".ext");
        ext.textContent = tipo.etiqueta;
        if (tipo.clase) ext.classList.add(tipo.clase);
        r.onclick = (ev) => { ev.preventDefault(); abrirVisor(f, [f]); };
      }
      r.querySelector(".nom").textContent = f.name.trim();
      r.querySelector(".fec").textContent = rutaTexto(f.camino);
      r.appendChild(crearEstrella(f, mostrarFavoritos));
      g.appendChild(r);
    });
    cont.appendChild(g);
  }
  registrarVista();
}

async function abrir(id, nombre, nivel) {
  if (id === "fav") { mostrarFavoritos(); return; }
  const cont = document.getElementById("contenido");
  document.getElementById("buscador").value = "";
  cont.innerHTML = '<p class="msg">Cargando...</p>';
  try {
    const d = await cargar(id);
    if (nivel === undefined) camino.push({ id: d.id, name: d.name });
    else camino = camino.slice(0, nivel + 1);
    if (nivel !== undefined && camino.length < favBase) favBase = 0;
    enInicio = false;
    actual = d;
    dibujar(d);
    registrarVista();
  } catch (e) { mostrarError(e); }
}

/* orden fijo de las carpetas de cada materia; las demás quedan después, en su orden normal */
function ordenCarpeta(nombre) {
  const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (/(primer|1er|1ro|1\s*°?)\s*parcial/.test(n)) return 1;
  if (/(segundo|2do|2\s*°?)\s*parcial/.test(n)) return 2;
  if (/examen\s*final|^final/.test(n)) return 3;
  if (/repechaje/.test(n)) return 4;
  if (/practic/.test(n)) return 5;
  return 99;
}

/* Pantalla principal: semestres en dos columnas, como tarjetas */
const ACTUAL_KEY = "rcp_actual";
const COLORES_ANIO = ["#123b8f", "#0f6b6b", "#5b3fa8", "#b4570a", "#0b2559"];
function dibujarSemestres(cont, carpetas) {
  let actualId = null;
  try { actualId = localStorage.getItem(ACTUAL_KEY); } catch (e) {}
  const g = document.createElement("div");
  g.className = "sem-grid";
  const bf = document.createElement("button");
  bf.className = "sem-fav";
  bf.innerHTML = svgIcono(IC.estrella) + "<span></span>";
  bf.querySelector("span").textContent = "Favoritos (" + leerFav().length + ")";
  bf.onclick = mostrarFavoritos;
  g.appendChild(bf);
  carpetas.forEach(c => {
    const n = (c.name.match(/\d+/) || [""])[0];
    const b = document.createElement("button");
    b.className = "sem" + (c.id === actualId ? " actual" : "");
    b.style.setProperty("--c", COLORES_ANIO[Math.min(4, Math.max(0, Math.ceil((parseInt(n, 10) || 1) / 2) - 1))]);
    b.innerHTML = '<span class="sem-anio"></span><span class="sem-num"></span><span class="sem-nom">Semestre</span><span class="sem-sub"></span>';
    b.querySelector(".sem-anio").textContent = n ? (Math.ceil(parseInt(n, 10) / 2) === 1 ? "1.er año" : Math.ceil(parseInt(n, 10) / 2) + ".º año") : "";
    b.querySelector(".sem-num").textContent = n || c.name.trim();
    if (!n) b.querySelector(".sem-nom").style.display = "none";
    const sub = b.querySelector(".sem-sub");
    sub.textContent = c.id === actualId ? "Tu semestre actual" : "\u00a0";
    b.onclick = () => {
      try { localStorage.setItem(ACTUAL_KEY, c.id); } catch (e) {}
      umbralNuevo = null;
      camino = [{ id: raiz.id, name: raiz.name }];
      origenMenu = false;
      favBase = 0;
      abrir(c.id, c.name);
    };
    g.appendChild(b);
    if (c.id !== actualId) {
      cargar(c.id).then(d => {
        if (!enInicio) return;
        sub.textContent = d.folders.length + (d.folders.length === 1 ? " materia" : " materias");
      }).catch(() => {});
    }
  });
  cont.appendChild(g);
}

function dibujar(d, filtro) {
  const f = (filtro || "").toLowerCase();
  const carpetas = d.folders.filter(x => x.name.toLowerCase().includes(f)).sort((a, b) => ordenCarpeta(a.name) - ordenCarpeta(b.name));
  const archivos = d.files.filter(x => x.name.toLowerCase().includes(f));

  document.getElementById("titulo").innerText = d.name.trim();
  document.getElementById("navFila").style.display = enInicio ? "none" : "flex";
  document.getElementById("buscador").style.display = enInicio ? "none" : "block";
  if (!enInicio) {
    const av = document.getElementById("avisoDestacado");
    av.style.display = "none";
  }

  const ruta = document.getElementById("ruta");
  ruta.innerHTML = "";
  if (!enInicio) {
    camino.forEach((p, i) => {
      if (i > 0) ruta.insertAdjacentHTML("beforeend", "<span>›</span>");
      const a = document.createElement("a");
      a.textContent = i === 0 ? "Inicio" : p.name.trim();
      a.onclick = i === 0 ? irInicio : () => abrir(p.id, p.name, i);
      ruta.appendChild(a);
    });
  }

  const cont = document.getElementById("contenido");
  cont.innerHTML = "";

  if (enInicio) {
    if (carpetas.length) dibujarSemestres(cont, carpetas);
  } else if (carpetas.length) {
    const t = document.createElement("h3");
    t.textContent = "Carpetas";
    cont.appendChild(t);
    const g = document.createElement("div");
    g.className = "lista";
    carpetas.forEach(c => {
      const b = document.createElement("button");
      b.className = "fila";
      b.innerHTML = '<span class="ico-carpeta">' + svgIcono(IC.carpeta) + '</span><span class="txt"></span><span class="trail">' + svgIcono(IC.der) + '</span>';
      b.querySelector(".txt").textContent = c.name.trim();
      if (origenMenu && umbralNuevo !== null && (c.updated || 0) > umbralNuevo) b.insertBefore(crearBadge("✓ Nuevo"), b.querySelector(".trail"));
      b.insertBefore(crearEstrella({ tipo: "c", id: c.id, name: c.name, camino: camino.map(p => ({ id: p.id, name: p.name })) }), b.querySelector(".trail"));
      b.onclick = () => abrir(c.id, c.name);
      g.appendChild(b);
    });
    cont.appendChild(g);
  }

  if (archivos.length) {
    const t = document.createElement("h3");
    t.textContent = "Archivos";
    cont.appendChild(t);
    const g = document.createElement("div");
    g.className = "lista";
    archivos.forEach(a => {
      const l = document.createElement("a");
      l.className = "fila";
      l.href = a.url;
      l.target = "_blank";
      l.rel = "noopener";
      l.onclick = (ev) => { ev.preventDefault(); abrirVisor(a, archivos); };
      const tipo = tipoArchivo(a.name);
      l.innerHTML = '<span class="ext"></span><span class="txt"><div class="nom"></div><div class="fec"></div></span>';
      const ext = l.querySelector(".ext");
      ext.textContent = tipo.etiqueta;
      if (tipo.clase) ext.classList.add(tipo.clase);
      l.querySelector(".nom").textContent = a.name;
      l.querySelector(".fec").textContent = fechaCorta(a.updated || 0);
      if (origenMenu && umbralNuevo !== null && (a.updated || 0) > umbralNuevo) l.appendChild(crearBadge("✓ Nuevo"));
      l.appendChild(crearEstrella({ tipo: "a", id: a.id, name: a.name, url: a.url, updated: a.updated || 0, camino: camino.map(p => ({ id: p.id, name: p.name })) }));
      g.appendChild(l);
    });
    cont.appendChild(g);
  }

  /* Videos de clases grabadas: solo dentro de un semestre que tenga links en videos.js */
  const numSem = !enInicio && camino.length === 2 ? parseInt((d.name.match(/\d+/) || [])[0], 10) : NaN;
  const videos = (VIDEOS[numSem] || []).filter(v => (v.materia + " " + v.docente).toLowerCase().includes(f));
  if (videos.length) {
    const t = document.createElement("h3");
    t.textContent = "Videos de clases";
    cont.appendChild(t);
    const g = document.createElement("div");
    g.className = "lista";
    videos.forEach(v => {
      const l = document.createElement("a");
      l.className = "fila";
      l.href = v.url;
      l.target = "_blank";
      l.rel = "noopener";
      l.onclick = (ev) => { ev.preventDefault(); window.open(v.url, "_blank", "noopener"); };
      l.innerHTML = '<span class="ext pdf">' + svgIcono(IC.video).replace("<svg", '<svg width="20" height="20" fill="currentColor"') + '</span><span class="txt"><div class="nom"></div><div class="fec"></div></span><span class="trail">' + svgIcono(IC.externo) + '</span>';
      l.querySelector(".nom").textContent = v.materia;
      l.querySelector(".fec").textContent = v.docente;
      g.appendChild(l);
    });
    cont.appendChild(g);
  }

  if (!carpetas.length && !archivos.length && !videos.length) {
    cont.innerHTML = '<p class="msg">' + (f ? "Sin resultados." : "Esta carpeta está vacía.") + "</p>";
  }
}

function volver() {
  if (favBase && camino.length <= favBase) { mostrarFavoritos(); return; }
  if (camino.length > 2) {
    const anterior = camino[camino.length - 2];
    abrir(anterior.id, anterior.name, camino.length - 2);
  } else if (origenMenu) {
    volverAlMenu();
  } else {
    irInicio();
  }
}

/* Al salir de una carpeta del menú: volver a donde estaba y reabrir el menú */
async function volverAlMenu() {
  const prev = vistaPrevia;
  origenMenu = false;
  vistaPrevia = null;
  if (prev && prev.v === "c") {
    camino = prev.camino.slice();
    const u = camino[camino.length - 1];
    await abrir(u.id, u.name, camino.length - 1);
  } else {
    await irInicio();
  }
  abrirMenu();
}

function filtrar() {
  if (actual) dibujar(actual, document.getElementById("buscador").value);
}

/* MENU */
function abrirMenu() {
  document.getElementById("menu").classList.add("abierto");
  document.getElementById("fondoMenu").classList.add("abierto");
}
function cerrarMenu() {
  document.getElementById("menu").classList.remove("abierto");
  document.getElementById("fondoMenu").classList.remove("abierto");
}

/* VISOR */
const esImagen = (a) => /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(a.name);
let grupoVisor = [];  // imágenes de la misma carpeta, para pasar de una a otra
let idxVisor = 0;

/* los PDF y otros archivos van en el visor de Drive; se crea uno nuevo cada vez para no ensuciar el historial */
function mostrarComoFrame(a) {
  document.getElementById("visorImgWrap").style.display = "none";
  const nuevo = document.createElement("iframe");
  nuevo.id = "visorFrame";
  nuevo.setAttribute("allow", "autoplay");
  nuevo.setAttribute("allowfullscreen", "");
  nuevo.src = "https://drive.google.com/file/d/" + a.id + "/preview";
  document.getElementById("visorFrame").replaceWith(nuevo);
}

/* las imágenes se muestran directamente en la página, para poder deslizar */
function mostrarEnVisor(a) {
  document.getElementById("visorNombre").textContent = a.name;
  document.getElementById("visorLink").href = a.url;
  if (esImagen(a)) {
    const vacio = document.createElement("iframe");
    vacio.id = "visorFrame";
    vacio.style.display = "none";
    document.getElementById("visorFrame").replaceWith(vacio);
    document.getElementById("visorImgWrap").style.display = "flex";
    const img = document.getElementById("visorImg");
    img.style.opacity = 0;
    img.onload = () => { img.style.opacity = 1; };
    img.onerror = () => { mostrarComoFrame(a); };
    img.src = "https://drive.google.com/thumbnail?id=" + a.id + "&sz=w2000";
  } else {
    mostrarComoFrame(a);
  }
  actualizarNavVisor();
}

function actualizarNavVisor() {
  const a = grupoVisor[idxVisor];
  const hay = !!a && esImagen(a) && grupoVisor.length > 1;
  const prev = document.getElementById("visorPrev");
  const next = document.getElementById("visorNext");
  const pos = document.getElementById("visorPos");
  prev.style.display = next.style.display = pos.style.display = hay ? "block" : "none";
  prev.disabled = idxVisor <= 0;
  next.disabled = idxVisor >= grupoVisor.length - 1;
  pos.textContent = hay ? (idxVisor + 1) + " / " + grupoVisor.length : "";
}

function visorMover(d) {
  const n = idxVisor + d;
  if (n < 0 || n >= grupoVisor.length) return;
  idxVisor = n;
  mostrarEnVisor(grupoVisor[n]);
}

function abrirVisor(a, lista) {
  if (!navigator.onLine) {
    alert("Sin internet: los archivos se abren solo con conexión.");
    return;
  }
  const base = lista && lista.length ? lista : [a];
  grupoVisor = esImagen(a) ? base.filter(esImagen) : [a];
  idxVisor = Math.max(0, grupoVisor.findIndex(x => x.id === a.id));
  mostrarEnVisor(a);
  document.getElementById("visor").classList.add("abierto");
  document.body.style.overflow = "hidden";
  try { history.pushState(Object.assign({ visor: true }, vistaActual()), ""); } catch (e) {}
}
function cerrarVisorInterno() {
  document.getElementById("visor").classList.remove("abierto");
  document.getElementById("visorImgWrap").style.display = "none";
  const img = document.getElementById("visorImg");
  img.onload = img.onerror = null;
  img.removeAttribute("src");
  img.style.opacity = 0;
  const vacio = document.createElement("iframe");
  vacio.id = "visorFrame";
  document.getElementById("visorFrame").replaceWith(vacio);
  document.body.style.overflow = "";
}

/* deslizar con el dedo: izquierda = siguiente, derecha = anterior */
(function () {
  const wrap = document.getElementById("visorImgWrap");
  let x0 = 0, y0 = 0, multi = false;
  wrap.addEventListener("touchstart", (e) => {
    multi = e.touches.length > 1;
    if (!multi) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }
  }, { passive: true });
  wrap.addEventListener("touchend", (e) => {
    if (multi) return;
    if (window.visualViewport && window.visualViewport.scale > 1.05) return; // con zoom no se desliza
    const t = e.changedTouches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) visorMover(dx < 0 ? 1 : -1);
  }, { passive: true });
})();
function cerrarVisor() {
  if (history.state && history.state.visor) { history.back(); return; }
  cerrarVisorInterno();
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { cerrarVisor(); cerrarMenu(); }
  else if (document.getElementById("visor").classList.contains("abierto")) {
    if (e.key === "ArrowRight") visorMover(1);
    else if (e.key === "ArrowLeft") visorMover(-1);
  }
});

function estadoRed() {
  document.getElementById("sinRed").style.display = navigator.onLine ? "none" : "block";
}
window.addEventListener("online", estadoRed);
window.addEventListener("offline", estadoRed);
estadoRed();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

window.addEventListener("popstate", async (ev) => {
  cerrarMenu();
  cerrarVisorInterno();
  const s = ev.state;
  if (!s || !s.v) return;
  const mismo = s.v === (enInicio ? "i" : "c") && JSON.stringify(s.camino) === JSON.stringify(camino);
  if (mismo) return;
  const veniaDeMenu = origenMenu && !enInicio && camino.length === 2;
  restaurando = true;
  try {
    if (s.v === "i") await irInicio();
    else {
      camino = s.camino.slice();
      const ult = camino[camino.length - 1];
      await abrir(ult.id, ult.name, camino.length - 1);
    }
    origenMenu = !!s.m;
    favBase = s.fb || 0;
  } finally { restaurando = false; }
  if (veniaDeMenu && !s.m) abrirMenu();
});

irInicio();
