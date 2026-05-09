<script setup lang="ts">
import { ref } from 'vue';
import SidebarAdmin from '../../components/admin/SidebarAdmin.vue';

const isMobileMenuOpen = ref(false);
const isEditing = ref(false);
const isLoading = ref(false);

const originalProfile = {
    id: 'ADM-001',
    fullName: 'Super Admin',
    email: 'admin@365timviec.vn',
    phone: '0987654321',
    role: 'Super Administrator',
    address: 'Tòa nhà A, Khu Công Nghệ Cao, TP. HCM',
    avatar: '',
};

const profileForm = ref({ ...originalProfile });

const saveProfile = () => {
    isLoading.value = true;
    
    setTimeout(() => {
        Object.assign(originalProfile, profileForm.value);
        isLoading.value = false;
        isEditing.value = false;
        alert('Cập nhật thông tin thành công!'); 
    }, 800);
};

const cancelEdit = () => {
    profileForm.value = { ...originalProfile };
    isEditing.value = false;
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
                        <h1 class="text-lg font-extrabold text-slate-800 tracking-tight leading-tight">Thông tin cá nhân</h1>
                        <p class="text-xs text-slate-400 font-medium">Quản lý hồ sơ tài khoản quản trị</p>
                    </div>
                </div>
            </div>

            <div class="flex-1 px-4 md:px-8 py-6 flex flex-col max-w-5xl mx-auto w-full fade-up">
                
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div class="h-32 bg-gradient-to-r from-[#4c5bd4] to-[#3a49c2] relative"></div>
                    
                    <div class="px-6 sm:px-10 pb-10">
                        <div class="relative flex justify-between items-end -mt-12 mb-8">
                            <div class="flex items-end gap-5">
                                <div class="relative group">
                                    <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                        <img v-if="profileForm.avatar" :src="profileForm.avatar" class="w-full h-full object-cover" />
                                        <i v-else class="fas fa-user-shield text-4xl sm:text-5xl text-[#4c5bd4]/30"></i>
                                    </div>
                                    <button v-if="isEditing" class="absolute bottom-1 right-1 w-8 h-8 sm:w-10 sm:h-10 bg-[#4c5bd4] text-white rounded-full border-2 border-white flex items-center justify-center hover:bg-[#3a49c2] transition-colors shadow-md">
                                        <i class="fas fa-camera text-xs sm:text-sm"></i>
                                    </button>
                                </div>
                                <div class="pb-2 sm:pb-4 hidden sm:block">
                                    <h2 class="text-2xl font-extrabold text-slate-800">{{ originalProfile.fullName }}</h2>
                                    <p class="text-sm font-medium text-[#4c5bd4] mt-1">{{ originalProfile.role }}</p>
                                </div>
                            </div>
                            
                            <div class="pb-2 sm:pb-4">
                                <button v-if="!isEditing" @click="isEditing = true" class="px-5 py-2.5 bg-blue-50 text-[#4c5bd4] hover:bg-[#4c5bd4] hover:text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                                    <i class="fas fa-pen"></i> <span class="hidden sm:inline">Chỉnh sửa</span>
                                </button>
                                <div v-else class="flex items-center gap-3">
                                    <button @click="cancelEdit" class="px-5 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">
                                        Hủy
                                    </button>
                                    <button @click="saveProfile" :disabled="isLoading" class="px-5 py-2.5 bg-[#4c5bd4] text-white hover:bg-[#3a49c2] rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                        <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
                                        <i v-else class="fas fa-save"></i> 
                                        <span class="hidden sm:inline">Lưu thay đổi</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="sm:hidden mb-8 text-center">
                            <h2 class="text-xl font-extrabold text-slate-800">{{ originalProfile.fullName }}</h2>
                            <p class="text-sm font-medium text-[#4c5bd4] mt-1">{{ originalProfile.role }}</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Mã nhân viên (ID)</label>
                                <input type="text" :value="profileForm.id" disabled class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono focus:outline-none cursor-not-allowed" />
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Vai trò</label>
                                <input type="text" :value="profileForm.role" disabled class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 focus:outline-none cursor-not-allowed" />
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Họ và tên <span v-if="isEditing" class="text-red-500">*</span></label>
                                <input type="text" v-model="profileForm.fullName" :disabled="!isEditing" :class="isEditing ? 'bg-white border-slate-300 focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4]' : 'bg-slate-50 border-slate-200 cursor-not-allowed text-slate-700'" class="w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none" />
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Email liên hệ <span v-if="isEditing" class="text-red-500">*</span></label>
                                <input type="email" v-model="profileForm.email" :disabled="!isEditing" :class="isEditing ? 'bg-white border-slate-300 focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4]' : 'bg-slate-50 border-slate-200 cursor-not-allowed text-slate-700'" class="w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none" />
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Số điện thoại</label>
                                <input type="text" v-model="profileForm.phone" :disabled="!isEditing" :class="isEditing ? 'bg-white border-slate-300 focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4]' : 'bg-slate-50 border-slate-200 cursor-not-allowed text-slate-700'" class="w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none" />
                            </div>

                            <div class="space-y-1.5 md:col-span-2">
                                <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Địa chỉ văn phòng</label>
                                <input type="text" v-model="profileForm.address" :disabled="!isEditing" :class="isEditing ? 'bg-white border-slate-300 focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4]' : 'bg-slate-50 border-slate-200 cursor-not-allowed text-slate-700'" class="w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none" />
                            </div>

                        </div>

                    </div>
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