import express from 'express';
import * as categoriesService from '../../services/category.service.js';

const router = express.Router();

router.get('/', async function(req, res) {
    const allCategories = await categoriesService.getAll();
    
    // Add hasChildren flag to each category
    const categoriesWithChildren = allCategories.map(cat => {
        const hasChildren = allCategories.some(c => c.parent_id === cat.category_id);
        return { ...cat, hasChildren };
    });
    
    res.render('vwAdmin/categories', { 
        categories: categoriesWithChildren,
        activeAdmin: 'categories',
        layout: 'admin-layout',
        title: 'Categories Management'
    });
});

router.post('/add', async function(req, res) {
    try {
        console.log('Request body:', req.body); // Debug log
        
        const { name, parent_id } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: { type: 'VALIDATION_ERROR', message: 'Category name is required' }
            });
        }

        // Check for duplicate name
        const allCategories = await categoriesService.getAll();
        const isDuplicate = allCategories.some(cat => 
            cat.name.toLowerCase() === name.trim().toLowerCase() && 
            cat.parent_id === (parent_id || null)
        );

        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                error: { type: 'DUPLICATE_NAME', message: 'Category name already exists' }
            });
        }

        const category = {
            name: name.trim(),
            parent_id: parent_id || null
        };

        await categoriesService.addCategory(category);
        
        res.json({ success: true, message: 'Category created successfully' });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({
            success: false,
            error: { type: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});

router.post('/edit', async function(req, res) {
    try {
        const { category_id, name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: { type: 'VALIDATION_ERROR', message: 'Category name is required' }
            });
        }

        // Check for duplicate name (excluding current category)
        const allCategories = await categoriesService.getAll();
        const isDuplicate = allCategories.some(cat => 
            cat.name.toLowerCase() === name.trim().toLowerCase() && 
            cat.category_id !== parseInt(category_id)
        );

        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                error: { type: 'DUPLICATE_NAME', message: 'Category name already exists' }
            });
        }

        const category = {
            name: name.trim()
        };

        await categoriesService.updateCategory(category_id, category);
        
        res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            error: { type: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});

router.get('/check-delete/:id', async function(req, res) {
    try {
        const categoryId = req.params.id;
        
        // Kiểm tra category có tồn tại không
        const category = await categoriesService.getCategoryById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: { type: 'CATEGORY_NOT_FOUND', message: 'Category not found' }
            });
        }
        
        // Đếm số sản phẩm trong category
        const productCount = await categoriesService.countProductsByCategory(categoryId);
        
        if (productCount > 0) {
            return res.json({
                canDelete: false,
                productCount: productCount,
                message: `Category has ${productCount} product(s)`
            });
        }
        
        // Nếu là parent category, kiểm tra có subcategories không
        const allCategories = await categoriesService.getAll();
        const subcategoryCount = allCategories.filter(cat => cat.parent_id === parseInt(categoryId)).length;
        
        if (subcategoryCount > 0) {
            return res.json({
                canDelete: false,
                subcategoryCount: subcategoryCount,
                message: `Category has ${subcategoryCount} subcategory(ies)`
            });
        }
        
        res.json({
            canDelete: true,
            message: 'Category can be deleted'
        });
    } catch (error) {
        console.error('Error checking category:', error);
        res.status(500).json({
            success: false,
            error: { type: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});

router.post('/delete', async function(req, res) {
    try {
        const { category_id } = req.body;
        
        // Kiểm tra category có tồn tại không
        const category = await categoriesService.getCategoryById(category_id);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: { type: 'CATEGORY_NOT_FOUND', message: 'Category not found' }
            });
        }
        
        // Kiểm tra category có sản phẩm không
        const productCount = await categoriesService.countProductsByCategory(category_id);
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                error: { 
                    type: 'HAS_PRODUCTS', 
                    message: 'Cannot delete category with associated products',
                    productCount: productCount
                }
            });
        }
        
        // Nếu là parent category, kiểm tra có subcategories không
        const allCategories = await categoriesService.getAll();
        const subcategoryCount = allCategories.filter(cat => cat.parent_id === parseInt(category_id)).length;
        
        if (subcategoryCount > 0) {
            return res.status(400).json({
                success: false,
                error: { 
                    type: 'HAS_SUBCATEGORIES', 
                    message: 'Cannot delete category with subcategories',
                    subcategoryCount: subcategoryCount
                }
            });
        }
        
        await categoriesService.deleteCategory(category_id);
        
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            error: { type: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});

export default router;





