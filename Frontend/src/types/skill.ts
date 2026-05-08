export interface ISkillDictionary {
    SkillID: number;
    SkillName: string;
}

export interface ICandidateSkill {
    skillId: number | string | null; 
    skillName: string;
    level?: string;
    isNew?: boolean; 
}