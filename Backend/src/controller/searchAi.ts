import { Request, Response, NextFunction } from 'express';
import * as aiSearchService from '../service/searchAi';
import * as jobService from '../service/job';
export const searchJobsAI = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') return res.status(400).json({ message: "..." });

        const [aiMatches, keywordResults] = await Promise.all([
            aiSearchService.searchJobsByAI(q),
            jobService.searchJobsByKeyword(q)
        ]);

        const allJobIds = new Set([
            ...aiMatches.map(m => m.jobId),
            ...keywordResults.map(j => j.JobID)
        ]);
        if (allJobIds.size === 0) return res.status(200).json({ success: true, data: [] });

        const jobIdsArray = Array.from(allJobIds);
        const placeholders = jobIdsArray.map(() => '?').join(',');
        const fullJobs = await jobService.getJobsByIds(jobIdsArray, placeholders);

        const topJobsToRerank = fullJobs.slice(0, 15);
        const finalSortedJobs = await aiSearchService.rerankWithAI(q, topJobsToRerank);

        return res.status(200).json({
            success: true,
            data: finalSortedJobs
        });

    } catch (error) {
        next(error);
    }
};