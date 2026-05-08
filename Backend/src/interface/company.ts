export interface ICreateCompany{
    CompanyName: string;
    CompanyDescription?: string;
    TaxCode: string;
    Industry: string;
    Website?: string;
    LogoUrl?: string | Express.Multer.File;
    ContactEmail?: string;
    City?: string;
    CreatedBy: number;
    BusinessLicenseUrl: string | Express.Multer.File;
}
export interface IUpdateCompany{
    CompanyName?: string;
    CompanyDescription?: string;
    TaxCode: string;
    Industry?: string;
    Website?: string;
    LogoUrl?: string;
    ContactEmail?: string;
    City?: string;
    Position?: string;
    BusinessLicenseUrl?: string;
}
export interface ICompanyResponse{
    CompanyID: number;
    CompanyName: string;
    Industry: string;
    City?: string;
    LogoUrl?: string;
}
export interface ICompanyDetailResponse {
    CompanyID: number;
    CompanyName: string;
    CompanyDescription?: string;
    Industry: string;
    Website?: string;
    LogoUrl?: string;
    TaxCode: string;
    BusinessLicenseUrl: string;
    ContactEmail?: string;
    City?: string;
    Position?: string;  
    Status: boolean;
    CreatedAt: Date;
    UpdatedAt: Date;
}





