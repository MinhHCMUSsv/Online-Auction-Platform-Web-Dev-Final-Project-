import db from '../utils/db.js';

export function add(user) {
    return db('product').insert(user);
}