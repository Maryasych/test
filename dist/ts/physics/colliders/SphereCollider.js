import * as Utils from '../../core/FunctionLibrary';
export class SphereCollider {
    options;
    body;
    constructor(options) {
        let defaults = {
            mass: 0,
            position: new CANNON.Vec3(),
            radius: 0.3,
            friction: 0.3
        };
        options = Utils.setDefaults(options, defaults);
        this.options = options;
        let mat = new CANNON.Material('sphereMat');
        mat.friction = options.friction;
        let shape = new CANNON.Sphere(options.radius);
        // shape.material = mat;
        // Add phys sphere
        let physSphere = new CANNON.Body({
            mass: options.mass,
            position: options.position,
            shape
        });
        physSphere.material = mat;
        this.body = physSphere;
    }
}
