
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useCandidateStore } from '../stores/candidate';
import { useSkillStore } from '../stores/skill';
import type { ICandidateSkill } from '../types/skill';
import Notify from '../components/Notify.vue';
import Loading from '../components/Loading.vue';

const candidateStore = useCandidateStore();
const skillStore = useSkillStore();

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const activeTab = ref('ai');
const aiRawText = ref('');
const searchQuery = ref('');
const showDropdown = ref(false);

// Mảng local để thao tác trước khi lưu
const localSkills = ref<ICandidateSkill[]>([]);

const showToast = (msg: string, success: boolean) => {
    messageNotify.value = msg; isSuccessNotify.value = success; showNotify.value = true;
    setTimeout(() => showNotify.value = false, 3000);
};

// 1. LOAD DỮ LIỆU BAN ĐẦU
onMounted(async () => {
    // Load kỹ năng hiện tại của ứng viên
    await candidateStore.fetchSkillsStore();
    // Copy sang mảng local
    localSkills.value = candidateStore.candidateSkills.map(s => ({
        skillId: (s as any).SkillID || s.skillId,
        skillName: (s as any).SkillName || s.skillName,
        level: (s as any).SkillLevel || s.level || 'Khá',
        isNew: false
    }));

    // Load từ điển cho tab thủ công
    await skillStore.fetchDictionaryStore();
});

// 2. LOGIC TÌM KIẾM THỦ CÔNG
const filteredDictionary = computed(() => {
    if (!searchQuery.value.trim()) return [];
    return skillStore.dictionary.filter(s => 
        s.SkillName.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
        !localSkills.value.some(ls => ls.skillId === s.SkillID)
    ).slice(0, 10);
});

const selectManualSkill = (item: any) => {
    localSkills.value.unshift({
        skillId: item.SkillID,
        skillName: item.SkillName,
        level: 'Khá',
        isNew: false
    });
    searchQuery.value = '';
    showDropdown.value = false;
};

// 3. LOGIC PHÂN TÍCH AI (ĐÃ NÂNG CẤP UX)
const handleAIAnalyze = async () => {
    const analyzed = await candidateStore.analyzeSkillsWithAIStore(aiRawText.value);
    
    // Trường hợp 1: Lỗi API, AI bận hoặc rớt mạng (hàm trả về null)
    if (!analyzed) {
        showToast(candidateStore.message || 'Lỗi hệ thống AI, vui lòng thử lại sau!', false);
        return;
    }

    // Trường hợp 2: AI chạy xong nhưng không tìm thấy chữ nào liên quan đến công việc (Toàn rác)
    if (analyzed.length === 0) {
        showToast('Không tìm thấy kỹ năng chuyên môn nào hợp lệ. Vui lòng nhập lại!', false);
        return;
    }

    // Trường hợp 3: AI tìm thấy kỹ năng hợp lệ
    let addedCount = 0;
    analyzed.forEach((s: any) => {
        // Kiểm tra xem kỹ năng này đã được chọn trước đó chưa (chống trùng lặp)
        if (!localSkills.value.some(ls => ls.skillName.toLowerCase() === s.skillName.toLowerCase())) {
            localSkills.value.unshift({
                skillId: s.skillId,
                skillName: s.skillName,
                level: 'Khá',
                isNew: s.isNew
            });
            addedCount++;
        }
    });

    aiRawText.value = ''; 
    
    if (addedCount > 0) {
        showToast(`AI đã bóc tách và thêm thành công ${addedCount} kỹ năng!`, true);
    } else {
        showToast('AI có tìm thấy kỹ năng, nhưng chúng đã có sẵn trong danh sách của bạn rồi!', true);
    }
};

// 4. LƯU VÀO DB
const handleSave = async () => {
    const success = await candidateStore.saveSkillsStore(localSkills.value);
    if (success) showToast('Cập nhật kỹ năng thành công!', true);
    else showToast(candidateStore.message || 'Lỗi khi lưu!', false);
};

// Đóng dropdown khi bấm ngoài
watch(searchQuery, (newVal) => { if(!newVal) showDropdown.value = false; });
</script>
<template>
    <div class="w-full">
        <Notify v-if="showNotify" :message="messageNotify" :isSuccess="isSuccessNotify" @close="showNotify = false" />
        <Loading v-if="candidateStore.loading || skillStore.loading" />

        <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 relative overflow-hidden">
            <div class="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-[#4f46e5] rounded-full"></div>
                    <h2 class="text-lg font-extrabold text-gray-800">Kỹ năng chuyên môn</h2>
                </div>
            </div>

            <div class="flex bg-gray-100 p-1 rounded-xl mb-8 w-fit">
                <button @click="activeTab = 'ai'" 
                    :class="activeTab === 'ai' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'"
                    class="px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                    <i class="fas fa-magic"></i> Quét bằng AI
                </button>
                <button @click="activeTab = 'manual'" 
                    :class="activeTab === 'manual' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-500'"
                    class="px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                    <i class="fas fa-keyboard"></i> Thêm thủ công
                </button>
            </div>

            <div v-if="activeTab === 'ai'" class="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <p class="text-sm text-gray-500 mb-4 italic">Hãy liệt kê các kỹ năng của bạn (ngăn cách bằng dấu phẩy) hoặc copy đoạn mô tả bản thân vào đây để AI tự bóc tách.</p>
                <div class="relative">
                    <textarea v-model="aiRawText" rows="4" 
                        class="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none text-sm leading-relaxed"
                        placeholder="VD: Mình có kinh nghiệm làm việc với Vue 3, TypeScript, thiết kế DB với MongoDB và biết triển khai Docker..."></textarea>
                    <button @click="handleAIAnalyze" :disabled="!aiRawText.trim()"
                        class="absolute bottom-3 right-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all">
                        Phân tích bằng AI
                    </button>
                </div>
            </div>

            <div v-else class="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <p class="text-sm text-gray-500 mb-4 italic">Tìm kiếm và chọn kỹ năng từ danh sách tiêu chuẩn của hệ thống.</p>
                <div class="relative max-w-md">
                    <div class="flex gap-2">
                        <div class="relative flex-1">
                            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input type="text" v-model="searchQuery" @focus="showDropdown = true"
                                class="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-[#1a237e] outline-none transition-all text-sm"
                                placeholder="Gõ để tìm kỹ năng (VD: Java, Photoshop...)">
                            
                            <div v-if="showDropdown && filteredDictionary.length > 0" 
                                class="absolute z-20 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-xl max-h-60 overflow-y-auto py-2">
                                <button v-for="item in filteredDictionary" :key="item.SkillID"
                                    @click="selectManualSkill(item)"
                                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between group">
                                    <span class="font-medium text-gray-700">{{ item.SkillName }}</span>
                                    <i class="fas fa-plus text-gray-300 group-hover:text-indigo-500 text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-10 border-t border-gray-50 pt-8">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="font-bold text-gray-700 flex items-center gap-2">
                        Danh sách kỹ năng đã chọn 
                        <span class="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{{ localSkills.length }}</span>
                    </h3>
                    <button v-if="localSkills.length > 0" @click="localSkills = []" class="text-xs text-red-500 hover:underline font-bold">Xóa tất cả</button>
                </div>

                <div v-if="localSkills.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="(skill, index) in localSkills" :key="index" 
                        class="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-bold text-[#1a237e] text-sm">{{ skill.skillName }}</span>
                                <span v-if="skill.isNew" class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Mới</span>
                            </div>
                            <div class="flex gap-1">
                                <button v-for="lvl in ['Cơ bản', 'Khá', 'Tốt', 'Rất tốt']" :key="lvl"
                                    @click="skill.level = lvl"
                                    :class="skill.level === lvl ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'"
                                    class="text-[10px] px-2 py-1 border rounded-md font-bold transition-all">
                                    {{ lvl }}
                                </button>
                            </div>
                        </div>
                        <button @click="localSkills.splice(index, 1)" class="ml-4 text-gray-300 hover:text-red-500 transition-colors">
                            <i class="fas fa-times-circle"></i>
                        </button>
                    </div>
                </div>
                <div v-else class="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                        <i class="fas fa-tools text-gray-300"></i>
                    </div>
                    <p class="text-sm text-gray-400 font-medium">Chưa có kỹ năng nào được chọn</p>
                </div>
            </div>

            <div class="flex justify-center pt-10 mt-6 border-t border-gray-50">
                <button @click="handleSave" :disabled="localSkills.length === 0 || candidateStore.loading"
                    class="h-12 px-16 bg-[#14205c] text-white font-black rounded-xl hover:bg-[#1a237e] transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50">
                    Lưu Hồ Sơ Kỹ Năng
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>