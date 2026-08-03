import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "firebase/auth";

import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import sessionService from "../services/sessionService";

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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
                    setCurrentUser(user);
                } catch (err) {
                    console.error("Error loading user from employees database:", err);
                    user.role = "Employee";
                    user.isFirstLogin = false; // Fallback
                    setCurrentUser(user);
                }
            } else {
                // Check if an employee-only session is saved in localStorage
                const savedEmpId = localStorage.getItem("employeeLoginId");
                if (savedEmpId) {
                    try {
                        const empQuery = query(
                            collection(db, "employees"),
                            where("employeeId", "==", savedEmpId)
                        );
                        const empSnap = await getDocs(empQuery);
                        if (!empSnap.empty) {
                            const empDoc = empSnap.docs[0];
                            const empData = empDoc.data();
                            const mockUser = {
                                uid: empDoc.id,
                                email: empData.email,
                                role: empData.role || "Employee",
                                employeeId: empData.employeeId,
                                fullName: empData.fullName,
                                isFirstLogin: false,
                                isEmployeeOnlyLogin: true,
                                ...empData
                            };
                            setCurrentUser(mockUser);
                            setLoading(false);
                            return;
                        }
                    } catch (err) {
                        console.error("Error loading employee-only session:", err);
                    }
                }
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const emailLower = email.trim().toLowerCase();
            try {
                const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
                return userCredential.user;
            } catch (err) {
                if (
                    (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/invalid-email") &&
                    emailLower === "admin@gmail.com" &&
                    password === "admin123"
                ) {
                    console.log("Seeding test admin account...");
                    const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
                    const uid = userCredential.user.uid;
                    await setDoc(doc(db, "employees", uid), {
                        employeeId: "EMP-ADMIN",
                        firstName: "System",
                        lastName: "Admin",
                        fullName: "System Admin",
                        email: emailLower,
                        role: "Admin",
                        isFirstLogin: false,
                        status: "Active",
                        createdAt: new Date().toISOString()
                    });
                    return userCredential.user;
                }
                throw err;
            }
        } finally {
            setLoading(false);
        }
    };

    const loginWithEmployeeId = async (empId) => {
        setLoading(true);
        try {
            const cleanId = empId.trim().toUpperCase();
            const empQuery = query(
                collection(db, "employees"),
                where("employeeId", "==", cleanId)
            );
            const empSnap = await getDocs(empQuery);
            if (empSnap.empty) {
                throw new Error(`Employee ID "${cleanId}" not found in database.`);
            }

            const empDoc = empSnap.docs[0];
            const empData = empDoc.data();
            
            if (empData.status !== "Active") {
                throw new Error("Employee account is not active.");
            }

            const mockUser = {
                uid: empDoc.id,
                email: empData.email,
                role: empData.role || "Employee",
                employeeId: empData.employeeId,
                fullName: empData.fullName,
                isFirstLogin: false,
                isEmployeeOnlyLogin: true,
                ...empData
            };

            localStorage.setItem("employeeLoginId", cleanId);
            setCurrentUser(mockUser);
            return mockUser;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            localStorage.removeItem("employeeLoginId");
            await signOut(auth);
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                loading,
                completeFirstLogin,
                login,
                loginWithEmployeeId,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);