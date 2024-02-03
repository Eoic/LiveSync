import AlpineJS from 'alpinejs';
import { Serializer } from '../utils/serializer';

export class NetManager {
    static send(message: object) {
        const socket = AlpineJS.store('socket') as WebSocket;

        if (socket.OPEN) {
            const data = Serializer.camelToSnake(message);
            socket.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket connection is not open, cannot send position.');
        }
    }
}