import bcrypt from 'bcrypt';
import redisClient from "../config/redisClient";
import *as userService from '../service/user';
import { Request, Response, NextFunction } from "express";
import { sendEmail, verify } from "../utils/otp";
import { AppError } from "../utils/appError";
import { IUser } from "../interface/user";
import { generateToken } from "../utils/token";
export const requestOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const user = await userService.searchUserByEmail(email);
        if (user) {
            return res.status(409).json({ message: "Tài khoản đã tồn tại" });
        }
        const result = await sendEmail(email);

        res.status(200).json({
            success: true,
            message: "Gửi OTP thành công",
            data: result
        });
    } catch (error) {
        next(error);
    }
};
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;
        const result = await verify(email, otp);
        return res.status(200).json({
            success: true,
            message: "Xác thực thành công",
            data: result
        });
    } catch (error) {
        next(error);
    }
}
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { verifyToken, password, role } = req.body;
        const email = await redisClient.get(`verifyToken:${verifyToken}`);
        if (!email) {
            throw new AppError('Verify token không hợp lệ hoặc đã hết hạn', 400);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userService.createUser(email, hashedPassword, role);
        await redisClient.del(`verifyToken:${verifyToken}`);
        return res.status(201).json({
            success: true,
            message: "Tạo tài khoản thành công",
            data: user
        });

    } catch (error) {
        next(error);
    }
}
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const user :IUser = await userService.searchUserByEmail(email);
        if (!user) {
            throw new AppError('Tài khoản không tồn tại', 404);
        }
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
        if (!isPasswordValid) {
            throw new AppError('Mật khẩu không đúng', 401);
        }
        const accessToken = generateToken(user.UserID, user.Role, 'accessToken');
        const refreshToken = generateToken(user.UserID, user.Role, 'refreshToken');

        redisClient.set(`refreshToken:${refreshToken}`, user.UserID, { EX: 7 * 24 * 60 * 60 });
        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            data: {
                accessToken,
                refreshToken,
                role: user.Role
             }
        });
    } catch (error) {
        next(error);
    }
}
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new AppError('Chưa cung cấp refresh token', 400);
        }
        const userId = await redisClient.get(`refreshToken:${refreshToken}`);
        if (!userId) {
            throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
        }   
        const user = await userService.searchUserById(parseInt(userId));
        if (!user) {
            throw new AppError('Tài khoản không tồn tại', 404);
        }
        const newAccessToken = generateToken(user.UserID, user.Role, 'accessToken');
        return res.status(200).json({
            success: true,
            message: "Lấy accessToken thành công",
            data: newAccessToken
        });
    } catch (error) {
        next(error);
    }
}
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new AppError('Chưa cung cấp refresh token', 400);
        }   
        await redisClient.del(`refreshToken:${refreshToken}`);
        return res.status(200).json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        next(error);
    }   
}

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.user!.id);

        const profileData = await userService.getProfileWithCache(userId);
        return res.status(200).json({
            success: true,
            message: "Lấy thông tin hồ sơ thành công",
            data: profileData
        });
    } catch (error) {
        next(error);
    }
}
export const getCurrentRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.user!.id);

        const Role = await userService.getCurrentRole(userId);
        return res.status(200).json({
            success: true,
            message: "Lấy Role thành công",
            data: Role
        });
    } catch (error) {
        next(error);
    }
}

