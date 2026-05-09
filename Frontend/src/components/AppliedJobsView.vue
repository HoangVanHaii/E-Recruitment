<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useApplicationStore } from '../stores/jobApplication';
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';
import Template1 from './cv-templates/Template1.vue';
import Template2 from './cv-templates/Template2.vue';
import Template3 from './cv-templates/Template3.vue';

import { formatDate } from '../utils/format';


const appStore = useApplicationStore();
const applications = computed(() => appStore.submittedApplications);
const loading = computed(() => appStore.loading);

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const currentPage = ref(1);
const limit = 6;

const showDetailModal = ref(false);
const showCVModal = ref(false);
const selectedApp = ref<any>(null);

const fetchApplications = async () => {
    await appStore.getSubmittedApplicationsStore(currentPage.value, limit);
};

const handleViewDetail = async (applicationID: number | undefined) => {

    if (!applicationID) {
        showNotify.value = true;
        isSuccessNotify.value = false;
        messageNotify.value = "Mã đơn không hợp lệ (Undefined)!";
        return;
    }
    
    const data = await appStore.getApplicationDetailStore(applicationID);
    if (data) {
        selectedApp.value = data;
        showDetailModal.value = true;
    } else {
        showNotify.value = true;
        isSuccessNotify.value = false;
        messageNotify.value = "Lỗi: Không tìm thấy dữ liệu chi tiết đơn này.";
    }
};

const openSubmittedCV = () => {
    if (selectedApp.value?.ResumeDetail) {
        showCVModal.value = true;
    } else {
        showNotify.value = true;
        isSuccessNotify.value = false;
        messageNotify.value = "Hồ sơ CV sếp đã nộp không tồn tại hoặc bị lỗi data!";
    }
};

const prevPage = async () => {
    if (currentPage.value > 1) {
        currentPage.value--;
        await fetchApplications();
    }
};

const nextPage = async () => {
    if (applications.value.length === limit) {
        currentPage.value++;
        await fetchApplications();
    }
};

onMounted(async () => {
    await fetchApplications();
});

// const formatDate = (dateStr: string) => {
//     if (!dateStr) return '---';
//     const d = new Date(dateStr);
//     return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
// };


const getStatusColor = (status: string) => {
    switch(status) {
        case 'Pending': return '#5664d2';
        case 'Rejected': return '#d9534f';
        case 'Reviewed': 
        case 'Accepted': return '#5cb85c';
        case 'Cancelled': return '#6c757d';
        default: return '#5664d2';
    }
};

const getStatusText = (status: string) => {
    switch(status) {
        case 'Pending': return 'Đang đợi duyệt';
        case 'Rejected': return 'Đã từ chối';
        case 'Reviewed': return 'Đã xem hồ sơ';
        case 'Accepted': return 'Đã liên lạc phỏng vấn';
        case 'Cancelled': return 'Đã hủy đơn';
        default: return status;
    }
};

const getStatusIcon = (status: string) => {
    switch(status) {
        case 'Pending': return 'fas fa-clock';
        case 'Rejected': return 'fas fa-ban';
        case 'Reviewed': 
        case 'Accepted': return 'fas fa-phone-alt';
        case 'Cancelled': return 'fas fa-times';
        default: return 'fas fa-info-circle';
    }
};

const handleCancelApplication = async (app: any) => {
    if(confirm(`Sếp có chắc muốn hủy đơn ứng tuyển vào ${app.CompanyName} không?`)) {
        const isSuccess = await appStore.updateApplicationStatusStore(app.ApplicationID, 'Cancelled');
        showNotify.value = true;
        if (isSuccess) {
            isSuccessNotify.value = true;
            messageNotify.value = 'Hủy đơn thành công!';
            await fetchApplications(); 
        } else {
            isSuccessNotify.value = false;
            messageNotify.value = appStore.message || 'Lỗi khi hủy đơn!';
        }
    }
};
</script>
<template>
    <div class="w-full pb-10 font-sans relative">
        
        <Loading v-if="loading" />

        <Notify 
            v-if="showNotify" 
            :message="messageNotify" 
            :isSuccess="isSuccessNotify" 
            @close="showNotify = false"
        />

        <div class="mb-6">
            <h2 class="text-[17px] font-black text-[#14205c] tracking-wide uppercase">
                Danh sách công việc đã ứng tuyển
            </h2>
        </div>

        <div v-if="!loading && applications.length === 0 && currentPage === 1" 
             class="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <i class="fas fa-box-open text-4xl text-gray-300 mb-3"></i>
            <p class="text-gray-500 font-medium">Bạn chưa ứng tuyển công việc nào cả!</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="app in applications" :key="app.ApplicationID || app.JobID" 
                 class="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                
                <div class="bg-[#5664d2] p-4 text-center">
                    <h3 class="text-white font-bold text-[15px] truncate" :title="app.CompanyName">
                        {{ app.CompanyName }}
                    </h3>
                    <p class="text-white/80 text-[12px] mt-1 truncate">{{ app.JobTitle }}</p>
                </div>

                <div class="p-5 flex flex-col gap-3.5 text-[13px] text-gray-700 font-medium flex-1">
                    <div class="flex items-center gap-2.5">
                        <i class="fas fa-calendar-alt w-4 text-center text-gray-600 text-sm"></i>
                        <span>Hạn nộp hồ sơ <span class="font-bold text-gray-800">{{ formatDate(app.ExpiredDate) }}</span></span>
                    </div>
                    
                    <div class="flex items-center gap-2.5">
                        <i class="fas fa-check-circle w-4 text-center text-gray-600 text-sm"></i>
                        <span>Ngày nộp hồ sơ <span class="font-bold text-gray-800">{{ formatDate(app.CreatedAt) }}</span></span>
                    </div>

                    <div class="flex items-center gap-2.5 mt-1">
                        <i :class="getStatusIcon(app.ApplicationStatus)" class="w-4 text-center text-sm" :style="{ color: getStatusColor(app.ApplicationStatus) }"></i>
                        <span class="px-3 py-1 rounded-full text-[11px] font-bold text-white border border-white/20" 
                              :style="{ backgroundColor: getStatusColor(app.ApplicationStatus) }">
                            {{ getStatusText(app.ApplicationStatus) }}
                        </span>
                    </div>
                </div>

                <div class="mt-auto p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <button 
                        @click="handleViewDetail(app.ApplicationID)"
                        class="bg-[#5664d2] text-white text-[12px] font-bold px-4 py-2 rounded flex items-center hover:bg-blue-700 transition-colors">
                        XEM CHI TIẾT
                    </button>
                    
                    <button v-if="app.ApplicationStatus === 'Pending'" 
                            @click="handleCancelApplication(app)" 
                            class="text-[#d9534f] hover:text-red-700 text-[12px] font-bold flex items-center gap-1.5 transition-colors">
                        <i class="far fa-trash-alt"></i> HỦY ỨNG TUYỂN
                    </button>
                </div>
            </div>
        </div>

        <div v-if="applications.length > 0 || currentPage > 1" class="mt-8 flex justify-center">
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center w-full max-w-4xl p-3 h-[50px] gap-4">
                <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-1 rounded-md text-gray-500 disabled:opacity-30">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="px-4 py-1 font-bold text-[#5664d2] bg-blue-50 rounded-md">{{ currentPage }}</span>
                <button @click="nextPage" :disabled="applications.length < limit" class="px-3 py-1 rounded-md text-gray-500 disabled:opacity-30">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>

        <div v-if="showDetailModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">
                
                <div class="bg-[#5664d2] p-5 text-white flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-lg">Chi tiết đơn ứng tuyển</h3>
                        <p class="text-xs text-white/70">Mã đơn: #{{ selectedApp?.ApplicationID }}</p>
                    </div>
                    <button @click="showDetailModal = false" class="bg-white/20 hover:bg-white/30 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-3">
                            <h4 class="text-[14px] font-bold text-[#14205c] uppercase border-b pb-2">Thông tin Job</h4>
                            <p class="text-[13px]"><span class="text-gray-500">Công ty:</span> <br><strong class="text-[#5664d2]">{{ selectedApp?.CompanyName }}</strong></p>
                            <p class="text-[13px]"><span class="text-gray-500">Vị trí:</span> <br><strong>{{ selectedApp?.JobTitle }}</strong></p>
                            <p class="text-[13px]"><span class="text-gray-500">Lương:</span> <br><span class="text-green-600 font-bold">{{ selectedApp?.SalaryMin }} - {{ selectedApp?.SalaryMax }} USD</span></p>
                        </div>
                        <div class="space-y-3">
                            <h4 class="text-[14px] font-bold text-[#14205c] uppercase border-b pb-2">Trạng thái hồ sơ</h4>
                            <p class="text-[13px]"><span class="text-gray-500">Ngày nộp:</span> <br><strong>{{ formatDate(selectedApp?.CreatedAt) }}</strong></p>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="px-3 py-1 rounded-full text-[11px] font-bold text-white" :style="{ backgroundColor: getStatusColor(selectedApp?.Status) }">
                                    {{ getStatusText(selectedApp?.Status) }}
                                </span>
                            </div>
                            
                            <div class="mt-2 flex items-center gap-2 border p-2 rounded-lg bg-indigo-50/50">
                                <span class="text-[12px] font-bold text-gray-600">Độ phù hợp (AI):</span>
                                <span class="font-black text-lg" :class="selectedApp?.MatchScore >= 50 ? 'text-green-600' : 'text-red-500'">{{ selectedApp?.MatchScore || 0 }}%</span>
                            </div>

                            <div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p class="text-[12px] text-gray-500 mb-2">Hồ sơ đã dùng:</p>
                                <button @click="openSubmittedCV" class="text-[#5664d2] font-bold text-[13px] hover:underline flex items-center gap-2 group transition-all">
                                    <i class="far fa-file-pdf text-red-500 group-hover:scale-110 transition-transform"></i> Xem CV đã nộp
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 class="text-[13px] font-bold text-gray-700 mb-2">Đánh giá từ AI:</h4>
                        <p class="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line italic">
                            {{ selectedApp?.AI_Summary_Review || 'Chưa có đánh giá chi tiết.' }}
                        </p>
                    </div>
                </div>

                <div class="p-4 border-t bg-gray-50 flex justify-end">
                    <button @click="showDetailModal = false" class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-sm transition-colors uppercase">
                        Đóng lại
                    </button>
                </div>
            </div>
        </div>

        <transition name="fade">
            <div v-if="showCVModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="showCVModal = false">
                <div class="bg-gray-300 rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden relative">
                    
                    <div class="p-4 bg-white flex justify-between items-center shadow-sm z-10 border-b">
                        <div>
                            <h3 class="font-bold text-[#14205c] uppercase">Hồ sơ sếp Đăng đã nộp</h3>
                            <p class="text-xs text-gray-500">Đang dùng giao diện Mẫu {{ selectedApp?.ResumeDetail?.templateId || 1 }}</p>
                        </div>
                        <button @click="showCVModal = false" class="text-gray-500 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-200/80">
                        <component 
                            v-if="selectedApp?.ResumeDetail"
                            :is="selectedApp.ResumeDetail.templateId === 2 ? Template2 : (selectedApp.ResumeDetail.templateId === 3 ? Template3 : Template1)" 
                            :resume="{ 
                                ...selectedApp.ResumeDetail, 
                                FullName: selectedApp.FullName, 
                                Email: selectedApp.Email, 
                                Phone: selectedApp.Phone 
                            }" 
                        />
                    </div>
                </div>
            </div>
        </transition>

    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

