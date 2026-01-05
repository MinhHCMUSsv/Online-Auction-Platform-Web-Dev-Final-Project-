import db from '../utils/db.js';

export function findByUserId(userId, limit, offset) {
    let query = db('wishlist as w')
        .join('product as p', 'w.product_id', 'p.product_id')
        .leftJoin('bid as b', 'p.product_id', 'b.product_id')
        .leftJoin('app_user as u', 'p.leader_id', 'u.user_id') 
        .where('w.user_id', userId)
        .select('p.*', 'u.full_name as current_bidder_name')
        .count('b.bid_id as bid_count') 
        .groupBy('p.product_id', 'u.full_name');

    if (limit) {
        query = query.limit(limit).offset(offset);
    }
    
    return query;
}

export function countByUserId(userId) {
    return db('wishlist')
        .where('user_id', userId)
        .count('product_id as count')
        .first();
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