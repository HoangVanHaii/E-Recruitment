import { body, param } from "express-validator";


const parseJsonArray = (value: any) => {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (error) {
            return value;
        }
    }
    return value;
};

export const buildResumeValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage("Vui lòng điền title!")
        .isLength({ min: 10, max: 255 }).withMessage("Title phải từ 10 đến 255 ký tự!"),

    body('templateId')
        .optional()
        .isInt({ min: 1 }).withMessage("Mã giao diện (TemplateID) không hợp lệ, phải là số nguyên dương!")
        .toInt(),
        
    body('summary')
        .optional()
        .trim(),

    // 2. Thêm customSanitizer vào trước các field mảng
    body('skills')
        .optional()
        .customSanitizer(parseJsonArray) // <--- Parse chuỗi thành Array ở bước này
        .isArray().withMessage("Danh sách kỹ năng phải là một mảng (Array)"),
    
    body('skills.*.skillName')
        .optional()
        .trim()
        .notEmpty().withMessage("Tên kỹ năng không được để trống"),

    body('experience')
        .optional()
        .customSanitizer(parseJsonArray)
        .isArray().withMessage("Kinh nghiệm làm việc phải là một mảng (Array)"),
    
    body('education')
        .optional()
        .customSanitizer(parseJsonArray)
        .isArray().withMessage("Học vấn phải là một mảng (Array)"),

    body('projects')
        .optional()
        .customSanitizer(parseJsonArray)
        .isArray().withMessage("Dự án cá nhân phải là một mảng (Array)")
];
export const generateSummaryValidation = [
    body().custom((value) => {
        if (!value.skills && !value.experience && !value.education) {
            throw new Error("Vui lòng nhập ít nhất Kỹ năng, Kinh nghiệm hoặc Học vấn để AI có dữ liệu viết bài!");
        }
        return true;
    })
];

// Đã đổi tên và sửa logic kiểm tra ID
export const ResumeIdValidation = [
    param('resumeId')
        .notEmpty().withMessage("Sếp quên truyền ID của CV rồi!")
        .isInt({ gt: 0 }).withMessage("Mã CV không hợp lệ (Phải là một số nguyên dương)!")
        .toInt() // Tự động ép kiểu sang số nguyên cho Controller dùng luôn
];