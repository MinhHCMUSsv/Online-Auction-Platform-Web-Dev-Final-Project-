import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASSWORD
    }
});

// Hàm cơ sở để gửi email (dùng chung cho mọi chức năng)
const sendMailBase = async function (to, subject, htmlContent) {
    try {
        const info = await transporter.sendMail({
            from: `"MNGo Auction Support" <${process.env.EMAIL_USERNAME}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });
        console.log('Email sent: ', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email: ', error);
        return false;
    }
};

export const sendForgotPasswordLink = async function (toEmail, resetLink) {
    const subject = "MNGo Auction - Request to reset password";
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for the account associated with email <b>${toEmail}</b>.</p>
            <p>To create a new password, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Reset Password
                </a>
            </div>

            <p style="color: #666; font-size: 0.9em;">This link is only valid for <b>15 minutes</b>.</p>
            <p style="color: #666; font-size: 0.9em;">If you did not request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #999; font-size: 0.8em;">© 2025 MNGo Auction Team</p>
        </div>
    `;

    return await sendMailBase(toEmail, subject, htmlContent);
};

export const sendOTP = async function (toEmail, otp) {
    const subject = "MNGo Auction - OTP Verification Code";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>    
        <h2 style="color: #0d6efd; text-align: center;">Your Verification Code</h2>
            <p>Hello,</p>
            <p>Your OTP verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #dc3545; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                ${otp}
            </div>
            <p>- This code will expire in <strong>5 minutes</strong>.</p>
            <p>Do not share this code with anyone.</p>
        </div>
    `;
    
    return await sendMailBase(toEmail, subject, htmlContent);
};