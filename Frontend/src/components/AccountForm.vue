<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';

const authStore = useAuthStore();

const loading = ref(false);
const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const email = ref('');
const password = ref('');

onMounted(() => {
    if (authStore.user) {
        email.value = authStore.user.Email || '';
    }
});

const handleSave = async () => {
    loading.value = true;
    
    setTimeout(() => {
        loading.value = false;
        isSuccessNotify.value = true;
        messageNotify.value = 'Chức năng đổi mật khẩu đang chờ Backend API!';
        showNotify.value = true;
        password.value = ''; 
    }, 1000);
};
</script>
<template>
    <div class="w-full">
        <Notify  
            v-if="showNotify" 
            :message="messageNotify" 
            :isSuccess="isSuccessNotify" 
            @close="showNotify = false"
        />
        <Loading v-if="loading" />

        <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 relative">
            
            <div class="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div class="w-1 h-6 bg-[#1a237e] rounded-full"></div>
                <h2 class="text-lg font-extrabold text-gray-800">Tài khoản</h2>
            </div>

            <form @submit.prevent="handleSave" class="space-y-6 max-w-xl">
                
                <div class="space-y-2">
                    <label class="block text-[14.5px] font-bold text-gray-700">
                        Tên đăng nhập <span class="text-red-500">*</span>
                    </label>
                    <input v-model="email" type="email" disabled 
                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none">
                </div>

                <div class="space-y-2">
                    <label class="block text-[14.5px] font-bold text-gray-700">
                        Mật khẩu <span class="text-red-500">*</span>
                    </label>
                    <input v-model="password" type="password" required placeholder="Nhập mật khẩu mới..."
                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all tracking-widest">
                </div>

                <div class="flex justify-center pt-8">
                    <button type="submit" :disabled="loading"
                            class="h-11 px-10 bg-[#14205c] text-white font-bold rounded-xl hover:bg-[#1a237e] transition-all shadow-md shadow-blue-900/20 disabled:opacity-50">
                        Lưu
                    </button>
                </div>
                
            </form>
        </div>
    </div>
</template>
