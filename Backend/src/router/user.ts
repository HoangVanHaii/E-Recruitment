import *as userController from '../controller/user';
import express from 'express';
import { validateRequest } from '../middleware/validateRequest';
import *as userMiddleware from '../middleware/user';
import { authMiddleware } from '../middleware/auth';
const router = express.Router();

router.post('/request-otp', userMiddleware.sendOtpValidation, validateRequest, userController.requestOtp);
router.post('/verify-otp', userMiddleware.verifyOtpValidation, validateRequest, userController.verifyOtp);
router.post('/register', userMiddleware.registerValidation, validateRequest, userController.register);
router.post('/login', userMiddleware.loginValidation, validateRequest, userController.login);
router.post('/refresh-token', userMiddleware.refreshTokenValidation, validateRequest, userController.refreshToken);
router.get('/profile', authMiddleware, userController.getProfile);

router.post('/request-otp-forgot', userController.requestOtpForgotPassword);
router.post('/forgot-password', userController.forgotPassword);
router.put('/change-password', authMiddleware, userController.changePassword);
router.post('/request-otp-auth', authMiddleware, userController.requestOtpAuth);
router.delete('/delete', authMiddleware, userController.deleteAccount);

router.get('/role', authMiddleware, userController.getCurrentRole);

export default router;