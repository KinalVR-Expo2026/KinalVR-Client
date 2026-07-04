# Minimapa, Mapa del Campus y Modo Admin

Este documento explica cómo funciona el sistema de minimapa flotante, el modal de "Mapa del campus" que se abre al hacer clic en él (con sus pestañas Mapa / Eventos / Admin), y el modo de calibración de posición y rumbo usado por el administrador. También detalla qué archivo hace qué y cómo se conectan entre sí.

## 1. Panorama general

```
SceneViewer.jsx (tour 360°)
 ├─ MinimapWidget.jsx        → botón circular flotante (minimapa en vivo)
 ├─ CampusMapPage.jsx        → modal fullscreen que se abre al hacer clic en el minimapa
 │   ├─ MapHeader.jsx        → header con tabs, indicador de nivel y zoom
 │   ├─ AdminSidebar.jsx     → panel lateral del tab "Admin"
 │   ├─ MapInteractive.jsx   → plano SVG, marcadores, selector de niveles
 │   └─ EventsList.jsx       → contenido del tab "Eventos"
 └─ VRControls.jsx           → cámara A-Frame + componente `minimap-sync`
                                (calcula hacia dónde mira el usuario)
```

Datos que via viajan de un lado a otro:
- **`scene`** (el objeto de la escena 360° actual, viene de `useTourNavigation` / `useTourStore`) se pasa como `currentScene` tanto a `MinimapWidget` como a `CampusMapPage`.
- **`--minimap-rotation`**: una variable CSS escrita directamente en el DOM por A-Frame (fuera de React) que representa hacia dónde mira la cámara. La leen tanto `MinimapWidget` (en vivo) como `CampusMapPage` (una foto fija al momento de abrir el mapa).

---

## 2. El minimapa flotante — `components/MinimapWidget.jsx`

Es un `<button id="minimap-container">` circular (`z-[99999]`, `overflow-hidden`) fijo en la esquina superior izquierda del visor 360°. Recibe dos props:

- `currentScene`: la escena actual (con `posicion: [x, y]` y `nivel`).
- `onOpen`: callback que abre `CampusMapPage` (lo dispara `SceneViewer`).

**Lógica de renderizado:**

1. `hasPosition = Boolean(currentScene?.posicion && currentScene.posicion.length > 0)`.
2. Si **no** hay posición asignada a la escena → se muestra el ícono SVG esquemático de respaldo (un plano genérico con un cono de orientación estático, sin datos reales).
3. Si **sí** hay posición → se muestra el plano real del nivel (`LEVEL_PLANS[currentScene.nivel]`, mapeado por el string de nivel: `'PRIMER NIVEL'`, `'SEGUNDO NIVEL'`, etc.) como una imagen "zoomeada" al 450% de su tamaño, centrada y desplazada según la posición del usuario:
   ```js
   style={{
     width: '450%',
     height: 'auto',       // preserva la proporción real del SVG (evita deformar el eje Y)
     left: '50%', top: '50%',
     transform: `translate(-${posicion[0]}%, -${posicion[1]}%)`,
   }}
   ```
   Esto crea el efecto "radar": el punto `(posicion[0]%, posicion[1]%)` de la imagen queda siempre centrado en el círculo del widget, sin importar en qué parte del plano esté.
4. Encima de todo, si hay posición, se dibuja la **flecha de navegación** (diseño tipo Zelda: un `<path>` sólido azul oscuro con borde blanco) dentro de un `<div>` que rota con:
   ```js
   style={{ transform: 'translate(-50%, -50%) rotate(var(--minimap-rotation, 0deg))' }}
   ```
   Esa variable CSS **no la actualiza React** — la escribe directamente A-Frame en cada frame (ver sección 4).

---

## 3. Cómo se abre el mapa — `SceneViewer.jsx`

```jsx
const [isMapOpen, setIsMapOpen] = useState(false);
...
<MinimapWidget currentScene={scene} onOpen={() => setIsMapOpen(true)} />
{isMapOpen && <CampusMapPage onClose={() => setIsMapOpen(false)} currentScene={scene} />}
```

- Al hacer clic en el minimapa se pone `isMapOpen = true` y React monta `CampusMapPage` (un modal `fixed inset-0 z-[99999]` que tapa toda la pantalla).
- `CampusMapPage` se **desmonta por completo** al cerrarse (no queda oculto con CSS, se destruye), por lo que cada apertura es un montaje "limpio" — importante para el punto 6.
- Ambos componentes están **fuera** de `<a-scene>` (se intentó meterlos dentro para heredar el fullscreen nativo de A-Frame, pero A-Frame no soporta bien HTML normal como hijo directo de la escena, así que se revirtió).

---

## 4. Cómo se calcula "hacia dónde mira" el usuario — `components/VRControls.jsx`

Este es el corazón de la brújula. `VRControls` registra varios componentes de A-Frame (`AFRAME.registerComponent`) a nivel de módulo, entre ellos **`minimap-sync`**, que se adjunta a la entidad `<a-camera>`:

```jsx
<a-entity id="camera-wrapper" ref={wrapperRef}>
  <a-entity
    camera
    ref={cameraRef}
    look-controls="reverseMouseDrag: false"
    position="0 1.6 0"
    minimap-sync
    data-offset={sceneOffset}
  ></a-entity>
  ...
</a-entity>
```

`minimap-sync.tick()` corre en **cada frame** (no pasa por React, por rendimiento):

```js
tick: function () {
  let totalRotationY = this.el.object3D.rotation.y;               // giro por look-controls (arrastrar con el mouse/cabeza)

  if (this.el.parentEl && this.el.parentEl.object3D) {
    totalRotationY += this.el.parentEl.object3D.rotation.y;        // + giro del rig (#camera-wrapper), que cambia al teletransportarse
  }

  let degrees = -(THREE.MathUtils.radToDeg(totalRotationY));       // invertido: A-Frame gira "al revés" que rotate() de CSS

  const offset = parseFloat(this.el.getAttribute('data-offset')) || 0;
  degrees += offset + 180;                                         // + calibración manual de la escena + 180° para alinear el eje

  document.getElementById('minimap-container')
    ?.style.setProperty('--minimap-rotation', `${degrees}deg`);
}
```

Puntos clave:
- **`this.el.object3D.rotation.y`**: la parte que cambia en vivo mientras el usuario arrastra la vista con el mouse o mueve la cabeza en VR (la maneja `look-controls`, nativo de A-Frame).
- **`parentEl.object3D.rotation.y`**: la rotación del "rig" (`#camera-wrapper`), que es la que se ajusta al **teletransportarse** entre escenas (ver `VRControls`'s `useEffect(() => { wrapperRef.current.object3D.rotation.y = degToRad(cameraYaw) }, [cameraYaw])`, con `cameraYaw` calculado en `useTourNavigation.js`).
- **`data-offset` / `sceneOffset`**: viene de `scene.coordinacionAngulo` (ver sección 7) — es la calibración manual que hace el administrador para que el "norte" del minimapa coincida con la orientación real de cada foto 360°.
- **`+ 180`**: constante fija que se agregó para corregir un desfase de medio giro entre el sistema 3D de A-Frame y el `rotate()` de CSS.
- El resultado se escribe **directo al DOM** (`style.setProperty`) sobre el `<button id="minimap-container">` — es decir, sobre el propio `MinimapWidget`. Por eso `MinimapWidget` no recibe ninguna prop de "rotación": simplemente lee la variable CSS en su propio `style` y el navegador la actualiza sola, sin re-renders de React.

---

## 5. El modal "Mapa del campus" — `pages/CampusMapPage.jsx`

Es el **orquestador**: mantiene todo el estado y la lógica de negocio, y delega el JSX a tres componentes de presentación.

### Props que recibe
- `onClose`: cierra el modal (lo controla `SceneViewer`).
- `currentScene`: la escena 360° activa en el momento de abrir el mapa.

### Estados principales
| Estado | Para qué sirve |
|---|---|
| `activeTab` | `'mapa'` \| `'eventos'` \| `'admin'` |
| `activeLevel` | Piso mostrado en el plano (1 a 4). Se inicializa con el nivel de `currentScene` (ver sección 6) |
| `zoom` | 50% a 400%, controla el tamaño del plano |
| `scenes` | Lista completa de escenas (cargada del backend, solo se usa en el tab Admin) |
| `selectedSubId` / `tempPos` / `tempAngle` | Estado temporal del formulario de calibración en modo Admin |
| `userRotation` | Snapshot de `--minimap-rotation` tomado **al abrir el modal** (ver sección 6) |

### Carga inicial de escenas
```js
useEffect(() => {
  const fetchScenes = async () => {
    try {
      const scenesData = await getScenes();   // src/shared/api/scenes.js
      setScenes(scenesData);
    } catch (error) { console.error(...); }
  };
  fetchScenes();
}, []);
```
Se dispara una vez al montar el modal (independientemente del tab activo), para que el `<select>` del modo Admin ya tenga datos listos si el usuario cambia a esa pestaña.

### Funciones de negocio
- **`handleZoom(delta)`**: clamp entre `ZOOM_MIN` (50) y `ZOOM_MAX` (400), en pasos de `ZOOM_STEP` (25).
- **`handleSelectScene(e)`** *(solo Admin)*: al elegir una escena del `<select>`, busca su objeto en `scenes`, carga su `posicion`/`coordinacionAngulo` en el estado temporal, y cambia `activeLevel` automáticamente según su `nivel`.
- **`handleMapClick(e)`** *(solo Admin)*: calcula el punto exacto donde se hizo clic dentro de la imagen, usando `getBoundingClientRect()` (inmune al zoom/scroll):
  ```js
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  setTempPos([x, y]);   // porcentaje, no píxeles — así funciona a cualquier zoom
  ```
- **`handleSavePosition()`** *(solo Admin)*: llama a `updateScenePosition(...)` (API), y si sale bien actualiza `scenes` localmente (sin recargar) y muestra un `alert`.

---

## 6. Nivel inicial y "flecha congelada" al abrir el mapa

Estas dos líneas son sutiles y usan un patrón de React llamado *inicializador perezoso* (`useState(() => ...)`), en vez de un `useEffect`:

```js
const [activeLevel, setActiveLevel] = useState(
  () => (currentScene?.nivel && LEVEL_TO_NUM[currentScene.nivel]) || 3
);

const [userRotation] = useState(() => {
  const minimap = document.getElementById('minimap-container');
  return minimap?.style.getPropertyValue('--minimap-rotation') || '0deg';
});
```

**¿Por qué así y no con `useEffect`?**
1. Un `useEffect` que llama a `setActiveLevel(...)` directamente en su cuerpo viola la regla de ESLint del proyecto (`react-hooks/set-state-in-effect`), que prohíbe actualizar estado de forma síncrona dentro de un efecto (puede encadenar renders innecesarios).
2. Como `CampusMapPage` **se desmonta y remonta entero** cada vez que se abre/cierra el modal (ver sección 3), el "primer render" *es* literalmente el momento de apertura. Un inicializador perezoso logra exactamente lo mismo que un efecto en `mount`, pero sin el problema de lint y sin un render extra.

Efecto práctico:
- **`activeLevel`** arranca mostrando el piso donde está parado el usuario en el tour 360°, en vez de siempre el piso 3 por defecto.
- **`userRotation`** es una **foto fija** de hacia dónde miraba el usuario en el instante de abrir el mapa (lee la misma variable CSS `--minimap-rotation` que actualiza `minimap-sync`). No se sigue actualizando mientras el modal está abierto — es intencional, ya que dentro del mapa grande no tiene sentido que la flecha del usuario siga girando en vivo (el usuario está viendo el mapa, no la escena 3D).

---

## 7. Constantes compartidas — `constants/campusMap.js`

Centraliza todo lo que antes estaba duplicado o repartido:

```js
export const LEVEL_PLANS = { 1: nivel1Plano, 2: nivel2Plano, 3: nivel3Plano, 4: nivel4Plano };  // SVGs de planos por piso
export const ZOOM_MIN = 50;
export const ZOOM_MAX = 400;
export const ZOOM_STEP = 25;
export const LEVEL_TO_NUM = { 'PRIMER NIVEL': 1, 'SEGUNDO NIVEL': 2, 'TERCER NIVEL': 3, 'CUARTO NIVEL': 4 };
export const NUM_TO_LEVEL = { 1: 'PRIMER NIVEL', 2: 'SEGUNDO NIVEL', 3: 'TERCER NIVEL', 4: 'CUARTO NIVEL' };
export const TABS = [ {id:'mapa',...}, {id:'eventos',...}, {id:'admin',...} ];
```

`LEVEL_TO_NUM` / `NUM_TO_LEVEL` son el **traductor** entre cómo Mongo/el backend guarda el piso (string en mayúsculas, ej. `"SEGUNDO NIVEL"` — así lo exige el `enum` del modelo) y cómo la UI lo maneja internamente (número `1`-`4`, para indexar `LEVEL_PLANS` y el selector de botones). Se usan en:
- `MapInteractive.jsx` (importado directo, no por props) para decidir si mostrar la flecha del usuario en el nivel actual.
- `CampusMapPage.jsx` para convertir en ambas direcciones al leer/guardar escenas.

`MapHeader.jsx` importa `TABS`/`ZOOM_MIN`/`ZOOM_MAX`/`ZOOM_STEP` directo del archivo de constantes en vez de recibirlos por props — son valores que nunca cambian entre renders, así que pasarlos como props era ruido innecesario (prop-drilling).

---

## 8. Vista del mapa — `components/MapInteractive.jsx`

Renderiza (como children de `CampusMapPage`, dentro de un `<>...</>` porque son dos bloques hermanos):

1. **Contenedor con scroll** (`overflow-auto`, para poder desplazarse cuando el zoom hace que el plano sea más grande que la pantalla) que incluye:
   - El ícono "N" (brújula, solo en el tab Mapa) — `absolute right-4 top-4`.
   - Un `<div>` interno cuyo `width` es el `%` de zoom actual (`style={{ width: \`${zoom}%\` }}`), con `shrink-0` (indispensable: sin eso Flexbox lo encoge y el zoom nunca pasa del 100% visualmente) que contiene:
     - La `<img>` del plano SVG del nivel activo, con `onClick={handleMapClick}` (solo hace algo si `isAdminTab` y hay una escena seleccionada).
     - El **marcador rojo** del admin (mira/crosshair) — solo en tab Admin y si hay `tempPos`, rotado según `tempAngle`.
     - La **flecha azul del usuario** (mismo diseño que en el minimapa) — solo en tab Mapa, solo si `currentScene.posicion` existe **y** el nivel mostrado coincide con el nivel real de la escena (`activeLevel === LEVEL_TO_NUM[currentScene.nivel]`) — para no mostrar la flecha en un piso donde el usuario no está. Usa `userRotation` (la foto fija de la sección 6).
2. **Selector de niveles** (botones 4-3-2-1, solo tab Mapa) — al hacer clic cambia `activeLevel` manualmente.

---

## 9. Header — `components/MapHeader.jsx`

El `<header>` con: logo KINAL, los 3 tabs (`TABS`), el indicador "N.0X Nivel X" y los controles de zoom (`−` / `%` / `+`), y el botón de cerrar. Es un componente puramente de presentación (no tiene estado propio); todo lo dinámico (`activeTab`, `zoom`, `handleZoom`, etc.) llega por props desde `CampusMapPage`.

---

## 10. Modo Admin — `components/AdminSidebar.jsx`

Panel lateral (320px) que solo se muestra cuando `activeTab === 'admin'`. Contiene:

1. **`<select>`** con todas las escenas (`scene.ubicacion` como texto, `scene.subId` como value).
2. **Coordenadas X/Y** (`tempPos`) de la posición actualmente marcada, solo texto informativo.
3. **Slider de calibración de rumbo** (`tempAngle`, -180° a 180°) — "Desfase: X°". Este es el valor que se guarda como `coordinacionAngulo` en el backend y luego usa `minimap-sync` (sección 4) para corregir hacia dónde apunta la flecha de esa escena en particular.
4. **Botón "Guardar Posición"** — deshabilitado si no hay escena seleccionada o posición marcada.

### Flujo completo de calibración (uso típico del admin)
1. Admin abre el mapa → tab **Admin**.
2. Elige una escena del `<select>` → `handleSelectScene` carga su posición/ángulo existentes y cambia al piso correspondiente.
3. Hace clic en el punto del plano donde está esa escena → `handleMapClick` guarda `tempPos` (el **marcador rojo** aparece ahí).
4. Mueve el slider de "Desfase" hasta que, mentalmente, la orientación tenga sentido (el borde superior grueso del marcador rojo rota junto con `tempAngle`, dando una referencia visual de hacia dónde "mirará" el norte).
5. Clic en "Guardar Posición" → `handleSavePosition` hace `POST /scenes/posicion-nivel` con `{ subId, posicion, nivel, coordinacionAngulo }`.

---

## 11. Tab Eventos — `components/EventsList.jsx`

Lista de eventos del campus (`getEvents` desde `shared/api/admin.js`, no relacionado a `scenes.js`). Panel izquierdo con la lista (imagen + descripción + ubicación/fecha), panel derecho con el detalle del evento seleccionado. Es independiente del sistema de mapa/minimapa — comparte solo el modal `CampusMapPage` como contenedor visual (se muestra cuando `activeTab === 'eventos'`, en vez del bloque Mapa/Admin).

---

## 12. Capa de API — `src/shared/api/`

- **`api.js`**: instancia de `axios` (`axiosAdmin`) con `baseURL: import.meta.env.VITE_ADMIN_URL` (definida en `.env` como `http://localhost:3000/kinal-vr/v1`).
- **`scenes.js`** *(nuevo, para este feature)*:
  ```js
  export const getScenes = async () => {
    const response = await axiosAdmin.get('/scenes', { params: { limite: 100 } });
    return response.data.scenes;
  };

  export const updateScenePosition = async (payload) => {
    const response = await axiosAdmin.post('/scenes/posicion-nivel', payload);
    return response.data.scene;
  };
  ```
  Usa el mismo cliente `axiosAdmin` que ya usaba `admin.js` (getSceneBySubId, updateScene, getEvents), para que todo `src/shared/api/` siga un único patrón HTTP.

---

## 13. Backend — soporte de `coordinacionAngulo`

- **`KinalVR-Server/src/scenes/scene.model.js`**: el esquema de Mongoose tiene `coordinacionAngulo: { type: Number, default: 0 }` junto a `posicion`.
- **`KinalVR-Server/src/scenes/scene.controller.js`**, función `updatePositionAndLevel` (ruta `POST /kinal-vr/v1/scenes/posicion-nivel`): además de `subId`, `posicion` y `nivel`, ahora también lee `coordinacionAngulo` del body y lo guarda en el documento antes de `save()`.
- El validador (`middlewares/scene-validators.js`, `updatePosicionNivelValidator`) no necesitó cambios: usa `express-validator`, que no descarta campos no declarados explícitamente — `coordinacionAngulo` pasa sin problema en `req.body`.

---

## 14. Resumen del flujo end-to-end

```
Usuario mira alrededor / se teletransporta en el tour 360°
        │
        ▼
minimap-sync.tick() (VRControls.jsx) calcula grados en cada frame
        │  (cámara + rig + coordinacionAngulo de la escena + 180°)
        ▼
document.getElementById('minimap-container').style.setProperty('--minimap-rotation', ...)
        │
        ├──► MinimapWidget lee la variable CSS en vivo → la flecha gira en tiempo real
        │
        └──► Usuario hace clic en el minimapa
                   │
                   ▼
             CampusMapPage se monta
                   │  useState(() => ...) captura activeLevel y userRotation
                   │  (foto fija de la rotación en ese instante)
                   ▼
             MapInteractive muestra la flecha azul, fija, en el piso correcto
```

Y en paralelo, el flujo de **calibración** (modo Admin):
```
Admin selecciona escena → clic en el mapa (posición) → ajusta slider (ángulo)
        │
        ▼
POST /scenes/posicion-nivel { subId, posicion, nivel, coordinacionAngulo }
        │
        ▼
scene.controller.js guarda en Mongo (coordinacionAngulo default 0 si nunca se calibró)
        │
        ▼
La próxima vez que alguien entre a esa escena, VRControls le pasa
sceneOffset={scene.coordinacionAngulo} → minimap-sync lo suma al cálculo de grados
```
