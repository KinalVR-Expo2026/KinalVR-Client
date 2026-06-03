import { Children } from 'react';

export const Cuadro = ({ children, delayClass }) => {
  const content = Children.toArray(children);
  const hasContent = content.length > 0;

  return (
    <div
      className={`relative aspect-[16/10] w-full max-w-[370px] flex-shrink-0 animate-[fadeIn_0.8s_ease-out_both] transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-[1.04] hover:-translate-y-1 [filter:drop-shadow(0_20px_25px_rgba(30,20,5,0.6))_drop-shadow(0_8px_10px_rgba(30,20,5,0.4))] max-md:max-w-[300px] max-sm:max-w-[240px] ${delayClass ?? ''}`}
    >
      {/* Outer base - enhanced contrast for realistic metal */}
      <div className="absolute inset-0 rounded-[3px] bg-[linear-gradient(160deg,#a6801c_0%,#5a4210_30%,#3d2b09_50%,#5a4210_70%,#a6801c_100%)] shadow-[0_0_2px_1px_rgba(60,40,10,0.8),inset_0_0_2px_rgba(255,220,130,0.4)]" />

      {/* Inner bevel 1 - added more specular highlights */}
      <div className="absolute inset-[3px] rounded-[2px] bg-[linear-gradient(165deg,#ffe898_0%,#cba73e_12%,#b88c2b_24%,#d4b146_36%,#ffeca0_48%,#a88428_60%,#96721d_72%,#cba73e_84%,#ffeca0_92%,#96721d_100%)] shadow-[inset_0_2px_1px_rgba(255,245,200,0.7),inset_0_-2px_2px_rgba(60,40,10,0.8),inset_2px_0_1px_rgba(255,245,200,0.4),inset_-2px_0_1px_rgba(60,40,10,0.6),0_0_4px_rgba(60,40,10,0.9)]">
        <div className="absolute left-[8px] right-[8px] top-[1px] h-[2px] rounded-full bg-[linear-gradient(90deg,transparent_5%,rgba(255,255,255,0.7)_30%,rgba(255,255,255,0.9)_50%,rgba(255,255,255,0.7)_70%,transparent_95%)]" />
        <div className="absolute bottom-[1px] left-[8px] right-[8px] h-[2px] rounded-full bg-[linear-gradient(90deg,transparent_5%,rgba(50,30,5,0.6)_30%,rgba(50,30,5,0.8)_50%,rgba(50,30,5,0.6)_70%,transparent_95%)]" />
      </div>

      <div className="absolute inset-[14px] rounded-[1px] shadow-[0_0_0_1px_#6b4f12,0_0_3px_2px_rgba(60,40,10,0.7),inset_0_0_0_1px_rgba(255,245,200,0.2)]" />

      {/* Carved inner section with repeating pattern */}
      <div className="absolute inset-[18px] rounded-[1px] bg-[linear-gradient(170deg,#d4b146_0%,#b88c2b_20%,#a88428_40%,#cba73e_60%,#d4b146_80%,#96721d_100%)] shadow-[inset_0_1px_1px_rgba(255,245,200,0.6),inset_0_-1px_2px_rgba(60,40,10,0.8),0_2px_4px_rgba(40,25,5,0.7)]">
        <div className="absolute left-[4px] right-[4px] top-[3px] h-[2px] bg-[repeating-linear-gradient(90deg,rgba(255,245,200,0.6)_0px,rgba(255,245,200,0.6)_2px,rgba(120,85,20,0.6)_2px,rgba(120,85,20,0.6)_4px)] opacity-80" />
        <div className="absolute bottom-[3px] left-[4px] right-[4px] h-[2px] bg-[repeating-linear-gradient(90deg,rgba(120,85,20,0.6)_0px,rgba(120,85,20,0.6)_2px,rgba(255,245,200,0.6)_2px,rgba(255,245,200,0.6)_4px)] opacity-80" />
        <div className="absolute bottom-[4px] left-[3px] top-[4px] w-[2px] bg-[repeating-linear-gradient(180deg,rgba(255,245,200,0.6)_0px,rgba(255,245,200,0.6)_2px,rgba(120,85,20,0.6)_2px,rgba(120,85,20,0.6)_4px)] opacity-80" />
        <div className="absolute bottom-[4px] right-[3px] top-[4px] w-[2px] bg-[repeating-linear-gradient(180deg,rgba(120,85,20,0.6)_0px,rgba(120,85,20,0.6)_2px,rgba(255,245,200,0.6)_2px,rgba(255,245,200,0.6)_4px)] opacity-80" />
      </div>

      <div className="absolute inset-[28px] shadow-[0_0_0_1px_#6b4f12,0_0_5px_rgba(50,30,5,0.6),inset_0_0_0_1px_rgba(40,25,5,0.4)]" />

      {/* Deepest inner bevel */}
      <div className="absolute inset-[30px] bg-[linear-gradient(180deg,#cba73e_0%,#96721d_50%,#7a5a12_100%)] shadow-[inset_0_2px_1px_rgba(255,245,200,0.4),inset_0_-2px_1px_rgba(40,25,5,0.6)]" />

      {/* Corners (Ornate details) - Improved metallic sphere highlights */}
      <div className="absolute left-[2px] top-[2px] h-[28px] w-[28px]">
        <div className="absolute inset-0 rounded-br-full bg-[radial-gradient(ellipse_at_30%_30%,#ffeca0_0%,#cba73e_40%,#6b4f12_100%)] opacity-95 shadow-[2px_2px_4px_rgba(40,25,5,0.7),inset_0_0_3px_rgba(255,245,200,0.5)]" />
        <div className="absolute left-[4px] top-[4px] h-[10px] w-[10px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffffff_0%,#ffeca0_20%,#b88c2b_70%,#6b4f12_100%)] shadow-[inset_0_-1px_2px_rgba(40,25,5,0.6),0_1px_3px_rgba(40,25,5,0.5)]" />
      </div>
      <div className="absolute right-[2px] top-[2px] h-[28px] w-[28px]">
        <div className="absolute inset-0 rounded-bl-full bg-[radial-gradient(ellipse_at_70%_30%,#ffeca0_0%,#cba73e_40%,#6b4f12_100%)] opacity-95 shadow-[-2px_2px_4px_rgba(40,25,5,0.7),inset_0_0_3px_rgba(255,245,200,0.5)]" />
        <div className="absolute right-[4px] top-[4px] h-[10px] w-[10px] rounded-full bg-[radial-gradient(circle_at_65%_35%,#ffffff_0%,#ffeca0_20%,#b88c2b_70%,#6b4f12_100%)] shadow-[inset_0_-1px_2px_rgba(40,25,5,0.6),0_1px_3px_rgba(40,25,5,0.5)]" />
      </div>
      <div className="absolute bottom-[2px] left-[2px] h-[28px] w-[28px]">
        <div className="absolute inset-0 rounded-tr-full bg-[radial-gradient(ellipse_at_30%_70%,#ffeca0_0%,#cba73e_40%,#6b4f12_100%)] opacity-95 shadow-[2px_-2px_4px_rgba(40,25,5,0.7),inset_0_0_3px_rgba(255,245,200,0.5)]" />
        <div className="absolute bottom-[4px] left-[4px] h-[10px] w-[10px] rounded-full bg-[radial-gradient(circle_at_35%_65%,#ffffff_0%,#ffeca0_20%,#b88c2b_70%,#6b4f12_100%)] shadow-[inset_0_1px_2px_rgba(40,25,5,0.6),0_-1px_3px_rgba(40,25,5,0.5)]" />
      </div>
      <div className="absolute bottom-[2px] right-[2px] h-[28px] w-[28px]">
        <div className="absolute inset-0 rounded-tl-full bg-[radial-gradient(ellipse_at_70%_70%,#ffeca0_0%,#cba73e_40%,#6b4f12_100%)] opacity-95 shadow-[-2px_-2px_4px_rgba(40,25,5,0.7),inset_0_0_3px_rgba(255,245,200,0.5)]" />
        <div className="absolute bottom-[4px] right-[4px] h-[10px] w-[10px] rounded-full bg-[radial-gradient(circle_at_65%_65%,#ffffff_0%,#ffeca0_20%,#b88c2b_70%,#6b4f12_100%)] shadow-[inset_0_1px_2px_rgba(40,25,5,0.6),0_-1px_3px_rgba(40,25,5,0.5)]" />
      </div>

      {/* Top and Bottom Center ornaments */}
      <div className="absolute left-1/2 top-[1px] h-[14px] w-[40px] -translate-x-1/2">
        <div className="absolute inset-0 rounded-b-full bg-[radial-gradient(ellipse_at_50%_20%,#ffeca0_0%,#cba73e_40%,#7a5a12_100%)] shadow-[0_2px_4px_rgba(40,25,5,0.5),inset_0_1px_2px_rgba(255,255,255,0.6)]" />
        <div className="absolute left-1/2 top-[2px] h-[6px] w-[16px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#ffeca0_60%,#b88c2b_100%)] shadow-[0_1px_2px_rgba(40,25,5,0.4)]" />
      </div>
      <div className="absolute bottom-[1px] left-1/2 h-[14px] w-[40px] -translate-x-1/2">
        <div className="absolute inset-0 rounded-t-full bg-[radial-gradient(ellipse_at_50%_80%,#ffeca0_0%,#cba73e_40%,#7a5a12_100%)] shadow-[0_-2px_4px_rgba(40,25,5,0.5),inset_0_-1px_2px_rgba(255,255,255,0.6)]" />
        <div className="absolute bottom-[2px] left-1/2 h-[6px] w-[16px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_70%,#ffffff_0%,#ffeca0_60%,#b88c2b_100%)] shadow-[0_-1px_2px_rgba(40,25,5,0.4)]" />
      </div>

      {/* Canvas Area */}
      <div className="absolute inset-[36px] flex items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#dfd8cb_0%,#c5bfae_100%)] shadow-[inset_0_5px_15px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(60,40,10,0.3)] max-md:inset-[30px] max-sm:inset-[25px]">
        {hasContent ? (
          <>
            <div className="h-full w-full [&>*]:h-full [&>*]:w-full [&>*]:object-cover">
              {content}
            </div>
            {/* Added: Realistic Glass Glare Overlay to the original design */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_40%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0)_55%,rgba(255,255,255,0)_100%)] mix-blend-screen" />
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_25%)]" />
            <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]" />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-25">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7a6b5a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};