import dotenv from 'dotenv';
dotenv.config({ path: './src/config/.env' });
import { Strategy } from 'passport-facebook';
import db from '../../models/index.js';
import successJSON from '../../../config/success.json' assert { type: 'json' };

/**
 * A new instance of the Passport Facebook Strategy.
 *
 * @async
 * @function
 * @returns {Promise<object>} A Promise that resolves with the authenticated user object, without the password field.
 */
const facebookStrategy = new Strategy(
  {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    profileFields: ['id', 'first_name', 'last_name', 'email']
  },
  async function (accessToken, refreshToken, profile, done) {
    const { first_name, last_name, email } = profile._json;

    // Attempt to find or create the user.
    const [user, created] = await db.User.findOrCreate({
      where: { Email: email },
      defaults: {
        Firstname: first_name,
        Lastname: last_name,
        Username: (first_name + last_name).toLowerCase(),
        IsVerified: true
      }
    });

    if (created) {
      // Remove the password field from the user object and pass it to the done() callback with a success message
      delete user.dataValues.Password;
      done(null, user.dataValues, {
        message: successJSON.signin_user.message,
        status: successJSON.signin_user.code,
        redirect: successJSON.signin_user.redirect
      });
    } else {
      done(true);
    }
  }
);

export default facebookStrategy;
