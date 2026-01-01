import db from '../utils/db.js';

// 1. Lấy top 5 sản phẩm có giá hiện tại cao nhất
export function findTopPrice(limit = 5) {
    return db('product')
        .where('status', 'active') // Sửa điều kiện: chỉ lấy status là 'active'
        .orderBy('current_price', 'desc')
        .limit(limit);
}

// 2. Lấy top 5 sản phẩm sắp kết thúc
export function findEndingSoon(limit = 5) {
    return db('product')
        .where('status', 'active') // Chỉ lấy sản phẩm đang active
        .orderBy('end_time', 'asc') // Sắp xếp ai kết thúc trước thì lên đầu
        .limit(limit);
}

// 3. Lấy top 5 sản phẩm có nhiều lượt ra giá nhất
export function findMostActive(limit = 5) {
    return db('product as p')
        .leftJoin('bid as b', 'p.product_id', 'b.product_id')
        .select('p.*')
        .count('b.bid_id as bid_count')
        .where('p.status', 'active') // Dùng alias p.status
        .groupBy('p.product_id')
        .orderBy('bid_count', 'desc')
        .limit(limit);
}