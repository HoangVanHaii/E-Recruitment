<script setup lang="ts">
import Notify from '../../components/Notify.vue';
import SidebarEmployer from '../../components/Employer/SidebarEmployer.vue';
import Loading from '../../components/Loading.vue';
import { useJobStore } from '../../stores/job';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { IInterviewRound } from '../../types/job';

const showNotify = ref<Boolean>(false);
const messageNotify = ref<string>('');
const isSuccessNotify = ref(true);
const useJob = useJobStore();
const categories = ref<{ CategoryID: number; CategoryName: string }[]>([]);
const isOpen = ref<Boolean>(false);
const salaryError = ref('');

const jobForm = ref({
    CategoryID: null as number | null,
    Title: '',
    Quantity: 1,
    SalaryMin: null as number | null,
    SalaryMax: null as number | null,
    Location: '',
    JobType: 'Full-time',
    ExperienceRequired: 0,
    ExpiredDate: '',
    Description: '',
    Requirements: '',
    WorkingSchedule: '',
    Benefits: [''],
    Tags: [''],
    InterviewProcess: [
        { roundOrder: 1, roundTitle: 'Phỏng vấn Nhân sự', details: 'Trao đổi về văn hóa công ty và định hướng.' }
    ] as IInterviewRound[]
});

const selectedCategoryName = computed(() => {
    if (!jobForm.value.CategoryID) return null;
    const selected = categories.value.find(c => c.CategoryID === jobForm.value.CategoryID);
    return selected ? selected.CategoryName : null;
});

const dropdownRef = ref<HTMLDivElement | null>(null);

const selectCategory = (id: number) => {
    jobForm.value.CategoryID = id;
    isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isOpen.value = false;
    }
};

watch(
    [() => jobForm.value.SalaryMin, () => jobForm.value.SalaryMax],
    ([newMin, newMax]) => {
        const min = newMin ? Number(newMin) : 0;
        const max = newMax ? Number(newMax) : 0;

        if (min > 0 && max > 0 && max <= min) {
            salaryError.value = 'Lương tối đa phải lớn hơn lương tối thiểu!';
        } else {
            salaryError.value = '';
        }
    }
);

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

onMounted(async () => {
    document.addEventListener('click', handleClickOutside);
    await useJob.fetchCategories();
    if (useJob.error) {
        showNotify.value = true;
        messageNotify.value = useJob.message || 'Không thể tải danh mục!';
        isSuccessNotify.value = false;
    } else {
        categories.value = useJob.listCategoryJobs;
    }
});

const addBenefit = () => jobForm.value.Benefits.push('');
const removeBenefit = (index: number) => jobForm.value.Benefits.splice(index, 1);
const addTag = () => jobForm.value.Tags.push('');
const removeTag = (index: number) => jobForm.value.Tags.splice(index, 1);
const addRound = () => {
    jobForm.value.InterviewProcess.push({ 
        roundOrder: jobForm.value.InterviewProcess.length + 1, 
        roundTitle: '', 
        details: '' 
    });
};
const removeRound = (index: number) => jobForm.value.InterviewProcess.splice(index, 1);

const handleSubmit = async () => {
    if (salaryError.value) {
        showNotify.value = true;
        messageNotify.value = 'Vui lòng sửa lỗi mức lương trước khi đăng tin!';
        isSuccessNotify.value = false;
        return;
    }

    const cleanedBenefits = jobForm.value.Benefits.filter(b => b.trim() !== '');
    const cleanedTags = jobForm.value.Tags.filter(t => t.trim() !== '');
    const cleanedProcess = jobForm.value.InterviewProcess
        .filter(p => p.roundTitle.trim() !== '')
        .map((p, index) => ({
            roundOrder: index + 1,
            roundTitle: p.roundTitle,
            details: p.details
        }));

    const rawText = `${jobForm.value.Title} - ${jobForm.value.Description} - ${jobForm.value.Requirements}`;
    const finalSubmitData = {
        employerId: 1,
        categoryId: Number(jobForm.value.CategoryID),
        title: jobForm.value.Title,
        quantity: Number(jobForm.value.Quantity),
        salaryMin: jobForm.value.SalaryMin ? Number(jobForm.value.SalaryMin) : 0,
        salaryMax: jobForm.value.SalaryMax ? Number(jobForm.value.SalaryMax) : 0,
        location: jobForm.value.Location,
        jobType: jobForm.value.JobType,
        experienceRequired: Number(jobForm.value.ExperienceRequired),
        expiredDate: new Date(jobForm.value.ExpiredDate).toISOString(), 
        description: jobForm.value.Description,
        requirements: jobForm.value.Requirements,
        workingSchedule: jobForm.value.WorkingSchedule,
        benefits: cleanedBenefits,
        tags: cleanedTags,
        interviewProcess: cleanedProcess,
        rawTextForAi: rawText
    };

    await useJob.createJobStore(finalSubmitData);
    if (useJob.error) {
        showNotify.value = true;
        messageNotify.value = useJob.message || 'Đăng tin thất bại! Vui lòng kiểm tra lại thông tin.';
        isSuccessNotify.value = false;
    } else {
        showNotify.value = true;
        messageNotify.value = useJob.message || 'Đăng tin thành công!';
        isSuccessNotify.value = true;
    }
};

</script>

<template>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
    <Loading v-if="useJob.loading" />
    
    <div class="flex flex-col lg:flex-row h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
        <SidebarEmployer />

        <div class="flex-1 h-full overflow-y-auto custom-scrollbar relative flex flex-col">
            <div class="p-4 sm:p-8 w-full max-w-6xl mx-auto">
                <div class="mb-6 flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Đăng tin tuyển dụng mới</h1>
                        <p class="text-slate-500 text-sm mt-1">Điền chi tiết thông tin công việc để thu hút ứng viên tốt nhất.</p>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <form @submit.prevent="handleSubmit" class="divide-y divide-slate-100">
                        
                        <div class="p-6 sm:p-8 space-y-6">
                            <h3 class="text-lg font-bold text-blue-700 flex items-center gap-2">
                                <i class="fas fa-info-circle"></i> Thông tin cơ bản
                            </h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề công việc <span class="text-red-500">*</span></label>
                                    <input v-model="jobForm.Title" type="text" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" placeholder="VD: Senior Frontend Developer (VueJS)">
                                </div>

                                <div class="relative" ref="dropdownRef">
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Danh mục (Ngành nghề) *</label>
                                    <div @click="isOpen = !isOpen" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer flex justify-between items-center transition-all text-sm group" :class="{'bg-white ring-2 ring-blue-500/20 border-blue-500': isOpen}">
                                        <span :class="{'text-slate-400': !jobForm.CategoryID, 'text-slate-900': jobForm.CategoryID}">{{ selectedCategoryName || 'Chọn danh mục' }}</span>
                                        <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{'rotate-180': isOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                    <transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
                                        <div v-if="isOpen" class="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1 custom-scrollbar">
                                            <div v-for="cat in categories" :key="cat.CategoryID" @click="selectCategory(cat.CategoryID)" class="px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between" :class="jobForm.CategoryID === cat.CategoryID ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'">
                                                {{ cat.CategoryName }}
                                                <svg v-if="jobForm.CategoryID === cat.CategoryID" class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                        </div>
                                    </transition>
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Địa điểm làm việc *</label>
                                    <input v-model="jobForm.Location" type="text" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" placeholder="VD: Quận 1, TP.HCM">
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Hình thức làm việc *</label>
                                    <select v-model="jobForm.JobType" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm appearance-none">
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Freelance">Freelance</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Hạn nộp hồ sơ *</label>
                                    <input v-model="jobForm.ExpiredDate" type="date" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-slate-700">
                                </div>
                            </div>
                        </div>

                        <div class="p-6 sm:p-8 space-y-6">
                            <h3 class="text-lg font-bold text-blue-700 flex items-center gap-2">
                                <i class="fas fa-hand-holding-usd"></i> Yêu cầu chung & Mức lương
                            </h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Số lượng tuyển *</label>
                                    <input v-model="jobForm.Quantity" type="number" min="1" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" placeholder="VD: 5">
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Kinh nghiệm (Năm)</label>
                                    <input v-model="jobForm.ExperienceRequired" type="number" min="0" step="1" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" placeholder="VD: 1">
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Lương Tối Thiểu (VNĐ)</label>
                                    <input v-model="jobForm.SalaryMin" type="number" min="0" 
                                        class="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm"
                                        :class="salaryError ? 'border-red-500 text-red-600 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'"
                                        placeholder="VD: 10000000">
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Lương Tối Đa (VNĐ)</label>
                                    <input v-model="jobForm.SalaryMax" type="number" min="0" 
                                        class="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm"
                                        :class="salaryError ? 'border-red-500 text-red-600 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'"
                                        placeholder="VD: 25000000">
                                    <p v-if="salaryError" class="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                        <i class="fas fa-exclamation-circle"></i> {{ salaryError }}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Lịch trình làm việc</label>
                                <input v-model="jobForm.WorkingSchedule" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" placeholder="VD: Thứ 2 - Thứ 6 (08:30 - 18:00)">
                            </div>
                        </div>

                        <div class="p-6 sm:p-8 space-y-6">
                            <h3 class="text-lg font-bold text-blue-700 flex items-center gap-2">
                                <i class="fas fa-file-alt"></i> Chi tiết công việc
                            </h3>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Mô tả công việc *</label>
                                <textarea v-model="jobForm.Description" rows="4" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm resize-none" placeholder="- Mô tả các nhiệm vụ chính..."></textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Yêu cầu ứng viên *</label>
                                <textarea v-model="jobForm.Requirements" rows="4" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm resize-none" placeholder="- Tốt nghiệp chuyên ngành..."></textarea>
                            </div>
                        </div>

                        <div class="p-6 sm:p-8 space-y-8">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <div class="flex justify-between items-center mb-3">
                                        <label class="block text-sm font-semibold text-slate-700">Quyền lợi / Phúc lợi</label>
                                        <button type="button" @click="addBenefit" class="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"><i class="fas fa-plus"></i> Thêm</button>
                                    </div>
                                    <div class="space-y-3">
                                        <div v-for="(_, index) in jobForm.Benefits" :key="'ben-'+index" class="flex gap-2">
                                            <input v-model="jobForm.Benefits[index]" type="text" class="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-500" placeholder="VD: Thưởng tháng 13...">
                                            <button v-if="jobForm.Benefits.length > 1" type="button" @click="removeBenefit(index)" class="px-3 text-slate-400 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between items-center mb-3">
                                        <label class="block text-sm font-semibold text-slate-700">Tags (Phục vụ AI / Tìm kiếm)</label>
                                        <button type="button" @click="addTag" class="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"><i class="fas fa-plus"></i> Thêm Tag</button>
                                    </div>
                                    <div class="flex flex-wrap gap-2">
                                        <div v-for="(_, index) in jobForm.Tags" :key="'tag-'+index" class="flex items-center bg-slate-100 border border-slate-200 rounded-full pl-3 pr-1 py-1">
                                            <input v-model="jobForm.Tags[index]" type="text" class="bg-transparent border-none outline-none text-sm w-24 text-slate-700" placeholder="Tag...">
                                            <button type="button" @click="removeTag(index)" class="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500"><i class="fas fa-times text-xs"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="p-6 sm:p-8 space-y-4">
                            <div class="flex justify-between items-center mb-2">
                                <h3 class="text-lg font-bold text-blue-700 flex items-center gap-2"><i class="fas fa-comments"></i> Quy trình phỏng vấn</h3>
                                <button type="button" @click="addRound" class="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"><i class="fas fa-plus-circle"></i> Thêm vòng</button>
                            </div>
                            <div class="space-y-4">
                                <div v-for="(round, index) in jobForm.InterviewProcess" :key="'round-'+index" class="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-4 items-start relative group">
                                    <div class="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">{{ index + 1 }}</div>
                                    <div class="flex-1 space-y-3">
                                        <input v-model="round.roundTitle" type="text" class="w-full bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none pb-1 font-semibold text-slate-800" placeholder="Tên vòng (VD: Phỏng vấn kỹ thuật)">
                                        <textarea v-model="round.details" rows="2" class="w-full bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none pb-1 text-sm text-slate-600 resize-none" placeholder="Mô tả chi tiết vòng này..."></textarea>
                                    </div>
                                    <button type="button" @click="removeRound(index)" class="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </div>
                        </div>

                        <div class="p-6 sm:p-8 bg-slate-50 flex items-center justify-between">
                            <p class="text-sm text-slate-500 hidden sm:block"><i class="fas fa-shield-alt mr-1"></i> Tin đăng sẽ được duyệt trước khi hiển thị.</p>
                            <button type="submit" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200 flex justify-center items-center gap-2">
                                <i class="fas fa-paper-plane"></i> Xuất bản ngay
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
input[type="date"]::-webkit-inner-spin-button,
input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
</style>