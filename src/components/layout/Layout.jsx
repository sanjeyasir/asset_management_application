import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout as AntLayout, Menu, Button, Avatar, Space, Tooltip, Tag, Drawer, Grid, Typography } from "antd";
import {
  MenuOutlined,
  DashboardOutlined,
  DesktopOutlined,
  TeamOutlined,
  ApartmentOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  TagsOutlined,
  LogoutOutlined,
  CloudOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import authService from "../../services/authService";
import sessionService from "../../services/sessionService";

const { Header, Sider, Content } = AntLayout;
const { useBreakpoint } = Grid;
const { Text } = Typography;

export function Layout() {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const isMobile = !screens.md;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const userRole = currentUser?.role || "Employee";
  const username = currentUser?.displayName || currentUser?.fullName || currentUser?.email?.split("@")[0] || "User";
  const initials = (currentUser?.firstName ? `${currentUser.firstName[0]}${currentUser.lastName?.[0] || ""}` : username.substring(0, 2)).toUpperCase();

  const logout = async () => {
    try {
      localStorage.setItem("cloud_erp_logout", "true");
      await sessionService.invalidateSession();
      await authService.logout();
      showNotification("Logged out successfully.", "success");
      navigate("/login");
    } catch {
      showNotification("Logout failed.", "error");
    }
  };

  const navMenuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined style={{ fontSize: 16 }} />,
      label: "Dashboard",
      roles: ["Admin", "Manager", "Employee"]
    },
    {
      key: "/assets",
      icon: <DesktopOutlined style={{ fontSize: 16 }} />,
      label: "Asset Registry",
      roles: ["Admin", "Manager", "Employee"]
    },
    {
      key: "/asset-categories",
      icon: <TagsOutlined style={{ fontSize: 16 }} />,
      label: "Asset Categories",
      roles: ["Admin", "Manager"]
    },
    {
      key: "/locations",
      icon: <EnvironmentOutlined style={{ fontSize: 16 }} />,
      label: "Locations",
      roles: ["Admin", "Manager"]
    },
    {
      key: "/departments",
      icon: <ApartmentOutlined style={{ fontSize: 16 }} />,
      label: "Departments",
      roles: ["Admin"]
    },
    {
      key: "/designations",
      icon: <IdcardOutlined style={{ fontSize: 16 }} />,
      label: "Designations",
      roles: ["Admin"]
    },
    {
      key: "/employees",
      icon: <TeamOutlined style={{ fontSize: 16 }} />,
      label: "Employees & Access",
      roles: ["Admin"]
    }
  ].filter(item => item.roles.includes(userRole));

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) setMobileOpen(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin": return "red";
      case "Manager": return "purple";
      case "Employee": return "green";
      default: return "blue";
    }
  };

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
      <div>
        {/* Brand Header */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "0 12px" : "0 24px",
            borderBottom: "1px solid #f1f5f9",
            gap: 12
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 10px rgba(99, 102, 241, 0.3)",
              flexShrink: 0
            }}
          >
            <DatabaseOutlined style={{ fontSize: 20 }} />
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                Cloud ERP
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                ASSET MANAGEMENT
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={navMenuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            padding: "16px 12px",
            fontWeight: 600,
            background: "transparent"
          }}
        />
      </div>

      {/* User Footer Profile */}
      <div>
        <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "12px 0 0 0" }} />
        <div style={{ padding: collapsed ? "12px" : "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {!collapsed ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar
                style={{
                  backgroundColor: "#10b981",
                  fontWeight: 700,
                  boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)"
                }}
              >
                {initials}
              </Avatar>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {username}
                </div>
                <div style={{ color: "#64748b", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentUser?.email || `${userRole} Access`}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Avatar style={{ backgroundColor: "#10b981", fontWeight: 700 }}>
                {initials}
              </Avatar>
            </div>
          )}
          <Button
            type="default"
            danger
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{
              background: "rgba(239, 68, 68, 0.04)",
              borderColor: "rgba(239, 68, 68, 0.15)",
              width: "100%",
              padding: collapsed ? 0 : "4px 15px",
              height: 36,
              borderRadius: 8
            }}
          >
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <AntLayout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          width={260}
          collapsedWidth={80}
          collapsible
          collapsed={collapsed}
          trigger={null}
          style={{
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            background: "#ffffff",
            borderRight: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)"
          }}
        >
          {sidebarContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        styles={{ body: { padding: 0, background: "#ffffff" } }}
        width={260}
      >
        {sidebarContent}
      </Drawer>

      <AntLayout
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 260),
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.2s ease-in-out",
          background: "#f8fafc"
        }}
      >
        {/* Top Header */}
        <Header
          style={{
            padding: "0 24px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #e2e8f0",
            position: "fixed",
            top: 0,
            right: 0,
            left: isMobile ? 0 : (collapsed ? 80 : 260),
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            transition: "all 0.2s ease-in-out"
          }}
        >
          <Space size="middle">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => (isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed))}
              style={{ fontSize: "16px", width: 38, height: 38, color: "#0f172a", borderRadius: 8 }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "#10b981",
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 18 }} />
              {!isMobile ? "Enterprise Asset Management" : "EAM"}
            </span>
          </Space>

          <Space size="middle">
            {/* Cloud Status */}
            <Tooltip title="Firebase Firestore live connection active">
              <Tag
                icon={<CloudOutlined />}
                color="success"
                style={{
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {!isMobile ? "Cloud Connected" : "Online"}
              </Tag>
            </Tooltip>

            {/* Role Badge */}
            <Tag
              color={getRoleColor(userRole)}
              style={{
                fontWeight: 800,
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: "0.06em",
                padding: "3px 10px",
                borderRadius: 8,
                margin: 0
              }}
            >
              {userRole}
            </Tag>
          </Space>
        </Header>

        {/* Main Content Area */}
        <Content
          style={{
            margin: "84px 24px 24px 24px",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{ flexGrow: 1 }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;