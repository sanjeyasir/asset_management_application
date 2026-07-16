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
import { useNotification } from "../../contexts/NotificationContext";


const navItems = [
    { title: "Dashboard", path: "/dashboard" },
    { title: "Asset Categories", path: "/asset-categories" },
    { title: "Locations", path: "/locations" },
    { title: "Departments", path: "/departments" },
    { title: "Designations", path: "/designations" },
    { title: "Employees", path: "/employees" },
    { title: "Assets", path: "/assets" }
];


function Navbar() {

    const navigate = useNavigate();
    const location = useLocation();

    const { currentUser } = useAuth();
    const { mode, toggleColorMode } = useColorMode();
    const { showNotification } = useNotification();


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
                            navItems.map(item => (

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
                    display="flex"
                    alignItems="center"
                    gap={1}
                >


                    {/* Theme Toggle */}

                    <IconButton
                        onClick={toggleColorMode}
                    >

                        {
                            mode === "dark"
                                ?
                                <Brightness7 />
                                :
                                <Brightness4 />
                        }

                    </IconButton>




                    {/* Profile */}

                    <IconButton
                        onClick={(e) =>
                            setProfileAnchor(e.currentTarget)
                        }
                    >

                        <Avatar
                            sx={{
                                width: 35,
                                height: 35,
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
                                mt: 1,
                                minWidth: 200,
                                borderRadius: 2
                            }
                        }}
                    >

                        <Box
                            px={2}
                            py={1}
                        >

                            <Typography
                                fontWeight={700}
                            >
                                {username}
                            </Typography>


                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Administrator
                            </Typography>


                        </Box>


                        <Divider />


                        <MenuItem>

                            <Person
                                sx={{
                                    mr: 1,
                                    fontSize: 18
                                }}
                            />

                            Profile

                        </MenuItem>



                        <MenuItem
                            onClick={logout}
                            sx={{
                                color: "error.main"
                            }}
                        >

                            <Logout
                                sx={{
                                    mr: 1,
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