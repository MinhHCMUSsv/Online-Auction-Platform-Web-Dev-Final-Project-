import express from 'express';
import * as userService from '../../services/user.service.js';
import * as upgradeService from '../../services/upgrade.service.js';

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
    const userId = req.body.user_id;
    
    try {
        // Update user role to seller (role = 1)
        await userService.updateUserRole(userId, 1);
        
        // Delete the upgrade request
        await upgradeService.deleteUpgradeRequest(userId);
        
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

router.post('/edit', async function(req, res) {
    const userId = req.body.user_id;
    const role = req.body.role === 'seller' ? 1 : (req.body.role === 'admin' ? 2 : 0);
    const status = req.body.status;
    
    try {
        await userService.updateUser(userId, { role, status });
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Error updating user');
    }
});

router.post('/ban', async function(req, res) {
    const userId = req.body.user_id;
    
    try {
        await userService.updateUser(userId, { status: 'banned' });
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).send('Error banning user');
    }
});

router.post('/unban', async function(req, res) {
    const userId = req.body.user_id;
    
    try {
        await userService.updateUser(userId, { status: 'active' });
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).send('Error unbanning user');
    }
});

export default router;