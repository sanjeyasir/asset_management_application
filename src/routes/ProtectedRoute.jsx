import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


function ProtectedRoute({ children }) {

    const { currentUser, loading } = useAuth();


    // Wait until Firebase checks auth state
    if (loading) {
        return null;
    }


    // Not logged in
    if (!currentUser) {

        return <Navigate to="/" replace />;

    }


    // Logged in
    return children;

}


export default ProtectedRoute;