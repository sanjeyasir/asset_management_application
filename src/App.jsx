import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";

import { getTheme } from "./themes/theme";

import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { seedDatabase } from "./services/seedService";

import AppRoutes from "./routes/AppRoutes";


function App() {

    const theme = getTheme("light");

    useEffect(() => {
        // Silently trigger db seeding check
        seedDatabase();
    }, []);


    return (

        <ThemeProvider theme={theme}>

            <CssBaseline />


            <BrowserRouter>

                <AuthProvider>

                    <NotificationProvider>

                        <AppRoutes />

                    </NotificationProvider>

                </AuthProvider>


            </BrowserRouter>


        </ThemeProvider>

    );

}


export default App;