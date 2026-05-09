<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCompanyStore } from '../../stores/company';
import type { ICompanyDetail } from '../../types/company';

const companyStore = useCompanyStore();
const props = defineProps<{
    companyId: number | null;
    isOpen: boolean;
}>();

const emit = defineEmits(['close']);

const loading = ref(false);
const companyDetail = ref<ICompanyDetail | null>(null);

watch(() => props.companyId, async (newId) => {
    if (newId && props.isOpen) {
        loading.value = true;
        companyDetail.value = null;
        try {
            await companyStore.getCompanyDetailForAdminStore(newId);
            companyDetail.value = companyStore.companyDetailForAdmin;
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết công ty', error);
        } finally {
            loading.value = false;
        }
    }
});

const close = () => {
    emit('close');
};
</script>

<template>
    <transition name="fade">
        <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden transform transition-all scale-up">
                
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 class="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                        <i class="fas fa-building text-[#4c5bd4]"></i>
                        Chi tiết Hồ sơ Doanh nghiệp
                    </h3>
                    <button @click="close" class="text-slate-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div v-if="loading" class="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <i class="fas fa-spinner fa-spin text-4xl text-[#4c5bd4] mb-3"></i>
                    <p class="text-sm font-medium">Đang tải dữ liệu công ty...</p>
                </div>

                <div v-else-if="companyDetail" class="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    <div class="w-full md:w-1/2 p-6 overflow-y-auto custom-scrollbar border-r border-slate-100">
                        <div class="flex items-start gap-4 mb-6">
                            <div class="w-20 h-20 rounded-xl border border-slate-200 shadow-sm shrink-0 overflow-hidden bg-white p-1">
                                <img :src="companyDetail.LogoUrl" class="w-full h-full object-contain rounded-lg" />
                            </div>
                            <div>
                                <h4 class="font-extrabold text-slate-800 text-[17px] leading-tight">{{ companyDetail.CompanyName }}</h4>
                                <div class="mt-1.5 flex flex-wrap gap-2">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border" :class="companyDetail.Status ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'">
                                        {{ companyDetail.Status ? 'Đang hoạt động' : 'Đã khóa' }}
                                    </span>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                                        ID: {{ companyDetail.CompanyID }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-5">
                            <div>
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Mã số thuế</p>
                                <p class="font-mono text-[14px] text-slate-800 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{{ companyDetail.TaxCode }}</p>
                            </div>

                            <div>
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Giới thiệu</p>
                                <p class="text-[13px] text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                    {{ companyDetail.CompanyDescription || 'Chưa có thông tin giới thiệu.' }}
                                </p>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Lĩnh vực</p>
                                    <p class="text-[13px] font-medium text-slate-700"><i class="fas fa-briefcase text-[#4c5bd4] mr-1.5 w-4 text-center"></i>{{ companyDetail.Industry }}</p>
                                </div>
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Thành phố</p>
                                    <p class="text-[13px] font-medium text-slate-700"><i class="fas fa-map-marker-alt text-[#4c5bd4] mr-1.5 w-4 text-center"></i>{{ companyDetail.City || '—' }}</p>
                                </div>
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Email liên hệ</p>
                                    <p class="text-[13px] font-medium text-slate-700"><i class="fas fa-envelope text-[#4c5bd4] mr-1.5 w-4 text-center"></i>{{ companyDetail.ContactEmail || '—' }}</p>
                                </div>
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Website</p>
                                    <p class="text-[13px] font-medium text-[#4c5bd4] truncate">
                                        <i class="fas fa-globe mr-1.5 w-4 text-center"></i>
                                        <a v-if="companyDetail.Website" :href="companyDetail.Website" target="_blank" class="hover:underline">{{ companyDetail.Website }}</a>
                                        <span v-else class="text-slate-700">—</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="w-full md:w-1/2 bg-slate-900 flex flex-col relative overflow-hidden">
                        <div class="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-slate-900/80 to-transparent z-10 flex justify-between items-center">
                            <span class="text-white/80 text-[12px] font-bold tracking-widest uppercase"><i class="fas fa-file-contract mr-2"></i>Giấy phép kinh doanh</span>
                            <a :href="companyDetail.BusinessLicenseUrl" target="_blank" class="text-white hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors text-xs backdrop-blur-sm" title="Mở ảnh tab mới">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                        
                        <div class="flex-1 p-4 flex items-center justify-center overflow-auto custom-scrollbar">
                            <img 
                                v-if="companyDetail.BusinessLicenseUrl"
                                :src="companyDetail.BusinessLicenseUrl" 
                                class="max-w-full max-h-full object-contain rounded shadow-lg shadow-black/50"
                                alt="Giấy phép kinh doanh"
                            />
                            <div v-else class="text-white/40 flex flex-col items-center">
                                <i class="fas fa-image-slash text-4xl mb-2"></i>
                                <p class="text-sm">Không có ảnh tài liệu</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </transition>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes scaleUp {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>