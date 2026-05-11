<script setup lang="ts">
import SearchBar from '../components/SearchBar.vue';
import Chat from '../components/Chat.vue';
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';
import SearchJob from '../components/SearchJob.vue';
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { formatSalary, formatDate } from '../utils/format';
import { storeToRefs } from 'pinia';
import { useJobStore } from '../stores/job'; 
import { useEmployerStore } from '../stores/employer';
import { useRouter } from 'vue-router';
import { fetchProvinces } from '../services/province';
import { 
    MapPin, Calendar, CircleDollarSign, Filter, ChevronDown, 
    Briefcase, ChevronLeft, ChevronRight, 
    LayoutGrid, Megaphone, Headset, Monitor, Home, Calculator, Building2, X 
} from 'lucide-vue-next';
import type { IJob } from '../types/job';
const router = useRouter();
const jobStore = useJobStore();
const employerStore = useEmployerStore();

const topEmployersLogos = ref<string[]>([]);
const provinces = ref<{ name: string; code: number }[]>([]);
const filterType = ref<'location' | 'category' | 'salary'>('location');
const { jobs, totalPages, loading } = storeToRefs(jobStore);
const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const searchResults = ref<IJob[]>([]);
const showSidebar = ref(false);
const isSearching = ref(false);
const currentKeyword = ref('');

const filterState = reactive({
    page: 1,
    limit: 27,
    categoryId: undefined as number | undefined,
    location: '',
    minSalary: undefined as number | undefined,
    maxSalary: undefined as number | undefined,
});

const quickOptions = computed(() => {
    if (filterType.value === 'location') {
        return [
        { label: 'Tất cả', value: '' },
        { label: 'Hà Nội', value: 'Hà Nội' },
        { label: 'Hồ Chí Minh', value: 'Hồ Chí Minh' },
        { label: 'Đà Nẵng', value: 'Đà Nẵng' },
        ];
    } else if (filterType.value === 'category') {
        const dynamicCategories = jobStore.listCategoryJobs.map(cat => ({
            label: cat.CategoryName,
            value: cat.CategoryID
        }));
        
        return [
        { label: 'Tất cả', value: undefined },
        ...dynamicCategories
        ];
    } else {
        return [
        { label: 'Tất cả', value: { min: undefined, max: undefined } },
        { label: 'Dưới 10tr', value: { min: 0, max: 10000000 } },
        { label: '10 - 20tr', value: { min: 10000000, max: 20000000 } },
        { label: 'Trên 20tr', value: { min: 20000000, max: 999999999 } },
        ];
    }
});

const selectQuickOption = (option: any) => {
    if (filterType.value === 'location') filterState.location = option.value;
    if (filterType.value === 'category') filterState.categoryId = option.value;
    if (filterType.value === 'salary') {
        filterState.minSalary = option.value.min;
        filterState.maxSalary = option.value.max;
    }
};

const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
        filterState.page = page; 
        window.scrollTo({ top: 500, behavior: 'smooth' });
    }
};
watch(
    [
        () => filterState.location,
        () => filterState.categoryId,
        () => filterState.minSalary,
        () => filterState.maxSalary
    ], 
    () => {
        filterState.page = 1;
        jobStore.fetchJobs({ ...filterState }); 
    }
);

watch(
    () => filterState.page,
    (newPage, oldPage) => {
        if (newPage !== oldPage) {
            jobStore.fetchJobs({ ...filterState });
        }
    }
);

onMounted(async () => {
    const state = window.history.state;
    if(state && state.loginSuccess) {
        showNotify.value = true;
        messageNotify.value = 'Đăng nhập thành công!';
        isSuccessNotify.value = true;
        window.history.replaceState({}, '');
    }
    
    await jobStore.fetchJobs(filterState);
    provinces.value = await fetchProvinces();
    jobStore.fetchCategories();
    topEmployersLogos.value = await employerStore.fetchLogoTopEmployers();
});

const isActiveOption = (opt: any) => {
    if (filterType.value === 'location') {
        return filterState.location === opt.value;
    }
    if (filterType.value === 'category') {
        return filterState.categoryId === opt.value;
    }
    if (filterType.value === 'salary') {
        return filterState.minSalary === opt.value.min && filterState.maxSalary === opt.value.max;
    }
    return false;
};

const viewJobDetail = (jobId: any) => {
    router.push({ name: 'job-detail', params: { id: jobId } });
};

const popularCategories = [
    { name: 'Việc làm Quản trị kinh doanh', icon: CircleDollarSign },
    { name: 'Việc làm Marketing - PR', icon: Megaphone },
    { name: 'Việc làm Chăm sóc khách hàng', icon: Headset },
    { name: 'Việc làm IT phần mềm', icon: Monitor },
    { name: 'Việc làm KD bất động sản', icon: Home },
    { name: 'Việc làm Kế toán - Kiểm toán', icon: Calculator },
];
const handleSearch = async (keywordToSearch?: string) => {
    const query = typeof keywordToSearch === 'string' ? keywordToSearch : currentKeyword.value;
    if (!query.trim()) return;

    showSidebar.value = true;
    isSearching.value = true;
    currentKeyword.value = query;
    await jobStore.fetchJobSearch(query);
    searchResults.value = jobStore.listJobSearch;
    isSearching.value = false;
};
const hasActiveFilters = computed(() => {
    return (
        filterState.location !== '' ||
        filterState.categoryId !== undefined ||
        filterState.minSalary !== undefined ||
        filterState.maxSalary !== undefined
    );
});

const clearAllFilters = () => {
    filterState.location = '';
    filterState.categoryId = undefined;
    filterState.minSalary = undefined;
    filterState.maxSalary = undefined;
    filterState.page = 1;
};

const handleLocationChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    
    if (target) {
        filterState.location = target.value;
    }
};
</script>

<template>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
    <Loading v-if="jobStore.loading"/>
    <SearchBar />
    <SearchJob
        v-if="showSidebar"
        :jobs="searchResults"
        :loading="isSearching"
        :keyword="currentKeyword"
        @close="showSidebar = false"
        @search="handleSearch"
        @view-job=""
    />
    <div class="max-w-6xl mx-auto mt-4 px-4">
        <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-6 flex-wrap">   
            <div class="relative group border rounded-md px-3 py-1.5 flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-white transition-all">
                <Filter class="w-4 h-4 text-gray-500" />
                <span class="text-sm text-gray-600">Lọc theo:</span>
                <select 
                    v-model="filterType" 
                    class="font-bold text-sm bg-transparent outline-none cursor-pointer pr-4 appearance-none"
                    >
                    <option value="location">Địa điểm</option>
                    <option value="category">Thể loại</option>
                    <option value="salary">Mức lương</option>
                </select>
                <ChevronDown class="w-4 h-4 text-gray-400 absolute right-2 pointer-events-none" />
            </div>
        
            <div class="flex items-center gap-8 flex-1 overflow-x-auto no-scrollbar">
                
                <button 
                    v-for="(opt, index) in quickOptions" 
                    :key="index"
                    @click="selectQuickOption(opt)"
                    class="px-5 py-1.5 rounded-full text-sm transition-all border shrink-0 whitespace-nowrap"
                    :class="[
                    isActiveOption(opt) 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                    ]"
                    >
                    {{ opt.label }}
                </button>
                
                <div v-if="filterType === 'location'" class="relative flex-shrink-0 ml-2">
                   <select 
                        :value="['', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'].includes(filterState.location) ? '' : filterState.location"
                        @change="handleLocationChange"
                        class="pl-4 pr-8 py-1.5 rounded-full text-sm transition-all outline-none cursor-pointer appearance-none border whitespace-nowrap font-medium"
                        :class="[
                        !['', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'].includes(filterState.location)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                        ]"
                    >
                        <option value="" disabled hidden>Tỉnh thành khác...</option>
                        <option 
                            v-for="prov in provinces.filter(p => !['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'].includes(p.name))" 
                            :key="prov.code" 
                            :value="prov.name"
                            class="text-gray-800 bg-white"
                        >
                            {{ prov.name }}
                        </option>
                        <option value="">{{ provinces.length }}</option>
                    </select>
                
                    <ChevronDown 
                    class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" 
                    :class="!['', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'].includes(filterState.location) ? 'text-white' : 'text-gray-500'"
                    />
                </div>
            </div>
        </div>

        
    </div>

    <div class="max-w-6xl mx-auto mt-8 px-4 pb-20">
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">     
            <div class="flex items-center gap-2 border-b pb-4 mb-6">
                <div class="bg-blue-100 p-1.5 rounded-full">
                    <Briefcase class="w-5 h-5 text-blue-600" />
                </div>
                <div class="flex justify-between items-center w-full">
                    <h2 class="font-bold text-gray-800 uppercase">Việc làm thương hiệu</h2>
                    <div v-if="hasActiveFilters" class="flex justify-end mt-2 px-1">
                        <button
                            @click="clearAllFilters"
                            class="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 bg-white hover:bg-red-50 px-3 py-1 rounded-full transition-all"
                        >
                            <X class="w-3.5 h-3.5" />
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            </div>
            
            <div v-if="loading" class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-blue-600 font-medium">Đang tải dữ liệu...</span>
            </div>
            
            <div v-else-if="jobs.length === 0" class="text-center py-12 text-gray-500">
                Không tìm thấy công việc nào phù hợp với tiêu chí lọc.
            </div>
            
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div v-for="job in jobs" :key="job.JobID"  @click="viewJobDetail(job.JobID)"
                    class="flex items-start gap-3 bg-white border border-gray-200 p-3 rounded-sm hover:shadow-md transition-shadow cursor-pointer group">
                    
                    <div class="flex-shrink-0">
                        <div class="w-[85px] h-[85px] rounded-full bg-[#d9d9d9] border border-blue-400 flex items-center justify-center overflow-hidden p-1">
                            <img :src="job.CompanyLogo || '/src/assets/bg-login.jpg'" class="w-full h-full object-cover mix-blend-multiply"/>
                        </div>
                    </div>
                    
                    <div class="flex-1 flex flex-col min-w-0">
                        <h3 class="text-[#5161e2] font-semibold text-[15px] leading-snug truncate group-hover:underline">
                            {{ job.Title }}
                        </h3>
                        <p class="text-[#666] text-[13px] truncate mt-0.5" :title="job.CompanyName">{{ job.CompanyName }}</p>
                        
                        <div class="flex items-center gap-1 text-[#888] text-[12px] mt-1">
                            <MapPin class="w-3.5 h-3.5 text-blue-400" />
                            <span>{{ job.Location }}</span>
                        </div>
                        
                        <div class="flex items-center justify-between mt-auto pt-2">
                            <div class="flex items-center gap-1 text-[#999] text-[12px]">
                                <Calendar class="w-3.5 h-3.5" />
                                <span>{{ formatDate(job.CreatedAt) }}</span>
                            </div>
                            <div class="flex items-center gap-1 text-[#d866d3] font-medium text-[13px]">
                                <CircleDollarSign class="w-4 h-4" />
                                <span>{{ formatSalary(job.SalaryMin, job.SalaryMax) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        
            <div v-if="totalPages > 1 && !loading" class="flex flex-col items-center mt-10">
                <div class="flex gap-4 items-center">
                    <button 
                        @click="goToPage(filterState.page - 1)"
                        :disabled="filterState.page === 1"
                        class="p-2 border rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                        <ChevronLeft class="w-4 h-4" />
                    </button>
                    
                    <div class="flex gap-2">
                        <button 
                            v-for="page in totalPages" 
                            :key="page"
                            @click="goToPage(page)"
                            class="h-1.5 rounded transition-all duration-300"
                            :class="[filterState.page === page ? 'w-10 bg-blue-600' : 'w-6 bg-gray-200 hover:bg-gray-300']"
                        ></button>
                    </div>
                    
                    <button 
                        @click="goToPage(filterState.page + 1)"
                        :disabled="filterState.page === totalPages"
                        class="p-2 border rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                        <ChevronRight class="w-4 h-4" />
                    </button>
                </div>
                <p class="text-xs text-gray-400 mt-3">Trang {{ filterState.page }} / {{ totalPages }}</p>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
            <div class="flex items-center gap-2 border-b pb-4 mb-6">
                <div class="bg-blue-100 p-1.5 rounded-full">
                    <LayoutGrid class="w-5 h-5 text-blue-600" />
                </div>
                <h2 class="font-bold text-gray-800 uppercase">Việc làm theo ngành nghề</h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div 
                    v-for="(cat, index) in popularCategories" 
                    :key="index"
                    @click="handleSearch(cat.name)"
                    class="bg-[#f8f9fa] border border-transparent hover:border-blue-200 hover:shadow-md transition-all cursor-pointer rounded-xl py-8 px-4 flex flex-col items-center justify-center gap-4 group"
                >
                    <div class="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <component :is="cat.icon" class="w-8 h-8" />
                    </div>
                    
                    <span class="text-[15px] font-medium text-gray-700 group-hover:text-blue-600 text-center transition-colors">
                        {{ cat.name }}
                    </span>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8 overflow-hidden">
            <div class="flex items-center gap-2 border-b pb-4 mb-8">
                <div class="bg-blue-100 p-1.5 rounded-full">
                    <Building2 class="w-5 h-5 text-blue-600" />
                </div>
                <h2 class="font-bold text-gray-800 uppercase">Nhà tuyển dụng tiêu biểu</h2>
            </div>

            <div class="marquee-container py-4">
                <div class="marquee-content">
                    <div v-for="(logo, index) in topEmployersLogos" :key="'set1-' + index" class="logo-bubble group">
                        <img :src="logo" alt="Employer Logo" />
                    </div>
                    <div v-for="(logo, index) in topEmployersLogos" :key="'set2-' + index" class="logo-bubble group">
                        <img :src="logo" alt="Employer Logo" />
                    </div>
                </div>
            </div>
        </div>

    </div>
    
    <Chat />
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.marquee-container {
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    position: relative;
    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
}

.marquee-content {
    display: inline-flex;
    align-items: center;
    gap: 40px;
    padding: 20px 0 40px 0;
    animation: scrollLeftToRight 30s linear infinite;
}

.marquee-content:hover {
    animation-play-state: paused;
}

@keyframes scrollLeftToRight {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0%); }
}

.logo-bubble {
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 6px 23px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #f1f5f9;
    padding: 15px;
}

.logo-bubble:hover {
    transform: scale(1.15) !important;
    box-shadow: 0 8px 25px rgba(76, 91, 212, 0.25);
    border-color: #4c5bd4;
    z-index: 10;
}

.logo-bubble img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
}

.logo-bubble:nth-child(even) {
    width: 130px;
    height: 130px;
    margin-top: -40px; 
}

.logo-bubble:nth-child(odd) {
    width: 100px;
    height: 100px;
    margin-top: 50px; 
}

.logo-bubble:nth-child(3n) {
    width: 160px;
    height: 160px;
    margin-top: 10px;
}
</style>