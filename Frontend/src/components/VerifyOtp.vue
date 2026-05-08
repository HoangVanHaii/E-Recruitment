<script setup lang="ts">
import { reactive, ref, computed, onUnmounted } from 'vue';  
import { useAuthStore } from '../stores/auth';
const inputOtp = reactive<string[]>(['', '', '', '', '', '']);
const inputRef = ref<HTMLInputElement[]>([]);
const useAuth = useAuthStore();
const message = ref<string>('');
const isError = ref<boolean>(false);
const countdown = ref<number>(0);
const timer = ref<number | null>(null);
const loading = ref<boolean>(false);
const emit = defineEmits(['close', 'success']);

const handleInput = (index: number, event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    if (!/^\d*$/.test(value)) {
        inputOtp[index] = '';
        return;
    }
    inputOtp[index] = value;
    if (value && index < inputOtp.length - 1) {
        inputRef.value[index + 1]?.focus();
    }

}
const handleKeydown = (event: KeyboardEvent, index: number) => {
    if (event.key === 'Backspace') {
        if(inputOtp[index] === '') {
            inputRef.value[index - 1]?.focus();
        }
        else {
            inputOtp[index] = '';
        }
    }
}
const handleTab = (index: number) => {
    if (inputOtp[index] !== '') {
        inputRef.value[index + 1]?.focus(); 
    }
}
const handleForcus = (index: number) => {
    const firstEmptyIndex = inputOtp.findIndex(digit => digit === '');
    if(firstEmptyIndex !== -1 && index > firstEmptyIndex) {
        inputRef.value[firstEmptyIndex].focus();
    }
    else if (firstEmptyIndex === -1 && index < 5) {
        inputRef.value[5]?.focus();
    }
}
const isOtpComplete = computed(() => {
    return inputOtp.every(digit => digit !== '');
}); 
const handleSubmit = async () => {
    const email = useAuth.emailUser;

    if (!email) {
        message.value = 'Email không tồn tại!';
        isError.value = true;
        return;
    }

    const otp = inputOtp.join('');
    const isValid = /^\d{6}$/.test(otp);

    if (!isValid) {
        isError.value = true;
        message.value = 'Vui lòng nhập đủ 6 số OTP';
        return;
    }
    loading.value = true;
    await useAuth.verifyOtpStore(email, otp);
    message.value = useAuth.message || (useAuth.error ? 'Xác thực thất bại!' : 'Xác thực thành công!');
    isError.value = useAuth.error;
    if (!useAuth.error) {
        handleSuccess();
    }
    loading.value = false;
}
const handleResend = async () => {
    if(countdown.value > 0) {
        return;
    }
    const email = useAuth.emailUser;
    if (!email) {
        message.value = 'Email không tồn tại!';
        isError.value = true;
        return;
    }
    startTimer();
    await useAuth.registerSendOtpStore(email);
    message.value = useAuth.message || (useAuth.error ? 'Gửi lại OTP thất bại!' : 'Gửi lại OTP thành công!');
    isError.value = useAuth.error;
    
}
const startTimer = async () => {
    countdown.value = 60;
    if (timer.value) clearInterval(timer.value);

    timer.value = setInterval(() => {
        if (countdown.value > 0) {
            countdown.value--;
        } else {
            if (timer.value) clearInterval(timer.value);
        }
    }, 1000);
}
onUnmounted(() => {
  if (timer.value) clearInterval(timer.value);
});
const closeForm = () => {
    inputOtp.forEach((_, index) => inputOtp[index] = '');
    message.value = '';
    isError.value = false;
    countdown.value = 0;
    if (timer.value) clearInterval(timer.value);
    emit('close')
}
const handleSuccess = () => {
    inputOtp.forEach((_, index) => inputOtp[index] = '');
    message.value = '';
    isError.value = false;
    countdown.value = 0;
    if (timer.value) clearInterval(timer.value);
    emit('success');
}
</script>
<template>
    <div @click="closeForm" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center">
        <div @click.stop class="py-[30px] px-[50px] bg-white shadow-lg rounded-[8px] flex flex-col gap-[6px]">
            <h2 class="text-2xl text-blue-700 font-semibold text-center mb-[20px]">XÁC THỰC OTP</h2>
            <div>
                <p class="text-lm">Nhập mã xác thực <span class="text-red-500">*</span></p>
                <div class="flex my-[15px]">
                    <input
                        v-for="(_, index) in inputOtp"
                        :key="index"
                        v-model="inputOtp[index]"
                        ref="inputRef"
                        type="text"
                        maxlength="1"
                        @focus="handleForcus(index)"
                        @input="handleInput(index, $event)"
                        @keydown.backspace="handleKeydown($event, index)"
                        @keydown.tab.prevent="handleTab(index)"
                        class="w-[50px] h-[50px] mx-1 text-center border rounded"
                    >
                </div>
                <p :class="isError ? 'text-red-500' : 'text-green-500'" class=" text-sm text-center">{{ message }}</p>
                <span v-if="countdown > 0" class="cursor-not-allowed underline text-gray-400">Gửi lại sau {{ countdown }}s</span>
                <span v-else @click="handleResend" class="text-blue-700 underline cursor-pointer">Gửi lại mã</span>
            </div>
            <div class="flex justify-center">
                <button
                    :disabled="!isOtpComplete"
                    @click="handleSubmit"
                    :class="[
                        'py-[4px] px-[15px] text-white rounded-[4px]',
                        isOtpComplete ? 'bg-blue-800 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
                    ]"
                >   
                    <i v-if="loading" class="fa fa-spinner fa-spin"></i>
                    <span>{{ !loading ? 'Xác Thực' : 'Đang xử lý' }}</span>
                </button>
            </div>
        </div>
    </div>

</template>