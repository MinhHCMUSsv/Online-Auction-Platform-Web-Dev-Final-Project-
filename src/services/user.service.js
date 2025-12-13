import db from '../utils/db.js';

export function add(user) {
    return db('app_user').insert(user);
}

export function findByEmail(email) {
    return db('app_user').where('email', email).first();
}

export function patch(user) {
    return db('app_user').where('user_id', user.user_id).update(user);
}