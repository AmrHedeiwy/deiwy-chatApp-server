import bcrypt from 'bcrypt';
import sequelize from 'sequelize';

import successJson from '../../../config/success.json' assert { type: 'json' };
import cloudinary from '../../../config/cloudinary.js';
import { redisClient } from '../../../config/redis-client.js';

import db from '../../models/index.js';
import {
  ChangePasswordError,
  DeleteAccountError,
  SequelizeConstraintError,
  UserNotFoundError
} from '../../helpers/ErrorTypes.helper.js';

/**
 * Updates the user's profile.
 *
 * @param {object} data - The data containing the new credentials and profile information.
 * @param {object} currentUser - The credentials of the current user whose profile is being updated.
 * @returns {Promise<{message: string, status: number, redirect: string, user: object}>}
 * @throws {Error} - An unexpected error from cloudinary or thrown by the database (sequelize).
 */
export const saveNewCredentials = async (data, currentUser) => {
  try {
    // Uploads an image file to Cloudinary if a file path is provided in the data object.
    if (data.FilePath) {
      const result = await cloudinary.uploader.upload(data.FilePath, {
        format: 'png'
      });

      // Update the image URL with the secure URL from Cloudinary and remove the file path from the data object
      data.Image = result.secure_url;
      delete data.FilePath;
    }

    // Find the user in the database
    const user = await db.User.findOne({
      where: { UserID: currentUser.UserID }
    });

    // Update the user's profile with the new data
    const updatedUser = await user.update(data);

    delete updatedUser.dataValues.Password;

    await redisClient.setEx(
      `user_data:${updatedUser.UserID}`,
      60 * 60 * 24,
      JSON.stringify(updatedUser.dataValues)
    );

    return {
      /**
       * Check if the 'data' object has an 'Email' property.
       * If true, append an additional message to notify the user to verify their email.
       */
      message: data.Email
        ? successJson.update_profile.message + ' Please verify your email.'
        : successJson.update_profile.message,
      status: successJson.update_profile.status,
      redirect: successJson.update_profile.redirect,
      user: updatedUser
    };
  } catch (err) {
    return {
      error:
        err instanceof sequelize.UniqueConstraintError
          ? new SequelizeConstraintError(err) // Use the custom SequelizeConstraintError class to be handled accoringly
          : err // The rest of the sequelize errors are treated as unexpected errors
    };
  }
};

/**
 * Saves the user's new password
 *
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The new password to be set.
 * @param {string} userId - Used to query the database.
 * @returns {Promise<{message: string, status: number}>}
 * @throws {ChangePasswordError} - If the current password does not match the user's stored password.
 */
export const setChangePassword = async (
  currentPassword,
  newPassword,
  userId
) => {
  try {
    const user = await db.User.findByPk(userId);

    // Compare the provided password with the user's hashed password
    const isMatch = await bcrypt.compare(currentPassword, user.Password);

    if (!isMatch) throw new ChangePasswordError();

    user.Password = newPassword;
    user.save();

    return successJson.change_password;
  } catch (err) {
    return { error: err };
  }
};

/**
 * Checks that the email promted by the user matches to confirm account deletion
 * and removes the user from the database.
 *
 * @param {string} email - The promted email by the user.
 * @param {string} user - The user's crednetials.
 * @returns {Promise<{message: string, status: number, redirect: string}>}
 * @throws {DeleteAccountError} - If the current password does not match the user's stored password.
 */
export const deleteAccount = async (email, user) => {
  try {
    if (email != user.Email) throw new DeleteAccountError();

    // Deletes the user from the database
    await db.User.delete({ where: { UserID: user.UserID } });

    // Delete the stored data from the cache
    await redisClient.del(`user_data:${user.UserID}`);

    return successJson.delete_account;
  } catch (err) {
    return { error: err };
  }
};

/**
 * Manages friendship actions such as adding or removing a friend.
 *
 * @param {string} action - The action to perform (add or remove).
 * @param {number} currentUserId - The ID of the current user.
 * @param {number} friendId - The ID of the friend to add or remove.
 * @returns {Promise<{action: boolean}>} - The result object indicating the success of the action.
 * @throws {Error} - Errors will only be thrown by the database (sequelize) and will mostly be ForeignKeyConstraintError.
 */
export const manageFriendship = async (action, curentUserId, friendId) => {
  if (action !== 'add' && action !== 'remove')
    throw new Error('Invalid action at user/manageFriendship');

  try {
    if (action === 'add') {
      await db.Follow.create({
        FollowedID: friendId,
        FollowerID: curentUserId
      });
    }

    if (action === 'remove') {
      await db.Follow.destroy({
        where: {
          FollowedID: friendId,
          FollowerID: curentUserId
        }
      });
    }

    return { isFollowed: action === 'add' ? true : false };
  } catch (err) {
    return {
      error:
        err instanceof sequelize.ForeignKeyConstraintError
          ? new UserNotFoundError()
          : err
    };
  }
};

export default {
  saveNewCredentials,
  setChangePassword,
  deleteAccount,
  manageFriendship
};
