import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getAllSkillsDictionary } from '../services/skill';
import type { ISkillDictionary } from '../types/skill';

export const useSkillStore = defineStore('skill', () => {
    const loading = ref<boolean>(false);
    const error = ref<boolean>(false);
    
    const dictionary = ref<ISkillDictionary[]>([]);

    const fetchDictionaryStore = async () => {
        if (dictionary.value.length > 0) return;

        try {
            loading.value = true;
            error.value = false;
            const response = await getAllSkillsDictionary();
            dictionary.value = response.data || [];
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi lấy danh sách từ điển kỹ năng:", err);
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        error,
        dictionary,
        fetchDictionaryStore
    };
});