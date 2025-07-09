import nodemailer from "nodemailer";
import { ErrorHandler } from "../utils/errorHandler";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export const sendMail = async ({
  to,
  subject,
  html,
  attachments,
}: MailOptions): Promise<void> => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    await transporter.verify();

    // Send mail
    const info = await transporter.sendMail({
      from: {
        name: process.env.SMTP_FROM_NAME || "FlexFlow Team",
        address: process.env.SMTP_FROM_EMAIL!,
      },
      to,
      subject,
      html,
      attachments,
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new ErrorHandler("Failed to send email", 500);
  }
};

// Professional email templates
export const emailTemplates = {
  organizationInvitation: ({
    inviterName,
    organizationName,
    inviteLink,
    role,
  }: {
    inviterName: string;
    organizationName: string;
    inviteLink: string;
    role: string;
    isReinvite?: boolean;
  }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Organization Invitation</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 40px 30px;
            }
            .invitation-card {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 30px;
                margin: 20px 0;
                border-left: 4px solid #667eea;
            }
            .organization-name {
                font-size: 24px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 10px;
            }
            .role-badge {
                display: inline-block;
                background-color: #e2e8f0;
                color: #4a5568;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 15px;
            }
            .invite-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s;
            }
            .invite-button:hover {
                transform: translateY(-2px);
            }
            .details {
                background-color: #f7fafc;
                border-radius: 6px;
                padding: 20px;
                margin: 20px 0;
            }
            .details h3 {
                color: #2d3748;
                margin-bottom: 15px;
                font-size: 18px;
            }
            .details ul {
                list-style: none;
                padding: 0;
            }
            .details li {
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            .details li:last-child {
                border-bottom: none;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer p {
                color: #718096;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .footer a {
                color: #667eea;
                text-decoration: none;
            }
            .expiry-notice {
                background-color: #fef5e7;
                border: 1px solid #f6e05e;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
            }
            .expiry-notice p {
                color: #744210;
                font-size: 14px;
                margin: 0;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 0 10px;
                }
                .header, .content, .footer {
                    padding: 20px;
                }
                .invitation-card {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 You're Invited!</h1>
                <p>Join your team on FlexFlow</p>
            </div>
            
            <div class="content">
                <p>Hi there,</p>
                <p><strong>${inviterName}</strong> has invited you to join their organization on FlexFlow.</p>
                
                <div class="invitation-card">
                    <div class="organization-name">${organizationName}</div>
                    <div class="role-badge">Role: ${role}</div>
                    <p>You've been invited to collaborate and manage projects together.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteLink}" class="invite-button">Accept Invitation</a>
                </div>
                
                <div class="details">
                    <h3>What's next?</h3>
                    <ul>
                        <li>✅ Click the "Accept Invitation" button above</li>
                        <li>✅ Create your account or sign in if you already have one</li>
                        <li>✅ Start collaborating with your team</li>
                        <li>✅ Access all organization features and projects</li>
                    </ul>
                </div>
                
                <div class="expiry-notice">
                    <p>⏰ <strong>Note:</strong> This invitation will expire in 7 days for security reasons.</p>
                </div>
                
                <p>If you have any questions, feel free to reach out to <strong>${inviterName}</strong> or our support team.</p>
            </div>
            
            <div class="footer">
                <p>This invitation was sent by ${inviterName} via FlexFlow.</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                <p><a href="${process.env.FRONTEND_URL}">Visit FlexFlow</a> | <a href="${process.env.FRONTEND_URL}/support">Support</a></p>
            </div>
        </div>
    </body>
    </html>
  `,

  welcomeEmail: ({
    userName,
    organizationName,
    dashboardLink,
  }: {
    userName: string;
    organizationName: string;
    dashboardLink: string;
  }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to FlexFlow</title>
        <style>
            /* Same base styles as above */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            .content {
                padding: 40px 30px;
            }
            .welcome-button {
                display: inline-block;
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to FlexFlow!</h1>
                <p>You're now part of ${organizationName}</p>
            </div>
            
            <div class="content">
                <p>Hi ${userName},</p>
                <p>Welcome to FlexFlow! You've successfully joined <strong>${organizationName}</strong> and we're excited to have you on board.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${dashboardLink}" class="welcome-button">Go to Dashboard</a>
                </div>
                
                <p>You can now start collaborating with your team, managing projects, and taking advantage of all FlexFlow features.</p>
                
                <p>If you need any help getting started, don't hesitate to reach out to our support team.</p>
            </div>
            
            <div class="footer">
                <p>Happy collaborating!</p>
                <p>The FlexFlow Team</p>
            </div>
        </div>
    </body>
    </html>
  `,
};
