import AlpineJS, { AlpineComponent } from 'alpinejs';
import { EventManager, EventType } from '../../managers/event-manager';
import { WEB_SOCKET_URL } from '../../constants';
import { Position } from '../../core/types';

// FIXME: This is not an UI component, therefore should not be here.
type Connections = {
    players: Player[],
    socket: WebSocket | null,
    addPlayer: (player: Player) => void,
    removePlayer: (id: string) => void,
    updatePlayerPosition: (player: Player) => void,
    updateWorld: (worldState: WorldState) => void,
}

export type Player = {
    id: string,
    owner: boolean,
    position: { x: number, y: number },
}

enum PayloadType {
    UserConnect = 'USER_CONNECT',
    UserDisconnect = 'USER_DISCONNECT',
    Connections = 'CONNECTIONS',
    PlayerPosition = 'PLAYER_POSITION',
    WorldState = 'WORLD_STATE',
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

type PlayerPositionPayload = {
    payload: {
        id: string,
        position: {
            x: number,
            y: number,
        }
    }
} & BasePayload<PayloadType.PlayerPosition>;

type ConnectionsPayload = {
    payload: {
        users: Array<Player>
    }
} & BasePayload<PayloadType.Connections>;

type WorldState = {
    payload: {
        id: string,
        position: Position,
        last_processed_input: number
    }
} & BasePayload<PayloadType.WorldState>;

type Payloads = 
    UserConnectPayload | 
    UserDisconnectPayload | 
    ConnectionsPayload | 
    PlayerPositionPayload |
    WorldState;

export default (): AlpineComponent<Connections> => ({
    players: [],
    socket: null,

    init() {
        this.socket = new WebSocket(WEB_SOCKET_URL);
        
        this.socket.onmessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data) as Payloads;

            switch (data.type) {
                case 'USER_CONNECT':
                    this.addPlayer({ id: data.payload.id, owner: false, position: { x: 0, y: 0 } });
                    break;
                case 'USER_DISCONNECT':
                    this.removePlayer(data.payload.id);
                    break;
                case 'CONNECTIONS':
                    for (const user of data.payload.users) {
                        this.addPlayer(user);
                    }

                    break;
                case 'PLAYER_POSITION':
                    this.updatePlayerPosition({ id: data.payload.id, position: data.payload.position, owner: false })
                    break;

                case 'WORLD_STATE':
                    this.updateWorld(data.payload as any);
                    break;
                default:
                    console.warn('Unrecognized payload type:', data.type);
                    break;
            }
        }

        this.socket.onerror = (error) => {
            console.error('WebSocket error', error);
        }

        // Save socket object in a global scope.
        AlpineJS.store('socket', this.socket);
    },

    addPlayer(player) {
        this.players.push(player);
        EventManager.emit<Player>(EventType.PlayerAdd, player);
    },

    removePlayer(id) {
        const removedPlayerIndex = this.players.findIndex((player) => player.id === id);

        if (removedPlayerIndex === -1) {
            console.error('Could not find player to remove with id:', id);
            return;
        }
    
        const removedPlayer = this.players.splice(removedPlayerIndex, 1)[0];
        EventManager.emit<Player>(EventType.PlayerRemove, removedPlayer);
    },

    updatePlayerPosition(player) {
        EventManager.emit<Player>(EventType.PlayerPositionChange, player);
    },

    updateWorld(worldState) {
        EventManager.emit<WorldState>(EventType.WorldState, worldState);
    }
});
