import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import RegisterView from '../views/RegisterView.vue'
import VerifyOtp from '../components/VerifyOtp.vue'
import PasswordForm from '../components/PasswordForm.vue'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import JobDetailView from '../views/JobDetailView.vue'
import LoginSectionView from '../views/LoginSectionView.vue'
import RegisterSectionView from '../views/RegisterSectionView.vue'
import RegisterEmployer from '../views/RegisterCompany.vue'
import CreateResumeView from '../views/CreateResumeView.vue'
import MainLayout from '../components/MainLayout.vue'
import FooterLayout from '../components/FooterLayout.vue'
import CandidateProfileView from '../views/CandidateProfileView.vue'
import ResumeDetailView from '../views/ResumeDetailView.vue'

//Employer
import CreateJobView from '../views/CreateJobView.vue'
import PostedJobsView from '../views/PostedJobsView.vue'
import JobApplicationView from '../views/JobApplicationView.vue'
import ApplicationsView from '../views/ApplicationsView.vue'


const routes: Array<RouteRecordRaw> = [
    { path: '/', redirect: '/home' },
    {
        path: '/',
        component: MainLayout,
        children: [
            { path: 'request-otp', name: 'request-otp', component: RegisterView },
            { path: 'verify-otp', name: 'verify-otp', component: VerifyOtp },
            { path: 'register', name: 'register', component: PasswordForm },
            { path: 'login', name: 'login', component: LoginView },
            { path: 'home', name: 'home', component: HomeView },
            { path: 'job-detail/:id', name: 'job-detail', component: JobDetailView },
            { path: 'login-section', name: 'login-section', component: LoginSectionView },
            { path: 'register-section', name: 'register-section', component: RegisterSectionView },
            { path: 'register-employer', name: 'register-employer', component: RegisterEmployer },
            { path: 'create-resume', name: 'create-resume', component: CreateResumeView },
            { path: 'candidate-profile', name: 'candidate-profile', component: CandidateProfileView },
            { path: 'resume/detail/:id', name: 'resume-detail', component: ResumeDetailView }
        ]
    },


    {
        path: '/',
        component: FooterLayout,
        children: [
          { path: 'create-job', name: 'create-job', component: CreateJobView },
          { path: 'posted-jobs', name: 'posted-jobs', component: PostedJobsView },
          { path: 'job-applications', name: 'job-applications', component: JobApplicationView },
          { path: 'applications', name: 'applications', component: ApplicationsView }
        ]
    },
  
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router