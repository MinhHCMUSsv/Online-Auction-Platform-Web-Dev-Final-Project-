import db from '../utils/db.js';

export function getAllUpgradeRequests() {
    return db('upgrade_request as ur')
        .join('app_user as u', 'ur.bidder_id', 'u.user_id')
        .select('ur.*', 'u.full_name', 'u.email', 'u.points');
}

export function approveUpgrade(requestId, adminId) {
    return db('upgrade_request')
        .where('id', requestId)
        .update({ status: 'approved',
                  admin_id: adminId
         }
        );
}