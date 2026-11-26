/* MIS HORARIOS: se guardan solo en el celular de cada persona */
const HOR_KEY = "rcp_horario";
const DIAS_H = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_L = ["L", "M", "M", "J", "V", "S"];
const COLORES_H = ["#123b8f", "#0f6b6b", "#5b3fa8", "#b4570a", "#d71920", "#2e7d32", "#c2185b", "#455a64", "#0288d1", "#6d4c41", "#827717", "#00897b", "#ef6c00", "#7b1fa2", "#00838f"];
const PX_MIN = 0.8; // alto en pantalla por minuto
/* períodos de clase de 45 minutos: 07:00 a 22:45 */
const PERIODOS = Array.from({ length: 20 }, (_, i) => [420 + i * 45, 465 + i * 45]);

const leerHor = () => { try { return JSON.parse(localStorage.getItem(HOR_KEY)) || []; } catch (e) { return []; } };
const guardarHor = (l) => { try { localStorage.setItem(HOR_KEY, JSON.stringify(l)); } catch (e) {} };
const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const aMin = (t) => { const p = t.split(":"); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); };

function abrirHorarios() {
  cerrarMenu();
  favBase = 0;
  if (!origenMenu) vistaPrevia = vistaActual();
  origenMenu = true;
  camino = [{ id: raiz.id, name: raiz.name }];
  mostrarHorarios();
  armarMenu();
}

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
  const lista = leerHor();
  if (!lista.length) {
    cont.insertAdjacentHTML("beforeend", '<p class="hor-vacio">Aún no tienes materias en tu horario. Toca el botón rojo para agregar la primera.</p>');
  } else {
    let min = 420, max = 780;
    lista.forEach(b => { min = Math.min(min, Math.floor(b.ini / 60) * 60); max = Math.max(max, Math.ceil(b.fin / 60) * 60); });
    const alto = (max - min) * PX_MIN;
    const g = document.createElement("div");
    g.className = "hor-grid";
    g.appendChild(document.createElement("div"));
    DIAS_H.forEach(d => { const e = document.createElement("div"); e.className = "hor-dia"; e.textContent = d; g.appendChild(e); });
    const col0 = document.createElement("div");
    col0.className = "hor-horas";
    col0.style.height = alto + "px";
    for (let m = min; m <= max; m += 60) {
      const s = document.createElement("span");
      s.style.top = (m - min) * PX_MIN + "px";
      s.textContent = hhmm(m);
      col0.appendChild(s);
    }
    g.appendChild(col0);
    for (let d = 0; d < 6; d++) {
      const col = document.createElement("div");
      col.className = "hor-col";
      col.style.height = alto + "px";
      for (let m = min; m <= max; m += 60) {
        const l = document.createElement("div");
        l.className = "hor-linea";
        l.style.top = (m - min) * PX_MIN + "px";
        col.appendChild(l);
      }
      /* bloques del día; si dos se cruzan, se reparten el ancho */
      const del = lista.filter(b => b.dias.indexOf(d) >= 0).sort((x, y) => x.ini - y.ini || x.fin - y.fin);
      const carriles = [];
      del.forEach(b => {
        let c = carriles.findIndex(fin => fin <= b.ini);
        if (c < 0) { c = carriles.length; carriles.push(0); }
        carriles[c] = b.fin;
        b._c = c;
      });
      del.forEach(b => {
        /* cuántos carriles hay en el grupo que cruza con este bloque */
        const cruza = del.filter(o => o.ini < b.fin && o.fin > b.ini);
        const n = Math.max.apply(null, cruza.map(o => o._c)) + 1;
        const e = document.createElement("button");
        e.className = "hor-bloque" + (b.tipo === "a" ? " aux" : "");
        e.style.background = b.color;
        e.style.top = (b.ini - min) * PX_MIN + "px";
        e.style.height = (b.fin - b.ini) * PX_MIN - 1 + "px";
        e.style.left = (b._c * 100 / n) + "%";
        e.style.width = (100 / n) + "%";
        const t = document.createElement("b");
        t.textContent = (b.tipo === "a" ? "Aux. " : "") + b.nombre;
        e.appendChild(t);
        const h = document.createElement("i");
        h.textContent = hhmm(b.ini) + "–" + hhmm(b.fin);
        e.appendChild(h);
        if (b.aula) { const au = document.createElement("i"); au.textContent = b.aula; e.appendChild(au); }
        e.onclick = () => formHorario(b);
        col.appendChild(e);
      });
      g.appendChild(col);
    }
    cont.appendChild(g);
  }
  const btn = document.createElement("button");
  btn.className = "hor-btn";
  btn.textContent = "+ Agregar materia";
  btn.onclick = () => formHorario(null);
  cont.appendChild(btn);
  const nota = document.createElement("p");
  nota.className = "hor-nota";
  nota.textContent = "Tu horario se guarda solo en este celular. Toca una materia para editarla o borrarla.";
  cont.appendChild(nota);
}

/* lista de materias de la app (de los semestres ya cargados) */
let MATERIAS_H = null;
async function materiasHorario() {
  if (MATERIAS_H) return MATERIAS_H;
  const out = [];
  try {
    const sems = raiz.folders.filter(f => esSemestre(f.name));
    for (const s of sems) {
      try {
        const d = await cargar(s.id);
        out.push({ sem: s.name.trim(), mats: d.folders.map(f => f.name.trim()) });
      } catch (e) { /* ese semestre aún no está disponible */ }
    }
  } catch (e) {}
  if (out.length) MATERIAS_H = out;
  return out;
}

async function formHorario(ed) {
  const viejo = document.getElementById("formHor");
  if (viejo) viejo.remove();
  const sems = await materiasHorario();
  let tipo = ed ? ed.tipo : "c";
  let dias = ed ? ed.dias.slice() : [];
  const colorDe = (n) => { const l = leerHor().find(x => x.nombre === n); return l ? l.color : COLORES_H[leerHor().length % COLORES_H.length]; };
  let color = ed ? ed.color : colorDe("");

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
  const sel = document.createElement("select");
  sel.id = "hMat";
  sems.forEach(s => {
    const g = document.createElement("optgroup");
    g.label = s.sem;
    s.mats.forEach(m => { const o = document.createElement("option"); o.value = m; o.textContent = m; g.appendChild(o); });
    if (s.mats.length) sel.appendChild(g);
  });
  const oo = document.createElement("option");
  oo.value = "__otra"; oo.textContent = "Otra (escribir nombre)…";
  sel.appendChild(oo);
  hoja.appendChild(sel);
  const otra = document.createElement("input");
  otra.type = "text"; otra.id = "hOtra"; otra.placeholder = "Nombre de la materia"; otra.maxLength = 40;
  otra.style.marginTop = "8px";
  hoja.appendChild(otra);
  const verOtra = () => { otra.style.display = sel.value === "__otra" ? "block" : "none"; };
  sel.onchange = () => { verOtra(); if (!ed && sel.value !== "__otra") { color = colorDe(sel.value); pintar(); } };
  if (ed) {
    const existe = Array.prototype.some.call(sel.options, o => o.value === ed.nombre);
    sel.value = existe ? ed.nombre : "__otra";
    if (!existe) otra.value = ed.nombre;
  }
  verOtra();
  if (!ed && sel.value !== "__otra") color = colorDe(sel.value);

  hoja.appendChild(mk("label", "", "Días"));
  const fDias = mk("div", "hor-dias");
  const bDias = DIAS_L.map((l, i) => {
    const b = mk("button", "", l); b.type = "button";
    b.setAttribute("aria-label", DIAS_H[i]);
    b.onclick = () => { const k = dias.indexOf(i); if (k >= 0) dias.splice(k, 1); else dias.push(i); pintar(); };
    fDias.appendChild(b);
    return b;
  });
  hoja.appendChild(fDias);

  /* horas: clase = lista de períodos; auxiliatura = hora escrita con el reloj */
  const bloqueClase = mk("div"), bloqueAux = mk("div");
  const par1 = mk("div", "hor-par");
  const d1 = mk("div"), d2 = mk("div");
  d1.appendChild(mk("label", "", "Desde")); d2.appendChild(mk("label", "", "Hasta"));
  const sDesde = document.createElement("select"), sHasta = document.createElement("select");
  PERIODOS.forEach((p, i) => {
    const o1 = document.createElement("option"); o1.value = p[0]; o1.textContent = hhmm(p[0]); sDesde.appendChild(o1);
    const o2 = document.createElement("option"); o2.value = p[1]; o2.textContent = hhmm(p[1]); sHasta.appendChild(o2);
  });
  d1.appendChild(sDesde); d2.appendChild(sHasta);
  par1.appendChild(d1); par1.appendChild(d2);
  bloqueClase.appendChild(par1);
  sDesde.onchange = () => { if (+sHasta.value <= +sDesde.value) { const p = PERIODOS.find(x => x[0] === +sDesde.value); sHasta.value = p[1]; } };

  const par2 = mk("div", "hor-par");
  const e1 = mk("div"), e2 = mk("div");
  e1.appendChild(mk("label", "", "Desde")); e2.appendChild(mk("label", "", "Hasta"));
  const tDesde = document.createElement("input"), tHasta = document.createElement("input");
  tDesde.type = tHasta.type = "time";
  e1.appendChild(tDesde); e2.appendChild(tHasta);
  par2.appendChild(e1); par2.appendChild(e2);
  bloqueAux.appendChild(par2);
  hoja.appendChild(bloqueClase); hoja.appendChild(bloqueAux);

  if (ed) {
    if (ed.tipo === "c") {
      sDesde.value = ed.ini; sHasta.value = ed.fin;
    } else { tDesde.value = hhmm(ed.ini); tHasta.value = hhmm(ed.fin); }
  } else { sHasta.value = PERIODOS[0][1]; }

  hoja.appendChild(mk("label", "", "Aula (opcional)"));
  const aula = document.createElement("input");
  aula.type = "text"; aula.maxLength = 20; aula.placeholder = "Ej: Aula 12"; aula.value = ed ? (ed.aula || "") : "";
  hoja.appendChild(aula);

  hoja.appendChild(mk("label", "", "Color"));
  const fCol = mk("div", "hor-colores");
  const bCols = COLORES_H.map(c => {
    const b = mk("button"); b.type = "button"; b.style.background = c; b.setAttribute("aria-label", "Color");
    b.onclick = () => { color = c; pintar(); };
    fCol.appendChild(b);
    return b;
  });
  hoja.appendChild(fCol);

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

  function pintar() {
    bC.classList.toggle("on", tipo === "c");
    bA.classList.toggle("on", tipo === "a");
    bloqueClase.style.display = tipo === "c" ? "block" : "none";
    bloqueAux.style.display = tipo === "a" ? "block" : "none";
    bDias.forEach((b, i) => b.classList.toggle("on", dias.indexOf(i) >= 0));
    bCols.forEach((b, i) => b.classList.toggle("on", COLORES_H[i] === color));
  }
  bC.onclick = () => { tipo = "c"; pintar(); };
  bA.onclick = () => { tipo = "a"; pintar(); };

  bGu.onclick = () => {
    const nombre = (sel.value === "__otra" ? otra.value : sel.value).trim();
    let ini, fin;
    if (tipo === "c") { ini = +sDesde.value; fin = +sHasta.value; }
    else {
      if (!tDesde.value || !tHasta.value) { err.textContent = "Pon la hora de inicio y de fin."; return; }
      ini = aMin(tDesde.value); fin = aMin(tHasta.value);
    }
    if (!nombre) { err.textContent = "Escribe el nombre de la materia."; return; }
    if (!dias.length) { err.textContent = "Marca al menos un día."; return; }
    if (fin <= ini) { err.textContent = "La hora de fin debe ser después de la de inicio."; return; }
    const reg = { id: ed ? ed.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 5), tipo: tipo, nombre: nombre, dias: dias.slice().sort(), ini: ini, fin: fin, aula: aula.value.trim(), color: color };
    const l = leerHor().filter(x => x.id !== reg.id);
    l.push(reg);
    guardarHor(l);
    fondo.remove();
    dibujarHorario();
  };

  pintar();
  document.body.appendChild(fondo);
}
