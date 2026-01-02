import db from '../utils/db.js';

export function getCategory(slug) {
    return db('category')
        .where('slug', slug)
        .select('category_id')
        .first()
        .then(row => row ? row.category_id : null);
}

export function getFatherCategories() {
    return db('category')
        .whereNull('parent_id')
        .select();
}

export function getChildCategories(parent_id) {
    return db('category')
        .where('parent_id', parent_id)
        .select();
}

export function addCategory(category) {
    return db('category').insert(category);
}

export function updateCategory(category_id, category) {
    return db('category').where('category_id', category_id).update(category);
}

export function deleteCategory(category_id) {
    return db('category').where('category_id', category_id).del();
}