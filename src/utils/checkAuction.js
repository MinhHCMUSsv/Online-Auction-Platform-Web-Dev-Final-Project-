import cron from 'node-cron';
import { sendFinalWinnerNotification, sendFailedAuctionNotification } from './email.js';
import * as productService from '../services/product.service.js';
import * as userService from '../services/user.service.js';

const checkExpiredAuctions = async () => {
    console.log('--- Checking expired auctions ---');

    // 1. Lấy các sản phẩm vừa hết hạn (end_time <= hiện tại) và vẫn đang 'active'
    const products = await productService.getExpiredActiveAuctions();

    if (!products.length) return;

    for (const auction of products) {
        // 2. Lấy thông tin người đặt giá cao nhất
        if (auction.leader_id) {
            // --- TH1: CÓ NGƯỜI THẮNG ---
            // Cập nhật trạng thái 'completed' trước để tránh gửi mail lặp lại
            const bidder = await userService.getUserById(auction.leader_id);
            await productService.updateAuctionStatus(auction.product_id, 'ended');

            // Gửi mail cho người thắng
            await sendFinalWinnerNotification(bidder.email, auction.name, auction.current_price);

        } else {
            // --- TH2: KHÔNG CÓ NGƯỜI ĐẶT GIÁ ---
            const seller = await userService.getUserById(auction.seller_id);
            await productService.updateAuctionStatus(auction.product_id, 'failed');
            
            // Gửi mail cho người bán (seller)
            await sendFailedAuctionNotification(seller.email, auction.name);
        }
    }
};

const startAuctionCheckCronJob = () => {
    // Schedule the cron job to run every minute
    console.log('Starting auction check cron job...');
    cron.schedule('* * * * *', async () => {
        await checkExpiredAuctions();
    });
};

export default startAuctionCheckCronJob;
