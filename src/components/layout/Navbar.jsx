import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    Divider
} from "@mui/material";

import {
    Brightness4,
    Brightness7,
    Logout,
    Menu as MenuIcon,
    Person
} from "@mui/icons-material";

import { useAuth } from "../../contexts/AuthContext";
import { useColorMode } from "../../contexts/ColorModeContext";
import authService from "../../services/authService";
import sessionService from "../../services/sessionService";
import { useNotification } from "../../contexts/NotificationContext";


const navItems = [
    { title: "Dashboard", path: "/dashboard", roles: ["Admin", "Manager", "Employee"] },
    { title: "Asset Categories", path: "/asset-categories", roles: ["Admin", "Manager"] },
    { title: "Locations", path: "/locations", roles: ["Admin", "Manager"] },
    { title: "Departments", path: "/departments", roles: ["Admin"] },
    { title: "Designations", path: "/designations", roles: ["Admin"] },
    { title: "Employees", path: "/employees", roles: ["Admin"] },
    { title: "Assets", path: "/assets", roles: ["Admin", "Manager", "Employee"] }
];


function Navbar() {

    const navigate = useNavigate();
    const location = useLocation();

    const { currentUser } = useAuth();
    const { mode, toggleColorMode } = useColorMode();
    const { showNotification } = useNotification();

    const userRole = currentUser?.role || "Employee";
    const allowedNavItems = navItems.filter(item => item.roles.includes(userRole));


    const [menuAnchor, setMenuAnchor] = useState(null);
    const [profileAnchor, setProfileAnchor] = useState(null);



    const username =
        currentUser?.displayName ||
        currentUser?.email?.split("@")[0] ||
        "User";


    const initials =
        username
            .substring(0, 2)
            .toUpperCase();



    const logout = async () => {

        try {

            localStorage.setItem("cloud_erp_logout", "true");

            await sessionService.invalidateSession();

            await authService.logout();

            showNotification(
                "Logged out successfully",
                "success"
            );

            navigate("/");

        } catch {

            showNotification(
                "Logout failed",
                "error"
            );

        }

    };


    return (

        <AppBar
            position="fixed"
            elevation={1}
            color="inherit"
        >

            <Toolbar
                sx={{
                    justifyContent: "space-between"
                }}
            >


                {/* LEFT SIDE - MENU */}

                <Box
                    display="flex"
                    alignItems="center"
                >

                    <IconButton
                        onClick={(e) =>
                            setMenuAnchor(e.currentTarget)
                        }
                    >

                        <MenuIcon />

                    </IconButton>



                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() =>
                            setMenuAnchor(null)
                        }
                        PaperProps={{
                            sx: {
                                mt: 1,
                                minWidth: 220,
                                borderRadius: 2
                            }
                        }}
                    >

                        {
                            allowedNavItems.map(item => (

                                <MenuItem
                                    key={item.path}
                                    component={Link}
                                    to={item.path}
                                    selected={
                                        location.pathname === item.path
                                    }
                                    onClick={() =>
                                        setMenuAnchor(null)
                                    }
                                >

                                    {item.title}

                                </MenuItem>

                            ))
                        }

                    </Menu>


                </Box>





                {/* RIGHT SIDE */}

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 1.5
                    }}
                >

                    {/* Logged in label */}
                    <Box 
                        sx={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            alignItems: "flex-end",
                            justifyContent: "center",
                            pointerEvents: "none"
                        }}
                    >
                        <Typography variant="body2" fontWeight="700" sx={{ lineHeight: 1.2, m: 0 }}>
                            {username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ m: 0 }}>
                            Logged in as: {currentUser?.role || "Employee"}
                        </Typography>
                    </Box>

                    {/* Profile */}

                    <IconButton
                        onClick={(e) =>
                            setProfileAnchor(e.currentTarget)
                        }
                        sx={{ p: 0.5 }}
                    >

                        <Avatar
                            src={currentUser?.photoURL || ""}
                            sx={{
                                width: 38,
                                height: 38,
                                bgcolor: "primary.main",
                                fontWeight: 700
                            }}
                        >

                            {initials}

                        </Avatar>


                    </IconButton>




                    {/* Profile Dropdown */}

                    <Menu
                        anchorEl={profileAnchor}
                        open={Boolean(profileAnchor)}
                        onClose={() =>
                            setProfileAnchor(null)
                        }
                        PaperProps={{
                            sx: {
                                mt: 1.5,
                                minWidth: 180,
                                borderRadius: 3,
                                p: 1,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
                            }
                        }}
                    >

                        <MenuItem sx={{ py: 1.5, px: 2.5, borderRadius: 2 }}>

                            <Person
                                sx={{
                                    mr: 1.5,
                                    fontSize: 18,
                                    color: "text.secondary"
                                }}
                            />

                            Profile

                        </MenuItem>



                        <MenuItem
                            onClick={logout}
                            sx={{
                                color: "error.main",
                                py: 1.5,
                                px: 2.5,
                                borderRadius: 2
                            }}
                        >

                            <Logout
                                sx={{
                                    mr: 1.5,
                                    fontSize: 18
                                }}
                            />

                            Logout

                        </MenuItem>


                    </Menu>


                </Box>


            </Toolbar>

        </AppBar>

    );

}


export default Navbar;