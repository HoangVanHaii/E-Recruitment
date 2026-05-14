
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'; 
import { useCandidateStore } from '../stores/candidate';
import type { IExperience, ICandidateDetail } from '../types/candidate';
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';

type LocalExperience = IExperience & { _isExpanded?: boolean; _markedForDeletion?: boolean; _isNew?: boolean };

const candidateStore = useCandidateStore();

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const form = reactive({
    experiences: [] as LocalExperience[]
});

const isAddingActive = computed(() => {
    return form.experiences.some(exp => exp._isNew && exp._isExpanded);
});

const getEmptyExperience = (): LocalExperience => ({
    companyName: '',
    position: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    _isExpanded: true,
    _markedForDeletion: false,
    _isNew: true 
});

onMounted(async () => {
    if (!candidateStore.profile) {
        await candidateStore.getProfileStore();
    }

    const expData = candidateStore.profile?.experience;
    
    if (expData && expData.length > 0) {
        form.experiences = expData.map(exp => ({
            companyName: exp.companyName || '',
            position: exp.position || '',
            isCurrent: exp.isCurrent || false,
            description: exp.description || '',
            startDate: exp.startDate ? new Date(exp.startDate).toISOString().substring(0, 10) : '',
            endDate: exp.endDate ? new Date(exp.endDate).toISOString().substring(0, 10) : '',
            _isExpanded: false,
            _markedForDeletion: false,
            _isNew: false
        }));
    } else {
        form.experiences.push(getEmptyExperience());
    }
});

const addExperience = () => {
    if (!isAddingActive.value) {
        form.experiences.unshift(getEmptyExperience());
    }
};

const toggleExpand = (exp: LocalExperience) => {
    if (exp._markedForDeletion) return; 
    exp._isExpanded = !exp._isExpanded;
};

const toggleDelete = (exp: LocalExperience) => {
    exp._markedForDeletion = !exp._markedForDeletion;
    if (exp._markedForDeletion) exp._isExpanded = false; 
};

const formatDate = (dateStr: string | Date) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
};

const handleSave = async () => {
    for (const exp of form.experiences) {
        if (!exp._markedForDeletion && !exp.isCurrent && exp.startDate && exp.endDate) {
            if (new Date(exp.startDate) > new Date(exp.endDate)) {
                isSuccessNotify.value = false;
                messageNotify.value = `Thời gian kết thúc không thể trước thời gian bắt đầu tại công ty "${exp.companyName || 'đang cập nhật'}"!`;
                showNotify.value = true;
                exp._isExpanded = true; 
                return; 
            }
        }
    }

    const cleanExperiences: IExperience[] = form.experiences
        .filter(exp => !exp._markedForDeletion)
        .map(exp => {
            const { _isExpanded, _markedForDeletion, _isNew, ...cleanData } = exp;
            return cleanData;
        });

    const payload: ICandidateDetail = {
        experience: cleanExperiences
    };
    
    await candidateStore.updateMasterProfileStore(payload);
    
    if (!candidateStore.error) {
        form.experiences = form.experiences.filter(exp => !exp._markedForDeletion);
        form.experiences.forEach(exp => {
            exp._isExpanded = false;
            exp._isNew = false;
        });
        
        isSuccessNotify.value = true;
        messageNotify.value = 'Lưu kinh nghiệm làm việc thành công!';
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
                    <h2 class="text-lg font-extrabold text-gray-800">Kinh nghiệm làm việc</h2>
                </div>
                
                <button type="button" @click="addExperience"
                        :disabled="isAddingActive"
                        class="text-sm font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
                        :class="isAddingActive ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:text-blue-800'">
                    <i class="fas fa-plus"></i> Thêm kinh nghiệm
                </button>
            </div>

            <form @submit.prevent="handleSave" class="space-y-6">
                
                <div class="flex flex-wrap gap-4">
                    
                    <div v-for="(exp, index) in form.experiences" :key="index" 
                         :class="[
                             exp._isExpanded ? 'w-full' : 'w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]',
                             'transition-all duration-300'
                         ]">
                        
                        <div v-if="!exp._isExpanded" 
                             class="relative p-4 rounded-xl border flex flex-col justify-between h-full group overflow-hidden"
                             :class="[
                                 exp._markedForDeletion ? 'opacity-40 grayscale border-gray-200 bg-gray-50' : 
                                 exp._isNew ? 'border-amber-300 bg-amber-50' : 
                                 exp.isCurrent ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                             ]">
                            
                            <div v-if="!exp._markedForDeletion" class="absolute top-0 right-0">
                                <span v-if="exp._isNew" class="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-bl-lg">Mới chưa lưu</span>
                                <span v-else-if="exp.isCurrent" class="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-bl-lg">Đang làm</span>
                            </div>

                            <div class="cursor-pointer mt-1" @click="toggleExpand(exp)">
                                <h3 class="font-bold truncate pr-6" 
                                    :class="exp._isNew ? 'text-amber-800' : (exp.isCurrent ? 'text-emerald-800' : 'text-[#1a237e]')">
                                    {{ exp.companyName || 'Đang cập nhật...' }}
                                </h3>
                                <p class="text-sm text-gray-600 truncate mt-1">{{ exp.position || 'Chức danh' }}</p>
                                <p class="text-xs mt-2" :class="exp.isCurrent ? 'text-emerald-600 font-medium' : 'text-gray-400'">
                                    {{ exp.startDate ? formatDate(exp.startDate) : '...' }} - 
                                    {{ exp.isCurrent ? 'Hiện tại' : (exp.endDate ? formatDate(exp.endDate) : '...') }}
                                </p>
                            </div>

                            <div class="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" :class="{ 'opacity-100': exp._markedForDeletion }">
                                <button v-if="exp._markedForDeletion" type="button" @click.stop="toggleDelete(exp)"
                                        class="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700">
                                    Hoàn tác
                                </button>
                                <template v-else>
                                    <button type="button" @click.stop="toggleExpand(exp)" class="w-7 h-7 flex items-center justify-center rounded-md bg-white/60 text-blue-600 hover:bg-white shadow-sm">
                                        <i class="fas fa-pen text-xs"></i>
                                    </button>
                                    <button type="button" @click.stop="toggleDelete(exp)" class="w-7 h-7 flex items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 shadow-sm">
                                        <i class="fas fa-trash-alt text-xs"></i>
                                    </button>
                                </template>
                            </div>
                        </div>

                        <div v-else class="relative p-5 rounded-xl border shadow-sm w-full"
                             :class="[
                                 exp._isNew ? 'border-amber-300 bg-amber-50/40' : 
                                 exp.isCurrent ? 'border-emerald-300 bg-emerald-50/40' : 'border-blue-200 bg-blue-50/30'
                             ]">
                            
                            <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                <div class="font-bold flex items-center gap-2"
                                     :class="exp._isNew ? 'text-amber-700' : (exp.isCurrent ? 'text-emerald-700' : 'text-[#1a237e]')">
                                    Chi tiết kinh nghiệm
                                    <span v-if="exp._isNew" class="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Mới</span>
                                    <span v-else-if="exp.isCurrent" class="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">Đang làm</span>
                                </div>

                                <div class="flex gap-2">
                                    <button type="button" @click="toggleDelete(exp)" class="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1">
                                        <i class="fas fa-trash-alt"></i> Xóa
                                    </button>
                                    
                                    <button type="button" @click="toggleExpand(exp)" 
                                            class="text-sm font-medium px-3 py-1 border rounded-md transition-all flex items-center gap-1.5"
                                            :class="exp._isNew ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'">
                                        <i v-if="exp._isNew" class="fas fa-check"></i>
                                        {{ exp._isNew ? 'Xong' : 'Thu gọn' }}
                                    </button>
                                </div>
                            </div>

                            <div class="space-y-5">
                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Công ty / Tổ chức <span class="text-red-500">*</span></label>
                                    <input v-model="exp.companyName" type="text" required placeholder="Nhập tên công ty"
                                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all">
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Thời gian bắt đầu <span class="text-red-500">*</span></label>
                                    <input v-model="exp.startDate" 
                                        type="date" 
                                        required 
                                        :max="(!exp.isCurrent && exp.endDate) ? (exp.endDate as string) : ''"
                                        class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all text-gray-600">
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Đến <span v-if="!exp.isCurrent" class="text-red-500">*</span></label>
                                    <input v-model="exp.endDate" 
                                        type="date" 
                                        :disabled="exp.isCurrent"
                                        :min="(exp.startDate as string) || ''"
                                        :required="!exp.isCurrent"
                                        class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all text-gray-600 disabled:opacity-50 disabled:bg-gray-100">
                                    
                                    <div class="flex items-center gap-2 mt-2">
                                        <input type="checkbox" v-model="exp.isCurrent" :id="'current-' + index" class="w-4 h-4 text-[#1a237e] rounded cursor-pointer">
                                        <label :for="'current-' + index" class="text-sm text-gray-600 cursor-pointer font-medium">Tôi vẫn đang làm việc ở đây</label>
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Chức danh <span class="text-red-500">*</span></label>
                                    <input v-model="exp.position" type="text" required placeholder="Nhập chức danh"
                                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all">
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Mô tả công việc</label>
                                    <textarea v-model="exp.description" placeholder="Mô tả công việc như là nhiệm vụ, thành tích đạt được v.v..." rows="4"
                                              class="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1a237e] outline-none transition-all resize-none"></textarea>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>

                <p v-if="form.experiences.length > 0 && form.experiences.every(e => e._markedForDeletion)" class="text-center text-sm text-red-500 mt-4 font-medium">
                    Bạn đang xóa toàn bộ kinh nghiệm. Nhấn Lưu thay đổi để xác nhận.
                </p>

                <div class="flex justify-center pt-6 mt-4 border-t border-gray-100">
                    <button type="submit" :disabled="candidateStore.loading"
                            class="h-11 px-12 bg-[#14205c] text-white font-bold rounded-xl hover:bg-[#1a237e] transition-all shadow-md shadow-blue-900/20 disabled:opacity-50">
                        Lưu thay đổi
                    </button>
                </div>
                
            </form>
        </div>
    </div>
</template>
