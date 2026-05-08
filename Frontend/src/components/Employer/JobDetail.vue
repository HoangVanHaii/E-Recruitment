

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useJobStore } from '../../stores/job'; 
import type { IJobDetail } from '../../types/job'; 
import Notify from '../Notify.vue';
const useJob = useJobStore();

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);


const props = defineProps<{
    isOpen: boolean;
    jobId: number | null;
}>();

const emit = defineEmits(['close']);
const job = ref<IJobDetail | null>(null);
const isLoading = ref(false);
const error = ref('');
watch(() => props.isOpen, async (newVal) => {
    if (newVal && props.jobId) {
        document.body.style.overflow = 'hidden';
        job.value = await useJob.getJobDetailStore(props.jobId);
        console.log(job.value);
        if(useJob.error) {
            showNotify.value = true;
            messageNotify.value = useJob.message || 'Vui lòng thử lại sau.';
            isSuccessNotify.value = false;
        }
        else {
            showNotify.value = true;
            messageNotify.value = 'Lấy dữ liệu thành công!';
            isSuccessNotify.value = true;
        }

    } else {
        document.body.style.overflow = '';
        job.value = null;
        error.value = '';
    }
});

const closeModal = () => {
    emit('close');
};
const formatDate = (date: Date | string) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('vi-VN').format(new Date(date));
};

const formatSalary = (min: number, max: number) => {
    if (!min && !max) return "Thỏa thuận";
    const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    if (min && !max) return `Từ ${formatter.format(min)}`;
    if (!min && max) return `Lên đến ${formatter.format(max)}`;
    return `${formatter.format(min)} - ${formatter.format(max)}`;
};

const getStatusBadgeClass = (status: string) => {
    const base = "px-3 py-1 rounded-lg text-sm font-bold border";
    if (status === 'Approved' || status === 'Đang đăng') return `${base} bg-emerald-50 text-emerald-600 border-emerald-100`;
    if (status === 'Pending' || status === 'Đang chờ duyệt') return `${base} bg-sky-50 text-sky-600 border-sky-100`;
    if (status === 'Rejected' || status === 'Từ chối') return `${base} bg-red-50 text-red-600 border-red-100`;
    return `${base} bg-slate-100 text-slate-500 border-slate-200`;
};
</script>
<template>
    <Teleport to="body">
        <transition name="modal-fade">
            <div 
                v-if="isOpen" 
                @click.self="closeModal" 
                class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6"
            >
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                    
                    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 class="text-xl font-bold text-slate-800">Chi tiết tin tuyển dụng</h2>
                        <button 
                            @click="closeModal" 
                            class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-6 sm:p-8">
                        
                        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
                            <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p class="text-slate-500 font-medium">Đang tải dữ liệu công việc...</p>
                        </div>

                        <div v-else-if="error" class="flex flex-col items-center justify-center py-20">
                            <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <p class="text-red-600 font-medium">{{ error }}</p>
                        </div>

                        <div v-else-if="job" class="space-y-8">
                            
                            <div class="flex flex-col sm:flex-row gap-6 items-start">
                                <div class="w-24 h-24 shrink-0 bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-center shadow-sm">
                                    <img v-if="job.CompanyLogo" :src="job.CompanyLogo" alt="Logo" class="max-w-full max-h-full object-contain" />
                                    <i v-else class="fas fa-building text-3xl text-slate-300"></i>
                                </div>
                                
                                <div class="flex-1">
                                    <div class="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <h1 class="text-2xl font-bold text-slate-900 leading-tight mb-2">{{ job.Title }}</h1>
                                            <p class="text-lg font-semibold text-blue-700 mb-2">{{ job.CompanyName }}</p>
                                        </div>
                                        <span :class="getStatusBadgeClass(job.Status)">{{ job.Status }}</span>
                                    </div>
                                    
                                    <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600 mt-2">
                                        <div class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                                            <i class="fas fa-map-marker-alt text-slate-400"></i>
                                            <span class="font-medium">{{ job.Location }}</span>
                                        </div>
                                        <div class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                                            <i class="fas fa-briefcase text-slate-400"></i>
                                            <span class="font-medium">{{ job.JobType }}</span>
                                        </div>
                                        <div class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                                            <i class="fas fa-calendar-alt text-slate-400"></i>
                                            <span class="font-medium">Ngày tạo: {{ formatDate(job.CreatedAt) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr class="border-slate-100" />

                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                    <div class="text-xs text-blue-500 font-bold uppercase mb-1">Mức lương</div>
                                    <div class="font-bold text-blue-700">{{ formatSalary(job.SalaryMin, job.SalaryMax) }}</div>
                                </div>
                                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                    <div class="text-xs text-slate-500 font-bold uppercase mb-1">Số lượng tuyển</div>
                                    <div class="font-bold text-slate-800">{{ job.Quantity }} người</div>
                                </div>
                                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:col-span-2">
                                    <div class="text-xs text-slate-500 font-bold uppercase mb-1">Thời gian làm việc</div>
                                    <div class="font-bold text-slate-800">{{ job.WorkingSchedule || 'Theo quy định công ty' }}</div>
                                </div>
                            </div>

                            <div class="space-y-6">
                                <div>
                                    <h3 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <i class="fas fa-align-left text-blue-600"></i> Mô tả công việc
                                    </h3>
                                    <div class="text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl">
                                        {{ job.Description }}
                                    </div>
                                </div>

                                <div>
                                    <h3 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <i class="fas fa-clipboard-check text-blue-600"></i> Yêu cầu ứng viên
                                    </h3>
                                    <div class="text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl">
                                        {{ job.Requirements }}
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <i class="fas fa-gift text-blue-600"></i> Quyền lợi
                                    </h3>
                                    <ul class="space-y-2">
                                        <li v-for="(benefit, index) in job.Benefits" :key="index" class="flex items-start gap-2 text-slate-700">
                                            <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                            <span>{{ benefit }}</span>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <i class="fas fa-tags text-blue-600"></i> Kỹ năng / Tags
                                    </h3>
                                    <div class="flex flex-wrap gap-2">
                                        <span v-for="(tag, index) in job.Tags" :key="index" class="px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-medium text-slate-700">
                                            {{ tag }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="job.InterviewProcess && job.InterviewProcess.length > 0">
                                <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <i class="fas fa-comments text-blue-600"></i> Quy trình phỏng vấn
                                </h3>
                                <div class="space-y-4">
                                    <div v-for="round in job.InterviewProcess" :key="round.roundOrder" class="flex gap-4 p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                                        <div class="w-10 h-10 shrink-0 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center">
                                            {{ round.roundOrder }}
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-slate-800">{{ round.roundTitle }}</h4>
                                            <p class="text-sm text-slate-600 mt-1">{{ round.details }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
</template>
<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.animate-slide-up {
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 10px;
}
</style>