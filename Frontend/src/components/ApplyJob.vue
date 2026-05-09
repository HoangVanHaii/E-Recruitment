  <script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useResumeStore } from '../stores/resume';
  import type { iResumeList } from '../types/resume';
  import Notify from '../components/Notify.vue';
  import Loading from '../components/Loading.vue';
  
  const showNotify = ref<boolean>(false);
  const messageNotify = ref<string>('');
  const isSuccessNotify = ref(true);
  const loading = ref(false);
  import ResumeDetail from '../components/ResumeDetail.vue';
  const router = useRouter();
  const useResume = useResumeStore();
  
  const props = defineProps({
    isOpen: {
      type: Boolean,
      required: true
      },
    companyName: {
      type: String,
      required: true,
      default: 'Tên công ty'
    },
    jobTitle: {
      type: String,
      required: true,
      default: 'Tiêu đề công việc'
      }
  });
  
  const emit = defineEmits(['close', 'submit']);
  
  const cvList = ref<iResumeList[]>([]);
  const selectedCvId = ref<number | null>(1);
  
  const isOpenResume = ref(false);
  
  onMounted(async () => {
      loading.value = true;
      
      cvList.value = await useResume.getListResumeOfMeStore();
      if (useResume.error) {
            showNotify.value = true;
            isSuccessNotify.value = false;
            messageNotify.value = 'Lỗi tải danh sách CV'; 
      }

      loading.value = false;
  });
  
  const selectCv = (id: number) => {
    selectedCvId.value = id;
  };
  
  const handleClose = () => {
    emit('close');
  };
  
  const handleSubmit = () => {
    emit('submit', selectedCvId.value);
  };
  
  const handleCreateResume = () => {
    emit('close'); 
    router.push('/create-resume'); 
  };
  
  
  const handleViewCv = (id: number) => {
    selectedCvId.value = id;
    isOpenResume.value = true;
  };
  
  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  </script>
  <template>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isOpen" @click.self="handleClose" class="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Transition
            enter-active-class="transition duration-300 ease-out transform"
            enter-from-class="opacity-0 translate-y-6 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-200 ease-in transform"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-6 scale-95"
          >
            <div 
              class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300"
              :class="isOpenResume ? 'md:translate-x-[-120px] scale-95 opacity-70' : ''" 
            >
               <div class="relative bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 md:px-6 py-4 md:py-5">
                <button @click="handleClose"
                  class="absolute right-3 top-3 md:right-4 md:top-4 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                  <i class="fa-solid fa-xmark"></i>
                </button>
  
                <div class="flex items-start gap-3 md:gap-4 pr-6"> <div class="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-briefcase text-white"></i>
                  </div>
  
                  <div class="flex-1">
                    <span class="text-[10px] md:text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-semibold">
                      Ứng tuyển
                    </span>
                    <h2 class="text-lg md:text-xl font-bold mt-1 line-clamp-1"> Nộp hồ sơ ứng tuyển
                    </h2>
                    <p class="text-white/80 text-xs md:text-sm mt-0.5 line-clamp-1">
                      {{ jobTitle }} tại <b>{{ companyName }}</b>
                    </p>
                  </div>
                </div>
              </div>
  
              <div class="p-4 md:p-6 bg-slate-50 flex-1 overflow-y-auto">
                <div class="flex items-center justify-between mb-3 md:mb-4">
                  <h3 class="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Chọn CV của bạn
                  </h3>
                  <span class="text-[10px] md:text-xs bg-white px-2 py-1 rounded-full border text-gray-500">
                    {{ cvList.length }} CV
                  </span>
                </div>
  
                <div class="space-y-3">
                  <div
                    v-for="cv in cvList"
                    :key="cv.ResumeID"
                    class="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition border bg-white hover:shadow"
                    :class="selectedCvId === cv.ResumeID ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'"
                  >
                    <div
                      class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
                      @click="selectCv(cv.ResumeID)"
                    >
                      <img v-if="cv.AvatarUrl" :src="cv.AvatarUrl" class="w-full h-full object-cover" />
                      <i v-else class="fa-regular fa-file-lines text-gray-500 text-sm md:text-base"></i>
                    </div>
  
                    <div class="flex-1 min-w-0 cursor-pointer" @click="selectCv(cv.ResumeID)"> <h4 class="font-semibold text-sm md:text-base text-gray-900 truncate">
                        {{ cv.Title }}
                      </h4>
                      <span class="inline-flex items-center gap-1 text-[10px] md:text-xs mt-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-600">
                        <i class="fa-regular fa-clock"></i>
                        {{ formatDate(cv.CreatedAt) }}
                      </span>
                    </div>
  
                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        @click.stop="handleViewCv(cv.ResumeID)"
                        class="text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-gray-600 flex items-center gap-1"
                      >
                        <i class="fa-regular fa-eye"></i>
                        <span class="hidden sm:inline">Xem</span> </button>
  
                      <div
                        @click.stop="selectCv(cv.ResumeID)"
                        class="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center cursor-pointer"
                        :class="selectedCvId === cv.ResumeID ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'"
                      >
                        <i v-if="selectedCvId === cv.ResumeID" class="fa-solid fa-check text-white text-[10px] md:text-xs"></i>
                      </div>
                    </div>
                  </div>
                </div>
  
                <button
                  @click="handleCreateResume"
                  class="w-full mt-4 md:mt-5 py-3 md:py-4 rounded-2xl border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <i class="fa-solid fa-plus"></i>
                  Tạo CV mới
                </button>
              </div>
  
              <div class="p-3 md:p-4 border-t bg-white flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  @click="handleClose"
                  class="flex-1 py-2.5 md:py-3 rounded-xl border hover:bg-gray-50 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <i class="fa-solid fa-xmark"></i>
                  Huỷ
                </button>
  
                <button
                  @click="handleSubmit"
                  class="flex-1 py-2.5 md:py-3 rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 shadow-md flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <i class="fa-solid fa-paper-plane"></i>
                  Nộp hồ sơ
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
      <Transition
  enter-active-class="transition duration-300 ease-out"
  enter-from-class="opacity-0"
  enter-to-class="opacity-100"
  leave-active-class="transition duration-200 ease-in"
  leave-from-class="opacity-100"
  leave-to-class="opacity-0"
>
  <div
    v-if="isOpenResume"
    @click="isOpenResume = false"
    class="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex justify-end"
  >
  <Transition
  enter-active-class="transition duration-300 ease-out transform"
  enter-from-class="translate-x-full opacity-0"
  enter-to-class="translate-x-0 opacity-100"
  leave-active-class="transition duration-200 ease-in transform"
  leave-from-class="translate-x-0 opacity-100"
  leave-to-class="translate-x-full opacity-0"
>
  <div
    @click.stop
    class="relative h-screen w-full md:w-[55%] bg-white shadow-2xl overflow-y-auto"
  >
    <button
      @click="isOpenResume = false"
      class="fixed top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-gray-100 transition flex items-center justify-center"
    >
      <i class="fa-solid fa-xmark text-gray-700 text-lg"></i>
    </button>

    <div class="p-4">
      <ResumeDetail :id="selectedCvId" />
    </div>
  </div>
</Transition>
  </div>
</Transition>
     
    </Teleport>
    
  
    <Notify  
      v-if="showNotify" 
      :message="messageNotify" 
      :isSuccess="isSuccessNotify" 
      @close="showNotify = false"
    />
  
    <Loading 
      v-if="loading" 
    />
  </template>
  
  <style scoped>
  .slide-enter-active, .slide-leave-active { 
    transition: transform 0.3s ease; 
  }
  .slide-enter-from, .slide-leave-to { 
    transform: translateX(100%); 
  }
  </style>