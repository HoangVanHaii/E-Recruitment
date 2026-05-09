
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import SidebarEmployer from '../../components/Employer/SidebarEmployer.vue';
import Loading from '../../components/Loading.vue';
import Notify from '../../components/Notify.vue';
import type { ICompanyDetailResponse, IUpdateCompany } from '../../types/company';
import { useCompanyStore } from '../../stores/company';

const useCompany = useCompanyStore();

const activeTab = ref<'profile' | 'request'>('profile');
const hasCompany = ref(false);
const companyList = ref<any[]>([]);

const licenseInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const showModal = ref(false);
const selectedCompanyId = ref<number | null>(null);
const positionInput = ref('');

const openJoinModal = (id: number) => {
    selectedCompanyId.value = id;
    positionInput.value = '';
    showModal.value = true;
};

const triggerNotify = (msg: string, success: boolean) => {
    messageNotify.value = msg;
    isSuccessNotify.value = success;
    showNotify.value = true;
    setTimeout(() => { showNotify.value = false; }, 3000);
};

const logoPreview = ref<string | null>(null);
const licenseFileName = ref("");
const licensePreview = ref<string | null>(null);

const formData = reactive<IUpdateCompany & { Position?: string }>({
    TaxCode: '',
    CompanyName: '',
    CompanyDescription: '',
    Industry: '',
    Website: '',
    ContactEmail: '',
    City: '',
    Position: '',
    LogoUrl: undefined,
    BusinessLicenseUrl: undefined
});
const originalData = ref<Record<string, any>>({});

const displayLogo = computed(() => {
    if (logoPreview.value) return logoPreview.value;
    if (typeof formData.LogoUrl === 'string') return formData.LogoUrl;
    return undefined;
});

const companyId = ref<number | null>(null);

const fetchCompanyData = async () => {
    loading.value = true;
    try {
        const companyData: ICompanyDetailResponse & { Position?: string } = await useCompany.getCompanyDetailOfMeStore();
        
        if (companyData && Object.keys(companyData).length > 0) {  
            companyId.value = companyData.CompanyID;
            hasCompany.value = true;
            
            formData.TaxCode = companyData.TaxCode || '';
            formData.CompanyName = companyData.CompanyName || '';
            formData.CompanyDescription = companyData.CompanyDescription || '';
            formData.Industry = companyData.Industry || '';
            formData.Website = companyData.Website || '';
            formData.ContactEmail = companyData.ContactEmail || '';
            formData.City = companyData.City || '';
            formData.Position = companyData.Position || '';
            
            if (companyData.LogoUrl) logoPreview.value = companyData.LogoUrl;
            if (companyData.BusinessLicenseUrl) {
                licenseFileName.value = companyData.BusinessLicenseUrl.split('/').pop() || "GPKD.pdf";
                licensePreview.value = companyData.BusinessLicenseUrl;
            }
            originalData.value = { ...formData };
        } else {
            companyId.value = null;
            hasCompany.value = false;
            await fetchAvailableCompanies();
        }
    } catch (err) {
        console.error("Lỗi khi tải dữ liệu công ty:", err);
    } finally {
        loading.value = false;
    }
};

const fetchAvailableCompanies = async () => {
    await useCompany.getAllCompanyStore();
    companyList.value = useCompany.listCompany || [];
};

const submitJoinRequest = async () => {
    if (!positionInput.value.trim()) {
        triggerNotify("Vui lòng nhập vị trí", false);
        return;
    }
    
    loading.value = true;
    try {
        await useCompany.requestCompanyStore(selectedCompanyId.value!, positionInput.value.trim());
        showModal.value = false;
        if(useCompany.error) {
            triggerNotify(useCompany.message || "Gửi yêu cầu thất bại", false);
            return;
        }
        triggerNotify("Gửi yêu cầu thành công!", true);
    } catch (err) {
        triggerNotify("Gửi yêu cầu thất bại", false);
    } finally {
        loading.value = false;
    }
};
  
onMounted(fetchCompanyData);

const handleFileChange = (event: Event, field: 'LogoUrl' | 'BusinessLicenseUrl') => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const file = target.files[0];
        // @ts-ignore
        formData[field] = file;
        if (field === 'LogoUrl') {
            logoPreview.value = URL.createObjectURL(file);
        } else {
            licenseFileName.value = file.name;
            licensePreview.value = URL.createObjectURL(file);
        }
        target.value = '';
    }
};

const handleSubmit = async () => {
    loading.value = true;
    const dataToSend = new FormData();
    let hasChanges = false;
    const isInsert = companyId.value === null;
    
    Object.keys(formData).forEach((key) => {
        const val = (formData as any)[key];
        if (val instanceof File) {
            dataToSend.append(key, val);
            hasChanges = true;
        } else if (typeof val === 'string') {
            if (isInsert && val.trim() !== '') {
                dataToSend.append(key, val);
                hasChanges = true;
            } else if (!isInsert && val !== originalData.value[key]) {
                dataToSend.append(key, val);
                hasChanges = true;
            }
        }
    });
    
    if (!hasChanges) {
        triggerNotify("Chưa có thông tin nào được nhập hoặc thay đổi.", true);
        loading.value = false;
        return;
    }
    
    if (isInsert) {
        await useCompany.createCompanyStore(dataToSend); 
    } else {
        if(!companyId.value) {
            triggerNotify("ID công ty không tồn tại.", false);
            loading.value = false;
            return;
        }
        await useCompany.UpdateCompanyStore(companyId.value, dataToSend);
    }
    
    if (useCompany.error) {
        triggerNotify(useCompany.message || 'Đã xảy ra lỗi!', false);
    } else {
        await useCompany.getCompanyOfMeStore();
        originalData.value = { ...formData };
        triggerNotify(useCompany.message || 'Lưu thông tin thành công!', true);
    }
    loading.value = false;
};
</script>
<template>
    <div class="flex flex-col lg:flex-row h-screen w-full bg-slate-50/50 font-sans text-slate-800 overflow-hidden">
        <SidebarEmployer /> 
        <main class="flex-1 overflow-y-auto scroll-smooth relative bg-gradient-to-br from-slate-50 to-slate-100">
            <div class="max-w-6xl mx-auto pb-12">
                
                <div class="sticky top-0 z-30 px-6 lg:px-10 py-6 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex flex-col md:flex-row md:items-end md:justify-between gap-6 shadow-sm">
                    <div>
                        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Hồ sơ doanh nghiệp
                        </h1>
                        <p class="text-slate-500 mt-2 text-sm flex items-center gap-2">
                            <i class="fa-solid fa-shield-halved text-blue-500"></i>
                            Quản lý thương hiệu và thông tin tuyển dụng của tổ chức
                        </p>
                    </div>
                    
                    <button
                        v-if="activeTab === 'profile'"
                        @click="handleSubmit"
                        :disabled="loading"
                        class="flex items-center justify-center gap-2.5 px-7 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <i class="fa-solid text-lg" :class="loading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'"></i>
                        <span>{{ loading ? 'Đang lưu liệu...' : 'Lưu thay đổi' }}</span>
                    </button>
                </div>
            
                <div class="px-6 lg:px-10 mt-8 flex gap-8 border-b border-slate-200/80 relative">
                    <button 
                        @click="activeTab = 'profile'"
                        :class="activeTab === 'profile' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'"
                        class="pb-4 border-b-2 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative z-10"
                    >
                        <i class="fa-regular fa-id-badge text-lg"></i>
                        Thông tin hồ sơ
                    </button>
                    <button 
                        v-if="!hasCompany"
                        @click="activeTab = 'request'"
                        :class="activeTab === 'request' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'"
                        class="pb-4 border-b-2 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative z-10"
                    >
                        <i class="fa-solid fa-code-pull-request text-lg"></i>
                        Yêu cầu gia nhập
                    </button>
                </div>
    
                <div v-if="activeTab === 'profile'" class="px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                    
                    <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-32 z-10">
                        <div class="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-100 group text-center relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 to-white"></div>
                            
                            <h3 class="font-bold text-slate-800 mb-6 flex items-center justify-center gap-2 relative z-10">
                                <i class="fa-solid fa-camera-retro text-blue-500"></i> Ảnh đại diện công ty
                            </h3>
                            
                            <div class="flex flex-col items-center gap-6 relative z-10">
                                <div class="relative w-44 h-44 rounded-full bg-slate-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:border-blue-100 group-hover:shadow-blue-500/20">
                                    <img
                                        v-if="displayLogo"
                                        :src="displayLogo"
                                        class="w-full h-full object-cover"
                                    />
                                    <i v-else class="fa-solid fa-building-user text-6xl text-slate-300"></i>
                                    
                                    <label class="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center backdrop-blur-sm">
                                        <i class="fa-solid fa-pen text-white text-2xl mb-2 transform -translate-y-2 group-hover:translate-y-0 transition-transform"></i>
                                        <span class="text-white text-xs font-medium">Thay đổi ảnh</span>
                                        <input type="file" hidden @change="handleFileChange($event, 'LogoUrl')" accept="image/*" />
                                    </label>
                                </div>
                                
                                <div class="w-full">
                                    <label class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-sm font-semibold rounded-xl cursor-pointer transition-colors border border-slate-200 hover:border-blue-200">
                                        <i class="fa-solid fa-cloud-arrow-up"></i>
                                        Tải ảnh lên
                                        <input type="file" hidden @change="handleFileChange($event, 'LogoUrl')" accept="image/*" />
                                    </label>
                                    <p class="text-xs text-slate-400 mt-3 font-medium">Định dạng: JPG, PNG. Tối đa 2MB.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                    <i class="fa-solid fa-signal text-slate-400"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-slate-800 text-sm">Trạng thái hồ sơ</h3>
                                    <p class="text-xs text-slate-500 mt-0.5">Mức độ hiển thị</p>
                                </div>
                            </div>
                            <div :class="hasCompany ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'" 
                                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide shadow-sm">
                                <span class="relative flex h-2 w-2">
                                    <span :class="hasCompany ? 'bg-green-400' : 'bg-amber-400'" class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                                    <span :class="hasCompany ? 'bg-green-500' : 'bg-amber-500'" class="relative inline-flex rounded-full h-2 w-2"></span>
                                </span>
                                {{ hasCompany ? 'Đã liên kết' : 'Chưa liên kết' }}
                            </div>
                        </div>
                    </div>
    
                    <div class="lg:col-span-8 space-y-8 pb-10">
                        <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div class="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                                <h3 class="font-bold text-slate-800 flex items-center gap-3 text-lg">
                                    <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <i class="fa-regular fa-building"></i>
                                    </div>
                                    Thông tin cơ bản
                                </h3>
                            </div>
                            
                            <div class="p-8 space-y-6">
                                <div>
                                    <label class="text-sm font-bold text-slate-700 mb-2 block">Tên công ty <span class="text-red-500">*</span></label>
                                    <div class="relative group">
                                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                                            <i class="fa-solid fa-briefcase"></i>
                                        </div>
                                        <input
                                            v-model="formData.CompanyName"
                                            placeholder="Nhập tên công ty..."
                                            class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                                        />
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="text-sm font-bold text-slate-700 mb-2 block">Mã số thuế <span class="text-red-500">*</span></label>
                                        <div class="relative group">
                                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                                                <i class="fa-solid fa-barcode"></i>
                                            </div>
                                            <input
                                                v-model="formData.TaxCode"
                                                placeholder="VD: 0312345678"
                                                class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="text-sm font-bold text-slate-700 mb-2 block">Thành phố / Tỉnh</label>
                                        <div class="relative group">
                                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                                                <i class="fa-solid fa-city"></i>
                                            </div>
                                            <input
                                                v-model="formData.City"
                                                placeholder="VD: Hồ Chí Minh, Hà Nội..."
                                                class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="text-sm font-bold text-slate-700 mb-2 block">Vị trí / Chức vụ của bạn <span class="text-red-500">*</span></label>
                                        <div class="relative group">
                                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                                                <i class="fa-solid fa-user-tie"></i>
                                            </div>
                                            <input
                                                v-model="(formData as any).Position"
                                                placeholder="VD: HR Manager..."
                                                class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="text-sm font-bold text-slate-700 mb-2 block">Lĩnh vực hoạt động <span class="text-red-500">*</span></label>
                                        <div class="relative group">
                                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                                                <i class="fa-solid fa-layer-group"></i>
                                            </div>
                                            <input
                                                v-model="formData.Industry"
                                                placeholder="VD: Công nghệ thông tin..."
                                                class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div class="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                                <h3 class="font-bold text-slate-800 flex items-center gap-3 text-lg">
                                    <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <i class="fa-regular fa-address-card"></i>
                                    </div>
                                    Liên hệ trực tuyến
                                </h3>
                            </div>
                            
                            <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="text-sm font-bold text-slate-700 mb-2 block">Email công ty</label>
                                    <div class="relative group">
                                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                                            <i class="fa-solid fa-at"></i>
                                        </div>
                                        <input
                                            v-model="formData.ContactEmail"
                                            placeholder="contact@company.com"
                                            class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="text-sm font-bold text-slate-700 mb-2 block">Website</label>
                                    <div class="relative group">
                                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                                            <i class="fa-solid fa-globe"></i>
                                        </div>
                                        <input
                                            v-model="formData.Website"
                                            placeholder="https://..."
                                            class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div class="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                                <h3 class="font-bold text-slate-800 flex items-center gap-3 text-lg">
                                    <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <i class="fa-solid fa-align-left"></i>
                                    </div>
                                    Giới thiệu công ty
                                </h3>
                            </div>
                            
                            <div class="p-8">
                                <textarea
                                    v-model="formData.CompanyDescription"
                                    placeholder="Chia sẻ về lịch sử, sứ mệnh và văn hóa công ty của bạn..."
                                    rows="5"
                                    class="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none transition-all text-slate-700 leading-relaxed"
                                ></textarea>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div class="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 class="font-bold text-slate-800 flex items-center gap-3 text-lg">
                                    <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                                        <i class="fa-solid fa-file-contract"></i>
                                    </div>
                                    Giấy phép kinh doanh <span class="text-red-500 ml-1 text-sm">*</span>
                                </h3>
                                <div class="flex items-center gap-1.5 text-xs bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold">
                                    <i class="fa-solid fa-lock text-slate-400"></i>
                                    <span>Bảo mật</span>
                                </div>
                            </div>
                            
                            <div class="p-8">
                                <div
                                    @click="licenseInput?.click()"
                                    class="relative border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-4 min-h-[240px] text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 group overflow-hidden flex flex-col items-center justify-center"
                                >
                                    <div v-if="licensePreview" class="absolute inset-0 w-full h-full p-2">
                                        <img :src="licensePreview" class="w-full h-full object-contain rounded-xl shadow-sm bg-white" />
                                        <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white font-semibold backdrop-blur-sm rounded-xl m-2">
                                            <i class="fa-solid fa-rotate mr-2"></i> Tải lên ảnh khác
                                        </div>
                                    </div>
                                    
                                    <div v-else class="space-y-4">
                                        <div class="w-16 h-16 mx-auto bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300">
                                            <i class="fa-solid fa-cloud-arrow-up text-blue-500 text-2xl"></i>
                                        </div>
                                        <div>
                                            <p class="font-bold text-slate-700 text-lg">
                                                Tải lên giấy phép kinh doanh
                                            </p>
                                            <p class="text-sm text-slate-500 mt-1">Nhấn hoặc kéo thả ảnh vào khu vực này</p>
                                        </div>
                                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold">
                                            <i class="fa-regular fa-image"></i> Hỗ trợ JPG, PNG
                                        </div>
                                    </div>
                                    
                                    <input
                                        ref="licenseInput"
                                        type="file"
                                        hidden
                                        @change="handleFileChange($event, 'BusinessLicenseUrl')"
                                        accept="image/*"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="px-6 lg:px-10 py-8 animate-fade-in">
                    <div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-md border border-slate-200 overflow-hidden">
                        
                        <div class="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-50/50">
                            <div>
                                <h3 class="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                                    <i class="fa-solid fa-building-columns text-blue-600"></i>
                                    Danh sách công ty
                                </h3>
                                <p class="text-slate-500 text-sm mt-1">
                                    Tìm và gửi yêu cầu gia nhập vào tổ chức đã có sẵn trên hệ thống
                                </p>
                            </div>
                            
                            <div class="relative w-full md:w-80 group">
                                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <i class="fa-solid fa-magnifying-glass text-sm"></i>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm theo tên công ty..." 
                                    class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                        <th class="px-8 py-4 w-24">ID</th>
                                        <th class="px-8 py-4">Tên công ty</th>
                                        <th class="px-8 py-4">Lĩnh vực</th>
                                        <th class="px-8 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                
                                <tbody class="divide-y divide-slate-100">
                                    
                                    <tr 
                                        v-for="company in companyList" 
                                        :key="company.CompanyID" 
                                        class="hover:bg-blue-50/30 transition-all duration-200 group hover:scale-[1.01]"
                                    >
                                        <td class="px-8 py-5 text-sm font-bold text-slate-500">
                                            #{{ company.CompanyID }}
                                        </td>
                                        
                                        <td class="px-8 py-5">
                                            <div class="flex items-center gap-4">
                                                
                                                <div class="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold shadow-sm">
                                                
                                                    <img 
                                                        v-if="company.LogoUrl"
                                                        :src="company.LogoUrl"
                                                        class="w-full h-full object-cover"
                                                    />
                                                    
                                                    <span v-else>
                                                        {{ company.CompanyName.charAt(0) }}
                                                    </span>
                                                </div>
                                            
                                                <span class="font-bold text-slate-800 text-base group-hover:text-blue-700 transition-colors">
                                                    {{ company.CompanyName }}
                                                </span>
                                            </div>
                                        </td>
                                    
                                        <td class="px-8 py-5 text-sm font-medium text-slate-600">
                                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                                                <i class="fa-solid fa-tag text-slate-400"></i>
                                                {{ company.Industry || 'Chưa cập nhật' }}
                                            </span>
                                        </td>
                                    
                                        <td class="px-8 py-5 text-right">
                                            <button 
                                                @click="openJoinModal(company.CompanyID)"
                                                class="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 active:scale-95"
                                            >
                                                <i class="fa-solid fa-paper-plane text-xs"></i>
                                                Gửi yêu cầu
                                            </button>
                                        </td>
                                    </tr>
                                    
                                    <tr v-if="companyList.length === 0">
                                        <td colspan="4" class="px-8 py-16 text-center">
                                            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                                                <i class="fa-solid fa-folder-open text-3xl text-slate-300"></i>
                                            </div>
                                            <p class="text-slate-500 font-medium">
                                                Không tìm thấy công ty nào phù hợp.
                                            </p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </main>

        <Notify v-if="showNotify" :message="messageNotify" :isSuccess="isSuccessNotify" />
        <Loading v-if="loading" />
        
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 animate-fade-in">
                
                <h3 class="text-lg font-bold text-slate-800 mb-4">
                    Nhập vị trí ứng tuyển
                </h3>
                
                <input 
                    v-model="positionInput"
                    placeholder="VD: Backend Developer, HR..."
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all mb-4"
                />
                
                <div class="flex justify-end gap-3">
                    <button 
                        @click="showModal = false"
                        class="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        Hủy
                    </button>
                    
                    <button 
                        @click="submitJoinRequest"
                        class="px-5 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-lg hover:shadow-blue-500/30"
                    >
                        Gửi
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>