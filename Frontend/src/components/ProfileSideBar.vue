<script setup lang="ts">
import { ChevronRight, User, LogOut, FileText, ClipboardEdit, Briefcase, Bookmark, Settings } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const emit = defineEmits(['close']);

const handleLogout = () => {
    authStore.handleLogout();
    emit('close');
    router.push({ name: 'login' });
};

const goTo = (routeName: string) => {
    emit('close');
    router.push({ name: routeName });
};
</script>

<template>
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] transition-opacity" @click="emit('close')"></div>

    <div class="fixed top-0 right-0 bottom-0 w-full sm:w-[250px] bg-[#f4f7fb] z-[60] flex flex-col shadow-2xl animate-in slide-in-from-right-8 duration-300">
        
        <button 
            @click="emit('close')" 
            class="hidden sm:flex absolute top-5 -left-4 w-7 h-7 bg-white rounded-full shadow-md items-center justify-center text-gray-500 hover:text-blue-600 hover:scale-105 transition-all border border-gray-200 z-[70] group"
        >
            <ChevronRight class="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <div class="px-5 py-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10 h-[60px]">
            <h3 class="font-bold text-gray-800 text-[16px] ml-2">Quản lý tài khoản</h3>
            </div>

        <div class="flex-1 overflow-y-auto p-2 space-y-1">
            
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <img :src="authStore.user?.ImgUrl || '/src/assets/default-avatar.png'" class="w-14 h-14 rounded-full border border-gray-200 object-cover" />
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-gray-800 text-[15px] truncate">
                        {{ authStore.user?.Name || 'Người dùng' }}
                    </h4>
                    <p class="text-gray-500 text-[13px] truncate capitalize">
                        {{ authStore.role || 'Thành viên' }}
                    </p>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                
                <button @click="goTo('Profile')" class="flex items-center gap-3 w-full p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                    <User class="w-5 h-5 text-blue-600" />
                    <span class="text-[14.5px] text-gray-700 font-medium">Thông tin cá nhân</span>
                </button>

                <button @click="goTo('CV')" class="flex items-center gap-3 w-full p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                    <FileText class="w-5 h-5 text-blue-600" />
                    <span class="text-[14.5px] text-gray-700 font-medium">Hồ sơ xin việc</span>
                </button>

                <button @click="goTo('CompleteProfile')" class="flex items-center gap-3 w-full p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                    <ClipboardEdit class="w-5 h-5 text-blue-600" />
                    <span class="text-[14.5px] text-gray-700 font-medium">Hoàn thiện hồ sơ</span>
                </button>

                <button @click="goTo('AppliedJobs')" class="flex items-center gap-3 w-full p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                    <Briefcase class="w-5 h-5 text-blue-600" />
                    <span class="text-[14.5px] text-gray-700 font-medium">Việc làm đã ứng tuyển</span>
                </button>

                <button @click="goTo('SavedJobs')" class="flex items-center gap-3 w-full p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                    <Bookmark class="w-5 h-5 text-blue-600" />
                    <span class="text-[14.5px] text-gray-700 font-medium">Việc làm đã lưu</span>
                </button>
                
                <button @click="goTo('Settings')" class="flex items-center gap-3 w-full p-4 hover:bg-gray-50 transition-colors text-left">
                    <Settings class="w-5 h-5 text-gray-600" />
                    <span class="text-[14.5px] text-gray-700 font-medium">Cài đặt</span>
                </button>
            </div>

        </div>

        <div class="p-4 bg-white border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
            <button @click="handleLogout" class="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors">
                <LogOut class="w-5 h-5 ml-1" />
                <span>Đăng xuất</span>
            </button>
        </div>

    </div>
</template>