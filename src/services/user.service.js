import db from '../utils/db.js';

export function add(user) {
    return db('app_user').insert(user);
}