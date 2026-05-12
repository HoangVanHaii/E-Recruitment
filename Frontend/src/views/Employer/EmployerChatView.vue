<script setup lang="ts">
import SidebarEmployer from '../../components/Employer/SidebarEmployer.vue';
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { Search, Send, Image as ImageIcon, Smile, Phone, Video, MessageSquareDashed } from 'lucide-vue-next';
import { useMessageStore } from '../../stores/message';
import { useAuthStore } from '../../stores/auth';
import { timeAgo } from '../../utils/format';

const messageStore = useMessageStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const newMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const activeChat = ref<any>(null);

const filteredChats = computed(() => {
    if (!searchQuery.value) return messageStore.conversations;
    const q = searchQuery.value.toLowerCase();
    return messageStore.conversations.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.latestMessage || '').toLowerCase().includes(q)
    );
});

const selectChat = async (chat: any) => {
    activeChat.value = chat;
    messageStore.markAsRead(chat.userId);
    await messageStore.fetchChatHistory(chat.userId);
    scrollToBottom();
};

const scrollToBottom = async () => {
    await nextTick();
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

watch(
    () => messageStore.chatHistory,
    (newHistory) => {
        scrollToBottom();
        if (newHistory.length > 0) {
            const last = newHistory[newHistory.length - 1];
            if (activeChat.value && last.sender_id === activeChat.value.userId && !last.is_read) {
                messageStore.markAsRead(activeChat.value.userId);
            }
        }
    },
    { deep: true }
);

const handleSend = async () => {
    if (!newMessage.value.trim() || !activeChat.value) return;
    await messageStore.sendMessage(activeChat.value.userId, newMessage.value);
    newMessage.value = '';
    scrollToBottom();
};

onMounted(async () => {
    await authStore.fetchProfile();
    await messageStore.fetchConversations();
});
const isMobile = ref(window.innerWidth < 1024);

window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 1024;
});

const backToList = () => {
    activeChat.value = null;
};
</script>

<template>
    <div class="flex flex-col lg:flex-row h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">

        <SidebarEmployer />

        <div
            v-if="!isMobile || !activeChat"
            class="w-full max-w-full sm:w-[320px] lg:w-[280px]
            shrink-0 bg-white border-r border-slate-100
            flex flex-col h-full shadow-sm overflow-hidden"
        >
            <div class="px-5 pt-6 pb-4 border-b border-slate-100">
                <h2 class="text-lg font-extrabold text-slate-800 tracking-tight mb-3">Tin nhắn</h2>
                <div class="relative">
                    <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Tìm kiếm..."
                        class="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl pl-9 pr-3 py-2 text-sm outline-none transition-all placeholder-slate-400"
                    />
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar">
                <div v-if="filteredChats.length > 0">
                    <button
                        v-for="chat in filteredChats"
                        :key="chat.userId"
                        @click="selectChat(chat)"
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left group"
                        :class="activeChat?.userId === chat.userId ? 'bg-blue-50/70 border-l-2 border-l-[#3B5BFA]' : ''"
                    >
                        <div class="relative shrink-0">
                            <img :src="chat.avatar" class="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" />
                            <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center mb-0.5">
                                <span
                                    class="text-sm font-bold truncate pr-1"
                                    :class="activeChat?.userId === chat.userId ? 'text-[#3B5BFA]' : 'text-slate-800'"
                                >{{ chat.name }}</span>
                                <span class="text-[10px] text-slate-400 shrink-0">{{ timeAgo(chat.timestamp) }}</span>
                            </div>
                            <p
                                class="text-xs truncate"
                                :class="(!chat.isRead && authStore.user?.ProfileID !== chat.lastSenderId)
                                    ? 'font-bold text-slate-700'
                                    : 'text-slate-400 font-medium'"
                            >
                                {{ authStore.user?.ProfileID === chat.lastSenderId ? 'Bạn: ' : '' }}{{ chat.latestMessage }}
                            </p>
                        </div>
                        <div v-if="chat.unread > 0" class="w-2 h-2 bg-[#3B5BFA] rounded-full shrink-0"></div>
                    </button>
                </div>

                <div v-else class="py-16 text-center">
                    <div class="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-3">
                        <Search class="w-5 h-5 text-slate-300" />
                    </div>
                    <p class="text-sm text-slate-400">Không tìm thấy kết quả</p>
                </div>
            </div>
        </div>

        <div
            v-if="!isMobile || activeChat"
            class="flex-1 flex flex-col h-full min-w-0"
        >

            <transition name="fade-panel">
                <div
                    v-if="!activeChat"
                    class="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8"
                >
                    <div class="relative">
                        <div class="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#3B5BFA] to-[#748ffc] flex items-center justify-center shadow-xl shadow-blue-500/25">
                            <MessageSquareDashed class="w-11 h-11 text-white" />
                        </div>
                        <div class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white shadow-sm animate-bounce"></div>
                    </div>
                    <div>
                        <h3 class="text-xl font-extrabold text-slate-700 mb-1">Chọn một cuộc trò chuyện</h3>
                        <p class="text-sm text-slate-400 max-w-xs">Chọn một ứng viên từ danh sách bên trái để bắt đầu chat.</p>
                    </div>

                    <div class="absolute bottom-16 right-16 w-48 h-48 bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="absolute top-20 right-40 w-32 h-32 bg-indigo-100/50 rounded-full blur-2xl pointer-events-none"></div>
                </div>
            </transition>

            <transition name="fade-panel">
                <div v-if="activeChat" class="flex-1 flex flex-col h-full min-h-0">
                    <div class="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-100 shadow-sm shrink-0">
                        <div class="flex items-center gap-3">
                            <button
                                v-if="isMobile"
                                @click="backToList"
                                class="p-2 hover:bg-slate-100 rounded-xl transition"
                            >
                                <i class="fa-solid fa-arrow-left text-slate-700 text-base"></i>
                            </button>
                            <div class="relative">
                                <img :src="activeChat.avatar" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow" />
                                <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <h4 class="font-extrabold text-slate-800 text-sm">{{ activeChat.name }}</h4>
                                <span class="text-[11px] text-emerald-500 font-semibold">● Đang hoạt động</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-1">
                            <button class="p-2 text-slate-400 hover:text-[#3B5BFA] hover:bg-blue-50 rounded-xl transition-all">
                                <Phone class="w-4 h-4" />
                            </button>
                            <button class="p-2 text-slate-400 hover:text-[#3B5BFA] hover:bg-blue-50 rounded-xl transition-all">
                                <Video class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div
                        ref="messagesContainer"
                        class="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-6 py-5 space-y-4 custom-scrollbar"
                        style="background: radial-gradient(ellipse at top left, #eef2ff 0%, #f0f2f8 60%);"
                    >
                        <div
                            v-for="(msg, index) in messageStore.chatHistory"
                            :key="msg._id"
                            class="flex items-end gap-2.5"
                            :class="msg.sender_id === authStore.user?.ProfileID ? 'justify-end' : 'justify-start'"
                        >
                            <img
                                v-if="msg.sender_id !== authStore.user?.ProfileID"
                                :src="msg.sender_avatar || activeChat.avatar"
                                class="w-7 h-7 rounded-full object-cover shrink-0 shadow"
                            />

                            <div class="flex flex-col max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]"
                                :class="msg.sender_id === authStore.user?.ProfileID ? 'items-end' : 'items-start'"
                            >
                                <div
                                    class="px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm"
                                    :class="msg.sender_id === authStore.user?.ProfileID
                                        ? 'bg-[#3B5BFA] text-white rounded-br-sm shadow-blue-300/30 shadow-md'
                                        : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'"
                                >
                                    {{ msg.content }}
                                </div>
                                <span
                                    v-if="msg.sender_id === authStore.user?.ProfileID && index === messageStore.chatHistory.length - 1"
                                    class="text-[10px] text-slate-400 mt-1 px-1"
                                >
                                    {{ msg.is_read ? '✓✓ Đã xem' : '✓ Đã gửi' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Input -->
                    <div class="px-5 py-3.5 bg-white border-t border-slate-100 shrink-0">
                        <div class="flex items-center gap-2.5 bg-slate-50 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl px-3 py-2 transition-all">
                            <button class="p-1 text-slate-400 hover:text-[#3B5BFA] transition-colors shrink-0">
                                <ImageIcon class="w-5 h-5" />
                            </button>

                            <input
                                v-model="newMessage"
                                @keyup.enter="handleSend"
                                placeholder="Nhập tin nhắn..."
                                class="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                            />

                            <button class="p-1 text-slate-400 hover:text-[#3B5BFA] transition-colors shrink-0">
                                <Smile class="w-5 h-5" />
                            </button>

                            <button
                                @click="handleSend"
                                :disabled="!newMessage.trim()"
                                class="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
                                :class="newMessage.trim()
                                    ? 'bg-[#3B5BFA] text-white hover:bg-blue-700 shadow-md shadow-blue-400/30 active:scale-95'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'"
                            >
                                <Send class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }

.fade-panel-enter-active, .fade-panel-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-panel-enter-from { opacity: 0; transform: translateX(8px); }
.fade-panel-leave-to   { opacity: 0; transform: translateX(-8px); }
</style>