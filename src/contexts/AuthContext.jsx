import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Check Firestore users collection for role and profile info
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    let userDoc = await getDoc(userDocRef);

                    if (!userDoc.exists()) {
                        // If user doesn't exist in Firestore collection, create default user profile
                        const defaultProfile = {
                            email: firebaseUser.email,
                            role: firebaseUser.email.endsWith("@admin.com") || firebaseUser.email === "admin@clouderp.com" ? "Admin" : "User",
                            createdAt: new Date().toISOString(),
                            displayName: firebaseUser.displayName || firebaseUser.email.split("@")[0]
                        };
                        await setDoc(userDocRef, defaultProfile);
                        userDoc = await getDoc(userDocRef);
                    }

                    const profileData = userDoc.data();
                    
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        emailVerified: firebaseUser.emailVerified,
                        displayName: firebaseUser.displayName || profileData.displayName,
                        photoURL: firebaseUser.photoURL || profileData.photoURL || "",
                        role: profileData.role || "User",
                        ...profileData
                    });
                } catch (error) {
                    console.error("Error fetching user profile from Firestore:", error);
                    // Fail gracefully by setting standard role
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.email.split("@")[0],
                        role: "User"
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "Admin"
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
