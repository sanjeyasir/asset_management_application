import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword
} from "firebase/auth";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    addDoc
} from "firebase/firestore";
import axios from "axios";

import {
    auth,
    db
} from "../config/firebase";





const authService = {


    changePasswordOnFirstLogin: async (user, newPassword) => {
        try {
            await updatePassword(user, newPassword);
            
            // Find the employee document by email and update isFirstLogin to false
            const empQuery = query(
                collection(db, "employees"),
                where("email", "==", user.email.toLowerCase())
            );
            const empSnap = await getDocs(empQuery);
            if (!empSnap.empty) {
                const empDocRef = doc(db, "employees", empSnap.docs[0].id);
                await updateDoc(empDocRef, {
                    isFirstLogin: false,
                    updatedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error("Error updating first-time password:", error);
            throw error;
        }
    },


    login: async (email, password) => {

        try {

            // Firebase authentication
            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user = userCredential.user;







            return user;



        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            throw error;

        }

    },





    logout: async () => {


        try {


            const user = auth.currentUser;


            if (user) {







            }



            await signOut(auth);



        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            throw error;

        }


    },




    sendPasswordReset: async (email) => {


        await sendPasswordResetEmail(
            auth,
            email
        );


    },





    getUserProfile: async (uid) => {


        const snapshot =
            await getDoc(
                doc(db, "users", uid)
            );


        return snapshot.exists()
            ? snapshot.data()
            : null;


    },




    updateUserProfile: async (uid, data) => {


        const userRef =
            doc(db, "users", uid);


        await setDoc(

            userRef,

            {

                ...data,

                updatedAt:
                    new Date().toISOString()

            },

            {
                merge: true
            }

        );


        const user =
            auth.currentUser;


        if (user) {

            const profileUpdate = {};
            if (data.displayName !== undefined) profileUpdate.displayName = data.displayName;
            if (data.photoURL !== undefined) profileUpdate.photoURL = data.photoURL;

            if (Object.keys(profileUpdate).length > 0) {
                await updateProfile(
                    user,
                    profileUpdate
                );
            }

        }


    },

    submitResetRequest: async (email) => {
        try {
            const emailLower = email.toLowerCase();
            // Check if employee exists in firestore
            const empQ = query(
                collection(db, "employees"),
                where("email", "==", emailLower)
            );
            const empSnap = await getDocs(empQ);
            if (empSnap.empty) {
                throw new Error("No registered employee found with this email address.");
            }

            const empDoc = empSnap.docs[0];
            const empData = empDoc.data();

            // Create a pending request
            const resetPayload = {
                email: emailLower,
                employeeId: empDoc.id,
                fullName: empData.fullName || `${empData.firstName || ""} ${empData.lastName || ""}`.trim(),
                status: "Pending", // "Pending" | "Approved" | "Rejected"
                requestedAt: new Date().toISOString()
            };

            await addDoc(collection(db, "passwordResetRequests"), resetPayload);
            return true;
        } catch (error) {
            console.error("Error submitting password reset request:", error);
            throw error;
        }
    },

    approveResetRequest: async (requestId, email, tempPassword) => {
        try {
            const emailLower = email.toLowerCase();

            // 1. Call Cloud Function resetUserPassword
            const FUNCTIONS_BASE_URL = import.meta.env?.VITE_FIREBASE_FUNCTIONS_URL || "https://us-central1-clouderp-system.cloudfunctions.net";
            await axios.post(`${FUNCTIONS_BASE_URL}/resetUserPassword`, {
                email: emailLower,
                tempPassword
            });

            // 2. Set isFirstLogin = true in employees collection
            const empQ = query(
                collection(db, "employees"),
                where("email", "==", emailLower)
            );
            const empSnap = await getDocs(empQ);
            if (!empSnap.empty) {
                const empDocRef = doc(db, "employees", empSnap.docs[0].id);
                await updateDoc(empDocRef, {
                    isFirstLogin: true,
                    updatedAt: new Date().toISOString()
                });
            }

            // 3. Update passwordResetRequests status to Approved
            const requestRef = doc(db, "passwordResetRequests", requestId);
            await updateDoc(requestRef, {
                status: "Approved",
                approvedAt: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error("Error approving password reset request:", error);
            throw error;
        }
    }


};



export default authService;