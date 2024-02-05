/**
 * Message types.
 */
export enum IncMessageType {
    PlayerConnection = 'PLAYER_CONNECTION',
    PlayerConnections = 'PLAYER_CONNECTIONS',
    PlayerDisconnection = 'PLAYER_DISCONNECTION',
    PlayerPosition = 'PLAYER_POSITION',
    WorldState = 'WORLD_STATE',
};

export enum OutMessageType {
    PlayerPosition = 'PLAYER_POSITION',
};

/**
 * Defines message payload types coming
 * from the server over WebSocket connection.
 */
type IncMessages = {
    PlayerConnection: {
        type: IncMessageType.PlayerConnection,
        payload: {
            id: string
        }
    },

    PlayerDisconnection: {
        type: IncMessageType.PlayerDisconnection,
        payload: {
            id: string
        }
    },

    PlayerConnections: {
        type: IncMessageType.PlayerConnections,
        payload: {
            players: Array<{
                id: string,
                owner: boolean,
                position: {
                    x: number,
                    y: number,
                }
            }>
        }
    },

    PlayerPosition: {
        type: IncMessageType.PlayerPosition,
        payload: {
            id: string,
            position: {
                x: number,
                y: number
            }
        }
    },

    WorldState: {
        type: IncMessageType.WorldState,
        payload: {
            id: string,
            position: {
                x: number,
                y: number
            },
            lastProcessedInput: number
        }
    },
};

/**
 * Defines message payload types 
 * sent to the server over WebSocket connection.
 */
type OutMessages = {
    PlayerPosition: {
        type: OutMessageType.PlayerPosition
        payload: {
            id: string,
            seqId: number,
            position: {
                x: number,
                y: number
            }
        },
    },
};

type ValuesType<T> = T[keyof T];
export type IncWebSocketMessage = ValuesType<IncMessages>;
export type OutWebSocketMessage = ValuesType<OutMessages>;
