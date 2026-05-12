<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const props = defineProps({
    isOpenMobile: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close-mobile-menu']);

const isCollapsed = ref(false);
const isLogoutModalOpen = ref(false); 

interface SubMenuItem { id: string; label: string; routeName?: string; icon: string;status?: string; }
interface MenuItem { id: string; label: string; icon: string; isOpen?: boolean; routeName?: string; subItems?: SubMenuItem[]; section?: string;  }

const menuItems = ref<MenuItem[]>([
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie', routeName: 'admin-dashboard', section: 'TỔNG QUAN' },
    { id: 'account', label: 'Tài khoản của tôi', icon: 'fas fa-user-circle', isOpen: false, section: 'CÁ NHÂN', subItems: [
        { id: 'profile', label: 'Thông tin cá nhân', routeName: 'admin-profile', icon: 'fas fa-id-card' },
        { id: 'change-password', label: 'Đổi mật khẩu', routeName: 'admin-change-password', icon: 'fas fa-key' }
    ]},
    { id: 'candidates', label: 'Ứng viên', icon: 'fas fa-user-tie', routeName: 'candidate-management', section: 'NGƯỜI DÙNG' },
    { id: 'employers', label: 'Nhà tuyển dụng', icon: 'fas fa-building', routeName: 'employer-management' },
    { id: 'jobs', label: 'Quản lý Job', icon: 'fas fa-briefcase', isOpen: false, section: 'NỘI DUNG', subItems: [
        { id: 'all-jobs', label: 'Tất cả bài đăng', routeName: 'all-job-management', icon: 'fas fa-list-ul' },
        { id: 'pending-jobs', label: 'Chờ duyệt', routeName: 'all-job-pending', icon: 'fas fa-clock', status: 'Pending' },
        { id: 'reported-jobs', label: 'Bị báo cáo', routeName: 'all-job-reported', icon: 'fas fa-flag', status: 'Rejected' }
    ]
    },
    { id: 'companies', label: 'Quản lý Công ty', icon: 'fas fa-city', routeName: 'company-management' },
]);

const closeMobile = () => emit('close-mobile-menu');

const goRoute = (sub: SubMenuItem) => {
    if (sub.routeName) {
        if (sub.status) {
            router.push({ name: sub.routeName, query: { status: sub.status } });
        } else router.push({ name: sub.routeName });
        
        closeMobile();
    }
};

const handleClick = (item: MenuItem) => {
    if (isCollapsed.value) {
        if (item.routeName) {
             router.push({ name: item.routeName }); return;
        }
        isCollapsed.value = false;
        return;
    }
    if (item.routeName) { router.push({ name: item.routeName }); closeMobile(); }
    if (item.subItems) item.isOpen = !item.isOpen;
};

const isParentActive = (item: MenuItem) => {
    if (item.routeName) return route.name === item.routeName;
    if (item.subItems) return item.subItems.some(s => s.routeName === route.name);
    return false;
};

const confirmLogout = () => {
    isLogoutModalOpen.value = false;
    authStore.handleLogout();
};

watch(() => route.name, () => {
    menuItems.value.forEach(item => {
        if (item.subItems && !item.isOpen && item.subItems.some(s => s.routeName === route.name))
            item.isOpen = true;
    });
}, { immediate: true });
</script>

<template>
    <transition name="fade">
        <div
            v-if="isOpenMobile"
            @click="closeMobile"
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
        />
    </transition>

    <div :class="[
        'shrink-0 transition-[width] duration-300 ease-in-out',
        'w-0 lg:block',
        isCollapsed ? 'lg:w-[70px]' : 'lg:w-64',
    ]">
    <aside :class="[
        'sidebar z-50 flex flex-col font-sans relative overflow-hidden',
        'transition-[width,transform] duration-300 ease-in-out',
        'fixed inset-y-0 left-0 h-screen w-64',
        isOpenMobile ? 'translate-x-0' : '-translate-x-full',
        'lg:static lg:h-full lg:translate-x-0',
        isCollapsed ? 'lg:w-[70px]' : 'lg:w-64',
    ]">
        <div class="absolute inset-0 sidebar-bg pointer-events-none" />

        <div class="orb orb-1 pointer-events-none" />
        <div class="orb orb-2 pointer-events-none" />
        <div class="orb orb-3 pointer-events-none" />

        <button
            @click="closeMobile"
            class="lg:hidden absolute top-4 right-4 text-white/60 hover:text-white p-2 z-50 rounded-lg hover:bg-white/10 transition-all"
        >
            <i class="fas fa-times text-base"></i>
        </button>

        <button
            @click="isCollapsed = !isCollapsed"
            :title="isCollapsed ? 'Mở rộng' : 'Thu gọn'"
            class="collapse-btn hidden lg:flex bg-red-500"
        >
            <i class="fas text-[9px] transition-transform duration-300"
               :class="isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
        </button>

        <div class="brand-area relative z-10 border-b border-white/10"
             :class="isCollapsed ? 'justify-center px-0 py-4' : 'gap-3 px-5 py-4 flex items-center'">
            <div class="brand-logo shrink-0 transition-all duration-300"
                 :class="isCollapsed ? 'w-9 h-9 text-[10px] mx-auto' : 'w-10 h-10 text-xs'">
                ADM
            </div>
            <transition name="fade-text">
                <div v-if="!isCollapsed" class="overflow-hidden">
                    <p class="font-extrabold text-white text-sm leading-tight tracking-wide">Admin Panel</p>
                    <p class="text-[10px] text-blue-200/60 font-medium">Tìm việc Finder</p>
                </div>
            </transition>
        </div>

        <nav class="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar relative z-10">
            <template v-for="(item, idx) in menuItems" :key="item.id">
                <div v-if="item.section && !isCollapsed"
                     :class="['px-5 pb-1 text-[10px] font-black text-white/30 tracking-[0.14em] uppercase', idx === 0 ? 'pt-3' : 'pt-4']">
                    {{ item.section }}
                </div>
                <div v-else-if="item.section && isCollapsed && idx !== 0" class="mx-4 my-2 h-px bg-white/10" />
                <div v-if="item.section && isCollapsed && idx === 0" class="pt-2" />

                <div class="px-2 mb-0.5">
                    <button
                        @click="handleClick(item)"
                        :title="isCollapsed ? item.label : ''"
                        :class="[
                            'nav-btn w-full flex items-center rounded-xl transition-all duration-200 group relative',
                            isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5',
                            isParentActive(item) ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'
                        ]"
                    >
                        <span v-if="isParentActive(item)"
                              class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#f1f864] rounded-r-full" />

                        <div :class="['flex items-center', isCollapsed ? '' : 'gap-3']">
                            <div class="relative shrink-0">
                                <div :class="[
                                    'icon-wrap rounded-lg flex items-center justify-center transition-all duration-200',
                                    isCollapsed ? 'w-9 h-9' : 'w-7 h-7',
                                    isParentActive(item) ? 'bg-[#f1f864] shadow-md' : 'bg-white/10 group-hover:bg-white/15'
                                ]">
                                    <i :class="[item.icon, 'transition-all duration-200',
                                       isCollapsed ? 'text-sm' : 'text-xs',
                                       isParentActive(item) ? 'text-[#3a49c2]' : 'text-white/75 group-hover:text-white']" />
                                </div>
                                <span v-if="isCollapsed && isParentActive(item)"
                                      class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#f1f864] rounded-full border border-[#4c5bd4]" />
                            </div>
                            <span v-if="!isCollapsed"
                                  :class="['text-[13px] font-semibold whitespace-nowrap transition-colors',
                                           isParentActive(item) ? 'text-white' : 'text-white/75 group-hover:text-white']">
                                {{ item.label }}
                            </span>
                        </div>
                        <i v-if="item.subItems && !isCollapsed" 
                           :class="['fas fa-chevron-right text-[9px] text-white/30 transition-transform duration-200',
                                    item.isOpen ? 'rotate-90' : '']" />
                    </button>

                    <transition name="submenu">
                        <div v-if="item.subItems && item.isOpen && !isCollapsed"
                             class="mt-0.5 ml-3 pl-3 border-l-2 border-white/15 flex flex-col gap-0.5 pb-1">
                            <button
                                v-for="sub in item.subItems"
                                :key="sub.id"
                                @click="goRoute(sub)"
                                :class="[
                                    'w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150',
                                    route.name === sub.routeName
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/50 hover:text-white hover:bg-white/8'
                                ]"
                            >
                                <i :class="[sub.icon, 'text-[10px] w-3 text-center shrink-0',
                                            route.name === sub.routeName ? 'text-[#f1f864]' : 'text-white/30']" />
                                {{ sub.label }}
                                <span v-if="route.name === sub.routeName"
                                      class="ml-auto w-1.5 h-1.5 rounded-full bg-[#f1f864] shrink-0" />
                            </button>
                        </div>
                    </transition>
                </div>
            </template>
        </nav>

        <div class="border-t border-white/10 relative z-10 transition-all duration-300"
             :class="isCollapsed ? 'p-2' : 'p-3'">
            <div :class="[
                'flex items-center rounded-xl bg-white/10 transition-all duration-300',
                isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2.5'
            ]">
                <div class="w-8 h-8 rounded-full bg-[#f1f864] flex items-center justify-center shrink-0 shadow-md">
                    <i class="fas fa-user-shield text-[#3a49c2] text-xs"></i>
                </div>
                <transition name="fade-text">
                    <div v-if="!isCollapsed" class="flex-1 min-w-0">
                        <p class="text-white text-xs font-bold truncate">Super Admin</p>
                        <p class="text-white/40 text-[10px] truncate">admin@timviecfinder.vn</p>
                    </div>
                </transition>
                <button v-if="!isCollapsed"
                    @click="isLogoutModalOpen = true"
                        class="p-1.5 rounded-lg text-white/30 hover:text-red-300 hover:bg-red-500/15 transition-all shrink-0"
                        title="Đăng xuất">
                    <i class="fas fa-sign-out-alt text-xs"></i>
                </button>
            </div>
        </div>
    </aside>
    </div><transition name="fade">
        <div v-if="isLogoutModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="isLogoutModalOpen = false"></div>
            
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform transition-all scale-up">
                <div class="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
                    <i class="fas fa-sign-out-alt text-2xl"></i>
                </div>
                <h3 class="text-lg font-extrabold text-slate-800 mb-2">Đăng xuất</h3>
                <p class="text-sm text-slate-500 mb-6 leading-relaxed">
                    Bạn có chắc chắn muốn đăng xuất khỏi phiên quản trị hiện tại không?
                </p>
                <div class="flex items-center gap-3">
                    <button 
                        @click="isLogoutModalOpen = false"
                        class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        @click="confirmLogout"
                        class="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-red-500/20"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.sidebar-bg {
    background: linear-gradient(160deg, #3a49c2 0%, #4c5bd4 40%, #3d4ec8 100%);
}

.orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
}
.orb-1 { width: 160px; height: 160px; top: -40px; right: -40px; background: rgba(255,255,255,0.05); }
.orb-2 { width: 120px; height: 120px; bottom: 80px; left: -30px; background: rgba(255,255,255,0.04); }
.orb-3 { width: 80px; height: 80px; top: 50%; right: -20px; background: rgba(241,248,100,0.04); }

/* ─── Brand logo ─── */
.brand-logo {
    background: #f1f864;
    color: #3a49c2;
    font-weight: 900;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    letter-spacing: -0.02em;
}

/* ─── Collapse button ─── */
.collapse-btn {
    position: absolute;
    right: 0px;
    top: 76px;
    z-index: 50;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    border: 1px solid #e2e8f0;
    align-items: center;
    justify-content: center;
    color: #4c5bd4;
    transition: all 0.2s ease;
}
.collapse-btn:hover {
    background: #f8fafc;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 99px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }

.submenu-enter-active { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
.submenu-leave-active { transition: all 0.15s cubic-bezier(0.4,0,0.2,1); }
.submenu-enter-from, .submenu-leave-to { opacity: 0; transform: translateY(-8px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-text-enter-active { transition: all 0.25s ease; }
.fade-text-leave-active { transition: all 0.15s ease; }
.fade-text-enter-from, .fade-text-leave-to { opacity: 0; transform: translateX(-8px); }

.scale-up {
    animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes scaleUp {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
}

.hover\:bg-white\/8:hover { background-color: rgba(255,255,255,0.08); }
</style>