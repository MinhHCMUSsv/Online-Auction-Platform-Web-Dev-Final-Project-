import db from '../utils/db.js';

export function add(product) {
    return db('product').insert(product).returning('product_id');
}