import db from '../utils/db.js';

export function createTransaction(transaction) {
    return db('transaction').insert(transaction);
}

