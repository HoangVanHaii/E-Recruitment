import mongoose, { Schema, Document } from 'mongoose';
import { iCandidateDetail } from '../interface/candidate';

const CandidateDetailSchema: Schema = new Schema({
    candidateId: { type: Number, required: true, index: true, unique: true }, 
    experience: [{
        companyName: { type: String, required: true },
        position: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        description: { type: String }
    }],
    education: [{
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        major: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        gpa: { type: String }
    }],
    projects: [{
        projectName: { type: String, required: true },
        role: { type: String, required: true },
        technologies: [{ type: String }],
        link: { type: String },
        description: { type: String }
    }]
}, {
    timestamps: true
});

export default mongoose.model<iCandidateDetail>('CandidateDetail', CandidateDetailSchema);