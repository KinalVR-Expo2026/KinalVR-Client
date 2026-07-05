import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardPage } from "../layouts/DashboardPage";
import { WelcomePage } from "../../features/vr-tour/pages/WelcomePage";
import { TourPage } from "../../features/vr-tour/pages/TourPage";
import { hasExperienceStarted } from "../../features/vr-tour/session/experienceSession";

// Si se llega a /dashboard sin haber pulsado "Iniciar Experiencia" (recarga con
// F5, el botón A del mando que recarga, o URL directa), volver a la pantalla de
// inicio para re-entrar limpio. La bandera vive en memoria, así que cualquier
// recarga la reinicia y activa esta redirección.
const RequireExperienceStarted = ({ children }) => {
  return hasExperienceStarted() ? children : <Navigate to="/" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route
        path="/dashboard"
        element={
          <RequireExperienceStarted>
            <DashboardPage />
          </RequireExperienceStarted>
        }
      >
        <Route index element={<TourPage />} />
      </Route>
    </Routes>
  );
};