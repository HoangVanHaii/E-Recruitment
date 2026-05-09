<template>
    <div class="w-full bg-white rounded-none sm:rounded-2xl shadow-sm border-r sm:border border-gray-200">
        <div class="flex flex-col items-center justify-center border-b border-gray-200 pb-6 pt-5 mb-2">
            <h3 class="text-[15px] font-bold text-gray-800 mb-4 tracking-wide">Tiến trình hồ sơ</h3>
            
            <div class="relative w-[100px] h-[100px] flex items-center justify-center rounded-full bg-gray-50">
                <svg class="absolute inset-0 transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="#e2e8f0" stroke-width="6" fill="none" stroke-dasharray="6 4" />
                    <circle cx="50" cy="50" r="42" stroke="#1a237e" stroke-width="6" fill="none" stroke-linecap="round"
                            :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset" 
                            class="transition-all duration-1000 ease-out" />
                </svg>
                
                <span class="text-xl font-extrabold text-gray-900 relative z-10">{{ progress }}%</span>
            </div>
            
            <p class="text-[13px] text-gray-500 mt-4 font-medium flex items-center gap-1.5">
                <Eye class="w-4 h-4" /> Lượt xem: 0
            </p>
        </div>

        <div class="flex flex-col py-2">
            <button 
                v-for="tab in tabs" :key="tab.id"
                @click="$emit('change-tab', tab.id)"
                class="px-5 py-3.5 text-[14.5px] font-semibold text-left transition-all flex items-center gap-3 relative"
                :class="currentTab === tab.id ? 'bg-gray-200/50 text-blue-900' : 'text-slate-700 hover:bg-gray-50'"
            >
                <div v-if="currentTab === tab.id" class="absolute left-0 top-0 bottom-0 w-1 bg-blue-800"></div>
                
                <component :is="tab.icon" class="w-5 h-5" :class="currentTab === tab.id ? 'text-blue-900' : 'text-slate-700'" />
                {{ tab.name }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCandidateStore } from '../stores/candidate';
import { 
    Contact, 
    GraduationCap, 
    Briefcase, 
    Target, 
    FilePlus, 
    UploadCloud,
    Eye,
    FolderOpen
} from 'lucide-vue-next';

defineProps({
    currentTab: { 
        type: String, 
        required: true 
    }
});

defineEmits(['change-tab']);

// KHỞI TẠO STORE Ở ĐÂY ĐỂ TRÁNH LỖI ĐỎ (Dòng phép thuật bạn quên)
const candidateStore = useCandidateStore();

const tabs = [
    { id: 'contact', name: 'Thông tin liên hệ', icon: Contact },
    // { id: 'account', name: 'Tài khoản', icon: Settings },
    { id: 'education', name: 'Trình độ học vấn', icon: GraduationCap },
    { id: 'experience', name: 'Kinh nghiệm làm việc', icon: Briefcase },
    { id: 'project', name: 'Dự án tham gia', icon: FolderOpen },
    { id: 'skill', name: 'Kỹ năng cá nhân', icon: Target },
    { id: 'create_cv', name: 'Tạo CV mới', icon: FilePlus },
    { id: 'upload_cv', name: 'Tải CV từ máy tính', icon: UploadCloud },
];

const r = 42;
const circumference = 2 * Math.PI * r;

// Thuật toán tự động tính % dựa CHÍNH XÁC vào Schema hiện tại
const progress = computed(() => {
    let score = 0;
    const profile = candidateStore.profile;
    
    if (!profile) return 0;

    // 1. Nhóm Thông tin liên hệ / Cơ bản (Tối đa 40%)
    if (profile.FullName) score += 10;
    if (profile.AvatarUrl) score += 10;
    if (profile.Email) score += 5;
    if (profile.Phone) score += 5;
    if (profile.DateOfBirth) score += 5;
    if (profile.Address) score += 5;
    
    // 2. Nhóm Trình độ học vấn (Tối đa 20%)
    if (profile.education && profile.education.length > 0) score += 20;
    
    // 3. Nhóm Kinh nghiệm làm việc (Tối đa 20%)
    if (profile.experience && profile.experience.length > 0) score += 20;
    
    // 4. Nhóm Dự án tham gia (Tối đa 20%)
    if (profile.projects && profile.projects.length > 0) score += 20;

    return Math.min(score, 100); // Khóa trần 100%
});

// 3. Tính độ dài nét vẽ cần ẩn đi để tạo ra hiệu ứng phần trăm
const dashOffset = computed(() => {
    return circumference - (progress.value / 100) * circumference;
});
</script>