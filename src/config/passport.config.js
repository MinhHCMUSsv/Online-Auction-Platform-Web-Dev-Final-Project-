// import passport from 'passport';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as FacebookStrategy } from 'passport-facebook';

// // Cấu hình Strategy Google
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: 'http://localhost:3000/auth/google/callback'
//   },
//   async function(accessToken, refreshToken, profile, done) {
//     try { 
//       return done(null, profile);

//     } catch (err) {
//       return done(err, null);
//     }
//   }
// ));

// // Cấu hình Strategy Facebook
// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: 'http://localhost:3000/auth/facebook/callback',
//     profileFields: ['id', 'displayName', 'email'] 
//   },
//   async function(accessToken, refreshToken, profile, done) {
//     try {
//       return done(null, profile);

//     } catch (err) {
//       return done(err, null);
//     }
//   }
// ));

// // Hàm này dùng để ghi thông tin user vào session
// passport.serializeUser(function(user, done) {
//   done(null, user);
// });

// // Hàm này dùng để đọc thông tin từ session ra và lưu vào req.user
// passport.deserializeUser(function(user, done) {
//   done(null, user);
// });

// export default passport;