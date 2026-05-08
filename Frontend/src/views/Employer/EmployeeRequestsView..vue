<script setup lang="ts">
import SidebarEmployer from '../../components/Employer/SidebarEmployer.vue';
import Notify from '../../components/Notify.vue';
import Loading from '../../components/Loading.vue';
import { useEmployerStore } from '../../stores/employer';
import { ref, onMounted } from 'vue';

const useEmployer = useEmployerStore();

const showNotify = ref<boolean>(false);
const messageNotify = ref<string>('');
const isSuccessNotify = ref<boolean>(true);
const loading = ref<boolean>(false); 

const selectedStatus = ref<string>('all');

const filterTabs = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Chờ duyệt', value: 'Pending' },
    { label: 'Đã duyệt', value: 'Approved' },
    { label: 'Từ chối', value: 'Rejected' }
];

interface CompanyRequest {
    EmployerID: number;
    Email: string;
    Position: string;
    ApprovalStatus: 'Pending' | 'Approved' | 'Rejected' | string;
}

const requests = ref<CompanyRequest[]>([]);

const fetchRequests = async (statusParam: string = 'all') => {
    loading.value = true; 
    
    const data = await useEmployer.getEmployerStatusStore(statusParam);
    console.log('Dữ liệu nhận được từ API:', data);
    
    if (useEmployer.error) {
        messageNotify.value = useEmployer.message || 'Đã có lỗi xảy ra!';
        isSuccessNotify.value = false;
        showNotify.value = true;
        requests.value = data || [];
    } else {
        requests.value = data || [];
    }
    
    loading.value = false;
};

const setFilter = (value: string) => {
    if (selectedStatus.value !== value) {
        selectedStatus.value = value;
        fetchRequests(value);
    }
};

onMounted(() => {
    fetchRequests(selectedStatus.value);
});

const getStatusClass = (status: string): string => {
    const baseClass = "px-2 py-1 text-xs font-medium rounded-full ";
    switch (status) {
        case 'Approved':
            return baseClass + "text-green-700 bg-green-100";
        case 'Rejected':
            return baseClass + "text-red-700 bg-red-100";
        case 'Pending':
        default:
            return baseClass + "text-yellow-700 bg-yellow-100";
    }
};

const getStatusText = (status: string): string => {
    switch (status) {
        case 'Approved': return 'Đã duyệt';
        case 'Rejected': return 'Từ chối';
        case 'Pending':
        default: return 'Chờ duyệt';
    }
};

const handleAction = async (id: number, action: 'Approved' | 'Rejected') => {
    const actionText = action === 'Approved' ? 'duyệt' : 'từ chối';
    
    loading.value = true;
    
    await useEmployer.updateStatusEmployerStore(id, action);
    
    if (useEmployer.error) {
        messageNotify.value = useEmployer.message || `Lỗi khi ${actionText} yêu cầu.`;
        isSuccessNotify.value = false;
        showNotify.value = true;
        loading.value = false;
    }
    else {
        messageNotify.value = `Đã ${actionText} yêu cầu thành công!`;
        isSuccessNotify.value = true;
        showNotify.value = true;
        
        await fetchRequests(selectedStatus.value); 
        
        loading.value = false;
    }   
}
</script>

<template>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
    <Loading 
        v-if="loading" 
    />

    <div class="flex flex-col lg:flex-row h-screen w-full bg-slate-50/50 font-sans text-slate-800 overflow-hidden">
        
        <SidebarEmployer /> 

        <div class="flex-1 p-4 lg:p-8 overflow-y-auto">
            <div class="p-6 bg-white rounded-lg shadow-md">
                
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Danh Sách Yêu Cầu Vào Công Ty</h2>
                
                <div class="flex flex-wrap items-center gap-3 mb-6">
                    <div 
                        v-for="tab in filterTabs" 
                        :key="tab.value"
                        @click="setFilter(tab.value)"
                        class="px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-200 select-none"
                        :class="selectedStatus === tab.value 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'"
                    >
                        {{ tab.label }}
                    </div>
                </div>
        
                <div class="overflow-x-auto rounded-lg border border-gray-200">
                    <table class="min-w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th scope="col" class="px-6 py-4 font-semibold">Mã YC (EmployerID)</th>
                                <th scope="col" class="px-6 py-4 font-semibold">Email</th>
                                <th scope="col" class="px-6 py-4 font-semibold">Vị trí (Position)</th>
                                <th scope="col" class="px-6 py-4 font-semibold">Trạng thái</th>
                                <th scope="col" class="px-6 py-4 font-semibold text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="loading">
                                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
        
                            <tr v-else-if="requests.length === 0">
                                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                                    Chưa có yêu cầu nào phù hợp.
                                </td>
                            </tr>
        
                            <tr 
                                v-else 
                                v-for="req in requests" 
                                :key="req.EmployerID"
                                class="bg-white border-b hover:bg-gray-50 transition-colors"
                            >
                                <td class="px-6 py-4 font-medium text-gray-900">
                                    #{{ req.EmployerID }}
                                </td>
                                <td class="px-6 py-4">{{ req.Email }}</td>
                                <td class="px-6 py-4">{{ req.Position }}</td>
                                <td class="px-6 py-4">
                                    <span :class="getStatusClass(req.ApprovalStatus)">
                                        {{ getStatusText(req.ApprovalStatus) }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 flex justify-center gap-2">
                                    
                                    <button
                                        v-if="req.ApprovalStatus !== 'Approved'"
                                        @click="handleAction(req.EmployerID, 'Approved')"
                                        class="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all"
                                    >
                                        Duyệt
                                    </button>
                                    
                                    <button
                                        v-if="req.ApprovalStatus !== 'Rejected'"
                                        @click="handleAction(req.EmployerID, 'Rejected')"
                                        class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-300 transition-all"
                                    >
                                        Từ chối
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>