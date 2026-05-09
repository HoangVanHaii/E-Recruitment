<template>
  <div class="relative">
    
    <Loading v-if="loading || authStore.loading" />
    
    <Notify 
      v-if="showNotify" 
      :message="messageNotify" 
      :isSuccess="isSuccessNotify" 
      @close="showNotify = false"
    />

    <div class="p-8 bg-white rounded-2xl shadow-lg border border-gray-100 max-w-2xl mx-auto font-sans mt-4">
      <h2 class="text-2xl font-black text-[#14205c] mb-8 uppercase tracking-tight border-b-4 border-blue-600 pb-2 inline-block">
        Tài khoản cá nhân
      </h2>

      <div class="mb-8">
        <label class="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Địa chỉ Email</label>
        <div class="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <i class="fas fa-envelope text-blue-500"></i>
          <span class="text-gray-700 font-bold">{{ authStore.user?.Email }}</span>
          <i class="fas fa-check-circle text-green-500 ml-auto"></i>
        </div>
      </div>

      <div v-if="!showChangeForm" class="pt-4">
        <button @click="showChangeForm = true" 
                class="flex items-center justify-center gap-2 w-full py-4 bg-[#5664d2] text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
          <i class="fas fa-key"></i> ĐỔI MẬT KHẨU
        </button>
      </div>

      <transition name="fade">
        <div v-if="showChangeForm" class="space-y-5 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mt-6">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-bold text-blue-800 uppercase text-sm">Thiết lập mật khẩu mới</h3>
            <button @click="showChangeForm = false" class="text-gray-400 hover:text-red-500"><i class="fas fa-times"></i></button>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Mật khẩu hiện tại</label>
            <input type="password" v-model="form.old" placeholder="••••••••" 
                   class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all shadow-sm">
            <button @click="handleRequestForgot" class="text-[11px] text-blue-600 font-bold mt-1 hover:underline">
              Quên mật khẩu cũ?
            </button>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Mật khẩu mới</label>
            <input type="password" v-model="form.new" placeholder="Nhập mật khẩu mới" 
                   class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none shadow-sm">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Xác nhận mật khẩu mới</label>
            <input type="password" v-model="form.confirm" placeholder="Nhập lại mật khẩu mới" 
                   class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none shadow-sm">
          </div>

          <button @click="handleChangePassword" :disabled="authStore.loading"
                  class="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
            {{ authStore.loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN THAY ĐỔI' }}
          </button>
        </div>
      </transition>

      <div class="p-8 bg-white rounded-2xl shadow-sm border border-red-100 mt-8 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <h2 class="text-xl font-black text-red-600 mb-2 uppercase tracking-tight">
          Vùng nguy hiểm
        </h2>
        <p class="text-sm text-gray-500 mb-4">
          Xóa tài khoản sẽ gỡ bỏ toàn bộ hồ sơ, thông tin cá nhân và lịch sử ứng tuyển của sếp vĩnh viễn. Hành động này không thể hoàn tác.
        </p>
        <button @click="handleRequestDelete" :disabled="loading" class="px-6 py-3 bg-white border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
          <i class="fas fa-trash-alt mr-2"></i> YÊU CẦU XÓA TÀI KHOẢN
        </button>
      </div>

      <div v-if="step > 0" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
        <div class="py-[30px] px-[50px] bg-white shadow-2xl rounded-[20px] flex flex-col gap-[6px] max-w-sm w-full animate-in zoom-in duration-300">
            
            <div v-if="step === 1">
              <h2 class="text-2xl font-black text-center mb-[10px] uppercase text-blue-700">
                Xác thực tài khoản
              </h2>
              <p class="text-center text-xs text-gray-500 mb-4">Mã OTP đã được gửi đến email của sếp</p>
              
              <div class="flex justify-center my-[15px]">
                  <input v-for="(_, index) in inputOtp" :key="index" v-model="inputOtp[index]" ref="inputRef"
                         type="text" maxlength="1" @focus="handleFocus(index)" @input="handleInput(index, $event)" @keydown.backspace="handleKeydown($event, index)"
                         class="w-[45px] h-[55px] mx-1 text-center border-2 border-gray-100 rounded-xl text-xl font-black focus:border-blue-500 outline-none transition-all text-blue-700">
              </div>
              
              <p :class="isError ? 'text-red-500' : 'text-green-500'" class="text-sm text-center font-bold">{{ otpMessage }}</p>
              
              <div class="text-center mt-2">
                <span v-if="countdown > 0" class="text-gray-400 text-xs font-bold uppercase">Gửi lại sau {{ countdown }}s</span>
                <span v-else @click="handleRequestForgot" class="underline cursor-pointer text-xs font-bold uppercase text-blue-700">Gửi lại mã</span>
              </div>

              <div class="flex gap-3 mt-6">
                  <button @click="closeModal" class="flex-1 py-3 text-gray-500 font-bold rounded-xl bg-gray-100">HỦY</button>
                  <button :disabled="!isOtpComplete || loading" @click="handleVerifyOtpForgot"
                          class="flex-1 py-3 text-white rounded-xl font-black transition-all shadow-lg"
                          :class="!isOtpComplete ? 'bg-gray-300 shadow-none' : 'bg-blue-600 shadow-blue-200'">   
                      <i v-if="loading" class="fa fa-spinner fa-spin"></i>
                      <span>XÁC THỰC</span>
                  </button>
              </div>
            </div>

            <div v-else-if="step === 2" class="space-y-4">
                <h2 class="text-2xl text-green-600 font-black text-center mb-[10px] uppercase">Mật khẩu mới</h2>
                <p class="text-center text-xs text-gray-500">Đặt lại mật khẩu cho tài khoản của sếp</p>

                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Mật khẩu mới</label>
                  <input type="password" v-model="formReset.password" placeholder="Tối thiểu 6 ký tự" 
                         class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none shadow-sm">
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Xác nhận lại</label>
                  <input type="password" v-model="formReset.confirm" placeholder="Nhập lại mật khẩu" 
                         class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none shadow-sm">
                </div>

                <div class="flex gap-3 mt-4">
                  <button @click="closeModal" class="flex-1 py-3 text-gray-500 font-bold rounded-xl bg-gray-100">HỦY</button>
                  <button @click="handleFinalReset" :disabled="loading"
                          class="flex-[2] py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100">
                    {{ loading ? 'ĐANG CẬP NHẬT...' : 'HOÀN TẤT ĐẶT LẠI' }}
                  </button>
                </div>
            </div>

            <div v-if="step === 3" class="space-y-3">
                <h2 class="text-2xl text-red-600 font-black text-center mb-[5px] uppercase">Xác nhận xóa</h2>
                <p class="text-center text-xs text-gray-500 mb-2">Mã OTP đã được gửi đến email. Vui lòng nhập mật khẩu và mã OTP để hoàn tất.</p>

                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Mật khẩu hiện tại</label>
                  <input type="password" v-model="deletePassword" placeholder="Nhập mật khẩu để xác nhận" 
                         class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none shadow-sm">
                </div>

                <div class="mt-2">
                  <label class="block text-xs font-bold text-gray-600 mb-2 uppercase text-center">Mã OTP (6 số)</label>
                  <div class="flex justify-center mb-[10px]">
                      <input v-for="(_, index) in inputOtp" :key="index" v-model="inputOtp[index]" ref="inputRef"
                             type="text" maxlength="1" @focus="handleFocus(index)" @input="handleInput(index, $event)" @keydown.backspace="handleKeydown($event, index)"
                             class="w-[45px] h-[55px] mx-1 text-center border-2 border-gray-100 rounded-xl text-xl font-black text-red-600 focus:border-red-500 outline-none transition-all">
                  </div>
                </div>

                <p :class="isError ? 'text-red-500' : 'text-green-500'" class="text-sm text-center font-bold">{{ otpMessage }}</p>

                <div class="text-center mt-1">
                  <span v-if="countdown > 0" class="text-gray-400 text-xs font-bold uppercase">Gửi lại OTP sau {{ countdown }}s</span>
                  <span v-else @click="handleRequestDelete" class="underline cursor-pointer text-xs font-bold uppercase text-red-600">Gửi lại mã OTP</span>
                </div>

                <div class="flex gap-3 mt-4">
                    <button @click="closeModal" class="flex-1 py-3 text-gray-500 font-bold rounded-xl bg-gray-100">HỦY</button>
                    <button @click="handleVerifyDelete" :disabled="loading || !isOtpComplete || !deletePassword"
                            class="flex-1 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 disabled:shadow-none">
                      <i v-if="loading" class="fa fa-spinner fa-spin"></i>
                      <span v-else>XÓA VĨNH VIỄN</span>
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';

const authStore = useAuthStore();

const showChangeForm = ref(false);
const step = ref(0); 
const loading = ref(false);
const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(false);

const triggerNotify = (msg: string, success: boolean) => {
    messageNotify.value = msg;
    isSuccessNotify.value = success;
    showNotify.value = true;
};

const form = reactive({ old: '', new: '', confirm: '' });
const formReset = reactive({ password: '', confirm: '' });
const deletePassword = ref('');

const inputOtp = reactive<string[]>(['', '', '', '', '', '']);
const inputRef = ref<HTMLInputElement[]>([]);
const otpMessage = ref('');
const isError = ref(false);
const countdown = ref(0);
let timer: any = null;

const closeModal = () => {
    step.value = 0;
    inputOtp.splice(0, 6, '', '', '', '', '', '');
    otpMessage.value = '';
    isError.value = false;
    deletePassword.value = '';
    formReset.password = '';
    formReset.confirm = '';
    if (timer) clearInterval(timer);
};

const handleChangePassword = async () => {
    if (!form.old || !form.new || !form.confirm) return triggerNotify("Vui lòng nhập đủ thông tin!", false);
    if (form.new !== form.confirm) return triggerNotify("Mật khẩu xác nhận không khớp!", false);
    
    const ok = await authStore.changePasswordStore(form.old, form.new);
    if (ok) {
        triggerNotify("Đổi mật khẩu thành công!", true);
        showChangeForm.value = false;
        form.old = ''; form.new = ''; form.confirm = '';
    } else {
        triggerNotify(authStore.message, false);
    }
};

const handleRequestForgot = async () => {
    const email = authStore.user?.Email;
    if (!email) return triggerNotify("Không tìm thấy email!", false);

    loading.value = true;
    const ok = await authStore.forgotPasswordSendOtpStore(email); 
    if (ok) {
        closeModal();
        step.value = 1;
        startTimer();
        triggerNotify("Mã OTP đã gửi về email sếp!", true);
    } else {
        triggerNotify(authStore.message, false);
    }
    loading.value = false;
};

const handleVerifyOtpForgot = async () => {
    const email = authStore.user?.Email;
    if (!email) return;

    const otp = inputOtp.join('');
    loading.value = true;
    const ok = await authStore.verifyOtpStore(email, otp);
    
    if (ok) {
        otpMessage.value = "";
        isError.value = false;
        step.value = 2; 
    } else {
        otpMessage.value = authStore.message;
        isError.value = true;
    }
    loading.value = false;
};

const handleFinalReset = async () => {
    if (formReset.password !== formReset.confirm) return triggerNotify("Mật khẩu xác nhận không khớp!", false);
    if (formReset.password.length < 6) return triggerNotify("Mật khẩu quá ngắn!", false);

    loading.value = true;
    const ok = await authStore.forgotPasswordStore(formReset.password);
    
    if (ok) {
        triggerNotify("Mật khẩu mới đã được cập nhật thành công!", true);
        closeModal();
        showChangeForm.value = false;
    } else {
        triggerNotify(authStore.message, false);
    }
    loading.value = false;
};

// --- GỘP LUỒNG XÓA TÀI KHOẢN VÀO LÀM MỘT ---
const handleRequestDelete = async () => {
    loading.value = true;
    const ok = await authStore.requestOtpAuthStore(); // Gửi thẳng OTP luôn
    if (ok) {
        step.value = 3; // Mở luôn form có cả nhập Pass và OTP
        startTimer();
        triggerNotify("Đã gửi mã xác nhận xóa tài khoản!", true);
    } else {
        triggerNotify(authStore.message, false);
    }
    loading.value = false;
};

const handleVerifyDelete = async () => {
    if (!deletePassword.value) return triggerNotify("Sếp phải nhập mật khẩu để xác nhận!", false);
    const otp = inputOtp.join('');
    
    loading.value = true;
    const ok = await authStore.deleteAccountStore(deletePassword.value, otp); // Chốt sổ tại đây
    
    if (ok) {
        triggerNotify("Đã xóa tài khoản thành công! Tạm biệt sếp.", true);
        closeModal();
    } else {
        otpMessage.value = authStore.message;
        isError.value = true;
    }
    loading.value = false;
};

const handleInput = (index: number, event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    if (!/^\d*$/.test(value)) { inputOtp[index] = ''; return; }
    inputOtp[index] = value;
    if (value && index < 5) inputRef.value[index + 1]?.focus();
};
const handleKeydown = (event: KeyboardEvent, index: number) => {
    if (event.key === 'Backspace' && !inputOtp[index] && index > 0) inputRef.value[index - 1]?.focus();
};
const handleFocus = (index: number) => {
    const firstEmpty = inputOtp.findIndex(d => d === '');
    if (firstEmpty !== -1 && index > firstEmpty) inputRef.value[firstEmpty].focus();
};
const isOtpComplete = computed(() => inputOtp.every(d => d !== ''));

const startTimer = () => {
    countdown.value = 60;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        if (countdown.value > 0) countdown.value--;
        else clearInterval(timer);
    }, 1000);
};

onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>