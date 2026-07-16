import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Box, Toolbar, useTheme, useMediaQuery } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useSession } from "../../contexts/SessionContext";

export function Layout() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    
    // Manage mobile drawer open state
    const [mobileOpen, setMobileOpen] = useState(false);
    
    // Manage desktop sidebar collapse state
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const stored = localStorage.getItem("cloud_erp_sidebar_collapsed");
        return stored === "true";
    });

    const { resetSessionTimer } = useSession();

    // Trigger timer reset on initial mount
    useEffect(() => {
        resetSessionTimer();
    }, [resetSessionTimer]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleSidebarCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("cloud_erp_sidebar_collapsed", String(next));
            return next;
        });
    };

    const sidebarWidth = isMobile 
        ? 0 
        : (isCollapsed ? 70 : 260);

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            {/* Header Navigation Bar */}
            <Navbar handleDrawerToggle={handleDrawerToggle} />

            {/* Left Sidebar Menu */}
            <Sidebar
                open={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
                isCollapsed={isCollapsed}
                handleSidebarCollapse={handleSidebarCollapse}
            />

            {/* Main Content Layout Container */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2.5, md: 4 },
                    width: { md: `calc(100% - ${sidebarWidth}px)` },
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    transition: "width 0.2s ease-in-out, padding 0.2s ease-in-out",
                    boxSizing: "border-box",
                    backgroundColor: (theme) => theme.palette.background.default
                }}
            >
                {/* Spacer matching the fixed AppBar height */}
                <Toolbar />

                {/* Inner page content injected here */}
                <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", py: 1 }}>
                    <Outlet />
                </Box>

                {/* Shared footer */}
                <Footer />
            </Box>
        </Box>
    );
}

export default Layout;