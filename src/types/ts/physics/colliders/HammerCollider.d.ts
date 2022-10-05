import * as CANNON from 'cannon';
import { ICollider } from '../../interfaces/ICollider';
export declare class HammerCollider implements ICollider {
    body: CANNON.Body;
    bottom: CANNON.Body;
    hammer: CANNON.HingeConstraint;
    mesh: THREE.Mesh;
    constructor(mesh: any);
    update: () => void;
}
