<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useCandidateStore } from '../stores/candidate';
import type { IProject, ICandidateDetail } from '../types/candidate';
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';

type LocalProject = Omit<IProject, 'technologies'> & { 
    technologiesStr: string; 
    _isExpanded?: boolean; 
    _markedForDeletion?: boolean; 
    _isNew?: boolean 
};

const candidateStore = useCandidateStore();

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const form = reactive({
    projects: [] as LocalProject[]
});

const isAddingActive = computed(() => {
    return form.projects.some(p => p._isNew && p._isExpanded);
});

const getEmptyProject = (): LocalProject => ({
    projectName: '',
    role: '',
    technologiesStr: '',
    link: '',
    description: '',
    _isExpanded: true,
    _markedForDeletion: false,
    _isNew: true
});

onMounted(async () => {
    if (!candidateStore.profile) {
        await candidateStore.getProfileStore();
    }

    const projectData = candidateStore.profile?.projects;
    
    if (projectData && projectData.length > 0) {
        form.projects = projectData.map(p => ({
            projectName: p.projectName || '',
            role: p.role || '',
            link: p.link || '',
            description: p.description || '',
            technologiesStr: p.technologies ? p.technologies.join(', ') : '',
            _isExpanded: false,
            _markedForDeletion: false,
            _isNew: false
        }));
    } else {
        form.projects.push(getEmptyProject());
    }
});

const addProject = () => {
    if (!isAddingActive.value) {
        form.projects.unshift(getEmptyProject());
    }
};

const toggleExpand = (prj: LocalProject) => {
    if (prj._markedForDeletion) return; 
    prj._isExpanded = !prj._isExpanded;
};

const toggleDelete = (prj: LocalProject) => {
    prj._markedForDeletion = !prj._markedForDeletion;
    if (prj._markedForDeletion) prj._isExpanded = false; 
};

const splitTechs = (str: string) => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(s => s !== '').slice(0, 3);
};

const handleSave = async () => {
    const cleanProjects: IProject[] = form.projects
        .filter(p => !p._markedForDeletion)
        .map(p => {
            const techs = p.technologiesStr.split(',').map(s => s.trim()).filter(s => s !== '');
            
            const { _isExpanded, _markedForDeletion, _isNew, technologiesStr, ...rest } = p;
            return {
                ...rest,
                technologies: techs
            };
        });

    const payload: ICandidateDetail = {
        projects: cleanProjects
    };
    
    await candidateStore.updateMasterProfileStore(payload);
    
    if (!candidateStore.error) {
        form.projects = form.projects.filter(p => !p._markedForDeletion);
        form.projects.forEach(p => {
            p._isExpanded = false;
            p._isNew = false;
        });
        
        isSuccessNotify.value = true;
        messageNotify.value = 'Lưu dự án thành công!';
    } else {
        isSuccessNotify.value = false;
        messageNotify.value = candidateStore.message || 'Đã xảy ra lỗi!';
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
                    <div class="w-1 h-6 bg-[#4f46e5] rounded-full"></div>
                    <h2 class="text-lg font-extrabold text-gray-800">Dự án tham gia</h2>
                </div>
                
                <button type="button" @click="addProject"
                        :disabled="isAddingActive"
                        class="text-sm font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
                        :class="isAddingActive ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:text-indigo-800'">
                    <i class="fas fa-plus"></i> Thêm dự án
                </button>
            </div>

            <form @submit.prevent="handleSave" class="space-y-6">
                
                <div class="flex flex-wrap gap-4">
                    
                    <div v-for="(prj, index) in form.projects" :key="index" 
                         :class="[
                             prj._isExpanded ? 'w-full' : 'w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]',
                             'transition-all duration-300'
                         ]">
                        
                        <div v-if="!prj._isExpanded" 
                             class="relative p-4 rounded-xl border flex flex-col justify-between h-full group overflow-hidden"
                             :class="[
                                 prj._markedForDeletion ? 'opacity-40 grayscale border-gray-200 bg-gray-50' : 
                                 prj._isNew ? 'border-amber-300 bg-amber-50' : 'border-indigo-200 bg-indigo-50/40'
                             ]">
                            
                            <div v-if="!prj._markedForDeletion" class="absolute top-0 right-0">
                                <span v-if="prj._isNew" class="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-bl-lg">Mới chưa lưu</span>
                                <span v-else class="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-bl-lg">Dự án</span>
                            </div>

                            <div class="cursor-pointer mt-1" @click="toggleExpand(prj)">
                                <h3 class="font-bold truncate pr-6" 
                                    :class="prj._isNew ? 'text-amber-800' : 'text-[#1a237e]'">
                                    {{ prj.projectName || 'Tên dự án mới...' }}
                                </h3>
                                <p class="text-sm text-gray-600 truncate mt-1">{{ prj.role || 'Vai trò của bạn' }}</p>
                                <div class="flex flex-wrap gap-1 mt-3">
                                    <span v-for="tech in splitTechs(prj.technologiesStr)" :key="tech"
                                          class="text-[10px] px-1.5 py-0.5 rounded bg-white/60 border border-indigo-100 text-indigo-600">
                                        {{ tech }}
                                    </span>
                                </div>
                            </div>

                            <div class="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" :class="{ 'opacity-100': prj._markedForDeletion }">
                                <button v-if="prj._markedForDeletion" type="button" @click.stop="toggleDelete(prj)"
                                        class="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700">
                                    Hoàn tác
                                </button>
                                <template v-else>
                                    <button type="button" @click.stop="toggleExpand(prj)" class="w-7 h-7 flex items-center justify-center rounded-md bg-white/60 text-blue-600 hover:bg-white shadow-sm">
                                        <i class="fas fa-pen text-xs"></i>
                                    </button>
                                    <button type="button" @click.stop="toggleDelete(prj)" class="w-7 h-7 flex items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 shadow-sm">
                                        <i class="fas fa-trash-alt text-xs"></i>
                                    </button>
                                </template>
                            </div>
                        </div>

                        <div v-else class="relative p-5 rounded-xl border shadow-sm w-full"
                             :class="prj._isNew ? 'border-amber-300 bg-amber-50/40' : 'border-indigo-200 bg-indigo-50/30'">
                            
                            <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                <div class="font-bold flex items-center gap-2"
                                     :class="prj._isNew ? 'text-amber-700' : 'text-indigo-700'">
                                    Chi tiết dự án
                                    <span v-if="prj._isNew" class="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Mới</span>
                                </div>

                                <div class="flex gap-2">
                                    <button type="button" @click="toggleDelete(prj)" class="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1">
                                        <i class="fas fa-trash-alt"></i> Xóa
                                    </button>
                                    <button type="button" @click="toggleExpand(prj)" 
                                            class="text-sm font-medium px-3 py-1 border rounded-md transition-all flex items-center gap-1.5"
                                            :class="prj._isNew ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'">
                                        <i v-if="prj._isNew" class="fas fa-check"></i>
                                        {{ prj._isNew ? 'Xong' : 'Thu gọn' }}
                                    </button>
                                </div>
                            </div>

                            <div class="space-y-5">
                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Tên dự án <span class="text-red-500">*</span></label>
                                    <input v-model="prj.projectName" type="text" required placeholder="Ví dụ: JobPortal AI Platform"
                                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#4f46e5] outline-none transition-all">
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Vai trò / Vị trí <span class="text-red-500">*</span></label>
                                    <input v-model="prj.role" type="text" required placeholder="Ví dụ: Fullstack Developer"
                                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#4f46e5] outline-none transition-all">
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Kỹ năng / Công cụ sử dụng</label>
                                    <input v-model="prj.technologiesStr" type="text" placeholder="Ví dụ: AutoCAD, Photoshop, Excel, Kỹ năng đàm phán... (cách nhau dấu phẩy)"
                                        class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#4f46e5] outline-none transition-all">
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Link dự án / Demo</label>
                                    <input v-model="prj.link" type="text" placeholder="https://github.com/your-project"
                                           class="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#4f46e5] outline-none transition-all">
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-[14.5px] font-bold text-gray-700">Mô tả dự án</label>
                                    <textarea v-model="prj.description" placeholder="Mô tả mục tiêu dự án và những gì bạn đã làm được..." rows="4"
                                              class="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#4f46e5] outline-none transition-all resize-none"></textarea>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>

                <div class="flex justify-center pt-6 mt-4 border-t border-gray-100">
                    <button type="submit" :disabled="candidateStore.loading"
                            class="h-11 px-12 bg-[#14205c] text-white font-bold rounded-xl hover:bg-[#1a237e] transition-all shadow-md shadow-indigo-900/20 disabled:opacity-50">
                        Lưu thay đổi
                    </button>
                </div>
                
            </form>
        </div>
    </div>
</template>
