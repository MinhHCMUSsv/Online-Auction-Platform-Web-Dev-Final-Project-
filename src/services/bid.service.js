import db from '../utils/db.js';

export function findActiveBidsByUserId(userId) {
    return db('bid as b')
        .join('product as p', 'b.product_id', 'p.product_id') 
        .where('b.bidder_id', userId) 
        .distinct('p.product_id') 
        .select('p.*'); 
}

export function checkProductHasBids(productId) {
    return db('bid')
        .where('product_id', productId)
        .count('bid_id as count')
        .first()
        .then(result => result.count > 0);
}

export function deleteProductBids(productId) {
    return db('bid')
        .where('product_id', productId)
        .del();
}