import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Box, Alert } from "@mui/material";


export function ProtectedRoute({ children }) {

    const { currentUser, loading } = useAuth();


    // Wait until Firebase checks auth state
    if (loading) {
        return null;
    }


    // Not logged in -> redirect to login
    if (!currentUser) {

        return <Navigate to="/" replace />;

    }

    // First time login - must reset password first
    if (currentUser.isFirstLogin) {

        return <Navigate to="/reset-password" replace />;

    }


    // Logged in and first login completed
    return children;

}

export function ResetPasswordRoute({ children }) {

    const { currentUser, loading } = useAuth();


    // Wait until Firebase checks auth state
    if (loading) {
        return null;
    }


    // Not logged in -> redirect to login
    if (!currentUser) {

        return <Navigate to="/" replace />;

    }

    // If already reset password, redirect to dashboard
    if (!currentUser.isFirstLogin) {

        return <Navigate to="/dashboard" replace />;

    }


    // Allowed to reset password
    return children;

}

export function PageAccessGuard({ children, allowedRoles }) {

    const { currentUser, loading } = useAuth();


    // Wait until Firebase checks auth state
    if (loading) {
        return null;
    }


    // Not logged in -> redirect to login
    if (!currentUser) {

        return <Navigate to="/" replace />;

    }

    // First time login - must reset password first
    if (currentUser.isFirstLogin) {

        return <Navigate to="/reset-password" replace />;

    }

    // Check role authorization on page level
    const userRole = currentUser.role || "Employee";
    if (!allowedRoles.includes(userRole)) {

        return (
            <Box sx={{ py: 3 }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Access Denied: You do not have permission to access this module.
                </Alert>
            </Box>
        );

    }


    // Authorized
    return children;

}


export default ProtectedRoute;