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
  }) =>
    baseEmailLayout({
      brandName: "FlexFlow",
      brandTagline: "Smarter Collaboration, Better Results",
      title: "🎉 You're Invited!",
      greeting: `Hi there,`,
      message: `<strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as <em>${role}</em>. <br /><br />You've been invited to collaborate and manage projects together.`,
      buttonText: "Accept Invitation",
      buttonLink: inviteLink,
      //   logoUrl: "http://localhost:5173/flexflow.png", // 👈 here
      footerNote: `⏰ <strong>Note:</strong> This invitation will expire in 7 days.<br /><br />This invitation was sent by ${inviterName} via FlexFlow. If you didn't expect this, you can safely ignore it.`,
    }),

  welcomeEmail: ({
    userName,
    organizationName,
    dashboardLink,
  }: {
    userName: string;
    organizationName: string;
    dashboardLink: string;
  }) =>
    baseEmailLayout({
      brandName: "FlexFlow",
      brandTagline: "Smarter Collaboration, Better Results",
      title: "🎉 Welcome to FlexFlow!",
      greeting: `Hi ${userName},`,
      message: `Welcome to <strong>FlexFlow</strong>! You've successfully joined <strong>${organizationName}</strong> and we're excited to have you on board. <br /><br />You can now start collaborating with your team, managing projects, and taking advantage of all FlexFlow features.`,
      buttonText: "Go to Dashboard",
      buttonLink: dashboardLink,
      footerNote: "Happy collaborating! <br />— The FlexFlow Team",
    }),

  verificationEmail: ({
    userName,
    verificationLink,
  }: {
    userName: string;
    verificationLink: string;
  }) =>
    baseEmailLayout({
      brandName: "FlexFlow",
      brandTagline: "Smarter Collaboration, Better Results",
      title: "🔒 Verify Your Email Address",
      greeting: `Hi ${userName},`,
      message: `Thank you for signing up! Please verify your email address by clicking the button below.`,
      buttonText: "Verify Email",
      buttonLink: verificationLink,
      footerNote:
        "If you didn't sign up for this account, please ignore this email.",
    }),

  forgotPasswordEmail: ({
    userName,
    resetLink,
  }: {
    userName: string;
    resetLink: string;
  }) =>
    baseEmailLayout({
      brandName: "FlexFlow",
      brandTagline: "Smarter Collaboration, Better Results",
      title: "🔑 Reset Your Password",
      greeting: `Hi ${userName},`,
      message: `We received a request to reset your password. Click the button below to reset it. If you didn't request this, you can safely ignore this email.`,
      buttonText: "Reset Password",
      buttonLink: resetLink,
      footerNote: "This link will expire in 24 hours.",
    }),
};

export const baseEmailLayout = ({
  brandName,
  brandTagline,
  title,
  greeting,
  message,
  buttonText,
  buttonLink,
  footerNote,
  logoUrl,
}: {
  brandName: string;
  brandTagline: string;
  title: string;
  greeting: string;
  message: string;
  buttonText: string;
  buttonLink: string;
  footerNote?: string;
  logoUrl?: string; // 👈 add this
}) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="background-color: #f9fafb; padding: 20px; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="${brandName} Logo" style="height: 50px; margin-bottom: 12px;" />`
            : ""
        }
        <h2 style="color: #2563eb; margin: 0;">${brandName}</h2>
        <p style="color: #6b7280; font-size: 16px; margin: 4px 0 0;">${brandTagline}</p>
      </div>

      <!-- Content -->
      <div style="margin-bottom: 32px;">
        <h3 style="color: #111827; font-weight: 600;">${greeting}</h3>
        <p style="color: #374151; line-height: 1.6; font-size: 15px; margin-top: 12px;">
          ${message}
        </p>
      </div>

      <!-- Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${buttonLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">
          ${buttonText}
        </a>
      </div>

      <!-- Footer -->
      <div style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          ${
            footerNote ||
            `If you didn’t expect this email, you can safely ignore it.`
          }
        </p>
      </div>
    </div>
  </body>
  </html>
`;
