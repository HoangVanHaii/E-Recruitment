import *as userService from '../../service/user';
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/appError";

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Received request to update user status with params:", req.params, "and body:", req.body);
        const userId = parseInt(req.params.id as string);
        const { status } = req.body;
        const user = await userService.searchUserById(userId);
        if (!user) {
            throw new AppError('Người dùng không tồn tại', 404);
        }
        await userService.updateUserStatus(userId, status);
        return res.status(200).json({ message: 'Cập nhật trạng thái người dùng thành công' });
    } catch (error) {
        next(error);
    }
}

