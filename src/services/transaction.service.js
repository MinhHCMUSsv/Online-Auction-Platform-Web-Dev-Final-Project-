import db from '../utils/db.js';

export function createTransaction(transaction) {
    return db('transactions').insert(transaction);
}

export function getByProductId(productId) {
    return db('transaction').where('product_id', productId).first();
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
