import { defineStore } from "pinia";
import { getChatHistory, getConversations, getCountUnreadMessages } from "../services/message";
import { ref } from "vue";
import { socket } from "../services/socket";

export const useMessageStore = defineStore('message', () => {
    const conversations = ref<any[]>([]);
    const chatHistory = ref<any[]>([])
    const loading = ref<boolean>(false);
    const error = ref<string>('');
    
    const fetchConversations = async () => {
        try {
            loading.value = true;
            error.value = '';
            const response = await getConversations();
            conversations.value = response.data || [];
        } catch (err: any) {
            console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", err.response?.data);
            error.value = err.response?.data?.message || 'Đã xảy ra lỗi khi lấy danh sách cuộc trò chuyện';
        } finally {
            loading.value = false;
        }
    };
    const fetchChatHistory = async (otherUserId: number) => {
        try {
            loading.value = true;
            error.value = '';
            const response = await getChatHistory(otherUserId);
            chatHistory.value = response.data || [];
        } catch (err: any) {
            console.error("Lỗi khi lấy lịch sử trò chuyện:", err.response?.data);
            error.value = err.response?.data?.message || 'Đã xảy ra lỗi khi lấy lịch sử trò chuyện';
        } finally {
            loading.value = false;
        }
    };
    const initSocketListeners = () => {
        socket.off('receive_message');
        socket.off('message_sent_success');
        socket.off('message_error');
        socket.off('messages_marked_as_read');
        socket.off('mark_as_read_success');

        socket.on('receive_message', (messageData: any) => {
            chatHistory.value.push(messageData);
            fetchConversations();
            fetchUnreadCount();
        });
        socket.on('message_sent_success', (messageData: any) => {
            chatHistory.value.push(messageData);
            fetchConversations();
        });

        socket.on('message_error', (err: any) => {
            console.error("Lỗi gửi tin:", err.message);
            error.value = err.message || 'Không thể gửi tin nhắn';
        });

        socket.on('messages_marked_as_read', ({ readerId }) => {
            chatHistory.value.forEach(msg => {
                if (msg.sender_id !== readerId && !msg.is_read) {
                    msg.is_read = true;
                }
            });

            fetchConversations();
        });
        socket.on('mark_as_read_success', () => {
            fetchConversations();
            fetchUnreadCount();
        });
    };
    const markAsRead = (otherUserId: number) => {
        if (!socket.connected) return;
        socket.emit('mark_as_read', otherUserId);

        chatHistory.value.forEach(msg => {
            if (msg.sender_id === otherUserId && !msg.is_read) {
                msg.is_read = true;
            }
        });
    };
    const sendMessage = async (receiverId: number, content: string) => {
        if (!socket.connected) {
            error.value = 'Chưa kết nối đến máy chủ chat.';
            return;
        }

        socket.emit('send_message', {
            receiver_id: receiverId,
            content: content
        });
    };
    const unreadCount = ref<number>(0);

    const fetchUnreadCount = async () => {
        try {
            const res = await getCountUnreadMessages();
            unreadCount.value = res.data;
        } catch (err) {
            console.error(err);
        }
    }
    return {
        conversations,
        loading,
        error,
        fetchConversations,
        fetchChatHistory,
        chatHistory,
        initSocketListeners,
        markAsRead,
        sendMessage,
        unreadCount,
        fetchUnreadCount
    }
});