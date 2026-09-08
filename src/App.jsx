import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntdApp } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { seedDatabase } from "./services/seedService";
import AppRoutes from "./routes/AppRoutes";

function App() {
  useEffect(() => {
    // Silently trigger db seeding check
    seedDatabase();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6366f1", // Indigo primary
          colorSuccess: "#10b981", // Emerald green
          colorWarning: "#f59e0b", // Amber yellow
          colorError: "#ef4444",   // Red error
          colorInfo: "#3b82f6",    // Blue info
          colorBgBase: "#f8fafc",  // Light base background
          colorBgContainer: "#ffffff", // White container background
          borderRadius: 12,
          fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        components: {
          Button: {
            controlHeight: 40,
            borderRadius: 8,
            fontWeight: 600,
          },
          Input: {
            controlHeight: 40,
            borderRadius: 8,
          },
          Select: {
            controlHeight: 40,
            borderRadius: 8,
          },
          Card: {
            borderRadiusLG: 16,
          },
          Table: {
            borderRadiusLG: 12,
            headerBg: "#f8fafc",
            headerColor: "#475569",
            rowHoverBg: "#f1f5f9",
          },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;