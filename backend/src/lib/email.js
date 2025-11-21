import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendResetEmail = async (email, resetUrl) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;500;700&display=swap');

        body {
          font-family: 'DM Sans', Arial, sans-serif;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
        }

        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .header {
          background-color: #4F46E5;
          padding: 32px;
          text-align: center;
        }

        .header h2 {
          color: #ffffff;
          margin: 0;
          font-weight: 700;
          font-size: 24px;
        }

        .content {
          padding: 32px;
          color: #374151;
          line-height: 1.6;
        }

        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: #ffffff !important;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 16px;
          margin: 24px 0;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }
        
        .button:hover {
            background-color: #4338ca;
        }

        .footer {
          padding: 24px;
          background-color: #f9fafb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #111827;
          }
          .container {
            background-color: #1f2937;
            box-shadow: none;
            border: 1px solid #374151;
          }
          .content {
            color: #e5e7eb;
          }
          .header {
             background-color: #4f46e5;
          }
           .button {
            background-color: #6366f1;
            box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
          }
          .footer {
            background-color: #1f2937;
            color: #9ca3af;
            border-top: 1px solid #374151;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Reset Your Password</h2>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 16px; font-weight: 500;">Hello,</p>
          <p>We noticed multiple failed login attempts on your account. To protect your security, we have temporarily restricted access.</p>
          <p>If this was you, or if you have forgotten your password, you can reset it by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">This link will expire in 1 hour.</p>
          <p style="font-size: 14px; margin-top: 0;">If you did not request this email, please ignore it.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Connectify. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Connectify Security" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: "Action Required: Reset Your Password",
      html: html,
    });
    console.log("Reset email sent successfully");
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw new Error("Failed to send reset email");
  }
};