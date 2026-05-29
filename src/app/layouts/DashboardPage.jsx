import {DashboardContainer} from "../../shared/components/layout/DashboardContainer.jsx"
import { Outlet } from "react-router-dom"

export const DashboardPage = () => {
  return (
    <DashboardContainer>
      <Outlet />
    </DashboardContainer>
  )
}