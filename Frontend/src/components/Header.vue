<script setup lang="ts">
import ChatConversation from './ChatConversation.vue';
import ChatWindow from './ChatWindow.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { useMessageStore } from '../stores/message';

import logoImg from '../assets/logoWebsite.png'

const messageStore = useMessageStore();
const authStore = useAuthStore();
const router = useRouter();
const activeChat = ref<any>(null);

const openChatWindow = (chatData: any) => {
    messageStore.markAsRead(chatData.userId);
    activeChat.value = chatData;
};

const closeChatWindow = () => {
    activeChat.value = null;
};

const showChat = ref<boolean>(false);

const toggleChat = () => {
    showChat.value = !showChat.value;
};

const goToProfile = () => {
    router.push({ name: 'candidate-profile' });
};

const handleLogout = () => {
    if (authStore.handleLogout) {
        authStore.handleLogout();
    } else {
        authStore.isLogin = false;
        authStore.user = null;
    }
    router.push({ name: 'login-section' }); 
};

const isScrolled = ref(false);
let ticking = false;

const handleScroll = () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;

            if (!isScrolled.value && scrollY > 80) {
                isScrolled.value = true;
            }
            else if (isScrolled.value && scrollY < 20) {
                isScrolled.value = false;
            }

            ticking = false;
        });
        ticking = true;
    }
};

onMounted(async () => {
    await authStore.fetchProfile();
    if (authStore.isLogin) {
        messageStore.fetchUnreadCount();
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

const handleLogin = () => router.push({ name: 'login-section' });
const handleRegister = () => router.push({ name: 'register-section' });
const handleCreateJob = () => {
    if (!authStore.isLogin) {
        router.push({ name: 'login-section' });
        return;
    }
    router.push({ name: 'CreateJob' });
};
</script>

<template>
    <header
        class="bg-[#4c5bd4] text-white sticky top-0 z-50 transition-all duration-300 ease-in-out"
        :class="isScrolled ? 'shadow-xl' : 'shadow-none'"
    >
        <div
            class="max-w-7xl mx-auto flex items-center justify-between px-6 transition-all duration-300 ease-in-out"
            :class="isScrolled ? 'py-1.5' : 'py-1.5'"
        >
            <div class="flex justify-start gap-12 items-center">

                <div class="flex items-center cursor-pointer select-none mt-[-3px] ">
                    <img
                        :src="logoImg"
                        alt="Logo"
                        class="object-contain transition-all duration-300 ease-in-out"
                        :class="isScrolled ? 'h-10' : 'h-14'"
                    />
                </div>

                <nav
                    class="flex items-center gap-4 font-semibold transition-all duration-300 ease-in-out"
                    :class="isScrolled ? 'text-xs' : 'text-sm'"
                >
                    <a href="\home" class="hover:text-gray-200 flex items-center">
                        <span class="hidden md:block">Trang chủ</span>
                        <i class="fa-solid fa-house md:hidden"></i>
                    </a>

                    <div class="hidden md:flex items-center gap-10">
                        <a href="\candidate-profile?tab=resumes_list" class="hover:text-gray-200">CV của tôi</a>
                        <a href="\candidate-profile?tab=create_cv" class="hover:text-gray-200">Tạo CV</a>
                        <a href="#" class="hover:text-gray-200">Khám phá</a>
                        <a href="#" class="hover:text-gray-200">Tiện ích</a>
                    </div>
                </nav>
            </div>

            <div class="flex items-center gap-8">

                <div class="relative" @click="toggleChat">
                    <div
                        class="flex gap-3 items-center cursor-pointer select-none transition-colors"
                        :class="showChat ? 'text-green-500' : 'hover:text-gray-200'"
                    >
                        <div class="relative">
                            <span
                                v-if="messageStore.unreadCount > 0"
                                class="absolute -top-2 -right-2 bg-red-500 text-xs px-1.5 rounded-full text-white"
                            >
                                {{ messageStore.unreadCount > 9 ? '9+' : messageStore.unreadCount }}
                            </span>
                            <i
                                class="fa-regular fa-comment-dots transition-all duration-300"
                                :class="[showChat ? 'text-green-500' : '', isScrolled ? 'fa-md' : 'fa-lg']"
                            ></i>
                        </div>
                        <span
                            class="hidden md:block font-semibold transition-all duration-300"
                            :class="[showChat ? 'text-green-500' : '', isScrolled ? 'text-xs' : 'text-sm']"
                        >
                            Chat
                        </span>
                    </div>

                    <ChatConversation
                        v-if="showChat"
                        @close="showChat = false"
                        @selectChat="openChatWindow"
                    />
                </div>

                <div v-if="!authStore.isLogin" class="flex gap-8">
                    <button
                        class="bg-blue-900 text-white px-3 rounded text-sm transition-all duration-300 hidden md:block"
                        :class="isScrolled ? 'py-0.5' : 'py-1'"
                        @click="handleCreateJob"
                    >
                        Đăng tin
                    </button>
                    <button
                        class="bg-white text-blue-600 px-3 rounded text-sm transition-all duration-300"
                        :class="isScrolled ? 'py-0.5' : 'py-1'"
                        @click="handleLogin"
                    >
                        Đăng nhập
                    </button>
                    <button
                        class="bg-blue border border-white text-white px-3 rounded text-sm transition-all duration-300 hidden md:block"
                        :class="isScrolled ? 'py-0.5' : 'py-1'"
                        @click="handleRegister"
                    >
                        Đăng ký
                    </button>
                </div>

                <div v-else class="flex items-center gap-8">
                    <i
                        class="fa-solid fa-bell hover:text-gray-200 cursor-pointer transition-all duration-300"
                        :class="isScrolled ? 'fa-md' : 'fa-lg'"
                    ></i>
                    
                    <div class="relative group">
                        <div
                            class="border-white flex items-center gap-4 border-[1px] rounded-full bg-[#9AA0D0] cursor-pointer group-hover:bg-blue-700 transition-all duration-300"
                            :class="isScrolled ? 'px-0.5 py-0.5' : 'px-1 py-0.5'"
                        >
                            <img
                                :src="authStore.user?.ImgUrl || '/src/assets/default-avatar.png'"
                                alt="Avatar"
                                class="rounded-full border-[1px] border-blue-800 transition-all duration-300"
                                :class="isScrolled ? 'w-6 h-6' : 'w-8 h-8'"
                            >
                            <i class="fa-solid fa-sort-down text-white mr-2 mb-1 transition-all duration-300"></i>
                        </div>

                        <div class="absolute right-0 top-full w-full h-3"></div>

                        <div 
                            class="absolute right-0 top-[calc(100%+0.5rem)] w-40 bg-white rounded-lg shadow-xl py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200"
                        >
                            <div
                                @click="goToProfile"
                                class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors"
                            >
                                <i class="fa-regular fa-user w-6"></i>
                                <span class="font-medium">Hồ sơ</span>
                            </div>
                            
                            <hr class="my-1 border-gray-100">
                            
                            <div
                                @click="handleLogout"
                                class="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                            >
                                <i class="fa-solid fa-arrow-right-from-bracket w-6"></i>
                                <span class="font-medium">Đăng xuất</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <hr
            class="transition-all duration-300"
            :class="isScrolled ? 'opacity-0 h-0' : 'opacity-100'"
        />
    </header>

    <ChatWindow
        v-if="activeChat"
        :targetUserId="activeChat.userId"
        :targetName="activeChat.name"
        :targetAvatar="activeChat.avatar"
        @close="closeChatWindow"
    />
</template>