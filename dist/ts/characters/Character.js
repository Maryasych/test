import * as THREE from 'three';
import * as l from 'lodash';
const _ = l.default;
import * as Utils from '../core/FunctionLibrary';
import { KeyBinding } from '../core/KeyBinding';
import { VectorSpringSimulator } from '../physics/spring_simulation/VectorSpringSimulator';
import { RelativeSpringSimulator } from '../physics/spring_simulation/RelativeSpringSimulator';
import { Idle } from './character_states/Idle';
import { CollisionGroups } from '../enums/CollisionGroups';
import { CapsuleCollider } from '../physics/colliders/CapsuleCollider';
import { GroundImpactData } from './GroundImpactData';
import { EntityType } from '../enums/EntityType';
import { BounceLand } from '../characters/character_states/BounceLand';
export class Character extends THREE.Object3D {
    updateOrder = 1;
    entityType = EntityType.Character;
    height = 0;
    tiltContainer;
    modelContainer;
    materials = [];
    mixer;
    animations;
    // Movement
    acceleration = new THREE.Vector3();
    velocity = new THREE.Vector3();
    arcadeVelocityInfluence = new THREE.Vector3();
    velocityTarget = new THREE.Vector3();
    arcadeVelocityIsAdditive = false;
    defaultVelocitySimulatorDamping = 0.8;
    defaultVelocitySimulatorMass = 50;
    velocitySimulator;
    moveSpeed = 4;
    angularVelocity = 0;
    orientation = new THREE.Vector3(0, 0, 1);
    orientationTarget = new THREE.Vector3(0, 0, 1);
    defaultRotationSimulatorDamping = 0.5;
    defaultRotationSimulatorMass = 10;
    rotationSimulator;
    viewVector;
    actions;
    characterCapsule;
    // Ray casting
    rayResult = new CANNON.RaycastResult();
    rayHasHit = false;
    rayCastLength = 0.57;
    raySafeOffset = 0.03;
    wantsToJump = false;
    initJumpSpeed = -1;
    groundImpactData = new GroundImpactData();
    world;
    charState;
    behaviour;
    currAnimationData = {};
    // Vehicles
    controlledObject;
    physicsEnabled = true;
    constructor(char) {
        super();
        this.setAnimations(char.animations);
        // The visuals group is centered for easy character tilting
        this.tiltContainer = new THREE.Group();
        this.add(this.tiltContainer);
        // Model container is used to reliably ground the character, as animation can alter the position of the model itself
        this.modelContainer = new THREE.Group();
        this.modelContainer.position.y = -0.57;
        this.tiltContainer.add(this.modelContainer);
        this.modelContainer.add(char.model);
        this.mixer = new THREE.AnimationMixer(char);
        this.velocitySimulator = new VectorSpringSimulator(60, this.defaultVelocitySimulatorMass, this.defaultVelocitySimulatorDamping);
        this.rotationSimulator = new RelativeSpringSimulator(60, this.defaultRotationSimulatorMass, this.defaultRotationSimulatorDamping);
        this.viewVector = new THREE.Vector3();
        // Actions
        this.actions = {
            'up': new KeyBinding('KeyW'),
            'down': new KeyBinding('KeyS'),
            'left': new KeyBinding('KeyA'),
            'right': new KeyBinding('KeyD'),
            'run': new KeyBinding('ShiftLeft'),
            'jump': new KeyBinding('Space'),
            'use': new KeyBinding('KeyE'),
            'enter': new KeyBinding('KeyF'),
            'enter_passenger': new KeyBinding('KeyG'),
            'seat_switch': new KeyBinding('KeyX'),
            'primary': new KeyBinding('Mouse0'),
            'secondary': new KeyBinding('Mouse1'),
        };
        // Physics
        // Player Capsule
        this.characterCapsule = new CapsuleCollider({
            mass: 1,
            position: new CANNON.Vec3(),
            height: 0.5,
            radius: 0.25,
            segments: 8,
            friction: 0.0
        });
        // capsulePhysics.physical.collisionFilterMask = ~CollisionGroups.Trimesh;
        this.characterCapsule.body.shapes.forEach((shape) => {
            // tslint:disable-next-line: no-bitwise
            shape.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
        });
        this.characterCapsule.body.allowSleep = false;
        // Move character to different collision group for raycasting
        this.characterCapsule.body.collisionFilterGroup = 2;
        // Disable character rotation
        this.characterCapsule.body.fixedRotation = true;
        this.characterCapsule.body.updateMassProperties();
        // Physics pre/post step callback bindings
        this.characterCapsule.body.preStep = (body) => { this.physicsPreStep(body, this); };
        this.characterCapsule.body.postStep = (body) => { this.physicsPostStep(body, this); };
        // States
        this.setState(new Idle(this));
        this.colliding();
    }
    colliding = () => {
        this.characterCapsule.body.addEventListener('collide', (e) => {
            if (e.contact.bj.material.name === 'DynamicBarrierMat') {
                this.setState(new BounceLand(this));
            }
        });
    };
    setAnimations(animations) {
        this.animations = animations;
    }
    setArcadeVelocityInfluence(x, y = x, z = x) {
        this.arcadeVelocityInfluence.set(x, y, z);
    }
    setViewVector(vector) {
        this.viewVector.copy(vector).normalize();
    }
    /**
     * Set state to the player. Pass state class (function) name.
     * @param {function} State
     */
    setState(state) {
        this.charState = state;
        this.world?.channel.emit('update_state', state.constructor.name);
    }
    setPosition(x, y, z) {
        if (this.physicsEnabled) {
            this.characterCapsule.body.previousPosition = new CANNON.Vec3(x, y, z);
            this.characterCapsule.body.position = new CANNON.Vec3(x, y, z);
            this.characterCapsule.body.interpolatedPosition = new CANNON.Vec3(x, y, z);
        }
        else {
            this.position.x = x;
            this.position.y = y;
            this.position.z = z;
        }
    }
    resetVelocity() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.velocity.z = 0;
        this.characterCapsule.body.velocity.x = 0;
        this.characterCapsule.body.velocity.y = 0;
        this.characterCapsule.body.velocity.z = 0;
        this.velocitySimulator.init();
    }
    setArcadeVelocityTarget(velZ, velX = 0, velY = 0) {
        this.velocityTarget.z = velZ;
        this.velocityTarget.x = velX;
        this.velocityTarget.y = velY;
    }
    setOrientation(vector, instantly = false) {
        let lookVector = new THREE.Vector3().copy(vector).setY(0).normalize();
        this.orientationTarget.copy(lookVector);
        if (instantly) {
            this.orientation.copy(lookVector);
        }
    }
    resetOrientation() {
        const forward = Utils.getForward(this);
        this.setOrientation(forward, true);
    }
    setPhysicsEnabled(value) {
        this.physicsEnabled = value;
        if (value === true) {
            this.world?.physicsWorld.addBody(this.characterCapsule.body);
        }
        else {
            this.world?.physicsWorld.remove(this.characterCapsule.body);
        }
    }
    handleKeyboardEvent(event, code, pressed) {
        if (this.controlledObject !== undefined) {
            this.controlledObject.handleKeyboardEvent(event, code, pressed);
        }
        else {
            // Free camera
            if (code === 'KeyC' && pressed === true && event.shiftKey === true) {
                this.resetControls();
                //this.world.cameraOperator.characterCaller = this;
                //this.world.inputManager.setInputReceiver(this.world.cameraOperator);
            }
            else if (code === 'KeyR' && pressed === true && event.shiftKey === true) {
                this.world?.restartScenario();
            }
            else {
                for (const action in this.actions) {
                    if (this.actions.hasOwnProperty(action)) {
                        const binding = this.actions[action];
                        if (_.includes(binding.eventCodes, code)) {
                            this.triggerAction(action, pressed);
                        }
                    }
                }
            }
        }
    }
    handleMouseButton(event, code, pressed) {
        if (this.controlledObject !== undefined) {
            this.controlledObject.handleMouseButton(event, code, pressed);
        }
        else {
            for (const action in this.actions) {
                if (this.actions.hasOwnProperty(action)) {
                    const binding = this.actions[action];
                    if (_.includes(binding.eventCodes, code)) {
                        this.triggerAction(action, pressed);
                    }
                }
            }
        }
    }
    handleMouseMove(deltaX, deltaY) {
        if (this.controlledObject !== undefined) {
            this.controlledObject.handleMouseMove(deltaX, deltaY);
        }
        else {
            this.world?.cameraOperator.move(deltaX, deltaY);
        }
    }
    handleMouseWheel(event, value) {
        if (this.controlledObject !== undefined) {
            this.controlledObject.handleMouseWheel(event, value);
        }
        else {
            this.world?.scrollTheTimeScale(value);
        }
    }
    triggerAction(actionName, value) {
        // Get action and set it's parameters
        let action = this.actions[actionName];
        if (action.isPressed !== value) {
            // Set value
            action.isPressed = value;
            // Reset the 'just' attributes
            action.justPressed = false;
            action.justReleased = false;
            // Set the 'just' attributes
            if (value)
                action.justPressed = true;
            else
                action.justReleased = true;
            // Tell player to handle states according to new input
            this.charState?.onInputChange();
            // Reset the 'just' attributes
            action.justPressed = false;
            action.justReleased = false;
        }
    }
    takeControl() {
        if (this.world !== undefined) {
            this.world.inputManager.setInputReceiver(this);
        }
        else {
            console.warn('Attempting to take control of a character that doesn\'t belong to a world.');
        }
    }
    resetControls() {
        for (const action in this.actions) {
            if (this.actions.hasOwnProperty(action)) {
                this.triggerAction(action, false);
            }
        }
    }
    update(timeStep) {
        this.behaviour?.update(timeStep);
        // console.log(this.occupyingSeat);
        this.charState?.update(timeStep);
        // this.visuals.position.copy(this.modelOffset);
        if (this.physicsEnabled)
            this.springMovement(timeStep);
        if (this.physicsEnabled)
            this.springRotation(timeStep);
        if (this.physicsEnabled)
            this.rotateModel();
        if (this.mixer !== undefined)
            this.mixer.update(timeStep);
        // Sync physics/graphics
        if (this.physicsEnabled) {
            this.position.set(this.characterCapsule.body.interpolatedPosition.x, this.characterCapsule.body.interpolatedPosition.y, this.characterCapsule.body.interpolatedPosition.z);
        }
        else {
            let newPos = new THREE.Vector3();
            this.getWorldPosition(newPos);
            this.characterCapsule.body.position.copy(Utils.cannonVector(newPos));
            this.characterCapsule.body.interpolatedPosition.copy(Utils.cannonVector(newPos));
        }
        this.updateMatrixWorld();
    }
    inputReceiverInit() {
        if (this.controlledObject !== undefined) {
            this.controlledObject.inputReceiverInit();
            return;
        }
        this.world?.cameraOperator.setRadius(3, true);
        //@ts-ignore
        this.world.cameraOperator.followMode = false;
    }
    inputReceiverUpdate(timeStep) {
        if (this.controlledObject !== undefined) {
            this.controlledObject.inputReceiverUpdate(timeStep); //
        }
        else {
            // Look in camera's direction
            this.viewVector = new THREE.Vector3().subVectors(this.position, this.world?.fakeCamera.position || new THREE.Vector3());
            this.getWorldPosition(this.world?.cameraOperator.target || new THREE.Vector3());
        }
    }
    setAnimation(clipName, fadeIn) {
        if (this.mixer !== undefined) {
            // gltf
            let clip = THREE.AnimationClip.findByName(this.animations, clipName);
            let action = this.mixer.clipAction(clip);
            if (action === null) {
                console.error(`Animation ${clipName} not found!`);
                return 0;
            }
            this.currAnimationData.clipName = clipName;
            this.currAnimationData.fadeIn = fadeIn;
            this.mixer.stopAllAction();
            action.fadeIn(fadeIn);
            action.play();
            return action.getClip().duration;
        }
    }
    springMovement(timeStep) {
        // Simulator
        this.velocitySimulator.target.copy(this.velocityTarget);
        this.velocitySimulator.simulate(timeStep);
        // Update values
        this.velocity.copy(this.velocitySimulator.position);
        this.acceleration.copy(this.velocitySimulator.velocity);
    }
    springRotation(timeStep) {
        // Spring rotation
        // Figure out angle between current and target orientation
        let angle = Utils.getSignedAngleBetweenVectors(this.orientation, this.orientationTarget);
        // Simulator
        this.rotationSimulator.target = angle;
        this.rotationSimulator.simulate(timeStep);
        let rot = this.rotationSimulator.position;
        // Updating values
        this.orientation.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
        this.angularVelocity = this.rotationSimulator.velocity;
    }
    getLocalMovementDirection() {
        // TODO values are reversed on backend. Why?
        const positiveX = this.actions.right.isPressed ? 1 : 0;
        const negativeX = this.actions.left.isPressed ? -1 : 0;
        const positiveZ = this.actions.up.isPressed ? -1 : 0;
        const negativeZ = this.actions.down.isPressed ? 1 : 0;
        return new THREE.Vector3(positiveX + negativeX, 0, positiveZ + negativeZ).normalize();
    }
    getCameraRelativeMovementVector() {
        const localDirection = this.getLocalMovementDirection();
        const flatViewVector = new THREE.Vector3(this.viewVector.x, 0, this.viewVector.z).normalize();
        return Utils.appplyVectorMatrixXZ(flatViewVector, localDirection);
    }
    setCameraRelativeOrientationTarget() {
        let moveVector = this.getCameraRelativeMovementVector();
        if (moveVector.x === 0 && moveVector.y === 0 && moveVector.z === 0) {
            this.setOrientation(this.orientation);
        }
        else {
            this.setOrientation(moveVector);
        }
    }
    rotateModel() {
        this.lookAt(this.position.x + this.orientation.x, this.position.y + this.orientation.y, this.position.z + this.orientation.z);
        this.tiltContainer.rotation.z = (-this.angularVelocity * 2.3 * this.velocity.length());
        this.tiltContainer.position.setY((Math.cos(Math.abs(this.angularVelocity * 2.3 * this.velocity.length())) / 2) - 0.5);
    }
    jump(initJumpSpeed = -1) {
        this.wantsToJump = true;
        this.initJumpSpeed = initJumpSpeed;
    }
    transferControls(entity) {
        // Currently running through all actions of this character and the vehicle,
        // comparing keycodes of actions and based on that triggering vehicle's actions
        // Maybe we should ask input manager what's the current state of the keyboard
        // and read those values... TODO
        for (const action1 in this.actions) {
            if (this.actions.hasOwnProperty(action1)) {
                for (const action2 in entity.actions) {
                    if (entity.actions.hasOwnProperty(action2)) {
                        let a1 = this.actions[action1];
                        let a2 = entity.actions[action2];
                        a1.eventCodes.forEach((code1) => {
                            a2.eventCodes.forEach((code2) => {
                                if (code1 === code2) {
                                    entity.triggerAction(action2, a1.isPressed);
                                }
                            });
                        });
                    }
                }
            }
        }
    }
    physicsPreStep(body, character) {
        character.feetRaycast();
        if (this.world)
            this.world.channel.emit('update_position', body.position);
    }
    feetRaycast() {
        // Player ray casting
        // Create ray
        let body = this.characterCapsule.body;
        const start = new CANNON.Vec3(body.position.x, body.position.y, body.position.z);
        const end = new CANNON.Vec3(body.position.x, body.position.y - this.rayCastLength - this.raySafeOffset, body.position.z);
        // Raycast options
        const rayCastOptions = {
            collisionFilterMask: CollisionGroups.Default,
            skipBackfaces: true /* ignore back faces */
        };
        // Cast the ray
        this.rayHasHit = this.world?.physicsWorld.raycastClosest(start, end, rayCastOptions, this.rayResult) || false;
    }
    physicsPostStep(body, character) {
        // Get velocities
        let simulatedVelocity = new THREE.Vector3(body.velocity.x, body.velocity.y, body.velocity.z);
        // Take local velocity
        let arcadeVelocity = new THREE.Vector3().copy(character.velocity).multiplyScalar(character.moveSpeed);
        // Turn local into global
        arcadeVelocity = Utils.appplyVectorMatrixXZ(character.orientation, arcadeVelocity);
        let newVelocity = new THREE.Vector3();
        // Additive velocity mode
        if (character.arcadeVelocityIsAdditive) {
            newVelocity.copy(simulatedVelocity);
            let globalVelocityTarget = Utils.appplyVectorMatrixXZ(character.orientation, character.velocityTarget);
            let add = new THREE.Vector3().copy(arcadeVelocity).multiply(character.arcadeVelocityInfluence);
            if (Math.abs(simulatedVelocity.x) < Math.abs(globalVelocityTarget.x * character.moveSpeed) || Utils.haveDifferentSigns(simulatedVelocity.x, arcadeVelocity.x)) {
                newVelocity.x += add.x;
            }
            if (Math.abs(simulatedVelocity.y) < Math.abs(globalVelocityTarget.y * character.moveSpeed) || Utils.haveDifferentSigns(simulatedVelocity.y, arcadeVelocity.y)) {
                newVelocity.y += add.y;
            }
            if (Math.abs(simulatedVelocity.z) < Math.abs(globalVelocityTarget.z * character.moveSpeed) || Utils.haveDifferentSigns(simulatedVelocity.z, arcadeVelocity.z)) {
                newVelocity.z += add.z;
            }
        }
        else {
            newVelocity = new THREE.Vector3(THREE.MathUtils.lerp(simulatedVelocity.x, arcadeVelocity.x, character.arcadeVelocityInfluence.x), THREE.MathUtils.lerp(simulatedVelocity.y, arcadeVelocity.y, character.arcadeVelocityInfluence.y), THREE.MathUtils.lerp(simulatedVelocity.z, arcadeVelocity.z, character.arcadeVelocityInfluence.z));
        }
        // If we're hitting the ground, stick to ground
        if (character.rayHasHit) {
            // Flatten velocity
            newVelocity.y = 0;
            // Move on top of moving objects
            if (character.rayResult.body.mass > 0) {
                let pointVelocity = new CANNON.Vec3();
                character.rayResult.body.getVelocityAtWorldPoint(character.rayResult.hitPointWorld, pointVelocity);
                newVelocity.add(Utils.threeVector(pointVelocity));
            }
            // Measure the normal vector offset from direct "up" vector
            // and transform it into a matrix
            let up = new THREE.Vector3(0, 1, 0);
            let normal = new THREE.Vector3(character.rayResult.hitNormalWorld.x, character.rayResult.hitNormalWorld.y, character.rayResult.hitNormalWorld.z);
            let q = new THREE.Quaternion().setFromUnitVectors(up, normal);
            let m = new THREE.Matrix4().makeRotationFromQuaternion(q);
            // Rotate the velocity vector
            newVelocity.applyMatrix4(m);
            // Apply velocity
            body.velocity.x = newVelocity.x;
            body.velocity.y = newVelocity.y;
            body.velocity.z = newVelocity.z;
            // Ground character
            body.position.y = character.rayResult.hitPointWorld.y + character.rayCastLength + (newVelocity.y / (character?.world?.physicsFrameRate || 1));
        }
        else {
            // If we're in air
            body.velocity.x = newVelocity.x;
            body.velocity.y = newVelocity.y;
            body.velocity.z = newVelocity.z;
            // Save last in-air information
            character.groundImpactData.velocity.x = body.velocity.x;
            character.groundImpactData.velocity.y = body.velocity.y;
            character.groundImpactData.velocity.z = body.velocity.z;
        }
        // Jumping
        if (character.wantsToJump) {
            // If initJumpSpeed is set
            if (character.initJumpSpeed > -1) {
                // Flatten velocity
                body.velocity.y = 0;
                let speed = Math.max(character.velocitySimulator.position.length() * 4, character.initJumpSpeed);
                body.velocity = Utils.cannonVector(character.orientation.clone().multiplyScalar(speed));
            }
            else {
                // Moving objects compensation
                let add = new CANNON.Vec3();
                character.rayResult.body.getVelocityAtWorldPoint(character.rayResult.hitPointWorld, add);
                body.velocity.vsub(add, body.velocity);
            }
            // Add positive vertical velocity
            body.velocity.y += 5;
            // Move above ground by 2x safe offset value
            body.position.y += character.raySafeOffset * 2;
            // Reset flag
            character.wantsToJump = false;
        }
    }
    addToWorld(world) {
        if (_.includes(world.characters, this)) {
            console.warn('Adding character to a world in which it already exists.');
        }
        else {
            // Set world
            this.world = world;
            // Register character
            world.characters.push(this);
            // Register physics
            world.physicsWorld.addBody(this.characterCapsule.body);
            // Add to graphicsWorld
            world.graphicsWorld.add(this);
            //@ts-ignore
            this.world.channel.on('playerAction', (data) => this.handleKeyboardEvent(data.event, data.code, data.pressed));
            //@ts-ignore
            this.world.channel.on('update_mouse_position', (data) => this.handleMouseMove(data.deltaX, data.deltaY));
        }
    }
    removeFromWorld(world) {
        if (!_.includes(world.characters, this)) {
            console.warn('Removing character from a world in which it isn\'t present.');
        }
        else {
            // if (world.inputManager.inputReceiver === this)
            // {
            // 	world.inputManager.inputReceiver = undefined;
            // }
            this.world = undefined;
            // Remove from characters
            _.pull(world.characters, this);
            // Remove physics
            world.physicsWorld.remove(this.characterCapsule.body);
            // Remove visuals
            world.graphicsWorld.remove(this);
        }
    }
}
