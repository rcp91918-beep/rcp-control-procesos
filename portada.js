/* Imagen de portada: sale al entrar a la app y se cierra con la X.
   Para quitarla: cambia true por false en la línea de abajo. */
const MOSTRAR_PORTADA = false;

function cerrarPortada() {
  const p = document.getElementById("portada");
  if (p) p.style.display = "none";
  try { sessionStorage.setItem("rcp_portada", "1"); } catch (e) {}
}
(function () {
  let visto = false;
  try { visto = sessionStorage.getItem("rcp_portada") === "1"; } catch (e) {}
  if (MOSTRAR_PORTADA && !visto) document.getElementById("portada").style.display = "flex";
})();
