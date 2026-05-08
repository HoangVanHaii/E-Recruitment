<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCompanyStore } from '../stores/company';
import type { ICompanyOfMe } from '../types/company';

import Loading from './Loading.vue';
import Notify from './Notify.vue';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const isMobileMenuOpen = ref(false);
const isCollapsed = ref(false); // ← trạng thái thu gọn

const CompanyOfMe = ref<ICompanyOfMe | null>(null);
const useCompany = useCompanyStore();

interface SubMenuItem {
    id: string;
    label: string;
    routeName?: string;
}

interface MenuItem {
    id: string;
    label: string;
    icon: string;
    isOpen?: boolean;
    routeName?: string;
    subItems?: SubMenuItem[];
}

const menuItems = ref<MenuItem[]>([
    {
        id: 'account',
        label: 'Quản lý tài khoản',
        icon: 'fas fa-user-shield',
        isOpen: false,
        subItems: [
            { id: 'profile-update', label: 'Cập nhật hồ sơ', routeName: 'profile' },
            { id: 'change-password', label: 'Đổi mật khẩu', routeName: 'change-password' },
        ]
    },
    {
        id: 'post',
        label: 'Đăng tin',
        icon: 'fas fa-edit',
        isOpen: true,
        subItems: [
            { id: 'post-new', label: 'Đăng tin mới', routeName: 'create-job' },
            { id: 'post-history', label: 'Tin đã đăng', routeName: 'posted-jobs' }
        ]
    },
    {
        id: 'candidates',
        label: 'Ứng viên ứng tuyển',
        icon: 'fas fa-users',
        routeName: 'job-applications'
    },
    {
        id: 'stats',
        label: 'Thống kê JOB',
        icon: 'fas fa-chart-line',
    },
    {
        id: 'chat',
        label: 'Chat',
        icon: 'fas fa-comments',
        routeName: 'employer-chat'
    },
]);

const goRoute = (name?: string) => {
    if (name) {
        router.push({ name });
        isMobileMenuOpen.value = false;
    }
};

const handleClick = (item: MenuItem) => {
    if (isCollapsed.value) {
        // Khi thu gọn: click icon thì điều hướng luôn (nếu có routeName) hoặc mở rộng sidebar
        if (item.routeName) {
            router.push({ name: item.routeName });
            return;
        }
        // Nếu có submenu thì mở rộng sidebar trước
        isCollapsed.value = false;
        return;
    }

    if (item.routeName) {
        router.push({ name: item.routeName });
        isMobileMenuOpen.value = false;
    }

    if (item.subItems) {
        item.isOpen = !item.isOpen;
    }
};

const isParentActive = (item: MenuItem) => {
    if (item.routeName) return route.name === item.routeName;
    if (item.subItems) {
        return item.subItems.some(sub => sub.routeName === route.name);
    }
    return false;
};

watch(
    () => route.name,
    () => {
        menuItems.value.forEach(item => {
            if (item.subItems) {
                if (!item.isOpen && item.subItems.some(sub => sub.routeName === route.name)) {
                    item.isOpen = true;
                }
            }
        });
    },
    { immediate: true }
);

onMounted(async () => {
    loading.value = true;
    CompanyOfMe.value = await useCompany.getCompanyOfMeStore();

    if (useCompany.error) {
        messageNotify.value = useCompany.message;
        isSuccessNotify.value = false;
        showNotify.value = true;
    }

    loading.value = false;
});
</script>

<template>
    <Loading v-if="loading" />

    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />

    <!-- Mobile top bar -->
    <div class="lg:hidden flex items-center justify-between bg-[#243093] text-white p-4 w-full sticky top-0 z-40 shadow-md">
        <div class="flex items-center gap-3">
            <img 
                :src="CompanyOfMe?.LogoUrl || '/default-logo.png'" 
                class="w-8 h-8 rounded-full object-cover bg-white"
            />
            <span class="font-semibold text-sm truncate max-w-[200px]">
                {{ CompanyOfMe?.CompanyName || 'ABC Company' }}
            </span>
        </div>
        <button @click="isMobileMenuOpen = true" class="text-2xl focus:outline-none p-2">
            <i class="fas fa-bars"></i>
        </button>
    </div>

    <!-- Mobile overlay -->
    <div 
        v-if="isMobileMenuOpen" 
        @click="isMobileMenuOpen = false" 
        class="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
    ></div>

    <!-- SIDEBAR -->
    <aside
        :class="[
            'fixed inset-y-0 left-0 z-50 bg-[#243093] text-white flex flex-col font-sans shadow-2xl shrink-0 transition-all duration-300 ease-in-out relative',
            'lg:static lg:min-h-screen lg:translate-x-0',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            isCollapsed ? 'w-[68px]' : 'w-72'
        ]"
    >
        <!-- Mobile close -->
        <button 
            @click="isMobileMenuOpen = false" 
            class="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white text-xl p-2 z-50"
        >
            <i class="fas fa-times"></i>
        </button>

        <!-- Toggle collapse button -->
        <button
            @click="isCollapsed = !isCollapsed"
            class="hidden lg:flex absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-[#243093] hover:bg-slate-50 transition-all duration-200 hover:scale-110"
            :title="isCollapsed ? 'Mở rộng' : 'Thu gọn'"
        >
            <i
                class="fas text-[10px] transition-transform duration-300"
                :class="isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"
            ></i>
        </button>

        <!-- Company profile block -->
        <div
            class="transition-all duration-300 overflow-hidden"
            :class="isCollapsed ? 'p-3 mt-8 lg:mt-0' : 'p-5 mt-8 lg:mt-0'"
        >
            <!-- Collapsed: chỉ hiện avatar -->
            <div v-if="isCollapsed" class="flex justify-center">
                <div class="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white/30">
                    <img 
                        :src="CompanyOfMe?.LogoUrl || '/default-logo.png'" 
                        class="w-full h-full object-cover"
                    />
                </div>
            </div>

            <!-- Expanded: full card -->
            <div v-else class="bg-white/20 rounded-xl p-4 flex flex-col items-center border border-white/10">
                <div class="flex items-center gap-3 w-full mb-4">
                    <div class="w-12 h-12 bg-slate-200 rounded-full overflow-hidden shrink-0">
                        <img 
                            :src="CompanyOfMe?.LogoUrl || '/default-logo.png'" 
                            class="w-full h-full object-cover"
                        />
                    </div>
                    <div class="flex flex-col overflow-hidden">
                        <span class="font-semibold text-sm truncate" :title="CompanyOfMe?.CompanyName">
                            {{ CompanyOfMe?.CompanyName || 'ABC Company' }}
                        </span>
                        <span class="text-xs text-gray-400">
                            ID: {{ CompanyOfMe?.CompanyID || '---' }}
                        </span>
                    </div>
                </div>
                <button class="w-full bg-[#d6555b] hover:bg-red-600 transition-colors text-white text-sm font-semibold py-2 rounded-lg">
                    Đăng xuất
                </button>
            </div>
        </div>

        <div class="h-px bg-white/20 mx-3 mb-2"></div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
            <div v-for="item in menuItems" :key="item.id" class="mb-0.5">

                <!-- Menu item button -->
                <button 
                    @click="handleClick(item)"
                    :title="isCollapsed ? item.label : ''"
                    :class="[
                        'w-full flex items-center transition-all duration-200 group',
                        isCollapsed ? 'justify-center px-0 py-3.5' : 'justify-between px-6 py-3',
                        isParentActive(item) ? 'bg-white/15' : 'hover:bg-white/10'
                    ]"
                >
                    <div :class="['flex items-center', isCollapsed ? 'gap-0' : 'gap-4']">
                        <!-- Icon with active indicator -->
                        <div class="relative flex items-center justify-center">
                            <i
                                :class="[
                                    item.icon, 'text-lg w-5 text-center transition-transform duration-200',
                                    isParentActive(item) ? 'text-white scale-110' : 'text-white/70 group-hover:text-white'
                                ]"
                            ></i>
                            <!-- Active dot khi collapsed -->
                            <span
                                v-if="isCollapsed && isParentActive(item)"
                                class="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"
                            ></span>
                        </div>

                        <!-- Label (ẩn khi collapsed) -->
                        <span
                            v-if="!isCollapsed"
                            class="font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300"
                        >
                            {{ item.label }}
                        </span>
                    </div>

                    <i 
                        v-if="item.subItems && !isCollapsed"
                        :class="[
                            'fas fa-chevron-right text-[10px] transition-transform duration-200 text-white/50',
                            item.isOpen ? 'rotate-90' : ''
                        ]"
                    ></i>
                </button>

                <!-- Submenu (chỉ hiện khi mở rộng) -->
                <div 
                    v-if="item.subItems && item.isOpen && !isCollapsed"
                    class="flex flex-col bg-black/10"
                >
                    <button
                        v-for="sub in item.subItems"
                        :key="sub.id"
                        @click="goRoute(sub.routeName)"
                        :class="[
                            'w-full text-left pl-14 pr-6 py-2.5 text-sm font-medium transition-all',
                            route.name === sub.routeName
                                ? 'bg-[#151c60] text-white border-r-4 border-blue-400'
                                : 'text-blue-100 hover:text-white hover:bg-white/5'
                        ]"
                    >
                        {{ sub.label }}
                    </button>
                </div>

            </div>
        </nav>

        <!-- Footer hint khi collapsed -->
        <div v-if="isCollapsed" class="py-4 flex justify-center">
            <div class="w-8 h-px bg-white/20"></div>
        </div>

    </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
}
</style>