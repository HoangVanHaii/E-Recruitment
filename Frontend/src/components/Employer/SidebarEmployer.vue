<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCompanyStore } from '../../stores/company';
import { useAuthStore } from '../../stores/auth';

import Notify from '../Notify.vue';

const router = useRouter();
const route = useRoute();
const useCompany = useCompanyStore();
const authStore = useAuthStore();
const loading = ref(false);
const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);
const isMobileMenuOpen = ref(false);

interface SubMenuItem { id: string; icon: string; label: string; routeName?: string; }
interface MenuItem { id: string; label: string; icon: string; isOpen?: boolean; routeName?: string; subItems?: SubMenuItem[]; }

const menuItems = ref<MenuItem[]>([
    { id: 'stats', label: 'Thống kê JOB', icon: 'fas fa-chart-line', routeName: 'employer-dashboard' },
    {
        id: 'account', label: 'Quản lý công ty', icon: 'fas fa-user-shield', isOpen: false,
        subItems: [
            { id: 'profile-update', icon: 'fas fa-user-edit', label: 'Cập nhật hồ sơ', routeName: 'employer-profile' },
            { id: 'approved-employer', icon: 'fas fa-user-check', label: 'Duyệt nhân viên', routeName: 'employer-requests' },
        ]
    },
    {
        id: 'post', label: 'Đăng tin', icon: 'fas fa-edit', isOpen: false,
        subItems: [
            { id: 'post-new', icon: 'fas fa-plus', label: 'Đăng tin mới', routeName: 'create-job' },
            { id: 'post-history', icon: 'fas fa-list-ul', label: 'Tin đã đăng', routeName: 'posted-jobs' }
        ]
    },
    { id: 'candidates', label: 'Ứng viên ứng tuyển', icon: 'fas fa-users', routeName: 'job-applications' },
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
    if (item.routeName) {
        router.push({ name: item.routeName });
        isMobileMenuOpen.value = false;
        menuItems.value.forEach(m => {
            if (m.subItems) m.isOpen = false;
        });
        return;
    }
    if (item.subItems) {
        const currentState = item.isOpen;
            menuItems.value.forEach(m => {
            if (m.subItems) {
                m.isOpen = false;
            }
        });
        item.isOpen = !currentState;
    }
};

const isParentActive = (item: MenuItem) => {
    if (item.routeName) return route.name === item.routeName;
    return item.subItems?.some(sub => sub.routeName === route.name) ?? false;
};

watch(() => route.name, () => {
    menuItems.value.forEach(item => {
        if (item.subItems?.some(sub => sub.routeName === route.name)) {
            item.isOpen = true;
        }
    });
}, { immediate: true });

onMounted(async () => {
    loading.value = true;
    if (!useCompany.CompanyOfMe) {
        await useCompany.getCompanyOfMeStore();
        if (useCompany.error) {
            messageNotify.value = useCompany.message;
            isSuccessNotify.value = false;
            showNotify.value = true;
        }
    }
    loading.value = false;
});

</script>

<template>
    <Notify
        v-if="showNotify"
        :message="messageNotify"
        :isSuccess="isSuccessNotify"
        @close="showNotify = false"
    />
    
    <div class="lg:hidden flex items-center justify-between bg-[#243093] text-white p-4 w-full sticky top-0 z-40 shadow-md">
        <div class="flex items-center gap-3">
            <img
                :src="useCompany.CompanyOfMe?.LogoUrl || 'https://res.cloudinary.com/duxdpc100/image/upload/v1778353606/cpp_zlutbw.jpg'"
                class="w-8 h-8 rounded-full object-cover bg-white"
                alt="Logo"
            />
            <span class="font-semibold text-sm truncate max-w-[200px]">
                {{ useCompany.CompanyOfMe?.CompanyName || 'Company' }}
            </span>
        </div>
        <button @click="isMobileMenuOpen = true" class="text-2xl focus:outline-none p-2">
            <i class="fas fa-bars"></i>
        </button>
    </div>
    
    <div
        v-if="isMobileMenuOpen"
        @click="isMobileMenuOpen = false"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
    ></div>
    
    <aside
        :class="[
            'fixed inset-y-0 left-0 z-50 w-72 bg-[#243093] text-white flex flex-col font-sans shadow-2xl shrink-0 transition-transform duration-300 ease-in-out',
            'lg:static lg:min-h-screen lg:translate-x-0',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
    >
        <button
            @click="isMobileMenuOpen = false"
            class="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white text-xl p-2 z-50"
        >
            <i class="fas fa-times"></i>
        </button>

        <div class="p-5 mt-8 lg:mt-0">
            <div class="bg-white/20 rounded-xl p-4 flex flex-col items-center border border-white/10">
                <div class="flex items-center gap-3 w-full mb-4">
                    <div class="w-12 h-12 bg-slate-200 rounded-full overflow-hidden shrink-0">
                        <img :src="useCompany.CompanyOfMe?.LogoUrl || 'https://res.cloudinary.com/duxdpc100/image/upload/v1778353606/cpp_zlutbw.jpg'"
                            class="w-full h-full object-cover"
                         />
                    </div>
                    <span class="font-semibold text-sm truncate" :title="useCompany.CompanyOfMe?.CompanyName">
                        {{ useCompany.CompanyOfMe?.CompanyName || 'Company' }}
                    </span>
                </div>
                <button @click="authStore.handleLogout" class="w-full bg-[#d6555b] hover:bg-red-600 transition-colors text-white text-sm font-semibold py-2 rounded-lg">
                    Đăng xuất
                </button>
            </div>
        </div>

        <div class="h-px bg-white/20 mx-4 mb-2"></div>

        <nav class="flex-1 overflow-y-auto py-2 custom-scrollbar">
            <div v-for="item in menuItems" :key="item.id" class="mb-1">
                <button
                    @click="handleClick(item)"
                    :class="[
                        'w-full flex items-center justify-between px-6 py-3 transition-colors',
                        isParentActive(item) ? 'bg-white/10' : 'hover:bg-white/10'
                    ]"
                >
                    <div class="flex items-center gap-4">
                        <i :class="[item.icon, 'text-lg w-5 text-center']"></i>
                        <span class="font-semibold text-sm">{{ item.label }}</span>
                    </div>
                    <i
                        v-if="item.subItems"
                        :class="[
                            'fas fa-chevron-right text-[10px] transition-transform duration-200',
                            item.isOpen ? 'rotate-90' : ''
                        ]"
                    ></i>
                </button>
                
                <transition name="fade-slide">
                    <div v-if="item.subItems && item.isOpen" class="flex flex-col bg-black/10 overflow-hidden">
                        <button
                            v-for="sub in item.subItems"
                            :key="sub.id"
                            @click="goRoute(sub.routeName)"
                            :class="[
                                'w-full text-left pl-10 pr-6 py-2.5 text-sm font-medium transition-all flex items-center gap-3',
                                route.name === sub.routeName
                                    ? 'bg-[#151c60] text-white border-r-4 border-blue-400'
                                    : 'text-blue-100 hover:text-white hover:bg-white/5'
                            ]"
                        >
                            <i v-if="sub.icon" :class="[sub.icon, 'w-5 text-center text-xs']"></i>
                            
                            <span>{{ sub.label }}</span>
                        </button>
                    </div>
                </transition>
            </div>
        </nav>
    </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }

.fade-slide-enter-active, .fade-slide-leave-active {
    transition: all 0.3s ease;
    max-height: 200px;
}
.fade-slide-enter-from, .fade-slide-leave-to {
    max-height: 0;
    opacity: 0;
}
</style>