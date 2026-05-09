export interface ICreateCompany {
    CompanyName: string;
    CompanyDescription?: string;
    TaxCode: string;
    Industry: string;
    Website?: string;
    LogoUrl?: string;
    ContactEmail?: string;
      City?: string;
    Position: string;
    BusinessLicenseUrl: string | File;
}
  
export interface IJoinCompanyRequest {
    CompanyId: number;
    Position: string;
}

export interface ICompanyResponse{
    CompanyID: number;
    CompanyName: string;
    Industry: string;
    City?: string;
    LogoUrl?: string;
}
export interface ICompanyBasic {
    CompanyID: number;
    CompanyName: string;
    Industry: string;
    LogoUrl?: string;
    TaxCode: string;
    City?: string;
    Status: string;
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
    Status: string;
    CreatedAt: Date;
    UpdatedAt: Date;
}
export interface ICompanyOfMe{
    CompanyID: number;
    CompanyName: string;
    LogoUrl?: string;
}

export interface ICompanyResponse{
    CompanyID: number;
    CompanyName: string;
    Industry: string;
    City?: string;
    LogoUrl?: string;
}
export interface IUpdateCompany{
    CompanyName?: string;
    CompanyDescription?: string;
    TaxCode: string;
    Industry?: string;
    Website?: string;
    LogoUrl?: File | string;
    ContactEmail?: string;
    City?: string;
    BusinessLicenseUrl?: File | string;
}
export interface ICompanyDetail {
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
    Status: string;
    CreatedAt: Date;
    UpdatedAt: Date;
}