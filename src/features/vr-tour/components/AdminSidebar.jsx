export const AdminSidebar = ({
  scenes,
  selectedSubId,
  handleSelectScene,
  tempPos,
  tempAngle,
  setTempAngle,
  handleAngleChangeEnd,
  savingStatus,
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
          onMouseUp={(e) => handleAngleChangeEnd?.(e.target.value)}
          onTouchEnd={(e) => handleAngleChangeEnd?.(e.target.value)}
          className="cursor-pointer"
        />
      </div>

      <div className="mt-2 flex items-center justify-center py-2 text-xs font-semibold rounded-full border border-slate-100 bg-slate-50/50">
        {savingStatus === 'saving' && (
          <span className="text-orange-500 flex items-center gap-1.5 animate-pulse">
            <svg className="animate-spin h-3.5 w-3.5 text-orange-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Guardando posición...
          </span>
        )}
        {savingStatus === 'saved' && (
          <span className="text-green-600 flex items-center gap-1">
            ✓ Guardado automáticamente
          </span>
        )}
        {savingStatus === 'error' && (
          <span className="text-red-500">
            ⚠ Error al guardar
          </span>
        )}
        {savingStatus === 'idle' && (
          <span className="text-slate-400">
            ✓ Todo guardado
          </span>
        )}
      </div>
    </aside>
  );
};
