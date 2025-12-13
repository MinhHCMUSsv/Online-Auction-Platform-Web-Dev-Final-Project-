import db from '../utils/db.js';

export function getAllCategories() {
    return db('category');
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