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
    EmployerStatus: string;
}