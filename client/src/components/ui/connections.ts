import AlpineJS, { AlpineComponent } from 'alpinejs';

type Connections = {
    players: { id: string }[],
    socket: WebSocket | null,
    addPlayer: (player: Player) => void,
    removePlayer: (id: string) => void
}

type Player = {
    id: string,
    owner: boolean,
}

enum PayloadType {
    UserConnect = 'USER_CONNECT',
    UserDisconnect = 'USER_DISCONNECT',
    Connections = 'CONNECTIONS',
}

type BasePayload<T> = {
    type: T
};

type UserConnectPayload = {
    payload: {
        id: string,
    }
} & BasePayload<PayloadType.UserConnect>;

type UserDisconnectPayload = {
    payload: {
        id: string,
    }
} & BasePayload<PayloadType.UserDisconnect>;

type ConnectionsPayload = {
    payload: {
        users: Array<{ id: string, owner: boolean }>
    }
} & BasePayload<PayloadType.Connections>;

type Payloads = UserConnectPayload | UserDisconnectPayload | ConnectionsPayload;

export default (): AlpineComponent<Connections> => ({
    players: [],
    socket: null,

    init() {
        this.socket = new WebSocket('ws://127.0.0.1:6789');

        this.socket.onmessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data) as Payloads;

            switch (data.type) {
                case 'USER_CONNECT':
                    this.addPlayer({ id: data.payload.id, owner: false });
                    break;
                case 'USER_DISCONNECT':
                    this.removePlayer(data.payload.id);
                    break;
                case 'CONNECTIONS':
                    for (const user of data.payload.users) {
                        this.addPlayer(user);
                    }

                    break;
                default:
                    console.warn('Unrecognized payload type:', data.type);
                    break;
            }
        }
    },

    addPlayer(player) {
        this.players.push(player);
    },

    removePlayer(id) {
        this.players = this.players.filter((player) => player.id !== id);
    }
});
