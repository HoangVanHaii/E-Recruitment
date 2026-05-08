<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
    // Quay lại trang trước đó
    router.back();
};

const goHome = () => {
    // Trở về trang Dashboard chính
    router.push({ name: 'admin-dashboard' }); 
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-[#f1f3fb] px-4 font-sans selection:bg-[#4c5bd4] selection:text-white">
        
        <div class="max-w-lg w-full bg-white rounded-[2rem] shadow-xl shadow-[#4c5bd4]/5 border border-white p-8 sm:p-12 text-center relative overflow-hidden fade-up">

            <div class="absolute top-[-20%] left-[-10%] w-40 h-40 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-red-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>

            <div class="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <div class="absolute inset-0 bg-red-50 rounded-full animate-pulse-slow"></div>
                <div class="absolute inset-4 bg-red-100 rounded-full"></div>
                <i class="fas fa-user-lock text-5xl text-red-500 relative z-10 animate-bounce-slight"></i>
            </div>

            <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">403</h1>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-700 mb-3">Truy cập bị từ chối!</h2>
            <p class="text-slate-500 text-sm sm:text-base leading-relaxed mb-8">
                Rất tiếc, bạn không có quyền truy cập vào tài nguyên này. Vui lòng kiểm tra lại tài khoản hoặc liên hệ quản trị viên hệ thống.
            </p>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                    @click="goBack"
                    class="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <i class="fas fa-arrow-left text-sm"></i> Quay lại
                </button>
                <button
                    @click="goHome"
                    class="w-full sm:w-auto px-6 py-3 bg-[#4c5bd4] hover:bg-[#3a49c2] text-white font-bold rounded-xl transition-colors shadow-md shadow-[#4c5bd4]/20 flex items-center justify-center gap-2"
                >
                    <i class="fas fa-home text-sm"></i> Về trang chủ
                </button>
            </div>
            
        </div>
        
    </div>
</template>

<style scoped>
.fade-up {
    animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}

.animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
}

.animate-bounce-slight {
    animation: bounceSlight 2.5s infinite ease-in-out;
}
@keyframes bounceSlight {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}
</style>