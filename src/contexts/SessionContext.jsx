import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useCallback,
    useState,
} from "react";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";
import sessionService from "../services/sessionService";

const SessionContext = createContext();

// ─── Constants ────────────────────────────────────────────────────────────────
/** How often the background checker polls Firestore for session validity (ms) */
const VALIDATION_INTERVAL_MS = 60 * 1000; // every 60 seconds

/** Minimum gap between activity-triggered Firestore refresh calls (ms) */
const REFRESH_THROTTLE_MS = 30 * 1000; // at most once every 30 seconds

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({ children }) {
    const { currentUser } = useAuth();
    const isAuthenticated = !!currentUser;
    const { showNotification } = useNotification();

    /** Whether the initial session validation is still in progress */
    const [sessionValidating, setSessionValidating] = useState(false);

    const lastRefreshRef = useRef(0);
    const validationIntervalRef = useRef(null);

    // ─── Logout (expired or force) ───────────────────────────────────────────

    const handleSessionExpiry = useCallback(async (showExpiredMessage = true) => {
        try {
            // Invalidate Firestore session record + clear local token
            await sessionService.invalidateSession();
            await signOut(auth);
        } catch (err) {
            console.error("[SessionContext] signOut error during expiry:", err);
        } finally {
            // Set flag so the Login page can show the expiry notification
            if (showExpiredMessage) {
                localStorage.setItem("cloud_erp_session_expired", "true");
            }
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/";
        }
    }, []);

    // ─── Periodic Firestore validation ───────────────────────────────────────

    const validateAndCheck = useCallback(async () => {
        if (!isAuthenticated) return;

        // Race condition guard: if user just logged in, session ID might not be in localStorage yet
        let sessionId = sessionService.getSessionId();
        if (!sessionId) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            sessionId = sessionService.getSessionId();
            if (!sessionId) {
                clearInterval(validationIntervalRef.current);
                await handleSessionExpiry(true);
                return;
            }
        }

        const session = await sessionService.validateSession();
        if (!session) {
            // Session is no longer valid in Firestore (expired or invalidated remotely)
            clearInterval(validationIntervalRef.current);
            await handleSessionExpiry(true);
        }
    }, [isAuthenticated, handleSessionExpiry]);

    // ─── Activity-triggered token refresh ────────────────────────────────────

    /**
     * Throttled refresh: extends the Firestore session's expiresAt on user activity.
     * Components or hooks can call this to signal the user is still active.
     */
    const resetSessionTimer = useCallback(async () => {
        if (!isAuthenticated) return;

        const now = Date.now();
        if (now - lastRefreshRef.current < REFRESH_THROTTLE_MS) return;

        lastRefreshRef.current = now;
        await sessionService.refreshSession();
    }, [isAuthenticated]);

    // ─── DOM activity listeners ───────────────────────────────────────────────

    useEffect(() => {
        if (!isAuthenticated) {
            clearInterval(validationIntervalRef.current);
            return;
        }

        const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];

        const activityHandler = () => {
            // Fire-and-forget — throttled inside resetSessionTimer
            resetSessionTimer();
        };

        activityEvents.forEach((event) =>
            window.addEventListener(event, activityHandler, { passive: true })
        );

        // Kick off periodic Firestore validation
        validationIntervalRef.current = setInterval(validateAndCheck, VALIDATION_INTERVAL_MS);

        // Run one immediate check when auth state settles
        validateAndCheck();

        return () => {
            activityEvents.forEach((event) =>
                window.removeEventListener(event, activityHandler)
            );
            clearInterval(validationIntervalRef.current);
        };
    }, [isAuthenticated, resetSessionTimer, validateAndCheck]);

    // ─── Session-expired notification on Login render ─────────────────────────

    useEffect(() => {
        if (localStorage.getItem("cloud_erp_session_expired") === "true") {
            localStorage.removeItem("cloud_erp_session_expired");
            setTimeout(() => {
                showNotification(
                    "Your session has expired. Please login again.",
                    "warning",
                    6000
                );
            }, 500);
        }
    }, [showNotification]);

    return (
        <SessionContext.Provider value={{ resetSessionTimer, sessionValidating }}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => useContext(SessionContext);
