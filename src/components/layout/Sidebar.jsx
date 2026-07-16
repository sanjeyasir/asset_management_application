import { useState } from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, Box, IconButton, Divider } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { 
    Dashboard, People, Business, Settings, Assessment, ChevronLeft, ChevronRight, 
    ExpandLess, ExpandMore, Category, Room, Devices, BusinessCenter, Layers 
} from "@mui/icons-material";

const SIDEBAR_WIDTH_OPEN = 260;
const SIDEBAR_WIDTH_COLLAPSED = 70;

export function Sidebar({ 
    open, 
    handleDrawerToggle, 
    isCollapsed, 
    handleSidebarCollapse 
}) {
    const location = useLocation();
    const [mastersOpen, setMastersOpen] = useState(true);

    const toggleMasters = (e) => {
        e.stopPropagation();
        setMastersOpen(!mastersOpen);
    };

    const isSelected = (path) => location.pathname === path;

    const masterItems = [
        { title: "Asset Categories", path: "/asset-categories", icon: <Category fontSize="small" /> },
        { title: "Locations", path: "/locations", icon: <Room fontSize="small" /> },
        { title: "Departments", path: "/departments", icon: <Business fontSize="small" /> },
        { title: "Designations", path: "/designations", icon: <BusinessCenter fontSize="small" /> },
        { title: "Employees", path: "/employees", icon: <People fontSize="small" /> },
        { title: "Assets", path: "/assets", icon: <Devices fontSize="small" /> },
    ];

    const drawerContent = (
        <Box display="flex" flexDirection="column" height="100%">
            {/* Toolbar spacer / Header */}
            <Box 
                sx={{ 
                    height: 64, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: isCollapsed ? "center" : "space-between", 
                    px: isCollapsed ? 1 : 2.5,
                    borderBottom: "1px solid",
                    borderColor: "divider"
                }}
            >
                {!isCollapsed && (
                    <Box display="flex" alignItems="center" gap={1}>
                        <Layers sx={{ color: "primary.main" }} />
                        <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>ENTERPRISE ASSETS</span>
                    </Box>
                )}
                {/* Desktop Collapse Arrow */}
                <IconButton 
                    onClick={handleSidebarCollapse} 
                    sx={{ display: { xs: "none", md: "inline-flex" } }}
                    size="small"
                >
                    {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                </IconButton>
            </Box>

            <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
                {/* Dashboard */}
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                        component={Link}
                        to="/dashboard"
                        selected={isSelected("/dashboard")}
                        sx={{
                            borderRadius: 2,
                            px: isCollapsed ? 1.5 : 2,
                            justifyContent: isCollapsed ? "center" : "initial",
                            "&.Mui-selected": {
                                backgroundColor: "primary.main",
                                color: "primary.contrastText",
                                "& .MuiListItemIcon-root": { color: "primary.contrastText" }
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: isCollapsed ? 0 : 2, justifyContent: "center", color: isSelected("/dashboard") ? "inherit" : "text.secondary" }}>
                            <Dashboard />
                        </ListItemIcon>
                        {!isCollapsed && <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600 }} />}
                    </ListItemButton>
                </ListItem>

                {/* Master Data Header / Nested Group */}
                <ListItem disablePadding sx={{ display: "block", mb: 0.5 }}>
                    <ListItemButton
                        onClick={toggleMasters}
                        sx={{
                            borderRadius: 2,
                            px: isCollapsed ? 1.5 : 2,
                            justifyContent: isCollapsed ? "center" : "initial",
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: isCollapsed ? 0 : 2, justifyContent: "center", color: "text.secondary" }}>
                            <Layers />
                        </ListItemIcon>
                        {!isCollapsed && (
                            <>
                                <ListItemText primary="Master Registry" primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600 }} />
                                {mastersOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </>
                        )}
                    </ListItemButton>
                    
                    {/* Collapsed items or Nested List */}
                    {!isCollapsed ? (
                        <Collapse in={mastersOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ pl: 2, mt: 0.5 }}>
                                {masterItems.map((item) => (
                                    <ListItemButton
                                        key={item.title}
                                        component={Link}
                                        to={item.path}
                                        selected={isSelected(item.path)}
                                        sx={{
                                            borderRadius: 2,
                                            mb: 0.5,
                                            "&.Mui-selected": {
                                                backgroundColor: "rgba(99, 102, 241, 0.12)",
                                                color: "primary.main",
                                                "& .MuiListItemIcon-root": { color: "primary.main" }
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: isSelected(item.path) ? "inherit" : "text.secondary" }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText primary={item.title} primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 550 }} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>
                    ) : (
                        // If sidebar collapsed, we can show a divider or allow sub-clicks
                        <Divider sx={{ my: 1 }} />
                    )}
                </ListItem>

                {/* Nested Masters in collapsed state */}
                {isCollapsed && masterItems.map((item) => (
                    <ListItem disablePadding sx={{ mb: 0.5 }} key={item.title}>
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={isSelected(item.path)}
                            sx={{
                                borderRadius: 2,
                                px: 1.5,
                                justifyContent: "center",
                                "&.Mui-selected": {
                                    backgroundColor: "rgba(99, 102, 241, 0.12)",
                                    color: "primary.main",
                                    "& .MuiListItemIcon-root": { color: "primary.main" }
                                }
                            }}
                            title={item.title}
                        >
                            <ListItemIcon sx={{ minWidth: 0, color: isSelected(item.path) ? "inherit" : "text.secondary" }}>
                                {item.icon}
                            </ListItemIcon>
                        </ListItemButton>
                    </ListItem>
                ))}

                {/* Reports */}
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                        component={Link}
                        to="/reports"
                        selected={isSelected("/reports")}
                        sx={{
                            borderRadius: 2,
                            px: isCollapsed ? 1.5 : 2,
                            justifyContent: isCollapsed ? "center" : "initial",
                            "&.Mui-selected": {
                                backgroundColor: "primary.main",
                                color: "primary.contrastText",
                                "& .MuiListItemIcon-root": { color: "primary.contrastText" }
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: isCollapsed ? 0 : 2, justifyContent: "center", color: isSelected("/reports") ? "inherit" : "text.secondary" }}>
                            <Assessment />
                        </ListItemIcon>
                        {!isCollapsed && <ListItemText primary="Reports" primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600 }} />}
                    </ListItemButton>
                </ListItem>

                {/* Settings */}
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                        component={Link}
                        to="/settings"
                        selected={isSelected("/settings")}
                        sx={{
                            borderRadius: 2,
                            px: isCollapsed ? 1.5 : 2,
                            justifyContent: isCollapsed ? "center" : "initial",
                            "&.Mui-selected": {
                                backgroundColor: "primary.main",
                                color: "primary.contrastText",
                                "& .MuiListItemIcon-root": { color: "primary.contrastText" }
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: isCollapsed ? 0 : 2, justifyContent: "center", color: isSelected("/settings") ? "inherit" : "text.secondary" }}>
                            <Settings />
                        </ListItemIcon>
                        {!isCollapsed && <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600 }} />}
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{
                width: { md: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN },
                flexShrink: { md: 0 },
                transition: "width 0.2s ease-in-out"
            }}
        >
            {/* Mobile Navigation Drawer */}
            <Drawer
                variant="temporary"
                open={open}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }} // Better open performance on mobile
                sx={{
                    display: { xs: "block", md: "none" },
                    "& .MuiDrawer-paper": {
                        boxSizing: "border-box",
                        width: SIDEBAR_WIDTH_OPEN,
                        backgroundColor: (theme) => theme.palette.background.paper,
                        backgroundImage: "none",
                        borderRight: "1px solid",
                        borderColor: "divider"
                    }
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Navigation Permanent Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: "none", md: "block" },
                    "& .MuiDrawer-paper": {
                        boxSizing: "border-box",
                        width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN,
                        transition: "width 0.2s ease-in-out",
                        backgroundColor: (theme) => theme.palette.background.paper,
                        backgroundImage: "none",
                        borderRight: "1px solid",
                        borderColor: "divider",
                        overflowX: "hidden"
                    }
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}

export default Sidebar;