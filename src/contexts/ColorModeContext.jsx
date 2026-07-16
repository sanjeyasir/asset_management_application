import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "../themes/theme";

const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: "dark" });

export function ColorModeProvider({ children }) {
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem("cloud_erp_theme_mode");
        return savedMode === "light" ? "light" : "dark"; // Default to dark mode matching original design
    });

    const colorMode = useMemo(
        () => ({
            mode,
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const nextMode = prevMode === "light" ? "dark" : "light";
                    localStorage.setItem("cloud_erp_theme_mode", nextMode);
                    return nextMode;
                });
            },
        }),
        [mode]
    );

    const theme = useMemo(() => getTheme(mode), [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export const useColorMode = () => useContext(ColorModeContext);
export default ColorModeContext;
