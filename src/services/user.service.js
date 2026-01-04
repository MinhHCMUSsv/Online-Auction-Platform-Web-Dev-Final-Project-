import db from '../utils/db.js';

export function getAllUsers() {
    return db('app_user');
}

export function getUsersPaginated(limit = 10, offset = 0) {
    return db('app_user')
        .limit(limit)
        .offset(offset)
        .orderBy('created_at', 'desc');
}

export function getUsersCount() {
    return db('app_user')
        .count('user_id as count')
        .first();
}

export function getUserById(user_id) {
    return db('app_user')
        .where('user_id', user_id)
        .first();
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

export function updateUserRole(userId, role) {
    return db('app_user')
        .where('user_id', userId)
        .update({ role: role });
}

export function updateUser(userId, updates) {
    return db('app_user')
        .where('user_id', userId)
        .update(updates);
}

export function deleteUser(userId) {
    return db('app_user')
        .where('user_id', userId)
        .del();
}

export function updateUserPassword(userId, newPassword) {
    return db('app_user')
        .where('user_id', userId)
        .update({ password_hash: newPassword });
}

export function toggleUserStatus(userId, status) {
    return db('app_user')
        .where('user_id', userId)
        .update({ status: status });
}

export function checkBanUser(banUser) {
    return db('ban_user')
        .where('product_id', banUser.product_id)
        .andWhere('bidder_id', banUser.bidder_id)
        .first();
}

export function banUser(banUser) {
    return db('ban_user')
        .insert({ product_id: banUser.product_id, bidder_id: banUser.bidder_id });
}

export function findNextHighestBidder(banUser) {
    return db('bid as b')
        .join('app_user as u', 'b.bidder_id', 'u.user_id')
        .where('b.product_id', banUser.product_id)
        .andWhere('b.bidder_id', '!=', banUser.bidder_id)
        .orderBy('b.bid_amount', 'desc')
        .select('b.*', 'u.email', 'u.full_name')
        .first();
}

export function getUserRating(userId) {
    return db('app_user')
        .where('user_id', userId)
        .select('points', 'positive_point')
        .first()
        .then(user => {
            if (!user || !user.points || user.points === 0) {
                return {
                    rating: 0,
                    totalPoints: user ? user.points : 0,
                    positivePoints: user ? user.positive_point : 0,
                    hasRating: false
                };
            }
            
            const rating = (user.positive_point / user.points) * 100;
            return {
                rating: rating,
                totalPoints: user.points,
                positivePoints: user.positive_point,
                hasRating: true
            };
        });
}
