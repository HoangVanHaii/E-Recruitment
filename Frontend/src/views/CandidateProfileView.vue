<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import CandidateSidebar from '../components/CandidateSidebar.vue';
import ResumeProgressMenu from '../components/ResumeProgressMenu.vue';
import ContactForm from '../components/ContactForm.vue'; 
import EducationForm from '../components/EducationForm.vue';
import ExperienceForm from '../components/ExperienceForm.vue';
import ProjectForm from '../components/ProjectForm.vue';
import SkillFrom from '../components/SkillForm.vue';
import CreateCVForm from '../views/CreateResumeView.vue';
import MyResumesView from '../components/MyResumesView.vue'; 
import AppliedJobsView from '../components/AppliedJobsView.vue';
import AccountManagement from '../components/AccountManagement.vue';

import ChatView from './ChatView.vue';

const route = useRoute();
const router = useRouter();
const activeTab = computed(() => (route.query.tab as string) || 'contact');

const activeMainTab = computed(() => {
    const onlineTabs = ['contact', 'account', 'education', 'experience', 'project', 'skill', 'create_cv'];
    if (onlineTabs.includes(activeTab.value)) return 'online_profile';
    return activeTab.value; 
});

const changeTab = (tabName: string) => {
    let targetTab = tabName;
    if (tabName === 'online_profile') targetTab = 'contact';
    
    router.push({
        path: route.path,
        query: { tab: targetTab } 
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
                    <!-- <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">
                <div class="mb-6" v-if="activeTab !== 'chat'">
                    <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">

                        <template v-if="activeMainTab === 'resumes_list'">
                            Quản lý <span class="text-blue-600">CV cá nhân</span>
                        </template>
                        <template v-else>
                            Hồ sơ xin việc <span class="text-blue-600">Online</span>
                        </template>
                    </h1> -->
                </div>

                <div class="flex flex-col lg:flex-row gap-6 items-start" >
                    
                    <div v-if="activeMainTab === 'online_profile' && activeTab !== 'chat'" class="w-full lg:w-[280px] shrink-0 lg:sticky top-6">
                        <ResumeProgressMenu 
                            :current-tab="activeTab" 
                            @change-tab="changeTab" 
                        />
                    </div>

                    <div class="flex-1 w-full min-w-0">
                        <transition name="fade" mode="out-in">
                            <MyResumesView v-if="activeTab === 'resumes_list'" />
                            <AppliedJobsView v-else-if="activeTab === 'applied_jobs'" />
                            <AccountManagement v-else-if="activeTab === 'account_management'" />
                            <!-- <div v-else-if="activeTab === 'completion'" class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center py-20 text-slate-400">
                                <i class="fas fa-chart-pie text-4xl mb-4 text-slate-200"></i>
                                <p class="font-bold text-lg text-slate-500">Giao diện Hoàn thiện hồ sơ sắp ra mắt...</p>
                            </div> -->

                            <ContactForm v-else-if="activeTab === 'contact'" />
                            <!-- <AccountForm v-else-if="activeTab === 'account'" /> -->
                            <EducationForm v-else-if="activeTab === 'education'" />
                            <ExperienceForm v-else-if="activeTab === 'experience'" />
                            <ProjectForm v-else-if="activeTab === 'project'" />
                            <CreateCVForm v-else-if="activeTab === 'create_cv'" />
                            <SkillFrom  v-else-if="activeTab === 'skill'" />
                            <ChatView v-else-if="activeTab === 'chat'" />

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