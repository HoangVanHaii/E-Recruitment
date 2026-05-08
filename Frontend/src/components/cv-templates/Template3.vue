

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';
const authStore = useAuthStore();
defineProps<{ resume: any }>();

const formatDate = (dateStr: any) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return ''; 
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
};
</script>
<template>
    <div id="cv-document" class="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl flex flex-col md:flex-row print:flex-row overflow-hidden print:shadow-none print:m-0 text-slate-800">
        
        <div class="w-full md:w-[35%] print:w-[35%] bg-slate-50 p-8 border-r border-slate-200 flex flex-col gap-8 print:bg-slate-50">
            
            <div class="flex flex-col items-center">
                <img :src="(resume.AvatarUrl as string) || (authStore.user?.ImgUrl as string) || 'https://via.placeholder.com/150'" 
                     class="w-36 h-36 rounded-[2rem] object-cover shadow-md mb-5 border-4 border-white">
                <h1 class="text-2xl font-black text-purple-900 text-center uppercase leading-tight">
                    {{ authStore.user?.Name || 'Nguyễn Hải Đăng' }}
                </h1>
                <h2 class="text-[13px] font-bold text-purple-600 mt-2 uppercase tracking-widest text-center border-b-2 border-purple-200 pb-3 w-full">
                    {{ resume.title || 'Lập trình viên' }}
                </h2>
            </div>

            <div>
                <h3 class="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-id-card text-purple-500"></i> Liên hệ
                </h3>
                <div class="space-y-4 text-[13px] font-medium text-slate-600">
                    <div v-if="authStore.user?.Email" class="flex items-start gap-3">
                        <i class="fas fa-envelope mt-1 w-4 text-center text-purple-400"></i>
                        <span class="break-all">{{ authStore.user?.Email }}</span>
                    </div>
                    <div v-if="(authStore.user as any)?.Phone" class="flex items-start gap-3">
                        <i class="fas fa-phone mt-1 w-4 text-center text-purple-400"></i>
                        <span>{{ (authStore.user as any)?.Phone }}</span>
                    </div>
                    <div v-if="(authStore.user as any)?.Address" class="flex items-start gap-3">
                        <i class="fas fa-map-marker-alt mt-1 w-4 text-center text-purple-400"></i>
                        <span class="leading-relaxed">{{ (authStore.user as any)?.Address }}</span>
                    </div>
                </div>
            </div>

            <div v-if="resume.skills?.length">
                <h3 class="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-bolt text-purple-500"></i> Kỹ năng
                </h3>
                <div class="flex flex-col gap-3.5">
                    <div v-for="(skill, index) in resume.skills" :key="'sk'+index">
                        <div class="flex justify-between items-end mb-1.5">
                            <span class="text-[13px] font-bold text-slate-700">{{ (skill as any).skillName || skill }}</span>
                            <span v-if="(skill as any).level" class="text-[10px] text-purple-500 font-bold uppercase tracking-wider">{{ (skill as any).level }}</span>
                        </div>
                        <div class="w-full bg-slate-200 rounded-full h-1.5">
                            <div class="bg-gradient-to-r from-purple-400 to-purple-600 h-1.5 rounded-full shadow-sm" style="width: 85%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="w-full md:w-[65%] print:w-[65%] p-8 md:p-10 flex flex-col gap-8 bg-white">
            
            <div v-if="resume.summary" class="print-avoid-break">
                <h3 class="text-xl font-black text-purple-900 uppercase mb-3 flex items-center gap-3">
                    Mục tiêu
                </h3>
                <p class="text-slate-600 text-[14px] leading-relaxed text-justify bg-purple-50/50 p-4 rounded-2xl border border-purple-100">{{ resume.summary }}</p>
            </div>

            <div v-if="resume.experience?.length" class="print-avoid-break">
                <h3 class="text-xl font-black text-purple-900 uppercase mb-5 flex items-center gap-3">Kinh nghiệm</h3>
                <div class="space-y-6 border-l-2 border-purple-100 pl-5 ml-2">
                    <div v-for="(exp, index) in resume.experience" :key="'exp'+index" class="relative">
                        <div class="absolute w-3 h-3 bg-purple-500 rounded-full -left-[27px] top-1.5 ring-4 ring-white"></div>
                        <h4 class="font-bold text-slate-800 text-[15px]">{{ (exp as any).position }}</h4>
                        <div class="text-[13px] font-bold text-purple-600 mb-2 mt-0.5">
                            {{ (exp as any).companyName }} <span class="text-slate-400 font-normal ml-2">| {{ formatDate((exp as any).startDate) }} - {{ formatDate((exp as any).endDate) || 'Hiện tại' }}</span>
                        </div>
                        <p class="text-slate-600 text-[14px] leading-relaxed whitespace-pre-line text-justify">{{ (exp as any).description }}</p>
                    </div>
                </div>
            </div>

            <div v-if="resume.projects?.length" class="print-avoid-break">
                <h3 class="text-xl font-black text-purple-900 uppercase mb-5 flex items-center gap-3">Dự án nổi bật</h3>
                <div class="space-y-6">
                    <div v-for="(prj, index) in resume.projects" :key="'prj'+index" class="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-bold text-slate-800 text-[15px]">{{ (prj as any).projectName }}</h4>
                            <span class="text-[12px] font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-md">{{ (prj as any).role }}</span>
                        </div>
                        <p class="text-slate-600 text-[14px] leading-relaxed text-justify mb-3">{{ (prj as any).description }}</p>
                        <p v-if="(prj as any).technologies" class="text-[12.5px] text-slate-500 font-medium">
                            <i class="fas fa-code text-purple-400 mr-1"></i> {{ Array.isArray((prj as any).technologies) ? (prj as any).technologies.join(', ') : (prj as any).technologies }}
                        </p>
                    </div>
                </div>
            </div>

            <div v-if="resume.education?.length" class="print-avoid-break">
                <h3 class="text-xl font-black text-purple-900 uppercase mb-5 flex items-center gap-3">Học vấn</h3>
                <div class="space-y-4">
                    <div v-for="(edu, index) in resume.education" :key="'edu'+index" class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-xl">
                            <i class="fas fa-university"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-800 text-[15px] mb-1">{{ (edu as any).institution }}</h4>
                            <p class="text-[14px] text-slate-600"><span class="font-bold">{{ (edu as any).degree }}</span> - {{ (edu as any).major }}</p>
                            <p v-if="(edu as any).gpa" class="text-[13px] text-slate-500 mt-1 font-medium">GPA / Xếp loại: {{ (edu as any).gpa }}</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>