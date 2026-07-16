import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";

const SessionContext = createContext();

const THREE_HOURS_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const THROTTLE_DELAY_MS = 5000; // Throttle activity updates to once every 5 seconds

export function SessionProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const { showNotification } = useNotification();
    const lastActivityRef = useRef(Date.now());
    const checkIntervalRef = useRef(null);

    // Save and retrieve activity from localStorage for multi-tab support
    const getStoredLastActivity = useCallback(() => {
        const stored = localStorage.getItem("cloud_erp_last_active");
        return stored ? parseInt(stored, 10) : Date.now();
    }, []);

    const setStoredLastActivity = useCallback((timestamp) => {
        localStorage.setItem("cloud_erp_last_active", timestamp.toString());
    }, []);

    const logoutExpiredSession = useCallback(async () => {
        try {
            await signOut(auth);
            // Clear local and session storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Set flag to show session expired snackbar upon redirecting/rendering login
            localStorage.setItem("cloud_erp_session_expired", "true");
            
            // Force redirect to login page
            window.location.href = "/";
        } catch (error) {
            console.error("Error signing out expired session:", error);
        }
    }, []);

    const resetSessionTimer = useCallback(() => {
        if (!isAuthenticated) return;
        
        const now = Date.now();
        // Throttle updates to local storage for performance
        if (now - lastActivityRef.current > THROTTLE_DELAY_MS) {
            lastActivityRef.current = now;
            setStoredLastActivity(now);
        }
    }, [isAuthenticated, setStoredLastActivity]);

    // Setup active listeners
    useEffect(() => {
        if (!isAuthenticated) {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
            return;
        }

        // Initialize last activity timestamp
        lastActivityRef.current = Date.now();
        setStoredLastActivity(lastActivityRef.current);

        const events = ["mousemove", "keydown", "click", "scroll"];
        
        const activityHandler = () => {
            resetSessionTimer();
        };

        events.forEach((event) => {
            window.addEventListener(event, activityHandler, { passive: true });
        });

        // Background checker every 10 seconds
        checkIntervalRef.current = setInterval(() => {
            const lastActive = getStoredLastActivity();
            const now = Date.now();
            
            if (now - lastActive >= THREE_HOURS_MS) {
                clearInterval(checkIntervalRef.current);
                logoutExpiredSession();
            }
        }, 10000);

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, activityHandler);
            });
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [isAuthenticated, resetSessionTimer, getStoredLastActivity, setStoredLastActivity, logoutExpiredSession]);

    // Handle showing expired notification if the flag exists on startup/login render
    useEffect(() => {
        if (localStorage.getItem("cloud_erp_session_expired") === "true") {
            localStorage.removeItem("cloud_erp_session_expired");
            // Small delay to ensure the UI is fully painted
            setTimeout(() => {
                showNotification("Your session has expired. Please login again.", "warning", 6000);
            }, 500);
        }
    }, [showNotification]);

    return (
        <SessionContext.Provider value={{ resetSessionTimer }}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => useContext(SessionContext);
