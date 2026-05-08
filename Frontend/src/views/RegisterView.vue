<script setup lang="ts">
import Notify from '../components/Notify.vue';
import router from '../router';
import VerifyOtp from '../components/VerifyOtp.vue';
import PasswordForm from '../components/PasswordForm.vue';
import { useRoute } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';


const route = useRoute();
const showOtp = ref<boolean>(false);
const useAuth = useAuthStore();

const email = ref<string>('');
const message = ref<string>('');
const checked = ref<boolean>(false);
const isError = ref<boolean>(false);
const showFormPassword = ref<boolean>(false);

const currentRole = ref<string>('Candidate'); 

const computedRole = computed(() => {
    return currentRole.value === 'Employer' ? 'NHÀ TUYỂN DỤNG' : 'ỨNG VIÊN';
});
onMounted(() => {
    checked.value = false;
    message.value = '';
    isError.value = false;
    const roleFromQuery = route.query.role as string;
    const roleFromSession = sessionStorage.getItem('role');
    let finalRole: string;

    if (roleFromQuery === 'Employer' || roleFromQuery === 'Candidate') {
        finalRole = roleFromQuery;
    } else if (roleFromSession === 'Employer' || roleFromSession === 'Candidate') {
        finalRole = roleFromSession;
    } else {
        finalRole = 'Candidate';
    }
    currentRole.value = finalRole;
    sessionStorage.setItem('role', finalRole);
})
const handleVerifySucsess = () => {
    showOtp.value = false;
    showFormPassword.value = true;
}   
const handleSubmit = async () => {
    message.value = '';
    isError.value = false;
    if (!checked.value) {
        message.value = 'Vui lòng đồng ý với điều khoản!';
        isError.value = true;
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        message.value = 'Email không hợp lệ!';
        isError.value = true;
        return;
    }
    await useAuth.registerSendOtpStore(email.value);
    if (useAuth.error) {
        isError.value = true;
        message.value = useAuth.message || 'Có lỗi xảy ra!';
    } else {
        isError.value = false;
        message.value = useAuth.message || 'Gửi OTP thành công!';
        showOtp.value = true;

    }
}
const showNotify = ref<boolean>(false);
const messageNotify = ref<string>('');

const isSuccessNotify = ref<boolean>(false);
const durationNotify = ref<number>(2000);

const handleRegisterSucsess = () => {
    router.push({
        path: '/login',
        state: {
            registerSuccess: true,
            email: email.value
        }
    })
}
</script>
<template>
    <Notify 
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        :duration="durationNotify"
        @close="showNotify = false"
    />
    <div class="min-h-screen flex items-center justify-center pt-[40px] bg-gray-200">
        <div class="w-[70%] py-[50px] flex flex-col shadow-sm items-center rounded-[10px] bg-white ">
              <h2 class="text-center text-blue-600 text-3xl font-semibold">ĐĂNG KÝ TÀI KHOẢN {{ computedRole }}</h2>  
              <form @submit.prevent="handleSubmit" class="flex flex-col gap-[40px] w-[95%] px-[50px] py-[20px]">
                <div class="w-full flex flex-col gap-2 ">
                    <label class="text-gray-700 text-xl">Email liên hệ <span class="text-red-500">*</span></label>
                    <input type="email" v-model="email" placeholder="Nhập email của bạn" :class="isError ? 'border-red-500' : 'border-gray-300'" class="w-full px-4 py-3 rounded-[10px] border focus:outline-none focus:border-blue-400">
                    <p v-if="message" class="text-sm" :class="isError ? 'text-red-500 ml-[2px]' : 'text-green-500 mx-auto'">{{ message }}</p>
                </div>
                <div class="flex justify-center items-center gap-2 text-sm text-gray-700 ">
                    <input type="checkbox" v-model="checked" class="w-5 h-5 accent-blue-500 cursor-pointer">
                    <span class="text-gray-700 text-lg">Tôi đã đọc và đồng ý <a href="" class="text-blue-700">Điều khoản dịch vụ</a> và <a href="" class="text-blue-700">Chính sách bảo mật</a> của TimviecFinder.vn</span>
                </div>
                <div class="flex justify-center p-[3px]">
                    <button class="bg-blue-900 text-white bold px-7 py-1 rounded-[5px] text-xl" :disabled="useAuth.loading" :class="{ 'opacity-70 cursor-not-allowed': useAuth.loading }"  >
                        <i v-if="useAuth.loading"  class="fa fa-spinner fa-spin"></i>
                        <span>{{ !useAuth.loading ? 'Đăng ký' : 'Đang xử lý' }}</span>
                    </button>
                </div>
              </form>    
        </div>
    </div>
    <VerifyOtp 
        v-if="showOtp" 
        @close="showOtp = false"
        @success="handleVerifySucsess" 
    />
    <PasswordForm 
        v-if="showFormPassword"
        @close="showFormPassword = false"
        @success="handleRegisterSucsess"
    />

</template>