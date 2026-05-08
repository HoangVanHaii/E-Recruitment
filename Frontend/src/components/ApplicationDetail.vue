<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useApplicationStore } from '../stores/jobApplication';
import Loading from './Loading.vue';

const useApplication = useApplicationStore();

const props = defineProps({
    applicationId: { type: [Number, null], required: true },
    applicantName: { type: String, default: 'Ứng viên' }
});

const emit = defineEmits(['close', 'approve', 'reject', 'schedule']);

const resumeData = ref<any | null>(null);

const fetchResumeData = async () => {
    if (props.applicationId) {
        resumeData.value = await useApplication.getApplicationDetailStore(props.applicationId)
    }
};

onMounted(async() => {
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
        resumeData.value.Status = 'Approved'; 
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

const formatMonthYear = (dateInput: Date | string | undefined) => {
    if(!dateInput) return '';
    const d = new Date(dateInput);
    return `T${d.getMonth() + 1}/${d.getFullYear()}`;
};

const formatYear = (dateInput: Date | string | undefined) => {
    if(!dateInput) return '';
    return new Date(dateInput).getFullYear().toString();
};
</script>
<template>
    <loading
        v-if="useApplication.loading"
    />
    <div class="relative z-50">
        
        <transition name="fade" appear>
            <div class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[55]" @click="handleClose"></div>
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
                        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-6 items-start">
                            <img :src="resumeData.ResumeDetail?.AvatarUrl || 'https://i.pravatar.cc/150?img=' + applicationId" class="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md shrink-0">
                            <div class="flex-1 w-full">
                                <h1 class="text-2xl font-black text-slate-900">{{ resumeData.FullName }}</h1>
                                <h2 class="text-[15px] font-bold text-blue-600 mt-1">{{ resumeData.ResumeDetail?.title || 'Chưa cập nhật vị trí' }}</h2>
                                
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-4 text-sm font-medium text-slate-600">
                                    <div class="flex items-center gap-2.5"><i class="fas fa-envelope text-slate-400 w-4 text-center"></i> {{ resumeData.Email }}</div>
                                    <div class="flex items-center gap-2.5"><i class="fas fa-phone-alt text-slate-400 w-4 text-center"></i> {{ resumeData.Phone }}</div>
                                    <div class="flex items-center gap-2.5"><i class="fas fa-briefcase text-slate-400 w-4 text-center"></i> {{ resumeData.ExperienceYears }} năm kinh nghiệm</div>
                                    <div class="flex items-center gap-2.5"><i class="fas fa-calendar-check text-slate-400 w-4 text-center"></i> Nộp lúc: {{ formatDate(resumeData.CreatedAt) }}</div>
                                </div>
                            </div>
                        </div>

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

                        <div v-if="resumeData.ResumeDetail?.summary" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 class="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                                <i class="fas fa-user-circle text-blue-500"></i> Giới thiệu
                            </h3>
                            <p class="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-line">{{ resumeData.ResumeDetail.summary }}</p>
                        </div>

                        <div v-if="resumeData.ResumeDetail?.skills?.length" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 class="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                                <i class="fas fa-code text-blue-500"></i> Kỹ năng chuyên môn
                            </h3>
                            <div class="flex flex-wrap gap-2.5">
                                <span v-for="(skill, index) in resumeData.ResumeDetail.skills" :key="index" class="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2">
                                    {{ skill.skillName }}
                                    <span v-if="skill.level" class="px-1.5 py-0.5 bg-white text-blue-600 text-[10px] uppercase rounded-md shadow-sm">{{ skill.level }}</span>
                                </span>
                            </div>
                        </div>

                        <div v-if="resumeData.ResumeDetail?.experience?.length" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 class="text-base font-black text-slate-800 mb-5 flex items-center gap-2">
                                <i class="fas fa-building text-blue-500"></i> Kinh nghiệm làm việc
                            </h3>
                            <div class="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                <div v-for="(exp, index) in resumeData.ResumeDetail.experience" :key="index" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div class="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
                                        <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    </div>
                                    <div class="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-sm hover:shadow-md transition-shadow">
                                        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                                            <h4 class="font-bold text-slate-800 text-[15px]">{{ exp.position }}</h4>
                                            <span class="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                                {{ formatMonthYear(exp.startDate) }} - {{ exp.isCurrent ? 'Hiện tại' : formatMonthYear(exp.endDate) }}
                                            </span>
                                        </div>
                                        <div class="text-sm font-bold text-slate-500 mb-2">{{ exp.companyName }}</div>
                                        <p v-if="exp.description" class="text-sm text-slate-600 whitespace-pre-line">{{ exp.description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="resumeData.ResumeDetail?.education?.length" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 class="text-base font-black text-slate-800 mb-5 flex items-center gap-2">
                                <i class="fas fa-graduation-cap text-blue-500"></i> Học vấn
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div v-for="(edu, index) in resumeData.ResumeDetail.education" :key="index" class="p-4 rounded-2xl border border-slate-100 bg-slate-50 relative overflow-hidden">
                                    <div class="absolute -right-2 -bottom-2 opacity-5 text-6xl"><i class="fas fa-university"></i></div>
                                    <h4 class="font-bold text-slate-800 text-[15px] mb-1">{{ edu.major }} ({{ edu.degree }})</h4>
                                    <div class="text-sm font-bold text-slate-600 mb-2">{{ edu.institution }}</div>
                                    <div class="flex items-center justify-between mt-auto pt-2 border-t border-slate-200 border-dashed">
                                        <span class="text-[11px] font-bold text-slate-400"><i class="fas fa-calendar-alt mr-1"></i> {{ formatYear(edu.startDate) }} - {{ edu.endDate ? formatYear(edu.endDate) : 'Hiện tại' }}</span>
                                        <span v-if="edu.gpa" class="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">GPA: {{ edu.gpa }}</span>
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
                        :disabled="resumeData.Status === 'Approved'"
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