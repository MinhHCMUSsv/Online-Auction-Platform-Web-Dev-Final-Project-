import db from '../utils/db.js';

export function countActiveBySeller(sellerId) {
    return db('product')
        .where('seller_id', sellerId)
        .andWhere('status', 'active')
        .count('product_id as count')
        .first();
}

export function findActiveBySeller(sellerId, limit, offset) {
    return db('product')
        .where('seller_id', sellerId)
        .andWhere('status', 'active')
        .limit(limit)
        .offset(offset)
        .orderBy('end_time', 'asc');
}

export function countFinishedBySeller(sellerId) {
    return db('product')
        .where('seller_id', sellerId)
        .andWhereNot('status', 'active')
        .count('product_id as count')
        .first();
}

export function findFinishedBySeller(sellerId, limit, offset) {
    return db('product as p')
        .leftJoin('app_user as u', 'p.leader_id', 'u.user_id')
        .select(
            'p.*',
            'u.full_name as winner_name', 
            'u.user_id as winner_id'
        )
        .where('p.seller_id', sellerId)
        .andWhereNot('p.status', 'active')
        .limit(limit)
        .offset(offset)
        .orderBy('p.end_time', 'desc');
}