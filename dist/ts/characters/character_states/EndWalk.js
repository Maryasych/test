import { CharacterStateBase, Idle, JumpIdle, Sprint, Walk, } from './_stateLibrary';
export class EndWalk extends CharacterStateBase {
    constructor(character) {
        super(character);
        this.character.setArcadeVelocityTarget(0);
        this.animationLength = character.setAnimation('stop', 0.1);
    }
    update(timeStep) {
        super.update(timeStep);
        if (this.animationEnded(timeStep)) {
            this.character.setState(new Idle(this.character));
        }
        this.fallInAir();
    }
    onInputChange() {
        if (this.character.actions.jump.justPressed) {
            this.character.setState(new JumpIdle(this.character));
        }
        if (this.anyDirection()) {
            if (this.character.actions.run.isPressed) {
                this.character.setState(new Sprint(this.character));
            }
            else {
                if (this.character.velocity.length() > 0.5) {
                    this.character.setState(new Walk(this.character));
                }
                else {
                    this.setAppropriateStartWalkState();
                }
            }
        }
    }
}
