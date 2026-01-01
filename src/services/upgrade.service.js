import db from '../utils/db.js';

export function addUpgrade(user) {
    return db('upgrade_request').insert(user);
}

export function getUpgradeStatus(userId) {
    return db('upgrade_request')
        .where('bidder_id', userId)
        .orderBy('request_time', 'desc')
        .first();
}