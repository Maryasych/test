import { CharacterSpawnPoint } from './CharacterSpawnPoint';
import { LoadingManager } from '../core/LoadingManager';
import { default as AMMONodejs } from '@enable3d/ammo-on-nodejs';
export class Scenario {
    id;
    name;
    spawnAlways = false;
    default = false;
    world;
    descriptionTitle;
    descriptionContent;
    rootNode;
    spawnPoints = [];
    invisible = false;
    localPlayer;
    characterSpawnPointList = [];
    remoteData = [];
    clock;
    constructor(root, world) {
        this.rootNode = root;
        this.world = world;
        this.id = root.name;
        this.clock = new AMMONodejs.ServerClock();
        this.clock.onTick(() => this.updateRemotePlayers());
        // characterSpawnPointList
        // Scenario
        if (root.userData.hasOwnProperty('name')) {
            this.name = root.userData.name;
        }
        if (root.userData.hasOwnProperty('default') && root.userData.default === 'true') {
            this.default = true;
        }
        if (root.userData.hasOwnProperty('spawn_always') && root.userData.spawn_always === 'true') {
            this.spawnAlways = true;
        }
        if (root.userData.hasOwnProperty('invisible') && root.userData.invisible === 'true') {
            this.invisible = true;
        }
        if (root.userData.hasOwnProperty('desc_title')) {
            this.descriptionTitle = root.userData.desc_title;
        }
        if (root.userData.hasOwnProperty('desc_content')) {
            this.descriptionContent = root.userData.desc_content;
        }
        // Find all scenario spawns and enitites
        root.traverse((child) => {
            if (child.hasOwnProperty('userData') && child.userData.hasOwnProperty('data')) {
                if (child.userData.data === 'spawn') {
                    if (child.userData.type === 'player') {
                        this.localPlayer = new CharacterSpawnPoint(child, this);
                        this.spawnPoints.push(this.localPlayer);
                        // [...new Array(3)].forEach(el => {
                        // 	const characterSpawn = new CharacterSpawnPoint(child);
                        // 	console.log('characterSpawn', characterSpawn);
                        // 	this.spawnPoints.push(characterSpawn);
                        // });
                    }
                }
            }
        });
        this.updateRemotePlayers();
    }
    updateRemotePlayers() {
        const remotePlayers = [];
        // console.log('this.remoteData', this.remoteData);
        // console.log('this.characterSpawnPointList', this.characterSpawnPointList);
        this.remoteData.forEach((data) => {
            //@ts-ignore
            if (data.id === this.localPlayer.character.playerId)
                return;
            const rplayerSpawn = this.characterSpawnPointList.find(({ playerId }) => playerId === data.id);
            if (rplayerSpawn === undefined) {
                const newPlayer = new CharacterSpawnPoint(this.localPlayer.object, undefined, data.id);
                newPlayer.spawn(new LoadingManager(), this.world);
                remotePlayers.push(newPlayer);
            }
            else {
                remotePlayers.push(rplayerSpawn);
            }
        });
        this.characterSpawnPointList = [...remotePlayers];
    }
    launch(loadingManager, world) {
        this.spawnPoints.forEach((sp) => {
            sp.spawn(loadingManager, world);
        });
        if (!this.spawnAlways) {
            loadingManager.createWelcomeScreenCallback(this);
        }
    }
}
