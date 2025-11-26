import express from 'express';
import bcrypt, { hash } from 'bcryptjs';
import * as userService from '../services/user.service.js';

const router = express.Router();

router.get('/signup', function(req, res) {
    res.render('accounts/signup', {
        title: 'Sign Up',
        activeNav: 'Sign Up'
    });
});

router.post('/signup', async function(req, res) {
    const hashPassword = bcrypt.hashSync(req.body.password, 10);
    const user = {
        full_name: req.body.fullName,
        email: req.body.email,
        password_hash: hashPassword
    }
    
    await userService.add(user);
    res.redirect('/');
});

router.get('/signin', function(req, res) {
    res.render('accounts/signin', {
        title: 'Sign In',
        activeNav: 'Sign In'
    });
});

router.post('/signin', async function(req, res) {
    const email = req.body.email;
    const user = await userService.findByEmail(email);
    if (!user) {
        return res.render('accounts/signin', {
            err_message: 'Invalid email or password.'
        });
    }

    const password = req.body.password;
    const result = bcrypt.compareSync(password, user.password_hash);
    if (!result) {
        return res.render('accounts/signin', {
            err_message: 'Invalid email or password.'
        });
    }

    req.session.isAuthenticated = true;
    req.session.authUser = user;
    const retUrl = req.session.retUrl || '/';
    delete req.session.retUrl;
    
    res.redirect(retUrl);
});

export default router;