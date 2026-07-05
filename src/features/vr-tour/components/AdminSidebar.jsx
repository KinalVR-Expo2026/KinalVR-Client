export const AdminSidebar = ({
  scenes,
  selectedSubId,
  handleSelectScene,
  tempPos,
  tempAngle,
  setTempAngle,
  handleSavePosition,
  loading,
}) => {
  return (
    <aside className="flex w-[320px] flex-shrink-0 flex-col gap-4 border-r border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-700">Admin - Posicionar Escenas</h2>

      <select
        value={selectedSubId}
        onChange={handleSelectScene}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
      >
        <option value="">Selecciona una escena</option>
        {scenes.map((scene) => (
          <option key={scene.subId} value={scene.subId}>
            {scene.ubicacion}
          </option>
        ))}
      </select>

      {tempPos && (
        <div className="text-xs text-slate-500">
          <p>X: {tempPos[0]}</p>
          <p>Y: {tempPos[1]}</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="tempAngle" className="text-xs text-slate-500">
          Desfase: {tempAngle}°
        </label>
        <input
          id="tempAngle"
          type="range"
          min="-180"
          max="180"
          step="1"
          value={tempAngle}
          onChange={(e) => setTempAngle(e.target.value)}
          className="cursor-pointer"
        />
      </div>

      <button
        type="button"
        onClick={handleSavePosition}
        disabled={!selectedSubId || !tempPos || loading}
        className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-40 cursor-pointer"
      >
        {loading ? 'Guardando...' : 'Guardar Posición'}
      </button>
    </aside>
  );
};
