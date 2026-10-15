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

const WMO_CODES = {
    0: { condition: "Clear Sky", icon: "☀️" },
    1: { condition: "Mainly Clear", icon: "🌤️" },
    2: { condition: "Partly Cloudy", icon: "⛅" },
    3: { condition: "Overcast", icon: "☁️" },
    45: { condition: "Foggy", icon: "🌫️" },
    48: { condition: "Depositing Rime Fog", icon: "🌫️" },
    51: { condition: "Light Drizzle", icon: "🌦️" },
    53: { condition: "Moderate Drizzle", icon: "🌦️" },
    55: { condition: "Dense Drizzle", icon: "🌧️" },
    56: { condition: "Light Freezing Drizzle", icon: "🌧️" },
    57: { condition: "Dense Freezing Drizzle", icon: "🌧️" },
    61: { condition: "Slight Rain", icon: "🌦️" },
    63: { condition: "Moderate Rain", icon: "🌧️" },
    65: { condition: "Heavy Rain", icon: "🌧️" },
    66: { condition: "Light Freezing Rain", icon: "🌧️" },
    67: { condition: "Heavy Freezing Rain", icon: "🌧️" },
    71: { condition: "Slight Snowfall", icon: "🌨️" },
    73: { condition: "Moderate Snowfall", icon: "🌨️" },
    75: { condition: "Heavy Snowfall", icon: "❄️" },
    77: { condition: "Snow Grains", icon: "❄️" },
    80: { condition: "Slight Rain Showers", icon: "🌦️" },
    81: { condition: "Moderate Rain Showers", icon: "🌧️" },
    82: { condition: "Violent Rain Showers", icon: "⛈️" },
    85: { condition: "Slight Snow Showers", icon: "🌨️" },
    86: { condition: "Heavy Snow Showers", icon: "❄️" },
    95: { condition: "Thunderstorm", icon: "⛈️" },
    96: { condition: "Thunderstorm with Slight Hail", icon: "⛈️" },
    99: { condition: "Thunderstorm with Heavy Hail", icon: "⛈️" }
};

function parseRssFeed(xmlText, sourceName = "News") {
    const items = [];
    const itemRegex = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];

        const getTagContent = (tagName) => {
            const regex = new RegExp('<' + tagName + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + tagName + '>', 'i');
            const m = itemContent.match(regex);
            if (!m) return '';
            let val = m[1].trim();
            val = val.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
            val = val.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            val = val
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&apos;/g, "'")
                .replace(/&nbsp;/g, ' ')
                .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(dec));
            return val;
        };

        const title = getTagContent('title');
        let summary = getTagContent('description') || getTagContent('summary');
        let link = getTagContent('link');

        if (!link) {
            const linkMatch = itemContent.match(/<link[^>]*href=["']([^"']+)["']/i);
            if (linkMatch) link = linkMatch[1];
        }

        if (summary) {
            summary = summary.replace(/^By [^•]+ • /i, '');
            if (summary.length > 220) {
                summary = summary.slice(0, 217) + '...';
            }
        }

        if (title && !title.toLowerCase().includes("undefined")) {
            items.push({
                title: title.trim(),
                summary: summary ? summary.trim() : title.trim(),
                link: link ? link.trim() : '',
                source: sourceName
            });
        }
    }
    return items;
}

async function fetchOpenMeteoWeather(locationName = "Colombo, Sri Lanka") {
    let lat = 6.9271;
    let lon = 79.8612;
    let resolvedCity = "Colombo";

    try {
        const cleanName = locationName.split(',')[0].replace(/[^\w\s]/gi, '').trim();
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
                lat = geoData.results[0].latitude;
                lon = geoData.results[0].longitude;
                resolvedCity = geoData.results[0].name;
            }
        }
    } catch (e) {
        console.warn("Open-Meteo geocoding fallback to default coordinates:", e.message);
    }

    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(6000) });
        if (!weatherRes.ok) throw new Error(`Weather HTTP ${weatherRes.status}`);
        const data = await weatherRes.json();

        const current = data.current || {};
        const daily = data.daily || {};
        const codeInfo = WMO_CODES[current.weather_code] || { condition: "Partly Cloudy", icon: "⛅" };

        const tempC = Math.round(current.temperature_2m ?? 28);
        const humidity = Math.round(current.relative_humidity_2m ?? 75);
        const wind = Math.round(current.wind_speed_10m ?? 10);
        const maxTemp = Math.round(daily.temperature_2m_max?.[0] ?? tempC + 2);
        const minTemp = Math.round(daily.temperature_2m_min?.[0] ?? tempC - 3);

        return {
            temperature: `${tempC}°C`,
            condition: `${codeInfo.icon} ${codeInfo.condition}`,
            conditionText: codeInfo.condition,
            humidity: `${humidity}%`,
            wind: `${wind} km/h`,
            highLow: `${maxTemp}°C / ${minTemp}°C`,
            summary: `Expected ${codeInfo.condition.toLowerCase()} with temperatures ranging from ${minTemp}°C to ${maxTemp}°C, relative humidity at ${humidity}%, and wind speeds around ${wind} km/h in ${resolvedCity}.`,
            isRainy: [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(current.weather_code),
            rawTemp: tempC,
            rawHumidity: humidity,
            rawWind: wind
        };
    } catch (err) {
        console.error("Open-Meteo weather fetch error:", err.message);
        return {
            temperature: "28°C",
            condition: "⛅ Partly Cloudy",
            conditionText: "Partly Cloudy",
            humidity: "75%",
            wind: "12 km/h",
            highLow: "31°C / 25°C",
            summary: "Pleasant seasonal conditions with mild afternoon cloudiness.",
            isRainy: false,
            rawTemp: 28,
            rawHumidity: 75,
            rawWind: 12
        };
    }
}

async function fetchLocalNews(locationName = "Sri Lanka") {
    const feeds = [
        { url: 'https://island.lk/feed/', source: 'The Island' },
        { url: 'https://www.adaderana.lk/rss.php', source: 'Ada Derana' },
        { url: 'http://www.adaderana.lk/rss.php', source: 'Ada Derana' },
        { url: 'https://news.google.com/rss/headlines/section/geo/LK?hl=en-LK&gl=LK&ceid=LK:en', source: 'Google News (LK)' },
        { url: 'https://news.google.com/rss/search?q=Sri+Lanka', source: 'Google News (LK)' }
    ];

    const results = await Promise.allSettled(
        feeds.map(async (feed) => {
            const res = await fetch(feed.url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                signal: AbortSignal.timeout(10000)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const xml = await res.text();
            return parseRssFeed(xml, feed.source);
        })
    );

    let allItems = [];
    for (const r of results) {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            allItems = allItems.concat(r.value);
        }
    }

    const seen = new Set();
    const unique = [];
    for (const item of allItems) {
        const key = item.title.toLowerCase().slice(0, 35);
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
        }
    }

    return unique.slice(0, 6);
}

async function fetchInternationalNews() {
    const feeds = [
        { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World News' },
        { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
        { url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en&gl=US&ceid=US:en', source: 'World Wire' }
    ];

    const results = await Promise.allSettled(
        feeds.map(async (feed) => {
            const res = await fetch(feed.url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                signal: AbortSignal.timeout(7000)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const xml = await res.text();
            return parseRssFeed(xml, feed.source);
        })
    );

    let allItems = [];
    for (const r of results) {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            allItems = allItems.concat(r.value);
        }
    }

    const seen = new Set();
    const unique = [];
    for (const item of allItems) {
        const key = item.title.toLowerCase().slice(0, 35);
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
        }
    }

    return unique.slice(0, 6);
}

function generateOperationalInsights(weather, localNews, intlNews, locationName) {
    const insights = [];

    // Weather-driven operations and asset insights
    if (weather.isRainy) {
        insights.push(`Precipitation Forecast (${weather.conditionText}, ${weather.humidity} humidity): Reschedule outdoor asset inspections and site audits to dry intervals; verify moisture seals and waterproofing on vulnerable field equipment.`);
    } else if (weather.rawTemp >= 31) {
        insights.push(`Elevated Thermal Load (${weather.temperature}): Ensure HVAC cooling cycles and server room temperature regulators are monitored to maintain optimal operational performance.`);
    } else {
        insights.push(`Favorable Meteorological Outlook (${weather.temperature}, ${weather.conditionText}): Favorable window for transit dispatch, field asset deployments, and on-site facility audits across ${locationName}.`);
    }

    if (weather.rawWind >= 20) {
        insights.push(`Elevated Wind Velocity (${weather.wind}): Secure external building fixtures, temporary outdoor storage, and elevated signage against wind shear.`);
    }

    // Business & Logistical recommendations
    insights.push(`Logistics & Transit Coordination: Monitor local news updates and regional transport corridors for delivery schedule adjustments.`);
    insights.push(`Global Supply Chain Awareness: Review currency and commodity market indicators highlighted in today's international dispatches for procurement planning.`);

    return insights;
}

async function enrichWithGeminiIfAvailable(weather, localNews, intlNews, locationName, fallbackInsights) {
    const apiKey = process.env.GEMINI_API_KEY;
    // Only attempt if API key looks valid (starts with standard Google AI Studio prefix)
    if (!apiKey || !apiKey.startsWith("AIzaSy")) {
        return fallbackInsights;
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const prompt = `Based on this live weather: ${JSON.stringify(weather)} and top headlines: ${JSON.stringify([...localNews, ...intlNews].map(n => n.title))}, provide 3 concise, highly actionable business/logistical recommendations for an enterprise in ${locationName}. Return raw JSON array of strings only.`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            }),
            signal: AbortSignal.timeout(4000)
        });

        if (response.ok) {
            const data = await response.json();
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                if (text.includes("```json")) text = text.split("```json")[1].split("```")[0].trim();
                else if (text.includes("```")) text = text.split("```")[1].split("```")[0].trim();
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        }
    } catch (err) {
        console.warn("Gemini optional enrichment skipped, using open-source insights:", err.message);
    }
    return fallbackInsights;
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
    const localNews = data.localNews || [];
    const intlNews = data.intlNews || [];
    const fallbackNews = data.news || [];
    const insights = data.insights || [];

    const renderNewsCards = (list, badgeColor = "#1e3c72") => {
        if (!list || list.length === 0) {
            return `<p style="font-size: 13px; color: #718096; font-style: italic; margin-bottom: 20px;">No updates currently available in this category.</p>`;
        }
        return list.map((item, idx) => `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <tr>
                    <td style="width: 42px; background-color: ${badgeColor}; color: #ffffff; font-size: 15px; font-weight: 700; text-align: center; vertical-align: top; padding: 14px 0;">
                        ${idx + 1}
                    </td>
                    <td style="padding: 12px 16px; vertical-align: top;">
                        <div style="margin-bottom: 6px;">
                            ${item.source ? `<span style="display: inline-block; background-color: #edf2f7; color: #4a5568; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;">${item.source}</span>` : ''}
                        </div>
                        <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #1a202c; line-height: 1.4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                            ${item.title}
                        </h3>
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #4a5568; line-height: 1.5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                            ${item.summary}
                        </p>
                        ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #2a5298; font-weight: 600; text-decoration: none; display: inline-block;">Read full story &rarr;</a>` : ''}
                    </td>
                </tr>
            </table>
        `).join('');
    };

    const insightsHtml = insights.length > 0 ? `
        <h2 class="section-title">Actionable Logistics & Operations Insights</h2>
        <div style="background-color: #f0fdf4; border-radius: 10px; padding: 18px 20px; margin-bottom: 25px; border: 1px solid #bbf7d0;">
            <ul style="margin: 0; padding-left: 18px; color: #166534; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; line-height: 1.6;">
                ${insights.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudERP Daily Intelligence & News Digest</title>
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
            max-width: 620px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #e1e8ed;
        }
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #ffffff;
            padding: 30px 25px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 6px 0 0 0;
            font-size: 13px;
            opacity: 0.9;
        }
        .content {
            padding: 25px 22px;
        }
        .section-title {
            color: #1e3c72;
            font-size: 16px;
            font-weight: 700;
            margin-top: 25px;
            margin-bottom: 14px;
            border-bottom: 2px solid #eef2f5;
            padding-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section-title:first-of-type {
            margin-top: 0;
        }
        .weather-card {
            background-color: #ebf3fc;
            border-radius: 10px;
            padding: 18px 20px;
            margin-bottom: 25px;
            border: 1px solid #d0e1f9;
        }
        .weather-grid {
            width: 100%;
            border-collapse: collapse;
        }
        .weather-grid td {
            padding: 6px 0;
            font-size: 13px;
            border-bottom: 1px solid #d8e5f5;
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
            margin-top: 10px;
            font-size: 12px;
            color: #4a5568;
            font-style: italic;
            border-top: 1px dashed #c0d5f0;
            padding-top: 8px;
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
            <h1>CloudERP Daily Intelligence Digest</h1>
            <p>Personalized for ${locationName} &bull; ${formattedDate}</p>
        </div>
        <div class="content">
            <h2 class="section-title">Live Weather Overview</h2>
            <div class="weather-card">
                <table style="width: 100%; margin-bottom: 12px; border-collapse: collapse;">
                    <tr>
                        <td style="font-size: 34px; font-weight: 700; color: #1e3c72; width: 45%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0;">${weather.temperature || 'N/A'}</td>
                        <td style="font-size: 15px; font-weight: 600; color: #2c3e50; text-align: right; vertical-align: middle; width: 55%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0;">${weather.condition || 'N/A'}</td>
                    </tr>
                </table>
                <table class="weather-grid">
                    <tr>
                        <td class="weather-label">Forecast High / Low</td>
                        <td class="weather-val">${weather.highLow || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="weather-label">Relative Humidity</td>
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

            ${(localNews.length > 0 || intlNews.length > 0) ? `
                <h2 class="section-title">Local & National Headlines (${locationName})</h2>
                ${renderNewsCards(localNews, "#1e3c72")}

                <h2 class="section-title">International & World Affairs</h2>
                ${renderNewsCards(intlNews, "#2a5298")}
            ` : `
                <h2 class="section-title">Top Daily Headlines</h2>
                ${renderNewsCards(fallbackNews, "#1e3c72")}
            `}
        </div>
        <div class="footer">
            <p>Automated intelligence report powered by open-source meteorological data and syndicated public feeds.</p>
            <p>&copy; ${new Date().getFullYear()} CloudERP System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}

async function generateAndSendNews(targetEmail) {
    let locationName = "Colombo, Sri Lanka";
    const recipient = targetEmail || process.env.DIGEST_RECIPIENT_EMAIL || "sanjeyasir@gmail.com";

    try {
        // Query locations from firestore to customize digest location
        const locSnap = await db.collection("locations").get();
        if (!locSnap.empty) {
            const activeLocs = [];
            locSnap.forEach(d => {
                const lData = d.data();
                if (lData.active && lData.name) {
                    activeLocs.push(lData.name);
                }
            });
            const realLocs = activeLocs.filter(name => !["Headquarters", "Branch Office", "Remote"].includes(name));
            if (realLocs.length > 0) {
                locationName = realLocs[0];
            } else if (activeLocs.length > 0) {
                locationName = activeLocs[0];
            }
        }
    } catch (err) {
        console.warn("Could not retrieve active locations from Firestore, using default:", err.message);
    }

    try {
        console.log(`Aggregating weather and news data for ${locationName}...`);

        // Concurrent open-source data fetching
        const [weather, localNews, intlNews] = await Promise.all([
            fetchOpenMeteoWeather(locationName),
            fetchLocalNews(locationName),
            fetchInternationalNews()
        ]);

        // Generate contextual operational insights
        const baseInsights = generateOperationalInsights(weather, localNews, intlNews, locationName);
        const insights = await enrichWithGeminiIfAvailable(weather, localNews, intlNews, locationName, baseInsights);

        const digestData = {
            weather,
            localNews,
            intlNews,
            insights
        };

        const htmlContent = getNewsDigestHtml(locationName, digestData);
        const mailTransporter = await getTransporter();
        const subject = `CloudERP Daily Digest (${locationName}) - ${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' })}`;

        const info = await mailTransporter.sendMail({
            from: '"CloudERP Daily Intelligence" <onboarding@resend.dev>',
            to: recipient,
            subject,
            html: htmlContent
        });

        console.log("Daily news digest sent successfully. Message ID:", info.messageId);

        try {
            await db.collection("emails").add({
                to: recipient,
                message: {
                    subject,
                    html: htmlContent
                },
                template: "scheduled_news",
                createdAt: new Date().toISOString(),
                status: "sent",
                messageId: info.messageId,
                location: locationName
            });
        } catch (dbErr) {
            console.warn("Could not log sent email to Firestore:", dbErr.message);
        }

        return {
            success: true,
            location: locationName,
            recipient,
            messageId: info.messageId,
            weather: weather.conditionText,
            localNewsCount: localNews.length,
            intlNewsCount: intlNews.length
        };

    } catch (error) {
        console.error("Error in generateAndSendNews, attempting fallback notification:", error);

        try {
            const fallbackHtml = getFallbackHtml(locationName, error.message);
            const mailTransporter = await getTransporter();
            const subject = `CloudERP News Digest (Service Notice) - ${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' })}`;

            const info = await mailTransporter.sendMail({
                from: '"CloudERP Daily Intelligence" <onboarding@resend.dev>',
                to: recipient,
                subject,
                html: fallbackHtml
            });

            console.log("Fallback service notice email sent. Message ID:", info.messageId);

            await db.collection("emails").add({
                to: recipient,
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
            console.error("Failed to send fallback notice email:", fallbackError);
            try {
                await db.collection("emails").add({
                    to: recipient,
                    message: {
                        subject: "CloudERP News Digest Failed",
                        html: `<p>Failed to generate daily news digest: ${error.message}</p>`
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
        throw error;
    }
}

// HTTP trigger for testing or on-demand digest generation
exports.triggerNewsDigest = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    try {
        const targetEmail = req.query.email || req.body?.email;
        const result = await generateAndSendNews(targetEmail);
        return res.status(200).json({
            success: true,
            message: "News digest triggered and sent successfully",
            data: result
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

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