import db from '../utils/db.js';

export function getAllUsers() {
    return db('app_user');
}

export function add(user) {
    return db('app_user').insert(user);
}

export function findByEmail(email) {
    return db('app_user').where('email', email).first();
}

