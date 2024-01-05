import AlpineJS, { AlpineComponent } from 'alpinejs';

type Component = {
    stateName: string,
    element: () => AlpineComponent<any>,
};

export class UIManager {
    public registerComponents(components: Array<Component>) {
        for (const component of components) {
            AlpineJS.data(component.stateName, () => (component.element()));
        }

        AlpineJS.store('connections', [{ data: 41 }])
        AlpineJS.start();
    }
}