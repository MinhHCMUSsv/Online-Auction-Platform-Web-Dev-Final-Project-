import db from '../utils/db.js';

export function getAll() {
    return db('product').select();
}

export function getAllCategories() {
    return db('category');
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

export function getByCategoryID(categories_id) {
    return db('product').where('category_id', categories_id).select();
}

export function add(product) {
    return db('product').insert(product).returning('product_id');
}

// Detail functions
export function getProductById(product_id) {
    return db('product')
        .where('product_id', product_id).first();
}

export function getSellerById(seller_id) {
    return db('app_user')
        .where('user_id', seller_id)
        .select('full_name as seller_name', 'points as seller_point')
        .first();
}   

export function getBidder(product_id) {
    return db('bid as b')
        .join('app_user as u', 'b.bidder_id', 'u.user_id')
        .where('b.product_id', product_id)
        .orderBy('b.max_auto_bid', 'desc')
        .select('u.*', 'b.bid_amount', 'b.max_auto_bid')
}

// Get comments with nested replies organized by structure
export async function getCommentsWithReplies(product_id) {
    const comments = await db('product_comment as pc')
        .join('app_user as u', 'pc.user_id', 'u.user_id')
        .where('pc.product_id', product_id)
        .select(
            'pc.comment_id as comment_id',
            'pc.parent_comment_id',
            'pc.content',
            'u.full_name as reviewer_name',
            'u.role',
            db.raw("SUBSTR(u.full_name, 1, 1) as reviewer_initials")
        );
    
    // Organize comments into tree structure
    const commentMap = {};
    const rootComments = [];
    
    // First pass: create map and identify root comments
    comments.forEach(comment => {
        commentMap[comment.comment_id] = {
            ...comment,
            replies: []
        };
        
        if (!comment.parent_comment_id) {
            rootComments.push(commentMap[comment.comment_id]);
        }
    });
    
    // Second pass: attach replies to their parent comments
    comments.forEach(comment => {
        if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
            commentMap[comment.parent_comment_id].replies.push(
                commentMap[comment.comment_id]
            );
        }
    });
    
    return rootComments;
}

export function getRelatedProducts(category_id, limit) {
    return db('product')
        .where('category_id', category_id)
        .select()
        .limit(limit);
}

export function placeBid(bidData) {
    return db('bid').insert(bidData);
}

