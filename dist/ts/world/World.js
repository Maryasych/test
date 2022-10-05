import * as THREE from 'three';
//@ts-ignore
import _ammo from '@enable3d/ammo-on-nodejs/ammo/ammo.js';
import { default as AMMONodejs } from '@enable3d/ammo-on-nodejs';
import '../../lib/cannon/cannon';
import * as l from 'lodash';
const _ = l.default;
import * as Utils from '../core/FunctionLibrary';
import { LoadingManager } from '../core/LoadingManager';
import { Path } from './Path';
import { BoxCollider } from '../physics/colliders/BoxCollider';
import { HammerCollider } from '../physics/colliders/HammerCollider';
import { KettlebellCollider } from '../physics/colliders/KettlebellCollider';
import { TrimeshCollider } from '../physics/colliders/TrimeshCollider';
import { Scenario } from './Scenario';
import { Animate } from '../physics/Animate';
import { InputManager } from '../core/InputManager';
import { CameraOperator } from '../core/CameraOperator';
export class World {
    fakeCamera = new THREE.Object3D();
    graphicsWorld;
    physicsWorld;
    parallelPairs;
    physicsFrameRate;
    physicsFrameTime;
    physicsMaxPrediction;
    clock;
    renderDelta;
    logicDelta;
    requestDelta;
    sinceLastFrame;
    justRendered;
    params;
    timeScaleTarget = 1;
    scenarios = [];
    characters = [];
    paths = [];
    updatables = [];
    hammers = [];
    kettlebells = [];
    boxes = [];
    animated = [];
    channel;
    lastScenarioID;
    cameraOperator;
    inputManager;
    constructor(channel, worldScenePath) {
        this.channel = channel;
        // Three.js scene
        this.graphicsWorld = new THREE.Scene();
        // Physics
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(0, -9.81, 0);
        this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
        this.physicsWorld.solver.iterations = 10;
        this.physicsWorld.allowSleep = true;
        this.parallelPairs = [];
        this.physicsFrameRate = 60;
        this.physicsFrameTime = 1 / this.physicsFrameRate;
        this.physicsMaxPrediction = this.physicsFrameRate;
        // RenderLoop
        this.renderDelta = 0;
        this.logicDelta = 0;
        this.sinceLastFrame = 0;
        this.justRendered = false;
        this.cameraOperator = new CameraOperator(this, this.fakeCamera, 0.3);
        _ammo().then((ammo) => {
            //@ts-ignore
            globalThis.Ammo = ammo;
        });
        // Load scene if path is supplied
        if (worldScenePath !== undefined) {
            const loadingManager = new LoadingManager(this);
            loadingManager.onFinishedCallback = () => {
                this.update(1, 1);
                this.setTimeScale(1);
            };
            loadingManager.loadGLTF(worldScenePath, (gltf) => {
                this.loadScene(loadingManager, gltf);
            });
        }
        this.clock = new AMMONodejs.ServerClock();
        this.clock.onTick(() => this.render(this));
        this.inputManager = new InputManager(this);
    }
    // Update
    // Handles all logic updates.
    update(timeStep, unscaledTimeStep) {
        this.updatePhysics(timeStep);
        // Update registred objects
        this.updatables.forEach((entity) => {
            entity.update(timeStep, unscaledTimeStep);
        });
    }
    updatePhysics(timeStep) {
        // Step the physics world
        this.physicsWorld.step(this.physicsFrameTime, timeStep);
        this.characters.forEach((char) => {
            if (this.isOutOfBounds(char.characterCapsule.body.position)) {
                this.outOfBoundsRespawn(char.characterCapsule.body);
            }
        });
        this.animated.forEach((el) => {
            el.move();
        });
        const anim = this.animated.map(el => { return { position: el.position, name: el.vObject.name, quaternion: el.pObject.quaternion }; });
        const hammers = this.hammers.map(el => { return { quaternion: el.body.quaternion, name: el.mesh.name }; });
        const kettlebells = this.kettlebells.map(el => { return { quaternion: el.body.quaternion, name: el.mesh.name }; });
        const boxes = this.boxes.map(el => { return { quaternion: el.body.quaternion, name: el.mesh.name, position: el.body.position }; });
        this.channel.emit('update_animated_position', anim);
        this.channel.emit('update_hammers', hammers);
        this.channel.emit('update_kettlebells', kettlebells);
        this.channel.emit('update_boxes', boxes);
    }
    isOutOfBounds(position) {
        let inside = position.x > -211.882 &&
            position.x < 211.882 &&
            position.z > -169.098 &&
            position.z < 153.232 &&
            position.y > 0.107;
        let belowSeaLevel = position.y < 14.989;
        return !inside && belowSeaLevel;
    }
    outOfBoundsRespawn(body, position) {
        const newPos = position || new CANNON.Vec3(0, 20, -22);
        const newQuat = new CANNON.Quaternion(0, 0, 0, 1);
        body.position.copy(newPos);
        body.interpolatedPosition.copy(newPos);
        body.quaternion.copy(newQuat);
        body.interpolatedQuaternion.copy(newQuat);
        body.velocity.setZero();
        body.angularVelocity.setZero();
    }
    /**
     * Rendering loop.
     * Implements fps limiter and frame-skipping
     * Calls world's "update" function before rendering.
     * @param {World} world
     */
    render(world) {
        this.requestDelta = this.clock.getDelta();
        // Getting timeStep
        const unscaledTimeStep = this.requestDelta + this.renderDelta + this.logicDelta;
        let timeStep = Math.min(unscaledTimeStep, 1 / 30); // min 30 fps
        // Logic
        world.update(timeStep, unscaledTimeStep);
        // Measuring logic time
        this.logicDelta = this.clock.getDelta();
        // Frame limiting
        const interval = 1 / 60;
        this.sinceLastFrame +=
            this.requestDelta + this.renderDelta + this.logicDelta;
        this.sinceLastFrame %= interval;
        // Actual rendering with a FXAA ON/OFF switch
        // else
        //this.renderer.render(this.graphicsWorld, this.camera);
        //TWEEN.update();
        // Measuring render time
        this.renderDelta = this.clock.getDelta();
    }
    setTimeScale(value) {
        this.timeScaleTarget = value;
    }
    add(worldEntity) {
        worldEntity.addToWorld(this);
        this.registerUpdatable(worldEntity);
    }
    registerUpdatable(registree) {
        this.updatables.push(registree);
        this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder ? 1 : -1));
    }
    remove(worldEntity) {
        worldEntity.removeFromWorld(this);
        this.unregisterUpdatable(worldEntity);
    }
    unregisterUpdatable(registree) {
        _.pull(this.updatables, registree);
    }
    loadScene(loadingManager, gltf) {
        gltf.scene.traverse((child) => {
            if (child.name.match('Hammer')) {
                const hammer = new HammerCollider(child);
                this.physicsWorld.addBody(hammer.bottom);
                this.physicsWorld.addBody(hammer.body);
                this.physicsWorld.addConstraint(hammer.hammer);
                hammer.hammer.enableMotor();
                //@ts-ignore
                hammer.hammer.setMotorSpeed(+child.userData.clockwise ? 5 : -5);
                hammer.hammer.collideConnected = false;
                this.hammers.push(hammer);
            }
            else if (child.name.match('Kettlebell')) {
                const kettlebell = new KettlebellCollider(child);
                this.physicsWorld.addBody(kettlebell.hitch);
                this.physicsWorld.addBody(kettlebell.body);
                this.physicsWorld.addConstraint(kettlebell.kettlebell);
                kettlebell.kettlebell.enableMotor();
                this.kettlebells.push(kettlebell);
            }
            else if (child.hasOwnProperty('userData')) {
                if (child.userData.hasOwnProperty('data')) {
                    if (child.userData.data === 'physics') {
                        if (child.userData.hasOwnProperty('type')) {
                            // Convex doesn't work! Stick to boxes!
                            if (child.userData.type === 'box') {
                                const mass = child.userData.name.match('Box') ? 1 : 0;
                                let phys = new BoxCollider({
                                    mass,
                                    child,
                                    size: new THREE.Vector3(child.scale.x, child.scale.y, child.scale.z)
                                });
                                phys.body.position.copy(Utils.cannonVector(child.position));
                                phys.body.quaternion.copy(Utils.cannonQuat(child.quaternion));
                                phys.body.computeAABB();
                                if (!child.userData.static)
                                    this.boxes.push(phys);
                                this.physicsWorld.addBody(phys.body);
                            }
                            else if (child.userData.type === 'trimesh') {
                                if (child.name.startsWith('animated')) {
                                    let phys = new TrimeshCollider(child, { mass: 0.1 });
                                    phys.body.type = CANNON.Body.KINEMATIC;
                                    this.physicsWorld.addBody(phys.body);
                                    if (child.userData.position || child.userData.rotation)
                                        this.animated.push(new Animate(phys.body, child));
                                }
                                else {
                                    let phys = new TrimeshCollider(child, {});
                                    this.physicsWorld.addBody(phys.body);
                                }
                            }
                        }
                    }
                    if (child.userData.data === 'path') {
                        this.paths.push(new Path(child));
                    }
                    if (child.userData.data === 'scenario') {
                        this.scenarios.push(new Scenario(child, this));
                    }
                }
            }
        });
        this.graphicsWorld.add(gltf.scene);
        // Launch default scenario
        let defaultScenarioID;
        for (const scenario of this.scenarios) {
            if (scenario.default) {
                defaultScenarioID = scenario.id;
                break;
            }
        }
        if (defaultScenarioID !== undefined)
            this.launchScenario(defaultScenarioID, loadingManager);
    }
    launchScenario(scenarioID, loadingManager) {
        this.lastScenarioID = scenarioID;
        this.clearEntities();
        // Launch default scenario
        if (!loadingManager)
            loadingManager = new LoadingManager(this);
        for (const scenario of this.scenarios) {
            if (scenario.id === scenarioID || scenario.spawnAlways) {
                scenario.launch(loadingManager, this);
            }
        }
    }
    restartScenario() {
        if (this.lastScenarioID !== undefined) {
            this.launchScenario(this.lastScenarioID);
        }
        else {
            console.warn("Can't restart scenario. Last scenarioID is undefined.");
        }
    }
    clearEntities() {
        for (let i = 0; i < this.characters.length; i++) {
            this.remove(this.characters[i]);
            i--;
        }
    }
    scrollTheTimeScale(scrollAmount) {
        // Changing time scale with scroll wheel
        const timeScaleBottomLimit = 0.003;
        const timeScaleChangeSpeed = 1.3;
        if (scrollAmount > 0) {
            this.timeScaleTarget /= timeScaleChangeSpeed;
            if (this.timeScaleTarget < timeScaleBottomLimit)
                this.timeScaleTarget = 0;
        }
        else {
            this.timeScaleTarget *= timeScaleChangeSpeed;
            if (this.timeScaleTarget < timeScaleBottomLimit)
                this.timeScaleTarget = timeScaleBottomLimit;
            this.timeScaleTarget = Math.min(this.timeScaleTarget, 1);
        }
    }
    disposeAll() {
        this.clock = null;
        this.clearEntities();
        this.physicsWorld = null;
        this.graphicsWorld.children.forEach((el) => {
            el.material.dispose();
            el.geometry.dispose();
        });
    }
}
