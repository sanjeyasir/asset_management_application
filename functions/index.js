const functions = require("firebase-functions");
const { Firestore } = require("@google-cloud/firestore");
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
    async (req, res) => {


        if (req.method !== "POST") {

            return res.status(405).json({

                success: false,

                message: "Only POST allowed"

            });

        }


        try {


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

                success: true,

                employeeId: ref.id

            });



        }
        catch (error) {

            console.error(error);


            return res.status(500).json({

                success: false,

                message: error.message

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

function getFallbackHtml(locationName, errorMsg) {
    const formattedDate = new Date().toLocaleDateString('en-US', {
        timeZone: 'Asia/Colombo',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Colombo',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudERP Daily Digest - Service Notice</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
            color: #333333;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #e1e8ed;
        }
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px 25px;
        }
        .status-badge {
            display: inline-block;
            background-color: #ffeebc;
            color: #856404;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .alert-card {
            background-color: #fdf8e2;
            border-left: 4px solid #f0ad4e;
            padding: 15px 20px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 25px;
        }
        .alert-card p {
            margin: 0;
            font-size: 14px;
            color: #664d03;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .details-table th, .details-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eef2f5;
            font-size: 14px;
        }
        .details-table th {
            color: #6c757d;
            font-weight: 500;
            width: 35%;
        }
        .details-table td {
            color: #2c3e50;
            font-weight: 600;
        }
        .quick-links {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #e2e8f0;
        }
        .quick-links h3 {
            margin-top: 0;
            color: #1e3c72;
            font-size: 16px;
        }
        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 15px;
        }
        .btn {
            display: block;
            text-align: center;
            background-color: #ffffff;
            color: #2a5298;
            border: 1px solid #2a5298;
            padding: 10px 15px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn:hover {
            background-color: #2a5298;
            color: #ffffff;
        }
        .footer {
            background-color: #f8fafc;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #a0aec0;
            border-top: 1px solid #eef2f5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CloudERP Daily News Digest</h1>
            <p>Service Interruption Notice</p>
        </div>
        <div class="content">
            <span class="status-badge">API Service Degradation Detected</span>
            
            <div class="alert-card">
                <p><strong>Notice:</strong> Your AI-curated news digest and weather forecast could not be dynamically generated due to temporary traffic spikes/rate limiting on the Gemini API.</p>
            </div>

            <table class="details-table">
                <tr>
                    <th>Target Location</th>
                    <td>${locationName}</td>
                </tr>
                <tr>
                    <th>Date</th>
                    <td>${formattedDate}</td>
                </tr>
                <tr>
                    <th>Trigger Time</th>
                    <td>${formattedTime} (Asia/Colombo)</td>
                </tr>
                <tr>
                    <th>Technical Detail</th>
                    <td style="font-family: monospace; font-size: 12px; color: #dc3545; font-weight: normal; word-break: break-all;">
                        ${errorMsg || "Rate limit or connection spike"}
                    </td>
                </tr>
            </table>

            <div class="quick-links">
                <h3>Quick Information Access</h3>
                <p style="margin: 0 0 15px 0; font-size: 13px; color: #4a5568;">While we resolve the AI generation spike, you can quickly access weather and news updates for your configured location using the links below:</p>
                <div class="btn-group">
                    <a href="https://www.google.com/search?q=weather+in+${encodeURIComponent(locationName)}" class="btn" target="_blank">View Weather for ${locationName}</a>
                    <a href="https://news.google.com/search?q=${encodeURIComponent(locationName)}" class="btn" target="_blank">View News for ${locationName}</a>
                    <a href="https://news.google.com/search?q=Sri+Lanka" class="btn" target="_blank">View Sri Lanka National News</a>
                </div>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated system notification from CloudERP.</p>
            <p>&copy; ${new Date().getFullYear()} CloudERP. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}

function getNewsDigestHtml(locationName, data) {
    const formattedDate = new Date().toLocaleDateString('en-US', {
        timeZone: 'Asia/Colombo',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const weather = data.weather || {};
    const news = data.news || [];
    const insights = data.insights || [];

    const newsCards = news.map((item, idx) => `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); overflow: hidden; background-color: #ffffff;">
            <tr>
                <td style="width: 45px; background-color: #1e3c72; color: #ffffff; font-size: 18px; font-weight: 700; text-align: center; vertical-align: middle; padding: 15px 0;">
                    ${idx + 1}
                </td>
                <td style="padding: 15px; vertical-align: top;">
                    <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1a202c; line-height: 1.4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${item.title}</h3>
                    <p style="margin: 0; font-size: 13px; color: #4a5568; line-height: 1.5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${item.summary}</p>
                </td>
            </tr>
        </table>
    `).join('');

    const insightsHtml = insights.length > 0 ? `
            <h2 class="section-title">Actionable Insights & Recommendations</h2>
            <div style="background-color: #f0fdf4; border-radius: 10px; padding: 20px; margin-bottom: 30px; border: 1px solid #bbf7d0;">
                <ul style="margin: 0; padding-left: 20px; color: #166534; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.6;">
                    ${insights.map(item => `<li style="margin-bottom: 10px;">${item}</li>`).join('')}
                </ul>
            </div>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudERP Daily News Digest</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
            color: #333333;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #e1e8ed;
        }
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #ffffff;
            padding: 35px 25px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px 25px;
        }
        .section-title {
            color: #1e3c72;
            font-size: 18px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 15px;
            border-bottom: 2px solid #eef2f5;
            padding-bottom: 8px;
        }
        .weather-card {
            background-color: #ebf3fc;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #d0e1f9;
        }
        .weather-grid {
            width: 100%;
            border-collapse: collapse;
        }
        .weather-grid td {
            padding: 8px 0;
            font-size: 13px;
            border-bottom: 1px solid #d0e1f9;
        }
        .weather-grid tr:last-child td {
            border-bottom: none;
        }
        .weather-label {
            color: #5c6a79;
            font-weight: 500;
        }
        .weather-val {
            text-align: right;
            font-weight: 600;
            color: #2c3e50;
        }
        .weather-summary {
            margin-top: 12px;
            font-size: 13px;
            color: #4a5568;
            font-style: italic;
        }
        .footer {
            background-color: #f8fafc;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #a0aec0;
            border-top: 1px solid #eef2f5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CloudERP Daily News Digest</h1>
            <p>Personalized for ${locationName} &bull; ${formattedDate}</p>
        </div>
        <div class="content">
            <h2 class="section-title">Local Weather Dashboard</h2>
            <div class="weather-card">
                <table style="width: 100%; margin-bottom: 15px; border-collapse: collapse;">
                    <tr>
                        <td style="font-size: 36px; font-weight: 700; color: #1e3c72; width: 50%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0;">${weather.temperature || 'N/A'}</td>
                        <td style="font-size: 16px; font-weight: 600; color: #2c3e50; text-align: right; vertical-align: middle; width: 50%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0;">${weather.condition || 'N/A'}</td>
                    </tr>
                </table>
                <table class="weather-grid">
                    <tr>
                        <td class="weather-label">High / Low Temperature</td>
                        <td class="weather-val">${weather.highLow || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="weather-label">Humidity</td>
                        <td class="weather-val">${weather.humidity || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="weather-label">Wind Speed</td>
                        <td class="weather-val">${weather.wind || 'N/A'}</td>
                    </tr>
                </table>
                ${weather.summary ? `<div class="weather-summary">"${weather.summary}"</div>` : ''}
            </div>

            ${insightsHtml}

            <h2 class="section-title">Top Daily Headlines</h2>
            <div style="margin-top: 15px;">
                ${newsCards}
            </div>
        </div>
        <div class="footer">
            <p>This is a scheduled automated newsletter service from CloudERP.</p>
            <p>&copy; ${new Date().getFullYear()} CloudERP. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}

async function generateAndSendNews() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    let locationName = "Colombo, Sri Lanka";

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
Provide a summary of the weather (temperature, condition, humidity, wind, highLow, and a brief description), a list of the top 10 news headlines with a brief summary for each, and a list of 3-4 actionable business/logistical insights or recommendations for users living/working in ${locationName} based on today's weather and news events.
You must return a JSON object matching this schema:
{
  "weather": {
    "temperature": "current temperature (e.g. 29°C)",
    "condition": "current weather condition (e.g. Partly Cloudy)",
    "humidity": "humidity percentage (e.g. 78%)",
    "wind": "wind speed (e.g. 12 km/h)",
    "highLow": "today's high and low forecast (e.g. 32°C / 26°C)",
    "summary": "a short sentence describing today's overall weather outlook"
  },
  "news": [
    {
      "title": "Headline of the news article",
      "summary": "Brief 1-2 sentence description of the news article"
    }
  ],
  "insights": [
    "An actionable logistical, operational, or business recommendation based on today's weather/news (e.g., 'Due to expected heavy rain, recommend scheduling outdoor site audits for the afternoon' or 'Market gains in tech stocks suggest a favorable window for reviewing asset budgets')"
  ]
}
Return only the raw JSON.`;

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
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
            throw new Error("No data returned from Gemini API");
        }

        // Clean up code block wrappers if any
        if (responseText.includes("```json")) {
            responseText = responseText.split("```json")[1].split("```")[0].trim();
        } else if (responseText.includes("```")) {
            responseText = responseText.split("```")[1].split("```")[0].trim();
        }

        const digestData = JSON.parse(responseText);
        const htmlContent = getNewsDigestHtml(locationName, digestData);

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
        console.error("Error in sendScheduledNews Cloud Function, sending fallback email:", error);

        try {
            const fallbackHtml = getFallbackHtml(locationName, error.message);
            const mailTransporter = await getTransporter();
            const subject = `CloudERP News Digest (API Service Notice) - ${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' })}`;

            const info = await mailTransporter.sendMail({
                from: '"CloudERP Daily News" <onboarding@resend.dev>',
                to: "sanjeyasir@gmail.com",
                subject,
                html: fallbackHtml
            });

            console.log("Fallback news email sent successfully. Message ID: ", info.messageId);

            await db.collection("emails").add({
                to: "sanjeyasir@gmail.com",
                message: {
                    subject,
                    html: fallbackHtml
                },
                template: "scheduled_news_fallback",
                createdAt: new Date().toISOString(),
                status: "sent_fallback",
                messageId: info.messageId,
                error: error.message
            });
        } catch (fallbackError) {
            console.error("Failed to send fallback email:", fallbackError);
            try {
                await db.collection("emails").add({
                    to: "sanjeyasir@gmail.com",
                    message: {
                        subject: "CloudERP News Digest Failed",
                        html: `<p>Failed to generate daily news digest and fallback failed: ${error.message}</p>`
                    },
                    template: "scheduled_news",
                    createdAt: new Date().toISOString(),
                    status: "failed",
                    error: error.message,
                    fallbackError: fallbackError.message
                });
            } catch (updateErr) {
                console.error("Failed to write fail log to Firestore:", updateErr);
            }
        }
    }
}

exports.sendScheduledNewsMorning = onSchedule(
    {
        schedule: "30 8 * * *",
        timeZone: "Asia/Colombo"
    },
    async (event) => {
        await generateAndSendNews();
    }
);

exports.sendScheduledNewsNoon = onSchedule(
    {
        schedule: "0 12 * * *",
        timeZone: "Asia/Colombo"
    },
    async (event) => {
        await generateAndSendNews();
    }
);

exports.sendScheduledNewsOnePM = onSchedule(
    {
        schedule: "0 13 * * *",
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

exports.sendScheduledNewsNight = onSchedule(
    {
        schedule: "0 22 * * *",
        timeZone: "Asia/Colombo"
    },
    async (event) => {
        await generateAndSendNews();
    }
);