import { EscenarioGallery } from '../components/EscenarioGallery';
import { HeaderBackButton } from '../components/HeaderBackButton';

export const Escenario = ({ titulo = 'Galería', cantidad = 9, children, image }) => {
  return (
    <div className="relative min-h-screen">
      <HeaderBackButton />

      <EscenarioGallery titulo={titulo} cantidad={cantidad} image={image}>
        {children}
      </EscenarioGallery>
    </div>
  );
};
