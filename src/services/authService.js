import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile
} from "firebase/auth";

import {
    doc,
    getDoc,
    setDoc
} from "firebase/firestore";

import {
    auth,
    db
} from "../config/firebase";





const authService = {


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


            await updateProfile(
                user,
                data
            );


        }


    }


};



export default authService;