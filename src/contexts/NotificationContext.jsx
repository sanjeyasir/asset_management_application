import { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState("info"); // success, warning, error, info
    const [duration, setDuration] = useState(4000);

    const showNotification = useCallback((msg, type = "info", time = 4000) => {
        setMessage(msg);
        setSeverity(type);
        setDuration(time);
        setOpen(true);
    }, []);

    const handleClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpen(false);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={duration}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                sx={{ zIndex: 2000 }}
            >
                <Alert 
                    onClose={handleClose} 
                    severity={severity} 
                    variant="filled"
                    sx={{ 
                        width: "100%", 
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        fontWeight: 600
                    }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
}

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};
