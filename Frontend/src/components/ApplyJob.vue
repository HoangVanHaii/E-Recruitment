  <script setup lang="ts">
  import { onMounted, ref, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useResumeStore } from '../stores/resume';
  import type { iResumeList, iResumeDetail } from '../types/resume';
  import Notify from '../components/Notify.vue';
  import Loading from '../components/Loading.vue';
  
  const showNotify = ref<boolean>(false);
  const messageNotify = ref<string>('');
  const isSuccessNotify = ref(true);
  const loading = ref(false);
  
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
  const candidate = ref<iResumeDetail | null>(null);
  
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
  
  const fetchResumeDetail = async (id: number) => {
    loading.value = true;
      candidate.value = await useResume.getResumeDetailByIdStore(id);
    console.log(candidate.value)
    
    if (useResume.error) {
      showNotify.value = true;
      isSuccessNotify.value = false;
      messageNotify.value = useResume.message || 'Có lỗi xảy ra khi tải hồ sơ';
    }
    loading.value = false;
  };
  
  const handleViewCv = (id: number) => {
    selectedCvId.value = id;
    isOpenResume.value = true;
  };
  
  watch([() => selectedCvId.value, () => isOpenResume.value], ([newId, isOpen]) => {
    if (newId && isOpen) {
      fetchResumeDetail(newId);
    }
  });
  
  const avatarSrc = computed(() => {
    return typeof candidate.value?.AvatarUrl === 'string' ? candidate.value.AvatarUrl : '/default-avatar.png';
  });
  
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
              :class="isOpenResume ? 'opacity-50 scale-95 md:translate-x-[-10%]' : ''" 
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
  
      <div 
        v-if="isOpenResume" 
        @click="isOpenResume = false"
        class="fixed inset-0 z-[9999]"
      ></div>
  
      <transition name="slide">
        <div 
          v-if="isOpenResume"
          class="fixed top-0 right-0 h-full w-full max-w-[650px] bg-gray-50 shadow-2xl z-[10000] flex flex-col"
        >
          <div class="bg-white px-4 md:px-6 py-4 border-b flex justify-between items-center sticky top-0 z-20">
            <h2 class="text-lg md:text-xl font-bold truncate pr-4">Hồ sơ ứng viên #{{ candidate?.resumeId }}</h2>
            <button @click="isOpenResume = false" class="text-gray-400 hover:bg-red-50 hover:text-red-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 text-xl">✕</button>
          </div>

          <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            
            <div class="bg-white border rounded-2xl p-4 md:p-5 flex gap-4 items-center">
              <img :src="avatarSrc" class="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-slate-50 shrink-0 shadow-sm" alt="avatar" />
              <div class="min-w-0"> 
                <h3 class="font-bold text-lg md:text-xl text-gray-900 truncate">{{ candidate?.title }}</h3>
                <p class="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <i class="fa-regular fa-clock"></i>
                  Tạo lúc: {{ formatDate(candidate?.createdAt) }}
                </p>
              </div>
            </div>

            <div v-if="candidate?.summary" class="bg-white border rounded-2xl p-4 md:p-5">
              <div class="flex items-center gap-2.5 mb-3">
                <i class="fa-solid fa-circle-user text-blue-600 text-lg"></i>
                <h4 class="font-bold text-base md:text-lg text-gray-900">Giới thiệu</h4>
              </div>
              <p class="text-sm md:text-base text-gray-700 leading-relaxed">
                {{ candidate?.summary }}
              </p>
            </div>

            <div v-if="candidate?.skills?.length" class="bg-white border rounded-2xl p-4 md:p-5">
              <div class="flex items-center gap-2.5 mb-4">
                <i class="fa-solid fa-code text-blue-600 text-lg"></i>
                <h4 class="font-bold text-base md:text-lg text-gray-900">Kỹ năng chuyên môn</h4>
              </div>
              <div class="flex flex-wrap gap-2.5">
                <div v-for="skill in candidate?.skills" :key="skill.skillId" 
                     class="border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2.5 bg-white shadow-sm hover:border-blue-300 transition-colors">
                  <span class="text-sm font-semibold text-gray-800">{{ skill.skillName }}</span>
                  <span v-if="skill.level" class="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wide">
                    {{ skill.level }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="candidate?.experience?.length" class="bg-white border rounded-2xl p-4 md:p-5">
              <div class="flex items-center gap-2.5 mb-6">
                <i class="fa-solid fa-building text-blue-600 text-lg"></i>
                <h4 class="font-bold text-base md:text-lg text-gray-900">Kinh nghiệm làm việc</h4>
              </div>
              
              <div class="relative border-l-2 border-gray-100 ml-2.5 md:ml-3 space-y-6 md:space-y-8">
                <div v-for="(exp, i) in candidate?.experience" :key="i" class="relative pl-6 md:pl-8">
                  <span class="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white border border-blue-200"></span>
                  
                  <div class="bg-slate-50 border border-gray-100 rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow">
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <h5 class="font-bold text-base md:text-lg text-gray-900">{{ exp.position }}</h5>
                      <span class="inline-flex items-center justify-center bg-blue-50 text-blue-600 text-xs md:text-sm font-semibold px-3 py-1 rounded-lg shrink-0">
                        {{ exp.startDate }} - {{ exp.isCurrent ? 'Hiện tại' : exp.endDate }}
                      </span>
                    </div>
                    <p class="text-gray-600 font-semibold text-sm md:text-base mb-3">{{ exp.companyName }}</p>
                    <p v-if="exp.description" class="text-sm md:text-base text-gray-700 whitespace-pre-line leading-relaxed">
                      {{ exp.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="candidate?.education?.length" class="bg-white border rounded-2xl p-4 md:p-5">
              <div class="flex items-center gap-2.5 mb-4">
                <i class="fa-solid fa-graduation-cap text-blue-600 text-lg"></i>
                <h4 class="font-bold text-base md:text-lg text-gray-900">Học vấn</h4>
              </div>
              
              <div class="space-y-4">
                <div v-for="(edu, i) in candidate?.education" :key="i" class="bg-slate-50 border border-gray-100 rounded-xl p-4 md:p-5 relative overflow-hidden">
                  <i class="fa-solid fa-building-columns absolute -right-4 -bottom-4 text-[80px] text-gray-200/50 z-0"></i>
                  
                  <div class="relative z-10">
                    <h5 class="font-bold text-base md:text-lg text-gray-900 mb-1">{{ edu.major }} <span v-if="edu.degree">({{ edu.degree }})</span></h5>
                    <p class="text-gray-600 font-semibold text-sm md:text-base mb-4">{{ edu.institution }}</p>
                    
                    <div class="flex flex-wrap justify-between items-center border-t border-gray-200 border-dashed pt-3 gap-2">
                      <div class="flex items-center gap-2 text-gray-500 text-xs md:text-sm font-medium">
                        <i class="fa-regular fa-calendar"></i>
                        <span>{{ edu.startDate }} - {{ edu.endDate || 'Hiện tại' }}</span>
                      </div>
                      <span v-if="edu.gpa" class="bg-green-50 text-green-600 border border-green-100 px-2.5 py-1 rounded-md text-xs md:text-sm font-bold tracking-wide">
                        GPA: {{ edu.gpa }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="candidate?.projects?.length" class="bg-white border rounded-2xl p-4 md:p-5">
              <div class="flex items-center gap-2.5 mb-4">
                <i class="fa-solid fa-folder-open text-blue-600 text-lg"></i>
                <h4 class="font-bold text-base md:text-lg text-gray-900">Dự án tham gia</h4>
              </div>
              
              <div class="space-y-4">
                <div v-for="(project, i) in candidate?.projects" :key="i" class="border border-gray-200 rounded-xl p-4 md:p-5">
                  <div class="flex justify-between items-start mb-2">
                    <h5 class="font-bold text-base text-gray-900">{{ project.projectName }}</h5>
                    <a v-if="project.link" :href="project.link" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                      <i class="fa-solid fa-link"></i> Link
                    </a>
                  </div>
                  <p class="text-sm font-semibold text-gray-600 mb-2">Vai trò: {{ project.role }}</p>
                  <p v-if="project.description" class="text-sm text-gray-700 mb-3">{{ project.description }}</p>
                  
                  <div class="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <span v-for="(tech, j) in project.technologies" :key="j" class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">
                      {{ tech }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </transition>
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