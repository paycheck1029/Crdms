import userService from '../services/userService.js';
import auditService from '../services/auditService.js';
import userRepository from '../repositories/userRepository.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    return sendSuccess(res, users, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const newUser = await userService.createUser({ username, email, password, role });

    await auditService.logActivity(
      req,
      'User Created',
      `Created new user: @${username} (${role})`,
      null,
      newUser
    );

    return sendSuccess(res, newUser, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, password, role } = req.body;

    const oldUser = await userRepository.findById(id);
    if (!oldUser) {
      throw new Error('User not found');
    }

    await userService.updateUser(id, { email, password, role });
    const updatedUser = await userRepository.findById(id);

    // Audit Role Change separately if modified
    if (role && role !== oldUser.role) {
      await auditService.logActivity(
        req,
        'Role Changed',
        `Changed role of @${oldUser.username} from '${oldUser.role}' to '${role}'`,
        { role: oldUser.role },
        { role }
      );
    }

    // Audit Password Changed if modified
    if (password) {
      await auditService.logActivity(
        req,
        'Password Changed',
        `Password updated for user: @${oldUser.username}`
      );
    }

    await auditService.logActivity(
      req,
      'User Updated',
      `Updated user profile: @${oldUser.username}`,
      oldUser,
      updatedUser
    );

    return sendSuccess(res, {}, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldUser = await userRepository.findById(id);
    
    if (!oldUser) {
      throw new Error('User not found');
    }

    await userService.deleteUser(id);

    await auditService.logActivity(
      req,
      'User Deleted',
      `Deleted user account: @${oldUser.username} (${oldUser.role})`,
      oldUser,
      null
    );

    return sendSuccess(res, {}, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
