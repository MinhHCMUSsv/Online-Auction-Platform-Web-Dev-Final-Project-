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

export function getAll() {
    return db('category').select();
}

export function getChildCategories(parent_id) {
    return db('category')
        .where('parent_id', parent_id)
        .select();
}

export function getAllChild() {
    return db('category')
        .whereNotNull('parent_id')
        .select();
}

export function getCategoryBySlug(slug) {
    return db('category')
        .where('slug', slug)
        .first();
}

export function getCategoryById(category_id) {
    return db('category')
        .where('category_id', category_id)
        .first();
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

export function countProductsByCategory(category_id) {
    return db('product')
        .where('category_id', category_id)
        .count('product_id as count')
        .first()
        .then(result => result.count);
}