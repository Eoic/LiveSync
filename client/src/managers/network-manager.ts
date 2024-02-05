import { IncWebSocketMessage } from '../core/webSocket';

export interface WebSocketMessageObserver {
    update(message: IncWebSocketMessage): void;
};

export interface WebSocketMessageSubject {
    addObserver(observer: WebSocketMessageObserver): void;
    removeObserver(observer: WebSocketMessageObserver): void;
    notifyObservers(message: IncWebSocketMessage): void;
}

export class NetworkManager implements WebSocketMessageSubject {
    private socket?: WebSocket;
    private observers: Array<WebSocketMessageObserver> = [];

    public connect(url: string) {
        this.socket = new WebSocket(url);
        this.handleMessages();
    }

    public send(message: { type: string, payload: object }) {
        if (!this.socket) {
            console.error('WebSocket instance not initialzed.');
            return;
        }

        if (!this.socket.OPEN) {
            console.error('WebSocket connection is not open, cannot send message: ', message);
            return;   
        }

        this.socket.send(JSON.stringify(message));
    }

    private handleMessages() {
        if (!this.socket) {
            console.error('WebSocket instance not initialzed.');
            return;
        }

        this.socket.addEventListener('message', (event: MessageEvent) => {
            const message = JSON.parse(event.data) as IncWebSocketMessage;
            this.notifyObservers(message); 
        });

        this.socket.addEventListener('close', () => {
            console.warn('WebSocket connection closed.');
        });

        this.socket.addEventListener('error', () => {
            console.error('WebSocket connection failed with error.');
        });
    }

    public addObserver(observer: WebSocketMessageObserver) {
        this.observers.push(observer);
    }

    public removeObserver(observer: WebSocketMessageObserver) {
        this.observers = this.observers.filter((currentObserver) => currentObserver !== observer);
    }

    public notifyObservers(message: IncWebSocketMessage) {
        this.observers.forEach((observer) => observer.update(message));
    }
}