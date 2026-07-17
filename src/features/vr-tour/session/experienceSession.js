// Bandera EN MEMORIA (a propósito: NO sessionStorage/localStorage, que
// sobrevivirían a la recarga). Se reinicia en cada carga de página.
//
// La experiencia solo se considera "iniciada" tras pulsar "Iniciar Experiencia"
// en la WelcomePage. El guard de la ruta /dashboard usa esto para que, si el
// usuario recarga estando ya dentro del tour (F5, o el botón A del mando que hace
// window.location.reload()), sea devuelto a la pantalla de inicio para re-entrar
// limpio. Es necesario porque al recargar se pierde la sesión WebXR y la
// secuencia de arranque de los raycasters/minimapa, que a veces dejaba el mapa
// sin poder abrirse hasta cambiar de escena.
let started = false;

export const markExperienceStarted = () => {
  started = true;
};

export const hasExperienceStarted = () => started;
