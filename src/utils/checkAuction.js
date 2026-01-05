import cron from 'node-cron';
import { sendFinalWinnerNotification, sendFailedAuctionNotification, sendFinalSellerNotification } from './email.js';
import * as productService from '../services/product.service.js';
import * as userService from '../services/user.service.js';
import * as transactionService from '../services/transaction.service.js';

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
            const seller = await userService.getUserById(auction.seller_id);

            await productService.updateAuctionStatus(auction.product_id, 'ended');

            // Gửi mail cho người thắng
            await sendFinalWinnerNotification(bidder.email, auction.name, auction.current_price);
            await sendFinalSellerNotification(seller.email, auction.name, auction.current_price, bidder.full_name);

            const transaction = {
                product_id: auction.product_id,
                buyer_id: auction.leader_id,
                seller_id: auction.seller_id,
                final_price: auction.current_price,
                payment_confirmed: false,
                shipping_confirmed: false,
                buyer_confirmed: false
            };

            await transactionService.createTransaction(transaction);
            

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
