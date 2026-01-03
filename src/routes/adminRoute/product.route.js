import express from 'express';
import * as productsService from '../../services/product.service.js';
import * as categoriesService from '../../services/category.service.js';
import * as bidService from '../../services/bid.service.js';

const router = express.Router();

router.get('/', async function(req, res) {
    const page = req.query.page || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    // Show all products
    const allProducts = await productsService.getAll();
    const parentCategories = await categoriesService.getFatherCategories();
    
    const total = allProducts.length;
    const nPages = Math.ceil(total / limit);
    const pageNumbers = [];
    
    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page
        });
    }
    
    // Paginate products
    const list = allProducts.slice(offset, offset + limit);
    
    res.render('vwAdmin/products', { 
        products: list,
        parentCategories: parentCategories,
        childCategories: [],
        currentParent: null,
        parentSlug: null,
        childSlug: null,
        pageNumbers: pageNumbers,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        total: total,
        showing: {
            from: offset + 1,
            to: Math.min(offset + limit, total)
        },
        layout: 'admin-layout',
        activeAdmin: 'products'
    });
});

// Route for parent category filter
router.get('/:parentSlug', async function(req, res) {
    const parentSlug = req.params.parentSlug;
    const page = req.query.page || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    // Filter by parent category (show all products in all child categories)
    const parentCategoryId = await categoriesService.getCategory(parentSlug);
    const allProducts = await productsService.getProductsByParentCategory(parentCategoryId);
    
    // Get child categories for dropdown
    const currentParentCategory = await categoriesService.getCategoryBySlug(parentSlug);
    const childCategories = await categoriesService.getChildCategories(parentCategoryId);
    const parentCategories = await categoriesService.getFatherCategories();
    
    const total = allProducts.length;
    const nPages = Math.ceil(total / limit);
    const pageNumbers = [];
    
    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page
        });
    }
    
    // Paginate products
    const list = allProducts.slice(offset, offset + limit);
    
    res.render('vwAdmin/products', { 
        products: list,
        parentCategories: parentCategories,
        childCategories: childCategories,
        currentParent: currentParentCategory,
        parentSlug: parentSlug,
        childSlug: null,
        pageNumbers: pageNumbers,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        total: total,
        showing: {
            from: offset + 1,
            to: Math.min(offset + limit, total)
        },
        layout: 'admin-layout',
        activeAdmin: 'products'
    });
});

// Route for child category filter
router.get('/:parentSlug/:childSlug', async function(req, res) {
    const parentSlug = req.params.parentSlug;
    const childSlug = req.params.childSlug;
    const page = req.query.page || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    // Filter by child category
    const childCategoryId = await categoriesService.getCategory(childSlug);
    const allProducts = await productsService.getProductsByCategory(childCategoryId);
    
    // Get parent info for breadcrumb
    const childCategory = await categoriesService.getCategoryBySlug(childSlug);
    let currentParentCategory = null;
    let childCategories = [];
    
    if (childCategory && childCategory.parent_id) {
        currentParentCategory = await categoriesService.getCategoryById(childCategory.parent_id);
        childCategories = await categoriesService.getChildCategories(childCategory.parent_id);
    }
    
    const parentCategories = await categoriesService.getFatherCategories();
    
    const total = allProducts.length;
    const nPages = Math.ceil(total / limit);
    const pageNumbers = [];
    
    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page
        });
    }
    
    // Paginate products
    const list = allProducts.slice(offset, offset + limit);
    
    res.render('vwAdmin/products', { 
        products: list,
        parentCategories: parentCategories,
        childCategories: childCategories,
        currentParent: currentParentCategory,
        parentSlug: parentSlug,
        childSlug: childSlug,
        pageNumbers: pageNumbers,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        total: total,
        showing: {
            from: offset + 1,
            to: Math.min(offset + limit, total)
        },
        layout: 'admin-layout',
        activeAdmin: 'products'
    });
});

router.get('/details', async function(req, res) {
    const product_id = req.query.product_id;
    const product = await getProductById(product_id);
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('vwProduct/details', { product: product });
});

router.get('/byCategory', async function(req, res) {
    const category_id = req.query.category_id;
    const allProducts = await productsService.getByCategoryID(category_id);
    const categories = await categoriesService.getAll();
    
    const page = req.query.page || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    const total = allProducts.length;
    const nPages = Math.ceil(total / limit);
    const pageNumbers = [];
    
    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page
        });
    }
    
    // Paginate products
    const list = allProducts.slice(offset, offset + limit);
    
    res.render('vwAdmin/products', {    
        products: list,
        categories: categories,
        pageNumbers: pageNumbers,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        total: total,
        showing: {
            from: offset + 1,
            to: Math.min(offset + limit, total)
        },
        categoryFilter: category_id,
        layout: 'admin-layout',
        activeAdmin: 'products'
    });
});

// Delete product route
router.post('/delete', async function(req, res) {
    try {
        const productId = req.body.product_id;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }
        
        // Check if product exists
        const product = await productsService.getProductById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Check if product has bids
        const hasBids = await bidService.checkProductHasBids(productId);
        
        if (hasBids) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete product that has active bids. Please contact bidders first.'
            });
        }
        
        // Delete the product
        await productsService.deleteProduct(productId);
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product. Please try again.'
        });
    }
});

export default router;