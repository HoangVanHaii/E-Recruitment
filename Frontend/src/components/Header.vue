<script setup lang="ts">
import ChatConversation from './ChatConversation.vue';
import ChatWindow from './ChatWindow.vue';
import ProfileSideBar from './ProfileSideBar.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { useMessageStore } from '../stores/message';

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
const showProfile = ref<boolean>(false);

const toggleChat = () => {
    showChat.value = !showChat.value;
};
const toggleProfile = () => {
    showProfile.value = !showProfile.value;
};

// ---- Scroll shrink logic (no flicker) ----
const isScrolled = ref(false);
const SCROLL_THRESHOLD = 50;
let scrollTimer: ReturnType<typeof setTimeout> | null = null;

const handleScroll = () => {
    if (scrollTimer) return; // throttle ~1 frame

    scrollTimer = setTimeout(() => {
        scrollTimer = null;
        const newVal = window.scrollY > SCROLL_THRESHOLD;
        if (newVal !== isScrolled.value) {
            isScrolled.value = newVal;
        }
    }, 16);
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
    if (scrollTimer) clearTimeout(scrollTimer);
});

const handleLogin = () => router.push({ name: 'login' });
const handleRegister = () => router.push({ name: 'register' });
const handleCreateJob = () => {
    if (!authStore.isLogin) {
        router.push({ name: 'login' });
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
            :class="isScrolled ? 'py-1.5' : 'py-3'"
        >
            <!-- Left: Logo + Menu -->
            <div class="flex justify-start gap-12 items-center">

                <!-- Logo -->
                <div class="flex items-center gap-2">
                    <div
                        class="bg-white text-blue-600 font-bold rounded-full flex items-center justify-center transition-all duration-300 ease-in-out"
                        :class="isScrolled ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'"
                    >
                        365
                    </div>
                    <span
                        class="font-semibold transition-all duration-300 ease-in-out overflow-hidden"
                        :class="isScrolled ? 'text-base' : 'text-lg'"
                    >
                        Tìm việc
                    </span>
                </div>

                <!-- Menu -->
                <nav
                    class="hidden md:flex items-center gap-10 font-semibold transition-all duration-300 ease-in-out"
                    :class="isScrolled ? 'text-xs' : 'text-sm'"
                >
                    <a href="#" class="hover:text-gray-200">CV xin việc</a>
                    <a href="#" class="hover:text-gray-200">Khám phá</a>
                    <a href="#" class="hover:text-gray-200">Tiện ích</a>
                    <a href="#" class="hover:text-gray-200">CV đã tạo</a>
                </nav>
            </div>

            <!-- Right actions -->
            <div class="flex items-center gap-8">

                <!-- Chat -->
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
                            class="font-semibold transition-all duration-300"
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

                <!-- Buttons -->
                <div v-if="!authStore.isLogin" class="flex gap-8">
                    <button
                        class="bg-blue-900 text-white px-3 rounded text-sm transition-all duration-300"
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
                        class="bg-blue border border-white text-white px-3 rounded text-sm transition-all duration-300"
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
                    <div
                        class="border-white flex items-center gap-4 border-[1px] rounded-full bg-[#9AA0D0] cursor-pointer hover:bg-blue-700 transition-all duration-300"
                        :class="isScrolled ? 'px-0.5 py-0.5' : 'px-1 py-0.5'"
                        @click="toggleProfile"
                    >
                        <img
                            :src="authStore.user?.ImgUrl || '/src/assets/default-avatar.png'"
                            alt=""
                            class="rounded-full border-[1px] border-blue-800 transition-all duration-300"
                            :class="isScrolled ? 'w-6 h-6' : 'w-8 h-8'"
                        >
                        <i class="fa-solid fa-sort-down text-white mr-2 mb-1 transition-all duration-300"></i>
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
    <ProfileSideBar
        v-if="showProfile"
        @close="showProfile = false"
    />
</template>