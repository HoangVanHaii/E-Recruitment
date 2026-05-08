import { body, param, query } from "express-validator";

export const upsertProfileValidation = [
    body('FullName')
        .optional()
        .trim()
        .notEmpty().withMessage("Họ và tên không được để trống"),
    
    body('Phone')
        .optional({ checkFalsy: true })
        .trim()
        .isMobilePhone('vi-VN').withMessage("Số điện thoại không đúng định dạng (Việt Nam)"),
    
    body('DateOfBirth')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage("Ngày sinh phải theo định dạng hợp lệ (YYYY-MM-DD)"),
    
    body('Address')
        .optional()
        .trim()
];

export const updateMasterProfileValidation = [
    body('experience')
        .optional()
        .isArray().withMessage("Kinh nghiệm làm việc phải là một danh sách (Array)"),
    
    body('education')
        .optional()
        .isArray().withMessage("Trình độ học vấn phải là một danh sách (Array)"),
        
    body('projects')
        .optional()
        .isArray().withMessage("Dự án tham gia phải là một danh sách (Array)")
];

export const analyzeSkillsTextValidation = [
    body('rawText')
        .trim()
        .notEmpty().withMessage("Vui lòng nhập đoạn văn bản mô tả kỹ năng")
        .isLength({ min: 10 }).withMessage("Mô tả hơi ngắn, vui lòng nhập ít nhất 10 ký tự để AI phân tích chuẩn xác hơn")
];

export const saveAnalyzedSkillsValidation = [
    body('skills')
        .exists().withMessage("Dữ liệu kỹ năng là bắt buộc")
        .isArray({ min: 1 }).withMessage("Danh sách kỹ năng phải là một mảng (Array) và không được rỗng"),
    
    body('skills.*.skillName')
        .trim()
        .notEmpty().withMessage("Tên kỹ năng không được để trống"),
        
    body('skills.*.isNew')
        .isBoolean().withMessage("Trạng thái isNew phải là kiểu boolean (true/false)")
];

export const getCandidatesListValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage("Số trang (page) phải là số nguyên lớn hơn 0"),
    query('limit')
        .optional()
        .isInt({ min: 1 }).withMessage("Giới hạn (limit) phải là số nguyên lớn hơn 0")
];

export const getCandidateDetailValidation = [
    param('id')
        .notEmpty().withMessage("Sếp chưa truyền ID ứng viên trên URL kìa!")
        .isInt({ min: 1 }).withMessage("Mã ID ứng viên phải là một số nguyên dương hợp lệ!")
];