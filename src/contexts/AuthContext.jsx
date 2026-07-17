import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    onAuthStateChanged
} from "firebase/auth";

import { auth, db } from "../config/firebase";
import authService from "../services/authService";
import sessionService from "../services/sessionService";
import { collection, getDocs, query, where } from "firebase/firestore";


const AuthContext = createContext();


export function AuthProvider({ children }) {


    const [currentUser, setCurrentUser] = useState(null);

    const [loading, setLoading] = useState(true);

    const completeFirstLogin = () => {
        if (currentUser) {
            setCurrentUser((prev) => (prev ? { ...prev, isFirstLogin: false } : null));
        }
    };



    useEffect(() => {


        const unsubscribe =
            onAuthStateChanged(
                auth,
                async (user) => {

                    if (user) {
                        try {
                            // Ensure session is created immediately on login
                            let sessionId = sessionService.getSessionId();
                            if (!sessionId) {
                                await sessionService.createSession(user.uid, user.email.toLowerCase());
                            }

                            // Query employee record by email
                            const empQuery = query(
                                collection(db, "employees"),
                                where("email", "==", user.email.toLowerCase())
                            );
                            const empSnap = await getDocs(empQuery);

                            if (!empSnap.empty) {
                                const empDoc = empSnap.docs[0];
                                const empData = empDoc.data();
                                user.employeeId = empDoc.id;
                                user.role = user.email.toLowerCase() === "admin@gmail.com" ? "Admin" : (empData.role || "Employee");
                                user.isFirstLogin = empData.isFirstLogin !== false;
                            } else {
                                if (user.email.toLowerCase() === "admin@gmail.com" || user.email.toLowerCase().includes("admin")) {
                                    user.role = "Admin";
                                } else {
                                    user.role = "Employee";
                                }
                                user.isFirstLogin = false;
                            }
                        } catch (err) {
                            console.error("Error loading user from employees database:", err);
                            user.role = "Employee";
                            user.isFirstLogin = false; // Fallback
                        }
                    }

                    setCurrentUser(user);

                    setLoading(false);

                }
            );


        return unsubscribe;


    }, []);



    return (

        <AuthContext.Provider

            value={{
                currentUser,
                loading,
                completeFirstLogin
            }}

        >

            {children}

        </AuthContext.Provider>

    );

}



export const useAuth = () => useContext(AuthContext);