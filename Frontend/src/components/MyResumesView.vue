
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useResumeStore } from '../stores/resume'; 
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';

const router = useRouter();
const resumeStore = useResumeStore();

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);


const resumeList = computed(() => resumeStore.resumes || []);

onMounted(async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await resumeStore.fetchMyResumesStore();
});

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Vừa xong';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const goToCreateResume = () => {
    router.push({ query: { tab: 'create_cv' } });
};

const editResume = (resumeId: number) => {
    router.push({ query: { tab: 'create_cv', id: resumeId } });
};

const viewResume = (resumeId: number) => {
    router.push(`/resume/detail/${resumeId}`);
};

const deleteResume = async (resumeId: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa CV này vĩnh viễn không?')) {
        await resumeStore.deleteResumeStore(resumeId); 
        
        if (!resumeStore.error) {
            isSuccessNotify.value = true;
            messageNotify.value = 'Đã xóa CV thành công!';
        } else {
            isSuccessNotify.value = false;
            messageNotify.value = resumeStore.message || 'Xóa CV thất bại!';
        }
        showNotify.value = true;
    }
};
</script>
<template>
    <div class="w-full pb-10">
        <Notify v-if="showNotify" :message="messageNotify" :isSuccess="isSuccessNotify" @close="showNotify = false" />
        <Loading v-if="resumeStore.loading" />

        <div class="mb-12">
            <h2 class="text-[17px] font-black text-[#14205c] mb-6 tracking-wide">
                 CV xin việc của tôi ({{ resumeList.length }} Mẫu)
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div v-for="(cv, index) in resumeList" :key="(cv as any).ResumeID || index" 
                     class="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group overflow-hidden">
                    
                    <div class="h-32 relative p-5 flex flex-col justify-between transition-all"
                         :class="{
                             'bg-gradient-to-br from-[#14205c] to-blue-600': !(cv as any).TemplateID || (cv as any).TemplateID === 1,
                             'bg-gradient-to-br from-emerald-700 to-emerald-400': (cv as any).TemplateID === 2,
                             'bg-gradient-to-br from-purple-800 to-purple-500': (cv as any).TemplateID === 3
                         }">
                        
                        <div class="flex justify-between items-start">
                            <span class="bg-white/20 px-3 py-1 rounded-full text-white text-[11px] font-bold backdrop-blur-sm border border-white/20 flex items-center gap-1.5">
                                <i class="fas fa-file-invoice"></i> CV #{{ (cv as any).ResumeID }}
                            </span>
                            
                            <i v-if="!(cv as any).TemplateID || (cv as any).TemplateID === 1" class="fas fa-layer-group text-white/50 text-2xl" title="Mẫu Cổ Điển"></i>
                            <i v-else-if="(cv as any).TemplateID === 2" class="fas fa-align-left text-white/50 text-2xl" title="Mẫu Tối Giản"></i>
                            <i v-else-if="(cv as any).TemplateID === 3" class="fas fa-border-all text-white/50 text-2xl" title="Mẫu Hiện Đại"></i>
                        </div>
                        
                        <h3 class="text-white font-extrabold text-lg truncate mt-2 drop-shadow-md" :title="(cv as any).Title">
                            {{ (cv as any).Title || 'Hồ sơ chưa có tiêu đề' }}
                        </h3>

                        <div class="absolute inset-0 bg-[#0f172a]/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                            <button @click="viewResume((cv as any).ResumeID)" class="w-11 h-11 bg-white rounded-full text-blue-600 hover:bg-blue-50 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] transform hover:scale-110 transition-transform" title="Xem & Xuất PDF">
                                <i class="fas fa-eye text-lg"></i>
                            </button>
                        </div>
                    </div>

                    <div class="p-5 flex-1 flex flex-col justify-between bg-white">
                        <div>
                            <p class="text-xs text-gray-500 flex items-center gap-2 mb-2 font-medium">
                                <i class="far fa-calendar-check text-blue-400"></i> Tạo ngày: {{ formatDate((cv as any).CreatedAt) }}
                            </p>
                            <p class="text-[13px] text-gray-600 line-clamp-2 leading-relaxed">
                                Hồ sơ được thiết kế chuyên biệt để ứng tuyển vị trí <span class="font-bold text-gray-700">{{ (cv as any).Title }}</span>.
                            </p>
                        </div>

                        <div class="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <button @click="editResume((cv as any).ResumeID)" class="text-[13px] text-blue-600 font-bold hover:text-blue-800 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50">
                                <i class="fas fa-pen"></i> Chỉnh sửa
                            </button>
                            <button @click="deleteResume((cv as any).ResumeID)" class="text-[13px] text-red-500 font-bold hover:text-red-700 transition-colors flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100">
                                <i class="fas fa-trash-alt"></i> Xóa bỏ
                            </button>
                        </div>
                    </div>
                </div>

                <div @click="goToCreateResume" 
                     class="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[250px] group text-center shadow-sm">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-4 border border-gray-100">
                        <i class="fas fa-plus text-2xl"></i>
                    </div>
                    <h3 class="font-bold text-gray-500 group-hover:text-blue-700 transition-colors px-4 text-sm leading-relaxed">
                        Tạo thêm hồ sơ CV mới
                    </h3>
                </div>
            </div>
        </div>

        <div>
            <h2 class="text-[17px] font-black text-[#14205c] mb-6 tracking-wide">
                Mẫu CV đã thích (0 Mẫu)
            </h2>
            <div class="bg-white rounded-2xl border border-gray-200 p-10 text-center flex flex-col items-center justify-center shadow-sm">
                <div class="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mb-3">
                    <i class="fas fa-heart text-2xl"></i>
                </div>
                <p class="text-gray-400 font-medium text-sm">Bạn chưa yêu thích mẫu CV nào.</p>
            </div>
        </div>
    </div>
</template>
