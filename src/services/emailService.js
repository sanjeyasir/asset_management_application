import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import axios from "axios";

// Cloud Function endpoint (configured via env variables if available)
const FUNCTIONS_BASE_URL = import.meta.env?.VITE_FIREBASE_FUNCTIONS_URL || "https://us-central1-clouderp-system.cloudfunctions.net";

/**
 * Standard Premium HTML wrapper for CloudERP transactional emails.
 */
const getEmailWrapperHtml = (title, subtitle, contentHtml) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
        .content h2 {
            margin-top: 0;
            color: #1e3c72;
            font-size: 20px;
            font-weight: 600;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .details-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eef2f5;
            font-size: 14px;
            vertical-align: middle;
        }
        .details-table tr:last-child td {
            border-bottom: none;
        }
        .details-label {
            color: #6c757d;
            font-weight: 500;
            width: 40%;
        }
        .details-value {
            color: #2c3e50;
            font-weight: 600;
            text-align: right;
        }
        .btn-container {
            text-align: center;
            margin: 25px 0;
        }
        .btn {
            display: inline-block;
            background-color: #2a5298;
            color: #ffffff !important;
            padding: 12px 25px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(42, 82, 152, 0.15);
            transition: background-color 0.2s ease;
        }
        .btn:hover {
            background-color: #1e3c72;
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
            <h1>${title}</h1>
            ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
        <div class="content">
            ${contentHtml}
        </div>
        <div class="footer">
            <p>This is an automated notification from CloudERP Assets & Operations.</p>
            <p>&copy; ${new Date().getFullYear()} CloudERP. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};

export const emailService = {
    /**
     * Send an email by adding it to a Firestore queue (e.g. for trigger-email extension)
     * or calling a custom Cloud Function.
     */
    sendEmail: async ({ to, subject, html, template, data }) => {
        try {
            const emailPayload = {
                to,
                message: {
                    subject,
                    html: html || `<h3>${subject}</h3><pre>${JSON.stringify(data, null, 2)}</pre>`
                },
                template,
                data,
                createdAt: new Date().toISOString(),
                status: "pending"
            };

            // Option 1: Queue in Firestore 'emails' collection (Trigger Email extension pattern)
            const docRef = await addDoc(collection(db, "emails"), emailPayload);

            // Option 2: Try to trigger Firebase Cloud Function via Axios
            try {
                await axios.post(`${FUNCTIONS_BASE_URL}/sendSystemEmail`, {
                    emailId: docRef.id,
                    ...emailPayload
                });
            } catch (fnErr) {
                // Fail silently since Firestore queuing acts as primary/backup transaction log
                console.warn("Cloud Function direct SMTP trigger skipped/failed; queued in Firestore instead:", fnErr.message);
            }

            return docRef.id;
        } catch (error) {
            console.error("Email service error:", error);
            // Don't crash user interactions for mail send failures
            return null;
        }
    },

    sendEmployeeCreated: async (employee) => {
        const subject = `Welcome to the Team, ${employee.firstName}!`;
        const contentHtml = `
            <h2>Account Created Successfully</h2>
            <p>Dear ${employee.firstName} ${employee.lastName},</p>
            <p>Welcome! Your employee profile has been created in the CloudERP Asset Management system.</p>
            <table class="details-table">
                <tr>
                    <td class="details-label">Employee ID</td>
                    <td class="details-value">${employee.employeeId}</td>
                </tr>
                <tr>
                    <td class="details-label">Department</td>
                    <td class="details-value">${employee.department}</td>
                </tr>
                <tr>
                    <td class="details-label">Designation</td>
                    <td class="details-value">${employee.designation || "N/A"}</td>
                </tr>
            </table>
            <p style="margin-top: 20px;">Best Regards,<br/>HR & Assets Operations Team</p>
        `;
        const html = getEmailWrapperHtml("CloudERP Welcome Portal", "New Employee Registration", contentHtml);
        return emailService.sendEmail({
            to: employee.email,
            subject,
            html,
            template: "employee_created",
            data: employee
        });
    },

    sendAssetCreatedNotification: async (asset, employee, recipientEmail) => {
        const subject = `New Asset Registered: ${asset.assetName} (${asset.assetNumber})`;
        const contentHtml = `
            <h2>New Asset Registration Acknowledgment</h2>
            <p>A new corporate asset has been successfully registered in the system:</p>
            <table class="details-table">
                <tr>
                    <td class="details-label">Asset Number</td>
                    <td class="details-value">${asset.assetNumber}</td>
                </tr>
                <tr>
                    <td class="details-label">Asset Name</td>
                    <td class="details-value">${asset.assetName}</td>
                </tr>
                <tr>
                    <td class="details-label">Serial Number</td>
                    <td class="details-value">${asset.serialNumber || "N/A"}</td>
                </tr>
                <tr>
                    <td class="details-label">Category</td>
                    <td class="details-value">${asset.category}</td>
                </tr>
                <tr>
                    <td class="details-label">Status</td>
                    <td class="details-value">${asset.status}</td>
                </tr>
                <tr>
                    <td class="details-label">Assigned To</td>
                    <td class="details-value">${employee ? `${employee.firstName} ${employee.lastName}` : "Unassigned"}</td>
                </tr>
                <tr>
                    <td class="details-label">Registration Date</td>
                    <td class="details-value">${new Date().toLocaleDateString()}</td>
                </tr>
            </table>
            <p style="margin-top: 20px;">Best Regards,<br/>Assets Management Team</p>
        `;
        const html = getEmailWrapperHtml("CloudERP Asset System", "Asset Inventory Acknowledgment", contentHtml);
        return emailService.sendEmail({
            to: recipientEmail || "sanjeyasir@gmail.com",
            subject,
            html,
            template: "asset_created",
            data: { asset, employee }
        });
    },

    sendAssetAssigned: async (asset, employee) => {
        const subject = `Asset Assigned: ${asset.assetName} (${asset.assetNumber})`;
        const contentHtml = `
            <h2>Asset Assignment Notification</h2>
            <p>Dear ${employee.firstName} ${employee.lastName},</p>
            <p>The following corporate asset has been assigned to you:</p>
            <table class="details-table">
                <tr>
                    <td class="details-label">Asset Number</td>
                    <td class="details-value">${asset.assetNumber}</td>
                </tr>
                <tr>
                    <td class="details-label">Asset Name</td>
                    <td class="details-value">${asset.assetName}</td>
                </tr>
                <tr>
                    <td class="details-label">Serial Number</td>
                    <td class="details-value">${asset.serialNumber || "N/A"}</td>
                </tr>
                <tr>
                    <td class="details-label">Category</td>
                    <td class="details-value">${asset.category}</td>
                </tr>
                <tr>
                    <td class="details-label">Assignment Date</td>
                    <td class="details-value">${new Date().toLocaleDateString()}</td>
                </tr>
            </table>
            <p style="margin-top: 15px;">Please inspect the asset and report any issues to IT support.</p>
            <p style="margin-top: 20px;">Best Regards,<br/>Assets Management Team</p>
        `;
        const html = getEmailWrapperHtml("CloudERP Asset Assignment", "IT Equipment Notification", contentHtml);
        return emailService.sendEmail({
            to: employee.email,
            subject,
            html,
            template: "asset_assigned",
            data: { asset, employee }
        });
    },

    sendAssetReturned: async (asset, employee) => {
        const subject = `Asset Returned: ${asset.assetName} (${asset.assetNumber})`;
        const contentHtml = `
            <h2>Asset Return Acknowledgment</h2>
            <p>Dear ${employee.firstName} ${employee.lastName},</p>
            <p>We acknowledge the return of the following asset:</p>
            <table class="details-table">
                <tr>
                    <td class="details-label">Asset Number</td>
                    <td class="details-value">${asset.assetNumber}</td>
                </tr>
                <tr>
                    <td class="details-label">Asset Name</td>
                    <td class="details-value">${asset.assetName}</td>
                </tr>
                <tr>
                    <td class="details-label">Return Date</td>
                    <td class="details-value">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                    <td class="details-label">Asset Status</td>
                    <td class="details-value">${asset.status}</td>
                </tr>
            </table>
            <p style="margin-top: 20px;">Best Regards,<br/>Assets Management Team</p>
        `;
        const html = getEmailWrapperHtml("CloudERP Asset Return", "Inventory Update Confirmation", contentHtml);
        return emailService.sendEmail({
            to: employee.email,
            subject,
            html,
            template: "asset_returned",
            data: { asset, employee }
        });
    },

    sendWarrantyReminder: async (asset, vendorEmail) => {
        const subject = `Warranty Expiry Warning: Asset ${asset.assetNumber}`;
        const contentHtml = `
            <h2>Warranty Expiration Alert</h2>
            <p>Attention Assets Admin,</p>
            <p>The warranty for the following asset is expiring soon:</p>
            <table class="details-table">
                <tr>
                    <td class="details-label">Asset Number</td>
                    <td class="details-value">${asset.assetNumber}</td>
                </tr>
                <tr>
                    <td class="details-label">Asset Name</td>
                    <td class="details-value">${asset.assetName}</td>
                </tr>
                <tr>
                    <td class="details-label">Vendor</td>
                    <td class="details-value">${asset.vendor || "N/A"}</td>
                </tr>
                <tr>
                    <td class="details-label">Warranty Expiry Date</td>
                    <td class="details-value" style="color: #dc3545; font-weight: bold;">${asset.warrantyExpiry}</td>
                </tr>
            </table>
            <p style="margin-top: 15px;">Please take necessary actions for extensions or review options.</p>
        `;
        const html = getEmailWrapperHtml("CloudERP Warranty Alert", "System Maintenance Warning", contentHtml);
        return emailService.sendEmail({
            to: vendorEmail || "admin@clouderp.com",
            subject,
            html,
            template: "warranty_reminder",
            data: { asset }
        });
    },

    sendPasswordResetLink: async (email, resetLink) => {
        const subject = "CloudERP Password Reset Request";
        const contentHtml = `
            <h2>Password Reset Instructions</h2>
            <p>A password reset was requested for your CloudERP account.</p>
            <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
            <div class="btn-container">
                <a href="${resetLink}" class="btn">Reset Password</a>
            </div>
            <p style="margin-top: 15px; font-size: 13px; color: #718096;">If you did not make this request, you can safely ignore this email.</p>
        `;
        const html = getEmailWrapperHtml("CloudERP Security Portal", "Account Access Support", contentHtml);
        return emailService.sendEmail({
            to: email,
            subject,
            html,
            template: "password_reset",
            data: { email, resetLink }
        });
    }
};

export default emailService;
