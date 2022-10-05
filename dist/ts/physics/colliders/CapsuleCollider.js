import * as Utils from '../../core/FunctionLibrary';
export class CapsuleCollider {
    options;
    body;
    constructor(options) {
        let defaults = {
            mass: 0,
            position: new CANNON.Vec3(),
            height: 0.7,
            radius: 0.3,
            segments: 8,
            friction: 0.3
        };
        options = Utils.setDefaults(options, defaults);
        this.options = options;
        let mat = new CANNON.Material('capsuleMat');
        mat.friction = options.friction;
        let capsuleBody = new CANNON.Body({
            mass: options.mass,
            position: options.position
        });
        // Compound shape
        let sphereShape = new CANNON.Sphere(options.radius);
        // Materials
        capsuleBody.material = mat;
        // sphereShape.material = mat;
        // TODO: calc shape for each character type individual
        capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, 0.45, -0.1)); // top
        capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, 0.05, 0)); // center
        capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, -0.25, 0)); // bottom
        this.body = capsuleBody;
    }
}
