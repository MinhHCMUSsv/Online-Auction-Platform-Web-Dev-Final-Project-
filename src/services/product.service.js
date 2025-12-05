import db from '../utils/db.js';

export function getAll() {
    return db('product').select();
}

export function getAllCategories() {
    return db('category').select();
}

export function getIDCategoryByName(categoryName) {
    return db('category').where('name', categoryName).select('id').first();
}

export function getByCategory(categoryId) {
    return db('product').where('categoryId', categoryId).select();
} 

export function findPage(limit, offset) {
    return db('product').limit(limit).offset(offset);
}

export function findPageByCat(catId, limit, offset) {
    return db('product').where('category_id', catId)
      .limit(limit).offset(offset);
}

export function countByCat(catId) {
  return db('product').where('category_id', catId)
    .count('product_id as count').first();
}

export function getById(productId) {
    return db('product').where('product_id', productId).first();
}

export function add(product) {
    return db('product').insert(product).returning('product_id');
}