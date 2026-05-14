
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useCandidateStore } from '../stores/candidate';
import { useAuthStore } from '../stores/auth';
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';

const candidateStore = useCandidateStore();
const authStore = useAuthStore();

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const fileInput = ref<HTMLInputElement | null>(null);
const avatarPreview = ref<string | null>(null);
const selectedFile = ref<File | null>(null);

const form = reactive({
    FullName: '',
    DateOfBirth: '',
    Phone: '',
    Email: '',
    Address: '',
    AvatarUrl: ''
});
const calculateMaxDate = () => {
    const today = new Date();
    const maxYear = today.getFullYear() - 18;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${maxYear}-${month}-${day}`;
};

const maxDate = ref(calculateMaxDate());

onMounted(async () => {
    await candidateStore.getProfileStore();
    
    if (candidateStore.profile) {
        form.FullName = candidateStore.profile.FullName || '';
        form.Phone = candidateStore.profile.Phone || '';
        form.Address = candidateStore.profile.Address || '';
        form.AvatarUrl = candidateStore.profile.AvatarUrl || '';
        
        if (candidateStore.profile.DateOfBirth) {
            const rawDate = new Date(candidateStore.profile.DateOfBirth);
            const y = rawDate.getFullYear();
            const m = String(rawDate.getMonth() + 1).padStart(2, '0');
            const d = String(rawDate.getDate()).padStart(2, '0');
            form.DateOfBirth = `${y}-${m}-${d}`;
        }
    }
    
    if (authStore.user) {
        form.Email = authStore.user.Email || '';
    }
});

const triggerFileInput = () => fileInput.value?.click();

const onFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        selectedFile.value = target.files[0];
        avatarPreview.value = URL.createObjectURL(target.files[0]);
    }
};

const handleSave = async () => {
    if (form.DateOfBirth > maxDate.value) {
        isSuccessNotify.value = false;
        messageNotify.value = 'Bạn phải đủ 18 tuổi để thực hiện thao tác này!';
        showNotify.value = true;
        return; 
    }

    const formData = new FormData();
    formData.append('FullName', form.FullName);
    formData.append('DateOfBirth', form.DateOfBirth);
    formData.append('Phone', form.Phone);
    formData.append('Address', form.Address);
    
    if (selectedFile.value) {
        formData.append('AvatarUrl', selectedFile.value);
    }

    await candidateStore.upsertProfileStore(formData);
    
    if (!candidateStore.error) {
        isSuccessNotify.value = true;
        messageNotify.value = 'Lưu thông tin thành công!';
        
        if (authStore.user && candidateStore.profile?.AvatarUrl) {
            authStore.user.ImgUrl = candidateStore.profile.AvatarUrl; 
            
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (localUser.Email) {
                localUser.AvatarUrl = candidateStore.profile.AvatarUrl;
                localStorage.setItem('user', JSON.stringify(localUser));
            }
        }
    } else {
        isSuccessNotify.value = false;
        messageNotify.value = candidateStore.message || 'Đã xảy ra lỗi khi lưu!';
    }
    showNotify.value = true;
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

        <Loading v-if="candidateStore.loading" />

        <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 relative">
            <div class="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div class="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h2 class="text-lg font-extrabold text-gray-800">Thông tin liên hệ</h2>
            </div>

            <form @submit.prevent="handleSave" class="space-y-6">
                <div class="flex justify-center sm:justify-start mb-8">
                    <div class="relative group cursor-pointer w-28 h-28" @click="triggerFileInput">
                        <img :src="avatarPreview || form.AvatarUrl || 'https://via.placeholder.com/150'" 
                             class="w-full h-full rounded-2xl object-cover border-4 border-white shadow-md group-hover:opacity-75 transition-all">
                        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div class="bg-black/50 w-10 h-10 rounded-full flex items-center justify-center text-white">
                                <i class="fas fa-camera"></i>
                            </div>
                        </div>
                        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileChange">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="block text-sm font-bold text-gray-700">Họ và tên <span class="text-red-500">*</span></label>
                        <input v-model="form.FullName" type="text" required 
                               class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all">
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-bold text-gray-700">Ngày sinh <span class="text-red-500">*</span></label>
                        <input v-model="form.DateOfBirth" 
                            type="date" 
                            required 
                            :max="maxDate"
                            class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-600 font-sans">
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-bold text-gray-700">Số điện thoại <span class="text-red-500">*</span></label>
                        <input v-model="form.Phone" type="tel" required 
                               class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all">
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-bold text-gray-700">Email</label>
                        <input v-model="form.Email" type="email" disabled 
                               class="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed outline-none">
                    </div>
                </div>

                <div class="space-y-2 pt-2">
                    <label class="block text-sm font-bold text-gray-700">Địa chỉ cụ thể <span class="text-red-500">*</span></label>
                    <input v-model="form.Address" type="text" required placeholder="Ví dụ: 123 Đường Nguyễn Văn Cừ..."
                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all">
                </div>

                <div class="flex justify-center pt-10">
                    <button type="submit" :disabled="candidateStore.loading"
                            class="h-11 px-12 bg-[#14205c] text-white font-bold rounded-xl hover:bg-[#1a237e] transition-all shadow-md shadow-blue-900/20 disabled:opacity-50">
                        Lưu </button>
                </div>
            </form>
        </div>
    </div>
</template>
