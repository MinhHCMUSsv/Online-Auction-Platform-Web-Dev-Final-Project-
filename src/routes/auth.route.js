import express from 'express';
import passport from 'passport';
import * as userService from '../services/user.service.js';

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/account/signin' }),
  async function(req, res) {
    const googleProfile = req.user;
    const googleId = googleProfile.id;
    const email = googleProfile.emails[0].value;
    const fullName = googleProfile.displayName;
    
    let user = await userService.findByGoogleId(googleId);

    // Đã từng đăng nhập bằng Google -> Cho vào luôn
    if (user) {
        req.session.isAuthenticated = true;
        req.session.authUser = user;
    } 
    // Chưa từng đăng nhập bằng Google
    else {
        // Kiểm tra email có được dùng để đăng ký chưa
        let existingUser = await userService.findByEmail(email);
        // Chưa có email thì tạo mới luôn
        if (!existingUser) {
            const newUser = {
                full_name: fullName,
                email: email,
                address: null,
                password_hash: null,
                points: 0,
                status: 1
            }
            const result = await userService.add(newUser); 
            const newUserId = result[0].user_id;
            existingUser = { ...newUser, user_id: newUserId };
        }
        // Thêm vào user_auth_provider
        await userService.addAuthProvider({
            user_id: existingUser.user_id,
            provider_user_id: googleId,
            provider: googleProfile.provider
        });
        req.session.isAuthenticated = true;
        req.session.authUser = existingUser;
    }

    const retUrl = req.session.retUrl || '/';
    delete req.session.retUrl;
    
    res.redirect(retUrl);
  }
);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/account/signin' }),
  async function(req, res) {
    const fbProfile = req.user;
    const fbId = fbProfile.id;
    const fullName = fbProfile.displayName;

    let email = fbProfile.emails && fbProfile.emails.length > 0 ? fbProfile.emails[0].value : null;

    if (!email) {
        email = `facebook_${fbId}@facebook.no_email`; 
    }
    
    let user = await userService.findByFacebookId(fbId);

    // Đã từng đăng nhập bằng Facebook -> Cho vào luôn
    if (user) {
        req.session.isAuthenticated = true;
        req.session.authUser = user;
    } 
    // Chưa từng đăng nhập bằng Google
    else {
        // Kiểm tra email có được dùng để đăng ký chưa
        let existingUser = await userService.findByEmail(email);
        // Chưa có email thì tạo mới luôn
        if (!existingUser) {
            const newUser = {
                full_name: fullName,
                email: email,
                address: null,       
                password_hash: null,
                points: 0,
                status: 1
            };
            const result = await userService.add(newUser);
            const newUserId = result[0].user_id;
            existingUser = { ...newUser, user_id: newUserId };
        }
        // Thêm vào user_auth_provider
        await userService.addAuthProvider({
            user_id: existingUser.user_id,
            provider_user_id: fbId,
            provider: fbProfile.provider
        });
        req.session.isAuthenticated = true;
        req.session.authUser = existingUser;
    }

    const retUrl = req.session.retUrl || '/';
    delete req.session.retUrl;

    res.redirect(retUrl);
  }
);

export default router;