import userRepository from '../repositories/userRepository.js';
import bcrypt from 'bcryptjs';

export const getUsers = async () => {
  return userRepository.listAll();
};

export const createUser = async ({ username, email, password, role }) => {
  const existingUser = await userRepository.findByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const existingEmail = await userRepository.findByEmail(email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await userRepository.create({ username, email, passwordHash, role });
  
  return {
    id: result.id,
    username,
    email,
    role
  };
};

export const updateUser = async (id, { email, password, role }) => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Check email conflict
  if (email && email !== user.email) {
    const emailExists = await userRepository.findByEmail(email);
    if (emailExists) {
      throw new Error('Email already in use');
    }
  }

  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  await userRepository.update(id, {
    email: email || user.email,
    role: role || user.role,
    passwordHash
  });

  return { success: true };
};

export const deleteUser = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  await userRepository.deleteUser(id);
  return { success: true };
};

export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
