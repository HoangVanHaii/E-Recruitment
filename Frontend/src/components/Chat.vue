<script setup lang="ts">
import { MessageCircle } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
const router = useRouter();
</script>
<template>
    <button @click="router.push({ path: '/candidate-profile', query: { tab: 'chat' } })" class="fixed bottom-12 right-8 bg-white p-3.5 rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] border border-gray-100 hover:-translate-y-1 transition-all z-30 group">
        <MessageCircle class="w-7 h-7 text-gray-800 group-hover:text-blue-600 transition-colors" />
        <span class="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
    </button>
</template>