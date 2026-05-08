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

import SidebarEmployer from '../components/SidebarEmployer.vue'
//Employer
import CreateJobView from '../views/CreateJobView.vue'
import PostedJobsView from '../views/PostedJobsView.vue'
import JobApplicationView from '../views/JobApplicationView.vue'
import ApplicationsView from '../views/ApplicationsView.vue'
import EmployerDashboard from '../views/EmployerDashboard.vue'
import EmployerProfile from '../views/EmployerProfile.vue'
import EmployeeRequestsView from '../views/EmployeeRequestsView..vue'
import { useAuthStore } from '../stores/auth'

const routes: Array<RouteRecordRaw> = [
    { path: '/', redirect: '/home' },
    {
        path: '/',
        component: MainLayout,
        meta: { roles: ['Employer', 'Admin'] },
        children: [
            { path: 'request-otp', name: 'request-otp', component: RegisterView },
            { path: 'verify-otp', name: 'verify-otp', component: VerifyOtp },
            { path: 'register', name: 'register', component: PasswordForm },
            { path: 'login', name: 'login', component: LoginView },
            { path: 'home', name: 'home', component: HomeView },
            { path: 'job-detail/:id', name: 'job-detail', component: JobDetailView },
            { path: 'login-section', name: 'login-section', component: LoginSectionView },
            { path: 'register-section', name: 'register-section', component: RegisterSectionView },
            { path: 'create-resume', name: 'create-resume', component: CreateResumeView },
        ]
    },


    {
        path: '/',
        component: FooterLayout,
        meta: { roles: ['Employer'] },
        children: [
            { path: 'sidebar-employer', name: 'sidebar-employer', component: SidebarEmployer },
            { path: 'create-job', name: 'create-job', component: CreateJobView },
            { path: 'posted-jobs', name: 'posted-jobs', component: PostedJobsView },
            { path: 'job-applications', name: 'job-applications', component: JobApplicationView },
            { path: 'applications', name: 'applications', component: ApplicationsView },
            { path: 'employer-dashboard', name: 'employer-dashboard', component: EmployerDashboard },
            { path: 'employer-profile', name: 'employer-profile', component: EmployerProfile },
            { path: 'employer-requests', name: 'employer-requests', component: EmployeeRequestsView}
        ]
    },
  
]


const router = createRouter({
    history: createWebHistory(),
    routes
})

// router.beforeEach((to, from, next) => {

//     const authStore = useAuthStore()
//     if (!authStore.user) {
//         // await authStore.getMe()
//     }

//     const role = authStore.user?.r

//     if (to.meta.roles) {

//         const allowedRoles = to.meta.roles as string[]

//         if (!allowedRoles.includes(role!)) {
//             return next('/403')
//         }
//     }

// })
export default router