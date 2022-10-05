import * as THREE from 'three';
import * as Utils from '../../core/FunctionLibrary';
export class BoxCollider {
    options;
    body;
    mesh;
    constructor(options) {
        let defaults = {
            mass: 0,
            position: new THREE.Vector3(),
            size: new THREE.Vector3(0.3, 0.3, 0.3),
            friction: 0.3
        };
        options = Utils.setDefaults(options, defaults);
        this.options = options;
        options.position = new CANNON.Vec3(options.position.x, options.position.y, options.position.z);
        options.size = new CANNON.Vec3(options.size.x, options.size.y, options.size.z);
        this.mesh = options.child;
        let mat = new CANNON.Material('boxMat');
        mat.friction = options.friction;
        let shape = new CANNON.Box(options.size);
        // Add phys sphere
        let physBox = new CANNON.Body({
            mass: options.mass,
            position: options.position,
            shape,
            material: mat
        });
        this.body = physBox;
    }
}
