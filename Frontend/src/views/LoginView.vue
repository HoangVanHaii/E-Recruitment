<script setup lang ="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRoute, useRouter } from 'vue-router';
import bgLogin from '../assets/bg-login.jpg';
import Notify from '../components/Notify.vue';

const router = useRouter();
const route = useRoute();
const message = ref<string>('');
const useAuth = useAuthStore(); 
const email = ref<string>('');
const password = ref<string>(''); 
const checked = ref<boolean>(false);
const messageNotify = ref<string>('');
const showNotify = ref<boolean>(false);
const isSuccessNotify = ref<boolean>(false);
const durationNotify = ref<number>(2000);

const role = computed(() => route.query.role as string || 'Candidate');

const roleName = computed(() => {
    return role.value === 'Employer' ? 'Vào Hệ thống quản trị' : 'Để tìm việc Nhanh chóng trên';  
})
const validateForm = () => {
    if (!email.value || !password.value) {
        message.value = 'Vui lòng điền đầy đủ thông tin!';
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        message.value = 'Email không hợp lệ!';
        return false;
    }
    if (!checked.value) {
        message.value = 'Vui lòng đồng ý với điều khoản!';
        return false;
    }
    return true;
}


const handleSubmit = async () => {

    if(!validateForm()) return;
    message.value = '';
    await useAuth.loginStore(email.value, password.value);
    if (useAuth.error) {
        showNotify.value = true;
        messageNotify.value = 'Đăng nhập thất bại!';
        isSuccessNotify.value = false;
        durationNotify.value = 2000;
        message.value = useAuth.message || 'Có lỗi xảy ra!';
    } else {
        if(useAuth.role === 'Employer') {
            router.push({ path: '/employer-dashboard'});
        }
        else if (useAuth.role === 'Admin') {
            router.push({ name: 'admin-dashboard'})
        }
        else {
            router.push({ 
                path: '/home', 
                state: { 
                    loginSuccess: true
                } 
            });
        }
        
        // message.value = useAuth.message || 'Đăng nhập thành công!';
    }
    // if(useAuth.isLogin && useAuth.role === 'Employer') {
    //     router.push('/home/employer');
    // }
    // if(useAuth.isLogin && useAuth.role === 'Candidate') {
    //     router.push('/home/candidate');
    // }
    
}
const goToRegister = () => {
    sessionStorage.setItem('role', role.value);
    router.push({ path: '/request-otp' });

}
onMounted(() => {
    const state = window.history.state;
    if(state && state.registerSuccess) {
        showNotify.value = true;
        messageNotify.value = 'Đăng ký tài khoản thành công!';
        isSuccessNotify.value = true;
        durationNotify.value = 2000;
        email.value = state.email || '';
        window.history.replaceState({}, '');
    }
})
</script>

<template>
    <Notify 
        v-if="showNotify"
        :message="messageNotify"
        :isSuccess="isSuccessNotify"
        :duration="durationNotify"
        @close="showNotify = false"
    />
    <div class="flex flex-col justify-center items-center min-h-screen bg-gray-100 bg-cover bg-center p-4" :style="{ backgroundImage: `url(${bgLogin})` }">
        <div class="flex flex-col md:flex-row justify-between items-center w-full max-w-5xl p-10 rounded-xl gap-10">
            <div class="w-full md:w-1/2 text-blue-700">
                <h1 class="text-3xl font-semibold leading-tight uppercase">ĐĂNG NHẬP {{ roleName }} <br> tìm việc - Finder</h1>
            </div>
            <div class="w-full md:w-[400px] bg-white p-8 rounded-lg shadow-lg border border-gray-100">
                <h2 class="text-center text-blue-700 text-xl border-b font-semibold">Tài khoản</h2>
                <div class="flex flex-col space-y-4">
                    <div class="relative" >
                        <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" v-model="email" placeholder="Nhập email" class="w-full pl-10 pr-4 py-2 border-b border-gray-300 focus:outline-none focus:border-blue-500">
                    </div>
                    <div class="relative">
                        <i class="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="password" @keyup.enter="handleSubmit" v-model="password" placeholder="Nhập mật khẩu" class="w-full pl-10 pr-10 py-2 border-b border-gray-300 focus:outline-none focus:border-blue-500">
                    </div>
                    <p class="text-red-500 text-sm text-center">{{ message }}</p>
                    <div class="flex items-start gap-2 pt-2">
                        <input type="checkbox" v-model="checked" class="mt-1 accent-blue-600">
                        <p class="text-sm text-gray-600 leading-tight">Bằng việc nhấn nút tiếp tục, tôi đồng ý chia sẻ thông tin cá nhân...</p>
                    </div>
                </div>
                <div class="mt-8 flex flex-col items-center gap-4">
                    <button @click="handleSubmit" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-md transition shadow-md">{{useAuth.loading ? 'Đang đăng nhập...' : 'Đăng nhập'}}</button>
                    <button class="text-blue-500 text-sm hover:underline">Quên mật khẩu</button>
                </div>
            </div>
        </div>
        <p class="mt-6 text-gray-700">Bạn chưa có tài khoản?<span @click="goToRegister" class="cursor-pointer text-orange-600 hover:underline ml-1 font-semibold">Đăng ký ngay</span></p>
    </div>

</template>