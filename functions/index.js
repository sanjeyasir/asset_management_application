const functions = require("firebase-functions");
const {Firestore} = require("@google-cloud/firestore");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp();
}



const db = new Firestore({

    projectId: "clouderp-system",

    databaseId: "test-erp"

});


let transporter;
const getTransporter = async () => {
    if (transporter) return transporter;
    try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        return transporter;
    } catch (err) {
        console.error("Failed to create Ethereal SMTP transporter, falling back to mock", err);
        return nodemailer.createTransport({
            jsonTransport: true
        });
    }
};



exports.createEmployee = functions.https.onRequest(
async(req,res)=>{


    if(req.method !== "POST"){

        return res.status(405).json({

            success:false,

            message:"Only POST allowed"

        });

    }


    try{


        const employee = req.body;


        const ref = await db
        .collection("employees")
        .add({

            firstName: employee.firstName,

            lastName: employee.lastName,

            email: employee.email,

            department: employee.department,

            designation:
            employee.designation || "",

            status:
            employee.status || "Active",

            createdAt:
            new Date()

        });



        return res.status(201).json({

            success:true,

            employeeId:ref.id

        });



    }
    catch(error){

        console.error(error);


        return res.status(500).json({

            success:false,

            message:error.message

        });

    }


});


exports.sendSystemEmail = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Only POST allowed"
        });
    }

    try {
        const { to, message, emailId } = req.body;

        if (!to || !message || !message.subject || !message.html) {
            return res.status(400).json({
                success: false,
                message: "Missing recipient (to) or message (subject/html)"
            });
        }

        const mailTransporter = await getTransporter();
        const info = await mailTransporter.sendMail({
            from: '"CloudERP Notifications" <noreply@clouderp-system.com>',
            to,
            subject: message.subject,
            html: message.html
        });

        console.log("Email sent successfully. Message ID: ", info.messageId);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("Ethereal Email Preview URL: ", previewUrl);
        }

        if (emailId) {
            await db.collection("emails").doc(emailId).update({
                status: "sent",
                sentAt: new Date().toISOString(),
                messageId: info.messageId,
                previewUrl: previewUrl || null
            });
        }

        return res.status(200).json({
            success: true,
            messageId: info.messageId,
            previewUrl: previewUrl || null
        });

    } catch (error) {
        console.error("Error in sendSystemEmail Cloud Function:", error);
        
        if (req.body.emailId) {
            try {
                await db.collection("emails").doc(req.body.emailId).update({
                    status: "failed",
                    failedAt: new Date().toISOString(),
                    error: error.message
                });
            } catch (updateErr) {
                console.error("Failed to update email doc status to failed:", updateErr);
            }
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


exports.resetUserPassword = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Only POST allowed"
        });
    }

    try {
        const { email, tempPassword } = req.body;
        if (!email || !tempPassword) {
            return res.status(400).json({
                success: false,
                message: "Missing email or temporary password"
            });
        }

        // Get user by email from Firebase Auth
        const userRecord = await admin.auth().getUserByEmail(email.toLowerCase());
        
        // Update user password using Admin SDK
        await admin.auth().updateUser(userRecord.uid, {
            password: tempPassword
        });

        return res.status(200).json({
            success: true,
            message: "Password reset successful"
        });
    } catch (error) {
        console.error("Error in resetUserPassword Cloud Function:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});