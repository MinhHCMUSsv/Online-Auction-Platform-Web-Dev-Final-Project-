import cron from 'node-cron';
import { sendFinalWinnerNotification, sendFailedAuctionNotification, sendFinalSellerNotification } from './email.js';
import * as productService from '../services/product.service.js';
import * as userService from '../services/user.service.js';
import * as transactionService from '../services/transaction.service.js';

const checkExpiredAuctions = async () => {
    console.log('--- Checking expired auctions ---');

    const products = await productService.getExpiredActiveAuctions();

    if (!products.length) return;

    for (const auction of products) {
        if (auction.leader_id) {

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
            const seller = await userService.getUserById(auction.seller_id);
            await productService.updateAuctionStatus(auction.product_id, 'failed');
            
            await sendFailedAuctionNotification(seller.email, auction.name);
        }
    }
};

const startAuctionCheckCronJob = () => {
    console.log('Starting auction check cron job...');
    cron.schedule('* * * * *', async () => {
        await checkExpiredAuctions();
    });
};

export default startAuctionCheckCronJob;
