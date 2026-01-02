import express from 'express';
import bcrypt from 'bcryptjs';
import moment from 'moment';

import * as userService from '../services/user.service.js';
import * as productService from '../services/product.service.js';
import * as watchlistService from '../services/watchlist.service.js';
import * as bidService from '../services/bid.service.js';
import * as upgradeService from '../services/upgrade.service.js';
import { sendOTP } from '../utils/email.js';
import { generateOTP } from '../utils/genOTP.js';

const router = express.Router();
const CAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;

router.get('/signup', function (req, res) {
    res.render('vwAccounts/signup', {
        layout: 'auth-layout',
        title: 'Sign Up',
        activeNav: 'Sign Up',
        captchaSiteKey: process.env.CAPTCHA_SITE_KEY
    });
});

router.post('/signup', async function (req, res) {
    const captchaToken = req.body['g-recaptcha-response'];
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${CAPTCHA_SECRET_KEY}&response=${captchaToken}`;

    try {
        const googleRes = await fetch(verifyUrl, { method: 'POST' });
        const googleData = await googleRes.json();

        // Nếu Google bảo False (Là bot hoặc chưa tích)
        if (!googleData.success) {
            return res.render('vwAccounts/signup', {
                layout: 'auth-layout',
                err_message: 'Captcha verification failed. Please confirm you are not a robot.'
            });
        }
    } catch (error) {
        console.log('Captcha Error:', error);
        return res.render('vwAccounts/signup', {
            layout: 'auth-layout',
            err_message: 'Error connecting to Captcha verification.'
        });
    }

    const otp = generateOTP();
    const hashPassword = bcrypt.hashSync(req.body.password, 10);
    const user = {
        full_name: req.body.fullName,
        email: req.body.email,
        address: req.body.address,
        password_hash: hashPassword,
        points: 0
    }
    const ret = await userService.add(user);
    await sendOTP(user.email, otp);
    await userService.patchOTP(otp, ret[0].user_id);

    res.render('OTP', {
        layout: 'auth-layout',
        title: 'OTP Verification',
        action_link: '/account/verify-otp',
        email: user.email
    });
});

router.get('/verify-otp', function (req, res) {
    const email = req.query.email;
    res.render('OTP', {
        layout: 'auth-layout',
        title: 'OTP Verification',
        action_link: '/account/verify-otp',
        email: email
    });
});

router.post('/verify-otp', async function (req, res) {
    const { email, otp } = req.body;
    const user = await userService.findByEmail(email);

    if (!user) return res.send('User does not exist!');

    // Kiểm tra OTP
    const now = moment();
    const expiry = moment(user.otp_expires_at);

    if (user.otp === +otp && now.isBefore(expiry)) {
        // Đúng OTP -> Kích hoạt tài khoản
        await userService.verifyUser(user.user_id);
        res.redirect('/account/signin');

    } else {
        res.render('OTP', {
            layout: 'auth-layout',
            email: email,
            action_link: '/account/verify-otp',
            err_message: 'The OTP is incorrect or has expired.'
        });
    }
});

router.get('/resend-otp', async function (req, res) {
    try {
        const email = req.query.email;
        const user = await userService.findByEmail(email);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        const otp = generateOTP();

        await userService.patchOTP(otp, user.user_id);
        await sendOTP(email, otp);

        return res.json({ success: true });

    } catch (error) {
        console.error('Error sending OTP:', error);
        return res.json({
            success: false,
            message: 'System error. Please try again later.'
        });
    }
});

router.get('/signin', function (req, res) {
    res.render('vwAccounts/signin', {
        layout: 'auth-layout',
        title: 'Sign In',
        activeNav: 'Sign In'
    });
});

router.post('/signin', async function (req, res) {
    const email = req.body.email;
    const user = await userService.findByEmail(email);
    if (!user) {
        return res.render('vwAccounts/signin', {
            err_message: 'Invalid email or password.'
        });
    }
    if (user.status === 0) {
        return res.redirect(`/account/verify-otp?email=${user.email}`);
    }

    const password = req.body.password;
    const result = bcrypt.compareSync(password, user.password_hash);
    if (!result) {
        return res.render('vwAccounts/signin', {
            err_message: 'Invalid email or password.'
        });
    }

    req.session.isAuthenticated = true;
    req.session.authUser = user;

    let url;

    if (user.role === 2) {
        url = '/admin/categories';
        req.session.isAdmin = true;
    }
    else {
        url = '/';
    }

    console.log(url);

    const retUrl = req.session.retUrl || url;
    delete req.session.retUrl;

    res.redirect(retUrl);
});

router.post('/signout', function (req, res) {
    req.session.isAuthenticated = false;
    delete req.session.authUser;
    const returnUrl = req.headers.referer || '/';

    res.redirect(returnUrl);
});

router.get('/profile', function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile';
        return res.redirect('/account/signin');
    }
    res.render('vwAccounts/profile', {
        layout: 'account-layout',
        title: 'Account Settings',
        activeNav: 'AccountSettings',
        showSettings: true,
        user: req.session.authUser
    });
});

router.post('/profile', async function (req, res) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/account/signin');
    }

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

router.get('/forgot-password', function (req, res) {
    res.render('vwAccounts/forgot', {
        layout: 'auth-layout'
    });
});

router.post('/forgot-password', async function (req, res) {
    const { email } = req.body;

    const user = await userService.findByEmail(email);
    if (!user) {
        return res.render('vwAccount/forgot', {
            layout: 'auth-layout',
            err_message: 'This email is not registered!'
        });
    }

    const otp = generateOTP();
    await userService.patchOTP(otp, user.user_id);
    const result = await sendOTP(email, otp);

    if (result) {
        res.render('OTP', {
            layout: 'auth-layout',
            title: 'Recovery Code',
            email: email,
            action_link: '/account/verify-reset-otp'
        });
    } else {
        res.render('vwAccounts/forgot', {
            layout: 'auth-layout',
            err_message: 'Cannot send email. Please try again later.'
        });
    }
});

router.post('/verify-reset-otp', async function (req, res) {
    const { email, otp } = req.body;
    const user = await userService.findByEmail(email);

    if (!user) return res.render('OTP', { 
        layout: 'auth-layout', 
        email, 
        action_link: '/account/verify-reset-otp', 
        err_message: 'User not found.' 
    });

    const now = moment();
    const expiry = moment(user.otp_expires_at);

    if (user.otp === +otp && now.isBefore(expiry)) {
        
        req.session.canResetPassword = true;
        req.session.resetEmail = email;
        
        return res.redirect('/account/reset');
    } else {
        return res.render('OTP', {
            layout: 'auth-layout',
            email: email,
            action_link: '/account/verify-reset-otp',
            err_message: 'Invalid OTP code or it has expired.'
        });
    }
});

router.get('/reset', function (req, res) {
    if (!req.session.canResetPassword || !req.session.resetEmail) {
        return res.redirect('/account/forgot-password');
    }

    res.render('vwAccounts/reset', { 
        layout: 'auth-layout'
    });
});

router.post('/reset', async function (req, res) {
    if (!req.session.canResetPassword || !req.session.resetEmail) {
        return res.redirect('/account/forgot-password');
    }

    const { password, confirm_password } = req.body;
    const email = req.session.resetEmail;

    if (password !== confirm_password) {
        return res.render('vwAccounts/reset', {
            layout: 'auth-layout',
            err_message: 'Confirm password does not match!'
        });
    }

    const user = await userService.findByEmail(email);
    
    if (!user) {
        return res.redirect('/account/forgot-password');
    }

    const hashPassword = bcrypt.hashSync(password, 10);
    await userService.patchPassword(user.user_id, hashPassword);

    delete req.session.canResetPassword;
    delete req.session.resetEmail;

    res.render('vwAccounts/signin', {
        layout: 'auth-layout',
        success_message: 'Password reset successfully! Please login.'
    });
});

router.get('/profile/watchlist', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/watchlist';
        return res.redirect('/account/signin');
    }
    const user = req.session.authUser;
    const watchlist = await watchlistService.findByUserId(user.user_id);
    res.render('vwAccounts/watchlist', {
        layout: 'account-layout',
        title: 'My Watchlist',
        activeNav: 'Watchlist',
        watchlist: watchlist
    });
});

router.get('/profile/active', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/active';
        return res.redirect('/account/signin');
    }

    const user = req.session.authUser;
    const list = await bidService.findActiveBidsByUserId(user.user_id);

    res.render('vwAccounts/activebid', {
        layout: 'account-layout',
        title: 'Active Bids',
        activeNav: 'ActiveBids',
        activeBids: list
    });
});

router.get('/profile/won', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/won';
        return res.redirect('/account/signin');
    }

    const userId = req.session.authUser.user_id;
    const list = await productService.findWonItems(userId);

    res.render('vwAccounts/wonitem', {
        layout: 'account-layout',
        title: 'Won Items',
        activeNav: 'WonItems',
        wonItems: list
    });
});

router.post('/profile/upgrade', async function (req, res) {
    if (!req.session.isAuthenticated) return res.redirect('/account/signin');

    const userId = req.session.authUser.user_id;

    const isPending = await upgradeService.getUpgradeStatus(userId);
    if (isPending) {
        return res.redirect('/account/profile');
    }

    const entity = {
        bidder_id: userId,
        status: 'pending',
    };
    await upgradeService.addUpgrade(entity);

    res.redirect('/account/profile');
});

router.get('/email-available', async function (req, res) {
    const email = req.query.email;
    const user = await userService.findByEmail(email);

    if (!user) {
        return res.json(true);
    }
    return res.json(false);
});

export default router;