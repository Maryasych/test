import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import * as THREE from 'three';
import { World } from './World';
import { Character } from '../characters/Character';
import { LoadingManager } from '../core/LoadingManager';
import { Scenario } from './Scenario';
import * as Utils from '../core/FunctionLibrary';

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min)) + min;

export class CharacterSpawnPoint implements ISpawnPoint {
  public object: THREE.Object3D;
  public scenario: Scenario | undefined;
  public character: Character | undefined;
  public playerId: string | undefined;

  constructor(object: THREE.Object3D, scenario?: Scenario, playerId?: string) {
    this.object = object;
    this.scenario = scenario;
    this.playerId = playerId;
  }

  public spawn(loadingManager: LoadingManager, world: World): void {
    loadingManager.loadGLTF('src/assets/models/boxman.glb', async (model) => {
      let player = new Character(model);
      this.character = player;

      let worldPos = new THREE.Vector3();
      this.object.getWorldPosition(worldPos);
      if (!this.scenario) {
        worldPos.copy(
          worldPos
            .clone()
            .add(
              new THREE.Vector3(
                randomBetween(-5, 5),
                randomBetween(-5, 5),
                randomBetween(-5, 5)
              )
            )
        );
      }
      player.setPosition(worldPos.x, worldPos.y, worldPos.z);

      let forward = Utils.getForward(this.object);
      player.setOrientation(forward, true);

      world.add(player);
      if (this.scenario) player.takeControl();
    });
  }
}
