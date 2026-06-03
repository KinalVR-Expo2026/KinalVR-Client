import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../layouts/DashboardPage";
import { WelcomePage } from "../../features/vr-tour/pages/WelcomePage";
import { Escenario } from "../../features/vr-tour/pages/Escenario";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/escenario" element={<Escenario />} />
    </Routes>
  );
};
