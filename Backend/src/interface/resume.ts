import { Document } from 'mongoose';
import { Multer } from 'multer';

export interface iResume {
    ResumeID?: number;         
    CandidateID: number;
    Title: string;
    ResumeFileUrl?: string;   
    VectorID?: string;        
    Summary?: string;
    IsAnalyzed?: boolean;
    CreatedAt?: Date;
}
export interface iResumeList {
    ResumeID: number;
    Title: string;
    CreatedAt: Date;
    AvatarUrl?: string; 
}
export interface iResumeDetail extends Document {
    resumeId: number;
    // candidateId: number;    
    title?: string;         
    summary?: string;
    AvatarUrl?: string;
    skills?: {
        skillId?: number;    
        skillName: string;
        level?: string;      
    }[];    
    
    experience?: {         
        companyName: string;
        position: string;
        startDate: Date;
        endDate?: Date;
        isCurrent: boolean;
        description?: string;
    }[];
    
    education?: {        
        institution: string;
        degree: string;
        major: string;
        startDate: Date;
        endDate?: Date;
        gpa?: string;
    }[];
    
    projects?: {           
        projectName: string;
        role: string;
        technologies: string[];
        link?: string;
        description?: string;
    }[];

    createdAt?: Date;
    updatedAt?: Date;
}