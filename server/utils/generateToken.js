import jwt from 'jsonwebtoken';
import config from '../config/config.js';

const generateToken = (userId) =>
   jwt.sign({ id: userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
   });

export default generateToken;