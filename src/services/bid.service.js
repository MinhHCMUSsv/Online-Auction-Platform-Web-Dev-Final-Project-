import db from '../utils/db.js';

export function findActiveBidsByUserId(userId) {
    return db('product as p')
        .join('bid as b', 'p.product_id', 'b.product_id') // 1. Join để lọc sản phẩm user đã bid
        .leftJoin('bid as all_bids', 'p.product_id', 'all_bids.product_id') // 2. Join để đếm tổng số bid
        .leftJoin('app_user as u', 'p.leader_id', 'u.user_id') // 3. Join để lấy tên người giữ giá
        .where('b.bidder_id', userId)
        .select('p.*', 'u.full_name as current_bidder_name')
        .count('all_bids.bid_id as bid_count')
        .groupBy('p.product_id', 'u.full_name');
}