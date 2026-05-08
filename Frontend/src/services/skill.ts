import api from "./api";

export const getAllSkillsDictionary = async () => {
    const response = await api.get('/skills');
    return response.data;
};