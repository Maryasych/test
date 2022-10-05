import { CharacterStateBase, Falling, } from './_stateLibrary';
export class JumpRunning extends CharacterStateBase {
    alreadyJumped;
    constructor(character) {
        super(character);
        this.character.velocitySimulator.mass = 100;
        this.playAnimation('jump_running', 0.03);
        this.alreadyJumped = false;
    }
    update(timeStep) {
        super.update(timeStep);
        this.character.setCameraRelativeOrientationTarget();
        // Move in air
        if (this.alreadyJumped) {
            this.character.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);
        }
        // Physically jump
        if (this.timer > 0.13 && !this.alreadyJumped) {
            this.character.jump(4);
            this.alreadyJumped = true;
            this.character.rotationSimulator.damping = 0.3;
            this.character.arcadeVelocityIsAdditive = true;
            this.character.setArcadeVelocityInfluence(0.05, 0, 0.05);
        }
        else if (this.timer > 0.24 && this.character.rayHasHit) {
            this.setAppropriateDropState();
        }
        else if (this.animationEnded(timeStep)) {
            this.character.setState(new Falling(this.character, this.alreadyJumped));
        }
    }
}
