
<script setup lang="ts">
import SidebarEmployer from '../../components/Employer/SidebarEmployer.vue';
import VueApexCharts from "vue3-apexcharts";
import JobDetail from '../../components/Employer/JobDetail.vue';
import Loading from '../../components/Loading.vue';
import router from '../../router';
import { useEmployerStore } from '../../stores/employer';
import { useJobStore } from '../../stores/job';
import { useApplicationStore } from '../../stores/jobApplication';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { ApexOptions } from 'apexcharts';

const loading = ref<boolean>(false);
const Route = useRouter();
const useJob = useJobStore();
const useEmployer = useEmployerStore();
const useApplication = useApplicationStore();

const isYearDropdownOpen = ref(false);
const availableYears = [2024, 2025, 2026];
const selectedYear = ref(2026);


type FilterType = 'week' | 'month' | 'year';
const filterType = ref<FilterType>('week');

type StatItem = {
    label: string;
    value: string | number;
    percentage: string;
    trendUp: boolean;
    icon: string;
    bgColor: string;
    textColor: string;
};
const stats = ref<StatItem[]>([]);

type ActiveJob = {
    id: number;
    title: string;
    applicants: number;
    timeLeft: string;
};
const activeJobs = ref<ActiveJob[]>([]);

const chartOptions = ref<ApexOptions>({
    chart: { 
        type: 'area', 
        toolbar: { show: false }, 
        fontFamily: 'sans-serif',
        width: '100%' 
    },
    colors: ['#2563eb'],
    stroke: { curve: 'smooth', width: 3.5 },
    fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] }
    },
    xaxis: {
        categories: [],
        labels: { style: { colors: '#64748b', fontWeight: 600 } },
        axisBorder: { show: false },
        axisTicks: { show: false }
    },
    yaxis: { labels: { style: { colors: '#64748b', fontWeight: 600 } } },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 5 },
    dataLabels: { enabled: false },
    tooltip: { theme: 'light' }
});

const chartSeries = ref([
    {
        name: "Lượt ứng tuyển",
        data: []
    }
]);
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const formatTimeLeft = (expiredDate: string | Date | null) => {
    if (!expiredDate) return 'Không rõ';

    const now = new Date();
    const exp = new Date(expiredDate);

    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff > 1) return `Còn ${diff} ngày`;
    if (diff === 1) return 'Còn 1 ngày';
    if (diff === 0) return 'Hết hạn hôm nay';

    return 'Đã hết hạn';
};
const loadChart = async () => {
    if (selectedYear.value !== 2026) {
        chartSeries.value = [{
            name: "Lượt ứng tuyển",
            data: []
        }];

        chartOptions.value = {
            ...chartOptions.value,
            xaxis: {
                ...chartOptions.value.xaxis,
                categories: []
            }
        };
        stats.value = [
            { label: 'Tin tuyển dụng', value: 0, percentage: '0', trendUp: false, icon: 'fa-solid fa-briefcase', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
            { label: 'Tổng hồ sơ', value: 0, percentage: '0', trendUp: false, icon: 'fa-solid fa-user-group', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
            { label: 'Đã tuyển', value: 0, percentage: '0', trendUp: false, icon: 'fa-solid fa-check-double', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
            { label: 'Tỷ lệ từ chối', value: 0, percentage: '0', trendUp: false, icon: 'fa-solid fa-user-slash', bgColor: 'bg-rose-100', textColor: 'text-rose-600' }
        ];
        await delay(300);
        return;
    }
    const res = await useApplication.getChartStatsStore(filterType.value);

    if (!res || useApplication.error) {
        loading.value = false;
        return;
    }

    chartSeries.value = [{
        name: "Lượt ứng tuyển",
        data: res.data
    }];

    chartOptions.value = {
        ...chartOptions.value,
        xaxis: {
            ...chartOptions.value.xaxis,
            categories: res.categories
        }
    };
};

const selectYear = (year: number) => {
    selectedYear.value = year;
    isYearDropdownOpen.value = false;
};

const updateFilter = (type: FilterType) => {
    filterType.value = type;
};


const isOpenJobDetail = ref(false);
const selectedJobId = ref<number | null>(null);

const handleOpenJob = (jobId: number) => {
    selectedJobId.value = jobId;
    isOpenJobDetail.value = true;
};

watch(filterType, async () => {
    loading.value = true;

    await loadChart();

    loading.value = false;
});
watch(selectedYear, async () => {
    loading.value = true;

    if (selectedYear.value !== 2026) {
        await loadChart();

        stats.value = [
            { label: 'Tin tuyển dụng', value: 0, percentage: '0', trendUp: false, icon: 'fa-solid fa-briefcase', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
            { label: 'Tổng hồ sơ', value: 0, percentage: '0', trendUp: false, icon: 'fa-solid fa-user-group', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
            { label: 'Đã tuyển', value: 0, percentage: '0', trendUp: false, icon: 'fa-solid fa-check-double', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
            { label: 'Tỷ lệ từ chối', value: 0, percentage: '0', trendUp: false, icon: 'fa-solid fa-user-slash', bgColor: 'bg-rose-100', textColor: 'text-rose-600' }
        ];

        activeJobs.value = [];

        loading.value = false;
        return;
    }

    const [d] = await Promise.all([
        useEmployer.getDashboardStatsStore(),
        useJob.getJobOfMeStore(),
        loadChart()
    ]);

    stats.value = [
        { label: 'Tin tuyển dụng', value: d.jobs.value, percentage: d.jobs.percentage, trendUp: d.jobs.trendUp, icon: 'fa-solid fa-briefcase', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
        { label: 'Tổng hồ sơ', value: d.applications.value, percentage: d.applications.percentage, trendUp: d.applications.trendUp, icon: 'fa-solid fa-user-group', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
        { label: 'Đã tuyển', value: d.hired.value, percentage: d.hired.percentage, trendUp: d.hired.trendUp, icon: 'fa-solid fa-check-double', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
        { label: 'Tỷ lệ từ chối', value: d.rejected.value, percentage: d.rejected.percentage, trendUp: d.rejected.trendUp, icon: 'fa-solid fa-user-slash', bgColor: 'bg-rose-100', textColor: 'text-rose-600' }
    ];

    activeJobs.value = useJob.listJobMe
        .filter(j => j.ExpiredDate && new Date(j.ExpiredDate) >= new Date())
        .slice(0, 5)
        .map(j => ({
            id: j.JobID ?? 0,
            title: j.Title,
            applicants: j.ApplicationCount,
            timeLeft: formatTimeLeft(j.ExpiredDate ?? null)
        }));

    loading.value = false;
});
onMounted(async () => {
    loading.value = true;
    const [d] = await Promise.all([
        useEmployer.getDashboardStatsStore(),
        useJob.getJobOfMeStore(),
        loadChart()
    ]);

    stats.value = [
        { label: 'Tin tuyển dụng', value: d.jobs.value, percentage: d.jobs.percentage, trendUp: d.jobs.trendUp, icon: 'fa-solid fa-briefcase', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
        { label: 'Tổng hồ sơ', value: d.applications.value, percentage: d.applications.percentage, trendUp: d.applications.trendUp, icon: 'fa-solid fa-user-group', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
        { label: 'Đã tuyển', value: d.hired.value, percentage: d.hired.percentage, trendUp: d.hired.trendUp, icon: 'fa-solid fa-check-double', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
        { label: 'Tỷ lệ từ chối', value: d.rejected.value, percentage: d.rejected.percentage, trendUp: d.rejected.trendUp, icon: 'fa-solid fa-user-slash', bgColor: 'bg-rose-100', textColor: 'text-rose-600' }
    ];

    activeJobs.value = useJob.listJobMe
        .filter(j => j.ExpiredDate && new Date(j.ExpiredDate) >= new Date())
        .slice(0, 5)
        .map(j => ({
            id: j.JobID ?? 0,
            title: j.Title,
            applicants: j.ApplicationCount,
            timeLeft: formatTimeLeft(j.ExpiredDate ?? null)
        }));    
    loading.value = false;  
});
</script>

<template>
    <div class="flex flex-col lg:flex-row h-screen w-full bg-[#F1F5F9] font-sans text-slate-800 overflow-hidden">
        
        <SidebarEmployer />
        
        <main class="flex-1 p-4 md:p-8 overflow-y-auto h-full">
            
            <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                <div>
                    <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Tổng quan hệ thống</h1>
                    <p class="text-slate-500 mt-1 font-medium italic">Báo cáo hiệu suất tuyển dụng mới nhất.</p>
                </div>
                
                <div class="flex gap-3 w-full md:w-auto relative items-center">
                    <div class="relative">
                        <button 
                        @click="isYearDropdownOpen = !isYearDropdownOpen"
                        class="flex items-center justify-between min-w-[140px] px-4 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-xl font-bold shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95"
                        >
                        <span>Năm {{ selectedYear }}</span>
                        <i 
                        class="fa-solid fa-chevron-down text-[10px] ml-3 transition-transform duration-300"
                        :class="{ 'rotate-180': isYearDropdownOpen }"
                        ></i>
                    </button>
                    
                    <transition name="fade-slide">
                        <div 
                        v-if="isYearDropdownOpen" 
                        class="absolute right-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-[100] py-2 overflow-hidden"
                        >
                        <div 
                        v-for="year in availableYears" 
                        :key="year"
                        @click="selectYear(year)"
                        :class="[selectedYear === year ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-gray-50']"
                        class="px-4 py-2 text-sm font-bold cursor-pointer transition-colors"
                        >
                        Năm {{ year }}
                    </div>
                </div>
            </transition>
        </div>
        
        <button @click="Route.push({path: 'create-job'})" class="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95 text-sm">
            + Đăng tin mới
        </button>
    </div>
</header>

<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
    <div v-for="stat in stats" :key="stat.label" 
    class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-default">
    <div class="flex items-center justify-between">
        <div :class="[stat.bgColor, stat.textColor, 'p-3 rounded-xl transition-transform group-hover:scale-110 text-2xl flex items-center justify-center font-bold']">
            <i :class="stat.icon"></i>
        </div>
        <span :class="[stat.trendUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50', 'text-xs font-bold px-2 py-1 rounded-lg']">
            {{ stat.trendUp ? '↑' : '↓' }} {{ stat.percentage }}%
        </span>
    </div>
    <div class="mt-5 flex items-center gap-2">
        <h3 class="text-2xl font-bold text-slate-800">{{ stat.value }}</h3>
        <p class="text-sm font-semibold text-slate-500">{{ stat.label }}</p>
    </div>
</div>
</section>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <section class="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-xl font-bold text-slate-800">Lưu lượng ứng tuyển</h2>
            <div class="flex bg-gray-100 p-1 rounded-lg shadow-inner">
                <button 
                v-for="type in (['week', 'month', 'year'] as const)" 
                :key="type"
                @click="updateFilter(type)"
                :class="[filterType === type ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700']"
                class="px-4 py-1.5 text-[11px] font-extrabold rounded-md transition-all duration-200 uppercase tracking-wider"
                >
                {{ type === 'week' ? 'Tuần' : type === 'month' ? 'Tháng' : 'Năm' }}
            </button>
        </div>
    </div>
    
    <div class="h-[320px] w-full overflow-hidden">
        <VueApexCharts
        type="area"
        height="100%"
        width="100%"
        :options="chartOptions"
        :series="chartSeries"
        />
    </div>
</section>

<section class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
    <h2 class="text-xl font-bold text-slate-800 mb-6">Đang hoạt động</h2>
    <div class="space-y-4 flex-1">
        <div v-for="job in activeJobs" :key="job.id" 
        class="group p-4 border border-gray-50 rounded-xl hover:bg-blue-50/50 hover:border-blue-100 transition-all cursor-pointer">
        <div @click="handleOpenJob(job.id)" class="flex justify-between items-start">
            <div class="max-w-[85%]">
                <h4 class="font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate">{{ job.title }}</h4>
                <p class="text-xs text-slate-500 mt-1 font-semibold">{{ job.applicants }} ứng viên • {{ job.timeLeft }}</p>
            </div>
            <div class="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse mt-1.5 shrink-0"></div>
        </div>
    </div>
</div>
<button @click="router.push({path: 'posted-jobs'})" class="w-full mt-6 py-3 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
    Quản lý tất cả tin
</button>
</section>
</div>

</main>
</div>
<JobDetail
    :isOpen="isOpenJobDetail"
    :jobId="selectedJobId" 
    @close="isOpenJobDetail = false"     
/>
<Loading v-if="loading" />
</template>