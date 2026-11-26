/* MIS HORARIOS: se guardan solo en el celular de cada persona */
const HOR_KEY = "rcp_horario";
const DIAS_H = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_L = ["L", "M", "M", "J", "V", "S"];
const COLORES_H = ["#123b8f", "#0f6b6b", "#5b3fa8", "#b4570a", "#d71920", "#2e7d32", "#c2185b", "#455a64", "#0288d1", "#6d4c41", "#827717", "#00897b", "#ef6c00", "#7b1fa2", "#00838f"];
const BASE_MIN = 420; // 07:00
const PASO = 45;      // períodos de 45 minutos
const PERIODOS = Array.from({ length: 20 }, (_, i) => [BASE_MIN + i * PASO, BASE_MIN + (i + 1) * PASO]);
let LW = 32;          // ancho de la columna de horas (se ajusta al ancho de la pantalla)
let _hw = 0, _ht = null; // para redibujar al girar o cambiar el tamaño de la ventana

const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const aMin = (t) => { const p = t.split(":"); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); };

/* quita el código (ICP 326 -) y la letra de grupo (- T) del nombre de la materia */
function limpiarNombre(n) {
  let s = String(n || "").trim();
  s = s.replace(/^[A-Z]{2,4}[\s-]?\d{2,4}[A-Za-z]?\s*[-–—.:)]*\s*/, "");
  s = s.replace(/\s*[-–—(]\s*[TPLI]\d?\)?\s*$/, "").replace(/\s+T$/, "");
  return s.trim() || String(n || "").trim();
}

/* cada materia: { id, tipo:"c"|"a", nombre, corto, color, sesiones:[{dias, ini, fin, aula}] } */
function leerHor() {
  let l = [];
  try { l = JSON.parse(localStorage.getItem(HOR_KEY)) || []; } catch (e) {}
  return l.map(x => x.sesiones ? x : {
    id: x.id, tipo: x.tipo, nombre: x.nombre, corto: "", color: x.color,
    sesiones: [{ dias: x.dias || [], ini: x.ini, fin: x.fin, aula: x.aula || "" }]
  });
}
const guardarHor = (l) => { try { localStorage.setItem(HOR_KEY, JSON.stringify(l)); } catch (e) {} };

/* pestañas de la pantalla principal: Semestres | Mis horarios */
function crearPestanas(activa) {
  const t = document.createElement("div");
  t.className = "pestanas";
  [["Semestres", 0], ["Mis horarios", 1]].forEach(p => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = p[0];
    if (p[1] === activa) b.className = "on";
    b.onclick = () => {
      if (p[1] === activa) return;
      if (p[1] === 1) dibujarHorario();
      else { dibujar(actual); dibujarAviso(); }
    };
    t.appendChild(b);
  });
  return t;
}

function abrirHorarios() {
  cerrarMenu();
  favBase = 0;
  if (!origenMenu) vistaPrevia = vistaActual();
  origenMenu = true;
  camino = [{ id: raiz.id, name: raiz.name }];
  mostrarHorarios();
  armarMenu();
}

function mostrarHorarios() {
  enInicio = false;
  document.body.classList.remove("inicio");
  actual = null;
  camino = [{ id: raiz.id, name: raiz.name }, { id: "hor", name: "Mis horarios" }];
  document.getElementById("avisoDestacado").style.display = "none";
  document.getElementById("titulo").innerText = "Mis horarios";
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
  u.textContent = "Mis horarios";
  ruta.appendChild(u);
  dibujarHorario();
  registrarVista();
}

function dibujarHorario() {
  const cont = document.getElementById("contenido");
  cont.innerHTML = "";
  if (enInicio) { document.getElementById("avisoDestacado").style.display = "none"; cont.appendChild(crearPestanas(1)); }
  const btn = document.createElement("button");
  btn.className = "hor-btn";
  btn.textContent = "+ Agregar materia";
  btn.onclick = () => formHorario(null);
  cont.appendChild(btn);

  const lista = leerHor();
  if (!lista.length) {
    cont.insertAdjacentHTML("beforeend", '<p class="hor-vacio">Aún no tienes materias en tu horario. Toca el botón rojo para agregar la primera.</p>');
    return;
  }

  /* bloques sueltos: una materia puede tener varios horarios */
  const bl = [];
  lista.forEach(m => m.sesiones.forEach(s => s.dias.forEach(d => bl.push({ m: m, s: s, d: d }))));
  let mn = Infinity, mx = -Infinity;
  bl.forEach(b => { mn = Math.min(mn, b.s.ini); mx = Math.max(mx, b.s.fin); });
  const r0 = Math.min(0, Math.floor((mn - BASE_MIN) / PASO));
  const r1 = Math.max(Math.ceil((mx - BASE_MIN) / PASO), r0 + 6);
  const n = r1 - r0;
  const ini0 = BASE_MIN + r0 * PASO;

  const g = document.createElement("div");
  g.className = "hg";
  cont.appendChild(g);
  /* se adapta al ancho: teléfono, tableta o computadora */
  const ancho0 = g.getBoundingClientRect().width || window.innerWidth;
  _hw = window.innerWidth;
  LW = ancho0 >= 700 ? 48 : 32;
  const fs = Math.max(8, Math.min(14, Math.round(((ancho0 - LW) / 6) / 8))); // letra de los recuadros
  g.style.setProperty("--hf", fs + "px");
  g.style.setProperty("--hl", Math.max(8, Math.min(12, fs - 2)) + "px");
  g.style.setProperty("--hd", Math.max(11, Math.min(15, fs + 2)) + "px");
  /* alto de cada fila: que todo entre en la pantalla sin desplazar */
  const libre = window.innerHeight - g.getBoundingClientRect().top - 36;
  const H = Math.max(26, Math.min(ancho0 >= 700 ? 60 : 46, Math.floor((libre - 22) / n)));
  g.style.height = (n * H + 22) + "px";

  const col = (d) => "calc(" + LW + "px + (100% - " + LW + "px) * " + d + " / 6)";
  const ancho = "calc((100% - " + LW + "px) / 6 - 2px)";
  DIAS_H.forEach((x, d) => {
    const e = document.createElement("div");
    e.className = "hg-dia";
    e.style.left = col(d);
    e.style.width = "calc((100% - " + LW + "px) / 6)";
    e.textContent = x;
    g.appendChild(e);
  });
  const cuerpo = document.createElement("div");
  cuerpo.className = "hg-cuerpo";
  cuerpo.style.height = n * H + "px";
  g.appendChild(cuerpo);
  for (let i = 0; i < n; i++) {
    const f = document.createElement("div");
    f.className = "hg-fila";
    f.style.top = i * H + "px";
    f.style.height = H + "px";
    const a = ini0 + i * PASO;
    f.innerHTML = "<span>" + hhmm(a) + "<br>" + hhmm(a + PASO) + "</span>";
    f.firstChild.style.width = LW + "px";
    cuerpo.appendChild(f);
  }
  for (let d = 0; d <= 6; d++) {
    const v = document.createElement("div");
    v.className = "hg-vert";
    v.style.left = col(d);
    cuerpo.appendChild(v);
  }

  /* bloques; si dos se cruzan en el mismo día, se reparten el ancho */
  for (let d = 0; d < 6; d++) {
    const del = bl.filter(b => b.d === d).sort((x, y) => x.s.ini - y.s.ini || x.s.fin - y.s.fin);
    const carriles = [];
    del.forEach(b => {
      let c = carriles.findIndex(fin => fin <= b.s.ini);
      if (c < 0) { c = carriles.length; carriles.push(0); }
      carriles[c] = b.s.fin;
      b.c = c;
    });
    del.forEach(b => {
      const cruza = del.filter(o => o.s.ini < b.s.fin && o.s.fin > b.s.ini);
      const k = Math.max.apply(null, cruza.map(o => o.c)) + 1;
      const h = (b.s.fin - b.s.ini) / PASO * H - 2;
      const e = document.createElement("button");
      e.className = "hg-bloque";
      e.style.background = b.m.color;
      e.style.top = ((b.s.ini - ini0) / PASO * H + 1) + "px";
      e.style.height = h + "px";
      e.style.left = "calc(" + col(d) + " + 1px + (" + ancho + " + 2px) * " + b.c + " / " + k + ")";
      e.style.width = "calc((" + ancho + " + 2px) / " + k + " - 2px)";
      const t = document.createElement("b");
      t.textContent = (b.m.tipo === "a" ? "Aux. " : "") + (b.m.corto || b.m.nombre);
      e.appendChild(t);
      if (b.s.aula && h >= fs * 4.2) { const i2 = document.createElement("i"); i2.textContent = b.s.aula; e.appendChild(i2); }
      e.onclick = () => formHorario(b.m);
      cuerpo.appendChild(e);
    });
  }
}

/* materias por semestre, con nombres cortos (lista fija) */
const SEMESTRES_H = [
  { sem: "Semestre 1", mats: ["Química General", "Física 1", "Álgebra 1", "Cálculo 1", "Dibujo Técnico"] },
  { sem: "Semestre 2", mats: ["Orgánica 1", "Inorgánica", "Física 2", "Álgebra 2", "Cálculo 2", "Metodología 1"] },
  { sem: "Semestre 3", mats: ["Físico-Química", "Orgánica 2", "Analítica", "Física 3", "Ecuaciones", "Informática 1"] },
  { sem: "Semestre 4", mats: ["Agua", "Microbiología", "Metodología 2", "OPE-1", "Numérico", "Estadística"] },
  { sem: "Semestre 5", mats: ["Termodinámica", "Instrumental", "Aplicada", "OPE-2", "Tecno", "Calidad"] },
  { sem: "Semestre 6", mats: ["Azúcar", "Lácteos", "Aceite", "Instrumentación 1", "Gestión", "Higiene"] },
  { sem: "Semestre 7", mats: ["Inglés", "Separación", "Analógicos", "Electrotecnia", "Análisis de Sistemas", "Economía"] },
  { sem: "Semestre 8", mats: ["Hidrocarburos", "Cemento", "Reacciones", "Instrumentación 2", "PLC", "Proyectos"] },
  { sem: "Semestre 9", mats: ["Scada", "Maderas", "Sustancias", "Planificación", "Legislación", "Producción"] },
  { sem: "Semestre 10", mats: ["Investigación en Control", "Gas y Petróleo", "Diseño de Sistemas"] }
];
async function materiasHorario() { return SEMESTRES_H; }

async function formHorario(ed) {
  const viejo = document.getElementById("formHor");
  if (viejo) viejo.remove();
  const sems = await materiasHorario();
  let tipo = ed ? ed.tipo : "c";
  let color = ed ? ed.color : null;
  const ses = ed
    ? ed.sesiones.map(s => ({ dias: s.dias.slice(), ini: s.ini, fin: s.fin, aula: s.aula || "" }))
    : [{ dias: [], ini: PERIODOS[0][0], fin: PERIODOS[0][1], aula: "" }];
  const colorDe = (n) => { const l = leerHor(); const x = l.find(y => y.nombre === n); return x ? x.color : COLORES_H[l.length % COLORES_H.length]; };

  const fondo = document.createElement("div");
  fondo.id = "formHor";
  const hoja = document.createElement("div");
  hoja.className = "hoja";
  fondo.appendChild(hoja);
  fondo.onclick = (ev) => { if (ev.target === fondo) fondo.remove(); };

  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  hoja.appendChild(mk("h3", "", ed ? "Editar materia" : "Agregar materia"));

  hoja.appendChild(mk("label", "", "¿Qué es?"));
  const fTipo = mk("div", "hor-tipo");
  const bC = mk("button", "", "Clase"), bA = mk("button", "", "Auxiliatura");
  bC.type = bA.type = "button";
  fTipo.appendChild(bC); fTipo.appendChild(bA);
  hoja.appendChild(fTipo);

  hoja.appendChild(mk("label", "", "Materia"));
  const pick = mk("div", "hor-pick");
  hoja.appendChild(pick);
  const resto = mk("div");
  hoja.appendChild(resto);
  const otra = document.createElement("input");
  otra.type = "text"; otra.placeholder = "Nombre de la materia"; otra.maxLength = 40;
  let nombre = ed ? ed.nombre : "";
  let vista = ed ? "ok" : "sem";   /* sem = semestres, mats = materias del semestre, otra = escribir, ok = ya elegida */
  let semAbierto = 0;
  if (!color) color = colorDe(nombre);

  const item = (txt, cls, fn, der) => {
    const b = mk("button", "hor-it" + (cls ? " " + cls : ""));
    b.type = "button";
    b.appendChild(mk("span", "", txt));
    if (der) b.appendChild(mk("span", "", der));
    b.onclick = fn;
    return b;
  };
  const atras = (txt, fn) => { const b = mk("button", "hor-atras", txt); b.type = "button"; b.onclick = fn; return b; };
  const elegir = (n) => {
    nombre = n; vista = "ok";
    if (!ed) color = colorDe(n);
    pintarPick(); pintar();
  };
  function pintarPick() {
    pick.innerHTML = "";
    if (vista === "sem") {
      sems.forEach((s, i) => {
        if (s.mats.length) pick.appendChild(item(s.sem, "", () => { semAbierto = i; vista = "mats"; pintarPick(); }, "›"));
      });
      pick.appendChild(item("Otra materia (escribir nombre)", "otra", () => { vista = "otra"; pintarPick(); otra.focus(); }, "+"));
    } else if (vista === "mats") {
      pick.appendChild(atras("‹ Semestres", () => { vista = "sem"; pintarPick(); }));
      pick.appendChild(mk("div", "hor-sem-tit", sems[semAbierto].sem));
      sems[semAbierto].mats.forEach(m => pick.appendChild(item(m, m === nombre ? "on" : "", () => elegir(m), m === nombre ? "✓" : "")));
    } else if (vista === "otra") {
      pick.appendChild(atras("‹ Semestres", () => { vista = "sem"; pintarPick(); }));
      pick.appendChild(otra);
      pick.appendChild(item("Usar este nombre", "on fila", () => {
        if (otra.value.trim()) elegir(otra.value.trim());
        else err.textContent = "Escribe el nombre de la materia.";
      }));
    } else {
      pick.appendChild(item(nombre, "on fila", () => { vista = "sem"; pintarPick(); }, "Cambiar"));
    }
    resto.style.display = vista === "ok" ? "block" : "none";
  }

  resto.appendChild(mk("label", "", "Nombre corto (opcional)"));
  const corto = document.createElement("input");
  corto.type = "text"; corto.maxLength = 14; corto.placeholder = "Ej: Op. Unitarias"; corto.value = ed ? (ed.corto || "") : "";
  resto.appendChild(corto);

  const zonaSes = mk("div");
  resto.appendChild(zonaSes);
  const bMas = mk("button", "hor-mas", "+ Otro horario");
  bMas.type = "button";
  bMas.onclick = () => { ses.push({ dias: [], ini: PERIODOS[0][0], fin: PERIODOS[0][1], aula: "" }); pintarSes(); };
  resto.appendChild(bMas);

  resto.appendChild(mk("label", "", "Color"));
  const fCol = mk("div", "hor-colores");
  const bCols = COLORES_H.map(c => {
    const b = mk("button"); b.type = "button"; b.style.background = c; b.setAttribute("aria-label", "Color");
    b.onclick = () => { color = c; pintar(); };
    fCol.appendChild(b);
    return b;
  });
  resto.appendChild(fCol);

  const err = mk("div", "hor-err");
  hoja.appendChild(err);
  const acc = mk("div", "hor-acc");
  const bCan = mk("button", "", "Cancelar"), bGu = mk("button", "gu", "Guardar");
  bCan.type = bGu.type = "button";
  bCan.onclick = () => fondo.remove();
  if (ed) {
    const bEl = mk("button", "el", "Borrar"); bEl.type = "button";
    bEl.onclick = () => { guardarHor(leerHor().filter(x => x.id !== ed.id)); fondo.remove(); dibujarHorario(); };
    acc.appendChild(bEl);
  }
  acc.appendChild(bCan); acc.appendChild(bGu);
  hoja.appendChild(acc);

  /* un bloque por cada horario de la materia */
  function pintarSes() {
    zonaSes.innerHTML = "";
    ses.forEach((s, i) => {
      const box = mk("div", "hor-ses");
      if (ses.length > 1) {
        const top = mk("div", "hor-ses-top");
        top.appendChild(mk("span", "", "Horario " + (i + 1)));
        const q = mk("button", "", "Quitar"); q.type = "button";
        q.onclick = () => { ses.splice(i, 1); pintarSes(); };
        top.appendChild(q);
        box.appendChild(top);
      }
      box.appendChild(mk("label", "", "Días"));
      const fd = mk("div", "hor-dias");
      DIAS_L.forEach((l, k) => {
        const b = mk("button", s.dias.indexOf(k) >= 0 ? "on" : "", l); b.type = "button";
        b.setAttribute("aria-label", DIAS_H[k]);
        b.onclick = () => { const p = s.dias.indexOf(k); if (p >= 0) s.dias.splice(p, 1); else s.dias.push(k); b.classList.toggle("on"); };
        fd.appendChild(b);
      });
      box.appendChild(fd);
      const par = mk("div", "hor-par");
      const d1 = mk("div"), d2 = mk("div");
      d1.appendChild(mk("label", "", "Desde")); d2.appendChild(mk("label", "", "Hasta"));
      if (tipo === "c") {
        const sd = document.createElement("select"), sh = document.createElement("select");
        PERIODOS.forEach(p => {
          const o1 = document.createElement("option"); o1.value = p[0]; o1.textContent = hhmm(p[0]); sd.appendChild(o1);
          const o2 = document.createElement("option"); o2.value = p[1]; o2.textContent = hhmm(p[1]); sh.appendChild(o2);
        });
        if (!PERIODOS.some(p => p[0] === s.ini)) { s.ini = PERIODOS[0][0]; s.fin = PERIODOS[0][1]; }
        if (!PERIODOS.some(p => p[1] === s.fin)) s.fin = s.ini + PASO;
        sd.value = s.ini; sh.value = s.fin;
        sd.onchange = () => { s.ini = +sd.value; if (s.fin <= s.ini) { s.fin = s.ini + PASO; sh.value = s.fin; } };
        sh.onchange = () => { s.fin = +sh.value; };
        d1.appendChild(sd); d2.appendChild(sh);
      } else {
        const t1 = document.createElement("input"), t2 = document.createElement("input");
        t1.type = t2.type = "time";
        if (!s.manual && !ed) { s.ini = null; s.fin = null; }
        t1.value = s.ini != null ? hhmm(s.ini) : "";
        t2.value = s.fin != null ? hhmm(s.fin) : "";
        t1.onchange = () => { s.manual = true; s.ini = t1.value ? aMin(t1.value) : null; };
        t2.onchange = () => { s.manual = true; s.fin = t2.value ? aMin(t2.value) : null; };
        d1.appendChild(t1); d2.appendChild(t2);
      }
      par.appendChild(d1); par.appendChild(d2);
      box.appendChild(par);
      box.appendChild(mk("label", "", "Aula (opcional)"));
      const au = document.createElement("input");
      au.type = "text"; au.maxLength = 20; au.placeholder = "Ej: Aula 12"; au.value = s.aula || "";
      au.oninput = () => { s.aula = au.value; };
      box.appendChild(au);
      zonaSes.appendChild(box);
    });
  }

  function pintar() {
    bC.classList.toggle("on", tipo === "c");
    bA.classList.toggle("on", tipo === "a");
    bCols.forEach((b, i) => b.classList.toggle("on", COLORES_H[i] === color));
  }
  bC.onclick = () => { tipo = "c"; pintar(); pintarSes(); };
  bA.onclick = () => { tipo = "a"; pintar(); pintarSes(); };

  bGu.onclick = () => {
    if (vista !== "ok" || !nombre.trim()) { err.textContent = "Elige una materia."; return; }
    for (let i = 0; i < ses.length; i++) {
      const s = ses[i], q = ses.length > 1 ? " (horario " + (i + 1) + ")" : "";
      if (!s.dias.length) { err.textContent = "Marca al menos un día" + q + "."; return; }
      if (s.ini == null || s.fin == null) { err.textContent = "Pon la hora de inicio y de fin" + q + "."; return; }
      if (s.fin <= s.ini) { err.textContent = "La hora de fin debe ser después de la de inicio" + q + "."; return; }
    }
    const reg = {
      id: ed ? ed.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      tipo: tipo, nombre: nombre.trim(), corto: corto.value.trim(), color: color,
      sesiones: ses.map(s => ({ dias: s.dias.slice().sort(), ini: s.ini, fin: s.fin, aula: (s.aula || "").trim() }))
    };
    const l = leerHor().filter(x => x.id !== reg.id);
    l.push(reg);
    guardarHor(l);
    fondo.remove();
    dibujarHorario();
  };

  pintar();
  pintarSes();
  pintarPick();
  document.body.appendChild(fondo);
}

/* al girar el teléfono o cambiar el tamaño de la ventana, el horario se vuelve a acomodar */
window.addEventListener("resize", () => {
  clearTimeout(_ht);
  _ht = setTimeout(() => {
    if (!document.querySelector(".hg") || document.getElementById("formHor")) return;
    if (window.innerWidth === _hw) return; /* solo cambió el alto (barra del navegador o teclado) */
    dibujarHorario();
  }, 200);
});
