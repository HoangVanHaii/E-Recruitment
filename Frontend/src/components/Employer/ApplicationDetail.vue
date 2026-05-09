
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useApplicationStore } from '../../stores/jobApplication';
import type { IJobApplication } from '../../types/jobApplication';

const useApplication = useApplicationStore();

const props = defineProps({
    applicationId: { type: [Number, null], required: true },
    applicantName: { type: String, default: 'Ứng viên' }
});

const emit = defineEmits(['close', 'approve', 'reject', 'schedule']);

const resumeData = ref<IJobApplication | null>(null);

const fetchResumeData = async () => {
    if (props.applicationId) {
        resumeData.value = await useApplication.getApplicationDetailStore(props.applicationId)
        console.log(resumeData.value)
    }
};

onMounted(async () => {
    document.body.style.overflow = 'hidden';
    await fetchResumeData();
});

onUnmounted(() => {
    document.body.style.overflow = '';
});

const handleClose = () => {
    emit('close');
};
const handleApprove = async () => {
    if (resumeData.value) {
        resumeData.value.Status = "Accepted"; 
    }
    emit('approve', props.applicationId);
    
};

const handleReject = () => {
    if (resumeData.value) {
        resumeData.value.Status = 'Rejected'; 
    }
    emit('reject', props.applicationId);
};

const handleSchedule = () => {
    if (resumeData.value) {
        resumeData.value.Status = 'Interviewing'; 
    }
    emit('schedule', props.applicationId);

};

const formatDate = (dateStr: string) => {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

</script>
<template>
    <div class="relative z-50">
        
        <transition name="fade" appear>
            <div   class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[55]" 
            @click="handleClose"></div>
        </transition>

        <transition name="drawer" appear>
            <div class="fixed inset-y-0 right-0 w-full md:w-[700px] lg:w-[800px] bg-[#F8FAFC] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] z-[60] flex flex-col border-l border-slate-200">
                
                <div class="h-20 flex items-center justify-between px-6 sm:px-8 border-b bg-white shrink-0 z-10">
                    <div class="flex items-center gap-4">
                        <div class="w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <i class="fas fa-user-tie text-lg"></i>
                        </div>
                        <div>
                            <h2 class="font-extrabold text-slate-800 text-xl tracking-tight">{{ applicantName }}</h2>
                            <p class="text-xs text-slate-500 font-medium">Hồ sơ ứng tuyển <span class="font-bold text-blue-600">#{{ applicationId }}</span></p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <button class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors">
                            <i class="fas fa-download mr-1"></i> PDF
                        </button>
                        <button @click="handleClose" class="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex-1 overflow-y-auto custom-scrollbar relative">
                    
                    <div v-if="useApplication.loading" class="absolute inset-0 bg-[#F8FAFC]/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                        <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                        <span class="text-slate-500 font-bold uppercase tracking-widest text-sm">Đang phân tích hồ sơ...</span>
                    </div>

                    <div v-else-if="resumeData" class="p-6 sm:p-8 space-y-8 pb-8">
                        <div v-if="resumeData.AI_Summary_Review" class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100 relative overflow-hidden">
                            <div class="absolute -right-4 -top-4 opacity-10">
                                <i class="fas fa-robot text-8xl text-blue-600"></i>
                            </div>
                            <div class="flex items-center gap-3 mb-3 relative z-10">
                                <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                                    <i class="fas fa-bolt text-xs"></i>
                                </div>
                                <h3 class="text-lg font-black text-blue-900">AI Nhận Xét Nhanh</h3>
                                <span class="ml-auto px-3 py-1 bg-white rounded-lg text-blue-700 font-black text-sm shadow-sm border border-blue-100">
                                    Match: {{ resumeData.MatchScore }}%
                                </span>
                            </div>
                            <p class="text-slate-700 text-sm leading-relaxed font-medium relative z-10 italic">
                                "{{ resumeData.AI_Summary_Review }}"
                            </p>
                        </div>

                        <div v-if="resumeData.ResumeDetail?.templateId === 1" id="cv-document" class="max-w-[210mm] mx-auto bg-white shadow-2xl flex flex-col md:flex-row print:flex-row overflow-hidden print:shadow-none print:m-0">
                            <div class="w-full md:w-[35%] print:w-[35%] bg-[#14205c] text-white p-8 md:p-10 flex flex-col gap-10 print:bg-[#14205c]">
                                <div class="flex flex-col items-center text-center">
                                    <img :src="resumeData.AvatarUrl || 'https://via.placeholder.com/150'" class="w-40 h-40 rounded-full object-cover border-4 border-white/20 shadow-xl mb-6 bg-white">
                                   
                                    <h1 class="text-2xl font-black uppercase tracking-widest mb-2 leading-tight">
                                        {{ resumeData.FullName }}
                                    </h1>
                                    <h2 class="text-blue-300 font-bold text-[15px] tracking-wider">{{ resumeData.ResumeDetail?.title || 'Vị trí công việc' }}</h2>
                                </div>

                                <div>
                                    <h3 class="text-lg font-bold border-b border-white/20 pb-2 mb-4 uppercase tracking-widest">Liên hệ</h3>
                                    <div class="space-y-4 text-[13.5px] font-medium text-blue-100">
                                        <div class="flex items-start gap-3">
                                            <i class="fas fa-envelope mt-1 w-4"></i> <span class="break-all">{{ resumeData.Email }}</span>
                                        </div>
                                        <div class="flex items-start gap-3">
                                            <i class="fas fa-phone mt-1 w-4"></i> <span>{{ resumeData.Phone }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="resumeData.ResumeDetail?.skills?.length">
                                    <h3 class="text-lg font-bold border-b border-white/20 pb-2 mb-4 uppercase tracking-widest">Kỹ năng</h3>
                                    <div class="flex flex-col gap-4">
                                        <div v-for="(skill, index) in resumeData.ResumeDetail.skills" :key="index">
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
                                <div v-if="resumeData.ResumeDetail?.summary">
                                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-4 flex items-center gap-3">
                                        <i class="fas fa-user-tie text-xl text-blue-500"></i> Mục tiêu
                                    </h3>
                                    <p class="text-gray-600 leading-relaxed text-[15px] text-justify">{{ resumeData.ResumeDetail.summary }}</p>
                                </div>

                                <div v-if="resumeData.ResumeDetail?.experience?.length">
                                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-6 flex items-center gap-3">
                                        <i class="fas fa-briefcase text-xl text-blue-500"></i> Kinh nghiệm
                                    </h3>
                                    <div class="space-y-6 border-l-2 border-gray-100 pl-6">
                                        <div v-for="(exp, idx) in resumeData.ResumeDetail.experience" :key="idx" class="relative">
                                            <div class="absolute -left-[31px] top-1 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-sm"></div>
                                            <h4 class="font-bold text-gray-800 text-[16px]">{{ exp.position }}</h4>
                                            <p class="text-blue-600 font-bold text-[13px] mb-1">{{ exp.companyName }} | {{ formatDate(exp.startDate.toString()) }} - {{ exp.isCurrent ? 'Hiện tại' : formatDate(exp.endDate?.toString() || "") }}</p>
                                            <p class="text-gray-600 text-[14px] whitespace-pre-line">{{ exp.description }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="resumeData.ResumeDetail.projects?.length" class="print-avoid-break">
                                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-4 flex items-center gap-3">
                                        <i class="fas fa-code-branch text-blue-500"></i> DỰ ÁN NỔI BẬT
                                    </h3>

                                    <div class="space-y-6">
                                        <div v-for="(prj, idx) in resumeData.ResumeDetail.projects" :key="'prj' + idx">
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
                                <div v-if="resumeData.ResumeDetail?.education?.length">
                                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-6 flex items-center gap-3">
                                        <i class="fas fa-graduation-cap text-xl text-blue-500"></i> Học vấn
                                    </h3>
                                    <div class="space-y-4">
                                        <div v-for="(edu, idx) in resumeData.ResumeDetail.education" :key="idx">
                                            <h4 class="font-bold text-gray-800">{{ edu.institution }}</h4>
                                            <p class="text-[14px] text-gray-600">{{ edu.degree }} in {{ edu.major }}</p>
                                            <p class="text-[12px] text-blue-500 font-bold">{{ formatDate(edu.startDate.toString()) }} - {{ formatDate(edu.endDate?.toString() || "") }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="resumeData.ResumeDetail?.templateId === 2" id="cv-document" class="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl flex flex-col p-10 md:p-14 print:shadow-none print:m-0 relative border-t-[12px] border-emerald-600">
                            <div class="flex flex-col items-center border-b-2 border-gray-100 pb-8 mb-8 text-center">
                                <img :src="resumeData.AvatarUrl || 'https://via.placeholder.com/150'" class="w-40 h-40 rounded-full object-cover border-4 border-white/20 shadow-xl mb-6 bg-white">
                                   
                                <h1 class="text-4xl font-black uppercase text-slate-800 tracking-widest mb-2">
                                    {{ resumeData.FullName }}
                                </h1>
                                <h2 class="text-lg font-bold text-emerald-600 tracking-widest uppercase">
                                    {{ resumeData.ResumeDetail?.title || 'Vị trí công việc' }}
                                </h2>
                                <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5 text-[13.5px] text-slate-600 font-medium">
                                    <span><i class="fas fa-envelope text-emerald-600 mr-2"></i>{{ resumeData.Email }}</span>
                                    <span><i class="fas fa-phone text-emerald-600 mr-2"></i>{{ resumeData.Phone }}</span>
                                </div>
                            </div>

                            <div class="flex flex-col gap-10">
                                <div v-if="resumeData.ResumeDetail?.summary" class="print-avoid-break">
                                    <h3 class="text-lg font-black text-slate-800 uppercase mb-3 border-l-4 border-emerald-600 pl-3 tracking-wide">Mục tiêu nghề nghiệp</h3>
                                    <p class="text-slate-600 text-[14.5px] leading-relaxed text-justify">{{ resumeData.ResumeDetail.summary }}</p>
                                </div>

                                <div v-if="resumeData.ResumeDetail?.skills?.length" class="print-avoid-break">
                                    <h3 class="text-lg font-black text-slate-800 uppercase mb-4 border-l-4 border-emerald-600 pl-3 tracking-wide">Kỹ năng chuyên môn</h3>
                                    <div class="flex flex-wrap gap-2.5">
                                        <span v-for="(skill, index) in resumeData.ResumeDetail.skills" :key="index" class="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-[13px] font-bold rounded-lg border border-emerald-100">
                                            {{ skill.skillName }} <span v-if="skill.level" class="font-normal opacity-70">({{ skill.level }})</span>
                                        </span>
                                    </div>
                                </div>
                                <div v-if="resumeData.ResumeDetail.experience?.length" class="print-avoid-break">
                                    <h3 class="text-lg font-black text-slate-800 uppercase mb-5 border-l-4 border-emerald-600 pl-3 tracking-wide">Kinh nghiệm làm việc</h3>
                                    <div class="space-y-6">
                                        <div v-for="(exp, index) in resumeData.ResumeDetail.experience" :key="'exp-'+index">
                                            <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-1">
                                                <h4 class="font-bold text-slate-800 text-[16px]">{{ exp.position }}</h4>
                                                <span class="text-emerald-600 font-bold text-[13px]">{{ formatDate(exp.startDate.toString()) }} - {{ formatDate(exp.endDate?.toString() || "")|| 'Hiện tại' }}</span>
                                            </div>
                                            <h5 class="text-[14px] font-bold text-slate-500 mb-2">{{ exp.companyName }}</h5>
                                            <p class="text-slate-600 text-[14px] leading-relaxed text-justify whitespace-pre-line">{{ exp.description }}</p>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="resumeData.ResumeDetail?.projects?.length" class="print-avoid-break">
                                    <h3 class="text-lg font-black text-slate-800 uppercase mb-5 border-l-4 border-emerald-600 pl-3 tracking-wide">Dự án nổi bật</h3>
                                    <div class="grid grid-cols-1 gap-6">
                                        <div v-for="(prj, idx) in resumeData.ResumeDetail.projects" :key="idx" class="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                                            <h4 class="font-bold text-slate-800 text-[16px]">{{ prj.projectName }}</h4>
                                            <p class="text-emerald-600 text-[13px] font-bold mb-2">{{ prj.role }}</p>
                                            <p class="text-slate-600 text-[14px] mb-3">{{ prj.description }}</p>
                                            <div class="flex flex-wrap gap-2">
                                                <span v-for="tech in prj.technologies" :key="tech" class="text-[11px] bg-white px-2 py-0.5 rounded border text-gray-500">{{ tech }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="resumeData.ResumeDetail.education?.length" class="print-avoid-break">
                                    <h3 class="text-lg font-black text-slate-800 uppercase mb-4 border-l-4 border-emerald-600 pl-3 tracking-wide">Trình độ học vấn</h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div v-for="(edu, index) in resumeData.ResumeDetail.education" :key="'edu-'+index" class="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                            <h4 class="font-bold text-slate-800 text-[15px] mb-1">{{ edu.institution }}</h4>
                                            <p class="text-[14px] text-slate-600"><span class="font-bold">{{ edu.degree }}</span> - {{ edu.major }}</p>
                                            <p v-if="edu.gpa" class="text-[13px] text-slate-500 mt-1 font-medium italic">GPA: {{ edu.gpa }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="resumeData.ResumeDetail?.templateId === 3" id="cv-document" class="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl flex flex-col md:flex-row print:flex-row overflow-hidden print:shadow-none print:m-0 text-slate-800">
                            <div class="w-full md:w-[35%] print:w-[35%] bg-slate-50 p-8 border-r border-slate-200 flex flex-col gap-8 print:bg-slate-50">
                                <div class="flex flex-col items-center">
                                    <img :src="resumeData.AvatarUrl || 'https://via.placeholder.com/150'" class="w-36 h-36 rounded-[2rem] object-cover shadow-md mb-5 border-4 border-white">
                                    <h1 class="text-2xl font-black text-purple-900 text-center uppercase leading-tight">
                                        {{ resumeData.FullName }}
                                    </h1>
                                    <h2 class="text-[13px] font-bold text-purple-600 mt-2 uppercase tracking-widest text-center border-b-2 border-purple-200 pb-3 w-full">
                                        {{ resumeData.ResumeDetail?.title || 'Lập trình viên' }}
                                    </h2>
                                </div>

                                <div>
                                    <h3 class="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                                        <i class="fas fa-id-card text-purple-500"></i> Liên hệ
                                    </h3>
                                    <div class="space-y-4 text-[13px] font-medium text-slate-600">
                                        <div v-if="resumeData.Email" class="flex items-start gap-3">
                                            <i class="fas fa-envelope mt-1 w-4 text-center text-purple-400"></i>
                                            <span class="break-all">{{ resumeData.Email }}</span>
                                        </div>
                                        <div v-if="resumeData.Phone" class="flex items-start gap-3">
                                            <i class="fas fa-phone mt-1 w-4 text-center text-purple-400"></i>
                                            <span>{{ resumeData.Phone }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="resumeData.ResumeDetail?.skills?.length">
                                    <h3 class="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                                        <i class="fas fa-bolt text-purple-500"></i> Kỹ năng
                                    </h3>
                                    <div class="flex flex-col gap-3.5">
                                        <div v-for="(skill, index) in resumeData.ResumeDetail.skills" :key="'sk'+index">
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
                                <div v-if="resumeData.ResumeDetail?.summary" class="print-avoid-break">
                                    <h3 class="text-xl font-black text-purple-900 uppercase mb-3 flex items-center gap-3">Mục tiêu</h3>
                                    <p class="text-slate-600 text-[14px] leading-relaxed text-justify bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                                        {{ resumeData.ResumeDetail.summary }}
                                    </p>
                                </div>

                                <div v-if="resumeData.ResumeDetail?.experience?.length" class="print-avoid-break">
                                    <h3 class="text-xl font-black text-purple-900 uppercase mb-5 flex items-center gap-3">Kinh nghiệm</h3>
                                    <div class="space-y-6 border-l-2 border-purple-100 pl-5 ml-2">
                                        <div v-for="(exp, index) in resumeData.ResumeDetail.experience" :key="'exp'+index" class="relative">
                                            <div class="absolute w-3 h-3 bg-purple-500 rounded-full -left-[27px] top-1.5 ring-4 ring-white"></div>
                                            <h4 class="font-bold text-slate-800 text-[15px]">{{ exp.position }}</h4>
                                            <div class="text-[13px] font-bold text-purple-600 mb-2 mt-0.5">
                                                {{ exp.companyName }}
                                                <span class="text-slate-400 font-normal ml-2">
                                                    | {{ formatDate(exp.startDate.toString()) }} - {{ exp.isCurrent ? 'Hiện tại' : formatDate(exp.endDate?.toString() || "") }}
                                                </span>
                                            </div>
                                            <p class="text-slate-600 text-[14px] leading-relaxed whitespace-pre-line text-justify">{{ exp.description }}</p>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="resumeData.ResumeDetail?.projects?.length" class="print-avoid-break">
                                    <h3 class="text-xl font-black text-purple-900 uppercase mb-5 flex items-center gap-3">Dự án nổi bật</h3>
                                    <div class="space-y-6">
                                        <div v-for="(prj, index) in resumeData.ResumeDetail.projects" :key="'prj'+index" class="bg-slate-50 rounded-2xl p-5 border border-slate-100">
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

                                <div v-if="resumeData.ResumeDetail?.education?.length" class="print-avoid-break">
                                    <h3 class="text-xl font-black text-purple-900 uppercase mb-5 flex items-center gap-3">Học vấn</h3>
                                    <div class="space-y-4">
                                        <div v-for="(edu, index) in resumeData.ResumeDetail.education" :key="'edu'+index" class="flex items-start gap-4">
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

                    <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                        <i class="fas fa-exclamation-circle text-4xl mb-4 text-rose-300"></i>
                        <p class="font-bold text-lg text-slate-600">Không thể tải hồ sơ</p>
                        <p class="text-sm text-center mt-2">Dữ liệu hồ sơ của ứng viên này có thể đã bị xóa hoặc xảy ra lỗi hệ thống.</p>
                    </div>

                </div>

                <div v-if="resumeData && !useApplication.loading" class="p-4 sm:p-6 bg-white border-t border-slate-200 shrink-0 flex flex-wrap items-center justify-end gap-3 z-10">
    
                    <button 
                        @click="handleReject" 
                        :disabled="resumeData.Status === 'Rejected'"
                        class="px-5 py-2.5 rounded-xl font-bold text-rose-600 bg-rose-50 transition-colors flex items-center gap-2 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-50"
                    >
                        <i class="fas fa-times-circle"></i> Từ chối
                    </button>
                    
                    <button 
                        @click="handleSchedule" 
                        :disabled="resumeData.Status === 'Interviewing'"
                        class="px-5 py-2.5 rounded-xl font-bold text-amber-600 bg-amber-50 transition-colors flex items-center gap-2 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-50"
                    >
                        <i class="fas fa-calendar-plus"></i> Hẹn lịch
                    </button>

                    <button 
                        @click="handleApprove" 
                        :disabled="resumeData.Status === 'Accepted'"
                        class="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:shadow-none"
                    >
                        <i class="fas fa-check-circle"></i> Duyệt hồ sơ
                    </button>
                    
                </div>

            </div>
        </transition>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }

.drawer-enter-active, .drawer-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>