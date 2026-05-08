<script setup lang="ts">
import SearchJob from './SearchJob.vue';
import bannerVideo from '../assets/banner1.mp4';
import { useJobStore } from '../stores/job';
import { useRouter } from 'vue-router';
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { Search, Plus, ChevronRight, ChevronLeft } from 'lucide-vue-next';
import type { IJob } from '../types/job';

const jobStore = useJobStore();
const router = useRouter();
const searchQuery = ref('');
const searchResults = ref<IJob[]>([]);
const showSidebar = ref(false);
const isSearching = ref(false);
const currentKeyword = ref('');

const currentPage = ref(1);
const itemsPerPage = 5

const totalPages = computed(() => {
    return Math.ceil((jobStore.listCategoryJobs?.length || 0) / itemsPerPage);
});

const displayedCategories = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return (jobStore.listCategoryJobs || []).slice(start, start + itemsPerPage);
});

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

const handleSearch = async (keywordToSearch?: string) => {
    const query = typeof keywordToSearch === 'string' ? keywordToSearch : searchQuery.value;
    if (!query.trim()) return;

    showSidebar.value = true;
    isSearching.value = true;
    currentKeyword.value = query;
    await jobStore.fetchJobSearch(query);
    searchResults.value = jobStore.listJobSearch;
    isSearching.value = false;
};
const goToCategory = (category: any) => {
    router.push({
        name: 'search-by-category',
        params: { id: category.CategoryID }, 
        query: { name: category.CategoryName }
    });
};
interface Snowflake {
    x: number;
    y: number;
    radius: number;
    speed: number;
    opacity: number;
    drift: number;
    driftSpeed: number;
    angle: number;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number;
let resizeObserver: ResizeObserver | null = null;

const initSnow = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const flakes: Snowflake[] = [];
    let initialized = false;

    const resize = () => {
        const { offsetWidth, offsetHeight } = canvas;
        if (!offsetWidth || !offsetHeight) return;

        canvas.width = offsetWidth;
        canvas.height = offsetHeight;

        if (!initialized) {
            initialized = true;
            flakes.length = 0;
            for (let i = 0; i < 60; i++) {
                flakes.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 3.5 + 1,
                    speed: Math.random() * 0.8 + 0.3,
                    opacity: Math.random() * 0.5 + 0.3,
                    drift: Math.random() * 2 - 1,
                    driftSpeed: Math.random() * 0.01 + 0.003,
                    angle: Math.random() * Math.PI * 2,
                });
            }
        }
    };

    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);
    resize();

    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        flakes.forEach((f) => {
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.angle);
            ctx.globalAlpha = f.opacity;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = f.radius * 0.4;
            ctx.lineCap = 'round';

            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, f.radius * 2.5);
                ctx.moveTo(0, f.radius * 1.2);
                ctx.lineTo(f.radius * 0.7, f.radius * 0.5);
                ctx.moveTo(0, f.radius * 1.2);
                ctx.lineTo(-f.radius * 0.7, f.radius * 0.5);
                ctx.stroke();
            }

            ctx.restore();

            f.y += f.speed;
            f.angle += f.driftSpeed;
            f.x += Math.sin(f.angle) * f.drift;

            if (f.y > canvas.height + 10) {
                f.y = -10;
                f.x = Math.random() * canvas.width;
            }
            if (f.x < -10) f.x = canvas.width + 10;
            if (f.x > canvas.width + 10) f.x = -10;
        });

        animationId = requestAnimationFrame(draw);
    };

    draw();
};

onMounted(async () => {
    await nextTick();
    initSnow();
    await jobStore.fetchCategories();
});

onUnmounted(() => {
    cancelAnimationFrame(animationId);
    resizeObserver?.disconnect();
});
</script>

<template>
    <section class="relative bg-[#4c5bd4] pt-10 pb-16 px-4 overflow-hidden">
        <canvas
            ref="canvasRef"
            class="absolute inset-0 w-full h-full pointer-events-none"
            style="z-index: 0;"
        />

        <div class="max-w-6xl mx-auto relative" style="z-index: 1;">

            <h1 class="text-white text-xl md:text-2xl font-bold mb-6">
                Tìm việc làm nhanh – Hàng ngàn cơ hội việc làm mới trên toàn quốc
            </h1>

            <div class="flex items-center gap-3 mb-8">
                <div class="flex flex-1 bg-white rounded-full p-1 shadow-md items-center">
                    <div class="flex items-center flex-[2] px-4 gap-2 border-r border-gray-200">
                        <Search class="text-gray-500 w-5 h-5" />
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Tìm bất cứ thứ gì liên quan đến công việc mà bạn muốn..."
                            class="w-full py-2.5 outline-none text-sm"
                            @keyup.enter="handleSearch()"
                        />
                    </div>
                    <button
                        class="bg-[#f1f864] hover:bg-yellow-300 text-gray-800 font-bold py-2.5 px-8 rounded-full transition-all text-sm"
                        @click="handleSearch()"
                    >
                        Tìm kiếm
                    </button>
                </div>

                <button class="bg-[#89a3f5] hover:bg-blue-400 p-2.5 rounded-md text-white shadow-sm transition-all">
                    <Plus class="w-6 h-6" />
                </button>
            </div>

            <div class="flex flex-col md:flex-row gap-4">

                <div class="w-full md:w-64 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col justify-between">
                    <ul class="py-2 flex-1 min-h-[264px]">
                        <li
                            v-for="cat in displayedCategories"
                            @click="goToCategory(cat)"
                            :key="cat.CategoryName"
                            class="flex items-center justify-between px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 group transition-colors"
                        >
                            <span class="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate max-w-[180px]" :title="cat.CategoryName">
                                {{ cat.CategoryName }}
                            </span>
                            <ChevronRight class="w-4 h-4 text-gray-400 group-hover:text-blue-600 shrink-0" />
                        </li>
                    </ul>
                    
                    <div class="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/80 mt-auto">
                        <button 
                            @click="prevPage" 
                            :disabled="currentPage === 1"
                            class="p-1 rounded bg-white border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft class="w-4 h-4" />
                        </button>
                        <span class="text-xs font-semibold text-gray-500">
                            {{ currentPage }} / {{ totalPages || 1 }}
                        </span>
                        <button 
                            @click="nextPage" 
                            :disabled="currentPage === totalPages || totalPages === 0"
                            class="p-1 rounded bg-white border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div class="flex-1 bg-black rounded-lg min-h-[280px] flex items-center justify-center overflow-hidden relative shadow-lg group">
                    <video 
                        autoplay 
                        loop 
                        muted 
                        playsinline 
                        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 scale-105 group-hover:scale-110"
                    >
                        <source :src="bannerVideo" type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ thẻ video.
                    </video>
                    <div class="absolute inset-0 bg-black/10 pointer-events-none"></div>
                </div>

            </div>
        </div>
    </section>

    <SearchJob
        v-if="showSidebar"
        :jobs="searchResults"
        :loading="isSearching"
        :keyword="currentKeyword"
        @close="showSidebar = false"
        @search="handleSearch"
        @view-job=""
    />
</template>

<style scoped>
select {
    background-image: none;
}
</style>