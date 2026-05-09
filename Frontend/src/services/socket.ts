import { io, Socket } from 'socket.io-client';

const URL = 'https://jobportal-rs7w.onrender.com'; 

export const socket: Socket = io(URL, {
    autoConnect: false,
});

export const connectSocket = (token: string) => {
    if (!socket.connected) {
        socket.auth = { token };
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};