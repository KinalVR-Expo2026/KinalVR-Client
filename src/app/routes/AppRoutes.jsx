import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../layouts/DashboardPage";
import { WelcomePages } from "../../features/vr-tour/pages/WelcomePages";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePages />} />
        <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
};
