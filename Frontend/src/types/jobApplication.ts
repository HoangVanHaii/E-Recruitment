import type{ iResumeDetail } from "./resume";
export interface IJobApplication {
    ApplicationID: number;
    FullName: string;
    Phone: string;
    Email: string;
    ExperienceYears: number;
    AvatarUrl?: string;
    Status: string;
    CreatedAt: string;
    MatchScore: number;
    AI_Summary_Review: string;
    
    ResumeID: number;
    ResumeDetail: iResumeDetail | null;
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

export interface IAppliedJob {
    CompanyID: number;
    CompanyName: string;
    JobID: number;
    JobTitle: string;         
    ApplicationStatus: string; 
    ExpiredDate: string;
    CreatedAt: string;
    ApplicationID?: number;   
    // AI_Summary_Review?: string; 
}