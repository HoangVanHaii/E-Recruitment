<!-- <template>
    <div class="min-h-screen bg-gray-200 py-10 px-4 font-sans print:bg-white print:py-0">
        
        <Loading v-if="resumeStore.loading" />

        <div class="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
            <button @click="router.back()" class="bg-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all font-bold text-gray-600 flex items-center gap-2">
                <i class="fas fa-arrow-left"></i> Quay lại
            </button>
            <button @click="exportToPDF" class="bg-gradient-to-r from-[#14205c] to-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold flex items-center gap-2">
                <i class="fas fa-file-pdf"></i> Xuất File PDF
            </button>
        </div>

        <div v-if="resume" id="cv-document" class="max-w-[210mm] mx-auto bg-white shadow-2xl flex flex-col md:flex-row print:flex-row overflow-hidden print:shadow-none print:m-0">
            
            <div class="w-full md:w-[35%] print:w-[35%] bg-[#14205c] text-white p-8 md:p-10 flex flex-col gap-10 print:bg-[#14205c]">
                
                <div class="flex flex-col items-center text-center">
                    <img :src="(resume.AvatarUrl as string) || (authStore.user?.ImgUrl as string) || 'https://via.placeholder.com/150'" 
                         class="w-40 h-40 rounded-full object-cover border-4 border-white/20 shadow-xl mb-6 bg-white">
                    
                    <h1 class="text-2xl font-black uppercase tracking-widest mb-2 leading-tight">
                        {{ authStore.user?.Name || 'Nguyễn Hải Đăng' }}
                    </h1>
                    <h2 class="text-blue-300 font-bold text-[15px] tracking-wider">{{ resume.title || 'Lập trình viên' }}</h2>
                </div>

                <div>
                    <h3 class="text-lg font-bold border-b border-white/20 pb-2 mb-4 uppercase tracking-widest">Liên hệ</h3>
                    <div class="space-y-4 text-[13.5px] font-medium text-blue-100">
                        <div v-if="authStore.user?.Email" class="flex items-start gap-3">
                            <i class="fas fa-envelope mt-1 w-4 text-center"></i>
                            <span class="break-all">{{ authStore.user?.Email }}</span>
                        </div>
                        <div v-if="(authStore.user as any)?.Phone" class="flex items-start gap-3">
                            <i class="fas fa-phone mt-1 w-4 text-center"></i>
                            <span>{{ (authStore.user as any)?.Phone }}</span>
                        </div>
                        <div v-if="(authStore.user as any)?.Address" class="flex items-start gap-3">
                            <i class="fas fa-map-marker-alt mt-1 w-4 text-center"></i>
                            <span class="leading-relaxed">{{ (authStore.user as any)?.Address }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="resume.skills?.length">
                    <h3 class="text-lg font-bold border-b border-white/20 pb-2 mb-4 uppercase tracking-widest">Kỹ năng</h3>
                    <div class="flex flex-col gap-3">
                        <div v-for="(skill, index) in resume.skills" :key="'sk'+index">
                            <div class="flex justify-between items-end mb-1">
                                <span class="text-[14px] font-bold text-white">{{ (skill as any).skillName || skill }}</span>
                                <span v-if="(skill as any).level" class="text-[11px] text-blue-300 uppercase tracking-wider">{{ (skill as any).level }}</span>
                            </div>
                            <div class="w-full bg-white/10 rounded-full h-1.5">
                                <div class="bg-blue-400 h-1.5 rounded-full" style="width: 85%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="w-full md:w-[65%] print:w-[65%] p-8 md:p-12 flex flex-col gap-10 bg-white">
                
                <div v-if="resume.summary" class="print-avoid-break">
                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-4 flex items-center gap-3">
                        <i class="fas fa-user-tie text-xl text-blue-500"></i> Mục tiêu
                    </h3>
                    <p class="text-gray-600 leading-relaxed text-[15px] text-justify">{{ resume.summary }}</p>
                </div>

                <div v-if="resume.experience?.length" class="print-avoid-break">
                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-6 flex items-center gap-3">
                        <i class="fas fa-briefcase text-xl text-blue-500"></i> Kinh nghiệm
                    </h3>
                    <div class="space-y-6">
                        <div v-for="(exp, index) in resume.experience" :key="'exp'+index" class="relative">
                            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                                <h4 class="font-bold text-gray-800 text-[16px]">{{ (exp as any).position }}</h4>
                                <span class="text-blue-600 font-bold text-[13px] bg-blue-50 px-3 py-1 rounded-md shrink-0 mt-1 sm:mt-0">
                                    {{ formatDate((exp as any).startDate) }} - {{ formatDate((exp as any).endDate) || 'Hiện tại' }}
                                </span>
                            </div>
                            <h5 class="text-[14px] font-bold text-gray-500 mb-3">{{ (exp as any).companyName }}</h5>
                            <p class="text-gray-600 text-[14px] leading-relaxed whitespace-pre-line text-justify">{{ (exp as any).description }}</p>
                        </div>
                    </div>
                </div>

                <div v-if="resume.projects?.length" class="print-avoid-break">
                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-6 flex items-center gap-3">
                        <i class="fas fa-project-diagram text-xl text-blue-500"></i> Dự án nổi bật
                    </h3>
                    <div class="space-y-6">
                        <div v-for="(prj, index) in resume.projects" :key="'prj'+index">
                            <h4 class="font-bold text-gray-800 text-[16px] mb-1">{{ (prj as any).projectName }}</h4>
                            <p class="text-[14px] font-medium text-gray-500 mb-2">Vai trò: <span class="text-gray-800">{{ (prj as any).role }}</span></p>
                            
                            <p class="text-gray-600 text-[14px] leading-relaxed text-justify mb-2">{{ (prj as any).description }}</p>
                            
                            <p v-if="(prj as any).technologies" class="text-[13px] text-blue-600 font-bold bg-blue-50/50 p-2 rounded-lg inline-block">
                                Công nghệ: {{ Array.isArray((prj as any).technologies) ? (prj as any).technologies.join(', ') : (prj as any).technologies }}
                            </p>
                        </div>
                    </div>
                </div>

                <div v-if="resume.education?.length" class="print-avoid-break">
                    <h3 class="text-2xl font-black text-[#14205c] uppercase mb-6 flex items-center gap-3">
                        <i class="fas fa-graduation-cap text-xl text-blue-500"></i> Học vấn
                    </h3>
                    <div class="space-y-5">
                        <div v-for="(edu, index) in resume.education" :key="'edu'+index">
                            <h4 class="font-bold text-gray-800 text-[16px] mb-1">{{ (edu as any).institution }}</h4>
                            <p class="text-[14px] text-gray-600">
                                <span class="font-bold">{{ (edu as any).degree }}</span> - {{ (edu as any).major }}
                            </p>
                            <p v-if="(edu as any).gpa" class="text-[13px] text-gray-500 mt-1 font-medium">GPA / Xếp loại: {{ (edu as any).gpa }}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div v-else class="text-center py-20">
            <p class="text-gray-500 font-bold">Không tìm thấy dữ liệu CV.</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResumeStore } from '../stores/resume';
import { useAuthStore } from '../stores/auth';
import Loading from '../components/Loading.vue';

const route = useRoute();
const router = useRouter();
const resumeStore = useResumeStore();
const authStore = useAuthStore();

const resume = computed(() => resumeStore.currentResume);

onMounted(async () => {
    const resumeId = Number(route.params.id);
    if (resumeId) {
        await resumeStore.fetchResumeDetailStore(resumeId);
    }
});

const formatDate = (dateStr: any) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return ''; 
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
};

const exportToPDF = () => {
    window.print();
};
</script>

<style>
/* TRICKS CHO IN PDF XỊN XÒ - KHÔNG ĐƯỢC THÊM 'scoped' VÀO ĐÂY */
@media print {
    /* 1. Ẩn TOÀN BỘ mọi thứ trên website (Cả Header của MainLayout) */
    body * { 
        visibility: hidden; 
    }
    
    /* 2. CHỈ CHO PHÉP phần tử có id="cv-document" và con của nó hiện lên */
    #cv-document, #cv-document * { 
        visibility: visible; 
    }
    
    /* 3. Kéo tờ giấy A4 lên sát mép trên cùng bên trái */
    #cv-document {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none !important;
    }

    /* 4. Giữ nguyên màu nền (cột xanh bên trái) không bị tẩy trắng */
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    /* 5. Ép khổ giấy A4 và xóa lề râu ria của trình duyệt */
    @page {
        size: A4 portrait;
        margin: 0 !important;
    }

    body { 
        background-color: white !important; 
    }

    /* 6. Chống cắt đôi dòng chữ khi sang trang mới */
    .print-avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
    }
}
</style> -->

<template>
    <div class="min-h-screen bg-gray-200 py-10 px-4 font-sans print:bg-white print:py-0">
        
        <Loading v-if="resumeStore.loading" />

        <div class="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
            <button @click="router.back()" class="bg-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all font-bold text-gray-600 flex items-center gap-2">
                <i class="fas fa-arrow-left"></i> Quay lại
            </button>
            <button @click="exportToPDF" class="bg-gradient-to-r from-[#14205c] to-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold flex items-center gap-2">
                <i class="fas fa-file-pdf"></i> Xuất File PDF
            </button>
        </div>

        <div v-if="resume">
            <Template1 v-if="resume.templateId === 1 || !resume.templateId" :resume="resume" />
            <Template2 v-else-if="resume.templateId === 2" :resume="resume" />
             <Template3 v-else-if="resume.templateId === 3" :resume="resume" />
            </div>

        <div v-else class="text-center py-20">
            <p class="text-gray-500 font-bold">Không tìm thấy dữ liệu CV.</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResumeStore } from '../stores/resume';
import Loading from '../components/Loading.vue';

// Import các Mẫu CV
import Template1 from '../components/cv-templates/Template1.vue';
import Template2 from '../components/cv-templates/Template2.vue';
import Template3 from '../components/cv-templates/Template3.vue';

const route = useRoute();
const router = useRouter();
const resumeStore = useResumeStore();

const resume = computed(() => resumeStore.currentResume);

onMounted(async () => {
    const resumeId = Number(route.params.id);
    if (resumeId) {
        await resumeStore.fetchResumeDetailStore(resumeId);
    }
});

const exportToPDF = () => {
    window.print();
};
</script>

<style>
/* GIỮ NGUYÊN CSS PRINT THẦN THÁNH Ở ĐÂY (Vì nó tác dụng lên toàn bộ hệ thống in) */
@media print {
    body * { visibility: hidden; }
    #cv-document, #cv-document * { visibility: visible; }
    #cv-document {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none !important;
    }
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    @page {
        size: A4 portrait;
        margin: 0 !important;
    }
    body { background-color: white !important; }
    .print-avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
    }
}
</style>