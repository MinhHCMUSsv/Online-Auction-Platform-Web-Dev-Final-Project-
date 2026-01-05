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

export const sendBidSuccessfullyNotification = async function (toEmail, productName, bidAmount) {
    const subject = "MNGo Auction - Bidding Successfully!";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <h2 style="color: #28a745; text-align: center;">🎉 Congratulations! You're bidding successfully!</h2>
            <p>Hello,</p>
            <p>Great news! You are bidding successfully for:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0d6efd; margin: 0;">${productName}</h3>
                <p style="margin: 5px 0 0 0;"><strong>Your bid:</strong> $${bidAmount}</p>
            </div>
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

export const sendPriceUpdateNotification = async function (toEmail, productName, currentPrice) {
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

export const sendNextWinningNotification = async function (toEmail, productName, bidAmount) {
    const subject = "MNGo Auction - You're the New Highest Bidder!";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <h2 style="color: #28a745; text-align: center;">🎉 Congratulations! You're the New Highest Bidder!</h2>
            <p>Hello,</p>
            <p>Fantastic news! You are now the highest bidder for:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0d6efd; margin: 0;">${productName}</h3>
                <p style="margin: 5px 0 0 0;"><strong>Your bid:</strong> $${bidAmount}</p>
            </div>  
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.BASE_URL}/menu" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View Auction
                </a>
            </div>
            <p style="color: #666; font-size: 0.9em;">Keep an eye on the auction to maintain your lead!</p>
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

export const sendPasswordResetEmail = async function (toEmail, fullName, newPassword) {
    const subject = 'Password Reset - Your New Password';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ff8c00; color: white; padding: 20px; text-align: center;">
                <h2>Password Reset</h2>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
                <h3>Hello ${fullName},</h3>
                <p>Your password has been reset by an administrator.</p>
                <p><strong>Your new password is:</strong></p>
                <div style="background-color: #fff; border: 2px solid #ff8c00; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; color: #ff8c00; margin: 20px 0;">
                    ${newPassword}
                </div>
                <p><strong>Important:</strong> Please change this password after logging in for security purposes.</p>
                <p>If you did not request this password reset, please contact the administrator immediately.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    `;
    
    
    return await sendMailBase(toEmail, subject, html);
}

export const sendFinalWinnerNotification = async function (toEmail, productName, finalPrice) {
    const subject = "MNGo Auction - Congratulations on Winning the Auction!";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <h2 style="color: #28a745; text-align: center;">🎉 Congratulations! You Won the Auction!</h2>
            <p>Hello,</p>
            <p>Fantastic news! You are the winning bidder for:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0d6efd; margin: 0;">${productName}</h3>
                <p style="margin: 5px 0 0 0;"><strong>Final price:</strong> $${finalPrice}</p>
            </div>
            <p>Please proceed to complete the payment and arrange for the delivery of your item.</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.BASE_URL}/menu" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View Auction
                </a>
            </div>
            <p style="color: #666; font-size: 0.9em;">Thank you for participating in the auction. Enjoy your new item!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #999; font-size: 0.8em;">© 2025 MNGo Auction Team</p>
        </div>
    `;  
    return await sendMailBase(toEmail, subject, htmlContent);
};

export const sendFailedAuctionNotification = async function (toEmail, productName) {
    const subject = "MNGo Auction - Auction Ended Without Bids";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <h2 style="color: #dc3545; text-align: center;">⚠️ Auction Ended Without Bids</h2>      
            <p>Hello,</p>
            <p>We regret to inform you that your auction for the following item has ended without any bids:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0d6efd; margin: 0;">${productName}</h3>
            </div>
            <p>Don't be discouraged! You can relist the item or try auctioning other items to attract more bidders.</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.BASE_URL}/menu" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Browse Other Auctions
                </a>
            </div>
            <p style="color: #666; font-size: 0.9em;">Thank you for using MNGo Auction. We look forward to your next auction!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #999; font-size: 0.8em;">© 2025 MNGo Auction Team</p>
        </div>
    `;  
    return await sendMailBase(toEmail, subject, htmlContent);
};

export const sendFinalSellerNotification = async function (toEmail, productName, finalPrice, winnerName) {
    const subject = "MNGo Auction - Your Item Has Been Sold!";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF8C00; text-align: center;">MNGo Auction</h2>
            <h2 style="color: #28a745; text-align: center;">🎉 Your Item Has Been Sold!</h2>
            <p>Hello,</p>
            <p>Congratulations! Your auction item has been sold:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0d6efd; margin: 0;">${productName}</h3>
                <p style="margin: 5px 0 0 0;"><strong>Final price:</strong> $${finalPrice}</p>
                <p style="margin: 5px 0 0 0;"><strong>Winning bidder:</strong> ${winnerName}</p>
            </div>  
            <p>Please contact the winning bidder to arrange payment and delivery of your item.</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.BASE_URL}/menu" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View Auction
                </a>
            </div>
            <p style="color: #666; font-size: 0.9em;">Thank you for using MNGo Auction. We look forward to your next auction!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #999; font-size: 0.8em;">© 2025 MNGo Auction Team</p>
        </div>
    `;  
    return await sendMailBase(toEmail, subject, htmlContent);
}
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
