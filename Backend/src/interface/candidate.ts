export interface Candidate {
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
export interface iCandidateDetail extends Document {
    candidateId: number;
    experience: [];
    education: [];
    projects: [];
    CreatedAt?: string;
    Email?: string;
    Status?: string;
}
export interface ICandidateInfo {
    CandidateID: number;
    FullName: string;
    Phone: string;
    DateOfBirth: string;
    Address: string;
    Email: string;
    AvatarUrl?: string;
}