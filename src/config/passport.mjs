import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import db from '../models/index.js';

// Cấu hình Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Tìm user theo googleId
            let user = await db.User.findOne({
                where: { googleId: profile.id }
            });

            if (user) {
                // User đã tồn tại, trả về user
                return done(null, user);
            }

            // Kiểm tra email đã tồn tại chưa
            const email = profile.emails[0].value;
            user = await db.User.findOne({
                where: { email: email }
            });

            if (user) {
                // Email đã tồn tại, liên kết với Google account
                user.googleId = profile.id;
                user.avatar = profile.photos[0]?.value || user.avatar;
                await user.save();
                return done(null, user);
            }

            // Tạo user mới
            const newUser = await db.User.create({
                email: email,
                fullName: profile.displayName,
                googleId: profile.id,
                avatar: profile.photos[0]?.value || null,
                isActive: true,
                roleId: 2 // Customer role
            });

            return done(null, newUser);
        } catch (error) {
            return done(error, null);
        }
    }
));

// Cấu hình Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Tìm user theo facebookId
            let user = await db.User.findOne({
                where: { facebookId: profile.id }
            });

            if (user) {
                // User đã tồn tại, trả về user
                return done(null, user);
            }

            // Kiểm tra email đã tồn tại chưa
            const email = profile.emails?.[0]?.value;
            if (email) {
                user = await db.User.findOne({
                    where: { email: email }
                });

                if (user) {
                    // Email đã tồn tại, liên kết với Facebook account
                    user.facebookId = profile.id;
                    user.avatar = profile.photos?.[0]?.value || user.avatar;
                    await user.save();
                    return done(null, user);
                }
            }

            // Tạo user mới
            const newUser = await db.User.create({
                email: email || `facebook_${profile.id}@temp.com`, // Fallback nếu không có email
                fullName: `${profile.name.givenName} ${profile.name.familyName}`,
                facebookId: profile.id,
                avatar: profile.photos?.[0]?.value || null,
                isActive: true,
                roleId: 2 // Customer role
            });

            return done(null, newUser);
        } catch (error) {
            return done(error, null);
        }
    }
));

// Serialize user vào session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user từ session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
