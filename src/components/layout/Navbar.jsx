import { useState } from "react";
import { AppBar, Toolbar, Typography, IconButton, Box, Avatar, Menu, MenuItem, Divider, Badge } from "@mui/material";
import { Menu as MenuIcon, Notifications, Brightness4, Brightness7, Logout, Person } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useColorMode } from "../../contexts/ColorModeContext";
import authService from "../../services/authService";
import { useNotification } from "../../contexts/NotificationContext";

export function Navbar({ handleDrawerToggle }) {
    const { user } = useAuth();
    const { mode, toggleColorMode } = useColorMode();
    const { showNotification } = useNotification();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleProfileClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleClose();
        try {
            await authService.logout();
            showNotification("Logged out successfully.", "success");
            // AppRoutes/AuthContext handles redirection to login automatically
        } catch (error) {
            showNotification("Failed to sign out. Please try again.", "error");
        }
    };

    // Extract initials for Avatar placeholder
    const getInitials = () => {
        if (!user) return "EAM";
        if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        return user.email.slice(0, 2).toUpperCase();
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                backgroundColor: (theme) => theme.palette.mode === "dark" ? "rgba(10, 15, 29, 0.75)" : "rgba(248, 250, 252, 0.75)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid",
                borderColor: "divider",
                color: "text.primary",
                zIndex: (theme) => theme.zIndex.drawer + 1
            }}
        >
            <Toolbar sx={{ justifyContent: "space-between" }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 1, display: { md: "none" } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    
                    <Typography 
                        variant="h6" 
                        fontWeight="800" 
                        letterSpacing="-0.5px"
                        sx={{ 
                            background: (theme) => theme.palette.mode === "dark" 
                                ? "linear-gradient(135deg, #818cf8 0%, #22d3ee 100%)"
                                : "linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}
                    >
                        Cloud EAM Console
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1.5}>
                    {/* Theme Toggle */}
                    <IconButton onClick={toggleColorMode} color="inherit" size="small">
                        {mode === "dark" ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
                    </IconButton>

                    {/* Notifications Alert */}
                    <IconButton color="inherit" size="small">
                        <Badge badgeContent={3} color="secondary" variant="dot">
                            <Notifications fontSize="small" />
                        </Badge>
                    </IconButton>

                    <Divider orientation="vertical" flexItem sx={{ my: 1.5, mx: 0.5 }} />

                    {/* User profile details */}
                    <Box display={{ xs: "none", sm: "flex" }} flexDirection="column" alignItems="flex-end">
                        <Typography variant="subtitle2" fontWeight="700">
                            {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.displayName : "Guest User"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">
                            {user?.role || "User"}
                        </Typography>
                    </Box>

                    {/* Profile Avatar */}
                    <IconButton
                        onClick={handleProfileClick}
                        size="small"
                        aria-controls={open ? "profile-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? "true" : undefined}
                    >
                        <Avatar
                            src={user?.profilePicture}
                            sx={{
                                bgcolor: "primary.main",
                                width: 38,
                                height: 38,
                                fontSize: "0.9rem",
                                fontWeight: "700",
                                border: "2px solid",
                                borderColor: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"
                            }}
                        >
                            {getInitials()}
                        </Avatar>
                    </IconButton>

                    {/* Profile Dropdown Menu */}
                    <Menu
                        anchorEl={anchorEl}
                        id="profile-menu"
                        open={open}
                        onClose={handleClose}
                        transformOrigin={{ horizontal: "right", vertical: "top" }}
                        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                        PaperProps={{
                            elevation: 8,
                            sx: {
                                mt: 1.5,
                                minWidth: 200,
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                overflow: "visible"
                            }
                        }}
                    >
                        <Box sx={{ px: 2.5, py: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                                {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.displayName : "Guest User"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                                {user?.email}
                            </Typography>
                        </Box>
                        <Divider />
                        
                        <MenuItem onClick={handleClose}>
                            <Person fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                            My Profile
                        </MenuItem>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                            <Logout fontSize="small" sx={{ mr: 1.5 }} />
                            Sign Out
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;