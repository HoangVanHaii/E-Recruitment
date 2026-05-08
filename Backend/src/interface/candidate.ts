export interface Candidate {
    CandidateID: number; 
    FullName: string;
    Phone?: string;
    DateOfBirth?: string;
    Address?: string;
    AvatarUrl?: string;
}

export interface iCandidateDetail extends Document {
    candidateId: number;
    experience: [];
    education: [];
    projects: [];
}