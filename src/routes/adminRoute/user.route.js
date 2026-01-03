import express from 'express';
import bcrypt from 'bcryptjs';
import * as userService from '../../services/user.service.js';
import * as upgradeService from '../../services/upgrade.service.js';
import { sendPasswordResetEmail } from '../../utils/email.js';

const router = express.Router();

router.get('/', async function(req, res) {
    const list = await userService.getAllUsers();
    const upgradeRequests = await upgradeService.getAllUpgradeRequests();

    res.render('vwAdmin/users', { 
        users: list,
        upgradeRequests: upgradeRequests,
        activeAdmin: 'users',
        layout: 'admin-layout'
    });
});

router.get('/upgrade', async function(req, res) {
    const list = await upgradeService.getAllUpgradeRequests();

    res.render('vwAdmin/upgrade', { 
        upgradeRequests: list,
        activeNav: 'upgrade',
        layout: 'admin-layout'
    });
});

router.post('/upgrade/approve', async function(req, res) {
    const userId = Number(req.body.user_id);

    console.log('Approving upgrade request for user ID:', userId);
    
    try {
        // Update user role to seller (role = 1)
        await userService.updateUserRole(userId, 1);
        
        // Delete the upgrade request
        await upgradeService.updateRequest(userId);
        
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error approving upgrade request:', error);
        res.status(500).send('Error approving request');
    }
});

router.post('/upgrade/reject', async function(req, res) {
    const userId = req.body.user_id;
    
    try {
        // Delete the upgrade request
        await upgradeService.deleteUpgradeRequest(userId);
        
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error rejecting upgrade request:', error);
        res.status(500).send('Error rejecting request');
    }
});

router.post('/remove', async function(req, res) {
    try {
        const { user_id } = req.body;
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if user exists
        const user = await userService.getUserById(user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Delete the user
        await userService.deleteUser(user_id);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user. Please try again.'
        });
    }
});

router.post('/reset-password', async function(req, res) {
    try {
        const { user_id } = req.body;
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Get user details
        const user = await userService.getUserById(user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Generate new password (8 characters)
        const newPassword = Math.random().toString(36).slice(-8);
        
        // Send email with new password
        await sendPasswordResetEmail(user.email, user.full_name, newPassword);
        
        // Update user password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await userService.updateUserPassword(user_id, hashedPassword);
        
        res.json({
            success: true,
            message: 'New password generated and sent to user email'
        });
        
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password. Please try again.'
        });
    }
});

export default router;