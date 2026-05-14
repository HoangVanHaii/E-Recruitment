<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { X, Search, Maximize } from 'lucide-vue-next';
import { useMessageStore } from '../stores/message';
import { timeAgo } from '../utils/format';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const messageStore = useMessageStore();
const emit = defineEmits(['close', 'selectChat']);
const searchQuery = ref('');

const handleSelectChat = (chat: any) => {
    emit('close');
    emit('selectChat', chat);
};
onMounted(async () => {
    await messageStore.fetchConversations();
    console.log('conversations', messageStore.conversations);
});

const filteredChats = computed(() => {
    if (!searchQuery.value) return messageStore.conversations;
    const query = searchQuery.value.toLowerCase();
    return messageStore.conversations.filter(chat => 
        chat.name.toLowerCase().includes(query) || 
        chat.lastMessage.toLowerCase().includes(query)
    );
});
</script>

<template>
    <div class="fixed top-[70px] right-2 w-[95vw] max-w-[310px] bg-white rounded-sm shadow-[0_5px_25px_rgba(0,0,0,0.15)] border border-gray-100 z-[9999] text-gray-800 animate-in fade-in zoom-in duration-200"> 
        <div class="p-4 border-b">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-bold text-2xl text-gray-900">Đoạn chat</h3>
                <div class="flex items-center gap-2">
                    <!-- <button class="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all text-gray-700" title="Tùy chọn">
                        <Ellipsis class="w-4 h-4" />
                    </button> -->
                    <button class="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all text-gray-700" title="Xem ở chế độ toàn màn hình">
                        <Maximize class="w-4 h-4" />
                    </button>
                    <!-- <button class="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all text-gray-700" title="Tin nhắn mới">
                        <SquarePen class="w-4 h-4" />
                    </button> -->
                    <button @click.stop="emit('close')" class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-all group" title="Đóng">
                        <X class="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            <div class="relative">
                <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                    v-model="searchQuery"
                    type="text" 
                    placeholder="Tìm kiếm trên đoạn chat" 
                    class="w-full bg-gray-100 text-gray-800 text-[15px] rounded-full pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-500"
                />
            </div>
        </div>

        <div class="max-h-[380px] overflow-y-auto no-scrollbar">
            <div v-if="filteredChats.length > 0">
                <div 
                    v-for="chat in filteredChats" :key="chat.userId" @click.stop="handleSelectChat(chat)"
                    class="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
                >
                    <div class="relative flex-shrink-0">
                        <img :src="chat.avatar" class="w-12 h-12 rounded-full object-cover border border-gray-100">
                        <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center mb-0.5">
                            <h4 class="font-semibold text-[15px] truncate pr-2" :class="chat.unread > 0 ? 'text-gray-900' : 'text-gray-700'">
                                {{ chat.name }}
                            </h4>
                            <span class="text-xs text-gray-400 flex-shrink-0">{{ timeAgo(chat.timestamp )}}</span>
                        </div>
                        <p 
                            class="text-[13px] truncate" 
                            :class="(!chat.isRead && authStore.user?.ProfileID !== chat.lastSenderId) ? 'font-bold text-gray-900' : 'font-medium text-gray-500'"
                        >
                            {{ authStore.user?.ProfileID === chat.lastSenderId ? 'Bạn: ' : '' }}{{ chat.latestMessage }}
                        </p>
                    </div>

                    <div v-if="chat.unread > 0" class="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                </div>
            </div>

            <div v-else class="py-10 text-center text-gray-500 text-sm">
                Không tìm thấy đoạn chat nào cho "{{ searchQuery }}"
            </div>
        </div>

        <div class="p-3 border-t text-center">
            <router-link to="/messages" class="text-[#4c5bd4] text-sm font-semibold hover:underline">
                Xem tất cả trong Messenger
            </router-link>
        </div>
    </div>
</template>