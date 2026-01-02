import db from '../utils/db.js';

export function getAllUsers() {
    return db('app_user');
}

export function add(user) {
    return db('app_user').insert(user).returning('user_id');
}

export function patchOTP(otp, userId) {
    return db('app_user')
        .where('user_id', userId)
        .update({
            otp: otp,
        });
}

export function verifyUser(userId) {
    return db('app_user')
        .where('user_id', userId)
        .update({
            status: 1,
        });
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

export function findByFacebookId(facebookId) {
    return db('app_user as a')
        .join('user_auth_provider as u', 'a.user_id', 'u.user_id')
        .where('u.provider_user_id', facebookId)
        .andWhere('u.provider', 'facebook')
        .first();
}

export function addAuthProvider(entity) {
    return db('user_auth_provider').insert(entity);
}

export function patchPassword(userId, newPassword) {
    return db('app_user')
        .where('user_id', userId)
        .update({
            password_hash: newPassword
        });
}
