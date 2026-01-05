import db from '../utils/db.js';

export function getByProductId(productId) {
    return db('transaction').where('product_id', productId).first();
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