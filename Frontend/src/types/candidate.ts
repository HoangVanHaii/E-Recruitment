export interface IEducation {
    institution: string;
    degree: string;
    major: string;
    startDate: string | Date;
    endDate?: string | Date; 
    gpa?: string;
}

export interface IExperience {
    companyName: string;
    position: string;
    startDate: string | Date;
    endDate?: string | Date;
    isCurrent?: boolean;
    description?: string;
}

export interface IProject {
    projectName: string;
    role: string;
    technologies?: string[];
    link?: string;
    description?: string;
}

export interface ICandidateDetail {
    education?: IEducation[];
    experience?: IExperience[];
    projects?: IProject[];
}

export interface ICandidateProfile extends Partial<ICandidateDetail> {
    CandidateID?: number;
    FullName: string;
    Phone: string;
    DateOfBirth: string;
    Address: string;
    Email?: string;
    AvatarUrl?: string;
}
export interface ICandidate {
    CandidateID: number;
    FullName: string;
    Phone?: string;
    DateOfBirth?: string;
    Address?: string;
    AvatarUrl?: string;
    CreatedAt?: string;
    Email?: string;
    Status?: string;
}
export interface ICandidateInfo {
    CandidateID?: number;
    FullName: string;
    Phone: string;
    DateOfBirth: string;
    Address: string;
    Email?: string;
    AvatarUrl?: string;
}