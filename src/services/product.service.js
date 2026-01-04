import db from '../utils/db.js';

export function getAll() {
    return db('product as p')
        .join('app_user as u', 'p.seller_id', 'u.user_id')
        .select('p.*', 'u.full_name as seller_name');
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

export function findPage(limit, offset, sortBy = null) {
    let query = db('product').limit(limit).offset(offset);
    
    if (sortBy) {
        switch (sortBy) {
            case 'end_time_asc':
                query = query.orderBy('end_time', 'asc');
                break;
            case 'end_time_desc':
                query = query.orderBy('end_time', 'desc');
                break;
            case 'start_price_asc':
                query = query.orderBy('start_price', 'asc');
                break;
            case 'start_price_desc':
                query = query.orderBy('start_price', 'desc');
                break;
            default:
                // Default sorting by product_id desc (newest first)
                query = query.orderBy('product_id', 'desc');
        }
    } else {
        query = query.orderBy('product_id', 'desc');
    }
    
    return query;
}

export function findPageByCat(catId, limit, offset) {
    return db('product').where('category_id', catId)
        .limit(limit).offset(offset);
}

export function countByCat(catId) {
    return db('product').where('category_id', catId)
        .count('product_id as count').first();
}

export function countByCatID(catId) {
    return db('product').where('category_id', catId)
        .count('product_id as count').first();
}

export function findPageByCatID(catId, limit, offset, sortBy = null) {
    let query = db('product').where('category_id', catId)
        .limit(limit).offset(offset);
    
    if (sortBy) {
        switch (sortBy) {
            case 'end_time_asc':
                query = query.orderBy('end_time', 'asc');
                break;
            case 'end_time_desc':
                query = query.orderBy('end_time', 'desc');
                break;
            case 'start_price_asc':
                query = query.orderBy('start_price', 'asc');
                break;
            case 'start_price_desc':
                query = query.orderBy('start_price', 'desc');
                break;
            default:
                query = query.orderBy('product_id', 'desc');
        }
    } else {
        query = query.orderBy('product_id', 'desc');
    }
    
    return query;
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
        .orderBy('b.created_at')
        .select('u.*', 'b.bid_amount', 'b.max_auto_bid', 'b.created_at');
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

export function findWonItems(userId) {
    return db('product')
        .where('status', 'end')
        .andWhere('leader_id', userId)
        .orderBy('end_time', 'desc'); 
}

export function search(keyword, sortBy = null) {
    let query = db('product')
        .whereRaw(`fts @@ to_tsquery(remove_accents('${keyword}'))`);
    
    if (sortBy) {
        switch (sortBy) {
            case 'end_time_asc':
                query = query.orderBy('end_time', 'asc');
                break;
            case 'end_time_desc':
                query = query.orderBy('end_time', 'desc');
                break;
            case 'start_price_asc':
                query = query.orderBy('start_price', 'asc');
                break;
            case 'start_price_desc':
                query = query.orderBy('start_price', 'desc');
                break;
            default:
                // Default sorting
                query = query.orderBy('product_id', 'desc');
        }
    } else {
        query = query.orderBy('product_id', 'desc');
    }
    
    return query;
}

export function getProductByParentID(parent_id) {
    return db('product as p')
        .join('category as c', 'p.category_id', 'c.category_id')
        .where('c.parent_id', parent_id)
        .select('p.*');
}

export function findPageByParentID(parent_id, limit, offset, sortBy = null) {
    let query = db('product as p')
        .join('category as c', 'p.category_id', 'c.category_id')
        .where('c.parent_id', parent_id)
        .limit(limit)
        .offset(offset)
        .select('p.*');
    
    if (sortBy) {
        switch (sortBy) {
            case 'end_time_asc':
                query = query.orderBy('p.end_time', 'asc');
                break;
            case 'end_time_desc':
                query = query.orderBy('p.end_time', 'desc');
                break;
            case 'start_price_asc':
                query = query.orderBy('p.start_price', 'asc');
                break;
            case 'start_price_desc':
                query = query.orderBy('p.start_price', 'desc');
                break;
            default:
                query = query.orderBy('p.product_id', 'desc');
        }
    } else {
        query = query.orderBy('p.product_id', 'desc');
    }
    
    return query;
}

export function countByParentID(parent_id) {
    return db('product as p')
        .join('category as c', 'p.category_id', 'c.category_id')
        .where('c.parent_id', parent_id)
        .count('p.product_id as count')
        .first();
}

export function updateCurrentPriceAndLeader(productId, updateProductData) {
    return db('product')
        .where('product_id', productId)
        .update(updateProductData);
}

export function getProductsByCategory(categoryId) {
    return db('product as p')
        .join('app_user as u', 'p.seller_id', 'u.user_id')
        .where('p.category_id', categoryId)
        .select('p.*', 'u.full_name as seller_name');
}

export function getProductsByParentCategory(parentCategoryId) {
    return db('product as p')
        .join('app_user as u', 'p.seller_id', 'u.user_id')
        .join('category as c', 'p.category_id', 'c.category_id')
        .where('c.parent_id', parentCategoryId)
        .select('p.*', 'u.full_name as seller_name');
}

// Additional functions for auction checking
export function getExpiredActiveAuctions() {
    return db('product')
        .where('end_time', '<=', db.fn.now())
        .andWhere('status', 'active')
        .select();
}

export function updateAuctionStatus(product_id, status) {
    return db('product')
        .where('product_id', product_id)
        .update({ status });
}