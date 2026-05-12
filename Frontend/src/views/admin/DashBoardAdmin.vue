<script setup lang="ts">
import SidebarAdmin from '../../components/admin/SidebarAdmin.vue';
import { useJobStore } from '../../stores/job';
import { useEmployerStore } from '../../stores/employer';
import { ref, onMounted, computed } from 'vue';
import { formatDate } from '../../utils/format';
import type { ChartItem } from '../../types/chart';
import type { ITopEmployer } from '../../types/employer';
import type { IJob } from '../../types/job';
import router from '../../router';

const job = useJobStore();
const employer = useEmployerStore();

const stats = ref([
    { id: 'users',     label: 'Tổng ứng viên',   value: 12847, change: +8.4,  icon: 'fas fa-user-tie',       color: '#4c5bd4', bg: '#eef0fd' },
    { id: 'employers', label: 'Nhà tuyển dụng',  value: 1340,  change: +3.2,  icon: 'fas fa-building',       color: '#0ea5e9', bg: '#e0f2fe' },
    { id: 'jobs',      label: 'Tin tuyển dụng',  value: 4512,  change: +12.1, icon: 'fas fa-briefcase',      color: '#10b981', bg: '#d1fae5' },
    { id: 'pending',   label: 'Chờ duyệt',       value: 87,    change: -5.3,  icon: 'fas fa-hourglass-half', color: '#f59e0b', bg: '#fef3c7' },
]);

const recentJobs = ref<IJob[]>([]);
const topEmployers = ref<ITopEmployer[]>([]);
const activityFeed = ref([
    { icon: 'fas fa-user-plus',    color: '#4c5bd4', text: 'Ứng viên mới <b>Nguyễn Văn A</b> vừa đăng ký',              time: '2 phút trước' },
    { icon: 'fas fa-briefcase',    color: '#10b981', text: 'Tin tuyển dụng <b>Senior React Dev</b> vừa được duyệt',      time: '15 phút trước' },
    { icon: 'fas fa-flag',         color: '#ef4444', text: 'Tin tuyển dụng <b>Nhân viên kinh doanh</b> bị báo cáo',      time: '1 giờ trước' },
    { icon: 'fas fa-building',     color: '#0ea5e9', text: 'Công ty <b>TMA Solutions</b> vừa đăng ký tài khoản',        time: '2 giờ trước' },
    { icon: 'fas fa-check-circle', color: '#10b981', text: '23 tin tuyển dụng được duyệt hôm nay',                      time: '3 giờ trước' },
]);

const chartData = ref<ChartItem[]>([]);
const chartMax = computed(() => {
    if (!chartData.value.length) return 10;
    return Math.max(...chartData.value.map(d => Math.max(d.jobs, d.users))) + 10;
});
const barHeight = (val: number) => `${(val / chartMax.value) * 100}%`;

const displayedValues = ref(stats.value.map(() => 0));
const statsForAdmin = ref<any>(null);
const isMobileMenuOpen = ref(false);
const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
});

onMounted(async () => {
    statsForAdmin.value = await job.fetchJobStatsForAdminStore();
    if (statsForAdmin.value) {
        const { candidateStats, jobStats, employerStats, jobStatsPending } = statsForAdmin.value;
        stats.value.forEach(stat => {
            if (stat.id === 'users')     { stat.value = candidateStats.currentMonth; stat.change = candidateStats.percentChange; }
            if (stat.id === 'employers') { stat.value = employerStats.currentMonth;  stat.change = employerStats.percentChange; }
            if (stat.id === 'jobs')      { stat.value = jobStats.currentMonth;       stat.change = jobStats.percentChange; }
            if (stat.id === 'pending')   { stat.value = jobStatsPending.currentMonth; stat.change = jobStatsPending.percentChange; }
        });
    }

    stats.value.forEach((stat, i) => {
        const target = stat.value;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) { displayedValues.value[i] = target; clearInterval(timer); }
            else { displayedValues.value[i] = Math.floor(current); }
        }, 1200 / steps);
    });

    const weekStats = await job.fetch7DayStatsForAdminStore();
    if (weekStats) {
        chartData.value = weekStats.candidateStats.map((c: any, i: number) => ({
            day: c.date.slice(5),
            users: c.count,
            jobs: weekStats.jobStats[i]?.count || 0,
        }));
    }

    topEmployers.value = await employer.fetchTopEmployers();
    recentJobs.value = await job.fetchTopJobsForAdminStore();
});

const formatNumber = (n: number) => n.toLocaleString('vi-VN');

const statusConfig: Record<string, { label: string; class: string }> = {
    Approved: { label: 'Hoạt động', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    Pending:  { label: 'Chờ duyệt', class: 'bg-amber-50 text-amber-600 border-amber-200' },
    Rejected: { label: 'Từ chối',   class: 'bg-red-50 text-red-500 border-red-200' },
};
</script>

<template>
    <div class="flex h-screen w-full bg-[#f1f3fb] overflow-hidden font-sans relative">
        <SidebarAdmin
            :is-open-mobile="isMobileMenuOpen"
            @close-mobile-menu="isMobileMenuOpen = false"
        />

        <div class="flex-1 flex flex-col h-full overflow-hidden">

            <header class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm shrink-0">
                <div class="flex items-center gap-3">
                    <button
                        class="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                        @click="isMobileMenuOpen = true"
                        aria-label="Mở menu"
                    >
                        <i class="fas fa-bars"></i>
                    </button>
                    <div>
                        <h1 class="text-base md:text-lg font-extrabold text-slate-800 tracking-tight leading-tight">Dashboard</h1>
                        <p class="text-[10px] md:text-xs text-slate-400 font-medium">{{ today }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 md:gap-3">
                    <button class="relative hidden sm:flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" aria-label="Thông báo">
                        <i class="fas fa-bell text-sm"></i>
                        <span class="absolute top-2 right-2 w-[7px] h-[7px] bg-red-500 rounded-full border-2 border-white box-content"></span>
                    </button>
                    <div class="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div class="w-7 h-7 rounded-full bg-[#4c5bd4] flex items-center justify-center shrink-0">
                            <i class="fas fa-user-shield text-white text-xs"></i>
                        </div>
                        <div class="hidden sm:block">
                            <p class="text-xs font-bold text-slate-700 leading-tight">Super Admin</p>
                            <p class="text-[10px] text-slate-400">admin@timviecfinder.vn</p>
                        </div>
                        <i class="fas fa-chevron-down text-[9px] text-slate-400 ml-1 hidden sm:block"></i>
                    </div>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 flex flex-col gap-4 lg:gap-6 custom-scrollbar">

                <section class="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    <div
                        v-for="(stat, i) in stats"
                        :key="stat.id"
                        class="group bg-white rounded-2xl md:rounded-[20px] p-4 md:p-5 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 fade-up"
                        :style="`animation-delay: ${i * 80}ms`"
                    >
                        <div class="flex items-start justify-between mb-3">
                            <div class="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center text-sm md:text-base shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110" :style="`background: ${stat.bg}; color: ${stat.color}`">
                                <i :class="[stat.icon]"></i>
                            </div>
                            <span 
                                class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" 
                                :class="stat.change >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'"
                            >
                                <i :class="stat.change >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'" class="text-[8px]"></i>
                                {{ Math.abs(stat.change) }}%
                            </span>
                        </div>
                        <p class="text-[22px] md:text-[26px] font-extrabold text-slate-800 leading-tight tabular-nums tracking-tight">{{ formatNumber(displayedValues[i]) }}</p>
                        <p class="text-[11px] text-slate-400 font-medium mt-1">{{ stat.label }}</p>
                    </div>
                </section>

                <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

                    <div class="lg:col-span-2 bg-white rounded-2xl md:rounded-[20px] border border-slate-100 shadow-sm p-4 md:p-5 flex flex-col overflow-hidden fade-up">
                        <div class="flex items-start justify-between mb-4 gap-3 flex-wrap">
                            <div>
                                <h2 class="text-sm md:text-[15px] font-extrabold text-slate-800">Hoạt động 7 ngày qua</h2>
                                <p class="text-[11px] text-slate-400 mt-0.5">Tin đăng & ứng viên mới theo ngày</p>
                            </div>
                            <div class="flex items-center gap-4 shrink-0">
                                <span class="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                    <span class="w-3 h-3 rounded-sm bg-[#4c5bd4]"></span>Tin đăng
                                </span>
                                <span class="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                    <span class="w-3 h-3 rounded-sm bg-[#f1f864] border border-amber-600"></span>Ứng viên
                                </span>
                            </div>
                        </div>
                        <div class="overflow-x-auto overflow-y-visible pb-1 custom-scrollbar">
                            <div class="flex items-end gap-2 md:gap-3 h-40 md:h-44 min-w-[300px] w-full">
                                <div v-for="d in chartData" :key="d.day" class="flex-1 flex flex-col items-center gap-1.5 h-full">
                                    <div class="flex items-end gap-[3px] md:gap-1 flex-1 w-full justify-center max-h-[calc(100%-20px)]">
                                        <div class="flex-1 max-w-[18px] md:max-w-none rounded-t md:rounded-t-md transition-all duration-700 ease-out relative cursor-pointer hover:opacity-80 group/bar bg-[#4c5bd4]" :style="`height: ${barHeight(d.jobs)}`">
                                            <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100 z-10">{{ d.jobs }} tin</div>
                                        </div>
                                        <div class="flex-1 max-w-[18px] md:max-w-none rounded-t md:rounded-t-md transition-all duration-700 ease-out relative cursor-pointer hover:opacity-80 group/bar bg-[#f1f864] border border-amber-600" :style="`height: ${barHeight(d.users)}`">
                                            <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100 z-10">{{ d.users }} UV</div>
                                        </div>
                                    </div>
                                    <span class="text-[10px] text-slate-400 font-medium text-center">{{ d.day }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-1 bg-white rounded-2xl md:rounded-[20px] border border-slate-100 shadow-sm p-4 md:p-5 flex flex-col fade-up">
                        <div class="flex items-start justify-between mb-4 gap-3 flex-wrap">
                            <h2 class="text-sm md:text-[15px] font-extrabold text-slate-800">Hoạt động gần đây</h2>
                            <button class="text-[11px] text-[#4c5bd4] font-semibold whitespace-nowrap shrink-0 hover:opacity-70 transition-opacity">Xem tất cả</button>
                        </div>
                        <div class="flex flex-col gap-3.5">
                            <div v-for="(act, i) in activityFeed" :key="i" class="flex items-start gap-2.5">
                                <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-[1px]" :style="`background: ${act.color}18; color: ${act.color}`">
                                    <i :class="[act.icon]" class="text-[11px]"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs text-slate-600 leading-snug" v-html="act.text"></p>
                                    <p class="text-[10px] text-slate-400 mt-0.5">{{ act.time }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

                    <div class="lg:col-span-2 bg-white rounded-2xl md:rounded-[20px] border border-slate-100 shadow-sm pt-4 md:pt-5 flex flex-col overflow-hidden fade-up">
                        <div class="flex items-start justify-between mb-4 gap-3 flex-wrap px-4 md:px-5">
                            <h2 class="text-sm md:text-[15px] font-extrabold text-slate-800">Tin tuyển dụng gần đây</h2>
                            <button @click="router.push({name: 'all-job-management'})" class="text-[11px] text-[#4c5bd4] font-semibold whitespace-nowrap shrink-0 hover:opacity-70 transition-opacity">Xem tất cả</button>
                        </div>
                        <div class="w-full overflow-x-auto custom-scrollbar">
                            <table class="w-full text-xs min-w-[520px] border-collapse">
                                <thead>
                                    <tr>
                                        <th class="text-left px-4 py-2.5 md:px-6 md:py-3 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-50">Vị trí</th>
                                        <th class="text-left px-4 py-2.5 md:px-6 md:py-3 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-50">Ngày</th>
                                        <th class="text-center px-4 py-2.5 md:px-6 md:py-3 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-50">Ứng viên</th>
                                        <th class="text-center px-4 py-2.5 md:px-6 md:py-3 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-50">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="j in recentJobs" :key="j.JobID" class="border-b border-slate-50 hover:bg-slate-50 transition-colors group/row last:border-0">
                                        <td class="px-4 py-3 md:px-6 md:py-3.5 align-middle">
                                            <p class="font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] md:max-w-[220px] transition-colors group-hover/row:text-[#4c5bd4]">{{ j.Title }}</p>
                                            <p class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                                <i class="fas fa-building text-[9px]"></i> {{ j.CompanyName }}
                                                <span class="text-slate-200 mx-0.5">·</span>
                                                <i class="fas fa-map-marker-alt text-[9px]"></i> {{ j.Location }}
                                            </p>
                                        </td>
                                        <td class="px-4 py-3 md:px-6 md:py-3.5 align-middle whitespace-nowrap text-[11px] text-slate-400">{{ formatDate(j.CreatedAt) }}</td>
                                        <td class="px-4 py-3 md:px-6 md:py-3.5 align-middle text-center font-bold text-slate-700 text-[12.5px]">{{ j.ApplicationCount }}</td>
                                        <td class="px-4 py-3 md:px-6 md:py-3.5 align-middle text-center">
                                            <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border', statusConfig[j.Status]?.class || 'bg-slate-50 text-slate-500 border-slate-200']">
                                                {{ statusConfig[j.Status]?.label || j.Status }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="lg:col-span-1 bg-white rounded-2xl md:rounded-[20px] border border-slate-100 shadow-sm p-4 md:p-5 flex flex-col fade-up">
                        <div class="flex items-start justify-between mb-4 gap-3 flex-wrap">
                            <h2 class="text-sm md:text-[15px] font-extrabold text-slate-800">Top nhà tuyển dụng</h2>
                            <button @click="router.push({name: 'employer-management'})" class="text-[11px] text-[#4c5bd4] font-semibold whitespace-nowrap shrink-0 hover:opacity-70 transition-opacity">Xem tất cả</button>
                        </div>
                        <div class="flex flex-col gap-1.5 md:gap-2">
                            <div
                                v-for="(emp, i) in topEmployers"
                                :key="emp.CompanyName"
                                class="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group/emp"
                            >
                                <div class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0" :class="i === 0 ? 'bg-[#f1f864] text-[#3a49c2]' : i === 1 ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-400'">
                                    {{ i + 1 }}
                                </div>
                                <div class="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[#eef0fd] border border-[#d8dcf9] flex items-center justify-center shrink-0">
                                    <i class="fas fa-building text-[#4c5bd4] text-xs"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs md:text-[13px] font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis transition-colors group-hover/emp:text-[#4c5bd4]">{{ emp.CompanyName }}</p>
                                    <p class="text-[9px] text-slate-400 flex items-center gap-1 mt-[1px]">
                                        <i class="fas fa-map-marker-alt text-[8px]"></i> {{ emp.Location }}
                                    </p>
                                </div>
                                <div class="text-right shrink-0">
                                    <p class="text-[13px] font-extrabold text-[#4c5bd4] leading-tight">{{ emp.JobCount }}</p>
                                    <p class="text-[9px] text-slate-400">tin đăng</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="pb-6"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }

.fade-up {
    animation: fadeUp 0.4s ease both;
}
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}
</style>