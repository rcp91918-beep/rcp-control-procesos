/* AVISO PARA INSTALAR LA APP (solo en teléfonos y solo si aún no está instalada) */
(function () {
  const CERRADO_KEY = "rcp_instalar_cerrado";
  const yaCerrado = () => { try { return localStorage.getItem(CERRADO_KEY) === "1"; } catch (e) { return false; } };
  const instalada = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  const esAndroid = /Android/i.test(navigator.userAgent);
  const esIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (instalada() || yaCerrado() || !(esAndroid || esIOS)) return;

  let evento = null;

  function ocultar(recordar) {
    const b = document.getElementById("avisoInstalar");
    if (b) b.remove();
    if (recordar) { try { localStorage.setItem(CERRADO_KEY, "1"); } catch (e) {} }
  }

  function mostrar(android) {
    if (document.getElementById("avisoInstalar")) return;
    const b = document.createElement("div");
    b.id = "avisoInstalar";
    b.className = "aviso-instalar";
    b.setAttribute("role", "region");
    b.setAttribute("aria-label", "Instalar la app");
    b.innerHTML = '<div class="ai-texto"><div class="ai-tit">Instala la app RCP</div><div class="ai-sub"></div></div>';
    const sub = b.querySelector(".ai-sub");
    if (android) {
      sub.innerHTML = 'Ábrela directo desde tu pantalla.<br>Si aparece una advertencia, toca <b>Instalar de todas formas</b>.';
      const bi = document.createElement("button");
      bi.className = "ai-instalar";
      bi.textContent = "Instalar";
      bi.onclick = async () => {
        if (!evento) return;
        evento.prompt();
        try { await evento.userChoice; } catch (e) {}
        evento = null;
        ocultar(true);
      };
      b.appendChild(bi);
    } else {
      sub.innerHTML = 'Toca <b>Compartir</b> y luego <b>Agregar a pantalla de inicio</b>.';
    }
    const x = document.createElement("button");
    x.className = "ai-x";
    x.setAttribute("aria-label", "Cerrar aviso");
    x.textContent = "×";
    x.onclick = () => ocultar(true);
    b.appendChild(x);
    document.body.appendChild(b);
  }

  if (esAndroid) {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      evento = e;
      mostrar(true);
    });
    window.addEventListener("appinstalled", () => ocultar(true));
  } else {
    window.addEventListener("load", () => setTimeout(() => mostrar(false), 1500));
  }
})();
