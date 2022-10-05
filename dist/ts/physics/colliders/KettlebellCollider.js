import { cannonVector } from '../../core/FunctionLibrary';
export class KettlebellCollider {
    body;
    hitch;
    mesh;
    kettlebell;
    constructor(mesh) {
        let mat = new CANNON.Material('DynamicBarrierMat');
        mat.friction = 0;
        mat.restitution = 0;
        const kettlebellRadius = 1;
        // // Add phys sphere
        this.mesh = mesh;
        this.hitch = new CANNON.Body({
            mass: 0,
            position: cannonVector(mesh.position.clone()),
            shape: new CANNON.Box(new CANNON.Vec3(.1, .1, .1))
        });
        this.body = new CANNON.Body({
            material: mat,
            mass: 1000,
            shape: new CANNON.Sphere(kettlebellRadius),
            position: cannonVector(mesh.position.clone().setY(kettlebellRadius)),
            velocity: new CANNON.Vec3(+mesh.userData.rtl ? 3 : -3, 0, 0)
        });
        this.kettlebell = new CANNON.HingeConstraint(this.hitch, this.body, {
            pivotA: new CANNON.Vec3(0, 0, 0),
            pivotB: new CANNON.Vec3(0, 15.7, 0),
            axisA: new CANNON.Vec3(0, 0, 0),
            axisB: new CANNON.Vec3(0, 0, 0),
        });
    }
}
