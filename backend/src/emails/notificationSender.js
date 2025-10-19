import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transportProtocol = nodemailer.createTransport(
    {
        secure: true,
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: process.env.EMAIL_SENDER,
            pass: process.env.EMAIL_PASSWORD
        }
    }
);

export const sendNotificationEmail = async (email, from) => {    
        try {
            const response = await transportProtocol.sendMail({
                from: `"CINEFLIX" <${process.env.EMAIL_SENDER}>`,
                to: email,
                subject: "Connectify - A User has Sent a Message",
                html: html,
                headers: { 'X-Category': 'Chat Notification'}
            });
    
            console.log("Email Sent Successfully", response)
        } catch (error) {
                console.error(`Error sending email`, error);
                throw new Error(`Error Sending Verification Email: ${error}`)
        }
    }   