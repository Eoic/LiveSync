/**
 * Defines message payload types coming
 * from the server over WebSocket connection.
 */
namespace InMessages {
    namespace Types {
        export type Player = {
            id: string,
            owner: boolean,
            position: {
                x: number,
                y: number,
            }
        };
    };

    export type PlayerConnect = {
        type: 'PLAYER_CONNECT',
        payload: {
            id: string
        }
    };

    export type PlayerDisconnect = {
        type: 'PLAYER_DISCONNECT',
        payload: {
            id: string
        }
    };

    export type PlayerConnections = {
        type: 'PLAYER_CONNECTIONS',
        payload: {
            players: Array<Types.Player>
        }
    };

    export type PlayerPosition = {
        type: 'PLAYER_POSITION',
        payload: {
            id: string,
            position: {
                x: number,
                y: number
            }
        }
    };

    export type WorldState = {
        type: 'WORLD_STATE',
        payload: {
            id: string,
            position: {
                x: number,
                y: number
            },
            lastProcessedInput: number
        }
    };
};

/**
 * Defines message payload types 
 * send to the server over WebSocket connection.
 */
namespace OutMessages {
    export type PlayerPosition = {
        type: 'PLAYER_POSITION'
        payload: {
            id: string,
            seqId: number,
            position: {
                x: number,
                y: number
            }
        },
    };
};

export type { InMessages, OutMessages };
