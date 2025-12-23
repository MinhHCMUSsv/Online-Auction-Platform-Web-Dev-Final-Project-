import db from '../utils/db.js';

export function add(user) {
    return db('app_user').insert(user).returning('user_id');
}

export function findByEmail(email) {
    return db('app_user').where('email', email).first();
}

export function patch(user) {
    return db('app_user').where('user_id', user.user_id).update(user);
}

export function findByGoogleId(googleId) {
    return db('app_user as a')
        .join('user_auth_provider as u', 'a.user_id', 'u.user_id')
        .where('u.provider_user_id', googleId)
        .andWhere('u.provider', 'google')
        .first();
}

export function addAuthProvider(entity) {
    return db('user_auth_provider').insert(entity);
}