<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // Import thêm 2 món này
import CandidateSidebar from '../components/CandidateSidebar.vue';
import ResumeProgressMenu from '../components/ResumeProgressMenu.vue';
import ContactForm from '../components/ContactForm.vue'; 
import AccountForm from '../components/AccountForm.vue';
import EducationForm from '../components/EducationForm.vue';
import ExperienceForm from '../components/ExperienceForm.vue';
import ProjectForm from '../components/ProjectForm.vue';
import SkillFrom from '../components/SkillForm.vue';
import CreateCVForm from '../views/CreateResumeView.vue';
import MyResumesView from '../components/MyResumesView.vue'; 
import AppliedJobsView from '../components/AppliedJobsView.vue';

const route = useRoute();
const router = useRouter();

// 1. Lấy tab hiện tại TRỰC TIẾP từ URL (?tab=...)
// Nếu URL không có ?tab= thì mặc định là 'contact'
const activeTab = computed(() => (route.query.tab as string) || 'contact');

// 2. Tự động suy ra MainTab để tô màu Sidebar
const activeMainTab = computed(() => {
    const onlineTabs = ['contact', 'account', 'education', 'experience', 'project', 'skill', 'create_cv'];
    if (onlineTabs.includes(activeTab.value)) return 'online_profile';
    return activeTab.value; // Trả về 'resumes_list' hoặc 'completion'
});

// 3. HÀM QUAN TRỌNG: Đổi tab là đẩy lên URL chứ không sửa biến ref
const changeTab = (tabName: string) => {
    let targetTab = tabName;
    if (tabName === 'online_profile') targetTab = 'contact';
    
    router.push({
        path: route.path,
        query: { tab: targetTab } // Đẩy tab lên thanh địa chỉ
    });
};
</script>

<template>
    <div class="flex min-h-screen bg-[#f4f7fb]">
        
        <CandidateSidebar 
            class="hidden lg:flex" 
            :activeMainTab="activeMainTab"
            @changeTab="changeTab"
        />

        <div class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div class="max-w-6xl mx-auto">
                <div class="mb-6">
                    <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">
                        <template v-if="activeMainTab === 'resumes_list'">
                            Quản lý <span class="text-blue-600">CV cá nhân</span>
                        </template>
                        <template v-else>
                            Hồ sơ xin việc <span class="text-blue-600">Online</span>
                        </template>
                    </h1>
                </div>

                <div class="flex flex-col lg:flex-row gap-6 items-start">
                    
                    <div v-if="activeMainTab === 'online_profile'" class="w-full lg:w-[280px] shrink-0 lg:sticky top-6">
                        <ResumeProgressMenu 
                            :current-tab="activeTab" 
                            @change-tab="changeTab" 
                        />
                    </div>

                    <div class="flex-1 w-full min-w-0">
                        <transition name="fade" mode="out-in">
                            <MyResumesView v-if="activeTab === 'resumes_list'" />
                            <AppliedJobsView v-else-if="activeTab === 'applied_jobs'" />
                            <!-- <div v-else-if="activeTab === 'completion'" class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center py-20 text-slate-400">
                                <i class="fas fa-chart-pie text-4xl mb-4 text-slate-200"></i>
                                <p class="font-bold text-lg text-slate-500">Giao diện Hoàn thiện hồ sơ sắp ra mắt...</p>
                            </div> -->

                            <ContactForm v-else-if="activeTab === 'contact'" />
                            <AccountForm v-else-if="activeTab === 'account'" />
                            <EducationForm v-else-if="activeTab === 'education'" />
                            <ExperienceForm v-else-if="activeTab === 'experience'" />
                            <ProjectForm v-else-if="activeTab === 'project'" />
                            <CreateCVForm v-else-if="activeTab === 'create_cv'" />
                            <SkillFrom  v-else-if="activeTab === 'skill'" />
                            
                            <div v-else class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center py-20 text-slate-400">
                                <i class="fas fa-tools text-4xl mb-4 text-slate-200"></i>
                                <p class="font-bold text-lg text-slate-500">Tính năng đang phát triển...</p>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>