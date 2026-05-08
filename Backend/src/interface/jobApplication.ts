import { iResumeDetail } from "./resume";

export interface IJobApplication {
    ApplicationID: number;
    FullName: string;
    Phone: string;
    Email: string;
    Status: string;
    CreatedAt: string;
    MatchScore: number;
    AI_Summary_Review: string;
    ResumeID: number;
    ResumeDetail: iResumeDetail | null;
    JobTitle?: string;
    CompanyName?: string;
    Description?: string;
    SalaryMin?: number;
    SalaryMax?: number;
}
  
export interface IJobApplicationList {
    ApplicationID: number;
    FullName: string;
    ExperienceYears: number;
    AvatarUrl?: string;
    Status: string;
    CreatedAt: string;
    MatchScore: number;
}