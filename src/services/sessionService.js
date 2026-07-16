import {
    collection,
    addDoc,
    doc,
    updateDoc,
    getDoc
} from "firebase/firestore";


import {
    db
} from "../config/firebase";



const COLLECTION = "sessions";


const TOKEN =
    "cloud_erp_session";



const sessionService = {



    createSession: async (uid, email) => {


        const session = {


            uid,

            email,


            createdAt:
                new Date().toISOString(),


            lastActiveAt:
                new Date().toISOString(),


            isActive: true,


            userAgent:
                window.navigator.userAgent


        };



        const ref =
            await addDoc(

                collection(
                    db,
                    COLLECTION
                ),

                session

            );



        localStorage.setItem(

            TOKEN,

            ref.id

        );


        return ref.id;


    },




    validateSession: async () => {

        const sessionId = localStorage.getItem(TOKEN);
        if (!sessionId) return null;

        try {
            const docRef = doc(db, COLLECTION, sessionId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return null;

            const sessionData = docSnap.data();
            const now = Date.now();
            const lastActive = new Date(sessionData.lastActiveAt).getTime();
            const threeHoursMs = 3 * 60 * 60 * 1000;

            if (!sessionData.isActive || (now - lastActive > threeHoursMs)) {
                localStorage.removeItem(TOKEN);
                return null;
            }

            return { id: docSnap.id, ...sessionData };
        } catch (error) {
            console.error("validateSession error:", error);
            return null;
        }

    },




    refreshSession: async () => {

        const sessionId = localStorage.getItem(TOKEN);
        if (!sessionId) return;

        try {
            await updateDoc(
                doc(db, COLLECTION, sessionId),
                {
                    lastActiveAt: new Date().toISOString()
                }
            );
        } catch (error) {
            console.warn("refreshSession error:", error);
        }

    },





    invalidateSession: async () => {


        const sessionId =
            localStorage.getItem(TOKEN);



        if (!sessionId)
            return;



        try {


            await updateDoc(

                doc(
                    db,
                    COLLECTION,
                    sessionId
                ),

                {

                    isActive: false,

                    logoutAt:
                        new Date().toISOString()

                }

            );


        } finally {


            localStorage.removeItem(
                TOKEN
            );


        }


    },




    getSessionId: () => {


        return localStorage.getItem(
            TOKEN
        );


    }



};



export default sessionService;