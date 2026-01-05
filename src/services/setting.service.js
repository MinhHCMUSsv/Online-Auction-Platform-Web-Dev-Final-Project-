import db from "../utils/db.js";

export function getSettings() {
    return db('system_config').first();
}

export function updateSettings(settings) {
    return db('system_config')
        .update(settings);
}