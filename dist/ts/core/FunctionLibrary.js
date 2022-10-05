import * as THREE from 'three';
import * as l from 'lodash';
import { SimulationFrame } from '../physics/spring_simulation/SimulationFrame';
import { Side } from '../enums/Side';
import { Space } from '../enums/Space';
const _ = l.default;
export function createCapsuleGeometry(radius = 1, height = 2, N = 32) {
    const geometry = new THREE.Geometry();
    const TWOPI = Math.PI * 2;
    const PID2 = 1.570796326794896619231322;
    const normals = [];
    // top cap
    for (let i = 0; i <= N / 4; i++) {
        for (let j = 0; j <= N; j++) {
            let theta = j * TWOPI / N;
            let phi = -PID2 + Math.PI * i / (N / 2);
            let vertex = new THREE.Vector3();
            let normal = new THREE.Vector3();
            vertex.x = radius * Math.cos(phi) * Math.cos(theta);
            vertex.y = radius * Math.cos(phi) * Math.sin(theta);
            vertex.z = radius * Math.sin(phi);
            vertex.z -= height / 2;
            normal.x = vertex.x;
            normal.y = vertex.y;
            normal.z = vertex.z;
            geometry.vertices.push(vertex);
            normals.push(normal);
        }
    }
    // bottom cap
    for (let i = N / 4; i <= N / 2; i++) {
        for (let j = 0; j <= N; j++) {
            let theta = j * TWOPI / N;
            let phi = -PID2 + Math.PI * i / (N / 2);
            let vertex = new THREE.Vector3();
            let normal = new THREE.Vector3();
            vertex.x = radius * Math.cos(phi) * Math.cos(theta);
            vertex.y = radius * Math.cos(phi) * Math.sin(theta);
            vertex.z = radius * Math.sin(phi);
            vertex.z += height / 2;
            normal.x = vertex.x;
            normal.y = vertex.y;
            normal.z = vertex.z;
            geometry.vertices.push(vertex);
            normals.push(normal);
        }
    }
    for (let i = 0; i <= N / 2; i++) {
        for (let j = 0; j < N; j++) {
            let vec = new THREE.Vector4(i * (N + 1) + j, i * (N + 1) + (j + 1), (i + 1) * (N + 1) + (j + 1), (i + 1) * (N + 1) + j);
            if (i === N / 4) {
                let face1 = new THREE.Face3(vec.x, vec.y, vec.z, [
                    normals[vec.x],
                    normals[vec.y],
                    normals[vec.z]
                ]);
                let face2 = new THREE.Face3(vec.x, vec.z, vec.w, [
                    normals[vec.x],
                    normals[vec.z],
                    normals[vec.w]
                ]);
                geometry.faces.push(face2);
                geometry.faces.push(face1);
            }
            else {
                let face1 = new THREE.Face3(vec.x, vec.y, vec.z, [
                    normals[vec.x],
                    normals[vec.y],
                    normals[vec.z]
                ]);
                let face2 = new THREE.Face3(vec.x, vec.z, vec.w, [
                    normals[vec.x],
                    normals[vec.z],
                    normals[vec.w]
                ]);
                geometry.faces.push(face1);
                geometry.faces.push(face2);
            }
        }
        // if(i==(N/4)) break; // N/4 is when the center segments are solved
    }
    geometry.rotateX(Math.PI / 2);
    geometry.computeVertexNormals();
    geometry.computeFaceNormals();
    return geometry;
}
//#endregion
//#region Math
/**
 * Constructs a 2D matrix from first vector, replacing the Y axes with the global Y axis,
 * and applies this matrix to the second vector. Saves performance when compared to full 3D matrix application.
 * Useful for character rotation, as it only happens on the Y axis.
 * @param {Vector3} a Vector to construct 2D matrix from
 * @param {Vector3} b Vector to apply basis to
 */
export function appplyVectorMatrixXZ(a, b) {
    return new THREE.Vector3((a.x * b.z + a.z * b.x), b.y, (a.z * b.z + -a.x * b.x));
}
export function round(value, decimals = 0) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
export function roundVector(vector, decimals = 0) {
    return new THREE.Vector3(this.round(vector.x, decimals), this.round(vector.y, decimals), this.round(vector.z, decimals));
}
/**
 * Finds an angle between two vectors
 * @param {THREE.Vector3} v1
 * @param {THREE.Vector3} v2
 */
export function getAngleBetweenVectors(v1, v2, dotTreshold = 0.0005) {
    let angle;
    let dot = v1.dot(v2);
    // If dot is close to 1, we'll round angle to zero
    if (dot > 1 - dotTreshold) {
        angle = 0;
    }
    else {
        // Dot too close to -1
        if (dot < -1 + dotTreshold) {
            angle = Math.PI;
        }
        else {
            // Get angle difference in radians
            angle = Math.acos(dot);
        }
    }
    return angle;
}
/**
 * Finds an angle between two vectors with a sign relative to normal vector
 */
export function getSignedAngleBetweenVectors(v1, v2, normal = new THREE.Vector3(0, 1, 0), dotTreshold = 0.0005) {
    let angle = this.getAngleBetweenVectors(v1, v2, dotTreshold);
    // Get vector pointing up or down
    let cross = new THREE.Vector3().crossVectors(v1, v2);
    // Compare cross with normal to find out direction
    if (normal.dot(cross) < 0) {
        angle = -angle;
    }
    return angle;
}
export function haveSameSigns(n1, n2) {
    return (n1 < 0) === (n2 < 0);
}
export function haveDifferentSigns(n1, n2) {
    return (n1 < 0) !== (n2 < 0);
}
//#endregion
//#region Miscellaneous
export function setDefaults(options, defaults) {
    return _.defaults({}, _.clone(options), defaults);
}
export function spring(source, dest, velocity, mass, damping) {
    let acceleration = dest - source;
    acceleration /= mass;
    velocity += acceleration;
    velocity *= damping;
    let position = source + velocity;
    return new SimulationFrame(position, velocity);
}
export function springV(source, dest, velocity, mass, damping) {
    let acceleration = new THREE.Vector3().subVectors(dest, source);
    acceleration.divideScalar(mass);
    velocity.add(acceleration);
    velocity.multiplyScalar(damping);
    source.add(velocity);
}
export function threeVector(vec) {
    return new THREE.Vector3(vec.x, vec.y, vec.z);
}
export function cannonVector(vec) {
    return new CANNON.Vec3(vec.x, vec.y, vec.z);
}
export function threeQuat(quat) {
    return new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w);
}
export function cannonQuat(quat) {
    return new CANNON.Quaternion(quat.x, quat.y, quat.z, quat.w);
}
export function setupMeshProperties(child) {
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.material.map !== null) {
        let mat = new THREE.MeshPhongMaterial();
        mat.shininess = 0;
        mat.name = child.material.name;
        mat.map = child.material.map;
        mat.map.anisotropy = 4;
        mat.aoMap = child.material.aoMap;
        mat.transparent = child.material.transparent;
        mat.skinning = child.material.skinning;
        // mat.map.encoding = THREE.LinearEncoding;
        child.material = mat;
    }
}
export function detectRelativeSide(from, to) {
    const right = getRight(from, Space.Local);
    const viewVector = to.position.clone().sub(from.position).normalize();
    return right.dot(viewVector) > 0 ? Side.Left : Side.Right;
}
export function easeInOutSine(x) {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}
export function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
}
export function getRight(obj, space = Space.Global) {
    const matrix = getMatrix(obj, space);
    return new THREE.Vector3(matrix.elements[0], matrix.elements[1], matrix.elements[2]);
}
export function getUp(obj, space = Space.Global) {
    const matrix = getMatrix(obj, space);
    return new THREE.Vector3(matrix.elements[4], matrix.elements[5], matrix.elements[6]);
}
export function getForward(obj, space = Space.Global) {
    const matrix = getMatrix(obj, space);
    return new THREE.Vector3(matrix.elements[8], matrix.elements[9], matrix.elements[10]);
}
export function getBack(obj, space = Space.Global) {
    const matrix = getMatrix(obj, space);
    return new THREE.Vector3(-matrix.elements[8], -matrix.elements[9], -matrix.elements[10]);
}
export function getMatrix(obj, space) {
    switch (space) {
        case Space.Local: return obj.matrix;
        case Space.Global: return obj.matrixWorld;
    }
}
export function countSleepyBodies() {
    // let awake = 0;
    // let sleepy = 0;
    // let asleep = 0;
    // this.physicsWorld.bodies.forEach((body) =>
    // {
    //     if (body.sleepState === 0) awake++;
    //     if (body.sleepState === 1) sleepy++;
    //     if (body.sleepState === 2) asleep++;
    // });
}
//#endregion
