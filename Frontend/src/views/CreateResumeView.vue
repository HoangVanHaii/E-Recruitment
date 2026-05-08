<script setup lang="ts">
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';
import { useResumeStore } from '../stores/resume';
import { onMounted, ref } from 'vue';
import type { iResumeDetail, FormState } from '../types/resume';
import type { ICandidate } from '../types/candidate';

const showNotify = ref(false);
const messageNotify = ref('');
const useResume = useResumeStore();
const isSuccessNotify = ref(true);

const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);
        
const showToast = (message: string, isSuccess: boolean) => {
    messageNotify.value = message;
    isSuccessNotify.value = isSuccess;
    showNotify.value = true;
    
    setTimeout(() => {
        showNotify.value = false;
    }, 3000);
};

const onAvatarChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const file = target.files[0];
        avatarFile.value = file;
        avatarPreview.value = URL.createObjectURL(file);
    }
};

type ArraySection = 'skills' | 'experience' | 'education' | 'projects';

const candidateForm = ref<ICandidate>({
    CandidateID: 0,
    FullName: '',
    Phone: '',
    DateOfBirth: '',
    Address: '',
    ExperienceYears: undefined,
    Education: '',

});

const resumeForm = ref<FormState>({
    title: '',
    summary: '',
    skills: [{ skillName: '', level: '' }],
    experience: [{ companyName: '', position: '', startDate: '', endDate: '', isCurrent: false, description: '' }],
    education: [{ institution: '', degree: '', major: '', startDate: '', endDate: '', gpa: '' }],
    projects: [{ projectName: '', role: '', techString: '', link: '', description: '' }]
});

const isLastItemValid = (section: ArraySection): boolean => {
    const list = resumeForm.value[section] as any[];
    if (list.length === 0) return true; 
    
    const lastItem = list[list.length - 1];
    
    switch (section) {
        case 'skills':
            return !!(lastItem.skillName.trim() && lastItem.level);
        case 'experience':
            return !!(lastItem.companyName.trim() && lastItem.position.trim() && lastItem.startDate);
        case 'education':
            return !!(lastItem.institution.trim() && lastItem.major.trim() && lastItem.degree.trim() && lastItem.startDate);
        case 'projects':
            return !!(lastItem.projectName.trim() && lastItem.role.trim() && lastItem.techString.trim());
        default:
            return true;
    }
};

const addItem = (section: ArraySection) => {
    if (!isLastItemValid(section)) {
        showToast('Vui lòng điền đủ thông tin bắt buộc ở ô hiện tại trước khi thêm mới!', false);
        return;
    }
    
    if (section === 'skills') {
        resumeForm.value.skills.push({ skillName: '', level: '' });
    } else if (section === 'experience') {
        resumeForm.value.experience.push({ companyName: '', position: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    } else if (section === 'education') {
        resumeForm.value.education.push({ institution: '', degree: '', major: '', startDate: '', endDate: '', gpa: '' });
    } else if (section === 'projects') {
        resumeForm.value.projects.push({ projectName: '', role: '', techString: '', link: '', description: '' });
    }
};

const removeItem = (section: ArraySection, index: number) => {
    resumeForm.value[section].splice(index, 1);
};

const handleSubmit = async () => {
    if (!avatarFile.value) {
        return showToast('Vui lòng tải lên ảnh đại diện!', false);
    }
    
    const processedExperience = resumeForm.value.experience.map(exp => {
        const result = { ...exp };
        if (result.isCurrent) {
            result.endDate = undefined; 
        }
        return result;
    });
    
    const payload: iResumeDetail = {
        ...resumeForm.value,
        experience: processedExperience,
        projects: resumeForm.value.projects.map(p => ({
            projectName: p.projectName,
            role: p.role,
            link: p.link || undefined,
            description: p.description || undefined,
            technologies: p.techString 
            ? p.techString.split(',')
            .map(tech => tech.trim())
            .filter(tech => tech.length > 0) 
            : []
        }))
    };

    const formData = new FormData();
    if (avatarFile.value) {
        formData.append('AvatarUrl', avatarFile.value); 
    }
    
    // Gắn thông tin chung
    formData.append('title', payload.title || '');
    formData.append('summary', payload.summary || '');
    
    // Gắn thông tin Candidate vào formData
    formData.append('candidate', JSON.stringify(candidateForm.value));
    
    // Hoặc nếu Backend yêu cầu gắn từng property riêng lẻ, hãy mở comment đoạn dưới đây:
    
    formData.append('FullName', candidateForm.value.FullName || '');
    formData.append('Phone', candidateForm.value.Phone || '');
    formData.append('DateOfBirth', candidateForm.value.DateOfBirth || '');
    formData.append('Address', candidateForm.value.Address || '');
    if (candidateForm.value.ExperienceYears !== undefined) formData.append('ExperienceYears', candidateForm.value.ExperienceYears.toString());
    formData.append('Education', candidateForm.value.Education || '');
    
    // Gắn các danh sách 
    formData.append('skills', JSON.stringify(payload.skills || []));
    formData.append('experience', JSON.stringify(payload.experience || []));
    formData.append('education', JSON.stringify(payload.education || []));
    formData.append('projects', JSON.stringify(payload.projects || []));
    
    await useResume.createResumeStore(formData);
    if(useResume.error) {
        showToast(useResume.message || 'Có lỗi xảy ra khi lưu CV!', false);
    } else {
        showToast(useResume.message || 'Tạo CV thành công!', true);
    }
};









// 1. Chuẩn bị các dữ liệu mẫu dạng Object/Array
const mockCandidate = {
    FullName: "Trần Huy Vui",
    Phone: "0901234567",
    DateOfBirth: "2002-01-01",
    Address: "TP.HCM",
    ExperienceYears: 2,
    Education: "Đại học Sư phạm TP.HCM (HCMUE)"
};

const mockSkills = [
    { skillName: "Vue 3 & TypeScript", level: "Tốt" },
    { skillName: "Node.js & Express", level: "Khá" },
    { skillName: "MongoDB & SQL Server", level: "Tốt" }
];

const mockExperience = [
    {
        companyName: "Dự án cá nhân",
        position: "Full-stack Developer",
        startDate: "2023-06-01",
        isCurrent: true,
        description: "Phát triển hệ thống quản lý nhân sự với phân quyền RBAC và mã hóa AES-256."
    }
];

const mockEducation = [
    {
        institution: "Đại học Sư phạm TP.HCM",
        major: "Công nghệ thông tin",
        degree: "Cử nhân",
        startDate: "2020-09-01",
        endDate: "2024-06-01"
    }
];

const mockProjects = [
    {
        projectName: "Fashion-shop E-commerce",
        role: "Backend Developer",
        technologies: ["Node.js", "Express", "Cloudinary"],
        link: "https://github.com/...",
        description: "Xây dựng backend cho trang web thương mại điện tử."
    }
];

// 2. Khởi tạo FormData và nhét dữ liệu vào
const formData = new FormData();

// Tạo một file ảnh giả (Mock Image File) để pass qua Multer
const mockImageContent = new Blob(['(⌐■_■) mock image data'], { type: 'image/png' });
const mockImageFile = new File([mockImageContent], "avatar_test.png", { type: "image/png" });

// Append file
formData.append('AvatarUrl', mockImageFile);

// Append thông tin chung
formData.append('title', 'Lập trình viên Backend (Node.js)');
formData.append('summary', 'Mục tiêu trở thành Backend Developer chuyên nghiệp, đạt TOEIC 800+.');

// Append các cục JSON đã stringify
// formData.append('candidate', JSON.stringify(mockCandidate));
formData.append('FullName', mockCandidate.FullName);
formData.append('Phone', mockCandidate.Phone);
formData.append('DateOfBirth', mockCandidate.DateOfBirth);
formData.append('Address', mockCandidate.Address);
formData.append('ExperienceYears', mockCandidate.ExperienceYears.toString());
formData.append('Education', mockCandidate.Education);

formData.append('skills', JSON.stringify(mockSkills));
formData.append('experience', JSON.stringify(mockExperience));
formData.append('education', JSON.stringify(mockEducation));
formData.append('projects', JSON.stringify(mockProjects));


onMounted(async () => {
    await useResume.createResumeStore(formData);
    for (let pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
    }
    if(useResume.error) {
        showToast(useResume.message || 'Có lỗi xảy ra khi lưu CV!', false);
    } else {
        showToast(useResume.message || 'Tạo CV thành công!', true);
    }
});


</script>
<template>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
    <Loading 
        v-if="useResume.loading" 
    />
    
    <div class="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
        <div class="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            
            <div class="bg-blue-600/5 p-8 border-b border-slate-100 text-center">
                <h2 class="text-2xl font-bold text-blue-700 uppercase tracking-wide">Tạo hồ sơ ứng viên (CV)</h2>
                <p class="text-slate-500 mt-2 text-sm">Vui lòng điền đầy đủ thông tin và tải lên ảnh đại diện của bạn.</p>
            </div>
            
            <div class="p-8 sm:p-10">
                <form @submit.prevent="handleSubmit" class="space-y-10">
                    
                    <section>
                        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
                            <i class="fas fa-file-alt text-blue-600"></i> Thông tin chung
                        </h3>
                        
                        <div class="flex flex-col md:flex-row gap-8 items-start">
                            
                            <div class="shrink-0 flex flex-col items-center md:items-start w-full md:w-auto">
                                <label class="block text-sm font-semibold text-slate-700 mb-3">Ảnh đại diện <span class="text-red-500">*</span></label>
                                <div class="relative w-36 h-36 group cursor-pointer mx-auto md:mx-0">
                                    <input type="file" accept="image/*" @change="onAvatarChange" class="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                                    <div class="w-full h-full rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-blue-400 group-hover:bg-blue-50/50 group-hover:shadow-md">
                                        <img v-if="avatarPreview" :src="avatarPreview" class="w-full h-full object-cover" />
                                        <div v-else class="text-slate-400 flex flex-col items-center group-hover:text-blue-500 transition-colors">
                                            <i class="fas fa-camera text-3xl mb-2"></i>
                                            <span class="text-[10px] font-bold uppercase tracking-wider">Tải ảnh</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex-1 w-full space-y-5">
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề CV (Vị trí ứng tuyển) <span class="text-red-500">*</span></label>
                                    <input v-model="resumeForm.title" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm" placeholder="Ví dụ: Lập trình viên Frontend (VueJS)">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Tóm tắt bản thân</label>
                                    <textarea v-model="resumeForm.summary" rows="3" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm resize-none" placeholder="Giới thiệu ngắn gọn về mục tiêu nghề nghiệp và điểm mạnh của bạn..."></textarea>
                                </div>
                            </div>
                            
                        </div>
                    </section>

                    <section>
                        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
                            <i class="fas fa-user-circle text-blue-600"></i> Thông tin cá nhân
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Họ và tên <span class="text-red-500">*</span></label>
                                <input v-model="candidateForm.FullName" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm" placeholder="Ví dụ: Nguyễn Văn A">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Số điện thoại</label>
                                <input v-model="candidateForm.Phone" type="tel" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm" placeholder="Ví dụ: 0901234567">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Ngày sinh</label>
                                <input v-model="candidateForm.DateOfBirth" type="date" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Địa chỉ</label>
                                <input v-model="candidateForm.Address" type="text" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm" placeholder="Ví dụ: Quận 1, TP.HCM">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Số năm kinh nghiệm</label>
                                <input v-model="candidateForm.ExperienceYears" type="number" min="0" step="0.5" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm" placeholder="Ví dụ: 2">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Trình độ học vấn</label>
                                <input v-model="candidateForm.Education" type="text" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm" placeholder="Ví dụ: Cử nhân Đại học">
                            </div>
                        </div>
                    </section>
                    
                    <section>
                        <div class="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <i class="fas fa-tools text-blue-600"></i> Kỹ năng chuyên môn
                            </h3>
                            <button type="button" @click="addItem('skills')" class="text-sm text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 transition-colors">
                                <i class="fas fa-plus-circle"></i> Thêm kỹ năng
                            </button>
                        </div>
                        
                        <div class="space-y-4">
                            <div v-for="(skill, index) in resumeForm.skills" :key="index" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100 relative group animate-in fade-in zoom-in-95 duration-200">
                                <div class="md:col-span-6">
                                    <label class="block text-xs font-semibold text-slate-500 mb-1">Tên kỹ năng <span class="text-red-500">*</span></label>
                                    <input v-model="skill.skillName" type="text" required class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm" placeholder="Ví dụ: JavaScript, VueJS...">
                                </div>
                                <div class="md:col-span-5">
                                    <label class="block text-xs font-semibold text-slate-500 mb-2">
                                        Trình độ <span class="text-red-500">*</span>
                                    </label>
                                    
                                    <div class="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                                        <button
                                            v-for="lvl in ['Cơ bản', 'Khá', 'Tốt', 'Xuất sắc']"
                                            :key="lvl"
                                            type="button"
                                            @click="skill.level = lvl"
                                            :class="[
                                                'flex-1 text-[13px] font-semibold py-1.5 rounded-md transition-all duration-200',
                                                skill.level === lvl
                                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/60'
                                            ]"
                                            >
                                            {{ lvl }}
                                        </button>
                                    </div>
                                    
                                    <input type="hidden" v-model="skill.level" required />
                                    </div>
                                <div class="md:col-span-1 flex justify-end mt-6">
                                    <button type="button" @click="removeItem('skills', index)" class="text-red-400 hover:text-red-600 p-2 transition-colors" title="Xóa">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section>
                        <div class="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <i class="fas fa-graduation-cap text-blue-600"></i> Học vấn
                            </h3>
                            <button type="button" @click="addItem('education')" class="text-sm text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 transition-colors">
                                <i class="fas fa-plus-circle"></i> Thêm trường học
                            </button>
                        </div>
                        
                        <div class="space-y-6">
                            <div v-for="(edu, index) in resumeForm.education" :key="index" class="bg-slate-50 p-5 rounded-xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
                                <button type="button" @click="removeItem('education', index)" class="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"><i class="fas fa-times text-lg"></i></button>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4 mt-2">
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Trường / Trung tâm <span class="text-red-500">*</span></label>
                                        <input v-model="edu.institution" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm" placeholder="Ví dụ: Đại học Bách Khoa">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Chuyên ngành <span class="text-red-500">*</span></label>
                                        <input v-model="edu.major" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm" placeholder="Ví dụ: Công nghệ thông tin">
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Bằng cấp <span class="text-red-500">*</span></label>
                                        <input v-model="edu.degree" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm" placeholder="Ví dụ: Cử nhân">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Ngày bắt đầu <span class="text-red-500">*</span></label>
                                        <input v-model="edu.startDate" type="date" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Ngày kết thúc</label>
                                        <input v-model="edu.endDate" type="date" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section>
                        <div class="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <i class="fas fa-briefcase text-blue-600"></i> Kinh nghiệm làm việc
                            </h3>
                            <button type="button" @click="addItem('experience')" class="text-sm text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 transition-colors">
                                <i class="fas fa-plus-circle"></i> Thêm công ty
                            </button>
                        </div>
                        
                        <div class="space-y-6">
                            <div v-for="(exp, index) in resumeForm.experience" :key="index" class="bg-slate-50 p-5 rounded-xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
                                <button type="button" @click="removeItem('experience', index)" class="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"><i class="fas fa-times text-lg"></i></button>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4 mt-2">
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Tên công ty <span class="text-red-500">*</span></label>
                                        <input v-model="exp.companyName" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" placeholder="Ví dụ: Công ty TNHH ABC">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Vị trí công việc <span class="text-red-500">*</span></label>
                                        <input v-model="exp.position" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" placeholder="Ví dụ: Frontend Developer">
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Ngày bắt đầu <span class="text-red-500">*</span></label>
                                        <input v-model="exp.startDate" type="date" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm">
                                    </div>
                                    <div v-if="!exp.isCurrent">
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Ngày kết thúc</label>
                                        <input v-model="exp.endDate" type="date" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm">
                                    </div>
                                </div>
                                
                                <div class="mb-4">
                                    <label class="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer w-fit">
                                        <input v-model="exp.isCurrent" type="checkbox" class="w-4 h-4 text-blue-600 rounded border-slate-300">
                                        Tôi đang làm việc tại đây
                                    </label>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Mô tả công việc</label>
                                    <textarea v-model="exp.description" rows="3" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm resize-none" placeholder="Mô tả các nhiệm vụ và thành tựu của bạn..."></textarea>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section>
                        <div class="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <i class="fas fa-project-diagram text-blue-600"></i> Dự án nổi bật
                            </h3>
                            <button type="button" @click="addItem('projects')" class="text-sm text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 transition-colors">
                                <i class="fas fa-plus-circle"></i> Thêm dự án
                            </button>
                        </div>
                        
                        <div class="space-y-6">
                            <div v-for="(project, index) in resumeForm.projects" :key="index" class="bg-slate-50 p-5 rounded-xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
                                <button type="button" @click="removeItem('projects', index)" class="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"><i class="fas fa-times text-lg"></i></button>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4 mt-2">
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Tên dự án <span class="text-red-500">*</span></label>
                                        <input v-model="project.projectName" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" placeholder="Ví dụ: Hệ thống quản lý ERP">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Vai trò <span class="text-red-500">*</span></label>
                                        <input v-model="project.role" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" placeholder="Ví dụ: Team Leader">
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Công nghệ sử dụng <span class="text-red-500">*</span> <span class="font-normal text-xs text-slate-400">(Cách nhau bởi dấu phẩy)</span></label>
                                        <input v-model="project.techString" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" placeholder="Ví dụ: VueJS, NodeJS, MongoDB">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-slate-700 mb-2">Link dự án (Nếu có)</label>
                                        <input v-model="project.link" type="url" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" placeholder="https://...">
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Mô tả dự án</label>
                                    <textarea v-model="project.description" rows="3" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm resize-none" placeholder="Mô tả ngắn về dự án..."></textarea>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <div class="pt-8 border-t border-slate-200 flex flex-col items-center">
                        <h4 class="text-blue-900 font-bold text-lg mb-6 text-center">Hoàn thiện hồ sơ của bạn</h4>
                        
                        <div class="flex flex-col sm:flex-row w-full max-w-xl gap-4 justify-center">
                            <button type="submit" class="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold py-4 px-6 rounded-full transition-all flex justify-center items-center gap-2">
                                <i class="fas fa-edit"></i> Lưu CV Online
                            </button>
                            <button type="button" class="flex-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-bold py-4 px-6 rounded-full transition-all flex justify-center items-center gap-2">
                                <i class="fas fa-file-pdf"></i> Xuất file PDF
                            </button>
                        </div>
                    </div>
                    
                </form>
            </div>
        </div>
    </div>
</template>