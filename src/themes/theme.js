import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) => {
    const isDark = mode === "dark";
    
    return createTheme({
        palette: {
            mode,
            primary: {
                main: isDark ? "#6366f1" : "#4f46e5", // Indigo
                light: isDark ? "#818cf8" : "#6366f1",
                dark: isDark ? "#4f46e5" : "#3730a3",
                contrastText: "#ffffff",
            },
            secondary: {
                main: isDark ? "#06b6d4" : "#0891b2", // Cyan
                light: isDark ? "#22d3ee" : "#06b6d4",
                dark: isDark ? "#0891b2" : "#0e7490",
                contrastText: "#ffffff",
            },
            background: {
                default: isDark ? "#0a0f1d" : "#f8fafc", // Deep dark / Slate 50
                paper: isDark ? "#111827" : "#ffffff",   // Slate 900 / White
            },
            text: {
                primary: isDark ? "#f3f4f6" : "#0f172a", // Slate 900 / Light grey
                secondary: isDark ? "#9ca3af" : "#475569",
            },
            success: {
                main: isDark ? "#10b981" : "#059669", // Emerald
            },
            warning: {
                main: isDark ? "#f59e0b" : "#d97706", // Amber
            },
            error: {
                main: isDark ? "#ef4444" : "#dc2626", // Coral/Red
            },
            info: {
                main: isDark ? "#3b82f6" : "#2563eb", // Blue
            },
            divider: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
        },
        typography: {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            h1: { fontWeight: 800 },
            h2: { fontWeight: 800 },
            h3: { fontWeight: 700 },
            h4: { fontWeight: 700 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            subtitle1: { fontWeight: 500, fontSize: "1rem" },
            subtitle2: { fontWeight: 500, fontSize: "0.875rem" },
            body1: { fontSize: "0.95rem", lineHeight: 1.5 },
            body2: { fontSize: "0.85rem", lineHeight: 1.4 },
            button: { textTransform: "none", fontWeight: 600 },
        },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                        borderRadius: 16,
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
                        boxShadow: isDark 
                            ? "0 4px 20px 0 rgba(0, 0, 0, 0.25)"
                            : "0 4px 20px 0 rgba(148, 163, 184, 0.08)",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                            boxShadow: isDark 
                                ? "0 6px 30px 0 rgba(99, 102, 241, 0.15)"
                                : "0 6px 30px 0 rgba(79, 70, 229, 0.1)",
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        padding: "8px 20px",
                        fontWeight: 600,
                        transition: "all 0.2s ease-in-out",
                    },
                    containedPrimary: {
                        background: isDark 
                            ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)"
                            : "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
                        boxShadow: isDark 
                            ? "0 4px 14px 0 rgba(99, 102, 241, 0.3)"
                            : "0 4px 14px 0 rgba(79, 70, 229, 0.2)",
                        color: "#ffffff",
                        "&:hover": {
                            background: isDark 
                                ? "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)"
                                : "linear-gradient(135deg, #3730a3 0%, #1d4ed8 100%)",
                            boxShadow: isDark 
                                ? "0 6px 20px 0 rgba(99, 102, 241, 0.4)"
                                : "0 6px 20px 0 rgba(79, 70, 229, 0.3)",
                            transform: "translateY(-1px)",
                        },
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        backgroundColor: isDark ? "#1f2937" : "#f1f5f9",
                        transition: "all 0.2s ease-in-out",
                        "& fieldset": {
                            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
                        },
                        "&:hover fieldset": {
                            borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: isDark ? "#6366f1" : "#4f46e5",
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                    },
                    rounded: {
                        borderRadius: 16,
                    }
                }
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
                    },
                    head: {
                        fontWeight: 700,
                        backgroundColor: isDark ? "#1f2937" : "#f1f5f9",
                        color: isDark ? "#f3f4f6" : "#0f172a",
                    }
                }
            }
        },
    });
};
