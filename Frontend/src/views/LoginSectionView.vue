<script setup lang="ts">
import { useRouter } from 'vue-router';
import bg_section from '../assets/bg-section.jpg'
import candidate_illus_url from '../assets/section-left.jpg'
import recruiter_illus_url from '../assets/section-rìght.jpg'

const router = useRouter();

const selectionCards = [
    {
        id: 'candidate',
        title: 'Đăng nhập ứng viên',
        image: candidate_illus_url, 
        benefits: [
            { text: '100.000+', highlight: true, label: 'Công việc mơ ước' },
            { text: '305+', highlight: true, label: 'Mẫu CV chuyên nghiệp' },
            { text: '22+', highlight: true, label: 'Bộ đề câu hỏi tuyển dụng' }
        ],
        buttonClass: 'bg-[#001489] hover:bg-blue-800',
        dotColor: 'bg-blue-900',
        role: 'Candidate'
    },
    {
        id: 'recruiter',
        title: 'Đăng nhập trang quản trị',
        image: recruiter_illus_url, 
        benefits: [
            { text: '', highlight: false, label: 'Đăng tin tuyển dụng miễn phí' },
            { text: '', highlight: false, label: 'Hồ sơ ứng viên chất lượng' },
            { text: '', highlight: false, label: 'Biểu mẫu nhân sự chuyên nghiệp' }
        ],
        buttonClass: 'bg-[#e8b420] hover:bg-yellow-600',
        dotColor: 'bg-yellow-500',
        role: 'Employer'
    }
];

const handleNavigate = (role: string) => {
    router.push({
        path: '/login',
        query: { role: role }
    });
};
</script>

<template>
    <main 
        class="relative bg-cover bg-center flex-1 min-h-[calc(100vh-70px)] flex items-center justify-center py-20" 
        :style="{ backgroundImage: `url(${bg_section})` }"
    >
        <div class="absolute inset-0 bg-black/10"></div>

        <div class="container mx-auto px-4 relative z-10">
            <h2 class="text-white text-xl md:text-3xl font-bold text-center mb-10 uppercase tracking-wide drop-shadow-md">
                Đăng nhập tài khoản để tìm việc, tuyển dụng nhanh
            </h2>

            <div class="flex flex-col md:flex-row justify-center gap-6 max-w-4xl mx-auto">
                <div 
                    v-for="card in selectionCards" 
                    :key="card.id"
                    class="bg-white rounded-xl shadow-xl overflow-hidden flex-1 flex flex-col transform hover:-translate-y-[5px] transition-all duration-300 group"
                >
                    <div class="relative w-full h-48 md:h-52 overflow-hidden">
                        <img :src="card.image" :alt="card.title" class="absolute inset-0 w-full h-full object-cover" />
                    </div>

                    <div class="p-6 md:p-8 flex-grow flex flex-col justify-between">
                        <ul class="space-y-3 text-left mb-6">
                            <li 
                                v-for="(benefit, index) in card.benefits" 
                                :key="index" 
                                class="flex items-center text-gray-600 text-sm md:text-base"
                            >
                                <span class="w-2 h-2 rounded-full mr-3 shrink-0" :class="card.dotColor"></span>
                                <span v-if="benefit.highlight" class="font-bold mr-1">{{ benefit.text }}</span>
                                <span>{{ benefit.label }}</span>
                            </li>
                        </ul>

                        <button 
                            @click="handleNavigate(card.role)"
                            :class="[
                                'w-full text-white font-bold py-3.5 rounded-lg text-sm md:text-base uppercase shadow transition-all active:scale-95',
                                card.buttonClass
                            ]"
                        >
                            {{ card.title }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>