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
        transporter = nodemailer.createTransport({
            host: "smtp.resend.com",
            port: 465,
            secure: true,
            auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY
            }
        });
        return transporter;
    } catch (err) {
        console.error("Failed to create Resend SMTP transporter, falling back to mock", err);
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
            from: '"CloudERP Notifications" <onboarding@resend.dev>',
            to,
            subject: message.subject,
            html: message.html
        });

        console.log("Email sent successfully. Message ID: ", info.messageId);

        if (emailId) {
            await db.collection("emails").doc(emailId).update({
                status: "sent",
                sentAt: new Date().toISOString(),
                messageId: info.messageId
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


const { onSchedule } = require("firebase-functions/v2/scheduler");

async function generateAndSendNews() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    let locationName = "Chennai, India";

    try {
        // Get locations from firestore to customize news
        const locSnap = await db.collection("locations").get();
        if (!locSnap.empty) {
            const activeLocs = [];
            locSnap.forEach(d => {
                const lData = d.data();
                if (lData.active && lData.name) {
                    activeLocs.push(lData.name);
                }
            });
            // Filter out generic location names
            const realLocs = activeLocs.filter(name => !["Headquarters", "Branch Office", "Remote"].includes(name));
            if (realLocs.length > 0) {
                locationName = realLocs[0];
            } else if (activeLocs.length > 0) {
                locationName = activeLocs[0];
            }
        }
    } catch (err) {
        console.error("Failed to query locations collection, using default Chennai, India:", err);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const prompt = `Get the current weather and top 10 news for ${locationName}. 
Include current Sri Lankan affairs, local developments, and national news as well.
Format the output in a highly creative, responsive HTML email newsletter format suitable for sending to a user.
Include a greeting, weather dashboard section with current temperature, conditions, and high/low forecasts, a news section with the top 10 headlines with brief summaries, and other relevant local information or updates.
Use a professional, premium visual design (e.g., beautiful typography, consistent spacing, card-based layout, subtle shadows, and an elegant color scheme).
Ensure all styles are inlined or in a style tag.
Output ONLY the raw HTML (enclosed in <html> and </html>) with NO markdown formatting (do not wrap in \`\`\`html code blocks).`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        let htmlContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!htmlContent) {
            throw new Error("No newsletter HTML returned from Gemini API");
        }

        // Clean up code block wrappers if any
        if (htmlContent.includes("```html")) {
            htmlContent = htmlContent.split("```html")[1].split("```")[0].trim();
        } else if (htmlContent.includes("```")) {
            htmlContent = htmlContent.split("```")[1].split("```")[0].trim();
        }

        const mailTransporter = await getTransporter();
        const subject = `CloudERP News Digest - ${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' })}`;
        const info = await mailTransporter.sendMail({
            from: '"CloudERP Daily News" <onboarding@resend.dev>',
            to: "sanjeyasir@gmail.com",
            subject,
            html: htmlContent
        });

        console.log("Scheduled news sent successfully. Message ID: ", info.messageId);

        await db.collection("emails").add({
            to: "sanjeyasir@gmail.com",
            message: {
                subject,
                html: htmlContent
            },
            template: "scheduled_news",
            createdAt: new Date().toISOString(),
            status: "sent",
            messageId: info.messageId
        });

    } catch (error) {
        console.error("Error in sendScheduledNews Cloud Function:", error);
        
        try {
            await db.collection("emails").add({
                to: "sanjeyasir@gmail.com",
                message: {
                    subject: "CloudERP News Digest Failed",
                    html: `<p>Failed to generate daily news digest: ${error.message}</p>`
                },
                template: "scheduled_news",
                createdAt: new Date().toISOString(),
                status: "failed",
                error: error.message
            });
        } catch (updateErr) {
            console.error("Failed to write fail log to Firestore:", updateErr);
        }
    }
}

exports.sendScheduledNews = onSchedule(
    {
        schedule: "30 10 * * *",
        timeZone: "Asia/Colombo"
    },
    async (event) => {
        await generateAndSendNews();
    }
);

exports.sendScheduledNewsAfternoon = onSchedule(
    {
        schedule: "0 16 * * *",
        timeZone: "Asia/Colombo"
    },
    async (event) => {
        await generateAndSendNews();
    }
);