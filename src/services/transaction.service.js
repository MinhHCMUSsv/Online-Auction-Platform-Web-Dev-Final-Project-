import db from '../utils/db.js';

export function createTransaction(transaction) {
    return db('transaction').insert(transaction);
}

export function getByProductId(productId) {
    return db('transaction').where('product_id', productId).first();
}

export function getAllInfoTransaction(productId) {
    return db('transaction as t')
        .join('app_user as seller', 't.seller_id', 'seller.user_id')
        .join('app_user as bidder', 't.buyer_id', 'bidder.user_id')
        .select(
            't.*', 'seller.full_name as seller_name', 'bidder.full_name as buyer_name')
        .where('t.product_id', productId)
        .first();
}

// STEP 1: Buyer up ảnh xác nhận chuyển khoản.
export function updateStep1(transactionId) {
    return db('transaction')
        .where('transaction_id', transactionId)
        .update({
            payment_confirmed: true
        });
}

// STEP 2: Seller xác nhận tiền VÀ xác nhận giao hàng
export function updateStep2(transactionId) {
    return db('transaction')
        .where('transaction_id', transactionId)
        .update({
            shipping_confirmed: true
        });
}

// STEP 3: Buyer xác nhận đã nhận hàng
export function updateStep3(transactionId) {
    return db('transaction')
        .where('transaction_id', transactionId)
        .update({
            buyer_confirmed: true
        });
}
