<script setup lang="ts">
import { MessageCircle } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useMessageStore } from '../stores/message';
const router = useRouter();
const messageStore = useMessageStore();
</script>
<template>
    <button @click="router.push({ path: '/candidate-profile', query: { tab: 'chat' } })" class="fixed bottom-12 right-8 bg-white p-3.5 rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] border border-gray-100 hover:-translate-y-1 transition-all z-30 group">
        <MessageCircle class="w-7 h-7 text-gray-800 group-hover:text-blue-600 transition-colors" />
        
        <span
            v-if="messageStore.unreadCount > 0"
            class="absolute -top-2 -right-2 bg-red-500 text-xs px-1.5 rounded-full text-white"
        >
            {{ messageStore.unreadCount > 9 ? '9+' : messageStore.unreadCount }}
        </span>
    </button>
</template>