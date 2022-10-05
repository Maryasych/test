import * as THREE from 'three';
import { World } from './World';
import { IUpdatable } from '../interfaces/IUpdatable';
export declare class Sky extends THREE.Object3D implements IUpdatable {
    updateOrder: number;
    private hemiLight;
    private skyMaterial;
    private world;
    private sky;
    private dirLight;
    constructor(world: World);
    update(timeScale: number): void;
}
