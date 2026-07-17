import { useEffect, useState } from 'react';
import { getEvents } from '../../../shared/api/admin';

const formatEventDate = (isoDate) => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-GT', { day: 'numeric', month: 'long' });
};

export const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getEvents({ limite: 100 })
      .then((data) => {
        if (!isMounted) return;
        setEvents(Array.isArray(data) ? data : []);
        setStatus('success');
      })
      .catch(() => {
        if (isMounted) setStatus('error');
      });
    return () => { isMounted = false; };
  }, []);

  const selectedEvent = events.find((event) => event._id === selectedId) || null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="flex w-72 flex-shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#151a30] sm:w-80">
        {status === 'loading' && (
          <p className="px-4 py-6 text-center text-[11px] text-white/40">Cargando eventos...</p>
        )}
        {status === 'error' && (
          <p className="px-4 py-6 text-center text-[11px] text-red-400">No se pudieron cargar los eventos.</p>
        )}
        {status === 'success' && events.length === 0 && (
          <p className="px-4 py-6 text-center text-[11px] text-white/40">Aún no hay eventos registrados.</p>
        )}

        {events.map((event) => {
          const isSelected = selectedId === event._id;
          const dateLabel = formatEventDate(event.createdAt);

          return (
            <button
              key={event._id}
              type="button"
              onClick={() => setSelectedId(event._id)}
              className={`flex items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors cursor-pointer ${
                isSelected ? 'bg-orange-500/15' : 'hover:bg-white/5'
              }`}
            >
              <img
                src={event.urlImagen}
                alt=""
                crossOrigin="anonymous"
                className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className={`truncate text-[12px] font-medium ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                  {event.descripcion}
                </p>
                <p className="truncate text-[10px] text-white/40">
                  {[dateLabel, event.idEscenario?.ubicacion].filter(Boolean).join(' · ') || 'Sin ubicación'}
                </p>
              </div>
            </button>
          );
        })}
      </aside>

      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-[#eef1f6] p-6">
        {selectedEvent ? (
          <div className="flex w-full max-w-xl flex-col gap-4">
            <img
              src={selectedEvent.urlImagen}
              alt="Evento"
              crossOrigin="anonymous"
              className="max-h-[45vh] w-full rounded-xl bg-white object-contain shadow-sm"
            />

            <div className="flex flex-wrap items-center gap-2">
              {selectedEvent.idEscenario?.ubicacion && (
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-600">
                  {selectedEvent.idEscenario.ubicacion}
                </span>
              )}
              {formatEventDate(selectedEvent.createdAt) && (
                <span className="text-[11px] text-slate-400">{formatEventDate(selectedEvent.createdAt)}</span>
              )}
            </div>

            <p className="text-[13.5px] leading-relaxed text-slate-600">{selectedEvent.descripcion}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <p className="text-[12px]">Selecciona un evento para ver más información.</p>
          </div>
        )}
      </div>
    </div>
  );
};