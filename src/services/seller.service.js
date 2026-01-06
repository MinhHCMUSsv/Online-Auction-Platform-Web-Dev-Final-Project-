import db from '../utils/db.js';

export function countActiveBySeller(sellerId) {
    return db('product')
        .where('seller_id', sellerId)
        .andWhere('status', 'active')
        .count('product_id as count')
        .first();
}

export function findActiveBySeller(sellerId, limit, offset) {
    return db('product as p')
        .leftJoin('bid as b', 'p.product_id', 'b.product_id')
        .leftJoin('app_user as u', 'p.leader_id', 'u.user_id')
        .select('p.*', 'u.full_name as current_bidder_name')
        .count('b.bid_id as bid_count')
        .where('p.seller_id', sellerId)
        .andWhere('p.status', 'active')
        .groupBy('p.product_id', 'u.full_name')
        .limit(limit)
        .offset(offset)
        .orderBy('p.end_time', 'asc');
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
        .leftJoin('transaction as t', 'p.product_id', 't.product_id')
        .select(
            'p.*',
            'u.full_name as winner_name',
            'u.user_id as winner_id',
            't.status as transaction_status', 
            't.transaction_id',
            't.shipping_confirmed'
        )
        .where('p.seller_id', sellerId)
        .andWhereNot('p.status', 'active')
        .groupBy('p.product_id', 'u.full_name', 'u.user_id', 't.status', 't.transaction_id', 't.shipping_confirmed')
        .limit(limit)
        .offset(offset)
        .orderBy('p.end_time', 'desc');
}