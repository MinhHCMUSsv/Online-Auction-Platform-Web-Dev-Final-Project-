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

export const sendWinningNotification = async function (toEmail, productName, bidAmount) {
    const subject = "MNGo Auction - Congratulations on Winning the Auction!";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <h2 style="color: #28a745; text-align: center;">🎉 Congratulations! You're Now Leading!</h2>
            <p>Hello,</p>
            <p>Great news! You are now the highest bidder for:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0d6efd; margin: 0;">${productName}</h3>
                <p style="margin: 5px 0 0 0;"><strong>Your bid:</strong> $${bidAmount}</p>
            </div>
            <p>Keep an eye on the auction - other bidders might try to outbid you!</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.BASE_URL}/menu" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View Auction
                </a>
            </div>
            <p style="color: #666; font-size: 0.9em;">Good luck with your auction!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #999; font-size: 0.8em;">© 2025 MNGo Auction Team</p>
        </div>
    `;
    
    return await sendMailBase(toEmail, subject, htmlContent);
};

export const sendOutbidNotification = async function (toEmail, productName) {
    const subject = "MNGo Auction - You've Been Outbid";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <h2 style="color: #dc3545; text-align: center;">⚠️ You've Been Outbid!</h2>
            <p>Hello,</p>
            <p>Unfortunately, someone has placed a higher bid on an item you were interested in:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0d6efd; margin: 0;">${productName}</h3>
            </div>
            <p>Don't let this opportunity slip away! You can place a new bid to regain the lead.</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.BASE_URL}/menu" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Bid Again
                </a>
            </div>
            <p style="color: #666; font-size: 0.9em;">Act fast - the auction won't last forever!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #999; font-size: 0.8em;">© 2025 MNGo Auction Team</p>
        </div>
    `;
    
    return await sendMailBase(toEmail, subject, htmlContent);
};

export const sendPriceUpdateNotification = async function (toEmail, productName, currentPrice, maxPrice, bidderName) {
    const subject = "MNGo Auction - Price Update on Your Item";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <h2 style="color: #0d6efd; text-align: center;">💰 New Bid on Your Item!</h2>
            <p>Hello,</p>
            <p>Great news! Someone has placed a new bid on your auction item:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0d6efd; margin: 0;">${productName}</h3>
                <p style="margin: 5px 0 0 0;"><strong>Current price:</strong> $${currentPrice}</p>
                <p style="margin: 5px 0 0 0;"><strong>Max price:</strong> $${maxPrice}</p>
                <p style="margin: 5px 0 0 0;"><strong>Leading bidder:</strong> ${bidderName}</p>
            </div>
            <p>Your item is gaining attention! Higher bids mean more profit for you.</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.BASE_URL}/menu" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View Your Item
                </a>
            </div>
            <p style="color: #666; font-size: 0.9em;">Keep monitoring your auction for more updates!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #999; font-size: 0.8em;">© 2025 MNGo Auction Team</p>
        </div>
    `;
    
    return await sendMailBase(toEmail, subject, htmlContent);
};

export const sendBidderRejectedNotification = async function (toEmail, productName, sellerName) {
    const subject = "MNGo Auction - Bidding Access Restricted";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <h2 style="color: #dc3545; text-align: center;">❌ Bidding Access Restricted</h2>
            <p>Hello,</p>
            <p>We regret to inform you that your bidding access has been restricted for the following item:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h3 style="color: #dc3545; margin: 0;">${productName}</h3>
                <p style="margin: 5px 0 0 0;"><strong>Restricted by:</strong> ${sellerName}</p>
            </div>
            <p><strong>What this means:</strong></p>
            <ul>
                <li>You can no longer place bids on this specific item</li>
                <li>This restriction applies only to this auction item</li>
                <li>You can still bid on other items from different sellers</li>
            </ul>
            <p>If you believe this restriction was applied in error, you may contact the seller directly.</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.BASE_URL}/menu" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Browse Other Auctions
                </a>
            </div>
            <p style="color: #666; font-size: 0.9em;">Thank you for your understanding.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #999; font-size: 0.8em;">© 2025 MNGo Auction Team</p>
        </div>
    `;
    
    return await sendMailBase(toEmail, subject, htmlContent);
};