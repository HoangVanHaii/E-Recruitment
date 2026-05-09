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
import CreateResumeView from '../views/CreateResumeView.vue'
import MainLayout from '../components/MainLayout.vue'
import FooterLayout from '../components/FooterLayout.vue'
import CandidateProfileView from '../views/CandidateProfileView.vue'
import ResumeDetailView from '../views/ResumeDetailView.vue'
import { useAuthStore } from '../stores/auth'
import SearchByCategory from '../views/SearchByCategory.vue'

//Employer
import CreateJobView from '../views/Employer/CreateJobView.vue'
import PostedJobsView from '../views/Employer/PostedJobsView.vue'
import JobApplicationView from '../views/Employer/JobApplicationView.vue'
import EmployerDashboard from '../views/Employer/EmployerDashboard.vue'
import EmployerProfile from '../views/Employer/EmployerProfile.vue'
import EmployeeRequestsView from '../views/Employer/EmployeeRequestsView..vue'
import EmployerChatView from '../views/Employer/EmployerChatView.vue'

//Admin
import DashBoardAdmin from '../views/admin/DashBoardAdmin.vue'
import CandidateManagement from '../views/admin/CandidateManagement.vue'
import EmployerManagement from '../views/admin/EmployerManagement.vue'
import AllJobManagement from '../views/admin/AllJobManagement.vue'
import AdminProfile from '../views/admin/AdminProfile.vue'
import ChangePassAdmin from '../views/admin/ChangePassAdmin.vue'
import CompanyManagement from '../views/admin/CompanyManagement.vue'

// 403 & 404
import Forbidden from '../views/Forbidden.vue'
import PageNotFound from '../views/PageNotFound.vue'

const routes: Array<RouteRecordRaw> = [
    { path: '/', redirect: '/home' },

    // --- MAIN LAYOUT ---
    {
        path: '/',
        component: MainLayout,
        meta: { roles: [ "Candidate"] },
        children: [
            { path: 'create-resume', name: 'create-resume', component: CreateResumeView },
            { path: 'candidate-profile', name: 'candidate-profile', component: CandidateProfileView },
            { path: 'resume/detail/:id', name: 'resume-detail', component: ResumeDetailView }
        ]
    },
    {
        path: '/',
        component: MainLayout,
        children: [
            { path: 'request-otp', name: 'request-otp', component: RegisterView },
            { path: 'verify-otp', name: 'verify-otp', component: VerifyOtp },
            { path: 'register', name: 'register', component: PasswordForm },
            { path: 'login', name: 'login', component: LoginView },
            { path: 'login-section', name: 'login-section', component: LoginSectionView },
            { path: 'register-section', name: 'register-section', component: RegisterSectionView },
            { path: 'home', name: 'home', component: HomeView },
            { path: 'job-detail/:id', name: 'job-detail', component: JobDetailView },
            { path: 'search-by-category/:id', name: 'search-by-category', component: SearchByCategory }
        ]
    },

    // --- EMPLOYER ---
    {
        path: '/',
        component: FooterLayout,
        meta: { roles: ['Employer'] },
        children: [
            { path: 'create-job', name: 'create-job', component: CreateJobView },
            { path: 'posted-jobs', name: 'posted-jobs', component: PostedJobsView },
            { path: 'job-applications', name: 'job-applications', component: JobApplicationView },
            { path: 'employer-dashboard', name: 'employer-dashboard', component: EmployerDashboard },
            { path: 'employer-profile', name: 'employer-profile', component: EmployerProfile },
            { path: 'employer-requests', name: 'employer-requests', component: EmployeeRequestsView},
            { path: 'employer-chat', name: 'employer-chat', component: EmployerChatView },
        ]
    },

    // --- ADMIN ---
    {
        path: '/admin',
        meta: { roles: ['Admin'] },
        children: [
            { path: 'admin-dashboard', name: 'admin-dashboard', component: DashBoardAdmin },
            { path: 'candidate-management', name: 'candidate-management', component: CandidateManagement },
            { path: 'employer-management', name: 'employer-management', component: EmployerManagement },
            { path: 'all-job-management', name: 'all-job-management', component: AllJobManagement },
            { path: 'all-job-pending', name: 'all-job-pending', component: AllJobManagement, props: { status: 'Pending' } },
            { path: 'all-job-reported', name: 'all-job-reported', component: AllJobManagement, props: { status: 'Reported' } },
            { path: 'admin-profile', name: 'admin-profile', component: AdminProfile },
            { path: 'change-password', name: 'admin-change-password', component: ChangePassAdmin },
            { path: 'company-management', name: 'company-management', component: CompanyManagement }
        ]
    },

    {
        path: '/403',
        name: 'forbidden-403',
        component: Forbidden
    },
    {
        path: '/:pathMatch(.*)*', 
        name: 'not-found-404',
        component: PageNotFound
    }
]


const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, _, next) => {
    const allowedRoles = to.meta.roles as string[] | undefined
    if (!allowedRoles) {
        return next()
    }
    const authStore = useAuthStore()
    if (!authStore.role) {
        await authStore.getCurrentRoleStore()
    }
    const role = authStore.role
    if (!role) {
        return next('/login-section')
    }
    if (!allowedRoles.includes(role)) {
        return next('/403')
    }
    next()
})
export default router