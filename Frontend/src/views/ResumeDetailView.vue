

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResumeStore } from '../stores/resume';
import Loading from '../components/Loading.vue';

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
<style>

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