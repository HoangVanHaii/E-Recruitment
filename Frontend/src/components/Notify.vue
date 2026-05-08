<script setup lang="ts">
import {  onMounted, onUnmounted, ref } from 'vue';
const props = defineProps({
    message: {
        type: String,
        required: true
    },
    isSuccess: {
        type: Boolean,
        required: true
    },
    duration: {
        type: Number,
        default: 2000
    }
})
const emit = defineEmits(['close']);
const showNotify = ref < boolean > (false);
let timer: number | null = null;

onMounted(() => {
    showNotify.value = true;
    if (props.duration > 0) {
        timer = setTimeout(() => {
            closeNotify();
        }, props.duration);
    }
})

const closeNotify = () => {
    showNotify.value = false;
    setTimeout(() => {
        emit('close');
    }, 300);
}
onUnmounted(() => {
    if (timer) {
        clearTimeout(timer);
    }
});

</script>
<template>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-x-[120%] opacity-0"
        enter-to-class="transform translate-x-0 opacity-100"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="transform translate-x-0 opacity-100"
        leave-to-class="transform translate-x-[120%] opacity-0"
      >
        <div v-if="showNotify" class="fixed top-6 right-6 z-[9999]">
          <div 
            :class="[
              'flex items-center gap-3 min-w-[280px] max-w-sm p-4 rounded-xl border border-t-0 border-r-0 border-b-0 border-l-4 text-white shadow-xl backdrop-blur-sm',
              isSuccess 
                ? 'bg-emerald-500 border-emerald-600 shadow-emerald-500/40' 
                : 'bg-rose-500 border-rose-600 shadow-rose-500/40'
            ]"
          >
            <div class="flex-shrink-0 bg-white/20 p-1.5 rounded-full">
              <svg v-if="isSuccess" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
    
            <div class="flex-1 font-medium text-sm md:text-base leading-snug">
              {{ message }}
            </div>
    
            <button
              @click="closeNotify"
              class="flex-shrink-0 p-1 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors focus:outline-none"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>