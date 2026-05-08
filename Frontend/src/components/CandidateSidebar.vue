<script setup lang="ts">
import { ref } from 'vue';
import { Settings, ClipboardList, ChevronDown, Briefcase, Mail } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

defineProps<{
    activeMainTab: string
}>();

defineEmits(['changeTab']);

const authStore = useAuthStore();
const isFolderOpen = ref(true); 
</script>
<template>
    <div class="w-[260px] min-h-screen bg-[#24348b] text-white flex flex-col shrink-0">
        <div class="p-5 border-b border-white/10">
            <div class="bg-white/10 rounded-xl p-4 flex flex-col items-center text-center">
                <img :src="authStore?.user?.ImgUrl || 'https://i.pravatar.cc/150?u=dang'" 
                     class="w-[70px] h-[70px] rounded-full object-cover border-2 border-white/20 mb-3 bg-gray-200">
                <span class="font-bold text-[15px] mb-3">{{ authStore?.user?.Name || 'Nguyễn Hải Đăng' }}</span>
                <button class="bg-[#d9534f] hover:bg-red-600 text-white font-semibold text-[13px] py-1.5 px-6 rounded-md transition-colors w-full">
                    Xóa tài khoản
                </button>
            </div>
        </div>

        <div class="flex-1 py-4 flex flex-col font-medium text-[14.5px]">
            
            <button @click="$emit('changeTab', 'account_management')" 
                    :class="activeMainTab === 'account_management' ? 'bg-white/10 border-l-4 border-white' : ''"
                    class="flex items-center gap-3 px-6 py-3.5 hover:bg-white/10 transition-colors text-left">
                <Settings class="w-5 h-5" /> Quản lý tài khoản
            </button>

            <div class="flex flex-col">
                <button @click="isFolderOpen = !isFolderOpen" class="flex items-center justify-between px-6 py-3.5 hover:bg-white/10 transition-colors text-left w-full">
                    <div class="flex items-center gap-3">
                        <ClipboardList class="w-5 h-5" />
                        <span class="font-bold">Hồ sơ xin việc</span>
                    </div>
                    <ChevronDown class="w-4 h-4 transition-transform" :class="{'rotate-180': !isFolderOpen}" />
                </button>
                
                <div v-show="isFolderOpen" class="flex flex-col bg-[#1c286b]"> 
                    <button @click="$emit('changeTab', 'online_profile')" 
                            :class="activeMainTab === 'online_profile' ? 'bg-[#14205c] border-l-4 border-white font-bold' : 'hover:bg-white/5'"
                            class="py-3 pl-[52px] pr-6 text-left transition-all">
                        Hồ sơ Online
                    </button>
                    <button @click="$emit('changeTab', 'resumes_list')" 
                            :class="activeMainTab === 'resumes_list' ? 'bg-[#14205c] border-l-4 border-white font-bold' : 'hover:bg-white/5'"
                            class="py-3 pl-[52px] pr-6 text-left transition-all">
                        CV xin việc
                    </button>
                </div>
            </div>

            <!-- <button @click="$emit('changeTab', 'completion')" 
                    :class="activeMainTab === 'completion' ? 'bg-white/10 border-l-4 border-white' : ''"
                    class="flex items-center gap-3 px-6 py-3.5 hover:bg-white/10 transition-colors text-left">
                <Contact class="w-5 h-5" /> Hoàn thiện hồ sơ
            </button> -->

            <button @click="$emit('changeTab', 'applied_jobs')" 
                    :class="activeMainTab === 'applied_jobs' ? 'bg-white/10 border-l-4 border-white' : ''"
                    class="flex items-center gap-3 px-6 py-3.5 hover:bg-white/10 transition-colors text-left">
                <Briefcase class="w-5 h-5" /> Việc làm đã ứng tuyển
            </button>

            <button @click="$emit('changeTab', 'saved_jobs')" 
                    :class="activeMainTab === 'saved_jobs' ? 'bg-white/10 border-l-4 border-white' : ''"
                    class="flex items-center gap-3 px-6 py-3.5 hover:bg-white/10 transition-colors text-left">
                <Mail class="w-5 h-5" /> Việc làm đã lưu
            </button>
        </div>
    </div>
</template>

