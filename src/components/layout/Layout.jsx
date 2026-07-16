import { Outlet } from "react-router-dom";
import { Box, Toolbar, Container } from "@mui/material";

import Navbar from "./Navbar";
import Footer from "./Footer";

export function Layout() {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                backgroundColor: "background.default"
            }}
        >
            <Navbar />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                {/* Spacer for the fixed appbar */}
                <Toolbar sx={{ minHeight: { xs: 56, md: 60 } }} />

                <Container 
                    maxWidth="xl" 
                    sx={{ 
                        flexGrow: 1, 
                        py: { xs: 2.5, md: 4 }, 
                        px: { xs: 2, sm: 3 },
                        display: "flex", 
                        flexDirection: "column",
                        gap: 3
                    }}
                >
                    <Box sx={{ flexGrow: 1 }}>
                        <Outlet />
                    </Box>
                    <Footer />
                </Container>
            </Box>
        </Box>
    );
}

export default Layout;