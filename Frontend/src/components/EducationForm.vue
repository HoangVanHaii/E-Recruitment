
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCandidateStore } from '../stores/candidate';
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';

const candidateStore = useCandidateStore();

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const educationList = ref<any[]>([]);

const showForm = ref(false);
const editingIndex = ref<number>(-1);
const currentEdu = ref<any>({
    institution: '', startDate: '', endDate: '', major: '', degree: '', gpa: ''
});

const formatDateToShow = (dateStr: string) => {
    if (!dateStr) return 'Hiện tại';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

onMounted(async () => {
    if (!candidateStore.profile) {
        await candidateStore.getProfileStore();
    }
    const eduData = candidateStore.profile?.education || [];
    if (eduData.length > 0) {
        educationList.value = eduData.map((edu: any) => ({
            institution: edu.institution || '',
            major: edu.major || '',
            degree: edu.degree || '',
            gpa: edu.gpa || '',
            startDate: edu.startDate ? new Date(edu.startDate).toISOString().substring(0, 10) : '',
            endDate: edu.endDate ? new Date(edu.endDate).toISOString().substring(0, 10) : ''
        }));
    }
});

const openAddForm = () => {
    currentEdu.value = { institution: '', startDate: '', endDate: '', major: '', degree: '', gpa: '' };
    editingIndex.value = -1;
    showForm.value = true;
};

const openEditForm = (index: number) => {
    currentEdu.value = { ...educationList.value[index] };
    editingIndex.value = index;
    showForm.value = true;
};

const saveFormToLocal = () => {
    if (currentEdu.value.startDate && currentEdu.value.endDate) {
        if (new Date(currentEdu.value.startDate) > new Date(currentEdu.value.endDate)) {
            isSuccessNotify.value = false;
            messageNotify.value = 'Thời gian kết thúc không thể diễn ra trước thời gian bắt đầu!';
            showNotify.value = true;
            return; 
        }
    }

    if (editingIndex.value === -1) {
        educationList.value.unshift({ ...currentEdu.value }); 
    } else {
        educationList.value[editingIndex.value] = { ...currentEdu.value };
    }
    closeForm();
};

const closeForm = () => {
    showForm.value = false;
    editingIndex.value = -1;
};

const removeEducation = (index: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa học vấn này?')) {
        educationList.value.splice(index, 1);
    }
};

const handleSaveAPI = async () => {
    const payload = {
        education: educationList.value
    };
    
    await candidateStore.updateMasterProfileStore(payload);
    
    if (!candidateStore.error) {
        isSuccessNotify.value = true;
        messageNotify.value = 'Đồng bộ toàn bộ Trình độ học vấn thành công!';
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
            
            <div class="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-[#1a237e] rounded-full"></div>
                    <h2 class="text-lg font-extrabold text-gray-800">Trình độ học vấn</h2>
                </div>
                
                <button v-if="!showForm" @click="openAddForm" 
                        class="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all flex items-center gap-2">
                    <i class="fas fa-plus"></i> Thêm học vấn
                </button>
            </div>

            <div v-if="!showForm">
                <div v-if="educationList.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div v-for="(edu, index) in educationList" :key="index" 
                         class="p-5 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow relative group">
                        
                        <span class="absolute top-4 right-4 bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider">
                            {{ edu.degree || 'Chưa rõ' }}
                        </span>

                        <h3 class="font-bold text-gray-800 text-base mb-1 pr-16 truncate">{{ edu.institution }}</h3>
                        <p class="text-sm text-gray-500 mb-3">{{ edu.major }}</p>
                        
                        <div class="flex items-center gap-2 text-xs text-gray-400 mb-4">
                            <i class="far fa-calendar-alt"></i>
                            <span>{{ formatDateToShow(edu.startDate) }} - {{ formatDateToShow(edu.endDate) }}</span>
                        </div>

                        <div class="flex gap-2 pt-3 border-t border-gray-50">
                            <button @click="openEditForm(index)" class="flex-1 py-1.5 text-xs font-bold text-blue-600 bg-blue-50/50 rounded-lg hover:bg-blue-100 transition-colors">
                                <i class="fas fa-pen mr-1"></i> Sửa
                            </button>
                            <button @click="removeEducation(index)" class="w-10 flex items-center justify-center text-xs text-red-500 bg-red-50/50 rounded-lg hover:bg-red-100 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div v-else class="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 mb-8">
                    <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                        <i class="fas fa-graduation-cap text-xl text-gray-300"></i>
                    </div>
                    <p class="text-gray-500 font-medium text-sm">Bạn chưa có dữ liệu học vấn</p>
                </div>

                <div class="flex justify-center pt-2 border-t border-gray-100">
                    <button @click="handleSaveAPI" :disabled="candidateStore.loading"
                            class="h-12 px-16 bg-[#14205c] text-white font-bold rounded-xl hover:bg-[#1a237e] transition-all shadow-md shadow-blue-900/20 disabled:opacity-50">
                        Lưu Thay Đổi
                    </button>
                </div>
            </div>

            <form v-else @submit.prevent="saveFormToLocal" class="space-y-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 class="font-bold text-[#1a237e] mb-4 border-b border-gray-200 pb-2">
                    {{ editingIndex === -1 ? 'Thêm học vấn mới' : 'Chỉnh sửa học vấn' }}
                </h3>

                <div class="space-y-2">
                    <label class="block text-[14.5px] font-bold text-gray-700">Trường / Đơn vị giảng dạy <span class="text-red-500">*</span></label>
                    <input v-model="currentEdu.institution" type="text" required placeholder="Nhập tên trường hoặc đơn vị giảng dạy"
                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="space-y-2">
                        <label class="block text-[14.5px] font-bold text-gray-700">Thời gian bắt đầu <span class="text-red-500">*</span></label>
                        <input v-model="currentEdu.startDate" 
                            type="date" 
                            required 
                            :max="currentEdu.endDate || undefined"
                            class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all text-gray-600">
                    </div>
                    <div class="space-y-2">
                        <label class="block text-[14.5px] font-bold text-gray-700">Đến <span class="text-red-500">*</span></label>
                        <input v-model="currentEdu.endDate" 
                            type="date" 
                            required 
                            :min="currentEdu.startDate || undefined"
                            class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all text-gray-600">
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-[14.5px] font-bold text-gray-700">Chuyên ngành <span class="text-red-500">*</span></label>
                    <input v-model="currentEdu.major" type="text" required placeholder="Nhập chuyên ngành"
                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="space-y-2">
                        <label class="block text-[14.5px] font-bold text-gray-700">Bằng cấp / Xếp loại <span class="text-red-500">*</span></label>
                        <select v-model="currentEdu.degree" required 
                                class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all text-gray-700 appearance-none">
                            <option value="" disabled selected>Chọn bằng cấp</option>
                            <option value="Cử nhân">Cử nhân</option>
                            <option value="Kỹ sư">Kỹ sư</option>
                            <option value="Thạc sĩ">Thạc sĩ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="block text-[14.5px] font-bold text-gray-700">Điểm (GPA) / Xếp loại</label>
                        <input v-model="currentEdu.gpa" type="text" placeholder="Ví dụ: 3.2/4.0 hoặc Giỏi"
                               class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all">
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-6">
                    <button type="button" @click="closeForm" class="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">
                        Hủy
                    </button>
                    <button type="submit" class="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">
                        Hoàn tất
                    </button>
                </div>
            </form>

        </div>
    </div>
</template>

<style scoped>
.animate-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>