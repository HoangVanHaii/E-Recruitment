<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';
import { useResumeStore } from '../stores/resume';
import { useCandidateStore } from '../stores/candidate'; 
import { useSkillStore } from '../stores/skill'; 
import type { ICandidateDetail } from '../types/candidate';

export interface Candidate {
    FullName: string;
    Phone?: string;
    DateOfBirth?: string;
    Address?: string;
}

const route = useRoute();
const router = useRouter();

const editResumeId = computed(() => Number(route.query.id));
const isEditMode = computed(() => !!editResumeId.value && editResumeId.value > 0);

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);
const isGeneratingAI = ref(false);

const useResume = useResumeStore();
const candidateStore = useCandidateStore();
const skillStore = useSkillStore(); 

const selectedTemplateId = ref<number>(1);
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);

const candidateForm = ref<Candidate>({ FullName: '', Phone: '', DateOfBirth: '', Address: '' });
const resumeForm = ref({ title: '', summary: '' });

const masterSkillsArray = computed(() => candidateStore.candidateSkills || []);

const selectedExperiences = ref<number[]>([]);
const selectedProjects = ref<number[]>([]);
const selectedEducation = ref<number[]>([]);
const selectedSkills = ref<number[]>([]);

const newExperiences = ref<any[]>([]);
const newProjects = ref<any[]>([]);
const newEducation = ref<any[]>([]);
const newSkills = ref<any[]>([]); 

const searchQuery = ref('');
const showDropdown = ref(false);

const filteredDictionary = computed(() => {
    const pickedMasterIds = selectedSkills.value.map(i => {
        const item = masterSkillsArray.value[i] as any;
        return item?.SkillID || item?.skillId;
    });
    
    const pickedNewNames = newSkills.value.map(s => (s.skillName || '').toLowerCase());
    
    let availableSkills = skillStore.dictionary.filter(s => {
        const id = s.SkillID;
        const name = s.SkillName || '';
        return !pickedMasterIds.includes(id) && !pickedNewNames.includes(name.toLowerCase());
    });

    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        availableSkills = availableSkills.filter(s => {
            const name = s.SkillName || '';
            return name.toLowerCase().includes(query);
        });
    }

    return availableSkills.slice(0, 10);
});

const selectManualSkill = (item: any) => {
    newSkills.value.unshift({ skillId: item.SkillID, skillName: item.SkillName, level: 'Khá' });
    searchQuery.value = ''; showDropdown.value = false;
};

const addCustomSkill = () => {
    if (!searchQuery.value.trim()) return;
    newSkills.value.unshift({ 
        skillName: searchQuery.value.trim(), 
        level: 'Khá',
        isNew: true 
    });
    searchQuery.value = ''; showDropdown.value = false;
};

watch(searchQuery, () => { 
    showDropdown.value = true; 
});
const handleBlurDropdown = () => {
    setTimeout(() => {
        showDropdown.value = false;
    }, 200);
};

const showToast = (message: string, isSuccess: boolean) => {
    messageNotify.value = message; 
    isSuccessNotify.value = isSuccess; 
    showNotify.value = true;
    setTimeout(() => { showNotify.value = false; }, 3000);
};

const onAvatarChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        avatarFile.value = target.files[0];
        avatarPreview.value = URL.createObjectURL(avatarFile.value);
    }
};

const formatDateForInput = (dateStr: any) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().substring(0, 10);
};

onMounted(async () => {
    if (!candidateStore.profile) await candidateStore.getProfileStore();
    if (candidateStore.candidateSkills.length === 0) await candidateStore.fetchSkillsStore();
    if (skillStore.dictionary.length === 0) await skillStore.fetchDictionaryStore();

    const p = candidateStore.profile;
    if (p) {
        candidateForm.value.FullName = p.FullName || '';
        candidateForm.value.Phone = p.Phone || '';
        candidateForm.value.Address = p.Address || '';
        candidateForm.value.DateOfBirth = p.DateOfBirth ? new Date(p.DateOfBirth).toISOString().substring(0, 10) : '';
    }

    if (isEditMode.value) {
        await useResume.fetchResumeDetailStore(editResumeId.value);
        const cv = useResume.currentResume;
        
        if (cv) {
            resumeForm.value.title = cv.title || '';
            resumeForm.value.summary = cv.summary || '';
            selectedTemplateId.value = cv.templateId || 1;
            if (cv.AvatarUrl) avatarPreview.value = cv.AvatarUrl as string;

            // 1. Phục hồi Học vấn (Tách riêng Checkbox và Form nhập tay)
            const mEdu: number[] = []; const uEdu: any[] = [];
            (cv.education || []).forEach((edu: any) => {
                // So sánh xem có khớp với kho gốc không
                const idx = p?.education?.findIndex((pe: any) => pe.institution === edu.institution && pe.degree === edu.degree);
                if (idx !== undefined && idx !== -1 && !mEdu.includes(idx)) mEdu.push(idx); // Nếu khớp -> Tick checkbox
                else uEdu.push({...edu, startDate: formatDateForInput(edu.startDate), endDate: formatDateForInput(edu.endDate)}); // Không khớp -> Đẩy xuống form
            });
            selectedEducation.value = mEdu;
            newEducation.value = uEdu;

            // 2. Phục hồi Kinh nghiệm
            const mExp: number[] = []; const uExp: any[] = [];
            (cv.experience || []).forEach((exp: any) => {
                const idx = p?.experience?.findIndex((pe: any) => pe.companyName === exp.companyName && pe.position === exp.position);
                if (idx !== undefined && idx !== -1 && !mExp.includes(idx)) mExp.push(idx);
                else uExp.push({...exp, startDate: formatDateForInput(exp.startDate), endDate: formatDateForInput(exp.endDate)});
            });
            selectedExperiences.value = mExp;
            newExperiences.value = uExp;

            // 3. Phục hồi Dự án
            const mPrj: number[] = []; const uPrj: any[] = [];
            (cv.projects || []).forEach((prj: any) => {
                const idx = p?.projects?.findIndex((pp: any) => pp.projectName === prj.projectName);
                if (idx !== undefined && idx !== -1 && !mPrj.includes(idx)) mPrj.push(idx);
                else uPrj.push({
                    ...prj, 
                    techString: Array.isArray(prj.technologies) ? prj.technologies.join(', ') : prj.technologies
                });
            });
            selectedProjects.value = mPrj;
            newProjects.value = uPrj;

            // 4. Phục hồi Kỹ năng
            const mSkill: number[] = []; const uSkill: any[] = [];
            (cv.skills || []).forEach((sk: any) => {
                const idx = masterSkillsArray.value.findIndex((ms: any) => (ms.SkillID || ms.skillId) === sk.skillId);
                if (idx !== -1 && !mSkill.includes(idx)) mSkill.push(idx);
                else {
                    const mappedSkill: any = { skillName: sk.skillName || sk, level: sk.level || 'Khá' };
                    if (sk.skillId) mappedSkill.skillId = sk.skillId;
                    uSkill.push(mappedSkill);
                }
            });
            selectedSkills.value = mSkill;
            newSkills.value = uSkill;
        }
    } else {
        if (p) {
            if (p.AvatarUrl) avatarPreview.value = p.AvatarUrl;
            if (p.experience) selectedExperiences.value = p.experience.map((_: any, i: number) => i);
            if (p.projects) selectedProjects.value = p.projects.map((_: any, i: number) => i);
            if (p.education) selectedEducation.value = p.education.map((_: any, i: number) => i);
        }
        if (masterSkillsArray.value.length > 0) {
            selectedSkills.value = masterSkillsArray.value.map((_, i) => i);
        }
    }
});

const addNewItem = (section: string) => {
    if (section === 'experience') newExperiences.value.unshift({ companyName: '', position: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    else if (section === 'projects') newProjects.value.unshift({ projectName: '', role: '', techString: '', link: '', description: '' });
    else if (section === 'education') newEducation.value.unshift({ institution: '', degree: '', major: '', startDate: '', endDate: '', gpa: '' });
};

const getHybridDataObjects = () => {
    const p = candidateStore.profile;
    const masterExp = p?.experience ? selectedExperiences.value.map(i => p.experience![i]) : [];
    const masterPrj = p?.projects ? selectedProjects.value.map(i => p.projects![i]) : [];
    const masterEdu = p?.education ? selectedEducation.value.map(i => p.education![i]) : [];
    
    const pickedSkills = selectedSkills.value.map(i => {
        const rawSkill = masterSkillsArray.value[i] as any; 
        return {
            skillId: rawSkill.SkillID || rawSkill.skillId,
            skillName: rawSkill.SkillName || rawSkill.skillName,
            level: rawSkill.SkillLevel || rawSkill.level || 'Khá',
            isNew: false 
        };
    });
    
    return {
        skills: [...pickedSkills, ...newSkills.value],
        education: [...masterEdu, ...newEducation.value],
        experience: [...masterExp, ...newExperiences.value],
        projects: [...masterPrj, ...newProjects.value]
    };
};

const syncNewDataToMasterProfile = async () => {
    if (newExperiences.value.length === 0 && newProjects.value.length === 0 && newEducation.value.length === 0) return;
    const p = candidateStore.profile;
    const payload: ICandidateDetail = {};
    if (newExperiences.value.length > 0) payload.experience = [...(p?.experience || []), ...newExperiences.value];
    if (newEducation.value.length > 0) payload.education = [...(p?.education || []), ...newEducation.value];
    if (newProjects.value.length > 0) {
        payload.projects = [...(p?.projects || []), ...newProjects.value.map(prj => ({
            ...prj, technologies: typeof prj.techString === 'string' ? prj.techString.split(',').map((t: string) => t.trim()).filter(Boolean) : []
        }))];
    }
    await candidateStore.updateMasterProfileStore(payload);
};

const handleGenerateAI = async () => {
    isGeneratingAI.value = true;
    try {
        const finalData = getHybridDataObjects();
        const summaryData = await useResume.generateAISummaryStore(finalData);
        if (!useResume.error && summaryData) {
            resumeForm.value.summary = summaryData; 
            showToast('AI đã phân tích dữ liệu và viết xong tóm tắt!', true);
        } else {
            showToast(useResume.message || 'Lỗi AI', false);
        }
    } catch (error) { 
        showToast('Hệ thống AI đang bận', false); 
    } finally { isGeneratingAI.value = false; }
};
const calculateMaxDate = () => {
    const today = new Date();
    const maxYear = today.getFullYear() - 18;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${maxYear}-${month}-${day}`;
};
const maxDate = ref(calculateMaxDate());

const handleSubmit = async () => {
    if (candidateForm.value.DateOfBirth && candidateForm.value.DateOfBirth > maxDate.value) {
        showToast('Bạn phải đủ 18 tuổi để tạo hồ sơ!', false);
        return; 
    }

    const title = resumeForm.value.title?.trim() || '';
    if (title.length < 10 || title.length > 255) {
        showToast('Tiêu đề CV phải từ 10 đến 255 ký tự!', false);
        return; 
    }

    for (const edu of newEducation.value) {
        if (edu.startDate && edu.endDate && new Date(edu.startDate) > new Date(edu.endDate)) {
            showToast(`Lỗi học vấn: Ngày kết thúc không thể trước ngày bắt đầu tại "${edu.institution || 'trường đang nhập'}"!`, false);
            return;
        }
    }

    for (const exp of newExperiences.value) {
        if (exp.startDate && exp.endDate && new Date(exp.startDate) > new Date(exp.endDate)) {
            showToast(`Lỗi kinh nghiệm: Ngày kết thúc không thể trước ngày bắt đầu tại "${exp.companyName || 'công ty đang nhập'}"!`, false);
            return;
        }
    }

    if (!isEditMode.value) {
        await syncNewDataToMasterProfile();
    }

    const finalData = getHybridDataObjects();
    const processedProjects = finalData.projects.map((p: any) => ({
        ...p, technologies: typeof p.techString === 'string' ? p.techString.split(',').map((t: string) => t.trim()).filter(Boolean) : (p.technologies || [])
    }));

    if (isEditMode.value) {
        const updatePayload = {
            title: resumeForm.value.title || '',
            summary: resumeForm.value.summary || '',
            templateId: selectedTemplateId.value,
            skills: finalData.skills,
            experience: finalData.experience,
            education: finalData.education,
            projects: processedProjects
        };

        await useResume.updateResumeStore(editResumeId.value, updatePayload); 
        
        if(!useResume.error) {
            showToast('Cập nhật CV thành công!', true);
            
            setTimeout(() => router.push({ query: { tab: 'resumes_list' } }), 1000);
        } else {
            showToast(useResume.message || 'Lỗi cập nhật', false);
        }

    } else {
        const formData = new FormData();
        if (avatarFile.value) formData.append('AvatarUrl', avatarFile.value); 
        else if (candidateStore.profile?.AvatarUrl) formData.append('ExistingAvatarUrl', candidateStore.profile.AvatarUrl);
        
        formData.append('templateId', selectedTemplateId.value.toString());
        formData.append('title', resumeForm.value.title || '');
        formData.append('summary', resumeForm.value.summary || '');
        
        formData.append('FullName', candidateForm.value.FullName || '');
        formData.append('Phone', candidateForm.value.Phone || '');
        formData.append('DateOfBirth', candidateForm.value.DateOfBirth || '');
        formData.append('Address', candidateForm.value.Address || '');
        
        formData.append('skills', JSON.stringify(finalData.skills));
        formData.append('experience', JSON.stringify(finalData.experience));
        formData.append('education', JSON.stringify(finalData.education));
        formData.append('projects', JSON.stringify(processedProjects));
        
        await useResume.createResumeStore(formData);
        if(!useResume.error) {
                showToast('Tạo CV thành công!', true);
                resumeForm.value.title = '';
                resumeForm.value.summary = '';
                newExperiences.value = [];
                newProjects.value = [];
                newEducation.value = [];
                newSkills.value = [];
                avatarFile.value = null;
                
                setTimeout(() => {
                    router.push({ query: { tab: 'resumes_list' } });
                }, 1500); 
            }
        else showToast(useResume.message || 'Lỗi khi tạo CV!', false);
    }
};
</script>
<template>
    <div class="max-w-5xl mx-auto pb-8 font-sans text-slate-800">
        <Notify v-if="showNotify" :message="messageNotify" :isSuccess="isSuccessNotify" @close="showNotify = false" />
        <Loading v-if="useResume.loading || isGeneratingAI || candidateStore.loading || skillStore.loading" />
        
        <div class="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            
            <div class="bg-[#1a237e]/5 p-8 border-b border-slate-100 text-center relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-[#1a237e] to-blue-400"></div>
                <h2 class="text-2xl font-black text-[#1a237e] uppercase tracking-wide">Tạo Hồ Sơ Ứng Viên (CV)</h2>
                <p class="text-slate-500 mt-2 text-sm">Điền thông tin từ trên xuống dưới. Các dữ liệu thêm mới (trừ Kỹ năng) sẽ được tự động đồng bộ về Kho gốc.</p>
            </div>
            
            <div class="p-8 sm:p-10">
                <form @submit.prevent="handleSubmit" class="space-y-10">
                    
                    <section class="bg-blue-50/30 p-6 rounded-2xl border border-blue-100">
                        <div class="flex flex-col md:flex-row gap-8 items-start">
                            <div class="shrink-0 flex flex-col items-center w-full md:w-auto">
                                <label class="block text-sm font-bold text-[#1a237e] mb-3">Ảnh đại diện <span class="text-red-500">*</span></label>
                                <div class="relative w-36 h-36 group cursor-pointer">
                                    <input type="file" accept="image/*" @change="onAvatarChange" class="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                                    <div class="w-full h-full rounded-2xl border-2 border-dashed border-blue-300 bg-white flex flex-col items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-[#1a237e]">
                                        <img v-if="avatarPreview" :src="avatarPreview" class="w-full h-full object-cover" />
                                        <div v-else class="text-slate-400 flex flex-col items-center group-hover:text-[#1a237e]">
                                            <i class="fas fa-camera text-3xl mb-2"></i><span class="text-[10px] font-bold uppercase">Chọn ảnh</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex-1 w-full space-y-5">
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Vị trí ứng tuyển (Tiêu đề CV) <span class="text-red-500">*</span></label>
                                    <input v-model="resumeForm.title" type="text" required class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium text-blue-900" placeholder="VD: Lập trình viên Backend (Node.js)">
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 mb-2">Họ và tên <span class="text-red-500">*</span></label>
                                        <input v-model="candidateForm.FullName" type="text" required class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 mb-2">Số điện thoại</label>
                                        <input v-model="candidateForm.Phone" type="tel" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 mb-2">Ngày sinh</label>
                                        <input v-model="candidateForm.DateOfBirth" 
                                            type="date" 
                                            :max="maxDate"
                                            class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-600">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 mb-2">Địa chỉ</label>
                                        <input v-model="candidateForm.Address" type="text" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="space-y-4 border-t border-slate-100 pt-8">
                        <h3 class="text-lg font-bold text-[#1a237e] flex items-center gap-2"><i class="fas fa-palette"></i> Chọn Mẫu Giao Diện</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            <label class="cursor-pointer group">
                                <input type="radio" v-model.number="selectedTemplateId" :value="1" class="hidden">
                                <div :class="selectedTemplateId === 1 ? 'ring-4 ring-blue-500 border-transparent' : 'border-slate-200 group-hover:border-blue-300'" class="border-2 rounded-xl p-4 transition-all bg-white relative h-full flex flex-col items-center">
                                    <div v-if="selectedTemplateId === 1" class="absolute top-2 right-2 text-blue-500 text-xl"><i class="fas fa-check-circle"></i></div>
                                    <div class="w-24 h-32 bg-gradient-to-r from-[#14205c] to-blue-50 rounded shadow-sm mb-3 opacity-80 group-hover:opacity-100 flex items-center justify-center border border-gray-100">
                                        <div class="w-1/3 h-full bg-[#14205c]"></div>
                                        <div class="w-2/3 h-full bg-white"></div>
                                    </div>
                                    <h4 class="font-bold text-sm text-slate-800">Mẫu Cổ Điển</h4>
                                    <p class="text-[11px] text-slate-500 mt-1 text-center">Hai cột, lề trái màu xanh (Chuẩn IT)</p>
                                </div>
                            </label>

                            <label class="cursor-pointer group">
                                <input type="radio" v-model.number="selectedTemplateId" :value="2" class="hidden">
                                <div :class="selectedTemplateId === 2 ? 'ring-4 ring-emerald-500 border-transparent' : 'border-slate-200 group-hover:border-emerald-300'" class="border-2 rounded-xl p-4 transition-all bg-white relative h-full flex flex-col items-center">
                                    <div v-if="selectedTemplateId === 2" class="absolute top-2 right-2 text-emerald-500 text-xl"><i class="fas fa-check-circle"></i></div>
                                    <div class="w-24 h-32 bg-gray-50 rounded shadow-sm mb-3 opacity-80 group-hover:opacity-100 flex flex-col p-2 border border-gray-100">
                                        <div class="w-full h-4 bg-emerald-700 mb-2"></div>
                                        <div class="w-full h-1 bg-gray-200 mb-1"></div>
                                        <div class="w-3/4 h-1 bg-gray-200"></div>
                                    </div>
                                    <h4 class="font-bold text-sm text-slate-800">Mẫu Tối Giản</h4>
                                    <p class="text-[11px] text-slate-500 mt-1 text-center">Đơn cột, tập trung vào nội dung</p>
                                </div>
                            </label>

                            <label class="cursor-pointer group">
                                <input type="radio" v-model.number="selectedTemplateId" :value="3" class="hidden">
                                <div :class="selectedTemplateId === 3 ? 'ring-4 ring-purple-500 border-transparent' : 'border-slate-200 group-hover:border-purple-300'" class="border-2 rounded-xl p-4 transition-all bg-white relative h-full flex flex-col items-center">
                                    <div v-if="selectedTemplateId === 3" class="absolute top-2 right-2 text-purple-500 text-xl"><i class="fas fa-check-circle"></i></div>
                                    <div class="w-24 h-32 bg-white rounded shadow-sm mb-3 opacity-80 group-hover:opacity-100 flex p-1 gap-1 border border-gray-100">
                                        <div class="w-1/2 h-full bg-purple-50 flex flex-col gap-1"><div class="w-full h-6 bg-purple-200 rounded-full"></div></div>
                                        <div class="w-1/2 h-full bg-gray-50"></div>
                                    </div>
                                    <h4 class="font-bold text-sm text-slate-800">Mẫu Hiện Đại</h4>
                                    <p class="text-[11px] text-slate-500 mt-1 text-center">Nhiều không gian, thiết kế bo góc tròn</p>
                                </div>
                            </label>

                        </div>
                    </section>
                    <section class="space-y-10 border-t border-slate-100 pt-8">
                        
                        <div>
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-bold text-[#1a237e] flex items-center gap-2"><i class="fas fa-graduation-cap"></i> Trình độ học vấn</h3>
                                <button type="button" @click="addNewItem('education')" class="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-all">+ Thêm mới</button>
                            </div>
                            
                            <div v-if="candidateStore.profile?.education?.length" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <label v-for="(edu, index) in candidateStore.profile.education" :key="'m_edu'+index" 
                                       class="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50"
                                       :class="selectedEducation.includes(index) ? 'border-amber-500 bg-amber-50/30' : 'border-slate-100'">
                                    <input type="checkbox" :value="index" v-model.number="selectedEducation" class="mt-1 w-4 h-4 text-amber-600 rounded">
                                    <div>
                                        <p class="font-bold text-slate-800 text-sm">{{ edu.degree }} - {{ edu.major }}</p>
                                        <p class="text-xs text-slate-500 mt-0.5">{{ edu.institution }}</p>
                                    </div>
                                </label>
                            </div>

                            <div v-if="newEducation.length > 0" class="space-y-4 border-t border-dashed border-slate-200 pt-4 mt-2">
                                <div v-for="(edu, index) in newEducation" :key="'new_edu'+index" class="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                                    <button type="button" @click="newEducation.splice(index, 1)" class="absolute top-3 right-3 text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <input v-model="edu.institution" type="text" placeholder="Trường / Đơn vị giảng dạy *" required class="w-full px-3 py-2 border rounded-lg text-sm md:col-span-2 bg-white">
                                        <input v-model="edu.startDate" type="date" required :max="edu.endDate || ''" class="w-full px-3 py-2 border rounded-lg text-sm text-gray-500 bg-white">
                                        <input v-model="edu.endDate" type="date" required :min="edu.startDate || ''" class="w-full px-3 py-2 border rounded-lg text-sm text-gray-500 bg-white">
                                        <input v-model="edu.major" type="text" placeholder="Chuyên ngành *" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                        <select v-model="edu.degree" required class="w-full px-3 py-2 border rounded-lg text-sm appearance-none bg-white text-gray-600">
                                            <option value="" disabled selected>Chọn bằng cấp *</option>
                                            <option value="Cử nhân">Cử nhân</option>
                                            <option value="Kỹ sư">Kỹ sư</option>
                                            <option value="Thạc sĩ">Thạc sĩ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                        <input v-model="edu.gpa" type="text" placeholder="Điểm (GPA) / Xếp loại" class="w-full px-3 py-2 border rounded-lg text-sm md:col-span-2 bg-white">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-bold text-[#1a237e] flex items-center gap-2"><i class="fas fa-briefcase"></i> Kinh nghiệm làm việc</h3>
                                <button type="button" @click="addNewItem('experience')" class="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all">+ Thêm mới</button>
                            </div>
                            
                            <div v-if="candidateStore.profile?.experience?.length" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <label v-for="(exp, index) in candidateStore.profile.experience" :key="'m_exp'+index" 
                                       class="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50"
                                       :class="selectedExperiences.includes(index) ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100'">
                                    <input type="checkbox" :value="index" v-model.number="selectedExperiences" class="mt-1 w-4 h-4 text-emerald-600 rounded">
                                    <div>
                                        <p class="font-bold text-slate-800 text-sm">{{ exp.position }}</p>
                                        <p class="text-xs text-slate-500 mt-0.5">{{ exp.companyName }}</p>
                                    </div>
                                </label>
                            </div>

                            <div v-if="newExperiences.length > 0" class="space-y-4 border-t border-dashed border-slate-200 pt-4 mt-2">
                                <div v-for="(exp, index) in newExperiences" :key="'new_exp'+index" class="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                                    <button type="button" @click="newExperiences.splice(index, 1)" class="absolute top-3 right-3 text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <input v-model="exp.companyName" type="text" placeholder="Công ty *" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                        <input v-model="exp.position" type="text" placeholder="Chức danh *" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                        <input v-model="exp.startDate" type="date" required :max="exp.endDate || ''" class="w-full px-3 py-2 border rounded-lg text-sm text-gray-500 bg-white">
                                        <input v-model="exp.endDate" type="date" :min="exp.startDate || ''" class="w-full px-3 py-2 border rounded-lg text-sm text-gray-500 bg-white">
                                        <textarea v-model="exp.description" placeholder="Mô tả công việc" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm md:col-span-2 resize-none bg-white"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-bold text-[#1a237e] flex items-center gap-2"><i class="fas fa-project-diagram"></i> Dự án nổi bật</h3>
                                <button type="button" @click="addNewItem('projects')" class="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all">+ Thêm mới</button>
                            </div>
                            
                            <div v-if="candidateStore.profile?.projects?.length" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <label v-for="(prj, index) in candidateStore.profile.projects" :key="'m_prj'+index" 
                                       class="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50"
                                       :class="selectedProjects.includes(index) ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100'">
                                    <input type="checkbox" :value="index" v-model.number="selectedProjects" class="mt-1 w-4 h-4 text-indigo-600 rounded">
                                    <div>
                                        <p class="font-bold text-slate-800 text-sm">{{ prj.projectName }}</p>
                                        <p class="text-xs text-slate-500 mt-0.5">{{ prj.role }}</p>
                                    </div>
                                </label>
                            </div>

                            <div v-if="newProjects.length > 0" class="space-y-4 border-t border-dashed border-slate-200 pt-4 mt-2">
                                <div v-for="(prj, index) in newProjects" :key="'new_prj'+index" class="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                                    <button type="button" @click="newProjects.splice(index, 1)" class="absolute top-3 right-3 text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <input v-model="prj.projectName" type="text" placeholder="Tên dự án *" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                        <input v-model="prj.role" type="text" placeholder="Vai trò *" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                        <input v-model="prj.techString" type="text" placeholder="Công cụ/Kỹ năng (Cách bằng dấu phẩy) *" class="md:col-span-2 w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                        <input v-model="prj.link" type="text" placeholder="Link demo" class="md:col-span-2 w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                        <textarea v-model="prj.description" placeholder="Mô tả dự án" rows="2" class="md:col-span-2 w-full px-3 py-2 border rounded-lg text-sm resize-none bg-white"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </section>

                    <section class="space-y-6 border-t border-slate-100 pt-8">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="text-lg font-bold text-[#1a237e] flex items-center gap-2"><i class="fas fa-tools"></i> Kỹ năng chuyên môn</h3>
                        </div>

                        <div v-if="masterSkillsArray.length > 0" class="flex flex-wrap gap-3">
                            <label v-for="(skill, index) in masterSkillsArray" :key="'m_sk'+index" 
                                   class="flex items-center gap-2 px-4 py-2 border-2 rounded-full cursor-pointer transition-all"
                                   :class="selectedSkills.includes(index) ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">
                                <input type="checkbox" :value="index" v-model.number="selectedSkills" class="hidden">
                                <span class="text-sm font-bold">{{ skill.skillName || (skill as any).SkillName }}</span>
                                <i v-if="selectedSkills.includes(index)" class="fas fa-check-circle text-rose-500"></i>
                            </label>
                        </div>

                        <div class="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                            <label class="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Bổ sung thêm kỹ năng cho CV này</label>
                            <div class="relative max-w-md">
                                <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input type="text" v-model="searchQuery" @focus="showDropdown = true" @blur="handleBlurDropdown"
                                    class="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-rose-400 outline-none transition-all text-sm bg-white"
                                    placeholder="Gõ để tìm hoặc thêm mới kỹ năng...">
                                
                                <div v-if="showDropdown && (filteredDictionary.length > 0 || searchQuery.trim())" class="absolute z-20 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-xl max-h-60 overflow-y-auto py-2">
                                    <button v-for="item in filteredDictionary" :key="item.SkillID" type="button"
                                        @click="selectManualSkill(item)"
                                        class="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 transition-colors flex items-center justify-between group">
                                        <span class="font-medium text-gray-700">{{ item.SkillName }}</span>
                                        <i class="fas fa-plus text-gray-300 group-hover:text-rose-500 text-xs"></i>
                                    </button>
                                    
                                    <button v-if="searchQuery.trim()" type="button" @click="addCustomSkill"
                                        class="w-full text-left px-4 py-3 text-sm border-t border-gray-50 text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 font-bold bg-rose-50/30">
                                        <i class="fas fa-magic"></i> Thêm kỹ năng "{{ searchQuery }}"
                                    </button>
                                </div>
                            </div>

                            <div v-if="newSkills.length > 0" class="mt-4 flex flex-wrap gap-3">
                                <div v-for="(sk, index) in newSkills" :key="'new_sk'+index" class="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 rounded-lg shadow-sm">
                                    <span class="text-sm font-bold text-rose-700">{{ sk.skillName }}</span>
                                    <select v-model="sk.level" class="text-xs bg-transparent text-gray-500 outline-none cursor-pointer border-l border-rose-100 pl-2 ml-1">
                                        <option value="Cơ bản">Cơ bản</option>
                                        <option value="Khá">Khá</option>
                                        <option value="Tốt">Tốt</option>
                                        <option value="Xuất sắc">Xuất sắc</option>
                                    </select>
                                    <button type="button" @click="newSkills.splice(index, 1)" class="text-gray-300 hover:text-red-500 ml-1"><i class="fas fa-times-circle"></i></button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                        <div class="flex justify-between items-end mb-3">
                            <div>
                                <h3 class="text-lg font-bold text-[#1a237e] flex items-center gap-2"><i class="fas fa-pen-nib"></i> Tóm tắt mục tiêu nghề nghiệp</h3>
                                <p class="text-xs text-slate-500 mt-1">Mẹo: Hãy điền đầy đủ thông tin phía trên rồi nhờ AI tổng hợp lại nhé!</p>
                            </div>
                            <button type="button" @click="handleGenerateAI" class="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2">
                                <i class="fas fa-magic"></i> AI Viết Tóm Tắt
                            </button>
                        </div>
                        <textarea v-model="resumeForm.summary" rows="5" class="w-full px-5 py-4 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-sm resize-none leading-relaxed text-slate-700 shadow-inner" placeholder="Hãy để AI giúp bạn tổng hợp lại toàn bộ Kỹ năng, Kinh nghiệm và Học vấn phía trên..."></textarea>
                    </section>
                    
                    <div class="pt-4 border-t border-slate-200 flex flex-col items-center">
                        <button type="submit" :disabled="useResume.loading || candidateStore.loading" class="w-full sm:w-auto min-w-[300px] h-14 bg-[#14205c] text-white hover:bg-[#1a237e] font-black text-lg rounded-2xl transition-all shadow-xl shadow-indigo-900/20 flex justify-center items-center gap-3 disabled:opacity-50">
                            <i class="fas fa-save"></i> {{ isEditMode ? 'Lưu Thay Đổi CV' : 'Hoàn Tất Tạo CV' }}
                        </button>
                    </div>
                    
                </form>
            </div>
        </div>
    </div>
</template>


