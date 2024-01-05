import { AlpineComponent } from 'alpinejs';

type Connections = {
    counter: number,
    players: { id: string }[],
    add: () => void,
    remove: () => void
}

export default (): AlpineComponent<Connections> => ({
    counter: 0,
    players: [],

    init() {
        console.log('Component mounted...');
    },

    add() {
        this.players.push({ id: `Player ${this.counter}` });
        this.counter++;
    },

    remove() {
        this.players.pop();
    }
});
