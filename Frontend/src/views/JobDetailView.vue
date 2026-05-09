<script setup lang="ts">
import SearchBar from '../components/SearchBar.vue';
import Chat from '../components/Chat.vue';
import ChatWindow from '../components/ChatWindow.vue';
import { ref, onMounted, watch } from 'vue';
import { MapPin, Calendar, CircleDollarSign, Send, Heart, ChevronRight, MessageCircle } from 'lucide-vue-next';
import { useRouter, useRoute } from 'vue-router';
import { useJobStore } from '../stores/job';
import { formatSalary, formatTextToList } from '../utils/format';
import Loading from '../components/Loading.vue';
import ApplyJob from '../components/ApplyJob.vue';
import Notify from '../components/Notify.vue';
import { useApplicationStore } from '../stores/jobApplication';
const useApplication = useApplicationStore();
const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);
const jobStore = useJobStore();
const job = ref(jobStore.jobDetail);
const router = useRouter();
const route = useRoute();
const activeChat = ref<boolean>(false);
const toggleChat = () => {
    activeChat.value = !activeChat.value;
};
const closeChatWindow = () => {
    activeChat.value = false;
};
const isSaved = ref<boolean>(false);
const isModalOpen = ref(false);

const openModal = () => {
    const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
            showNotify.value = true;
            isSuccessNotify.value = false;
          messageNotify.value = 'Vui lòng đăng nhập'; 
            setTimeout(() => {
                router.push('/login');
            }, 2000);
          return;
      }
  isModalOpen.value = true;
};
onMounted(async () => {
    const jobId = Number(route.params.id);
    await jobStore.fetchJobDetail(jobId);
    job.value = jobStore.jobDetail;
    isSaved.value = await jobStore.checkIsSavedJob(jobId);
    setTimeout(() => {
        const contentSection = document.getElementById('job-content');
        if (contentSection) {
            contentSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 500);
});
watch(() => route.params.id, async (newId) => {
    const jobId = Number(newId);
    await jobStore.fetchJobDetail(jobId);
    job.value = jobStore.jobDetail;
    isSaved.value = await jobStore.checkIsSavedJob(jobId);
    setTimeout(() => {
        const contentSection = document.getElementById('job-content');
        if (contentSection) {
            contentSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 500);
});
const toggleSave = async () => {
    if (!isSaved.value && job.value) {
        await jobStore.handleSavedJob(job.value?.JobID);
        isSaved.value = true;
    } else if (isSaved.value && job.value) {
        await jobStore.handleUnsaveJob(job.value?.JobID);
        isSaved.value = false;
    }
};
const handleApply = async (ResumeID: number) => {
    isModalOpen.value = true;
    if (!job.value) return;
    await useApplication.applyJobStore(job.value.JobID, ResumeID);
    if (useApplication.error) {
        showNotify.value = true;
        messageNotify.value = useApplication.message || 'Ứng tuyển thất bại!';
        isSuccessNotify.value = false;
    } else {
        showNotify.value = true;
        messageNotify.value = 'Ứng tuyển thành công!';
        isSuccessNotify.value = true;
    }
};
</script>

<template>
    <Loading v-if="jobStore.loading"/>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
    <ApplyJob
        v-if="isModalOpen"
        :is-open="isModalOpen"
        :job-title="job?.Title"
        :company-name="job?.CompanyName"
        @close="isModalOpen = false"
        @submit="handleApply"
    />

    <SearchBar />
    <div v-if="job" class="bg-[#f3f4f6] min-h-screen pb-12">
        <div class="max-w-5xl mx-auto px-4 pt-6">
            <div id="job-content"></div>
            <div class="flex items-center text-[13px] text-gray-500 mb-4 gap-1">
                <router-link to="/home" class="text-blue-600 hover:underline">
                    Trang chủ
                </router-link>
                <ChevronRight class="w-3.5 h-3.5" />
                <router-link to="/companies" class="hover:text-blue-600">
                    Công ty tuyển dụng
                </router-link>
                <ChevronRight class="w-3.5 h-3.5" />
                <span class="text-gray-700 font-medium truncate">
                    {{ job.CompanyName }}
                </span>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-4">
                <div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    
                    <div class="w-24 h-24 flex-shrink-0 rounded-full border border-gray-200 bg-[#e8e8e8] flex items-center justify-center overflow-hidden">
                        <img v-if="job.CompanyLogo" :src="job.CompanyLogo" class="w-full h-full object-contain" />
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <h1 class="text-2xl font-bold text-[#3b49df] mb-1.5 leading-tight">
                            {{ job.Title }}
                        </h1>
                        <p class="text-gray-600 text-sm mb-4">{{ job.CompanyName }}</p>
                        
                        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                            <div class="flex items-center gap-1.5 text-gray-500">
                                <Calendar class="w-4 h-4" />
                                <span>Hạn nộp hồ sơ: 30/03/2026 <span class="text-gray-400">(Còn 25 ngày)</span></span>
                            </div>
                            
                            <div class="flex items-center gap-1.5 text-[#d63384] font-medium">
                                <CircleDollarSign class="w-4 h-4" />
                                <span>{{ formatSalary(job.SalaryMin, job.SalaryMax) }}</span>
                            </div>
                            
                            <div class="flex items-center gap-1.5 text-gray-500">
                                <MapPin class="w-4 h-4" />
                                <span><strong class="font-medium text-gray-700">Trụ sở chính:</strong> {{ job.Location }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8">
                
                <div class="flex items-center gap-3 mb-8">
                    <div class="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h2 class="text-xl font-bold text-[#3b49df]">Chi tiết tin tuyển dụng</h2>
                </div>
                
                <div class="flex flex-col gap-3 mb-8">
                    <div class="flex items-start md:items-center gap-4 text-sm">
                        <span class="font-medium w-28 text-gray-800">Kinh nghiệm:</span>
                        <span class="bg-gray-100 px-3 py-1.5 rounded-full text-gray-700">{{ job.Tags[0] }}</span>
                    </div>
                    
                    <div class="flex items-start md:items-center gap-4 text-sm">
                        <span class="font-medium w-28 text-gray-800">Quyền lợi:</span>
                        <div class="flex flex-wrap gap-2">
                            <span v-for="benefit in job.Benefits" :key="benefit" class="bg-gray-100 px-3 py-1.5 rounded-full text-gray-700">
                                {{ benefit }}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex items-start md:items-center gap-4 text-sm">
                        <span class="font-medium w-28 text-gray-800">Chuyên môn:</span>
                        <div class="flex flex-wrap gap-2">
                            <span v-for="tag in job.Tags.slice(1)" :key="tag" class="bg-gray-100 px-3 py-1.5 rounded-full text-gray-700">
                                {{ tag }}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h3 class="text-lg font-bold text-[#3b49df] mb-3">Mô tả công việc</h3>
                    <ul class="list-disc pl-5 space-y-1.5 text-[14.5px] text-gray-800 leading-relaxed">
                        <li v-for="(line, idx) in formatTextToList(job.Description)" :key="idx">{{ line }}</li>
                    </ul>
                </div>
                
                <div class="mb-6">
                    <h3 class="text-lg font-bold text-[#3b49df] mb-3">Yêu cầu ứng viên</h3>
                    <ul class="list-disc pl-5 space-y-1.5 text-[14.5px] text-gray-800 leading-relaxed">
                        <li v-for="(line, idx) in formatTextToList(job.Requirements)" :key="idx">{{ line }}</li>
                    </ul>
                </div>
                
                <div class="mb-6">
                    <h3 class="text-lg font-bold text-[#3b49df] mb-3">Thời gian làm việc</h3>
                    <ul class="list-disc pl-5 space-y-1.5 text-[14.5px] text-gray-800 leading-relaxed">
                        <li v-for="(line, idx) in formatTextToList(job.WorkingSchedule)" :key="idx">{{ line }}</li>
                    </ul>
                </div>
                
                <div class="mb-10">
                    <h3 class="text-lg font-bold text-[#3b49df] mb-3">Cách thức ứng tuyển</h3>
                    <p class="text-[14.5px] text-gray-800 mb-2">Ứng viên nộp hồ sơ trực tuyến bằng cách bấm <strong>Ứng tuyển ngay</strong> dưới đây.</p>
                    <p class="text-[14.5px] text-gray-800">Hạn nộp hồ sơ: <strong>30/03/2026</strong></p>
                </div>
                
                <div class="flex flex-wrap items-center gap-4">
                    <button @click="openModal" class="flex items-center gap-2 bg-[#5161e2] hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-md shadow-sm transition-all">
                        <Send class="w-4 h-4" />
                        <span>Ứng tuyển ngay</span>
                    </button>
                    
                    <button class="flex items-center gap-2 bg-white border border-[#5161e2] text-[#5161e2] hover:bg-blue-50 font-medium py-2.5 px-6 rounded-md transition-all" @click="toggleChat">
                        <MessageCircle class="w-4 h-4" />
                        <span>Chat ngay</span>
                    </button>
                    <button
                        @click="toggleSave()"
                        :class="[
                            'flex items-center gap-2 border font-medium py-2.5 px-6 rounded-md transition-all',
                            isSaved
                            ? 'bg-red-50 border-red-500 text-red-500 hover:bg-red-100'
                            : 'bg-white border-[#5161e2] text-[#5161e2] hover:bg-blue-50'
                        ]"
                        >
                        <Heart
                            class="w-4 h-4"
                            :class="isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'"
                        />
                        
                        <span>
                            {{ isSaved ? 'Đã lưu' : 'Lưu tin' }}
                        </span>
                        </button>
                </div>
                
            </div>
        </div>
    </div>
    <Chat />
    <ChatWindow 
        v-if="activeChat && job"
        :targetUserId="job.EmployerID"
        :targetName="job.CompanyName"
        :targetAvatar="job?.CompanyLogo"
        @close="closeChatWindow"
    />
</template>