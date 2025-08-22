import { Route, Routes } from 'react-router-dom';

import DashboardLayout from "./layouts/DashboardLayout";
import FullWidthLayout from "./layouts/FullWidthLayout";

import ProtectedRoute from "./components/ProtectedRoute";
import Daw from './pages/Daw';
import Home from './pages/Home';
import Login from './pages/Login';
import Settings from './pages/Settings';

import AppTheme from './theme/AppTheme';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function App(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={
            <FullWidthLayout>
              <Login />
            </FullWidthLayout>
          }
        />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Home />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/daw/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Daw />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AppTheme>
  );
}
