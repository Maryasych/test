import * as THREE from 'three';
import { Character } from '../characters/Character';
import * as Utils from '../core/FunctionLibrary';
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min)) + min;
export class CharacterSpawnPoint {
    object;
    scenario;
    character;
    playerId;
    constructor(object, scenario, playerId) {
        this.object = object;
        this.scenario = scenario;
        this.playerId = playerId;
    }
    spawn(loadingManager, world) {
        loadingManager.loadGLTF('src/assets/models/boxman.glb', async (model) => {
            let player = new Character(model);
            this.character = player;
            let worldPos = new THREE.Vector3();
            this.object.getWorldPosition(worldPos);
            if (!this.scenario) {
                worldPos.copy(worldPos
                    .clone()
                    .add(new THREE.Vector3(randomBetween(-5, 5), randomBetween(-5, 5), randomBetween(-5, 5))));
            }
            player.setPosition(worldPos.x, worldPos.y, worldPos.z);
            let forward = Utils.getForward(this.object);
            player.setOrientation(forward, true);
            world.add(player);
            if (this.scenario)
                player.takeControl();
        });
    }
}
