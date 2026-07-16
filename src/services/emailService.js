import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import axios from "axios";

// Cloud Function endpoint (configured via env variables if available)
const FUNCTIONS_BASE_URL = import.meta.env?.VITE_FIREBASE_FUNCTIONS_URL || "https://us-central1-clouderp-system.cloudfunctions.net";

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
        const html = `
            <h2>Account Created Successfully</h2>
            <p>Dear ${employee.firstName} ${employee.lastName},</p>
            <p>Welcome! Your employee profile has been created in the CloudERP Asset Management system.</p>
            <p><strong>Employee ID:</strong> ${employee.employeeId}</p>
            <p><strong>Department:</strong> ${employee.department}</p>
            <p><strong>Designation:</strong> ${employee.designation}</p>
            <p>Best Regards,<br/>HR & Assets Operations Team</p>
        `;
        return emailService.sendEmail({
            to: employee.email,
            subject,
            html,
            template: "employee_created",
            data: employee
        });
    },

    sendAssetAssigned: async (asset, employee) => {
        const subject = `Asset Assigned: ${asset.assetName} (${asset.assetNumber})`;
        const html = `
            <h2>Asset Assignment Notification</h2>
            <p>Dear ${employee.firstName} ${employee.lastName},</p>
            <p>The following corporate asset has been assigned to you:</p>
            <ul>
                <li><strong>Asset Number:</strong> ${asset.assetNumber}</li>
                <li><strong>Asset Name:</strong> ${asset.assetName}</li>
                <li><strong>Serial Number:</strong> ${asset.serialNumber || "N/A"}</li>
                <li><strong>Category:</strong> ${asset.category}</li>
                <li><strong>Assignment Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>Please inspect the asset and report any issues to IT support.</p>
            <p>Best Regards,<br/>Assets Management Team</p>
        `;
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
        const html = `
            <h2>Asset Return Acknowledgment</h2>
            <p>Dear ${employee.firstName} ${employee.lastName},</p>
            <p>We acknowledge the return of the following asset:</p>
            <ul>
                <li><strong>Asset Number:</strong> ${asset.assetNumber}</li>
                <li><strong>Asset Name:</strong> ${asset.assetName}</li>
                <li><strong>Return Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>The asset status has been updated to <strong>${asset.status}</strong>.</p>
            <p>Best Regards,<br/>Assets Management Team</p>
        `;
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
        const html = `
            <h2>Warranty Expiration Alert</h2>
            <p>Attention Assets Admin,</p>
            <p>The warranty for the following asset is expiring soon:</p>
            <ul>
                <li><strong>Asset Number:</strong> ${asset.assetNumber}</li>
                <li><strong>Asset Name:</strong> ${asset.assetName}</li>
                <li><strong>Vendor:</strong> ${asset.vendor || "N/A"}</li>
                <li><strong>Warranty Expiry Date:</strong> ${asset.warrantyExpiry}</li>
            </ul>
            <p>Please take necessary actions for extensions or review options.</p>
        `;
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
        const html = `
            <h2>Password Reset Instructions</h2>
            <p>A password reset was requested for your CloudERP account.</p>
            <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
            <p><a href="${resetLink}" style="padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
            <p>If you did not make this request, you can safely ignore this email.</p>
        `;
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
