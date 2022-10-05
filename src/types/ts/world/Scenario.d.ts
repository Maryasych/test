import { CharacterSpawnPoint } from './CharacterSpawnPoint';
import { World } from '../world/World';
import { LoadingManager } from '../core/LoadingManager';
import * as THREE from 'three';
export declare class Scenario {
    id: string;
    name: string;
    spawnAlways: boolean;
    default: boolean;
    world: World;
    descriptionTitle: string;
    descriptionContent: string;
    private rootNode;
    private spawnPoints;
    private invisible;
    private initialCameraAngle;
    localPlayer: CharacterSpawnPoint;
    characterSpawnPointList: CharacterSpawnPoint[];
    remoteData: any;
    constructor(root: THREE.Object3D, world: World);
    updateRemotePlayers(): void;
    createLaunchLink(): void;
    launch(loadingManager: LoadingManager, world: World): void;
}
