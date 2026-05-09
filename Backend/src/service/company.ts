import { PoolConnection } from "mysql2/promise";
import pool from "../config/database";
import { ICompanyDetailResponse, ICompanyResponse, ICreateCompany, IUpdateCompany, ICompanyBasic, ICompanyDetail } from "../interface/company";
import { AppError } from "../utils/appError";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import cloudinary from "../config/cloudinary";

export const CreateCompany = async (connection: PoolConnection, company: ICreateCompany): Promise<number> => {

    const userAlreadyHasCompany =await checkUserCreatedCompany(connection, company.CreatedBy);
    if (userAlreadyHasCompany) {
        throw new AppError("Bạn đã tạo công ty rồi", 409);
    }

    const isExistTaxCode = await checkTaxCodeCompany(company.TaxCode);
    if (isExistTaxCode) {
        throw new AppError("Mã số thuế đã tồn tại", 409);
    }
    const query = `
        INSERT INTO Companies 
        (CompanyName, CompanyDescription, Industry, Website, LogoUrl, ContactEmail, City, TaxCode, CreatedBy, BusinessLicenseUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        company.CompanyName,
        company.CompanyDescription ?? null,
        company.Industry,
        company.Website ?? null,
        company.LogoUrl ?? null,
        company.ContactEmail ?? null,
        company.City,
        company.TaxCode,
        company.CreatedBy,
        company.BusinessLicenseUrl
        
    ];
    const [result]: any = await connection.query(query, values);
    return result.insertId;
    
};

export const UpdateCompany = async (CompanyID: number, CompanyData: IUpdateCompany) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const fields: string[] = [];
        const values: any[] = [];
    
        Object.entries(CompanyData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "" && key !== "Position") {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        })
        if (fields.length === 0) throw new AppError("Không có gì để cập nhật", 400);
    
        const query = `UPDATE Companies SET ${fields.join(", ")} WHERE CompanyID = ?`
        values.push(CompanyID);
    
        const [result]: any = await pool.query(query, values);
        if (result.affectedRows === 0) {
            throw new AppError("Công ty không tồn tại", 404);
        }
        if (CompanyData.Position) {
            await updateEmployer(connection, CompanyID, CompanyData.Position);
        }
        await connection.commit();
        return result;
        
    } catch (error) {
        await connection.rollback();
        throw error;
    }
}
export const checkEmployer = async (EmployerID: number)=>{
    const query = `SELECT * FROM Employers WHERE EmployerID = ?`;
    const values = [EmployerID];
    const [result]: any = await pool.query(query, values);
    if (result.length === 0) {
        throw new AppError("Bạn không thuộc công ty nào", 403);
    }
    if (result[0].ApprovalStatus === "Pending") {
        throw new AppError("Yêu cầu của bạn đang chờ phê duyệt", 403);
    }
    else if(result[0].ApprovalStatus === "Rejected"){
        throw new AppError("Yêu cầu của bạn đã bị từ chối", 403);
    }

}   
const updateEmployer = async (connection: PoolConnection, CompanyID: number, Position: string) => {
    const query = `UPDATE Employers SET Position = ? WHERE CompanyID = ?`
    const values = [Position, CompanyID];

    const [result]: any = await connection.query(query, values);

    if (result.affectedRows === 0) {
        throw new AppError("Công ty không tồn tại hoăc đã bị xóa", 404);
    }
    return true;
}
export const UpdateCompanyStatus = async (CompanyID: number, status: string) => {
    const query = `UPDATE Companies SET Status = ? WHERE CompanyID = ?`
    const values = [status, CompanyID];

    const [result]: any = await pool.query(query, values);

    if (result.affectedRows === 0) {
        throw new AppError("Công ty không tồn tại hoăc đã bị xóa", 404);
    }
    return true;
}
export const GetCompanyDetail = async (Role: string, CompanyID: number) => {
    let query = `
        SELECT 
            c.*, 
            e.Position
        FROM Companies c
        JOIN Employers e ON c.CompanyID = e.CompanyID
        WHERE c.CompanyID = ?
    `;
    const values: any = [CompanyID];

    // if (Role !== "Admin") {
    //     query += ' AND Status = ?';
    //     values.push(true);
    // }

    const [result]: any = await pool.query(query, values);

    if (!result || result.length === 0) {
        throw new AppError("Công ty không tồn tại hoặc bạn không có quyền xem", 404);
    }
    return result[0] as ICompanyDetailResponse;

}
export const GetAllCompany = async (Role: string) => {
    const fields = Role === "Admin" ? '*' : 'CompanyID, CompanyName, Industry, City, LogoUrl';
    let query = `SELECT ${fields} FROM Companies`

    const values = [];    
    if (Role !== "Admin") {
        query += ' WHERE Status = true';
        values.push(1);
    }
    const [result]: any = await pool.query(query, values);
    
    return Role === "Admin" ? result as ICompanyDetailResponse[] : result as ICompanyResponse[];
}
export const getAllCompanyForAdmin = async (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    let totalPages: number | undefined = undefined;
    const total: number | undefined = undefined;
    
    if (page == 1) {
        const countQuery = `SELECT COUNT(*) as total FROM Companies`;
        const [countResult]: any = await pool.query(countQuery);
        const total = countResult[0].total;
        totalPages = Math.ceil((total || 0 ) / limit);
    }
    const dataQuery = `
        SELECT CompanyID, CompanyName, Industry, City, LogoUrl, TaxCode, Status
        FROM Companies
        ORDER BY CreatedAt DESC
        LIMIT ? OFFSET ?
    `;
    const values = [limit, offset]; 
    const [dataResult]: any = await pool.query(dataQuery, values);
    
    return {
        items: dataResult as ICompanyBasic[],
        ...(total !== undefined && { total, totalPages })
    }
};
export const getCompanyDetailForAdmin = async (CompanyID: number) => {
    const query = `
        SELECT CompanyID, CompanyName, CompanyDescription, Industry, Website, LogoUrl, TaxCode, BusinessLicenseUrl, ContactEmail, City, Status
        FROM Companies
        WHERE CompanyID = ?
    `;
    const values = [CompanyID];
    const [result]: any = await pool.query(query, values);

    if (!result || result.length === 0) {
        throw new AppError("Công ty không tồn tại hoặc bạn không có quyền xem", 404);
    }
    return result[0] as ICompanyDetail;
}
export const updateCompanyStatusForAdmin = async (CompanyID: number, Status: boolean) => {
    const query = `UPDATE Companies SET Status = ? WHERE CompanyID = ?`
    const values = [Status, CompanyID];

    const [result]: any = await pool.query(query, values);

    if (result.affectedRows === 0) {
        throw new AppError("Công ty không tồn tại hoăc đã bị xóa", 404);
    }
    return true;
}
export const getCompanyIdOfMe = async (userID: number): Promise<number | null> => {
    const sql = `
        SELECT CompanyID
        FROM employers
        WHERE EmployerID = ?
        LIMIT 1
    `;

    const [rows]: any = await pool.query(sql, [userID]);

    if (rows.length === 0) {
        return null;
    }

    return rows[0].CompanyID;
};

export const getCompanyOfMe = async (userId: number) => {
    const query = `
        SELECT c.CompanyID, c.CompanyName, c.LogoUrl
            FROM Employers e
            JOIN Companies c ON c.CompanyID = e.CompanyID
        WHERE e.EmployerID = ? AND e.ApprovalStatus = ? `;
    const [rows]: any = await pool.query(query, [userId, "Approved"]);
    return rows[0];
}
export const CheckCompanyId = async (CompanyID: number): Promise<Boolean> => {
    const query = `SELECT CompanyID FROM Companies WHERE CompanyID = ?`;

    const values = [ CompanyID ];
    const [result]: any = await pool.query(query, values);
    return result.length > 0;        
}
export const checkTaxCodeCompany = async (TaxCode: string): Promise<Boolean> => {
    const query = `SELECT TaxCode FROM Companies WHERE TaxCode = ?`;

    const [result]: any = await pool.query(query, [TaxCode]);
    return result.length > 0;  
}
export const checkUserCreatedCompany = async (connection: PoolConnection, userId: number): Promise<boolean> => {

    const query = `
        SELECT CompanyID
        FROM Companies
        WHERE CreatedBy = ?
        LIMIT 1
    `;

    const [rows]: any = await connection.query(query, [userId]);

    return rows.length > 0;
};
export const handleCompanyUploads = async (files: Express.Multer.File[]) => {
    const data: {
        LogoUrl?: string;
        BusinessLicenseUrl?: string;
    } = {};

    const publicIds: string[] = [];

    const logoFile = files.find(f => f.fieldname === "LogoUrl");
    const licenseFile = files.find(f => f.fieldname === "BusinessLicenseUrl");

    const uploadPromises: Promise<void>[] = [];

    if (logoFile) {
        uploadPromises.push(
            uploadToCloudinary("Company", logoFile).then(result => {
                data.LogoUrl = result.url;
                publicIds.push(result.publicId);
            })
        );
    }
    if (licenseFile) {
        uploadPromises.push(
            uploadToCloudinary("Company", licenseFile).then(result => {
                data.BusinessLicenseUrl = result.url;
                publicIds.push(result.publicId);
            })
        );
    }
    await Promise.all(uploadPromises);

    return {
        data,
        publicIds
    };
};
export const cleanupCloudinary = async (publicIds: string[]) => {
    await Promise.all(
        publicIds.map(id =>
            cloudinary.uploader.destroy(id)
        )
    );
};