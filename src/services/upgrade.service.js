import db from '../utils/db.js';

export function getAllUpgradeRequests() {
    return db('upgrade_request as ur')
        .join('app_user as u', 'ur.bidder_id', 'u.user_id')
        .where('ur.status', 'pending')
        .orderBy('ur.request_time', 'asc')
        .select('ur.*', 'u.full_name', 'u.email', 'u.points');
}

export function approveUpgrade(requestId, adminId) {
    return db('upgrade_request')
        .where('id', requestId)
        .update({ status: 'approved', admin_id: adminId});
}

export function updateRequest(userId) {
    return db('upgrade_request')
        .where('bidder_id', userId)
        .update({ status: 'approved' });
}

export function addUpgrade(user) {
    return db('upgrade_request').insert(user);
}

export function getUpgradeStatus(userId) {
    return db('upgrade_request')
        .where('bidder_id', userId)
        .orderBy('request_time', 'desc')
        .first();
}

export function deleteUpgradeRequest(userId) {
    return db('upgrade_request')
        .where('bidder_id', userId)
        .update({ status: 'rejected' });
}