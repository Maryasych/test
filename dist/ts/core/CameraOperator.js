//@ts-nocheck
import * as THREE from 'three';
import * as Utils from './FunctionLibrary';
import { KeyBinding } from './KeyBinding';
import * as l from 'lodash';
const _ = l.default;
export class CameraOperator {
    updateOrder = 4;
    world;
    camera;
    target;
    sensitivity;
    radius = 1;
    theta;
    phi;
    onMouseDownPosition;
    onMouseDownTheta;
    onMouseDownPhi;
    targetRadius = 1;
    movementSpeed;
    actions;
    upVelocity = 0;
    forwardVelocity = 0;
    rightVelocity = 0;
    followMode = false;
    characterCaller;
    constructor(world, camera, sensitivityX = 1, sensitivityY = sensitivityX * 0.8) {
        this.world = world;
        this.camera = camera;
        this.target = new THREE.Vector3();
        this.sensitivity = new THREE.Vector2(sensitivityX, sensitivityY);
        this.movementSpeed = 0.06;
        this.radius = 3;
        this.theta = 0;
        this.phi = 0;
        this.onMouseDownPosition = new THREE.Vector2();
        this.onMouseDownTheta = this.theta;
        this.onMouseDownPhi = this.phi;
        this.actions = {
            'forward': new KeyBinding('KeyW'),
            'back': new KeyBinding('KeyS'),
            'left': new KeyBinding('KeyA'),
            'right': new KeyBinding('KeyD'),
            'up': new KeyBinding('KeyE'),
            'down': new KeyBinding('KeyQ'),
            'fast': new KeyBinding('ShiftLeft'),
        };
        world.registerUpdatable(this);
    }
    setSensitivity(sensitivityX, sensitivityY = sensitivityX) {
        this.sensitivity = new THREE.Vector2(sensitivityX, sensitivityY);
    }
    setRadius(value, instantly = false) {
        this.targetRadius = Math.max(0.001, value);
        if (instantly === true) {
            this.radius = value;
        }
    }
    move(deltaX, deltaY) {
        this.theta -= deltaX * (this.sensitivity.x / 2);
        this.theta %= 360;
        this.phi += deltaY * (this.sensitivity.y / 2);
        this.phi = Math.min(85, Math.max(-5, this.phi));
    }
    update(timeScale) {
        if (this.followMode === true) {
            this.camera.position.y = THREE.MathUtils.clamp(this.camera.position.y, this.target.y, Number.POSITIVE_INFINITY);
            this.camera.lookAt(this.target);
            let newPos = this.target.clone().add(new THREE.Vector3().subVectors(this.camera.position, this.target).normalize().multiplyScalar(this.targetRadius));
            this.camera.position.x = newPos.x;
            this.camera.position.y = newPos.y;
            this.camera.position.z = newPos.z;
        }
        else {
            this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, 0.1);
            this.camera.position.x = this.target.x + this.radius * Math.sin(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
            this.camera.position.y = this.target.y + this.radius * Math.sin(this.phi * Math.PI / 180) + 2;
            this.camera.position.z = this.target.z + this.radius * Math.cos(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
            this.camera.updateMatrix();
            this.camera.lookAt(this.target);
        }
    }
    handleKeyboardEvent(event, code, pressed) {
        // Free camera
        if (code === 'KeyC' && pressed === true && event.shiftKey === true) {
            if (this.characterCaller !== undefined) {
                this.world.inputManager.setInputReceiver(this.characterCaller);
                this.characterCaller = undefined;
            }
        }
        else {
            for (const action in this.actions) {
                if (this.actions.hasOwnProperty(action)) {
                    const binding = this.actions[action];
                    if (_.includes(binding.eventCodes, code)) {
                        binding.isPressed = pressed;
                    }
                }
            }
        }
    }
    handleMouseWheel(event, value) {
        this.world.scrollTheTimeScale(value);
    }
    handleMouseButton(event, code, pressed) {
        for (const action in this.actions) {
            if (this.actions.hasOwnProperty(action)) {
                const binding = this.actions[action];
                if (_.includes(binding.eventCodes, code)) {
                    binding.isPressed = pressed;
                }
            }
        }
    }
    handleMouseMove(event, deltaX, deltaY) {
        this.move(deltaX, deltaY);
    }
    inputReceiverInit() {
        this.target.copy(this.camera.position);
        this.setRadius(0, true);
    }
    inputReceiverUpdate(timeStep) {
        // Set fly speed
        let speed = this.movementSpeed * (this.actions.fast.isPressed ? timeStep * 600 : timeStep * 60);
        const up = Utils.getUp(this.camera);
        const right = Utils.getRight(this.camera);
        const forward = Utils.getBack(this.camera);
        this.upVelocity = THREE.MathUtils.lerp(this.upVelocity, +this.actions.up.isPressed - +this.actions.down.isPressed, 0.3);
        this.forwardVelocity = THREE.MathUtils.lerp(this.forwardVelocity, +this.actions.forward.isPressed - +this.actions.back.isPressed, 0.3);
        this.rightVelocity = THREE.MathUtils.lerp(this.rightVelocity, +this.actions.right.isPressed - +this.actions.left.isPressed, 0.3);
        this.target.add(up.multiplyScalar(speed * this.upVelocity));
        this.target.add(forward.multiplyScalar(speed * this.forwardVelocity));
        this.target.add(right.multiplyScalar(speed * this.rightVelocity));
    }
}
