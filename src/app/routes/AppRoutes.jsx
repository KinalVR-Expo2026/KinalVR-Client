import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../layouts/DashboardPage";
import { WelcomePage } from "../../features/vr-tour/pages/WelcomePage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
};
