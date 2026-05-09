<script setup lang="ts">
import logo from '../assets/logoWebsite.png';
import { ref } from 'vue';

const openMenu = ref<number | null>(null);
const toggleMenu = (index: number) => {
    openMenu.value = openMenu.value === index ? null : index;
}
const menuItems = [
    {
        title: 'Về TimviecFinder',
        links: ['Giới thiệu', 'Thông tin hỏi đáp', 'Quy chế hoạt động', 'Bảo mật', 'Thỏa thuận']
    },
    {
        title: 'Dành cho ứng viên',
        links: ['Mẫu CV xin việc', 'Hồ sơ xin việc', 'Bí quyết xin việc']
    },
    {
        title: 'Dành cho nhà tuyển dụng',
        links: ['Đăng tuyển dụng', 'Cẩm nang tuyển dụng', 'Biểu mẫu']
    },
    {
        title: 'Tiện ích',
        links: ['Tra cứu lương', 'Email Finder', 'Tải app']
    }
    
];
const companyInfo = [
    'Nơi cấp: Sở Kế hoạch và Đầu tư tỉnh Hưng Yên',
    'Địa chỉ: Thị Trung - Như Quỳnh - Hưng Yên',
    'Hotline: 0979.524.615',
    'Email: timviecfinder.vn@gmail.com'
];

</script>

<template>
    <footer class="w-full bg-[#121a8a] text-white py-12 px-6 md:px-10 lg:px-20 font-sans">
        
        <div class="w-full max-w-[1400px] mx-auto">
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10" >
                <div 
                    v-for="(item, index) in menuItems"
                    :key="index"
                    class="border-b border-white/10 md:border-none pb-4 md:pb-0 w-full md:w-auto md:justify-self-center"      
                >
                    <h3
                        @click="toggleMenu(index)"
                        class="flex items-center justify-between cursor-pointer text-[16px] font-semibold mb-0 md:mb-5"
                    >
                        {{ item.title }}    
                        <svg class="w-5 h-5 md:hidden transition-transform duration-300" :class="{'rotate-180': openMenu === index}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </h3>
                    
                    <div 
                        :class="{'hidden md:block': openMenu !== index, 'block mt-4': openMenu === index}"
                        class="space-y-3 text-[14px] text-gray-200"
                    >
                        <p v-for="(link, i) in item.links" :key="i" class="hover:text-white cursor-pointer transition-colors duration-200">
                            {{ link }}
                        </p>
                    </div>
                </div>
            </div>
  
            <hr class="border-gray-300 opacity-40 mb-2" />
  
            <div class="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12">
                <div class="flex-shrink-0">
                    <img :src="logo" alt="Logo" class="h-14 w-auto object-contain" />
                </div>
  
                <div class="text-[14px] leading-relaxed text-gray-100">
                    <h4 class="font-bold text-[15px] mb-1">Công ty TNHH MTV JOBFinder</h4>
                    <ul class="space-y-1">
                        <li v-for="(info, index) in companyInfo" :key="index">
                            {{ info }}
                        </li>
                    </ul>
                </div>
            </div>
  
        </div>
    </footer>
  </template>