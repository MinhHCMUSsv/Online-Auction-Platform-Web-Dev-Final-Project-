import db from '../utils/db.js';

export function addRating(rating) {
    return db('rating').insert(rating);
}

export function checkExistingRating(transactionId, raterId) {
    return db('rating')
        .where('transaction_id', transactionId)
        .where('rater_id', raterId)
        .first();
}

export function getRatingsByUserId(userId) {
    return db('rating')
        .where('ratee_id', userId)
        .orderBy('created_at', 'desc');
}

export function getPositiveRatingsCount(userId) {
    return db('rating')
        .where('ratee_id', userId)
        .where('is_positive', true)
        .count('* as count')
        .first();
}

export function getNegativeRatingsCount(userId) {
    return db('rating')
        .where('ratee_id', userId)
        .where('is_positive', false)
        .count('* as count')
        .first();
}

export function updateUserPoints(userId, points) {
    return db('user')
        .where('user_id', userId)
        .increment('points', points);
}

export function getAverageRating(userId) {
    return db('rating')
        .where('ratee_id', userId)
        .avg('star_rating as avg_rating')
        .first();
}

export function getAllInfoRatings(userId) {
    return db('rating as r')
        .join('app_user as rater', 'r.rater_id', 'rater.user_id')
        .where('r.ratee_id', userId)
        .select(
            'r.*',
            'rater.full_name'
        )
        .orderBy('r.created_at', 'desc');
}
