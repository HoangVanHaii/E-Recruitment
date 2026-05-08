export interface iResumeDetail{
    resumeId?: number;
    title?: string;         
    summary?: string;
    avatarUrl?: string | File;
   
    skills?: {
        skillId?: number;    
        skillName: string;
        level?: string;      
    }[];    
    
    experience?: {         
        companyName: string;
        position: string;
        startDate: Date | string;
        endDate?: Date | string;
        isCurrent: boolean;
        description?: string;
    }[];
    
    education?: {        
        institution: string;
        degree: string;
        major: string;
        startDate: Date | string;
        endDate?: Date | string;
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
  
  interface FormProject {
    projectName: string;
    role: string;
    techString: string; 
    link?: string;
    description?: string;
  }
  
  export interface FormState extends Omit<iResumeDetail, 'projects'> {
    skills: NonNullable<iResumeDetail['skills']>;
    experience: NonNullable<iResumeDetail['experience']>;
    education: NonNullable<iResumeDetail['education']>;
    projects: FormProject[];
}
export interface iResumeList {
    ResumeID: number;
    Title: string;
    CreatedAt: Date;
    AvatarUrl?: string; 
}