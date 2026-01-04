import db from '../utils/db.js';

export function createTransaction(transaction) {
    return db('transactions').insert(transaction);
}

