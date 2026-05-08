<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const goBack = () => {
    router.back();
};

const goHome = () => {
    router.push({ name: 'admin-dashboard' }); 
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-[#f1f3fb] px-4 font-sans selection:bg-[#4c5bd4] selection:text-white">
        
        <div class="max-w-lg w-full bg-white rounded-[2rem] shadow-xl shadow-[#4c5bd4]/5 border border-white p-8 sm:p-12 text-center relative overflow-hidden fade-up">

            <div class="absolute top-[-20%] left-[-10%] w-40 h-40 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-amber-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>

            <div class="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <div class="absolute inset-0 bg-amber-50 rounded-full animate-pulse-slow"></div>
                <div class="absolute inset-4 bg-amber-100 rounded-full"></div>
                <i class="fas fa-compass text-5xl text-amber-500 relative z-10 animate-float"></i>
            </div>

            <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">404</h1>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-700 mb-3">Ôi không! Bạn bị lạc rồi.</h2>
            <p class="text-slate-500 text-sm sm:text-base leading-relaxed mb-8">
                Trang bạn đang tìm kiếm dường như không tồn tại, đã bị xóa hoặc URL không chính xác. Hãy để chúng tôi đưa bạn về đúng đường nhé!
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

.animate-float {
    animation: floatIcon 3s ease-in-out infinite;
}
@keyframes floatIcon {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-5px) rotate(-5deg); }
    75% { transform: translateY(-5px) rotate(5deg); }
}
</style>