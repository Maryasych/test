import { Vec3, Body } from 'cannon';
import { Mesh } from 'three';
export declare class Animate {
    pObject: Body;
    vObject: Mesh;
    step: number;
    frame: number;
    position: Vec3;
    keyframes: any;
    keyframeLength: number;
    fwd: boolean;
    currPosition: Vec3;
    nextPosition: Vec3;
    velocity: Vec3;
    currAngular: Vec3;
    nextAngular: Vec3;
    angularVelocity: Vec3;
    t: number;
    angularStep: number;
    constructor(pObject: Body, vObject: Mesh);
    makeKeyframes(): void;
    getVelocity(): void;
    getKeyframe(): void;
    move(): void;
}
