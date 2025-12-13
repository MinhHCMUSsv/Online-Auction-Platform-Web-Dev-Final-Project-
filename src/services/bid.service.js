import db from '../utils/db.js';

export function findActiveBidsByUserId(userId) {
    return db('bid as b')
        .join('product as p', 'b.product_id', 'p.product_id') 
        .where('b.bidder_id', userId) 
        .distinct('p.product_id') 
        .select('p.*'); 
}