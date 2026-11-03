import User from '../models/user.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import { sendSuccess, sendError } from '../utils/response.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
   const { name, email, password, role, department, identifier } = req.body;

   const existing = await User.findOne({ email });
   if (existing) {
      return sendError(res, {
         message: 'An account with this email already exists',
         statusCode: 409,
      });
   }

   const safeRole = role === 'faculty' ? 'faculty' : 'student';

   const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      department,
      identifier,
   });


   return sendSuccess(res, {
      statusCode: 201,
      message: 'Account created successfully',
      data: { user },
   });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
   const { email, password } = req.body;

   const user = await User.findOne({ email }).select('+password');

   if (!user || !(await user.comparePassword(password))) {
      return sendError(res, {
         message: 'Invalid email or password',
         statusCode: 401,
      });
   }

   if (!user.isActive) {
      return sendError(res, {
         message: 'Your account has been deactivated. Contact the admin.',
         statusCode: 403,
      });
   }

   const token = generateToken(user._id);

   return sendSuccess(res, {
      message: 'Logged in successfully',
      data: { user, token },
   });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
   return sendSuccess(res, { data: { user: req.user } });
});