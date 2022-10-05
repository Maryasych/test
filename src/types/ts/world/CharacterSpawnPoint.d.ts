import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import * as THREE from 'three';
import { World } from './World';
import { Character } from '../characters/Character';
import { LoadingManager } from '../core/LoadingManager';
import { Scenario } from "./Scenario";
export declare class CharacterSpawnPoint implements ISpawnPoint {
    object: THREE.Object3D;
    scenario: Scenario;
    character: Character;
    playerId: string;
    constructor(object: THREE.Object3D, scenario?: Scenario, playerId?: string);
    spawn(loadingManager: LoadingManager, world: World): void;
}
