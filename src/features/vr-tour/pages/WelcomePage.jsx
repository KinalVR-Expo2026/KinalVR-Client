import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTourStore } from '../store/useTourStore';

const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

const ClockFace = () => {
  const size = 480;
  const radius = size / 2;
  const numeralRadius = radius - 22;
  const tickOuterRadius = radius - 8;
  const tickInnerRadius = tickOuterRadius - 10;
  const tickMajorInner = tickOuterRadius - 16;

  const ticks = useMemo(() => {
    const items = [];

    for (let index = 0; index < 60; index += 1) {
      const angle = (index * 6 - 90) * (Math.PI / 180);
      const isMajor = index % 5 === 0;
      const innerRadius = isMajor ? tickMajorInner : tickInnerRadius;

      items.push({
        key: index,
        isMajor,
        x1: radius + Math.cos(angle) * innerRadius,
        y1: radius + Math.sin(angle) * innerRadius,
        x2: radius + Math.cos(angle) * tickOuterRadius,
        y2: radius + Math.sin(angle) * tickOuterRadius,
      });
    }

    return items;
  }, [radius, tickMajorInner, tickInnerRadius, tickOuterRadius]);

  const numeralPositions = useMemo(() => {
    return NUMERALS.map((numeral, index) => {
      const angle = (index * 30 - 90) * (Math.PI / 180);

      return {
        numeral,
        x: radius + Math.cos(angle) * numeralRadius,
        y: radius + Math.sin(angle) * numeralRadius,
      };
    });
  }, [radius, numeralRadius]);

  return (
    <div className="h-[280px] w-[280px] rounded-full animate-clock-fade-in md:h-[340px] md:w-[340px] lg:h-[480px] lg:w-[480px]">
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={radius} cy={radius} r={radius - 12} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <circle cx={radius} cy={radius} r={radius - 40} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {ticks.map((tick) => (
          <line
            key={tick.key}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.isMajor ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
            strokeWidth={tick.isMajor ? 1.5 : 0.8}
          />
        ))}

        {numeralPositions.map((numeral) => (
          <text
            key={numeral.numeral}
            x={numeral.x}
            y={numeral.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.35)"
            fontFamily="'Cormorant Garamond', serif"
            fontSize="20"
            fontWeight="400"
            letterSpacing="1"
          >
            {numeral.numeral}
          </text>
        ))}
      </svg>
    </div>
  );
};

const TopBar = () => {
  return (
    <header className="absolute left-6 right-6 top-6 z-20 flex items-start justify-between animate-fade-in md:left-10 md:right-10 md:top-10">
      <button
        className="flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-3 py-2 text-[10px] font-medium tracking-[1px] text-[#e0e4eb] backdrop-blur-[4px] transition-all duration-300 hover:border-white/40 hover:bg-white/5 sm:px-4 sm:py-2 sm:text-[11px]"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        MODO PC
      </button>
    </header>
  );
};

const HeroContent = ({ onStart, isReady }) => {
  return (
    <section className="relative z-10 flex flex-col items-center text-center animate-content-fade-in">
      <div className="mb-4 flex h-8 w-8 items-center justify-center md:mb-6 md:h-10 md:w-10">
        <svg viewBox="0 0 100 100" className="h-full w-full fill-none stroke-[#e0e4eb] stroke-[1]">
          <path d="M50 5 L60 25 L80 20 L75 40 L95 50 L75 60 L80 80 L60 75 L50 95 L40 75 L20 80 L25 60 L5 50 L25 40 L20 20 L40 25 Z" />
          <text x="50" y="58" fontSize="30" textAnchor="middle" fill="#e0e4eb" stroke="none" fontFamily="'Cormorant Garamond', serif">
            K
          </text>
        </svg>
      </div>

      <h1 className="ml-2 m-0 font-[var(--font-display)] text-[28px] font-normal uppercase tracking-[8px] text-white [text-shadow:0_4px_20px_rgba(0,0,0,0.5)] md:ml-3 md:text-[36px] md:tracking-[12px] lg:ml-4 lg:text-[56px] lg:tracking-[16px]">
        Kinal
      </h1>

      <p className="mb-10 mt-3 font-[var(--font-sans)] text-[11px] font-light uppercase tracking-[4px] text-white/60 md:mb-12 md:text-[12px] md:tracking-[6px]">
        Por el tiempo
      </p>

      <button
        className={`flex items-center gap-3 rounded-full border-0 px-8 py-3.5 font-[var(--font-sans)] text-[11px] font-semibold uppercase tracking-[2px] text-white transition-all duration-300 md:px-10 md:py-4 ${
          isReady 
            ? "bg-[linear-gradient(135deg,_#f97316_0%,_#ea580c_100%)] shadow-[0_8px_24px_rgba(234,88,12,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,_#fb923c_0%,_#f97316_100%)] hover:shadow-[0_12px_32px_rgba(234,88,12,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] active:translate-y-px active:shadow-[0_4px_12px_rgba(234,88,12,0.3)] cursor-pointer"
            : "bg-slate-700 opacity-50 cursor-not-allowed"
        }`}
        type="button"
        onClick={onStart}
        disabled={!isReady}
      >
        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white/60">
          <svg viewBox="0 0 12 12" className="ml-px h-1.5 w-1.5 fill-white">
            <polygon points="4,3 9,6 4,9" />
          </svg>
        </span>
        {isReady ? 'Iniciar Experiencia' : 'Cargando Entorno...'}
      </button>
    </section>
  );
};

export const WelcomePage = () => {
  const navigate = useNavigate();
  const preloadInitialScene = useTourStore((state) => state.preloadInitialScene);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initPreload = async () => {
      await preloadInitialScene('entrada');
      setIsReady(true);
    };
    initPreload();
  }, [preloadInitialScene]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_#1b2036_0%,_#0d101d_60%,_#060810_100%)] font-[var(--font-sans)] text-white">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(1px_1px_at_10%_20%,rgba(255,255,255,0.8)_100%,transparent),radial-gradient(1px_1px_at_80%_40%,rgba(255,255,255,0.6)_100%,transparent),radial-gradient(2px_2px_at_40%_70%,rgba(255,255,255,0.9)_100%,transparent),radial-gradient(1px_1px_at_70%_90%,rgba(255,255,255,0.4)_100%,transparent),radial-gradient(1px_1px_at_25%_60%,rgba(255,255,255,0.7)_100%,transparent),radial-gradient(2px_2px_at_85%_15%,rgba(255,240,200,0.8)_100%,transparent)] bg-[length:100%_100%]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <ClockFace />
      </div>

      <TopBar />
      <HeroContent onStart={() => navigate('/dashboard')} isReady={isReady} />
    </div>
  );
};
