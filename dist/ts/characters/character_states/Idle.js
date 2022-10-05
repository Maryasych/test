import { CharacterStateBase, JumpIdle, Walk, } from './_stateLibrary';
export class Idle extends CharacterStateBase {
    constructor(character) {
        super(character);
        this.character.velocitySimulator.damping = 0.6;
        this.character.velocitySimulator.mass = 10;
        this.character.setArcadeVelocityTarget(0);
        this.playAnimation('idle', 0.1);
    }
    update(timeStep) {
        super.update(timeStep);
        this.fallInAir();
    }
    onInputChange() {
        if (this.character.actions.jump.justPressed) {
            this.character.setState(new JumpIdle(this.character));
        }
        if (this.anyDirection()) {
            if (this.character.velocity.length() > 0.5) {
                this.character.setState(new Walk(this.character));
            }
            else {
                this.setAppropriateStartWalkState();
            }
        }
    }
}
