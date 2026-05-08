<script setup lang="ts">
import { ref, watch } from 'vue';
import { useJobStore } from '../../stores/job';
import { formatDate, formatSalary } from '../../utils/format';
import Loading from '../Loading.vue';
import type { IJobDetail } from '../../types/job';

const props = defineProps<{
    jobId: number | null;
    isOpen: boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'action', payload: { jobId: number; type: 'Approve' | 'Reject' }): void;
}>();

const jobStore = useJobStore();
const detail = ref<IJobDetail | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const activeTab = ref<'info' | 'requirements' | 'process'>('info');

const fetchDetail = async (id: number) => {
    isLoading.value = true;
    error.value = null;
    detail.value = null;
    activeTab.value = 'info';
    try {
        await jobStore.fetchJobDetail(id);
        const found = jobStore.jobDetail;
        if (!found) throw new Error('Không tìm thấy dữ liệu');
        detail.value = found;
    } catch (e: any) {
        error.value = e.message || 'Đã có lỗi xảy ra';
    } finally {
        isLoading.value = false;
    }
};

watch(() => props.jobId, (id) => {
    if (id !== null && props.isOpen) fetchDetail(id);
});

watch(() => props.isOpen, (open) => {
    if (open && props.jobId !== null) fetchDetail(props.jobId);
});

const statusConfig: Record<string, { label: string; cls: string; dot: string; icon: string }> = {
    Approved: { label: 'Đã duyệt',   cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500', icon: 'fas fa-check-circle' },
    Pending:  { label: 'Chờ duyệt',  cls: 'bg-amber-50 text-amber-600 border-amber-200',       dot: 'bg-amber-500',   icon: 'fas fa-hourglass-half' },
    Rejected: { label: 'Bị từ chối', cls: 'bg-red-50 text-red-500 border-red-200',             dot: 'bg-red-500',     icon: 'fas fa-times-circle' },
};
</script>

<template>
    <transition name="fade-backdrop">
        <div
            v-if="isOpen"
            class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
            @click="emit('close')"
            @wheel.prevent
            @touchmove.prevent
        />
    </transition>
    
    <loading v-if="jobStore.loading" />
    
    <transition name="drawer-slide">
        <div
            v-if="isOpen"
            class="fixed right-0 top-0 z-50 h-screen w-full sm:max-w-[580px] bg-white shadow-2xl flex flex-col"
            @click.stop
        >
ư            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#eef0fd] flex items-center justify-center">
                        <i class="fas fa-briefcase text-[#4c5bd4] text-sm"></i>
                    </div>
                    <div>
                        <p class="font-extrabold text-slate-800 text-[15px] leading-tight">Chi tiết Job</p>
                        <p class="text-[10px] text-slate-400 font-medium">ID: #{{ jobId }}</p>
                    </div>
                </div>
                <button
                    @click="emit('close')"
                    class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>

            <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center gap-3">
                <div class="loader"></div>
                <p class="text-sm text-slate-400 font-medium">Đang tải dữ liệu...</p>
            </div>

            <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
                <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                    <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                </div>
                <p class="font-bold text-slate-700">Không thể tải dữ liệu</p>
                <p class="text-sm text-slate-400">{{ error }}</p>
                <button @click="jobId && fetchDetail(jobId)" class="mt-2 px-4 py-2 bg-[#4c5bd4] text-white rounded-xl text-sm font-bold hover:bg-[#3a49c2] transition-colors">
                    Thử lại
                </button>
            </div>

            <template v-else-if="detail">
                <div class="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
                    <div class="flex items-start gap-4">
                        <div class="w-16 h-16 rounded-2xl border border-slate-100 bg-white shadow-sm p-1.5 shrink-0 overflow-hidden">
                            <img :src="detail.CompanyLogo" class="w-full h-full object-contain" alt="Logo" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <h2 class="font-black text-slate-800 text-[17px] leading-tight line-clamp-2">{{ detail.Title }}</h2>
                            <p class="text-[13px] text-slate-500 font-medium mt-0.5">{{ detail.CompanyName }}</p>
                            <div class="flex items-center gap-2 mt-2 flex-wrap">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border" :class="statusConfig[detail.Status]?.cls">
                                    <i :class="statusConfig[detail.Status]?.icon"></i>
                                    {{ statusConfig[detail.Status]?.label }}
                                </span>
                                <span class="text-[11px] text-slate-400 font-medium">
                                    <i class="fas fa-calendar-alt mr-1"></i>{{ formatDate(detail.CreatedAt) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 mt-4">
                        <div class="flex flex-col gap-0.5 bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3">
                            <i class="fas fa-money-bill-wave text-emerald-500 text-[11px]"></i>
                            <span class="text-[11px] text-slate-500 mt-1">Lương</span>
                            <span class="text-[12px] font-bold text-slate-700 truncate">{{ formatSalary(detail.SalaryMin, detail.SalaryMax) }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5 bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3">
                            <i class="fas fa-map-marker-alt text-blue-400 text-[11px]"></i>
                            <span class="text-[11px] text-slate-500 mt-1">Địa điểm</span>
                            <span class="text-[12px] font-bold text-slate-700 truncate">{{ detail.Location }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5 bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3">
                            <i class="fas fa-briefcase text-purple-400 text-[11px]"></i>
                            <span class="text-[11px] text-slate-500 mt-1">Loại việc</span>
                            <span class="text-[12px] font-bold text-slate-700">{{ detail.JobType }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5 bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3">
                            <i class="fas fa-users text-amber-400 text-[11px]"></i>
                            <span class="text-[11px] text-slate-500 mt-1">Số lượng</span>
                            <span class="text-[12px] font-bold text-slate-700">{{ detail.Quantity }} người</span>
                        </div>
                    </div>
                </div>

                <div class="flex border-b border-slate-100 shrink-0 px-2">
                    <button
                        v-for="tab in [
                            { key: 'info',         label: 'Thông tin', icon: 'fas fa-info-circle' },
                            { key: 'requirements', label: 'Yêu cầu',  icon: 'fas fa-list-check' },
                            { key: 'process',      label: 'Quy trình', icon: 'fas fa-tasks' },
                        ]"
                        :key="tab.key"
                        @click="activeTab = tab.key as typeof activeTab"
                        :class="[
                            'flex items-center gap-1.5 px-4 py-3 text-[12px] font-bold border-b-2 transition-all',
                            activeTab === tab.key
                                ? 'border-[#4c5bd4] text-[#4c5bd4]'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        ]"
                    >
                        <i :class="tab.icon" class="text-[10px]"></i>
                        {{ tab.label }}
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">

                    <div v-if="activeTab === 'info'" class="p-6 space-y-5">
                        <section>
                            <h4 class="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600 mb-2.5">
                                <i class="fas fa-align-left text-[#4c5bd4]"></i> Mô tả công việc
                            </h4>
                            <p class="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{{ detail.Description }}</p>
                        </section>

                        <section v-if="detail.WorkingSchedule">
                            <h4 class="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600 mb-2.5">
                                <i class="fas fa-clock text-[#4c5bd4]"></i> Lịch làm việc
                            </h4>
                            <p class="text-[13px] text-slate-600">{{ detail.WorkingSchedule }}</p>
                        </section>

                        <section v-if="detail.Benefits?.length">
                            <h4 class="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600 mb-2.5">
                                <i class="fas fa-gift text-[#4c5bd4]"></i> Quyền lợi
                            </h4>
                            <ul class="space-y-2">
                                <li v-for="(b, i) in detail.Benefits" :key="i" class="flex items-start gap-2 text-[13px] text-slate-600">
                                    <i class="fas fa-check text-emerald-500 mt-0.5 text-[10px] shrink-0"></i>
                                    <span>{{ b }}</span>
                                </li>
                            </ul>
                        </section>

                        <section v-if="detail.Tags?.length">
                            <h4 class="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600 mb-2.5">
                                <i class="fas fa-tags text-[#4c5bd4]"></i> Tags
                            </h4>
                            <div class="flex flex-wrap gap-1.5">
                                <span v-for="tag in detail.Tags" :key="tag"
                                      class="bg-[#eef0fd] text-[#4c5bd4] text-[11px] font-bold px-2.5 py-1 rounded-lg">
                                    {{ tag }}
                                </span>
                            </div>
                        </section>
                    </div>

                    <div v-if="activeTab === 'requirements'" class="p-6">
                        <h4 class="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600 mb-2.5">
                            <i class="fas fa-list-check text-[#4c5bd4]"></i> Yêu cầu ứng viên
                        </h4>
                        <p class="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{{ detail.Requirements }}</p>
                    </div>

                    <div v-if="activeTab === 'process'" class="p-6">
                        <div v-if="detail.InterviewProcess?.length">
                            <h4 class="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600 mb-2.5">
                                <i class="fas fa-tasks text-[#4c5bd4]"></i> Quy trình phỏng vấn
                            </h4>
                            <div class="relative pl-1 space-y-0">
                                <div
                                    v-for="(round, idx) in detail.InterviewProcess"
                                    :key="round.roundOrder"
                                    class="relative flex gap-4 pb-6 last:pb-0"
                                >
                                    <div class="flex flex-col items-center shrink-0">
                                        <div class="w-8 h-8 rounded-full bg-[#4c5bd4] flex items-center justify-center text-white text-[11px] font-black shrink-0 z-10 shadow-md">
                                            {{ round.roundOrder }}
                                        </div>
                                        <div v-if="idx < (detail.InterviewProcess?.length ?? 0) - 1" class="w-0.5 flex-1 bg-slate-100 mt-1"></div>
                                    </div>
                                    <div class="flex-1 pt-1 pb-2">
                                        <p class="font-bold text-slate-800 text-[13px]">{{ round.roundTitle }}</p>
                                        <p class="text-[12.5px] text-slate-500 mt-1 leading-relaxed">{{ round.details }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="flex flex-col items-center justify-center py-10 gap-2 text-center">
                            <i class="fas fa-clipboard-list text-slate-200 text-4xl"></i>
                            <p class="text-sm text-slate-400 font-medium">Chưa có thông tin quy trình phỏng vấn</p>
                        </div>
                    </div>
                </div>

                <div class="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <div v-if="detail.Status === 'Pending'" class="flex gap-2">
                        <button
                            @click="emit('action', { jobId: detail.JobID, type: 'Approve' })"
                            class="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[13px] font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <i class="fas fa-check"></i> Duyệt tin
                        </button>
                        <button
                            @click="emit('action', { jobId: detail.JobID, type: 'Reject' })"
                            class="flex-1 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-[13px] font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <i class="fas fa-times"></i> Từ chối
                        </button>
                    </div>
                    <div v-else class="text-center text-[12px] text-slate-400 font-medium py-1">
                        <i :class="statusConfig[detail.Status]?.icon" class="mr-1.5"></i>
                        Tin đã {{ statusConfig[detail.Status]?.label.toLowerCase() }}
                    </div>
                </div>
            </template>
        </div>
    </transition>
</template>

<style scoped>
.fade-backdrop-enter-active, .fade-backdrop-leave-active { transition: opacity 0.25s ease; }
.fade-backdrop-enter-from, .fade-backdrop-leave-to { opacity: 0; }

.drawer-slide-enter-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-slide-leave-active { transition: transform 0.22s cubic-bezier(0.4, 0, 1, 1); }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

.loader {
    width: 36px; height: 36px;
    border: 3px solid #eef0fd;
    border-top-color: #4c5bd4;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
</style>