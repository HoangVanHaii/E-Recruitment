import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import companyRouter from './src/router/company'
import { connectDatabase } from './src/config/database';
import { errorHandler } from './src/middleware/errorHandler';
import userRouter from './src/router/user';
import adminRouter from './src/router/admin/user';
import jobApplicationRouter from './src/router/jobApplication'

import skillRouter from './src/router/skill';
import candidateRouter from './src/router/candidate';
import resumeRouter from './src/router/resume';
import employerRouter from './src/router/employer';
import jobRouter from './src/router/job';
import http from 'http'
import { Server } from 'socket.io';
import { setupSocket } from './src/socket';
import messageRouter from './src/router/message'
import savedJobRouter from './src/router/savedJob'
import jobSkillRouter from './src/router/jobSkill'
dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods:["GET", "POST"]
    }
})
setupSocket(io);
app.use(cors());
app.use(express.json());


app.use("/api/company", companyRouter);
app.use("/api/employers", employerRouter);
app.use("/api/jobs", jobRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/job-application', jobApplicationRouter)

app.use('/api/skills', skillRouter); 
app.use('/api/candidates', candidateRouter);
app.use('/api/resumes', resumeRouter);
app.use('/api/messages', messageRouter)
app.use('/api/saved-job', savedJobRouter);
app.use('/api/job-skills', jobSkillRouter);
app.use(errorHandler);
connectDatabase();

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
