
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useJobStore } from '../../stores/job';
import type { IJobDetail } from '../../types/job';

const props = defineProps<{
    isOpen: boolean;
    jobId: number | null;
}>();

const emit = defineEmits(['close', 'success', 'failed']);
const useJob = useJobStore();

const isLoading = ref<boolean>(false);
const error = ref<string>('');

const formData = ref<IJobDetail>({
    JobID: 0,
    EmployerID: 0, 
    Title: '',
    Location: '',
    CreatedAt: new Date(),
    CompanyName: '',
    CompanyLogo: '',
    Status: 'Pending',
    SalaryMin: 0,
    SalaryMax: 0,
    JobType: '',
    Quantity: 1,
    Description: '',
    Requirements: '',
    Benefits: [],
    Tags: [],
    RawTextForAi: '',
    InterviewProcess: []
});

// Status Helpers
const getStatusLabel = (status: string) => {
    switch (status) {
        case 'Approved': return 'Đang đăng';
        case 'Pending': return 'Đang chờ duyệt';
        case 'Rejected': return 'Bị từ chối';
        default: return status;
    }
};
const getStatusIcon = (status: string) => {
    if (status === 'Approved') return 'fas fa-check-circle';
    if (status === 'Pending') return 'fas fa-clock';
    if (status === 'Rejected') return 'fas fa-times-circle';
    return 'fas fa-info-circle';
};
const getStatusBadgeClass = (status: string) => {
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (status === 'Pending') return 'bg-sky-50 text-sky-600 border-sky-200';
    if (status === 'Rejected') return 'bg-red-50 text-red-600 border-red-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
};

const fileInputRef = ref<HTMLInputElement | null>(null);
const fileToUpload = ref<File | null>(null);
const triggerFileInput = () => fileInputRef.value?.click();

const addInterviewRound = () => {
    const nextOrder = (formData.value.InterviewProcess?.length || 0) + 1;
    if (!formData.value.InterviewProcess) formData.value.InterviewProcess = [];
    formData.value.InterviewProcess.push({
        roundOrder: nextOrder,
        roundTitle: '',
        details: ''
    });
};
const removeInterviewRound = (index: number) => {
    formData.value.InterviewProcess?.splice(index, 1);
};
const originalData = ref<IJobDetail | null>(null);
watch(() => [props.isOpen, props.jobId], async ([isOpen, jobId]) => {
        if (isOpen && jobId) {
            isLoading.value = true;
            error.value = '';
            fileToUpload.value = null;
            if(props.jobId === null) {
                isLoading.value = false;
                return;
            }
            const jobDetail = await useJob.getJobDetailStore(props.jobId);

            if (jobDetail) {
                const cloned = JSON.parse(JSON.stringify(jobDetail));
                formData.value = cloned;
                originalData.value = JSON.parse(JSON.stringify(cloned));
            }
            isLoading.value = false;
        }
    },
    { immediate: true }
);
const isSaving = ref(false);
const buildUpdatePayload = () => {
    const payload: any = {};

    if (formData.value.Title !== originalData.value?.Title) {
        payload.title = formData.value.Title;
    }

    if (formData.value.Location !== originalData.value?.Location) {
        payload.location = formData.value.Location;
    }

    if (formData.value.SalaryMin !== originalData.value?.SalaryMin) {
        payload.salaryMin = formData.value.SalaryMin;
    }

    if (formData.value.SalaryMax !== originalData.value?.SalaryMax) {
        payload.salaryMax = formData.value.SalaryMax;
    }

    if (formData.value.JobType !== originalData.value?.JobType) {
        payload.jobType = formData.value.JobType;
    }

    if (formData.value.Quantity !== originalData.value?.Quantity) {
        payload.quantity = formData.value.Quantity;
    }

    if (formData.value.Description !== originalData.value?.Description) {
        payload.description = formData.value.Description;
    }

    if (formData.value.WorkingSchedule !== originalData.value?.WorkingSchedule) {
        payload.workingSchedule = formData.value.WorkingSchedule;
    }

    if (formData.value.Requirements !== originalData.value?.Requirements) {
        payload.requirements = formData.value.Requirements;
    }

    if (
        JSON.stringify(formData.value.Benefits) !==
        JSON.stringify(originalData.value?.Benefits)
    ) {
        payload.benefits = formData.value.Benefits;
    }

    if (
        JSON.stringify(formData.value.Tags) !==
        JSON.stringify(originalData.value?.Tags)
    ) {
        payload.tags = formData.value.Tags;
    }

    if (
        JSON.stringify(formData.value.InterviewProcess) !==
        JSON.stringify(originalData.value?.InterviewProcess)
    ) {
        payload.interviewProcess = formData.value.InterviewProcess;
    }

    return payload;
};
const handleSave = async () => {
    isSaving.value = true;

    const payload = buildUpdatePayload();

    if (Object.keys(payload).length === 0) {
        return;
    }
    await useJob.updateJobStore(formData.value.JobID, payload);
    if(useJob.error) {
        emit('failed');
    }
    else {
        emit('success');
    }
    isSaving.value = false;
};

const closeModal = () => emit('close');
// 
</script>
<template>
    <Teleport to="body">
        <transition name="modal-fade">
            <div 
                v-if="isOpen" 
                @click.self="closeModal" 
                class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6"
            >
                <div class="relative bg-[#F8FAFC] rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-slide-up border border-white/50 text-slate-800">
                    
                    <div class="sticky top-0 z-20 bg-white/80 backdrop-blur-xl px-8 py-4 border-b border-slate-200/60 flex items-center justify-between shrink-0">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                <i class="fas fa-pen-nib text-lg"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">Chỉnh sửa tin tuyển dụng</h2>
                                <p class="text-xs font-medium text-slate-500 mt-0.5">Cập nhật thông tin chi tiết cho vị trí này</p>
                            </div>
                        </div>
                        <button type="button" @click="closeModal" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all duration-200">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center bg-white py-20 space-y-4">
                        <div class="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <p class="text-slate-500 font-semibold tracking-wide">Đang đồng bộ dữ liệu...</p>
                    </div>

                    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center bg-white py-20 text-center px-6">
                        <div class="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-5 text-3xl mx-auto shadow-sm border border-red-100">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <p class="text-red-600 font-bold text-lg">{{ error }}</p>
                    </div>

                    <div v-else class="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                        <form id="editJobForm" @submit.prevent="handleSave" class="space-y-6 max-w-4xl mx-auto">
                            
                            <div class="bg-white p-6 rounded-3xl shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border border-slate-100">
                                <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-6">
                                    <span class="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">1</span>
                                    Thông tin chung
                                </h3>
                                
                                <div class="flex flex-col md:flex-row gap-6 mb-6">
                                    <div class="shrink-0 group">
                                        <div @click="triggerFileInput" class="relative w-28 h-28 bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl p-2 flex items-center justify-center overflow-hidden transition-all hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer">
                                            <img v-if="formData.CompanyLogo" :src="formData.CompanyLogo" alt="Logo" class="w-full h-full object-contain" />
                                            <div v-else class="flex flex-col items-center gap-1 text-slate-400">
                                                <i class="fas fa-cloud-upload-alt text-xl"></i>
                                                <span class="text-[9px] font-bold uppercase tracking-wider text-center">Logo</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex-1 space-y-4">
                                        <div class="group">
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tiêu đề công việc <span class="text-red-500">*</span></label>
                                            <input v-model="formData.Title" type="text" required class="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium">
                                        </div>
                                        <div class="group">
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Công ty</label>
                                            <input v-model="formData.CompanyName" type="text" class="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Địa điểm <span class="text-red-500">*</span></label>
                                        <input v-model="formData.Location" type="text" required class="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white outline-none text-sm font-medium">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Loại hình</label>
                                        <input v-model="formData.JobType" type="text" class="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white outline-none text-sm font-medium">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Trạng thái</label>
                                        <div :class="getStatusBadgeClass(formData.Status)" class="w-full px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 shadow-sm">
                                            <i :class="getStatusIcon(formData.Status)"></i>
                                            {{ getStatusLabel(formData.Status) }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white p-6 rounded-3xl shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border border-slate-100">
                                <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-6">
                                    <span class="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">2</span>
                                    Chế độ & Yêu cầu
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Lương Tối thiểu</label>
                                        <input v-model="formData.SalaryMin" type="number" class="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm font-medium">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Lương Tối đa</label>
                                        <input v-model="formData.SalaryMax" type="number" class="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm font-medium">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Số lượng</label>
                                        <input v-model="formData.Quantity" type="number" class="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm font-medium">
                                    </div>
                                </div>
                                <div class="space-y-5">
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mô tả công việc</label>
                                        <textarea v-model="formData.Description" rows="4" class="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm resize-none font-medium"></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Yêu cầu ứng viên</label>
                                        <textarea v-model="formData.Requirements" rows="4" class="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm resize-none font-medium"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white p-6 rounded-3xl shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border border-slate-100">
                                <div class="flex items-center justify-between mb-6">
                                    <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <span class="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">3</span>
                                        Quy trình phỏng vấn
                                    </h3>
                                    <button type="button" @click="addInterviewRound" class="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[11px] font-bold hover:bg-blue-100 transition-all flex items-center gap-2 border border-blue-100">
                                        <i class="fas fa-plus"></i> Thêm vòng
                                    </button>
                                </div>
                                
                                <div class="space-y-4">
                                    <transition-group name="list">
                                        <div v-for="(round, index) in formData.InterviewProcess" :key="index" class="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 relative group">
                                            <button type="button" @click="removeInterviewRound(index)" class="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <i class="fas fa-trash-alt text-[10px]"></i>
                                            </button>
                                            
                                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div class="md:col-span-1">
                                                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Thứ tự</label>
                                                    <input v-model="round.roundOrder" type="number" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-bold text-slate-700 text-center">
                                                </div>
                                                <div class="md:col-span-3">
                                                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên vòng phỏng vấn</label>
                                                    <input v-model="round.roundTitle" type="text" placeholder="VD: Phỏng vấn chuyên môn" class="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-bold text-slate-700">
                                                </div>
                                                <div class="md:col-span-4">
                                                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chi tiết nội dung</label>
                                                    <textarea v-model="round.details" rows="2" class="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-medium resize-none"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </transition-group>
                                    
                                    <div v-if="formData.InterviewProcess?.length === 0" class="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                                        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Chưa thiết lập quy trình</p>
                                    </div>
                                </div>
                            </div>

                        </form>
                    </div>

                    <div class="sticky bottom-0 z-20 bg-white/80 backdrop-blur-xl px-8 py-4 border-t border-slate-200/60 flex items-center justify-end shrink-0 rounded-b-[24px] gap-3">
                        <button type="button" @click="closeModal" class="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-xs">
                            Hủy bỏ
                        </button>
                        <button type="submit" form="editJobForm" class="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 text-xs">
                            <i class="fas fa-check-circle"></i> Lưu cập nhật
                        </button>
                    </div>

                </div>
            </div>
        </transition>
    </Teleport>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.animate-slide-up { animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes slideUpModal {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-10px); }
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
</style>