export interface IJob {
    JobID?: number;
    Title: string;
    Location: string;
    CreatedAt?: Date;
    CompanyName: string;
    CompanyLogo: string;
    Description: string;
    Status: string;
    SalaryMin?: number;
    SalaryMax?: number;
    JobType?: string;
    ApplicationCount?: number;
}
export interface IJobDetail {
    JobID: number;
    EmployerID: number;
    Title: string;
    Location: string;
    CreatedAt: Date;
    CompanyName: string;
    CompanyLogo: string;
    Status: string;
    SalaryMin: number;
    SalaryMax: number;
    JobType: string;
    Quantity: number;
    Description: string;
    WorkingSchedule?: string;
    Requirements: string;
    Benefits: string[];
    Tags: string[];
    RawTextForAi: string;
    InterviewProcess?: IInterviewRound[];
}
export interface IJobPayload {
    EmployerID: number;
    CategoryID: number;
    Title: string;
    Quantity: number;
    SalaryMin: number;
    SalaryMax: number;
    Location: string;
    JobType: string;
    ExperienceRequired: number;
    ExpiredDate: Date;
    VectorID?: string;
}
export interface IInterviewRound {
    roundOrder: number;
    roundTitle: string;
    details: string;
}

export interface IJobDetailPayload {
    Description: string;
    Requirements: string;
    WorkingSchedule?: string;
    Benefits: string[];
    Tags: string[];
    InterviewProcess: IInterviewRound[];
    RawTextForAi: string;
}
export interface IJobFilters {
    Page: number;
    Limit: number;
    CategoryId?: number;
    Location?: string;
    MinSalary?: number;
    MaxSalary?: number;
}


//
export interface IListJob {
    JobID?: number;
    Title: string;
    Location: string;
    CreatedAt?: Date;
    CompanyName: string;
    CompanyLogo: string;
    Description: string;
    Status: string;
    ExpiredDate?: Date | string | null;
    ApplicationCount: number;   
    Views: number;
}