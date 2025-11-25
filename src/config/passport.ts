import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './env';

// Define User type
export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
}
   
// Configure Google OAuth Strategy
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: config.GOOGLE_CLIENT_ID,
                clientSecret: config.GOOGLE_CLIENT_SECRET,
                callbackURL: config.GOOGLE_CALLBACK_URL,
            },
            (accessToken, refreshToken, profile, done) => {
                // In a real app, you'd save the user to a database here
                const user: User = {
                    id: profile.id,
                    email: profile.emails?.[0]?.value || '',
                    name: profile.displayName,
                    picture: profile.photos?.[0]?.value,
                };
                return done(null, user);
            }
        )
    );
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user: any, done) => {
    done(null, user);
});

export default passport;
