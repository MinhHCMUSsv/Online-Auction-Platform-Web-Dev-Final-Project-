import db from '../utils/db.js';
import { mapProductsWithNewFlag } from './product.service.js';

// 1. Lấy top 5 sản phẩm có giá hiện tại cao nhất
export async function findTopPrice(limit = 5) {
    const products = await db('product as p')
        .leftJoin('bid as b', 'p.product_id', 'b.product_id')
        .leftJoin('app_user as u', 'p.leader_id', 'u.user_id')
        .select('p.*', 'u.full_name as current_bidder_name')
        .count('b.bid_id as bid_count')
        .where('p.status', 'active')
        .groupBy('p.product_id', 'u.full_name')
        .orderBy('p.current_price', 'desc')
        .limit(limit);
    
    return mapProductsWithNewFlag(products);
}

// 2. Lấy top 5 sản phẩm sắp kết thúc
export async function findEndingSoon(limit = 5) {
    const products = await db('product as p')
        .leftJoin('bid as b', 'p.product_id', 'b.product_id')
        .leftJoin('app_user as u', 'p.leader_id', 'u.user_id')
        .select('p.*', 'u.full_name as current_bidder_name')
        .count('b.bid_id as bid_count')
        .where('p.status', 'active')
        .groupBy('p.product_id', 'u.full_name')
        .orderBy('p.end_time', 'asc')
        .limit(limit);
    
    return mapProductsWithNewFlag(products);
}

// 3. Lấy top 5 sản phẩm có nhiều lượt ra giá nhất
export async function findMostActive(limit = 5) {
    const products = await db('product as p')
        .leftJoin('bid as b', 'p.product_id', 'b.product_id')
        .leftJoin('app_user as u', 'p.leader_id', 'u.user_id')
        .select('p.*', 'u.full_name as current_bidder_name')
        .count('b.bid_id as bid_count')
        .where('p.status', 'active')
        .groupBy('p.product_id', 'u.full_name')
        .orderBy('bid_count', 'desc')
        .limit(limit);
    
    return mapProductsWithNewFlag(products);
}