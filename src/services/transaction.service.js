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

export function getById(transactionId) {
    return db('transaction').where('transaction_id', transactionId).first();
}

// STEP 1: Cập nhật địa chỉ giao hàng
export function updateAddress(transactionId, address) {
    return db('transaction')
        .where('transaction_id', transactionId)
        .update({
            shipping_address: address
        });
}

// STEP 2: Buyer upload ảnh -> Tự động xác nhận đã thanh toán
export function updatePayment(transactionId) {
    return db('transaction')
        .where('transaction_id', transactionId)
        .update({
            payment_confirmed: true
        });
}

// STEP 3: Seller upload ảnh vận chuyển -> Xác nhận đã ship
export function updateShipping(transactionId) {
    return db('transaction')
        .where('transaction_id', transactionId)
        .update({
            shipping_confirmed: true
        });
}

// STEP 4: Buyer xác nhận đã nhận hàng
export function updateComplete(transactionId) {
    return db('transaction')
        .where('transaction_id', transactionId)
        .update({
            buyer_confirmed: true,
            status: 2
        });
}