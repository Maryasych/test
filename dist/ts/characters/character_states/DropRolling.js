import { CharacterStateBase, EndWalk, Walk, } from './_stateLibrary';
export class DropRolling extends CharacterStateBase {
    constructor(character) {
        super(character);
        this.character.velocitySimulator.mass = 1;
        this.character.velocitySimulator.damping = 0.6;
        this.character.setArcadeVelocityTarget(0.8);
        this.playAnimation('drop_running_roll', 0.03);
    }
    update(timeStep) {
        super.update(timeStep);
        this.character.setCameraRelativeOrientationTarget();
        if (this.animationEnded(timeStep)) {
            if (this.anyDirection()) {
                this.character.setState(new Walk(this.character));
            }
            else {
                this.character.setState(new EndWalk(this.character));
            }
        }
    }
}
