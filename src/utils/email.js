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

// Hàm gửi thông báo có câu hỏi mới
export const sendNewQuestionNotification = async function (toEmail, userName, productName, productLink, questionContent) {
    const subject = `[MNGo Auction] New question on product: ${productName}`;
    
    // Nội dung HTML của email
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3 style="color: #0d6efd;">You have a new question!</h3>
            <p><strong>${userName}</strong> just commented on your product <strong>"${productName}"</strong>.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #fd7e14; margin: 15px 0;">
                <em>"${questionContent}"</em>
            </div>

            <p>Click the button below to view and reply:</p>
            <a href="${productLink}" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Product Detail
            </a>
            
            <p style="margin-top: 20px; font-size: 12px; color: #888;">If the button doesn't work, copy this link: ${productLink}</p>
        </div>
    `;

    return await sendMailBase(toEmail, subject, htmlContent);
};

// Hàm gửi thông báo Seller đã trả lời (Gửi cho danh sách nhiều người)
export const sendSellerReplyNotification = async function (toEmails, productName, productLink, replyContent) {
    const subject = `[MNGo Auction] Seller replied on product: ${productName}`;
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3 style="color: #fd7e14;">Seller has replied to a question!</h3>
            <p>The seller of <strong>"${productName}"</strong> just posted a reply.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0d6efd; margin: 15px 0;">
                <em>"${replyContent}"</em>
            </div>

            <p>Click below to see the full discussion:</p>
            <a href="${productLink}" style="background-color: #fd7e14; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Details
            </a>
            
            <p style="margin-top: 20px; font-size: 12px; color: #888;">If the button doesn't work, copy this link: ${productLink}</p>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">You received this email because you placed a bid or commented on this product.</p>
        </div>
    `;

    return await sendMailBase(toEmails, subject, htmlContent);
};

export const sendDescriptionUpdateNotification = async function (toEmails, productName, productLink, newDescription) {
    const subject = `[MNGo Auction] Description updated for: ${productName}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3 style="color: #fd7e14;">Product Update!</h3>
            <p>The seller of <strong>"${productName}"</strong> has added new information to the description.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0d6efd; margin: 15px 0;">
                <strong>New Information:</strong><br>
                <em>${newDescription}</em>
            </div>

            <p>Click below to view the product:</p>
            <a href="${productLink}" style="background-color: #fd7e14; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Product Detail
            </a>
            
            <p style="margin-top: 20px; font-size: 12px; color: #888;">If the button doesn't work, copy this link: ${productLink}</p>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">You received this email because you placed a bid or commented on this product.</p>
        </div>
    `;

    return await sendMailBase(toEmails, subject, htmlContent);
};