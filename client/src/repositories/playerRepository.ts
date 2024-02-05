import { Player } from '../entities';

class PlayerRepository {
    private players: Map<string, Player>;

    constructor() {
        this.players = new Map();
    }

    public createPlayer() {
    }

    public getPlayer(id: string) {
        return this.players.get(id);
    }

    public removePlayer(id: string) {
        this.players.delete(id);
    }
};