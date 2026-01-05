import express from 'express';
import bcrypt from 'bcryptjs';
import moment from 'moment';

import { sendOTP } from '../../utils/email.js';
import { generateOTP } from '../../utils/genOTP.js';

import * as homeService from '../../services/home.service.js';
import * as userService from '../../services/user.service.js';
import * as watchlistService from '../../services/watchlist.service.js';

const router = express.Router();
const CAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;

router.get('/', async function (req, res) {
    try {
            let [topBid, mostActive, endingSoon] = await Promise.all([
                homeService.findTopPrice(5),
                homeService.findMostActive(5),
                homeService.findEndingSoon(5)
            ]);

            if (req.session.isAuthenticated) {
            const userId = req.session.authUser.user_id;
            
            const watchlist = await watchlistService.findByUserId(userId);
            const watchlistIds = watchlist.map(item => item.product_id);

            const mapLikeStatus = function (products) {
                return products.map(p => {
                    return {
                        ...p,
                        is_liked: watchlistIds.includes(p.product_id)
                    }
                });
            };

            topBid = mapLikeStatus(topBid);
            mostActive = mapLikeStatus(mostActive);
            endingSoon = mapLikeStatus(endingSoon);
        }

            res.render('home', {
                title: 'Home',
                activeNav: 'Home',
                topBidProducts: topBid,
                mostActiveProducts: mostActive,
                endingSoonProducts: endingSoon
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
});

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
        action_link: '/verify-otp',
        email: user.email
    });
});

router.get('/verify-otp', function (req, res) {
    const email = req.query.email;
    res.render('OTP', {
        layout: 'auth-layout',
        title: 'OTP Verification',
        action_link: '/verify-otp',
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
        res.redirect('/signin');

    } else {
        res.render('OTP', {
            layout: 'auth-layout',
            email: email,
            action_link: '/verify-otp',
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
            layout: 'auth-layout',
            err_message: 'Invalid email or password.'
        });
    }
    if (user.status === 2) {
        return res.render('vwAccounts/signin', {
            layout: 'auth-layout',
            isBanned: true,
            err_message: 'Your account has been banned by the administrator.'
        });
    }
    if (user.status === 0) {
        return res.redirect(`/verify-otp?email=${user.email}`);
    }

    const password = req.body.password;
    const result = bcrypt.compareSync(password, user.password_hash);
    if (!result) {
        return res.render('vwAccounts/signin', {
            layout: 'auth-layout',
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
            action_link: '/verify-reset-otp'
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
        action_link: '/verify-reset-otp', 
        err_message: 'User not found.' 
    });

    const now = moment();
    const expiry = moment(user.otp_expires_at);

    if (user.otp === +otp && now.isBefore(expiry)) {
        
        req.session.canResetPassword = true;
        req.session.resetEmail = email;
        
        return res.redirect('/reset');
    } else {
        return res.render('OTP', {
            layout: 'auth-layout',
            email: email,
            action_link: '/verify-reset-otp',
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
        return res.redirect('/forgot-password');
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
        return res.redirect('/forgot-password');
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

router.get('/email-available', async function (req, res) {
    const email = req.query.email;
    const user = await userService.findByEmail(email);

    if (!user) {
        return res.json(true);
    }
    return res.json(false);
});

export default router;