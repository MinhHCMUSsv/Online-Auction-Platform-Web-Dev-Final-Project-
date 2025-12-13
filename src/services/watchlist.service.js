import db from '../utils/db.js';

export function findByUserId(userId) {
    return db('wishlist as w').join('product as p', 'w.product_id', 'p.product_id')
        .where('w.user_id', userId)
        .select('p.*');
}

export function add(userId, productId) {
    return db('wishlist').insert({
        user_id: userId,
        product_id: productId
    });
}

export function remove(userId, productId) {
    return db('wishlist')
        .where('user_id', userId)
        .andWhere('product_id', productId)
        .del();
}

export async function check(userId, productId) {
    const row = await db('wishlist')
        .where('user_id', userId)
        .andWhere('product_id', productId)
        .first();
    return row !== undefined;
}