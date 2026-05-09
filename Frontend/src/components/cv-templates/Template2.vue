
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
    <div id="cv-document" class="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl flex flex-col p-10 md:p-14 print:shadow-none print:m-0 relative border-t-[12px] border-emerald-600">
        
        <div class="flex flex-col items-center border-b-2 border-gray-100 pb-8 mb-8 text-center">
            <img :src="(resume.AvatarUrl as string) || (authStore.user?.ImgUrl as string) || 'https://via.placeholder.com/150'" 
                 class="w-32 h-32 rounded-full object-cover mb-5 border-4 border-emerald-50 shadow-sm">
            
            <h1 class="text-4xl font-black uppercase text-slate-800 tracking-widest mb-2">
                {{ authStore.user?.Name || 'Nguyễn Hải Đăng' }}
            </h1>
            <h2 class="text-lg font-bold text-emerald-600 tracking-widest uppercase">
                {{ resume.title || 'Lập trình viên' }}
            </h2>

            <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5 text-[13.5px] text-slate-600 font-medium">
                <span v-if="authStore.user?.Email" class="flex items-center gap-2"><i class="fas fa-envelope text-emerald-600"></i> {{ authStore.user?.Email }}</span>
                <span v-if="(authStore.user as any)?.Phone" class="flex items-center gap-2"><i class="fas fa-phone text-emerald-600"></i> {{ (authStore.user as any)?.Phone }}</span>
                <span v-if="(authStore.user as any)?.Address" class="flex items-center gap-2"><i class="fas fa-map-marker-alt text-emerald-600"></i> {{ (authStore.user as any)?.Address }}</span>
            </div>
        </div>

        <div class="flex flex-col gap-8">
            
            <div v-if="resume.summary" class="print-avoid-break">
                <h3 class="text-lg font-black text-slate-800 uppercase mb-3 border-l-4 border-emerald-600 pl-3 tracking-wide">Mục tiêu nghề nghiệp</h3>
                <p class="text-slate-600 text-[14.5px] leading-relaxed text-justify">{{ resume.summary }}</p>
            </div>

            <div v-if="resume.skills?.length" class="print-avoid-break">
                <h3 class="text-lg font-black text-slate-800 uppercase mb-4 border-l-4 border-emerald-600 pl-3 tracking-wide">Kỹ năng chuyên môn</h3>
                <div class="flex flex-wrap gap-2.5">
                    <span v-for="(skill, index) in resume.skills" :key="'sk'+index" 
                          class="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-[13px] font-bold rounded-lg border border-emerald-100">
                        {{ (skill as any).skillName || skill }} 
                        <span v-if="(skill as any).level" class="font-normal opacity-70 ml-1">({{ (skill as any).level }})</span>
                    </span>
                </div>
            </div>

            <div v-if="resume.experience?.length" class="print-avoid-break">
                <h3 class="text-lg font-black text-slate-800 uppercase mb-5 border-l-4 border-emerald-600 pl-3 tracking-wide">Kinh nghiệm làm việc</h3>
                <div class="space-y-6">
                    <div v-for="(exp, index) in resume.experience" :key="'exp'+index">
                        <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-1">
                            <h4 class="font-bold text-slate-800 text-[16px]">{{ (exp as any).position }}</h4>
                            <span class="text-emerald-600 font-bold text-[13px]">{{ formatDate((exp as any).startDate) }} - {{ formatDate((exp as any).endDate) || 'Hiện tại' }}</span>
                        </div>
                        <h5 class="text-[14px] font-bold text-slate-500 mb-2">{{ (exp as any).companyName }}</h5>
                        <p class="text-slate-600 text-[14px] leading-relaxed text-justify whitespace-pre-line">{{ (exp as any).description }}</p>
                    </div>
                </div>
            </div>

            <div v-if="resume.projects?.length" class="print-avoid-break">
                <h3 class="text-lg font-black text-slate-800 uppercase mb-5 border-l-4 border-emerald-600 pl-3 tracking-wide">Dự án nổi bật</h3>
                <div class="space-y-6">
                    <div v-for="(prj, index) in resume.projects" :key="'prj'+index">
                        <h4 class="font-bold text-slate-800 text-[16px] mb-1">{{ (prj as any).projectName }}</h4>
                        <p class="text-[13.5px] font-medium text-slate-500 mb-2">Vai trò: <span class="text-slate-800">{{ (prj as any).role }}</span></p>
                        <p class="text-slate-600 text-[14px] leading-relaxed text-justify mb-2">{{ (prj as any).description }}</p>
                        <p v-if="(prj as any).technologies" class="text-[12.5px] text-emerald-700 font-bold">
                            Công nghệ: {{ Array.isArray((prj as any).technologies) ? (prj as any).technologies.join(', ') : (prj as any).technologies }}
                        </p>
                    </div>
                </div>
            </div>

            <div v-if="resume.education?.length" class="print-avoid-break">
                <h3 class="text-lg font-black text-slate-800 uppercase mb-4 border-l-4 border-emerald-600 pl-3 tracking-wide">Trình độ học vấn</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="(edu, index) in resume.education" :key="'edu'+index" class="bg-gray-50 p-4 rounded-xl">
                        <h4 class="font-bold text-slate-800 text-[15px] mb-1">{{ (edu as any).institution }}</h4>
                        <p class="text-[14px] text-slate-600"><span class="font-bold">{{ (edu as any).degree }}</span> - {{ (edu as any).major }}</p>
                        <p v-if="(edu as any).gpa" class="text-[13px] text-slate-500 mt-1 font-medium">GPA / Xếp loại: {{ (edu as any).gpa }}</p>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>
