import { Children } from 'react';
import { Cuadro } from './Cuadro';
import { FRAME_ANIMATION_DELAYS } from '../constants/galleryConstants';



export const EscenarioGallery = ({ titulo = 'Galería', cantidad = 9, children, image }) => {
  const imageElements = Children.toArray(children);

  if (image) {
    imageElements.unshift(image);
  } else {
    // No default images: leave gallery to render only provided children or images
  }

  const frames = [];
  const total = Math.max(cantidad, imageElements.length);

  for (let i = 0; i < total; i += 1) {
    const delayClass = FRAME_ANIMATION_DELAYS[i] ?? FRAME_ANIMATION_DELAYS[FRAME_ANIMATION_DELAYS.length - 1];

    frames.push(
      <Cuadro key={i} delayClass={delayClass}>
        {imageElements[i] || null}
      </Cuadro>
    );
  }

  return (
    <section
      id="escenario-galeria"
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#f2ece4_0%,#e8e0d4_50%,#c9bfb0_100%)] px-5 py-10 before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.008)_2px,rgba(0,0,0,0.008)_4px)] before:content-[''] after:pointer-events-none after:absolute after:left-1/2 after:top-[-120px] after:z-0 after:h-[400px] after:w-[90%] after:-translate-x-1/2 after:bg-[radial-gradient(ellipse_at_center,rgba(255,248,230,0.35)_0%,transparent_70%)] after:content-[''] md:px-10 md:py-[60px]"
    >
      <div className="relative z-10 w-full max-w-[1100px]">
        {titulo && (
          <h2 className="mb-8 text-center font-[var(--font-display)] text-[24px] font-normal uppercase tracking-[4px] text-[#4a3f2f] after:mx-auto after:mt-3.5 after:block after:h-px after:w-[60px] after:bg-[linear-gradient(90deg,transparent,#c9a84c,transparent)] md:mb-12 md:text-[32px] md:tracking-[6px]">
            {titulo}
          </h2>
        )}

        <div className="grid grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-16">
          {frames}
        </div>
      </div>
    </section>
  );
};