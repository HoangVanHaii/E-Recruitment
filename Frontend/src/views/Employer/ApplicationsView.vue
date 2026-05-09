

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ApplicationDetail from '../../components/Employer/ApplicationDetail.vue';
import { useApplicationStore } from '../../stores/jobApplication';
import type { IJobApplicationList } from '../../types/jobApplication';
import Notify from '../../components/Notify.vue';

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);


const useApplication = useApplicationStore();
const props = defineProps({
    jobId: { type: [Number, null], required: true },
    jobTitle: { type: String, default: 'Đang tải...' }
});

const emit = defineEmits(['back']);

const loading = ref(false);
const applications = ref<IJobApplicationList[]>([]);
const activeStatus = ref('All');
const selectedApp = ref<any>(null);

const statusTabs = [
    { label: 'Tất cả đơn', value: 'All' },
    { label: 'Chưa xem', value: 'Pending' },
    { label: 'Đã xem', value: 'Reviewed' },
    { label: 'Hẹn phỏng vấn', value: 'Interviewing' },
    { label: 'Trúng tuyển', value: 'Accepted' },
    { label: 'Đã loại', value: 'Rejected' },
];

onMounted(async () => {
    loading.value = true;
    if (props.jobId) {
        await useApplication.getApplicationByJobId(props.jobId);
        applications.value = useApplication.listApplications;
    }
    loading.value = false;
});

const filteredApplications = computed(() => {
    if (activeStatus.value === 'All') return applications.value;
    return applications.value.filter(app => app.Status === activeStatus.value);
});

const openCV = (app: any) => {
    selectedApp.value = app;
    if (app.Status === 'Pending') {
        updateStatus(app.ApplicationID, 'Reviewed');
    }
};

const updateStatus = async (appId: number, newStatus: string) => {
    await useApplication.updateApplicationStatusStore(appId, newStatus);
    if(useApplication.error) {
        messageNotify.value = 'Cập nhật trạng thái thất bại';
        isSuccessNotify.value = false;
        newStatus === 'Reviewed' ? showNotify.value = false : showNotify.value = true;

        return;
    }
    const app = applications.value.find(a => a.ApplicationID === appId);
    if (app) app.Status = newStatus;
    messageNotify.value = 'Cập nhật trạng thái thành công';
    isSuccessNotify.value = true;
    newStatus === 'Reviewed' ? showNotify.value = false : showNotify.value = true;
};

const formatDate = (date: string) => {
    // alert()
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
};

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        'Pending': 'Chưa xem',
        'Reviewed': 'Đã xem',
        'Interviewing': 'Hẹn phỏng vấn',
        'Accepted': 'Trúng tuyển',
        'Rejected': 'Đã loại'
    };
    return map[status] || status;
};

const getStatusBadgeClass = (s: string) => {
    if (s === 'Accepted') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s === 'Rejected') return 'bg-rose-50 text-rose-600 border-rose-100';
    if (s === 'Interviewing') return 'bg-amber-50 text-amber-600 border-amber-100';
    if (s === 'Reviewed') return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-slate-100 text-slate-500 border-slate-200';
};

const getStatusBorderColor = (s: string) => {
    if (s === 'Accepted') return 'border-l-[5px] border-l-emerald-500';
    if (s === 'Rejected') return 'border-l-[5px] border-l-rose-500 grayscale-[0.3]';
    if (s === 'Interviewing') return 'border-l-[5px] border-l-amber-500';
    if (s === 'Reviewed') return 'border-l-[5px] border-l-blue-500';
    return 'border-l-[5px] border-l-slate-300';
};

const getScoreBgColor = (sc: number) => sc >= 80 ? 'bg-emerald-500' : (sc >= 50 ? 'bg-amber-500' : 'bg-rose-500');
const getScoreTextColor = (sc: number) => sc >= 80 ? 'text-emerald-600' : (sc >= 50 ? 'text-amber-500' : 'text-rose-500');
</script>
<template>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
    <div class="max-w-6xl mx-auto w-full flex-1 flex flex-col p-4 sm:p-8 animate-fade-in">
        
        <div class="mb-8 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <button 
                    @click="$emit('back')" 
                    class="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center group shrink-0"
                >
                    <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                </button>
                <div>
                    <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight line-clamp-1" :title="jobTitle">
                        Danh sách ứng viên <span class="text-slate-300 font-medium mx-1">|</span> <span class="text-blue-600">{{ jobTitle }}</span>
                    </h1>
                    <p class="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                        <span>Mã Job: <span class="font-bold text-slate-700">#{{ jobId }}</span></span>
                        <span class="text-slate-300">•</span>
                        <span>Đang có <strong class="text-slate-700">{{ applications.length }}</strong> đơn ứng tuyển</span>
                    </p>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex gap-2 overflow-x-auto sticky top-0 z-20 mb-6">
            <button 
                v-for="tab in statusTabs" :key="tab.value"
                @click="activeStatus = tab.value"
                class="px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2"
                :class="activeStatus === tab.value ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-50'"
            >
                {{ tab.label }}
            </button>
        </div>

        <div class="flex flex-col gap-4 min-h-[400px] relative z-10 pb-10">
            <div v-if="loading" class="py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse bg-white rounded-2xl border border-slate-100 border-dashed">
                Đang tải hồ sơ...
            </div>

            <div v-else-if="filteredApplications.length === 0" class="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
                <i class="fas fa-folder-open text-4xl text-slate-200 mb-4"></i>
                <h3 class="text-lg font-extrabold text-slate-600">Không có ứng viên</h3>
                <p class="text-sm text-slate-400 mt-1">Trạng thái này hiện chưa có dữ liệu.</p>
            </div>

            <transition-group name="list" v-else>
                <div 
                    v-for="app in filteredApplications" :key="app.ApplicationID"
                    class="bg-white rounded-2xl p-5 border shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4"
                    :class="getStatusBorderColor(app.Status)"
                >
                    <div class="flex items-center gap-5 w-full sm:w-auto">
                        <div class="shrink-0">
                            <img :src="app.AvatarUrl || 'https://i.pravatar.cc/150?img=' + app.ApplicationID" class="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm">
                        </div>

                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <h3 class="text-base font-extrabold text-slate-800">{{ app.FullName }}</h3>
                                <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border" :class="getStatusBadgeClass(app.Status)">
                                    {{ getStatusLabel(app.Status) }}
                                </span>
                            </div>
                            <div class="flex items-center gap-3 text-[13px] font-bold text-slate-500 mb-2">
                                <span class="flex items-center gap-1.5"><i class="fas fa-briefcase text-slate-400 text-[11px]"></i> {{ app.ExperienceYears }} năm KN</span>
                                <span class="text-slate-200">|</span>
                                <span class="flex items-center gap-1.5"><i class="fas fa-clock text-slate-400 text-[11px]"></i> {{ formatDate(app.CreatedAt) }}</span>
                            </div>
                            
                            <div class="flex items-center gap-2 w-full sm:w-48">
                                <span class="text-[10px] font-bold text-slate-400 uppercase">AI Match</span>
                                <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="h-full rounded-full transition-all duration-1000" :class="getScoreBgColor(app.MatchScore)" :style="{ width: `${app.MatchScore}%` }"></div>
                                </div>
                                <span class="text-[11px] font-black" :class="getScoreTextColor(app.MatchScore)">{{ app.MatchScore }}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 mt-4 sm:mt-0">
                        <button @click="openCV(app)" class="h-10 px-5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2">
                            XEM CV
                        </button>
                        
                        <div class="flex gap-1.5 ml-2">
                            <button 
                                @click="updateStatus(app.ApplicationID, 'Interviewing')" 
                                :disabled="app.Status === 'Interviewing'"
                                class="w-10 h-10 rounded-xl border transition-all flex items-center justify-center disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400"
                                :class="app.Status === 'Interviewing' ? '' : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border-amber-100'"
                                title="Hẹn phỏng vấn"
                            >
                                <i class="fas fa-calendar-alt"></i>
                            </button>

                            <button 
                                @click="updateStatus(app.ApplicationID, 'Accepted')" 
                                :disabled="app.Status === 'Accepted'"
                                class="w-10 h-10 rounded-xl border transition-all flex items-center justify-center disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400"
                                :class="app.Status === 'Accepted' ? '' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-100'"
                                title="Trúng tuyển"
                            >
                                <i class="fas fa-check"></i>
                            </button>

                            <button 
                                @click="updateStatus(app.ApplicationID, 'Rejected')" 
                                :disabled="app.Status === 'Rejected'"
                                class="w-10 h-10 rounded-xl border transition-all flex items-center justify-center disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400"
                                :class="app.Status === 'Rejected' ? '' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-100'"
                                title="Từ chối"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </transition-group>
        </div>

        <ApplicationDetail 
            v-if="selectedApp"
            :applicationId="selectedApp.ApplicationID"
            :applicantName="selectedApp.FullName"
            @close="selectedApp = null"
            @approve="updateStatus(selectedApp.ApplicationID, 'Accepted')"
            @reject="updateStatus(selectedApp.ApplicationID, 'Rejected')"
            @schedule="updateStatus(selectedApp.ApplicationID, 'Interviewing')"
        />
        
    </div>
</template>
<style scoped>
.list-enter-active, .list-leave-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.list-enter-from { opacity: 0; transform: translateY(20px); }
.list-leave-to { opacity: 0; transform: scale(0.95); }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { 
    from { opacity: 0; transform: translateY(10px); } 
    to { opacity: 1; transform: translateY(0); } 
}
</style>