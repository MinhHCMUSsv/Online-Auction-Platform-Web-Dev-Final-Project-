import express from 'express';
import bcrypt from 'bcryptjs';
import * as watchlistService from '../../services/watchlist.service.js';
import * as bidService from '../../services/bid.service.js';
import * as productService from '../../services/product.service.js';
import * as upgradeService from '../../services/upgrade.service.js';
import * as userService from '../../services/user.service.js';

const router = express.Router();

router.get('/', function (req, res) {
    res.render('vwAccounts/profile', {
        layout: 'account-layout',
        title: 'Account Settings',
        activeNav: 'AccountSettings',
        showSettings: true,
        user: req.session.authUser
    });
});

router.post('/', async function (req, res) {
    const user = req.session.authUser;
    const { full_name, address, dob, old_password, new_password, confirm_new_password } = req.body;

    const entity = {
        user_id: user.user_id,
        email: user.email,
        full_name: full_name,
        address: address,
        dob: dob || null
    };

    const renderError = function (msg) {
        return res.render('vwAccounts/profile', {
            layout: 'account-layout',
            activeNav: 'AccountSettings',
            showSettings: true,
            user: user,
            err_message: msg
        });
    };

    if (new_password) {
        if (new_password !== confirm_new_password) {
            return renderError('Confirm password does not match.');
        }

        const dbUser = await userService.findByEmail(user.email);
        const ret = bcrypt.compareSync(old_password, dbUser.password_hash);

        if (!ret) {
            return renderError('Current password is incorrect. Profile was NOT updated.');
        }

        const hashPassword = bcrypt.hashSync(new_password, 10);
        await userService.patchPassword(user.user_id, hashPassword);
    }

    await userService.patch(entity);

    req.session.authUser.full_name = entity.full_name;
    req.session.authUser.address = entity.address;
    req.session.authUser.dob = entity.dob;

    res.render('vwAccounts/profile', {
        layout: 'account-layout',
        activeNav: 'AccountSettings',
        showSettings: true,
        user: req.session.authUser,
        success_message: 'Profile updated successfully!'
    });
});

router.get('/watchlist', async function (req, res) {
    const user = req.session.authUser;
    const limit = 6;
    const page = req.query.page || 1;
    const offset = (page - 1) * limit;

    const totalState = await watchlistService.countByUserId(user.user_id);
    const total = totalState.count;
    
    let nPages = Math.floor(total / limit);
    if (total % limit > 0) nPages++;

    const pageNumbers = [];
    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page
        });
    }

    const watchlist = await watchlistService.findByUserId(user.user_id, limit, offset);
    res.render('vwAccounts/watchlist', {
        layout: 'account-layout',
        title: 'My Watchlist',
        activeNav: 'Watchlist',
        watchlist: watchlist,
        empty: watchlist.length === 0,
        pageNumbers: pageNumbers,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null
    });
});

router.get('/active', async function (req, res) {
    const user = req.session.authUser;
    const list = await bidService.findActiveBidsByUserId(user.user_id);

    res.render('vwAccounts/activebid', {
        layout: 'account-layout',
        title: 'Active Bids',
        activeNav: 'ActiveBids',
        activeBids: list
    });
});

router.get('/won', async function (req, res) {
    const userId = req.session.authUser.user_id;
    let list = await productService.findWonItems(userId);

    list = list.map(item => {
        // [TODO]: Bạn thay logic này bằng trường thật trong DB
        // Ví dụ: const isPaid = item.payment_status === 1;
        
        // Hiện tại mình random 50/50 để bạn test giao diện
        const isPaid = Math.random() < 0.5; 

        return {
            ...item,
            // Tạo thêm trường status_text để hiện chữ
            status_text: isPaid ? 'Success' : 'Waiting payment',
            // Tạo thêm trường is_paid để hiện nút Pay hoặc dấu tích
            is_paid: isPaid
        };
    });

    res.render('vwAccounts/wonitem', {
        layout: 'account-layout',
        title: 'Won Items',
        activeNav: 'WonItems',
        wonItems: list
    });
});

router.post('/upgrade', async function (req, res) {
    const userId = req.session.authUser.user_id;

    const isPending = await upgradeService.getUpgradeStatus(userId);
    if (isPending) {
        return res.redirect('/profile');
    }

    const entity = {
        bidder_id: userId,
        status: 'pending',
    };
    await upgradeService.addUpgrade(entity);

    res.redirect('/profile');
});

export default router;