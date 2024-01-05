import './style.scss';
import { Scene } from './components/scene';
import { UIManager } from './managers/ui-manager';
import Connections from './components/ui/connections';

const uiManager = new UIManager();

uiManager.registerComponents([
    {
        stateName: 'connections',
        element: Connections,
    }
]);

new Scene();
