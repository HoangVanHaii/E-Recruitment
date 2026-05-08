<script setup lang="ts">
import { ref } from 'vue';
import SidebarAdmin from '../../components/admin/SidebarAdmin.vue';

const isMobileMenuOpen = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const form = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

const changePassword = () => {
    errorMessage.value = '';

    if (!form.value.currentPassword || !form.value.newPassword || !form.value.confirmPassword) {
        errorMessage.value = 'Vui lòng điền đầy đủ các trường.';
        return;
    }

    if (form.value.newPassword !== form.value.confirmPassword) {
        errorMessage.value = 'Mật khẩu xác nhận không khớp.';
        return;
    }

    if (form.value.newPassword.length < 6) {
        errorMessage.value = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
        return;
    }

    isLoading.value = true;
    
    setTimeout(() => {
        isLoading.value = false;
        alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.'); 
        
        form.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
        showCurrent.value = false;
        showNew.value = false;
        showConfirm.value = false;
    }, 1000);
};
</script>

<template>
    <div class="flex h-screen w-full bg-[#f1f3fb] overflow-hidden font-sans relative">

        <SidebarAdmin 
            :is-open-mobile="isMobileMenuOpen"
            @close-mobile-menu="isMobileMenuOpen = false"
        />

        <div class="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
            
            <div class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-3">
                    <button 
                        class="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                        @click="isMobileMenuOpen = true"
                        aria-label="Mở menu"
                    >
                        <i class="fas fa-bars"></i>
                    </button>
                    <div>
                        <h1 class="text-lg font-extrabold text-slate-800 tracking-tight leading-tight">Đổi mật khẩu</h1>
                        <p class="text-xs text-slate-400 font-medium">Bảo mật tài khoản quản trị</p>
                    </div>
                </div>
            </div>

            <div class="flex-1 px-4 md:px-8  flex justify-center items-start fade-up">
                
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 w-full max-w-md mt-4 sm:mt-10">
                    
                    <div class="text-center mb-8 text-[#4c5bd4]">
                        <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-shield-alt text-2xl"></i>
                        </div>
                        <h2 class="text-xl font-extrabold text-slate-800">Cập nhật mật khẩu</h2>
                        <p class="text-sm text-slate-500 mt-1">Đảm bảo tài khoản của bạn luôn an toàn.</p>
                    </div>

                    <div v-if="errorMessage" class="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-600 fade-up">
                        <i class="fas fa-exclamation-circle mt-0.5"></i>
                        <p class="text-sm font-medium leading-tight">{{ errorMessage }}</p>
                    </div>

                    <form @submit.prevent="changePassword" class="space-y-5">
                        
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-600 uppercase tracking-wide">Mật khẩu hiện tại</label>
                            <div class="relative">
                                <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                                <input 
                                    :type="showCurrent ? 'text' : 'password'" 
                                    v-model="form.currentPassword" 
                                    placeholder="Nhập mật khẩu cũ"
                                    class="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-sm transition-all focus:outline-none focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4]" 
                                />
                                <button type="button" @click="showCurrent = !showCurrent" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <i :class="showCurrent ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                </button>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-600 uppercase tracking-wide">Mật khẩu mới</label>
                            <div class="relative">
                                <i class="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                                <input 
                                    :type="showNew ? 'text' : 'password'" 
                                    v-model="form.newPassword" 
                                    placeholder="Nhập mật khẩu mới"
                                    class="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-sm transition-all focus:outline-none focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4]" 
                                />
                                <button type="button" @click="showNew = !showNew" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <i :class="showNew ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                </button>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-600 uppercase tracking-wide">Xác nhận mật khẩu</label>
                            <div class="relative">
                                <i class="fas fa-check-circle absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                                <input 
                                    :type="showConfirm ? 'text' : 'password'" 
                                    v-model="form.confirmPassword" 
                                    placeholder="Nhập lại mật khẩu mới"
                                    class="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-sm transition-all focus:outline-none focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4]" 
                                />
                                <button type="button" @click="showConfirm = !showConfirm" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <i :class="showConfirm ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                </button>
                            </div>
                        </div>

                        <div class="pt-2">
                            <button 
                                type="submit" 
                                :disabled="isLoading" 
                                class="w-full py-3.5 bg-[#4c5bd4] text-white hover:bg-[#3a49c2] rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                            >
                                <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
                                <span v-else>Cập nhật mật khẩu</span>
                            </button>
                        </div>
                    </form>

                </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }

.fade-up { animation: fadeUp 0.4s ease both; }
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
}
</style>