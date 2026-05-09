<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useResumeStore } from '../stores/resume';
import { useCandidateStore } from '../stores/candidate';
import type { ICandidateInfo } from '../types/candidate';
import type { iResumeDetail } from '../types/resume';
const props = defineProps<{
    id: number | null;
}>();

const useResume = useResumeStore();
const useCandidate = useCandidateStore();
const resume = ref<iResumeDetail | null>(null);
const isLoading = ref(true);

const formatDate = (dateStr: any) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getFullYear()}`;
};
const candidateInfo = ref<ICandidateInfo | null>(null);
    const fetchResumeData = async () => {
    try {
        isLoading.value = true;

        if (!props.id) return;

        const [resumeData, candidateData] = await Promise.all([
            useResume.getResumeDetailByIdStore(props.id),
            useCandidate.getCandidateInfoStore()
        ]);
        resume.value = resumeData;
        candidateInfo.value = candidateData;

    } catch (error) {
        console.error(error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchResumeData);
watch(() => props.id, fetchResumeData);
</script>

<template>
    <div v-if="isLoading" class="absolute inset-0 bg-[#F8FAFC]/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
        <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
        <span class="text-slate-500 font-bold uppercase tracking-widest text-sm">Đang phân tích hồ sơ...</span>
    </div>
    <div v-else-if="resume">
        
        <div v-if="resume.templateId === 1" id="cv-document" class="max-w-[210mm] mx-auto bg-white shadow-2xl flex flex-col md:flex-row print:flex-row overflow-hidden print:shadow-none print:m-0">
            <div class="w-full md:w-[35%] print:w-[35%] bg-[#14205c] text-white p-8 md:p-10 flex flex-col gap-10 print:bg-[#14205c]">
                <div class="flex flex-col items-center text-center">
                    <img :src="(candidateInfo?.AvatarUrl) || 'https://via.placeholder.com/150'" class="w-40 h-40 rounded-full object-cover border-4 border-white/20 shadow-xl mb-6 bg-white">
                   
                    <h1 class="text-2xl font-black uppercase tracking-widest mb-2 leading-tight">
                        {{ candidateInfo?.FullName }}
                    </h1>
                    <h2 class="text-blue-300 font-bold text-[15px] tracking-wider">{{ resume.title || 'Vị trí công việc' }}</h2>
                </div>

                <div>
                    <h3 class="text-lg font-bold border-b border-white/20 pb-2 mb-4 uppercase tracking-widest">Liên hệ</h3>
                    <div class="space-y-4 text-[13.5px] font-medium text-blue-100">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-envelope mt-1 w-4"></i> <span class="break-all">{{ candidateInfo?.Email }}</span>
                        </div>
                        <div class="flex items-start gap-3">
                            <i class="fas fa-phone mt-1 w-4"></i> <span>{{ candidateInfo?.Phone }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="resume.skills?.length">
                    <h3 class="text-lg font-bold border-b border-white/20 pb-2 mb-4 uppercase tracking-widest">Kỹ năng</h3>
                    <div class="flex flex-col gap-4">
                        <div v-for="(skill, index) in resume.skills" :key="index">
                            <div class="flex justify-between items-end mb-1">
                                <span class="text-[14px] font-bold">{{ skill.skillName }}</span>
                                <span class="text-[10px] text-blue-300 uppercase">{{ skill.level }}</span>
                            </div>
                            <div class="w-full bg-white/10 rounded-full h-1.5">
                                <div class="bg-blue-400 h-1.5 rounded-full" style="width: 80%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="w-full md:w-[65%] print:w-[65%] p-8 md:p-12 flex flex-col gap-10 bg-white">
                <div v-if="resume.summary">
                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-4 flex items-center gap-3">
                        <i class="fas fa-user-tie text-xl text-blue-500"></i> Mục tiêu
                    </h3>
                    <p class="text-gray-600 leading-relaxed text-[15px] text-justify">{{ resume.summary }}</p>
                </div>

                <div v-if="resume.experience?.length">
                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-6 flex items-center gap-3">
                        <i class="fas fa-briefcase text-xl text-blue-500"></i> Kinh nghiệm
                    </h3>
                    <div class="space-y-6 border-l-2 border-gray-100 pl-6">
                        <div v-for="(exp, idx) in resume.experience" :key="idx" class="relative">
                            <div class="absolute -left-[31px] top-1 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-sm"></div>
                            <h4 class="font-bold text-gray-800 text-[16px]">{{ exp.position }}</h4>
                            <p class="text-blue-600 font-bold text-[13px] mb-1">{{ exp.companyName }} | {{ formatDate(exp.startDate) }} - {{ exp.isCurrent ? 'Hiện tại' : formatDate(exp.endDate) }}</p>
                            <p class="text-gray-600 text-[14px] whitespace-pre-line">{{ exp.description }}</p>
                        </div>
                    </div>
                </div>
                <div v-if="resume.projects?.length" class="print-avoid-break">
                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-4 flex items-center gap-3">
                        <i class="fas fa-code-branch text-blue-500"></i> DỰ ÁN NỔI BẬT
                    </h3>

                    <div class="space-y-6">
                        <div v-for="(prj, idx) in resume.projects" :key="'prj' + idx">
                            <h4 class="font-bold text-gray-900 text-[17px] mb-1">{{ prj.projectName }}</h4>
                            <p class="text-[15px] text-gray-500 mb-2">
                                Vai trò: <span class="text-gray-900 font-medium">{{ prj.role }}</span>
                            </p>
                            <p class="text-gray-600 text-[15px] leading-snug mb-3">
                                {{ prj.description }}
                            </p>
                            <div v-if="prj.technologies?.length" class="bg-[#f0f7ff] p-3 rounded-xl inline-block">
                                <p class="text-[14px] text-[#3b82f6] font-bold">
                                    Công nghệ: 
                                    <span>
                                        {{ prj.technologies.map(tech => `"${tech}"`).join(', ') }}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="resume.education?.length">
                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-6 flex items-center gap-3">
                        <i class="fas fa-graduation-cap text-xl text-blue-500"></i> Học vấn
                    </h3>
                    <div class="space-y-4">
                        <div v-for="(edu, idx) in resume.education" :key="idx">
                            <h4 class="font-bold text-gray-800">{{ edu.institution }}</h4>
                            <p class="text-[14px] text-gray-600">{{ edu.degree }} in {{ edu.major }}</p>
                            <p class="text-[12px] text-blue-500 font-bold">{{ formatDate(edu.startDate) }} - {{ formatDate(edu.endDate) }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="resume.templateId === 2" id="cv-document" class="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl flex flex-col p-10 md:p-14 print:shadow-none print:m-0 relative border-t-[12px] border-emerald-600">
            <div class="flex flex-col items-center border-b-2 border-gray-100 pb-8 mb-8 text-center">
                <img 
                    :src="(candidateInfo?.AvatarUrl as string) || 'https://via.placeholder.com/150'" 
                    class="w-32 h-32 rounded-full object-cover mb-5 border-4 border-emerald-50 shadow-sm"
                >
                <h1 class="text-4xl font-black uppercase text-slate-800 tracking-widest mb-2">
                    {{ candidateInfo?.FullName }}
                </h1>
                <h2 class="text-lg font-bold text-emerald-600 tracking-widest uppercase">
                    {{ resume.title || 'Vị trí công việc' }}
                </h2>
                <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5 text-[13.5px] text-slate-600 font-medium">
                    <span v-if="candidateInfo?.Email" class="flex items-center gap-2">
                        <i class="fas fa-envelope text-emerald-600"></i>
                        {{ candidateInfo?.Email }}
                    </span>
                    <span v-if="candidateInfo?.Phone" class="flex items-center gap-2">
                        <i class="fas fa-phone text-emerald-600"></i>
                        {{ candidateInfo?.Phone }}
                    </span>
                    <span v-if="candidateInfo?.Address" class="flex items-center gap-2">
                        <i class="fas fa-map-marker-alt text-emerald-600"></i>
                        {{ candidateInfo?.Address }}
                    </span>
                </div>
            </div>

            <div class="flex flex-col gap-10">
                <div v-if="resume.summary" class="print-avoid-break">
                    <h3 class="text-lg font-black text-slate-800 uppercase mb-3 border-l-4 border-emerald-600 pl-3 tracking-wide">Mục tiêu nghề nghiệp</h3>
                    <p class="text-slate-600 text-[14.5px] leading-relaxed text-justify">{{ resume.summary }}</p>
                </div>

                <div v-if="resume.skills?.length" class="print-avoid-break">
                    <h3 class="text-lg font-black text-slate-800 uppercase mb-4 border-l-4 border-emerald-600 pl-3 tracking-wide">Kỹ năng chuyên môn</h3>
                    <div class="flex flex-wrap gap-2.5">
                        <span v-for="(skill, index) in resume.skills" :key="index" class="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-[13px] font-bold rounded-lg border border-emerald-100">
                            {{ skill.skillName }} <span v-if="skill.level" class="font-normal opacity-70">({{ skill.level }})</span>
                        </span>
                    </div>
                </div>
                <div v-if="resume.experience?.length" class="print-avoid-break">
                    <h3 class="text-lg font-black text-slate-800 uppercase mb-5 border-l-4 border-emerald-600 pl-3 tracking-wide">Kinh nghiệm làm việc</h3>
                    <div class="space-y-6">
                        <div v-for="(exp, index) in resume.experience" :key="'exp-'+index">
                            <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-1">
                                <h4 class="font-bold text-slate-800 text-[16px]">{{ exp.position }}</h4>
                                <span class="text-emerald-600 font-bold text-[13px]">{{ formatDate(exp.startDate) }} - {{ formatDate(exp.endDate) || 'Hiện tại' }}</span>
                            </div>
                            <h5 class="text-[14px] font-bold text-slate-500 mb-2">{{ exp.companyName }}</h5>
                            <p class="text-slate-600 text-[14px] leading-relaxed text-justify whitespace-pre-line">{{ exp.description }}</p>
                        </div>
                    </div>
                </div>
                <div v-if="resume.projects?.length" class="print-avoid-break">
                    <h3 class="text-lg font-black text-slate-800 uppercase mb-5 border-l-4 border-emerald-600 pl-3 tracking-wide">Dự án nổi bật</h3>
                    <div class="grid grid-cols-1 gap-6">
                        <div v-for="(prj, idx) in resume.projects" :key="idx" class="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                            <h4 class="font-bold text-slate-800 text-[16px]">{{ prj.projectName }}</h4>
                            <p class="text-emerald-600 text-[13px] font-bold mb-2">{{ prj.role }}</p>
                            <p class="text-slate-600 text-[14px] mb-3">{{ prj.description }}</p>
                            <div class="flex flex-wrap gap-2">
                                <span v-for="tech in prj.technologies" :key="tech" class="text-[11px] bg-white px-2 py-0.5 rounded border text-gray-500">{{ tech }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="resume.education?.length" class="print-avoid-break">
                    <h3 class="text-lg font-black text-slate-800 uppercase mb-4 border-l-4 border-emerald-600 pl-3 tracking-wide">Trình độ học vấn</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div v-for="(edu, index) in resume.education" :key="'edu-'+index" class="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <h4 class="font-bold text-slate-800 text-[15px] mb-1">{{ edu.institution }}</h4>
                            <p class="text-[14px] text-slate-600"><span class="font-bold">{{ edu.degree }}</span> - {{ edu.major }}</p>
                            <p v-if="edu.gpa" class="text-[13px] text-slate-500 mt-1 font-medium italic">GPA: {{ edu.gpa }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="resume.templateId === 3" id="cv-document" class="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl flex flex-col md:flex-row print:flex-row overflow-hidden print:shadow-none print:m-0 text-slate-800">
            <div class="w-full md:w-[35%] print:w-[35%] bg-slate-50 p-8 border-r border-slate-200 flex flex-col gap-8 print:bg-slate-50">
                <div class="flex flex-col items-center">
                    <img :src="(candidateInfo?.AvatarUrl as string) || 'https://via.placeholder.com/150'" class="w-36 h-36 rounded-[2rem] object-cover shadow-md mb-5 border-4 border-white">
                    <h1 class="text-2xl font-black text-purple-900 text-center uppercase leading-tight">
                        {{ candidateInfo?.FullName }}
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
                        <div v-if="candidateInfo?.Email" class="flex items-start gap-3">
                            <i class="fas fa-envelope mt-1 w-4 text-center text-purple-400"></i>
                            <span class="break-all">{{ candidateInfo?.Email }}</span>
                        </div>
                        <div v-if="candidateInfo?.Phone" class="flex items-start gap-3">
                            <i class="fas fa-phone mt-1 w-4 text-center text-purple-400"></i>
                            <span>{{ candidateInfo?.Phone }}</span>
                        </div>
                        <div v-if="candidateInfo?.Address" class="flex items-start gap-3">
                            <i class="fas fa-map-marker-alt mt-1 w-4 text-center text-purple-400"></i>
                            <span class="leading-relaxed">{{ candidateInfo?.Address }}</span>
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
                                <span class="text-[13px] font-bold text-slate-700">{{ skill.skillName }}</span>
                                <span v-if="skill.level" class="text-[10px] text-purple-500 font-bold uppercase tracking-wider">{{ skill.level }}</span>
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
                    <h3 class="text-xl font-black text-purple-900 uppercase mb-3 flex items-center gap-3">Mục tiêu</h3>
                    <p class="text-slate-600 text-[14px] leading-relaxed text-justify bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                        {{ resume.summary }}
                    </p>
                </div>

                <div v-if="resume.experience?.length" class="print-avoid-break">
                    <h3 class="text-xl font-black text-purple-900 uppercase mb-5 flex items-center gap-3">Kinh nghiệm</h3>
                    <div class="space-y-6 border-l-2 border-purple-100 pl-5 ml-2">
                        <div v-for="(exp, index) in resume.experience" :key="'exp'+index" class="relative">
                            <div class="absolute w-3 h-3 bg-purple-500 rounded-full -left-[27px] top-1.5 ring-4 ring-white"></div>
                            <h4 class="font-bold text-slate-800 text-[15px]">{{ exp.position }}</h4>
                            <div class="text-[13px] font-bold text-purple-600 mb-2 mt-0.5">
                                {{ exp.companyName }}
                                <span class="text-slate-400 font-normal ml-2">
                                    | {{ formatDate(exp.startDate) }} - {{ exp.isCurrent ? 'Hiện tại' : formatDate(exp.endDate) }}
                                </span>
                            </div>
                            <p class="text-slate-600 text-[14px] leading-relaxed whitespace-pre-line text-justify">{{ exp.description }}</p>
                        </div>
                    </div>
                </div>

                <div v-if="resume.projects?.length" class="print-avoid-break">
                    <h3 class="text-xl font-black text-purple-900 uppercase mb-5 flex items-center gap-3">Dự án nổi bật</h3>
                    <div class="space-y-6">
                        <div v-for="(prj, index) in resume.projects" :key="'prj'+index" class="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-bold text-slate-800 text-[15px]">{{ prj.projectName }}</h4>
                                <span class="text-[12px] font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-md">{{ prj.role }}</span>
                            </div>
                            <p class="text-slate-600 text-[14px] leading-relaxed text-justify mb-3">{{ prj.description }}</p>
                            <p v-if="prj.technologies" class="text-[12.5px] text-slate-500 font-medium">
                                <i class="fas fa-code text-purple-400 mr-1"></i>
                                {{ Array.isArray(prj.technologies) ? prj.technologies.join(', ') : prj.technologies }}
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
                                <h4 class="font-bold text-slate-800 text-[15px] mb-1">{{ edu.institution }}</h4>
                                <p class="text-[14px] text-slate-600"><span class="font-bold">{{ edu.degree }}</span> - {{ edu.major }}</p>
                                <p v-if="edu.gpa" class="text-[13px] text-slate-500 mt-1 font-medium">GPA / Xếp loại: {{ edu.gpa }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>