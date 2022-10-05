import * as CANNON from 'cannon';
import { ICollider } from '../../interfaces/ICollider';
export declare class KettlebellCollider implements ICollider {
    body: CANNON.Body;
    hitch: CANNON.Body;
    mesh: THREE.Mesh;
    kettlebell: CANNON.HingeConstraint;
    constructor(mesh: any);
    update: () => void;
}
