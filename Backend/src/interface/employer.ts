export interface IEmployer {
    EmployerID: number;
    CompanyID: number;
    Position: string;
    ApprovalStatus?: string; 
}
export interface ITopEmployer {
    EmployerID: number;
    CompanyName: string;
    Location: string;
    LogoUrl: string;
    JobCount: number;
}
export interface IEmployerForAdmin {
    EmployerID: number;
    Email: string;
    Position: string;
    UserStatus: string;
    CompanyName: string;
    LogoUrl: string;
    Industry: string;
    CompanyStatus: string;
}