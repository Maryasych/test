import * as Utils from '../../core/FunctionLibrary';
import { DropIdle, DropRolling, DropRunning, DropUp, Falling, Sprint, StartWalkBackLeft, StartWalkBackRight, StartWalkForward, StartWalkLeft, StartWalkRight, Walk, } from './_stateLibrary';
export class CharacterStateBase {
    character;
    timer;
    animationLength;
    canFindVehiclesToEnter;
    canEnterVehicles;
    canLeaveVehicles;
    constructor(character) {
        this.character = character;
        this.character.velocitySimulator.damping = this.character.defaultVelocitySimulatorDamping;
        this.character.velocitySimulator.mass = this.character.defaultVelocitySimulatorMass;
        this.character.rotationSimulator.damping = this.character.defaultRotationSimulatorDamping;
        this.character.rotationSimulator.mass = this.character.defaultRotationSimulatorMass;
        this.character.arcadeVelocityIsAdditive = false;
        this.character.setArcadeVelocityInfluence(1, 0, 1);
        this.canFindVehiclesToEnter = true;
        this.canEnterVehicles = false;
        this.canLeaveVehicles = true;
        this.timer = 0;
    }
    update(timeStep) {
        this.timer += timeStep;
    }
    onInputChange() { }
    noDirection() {
        return !this.character.actions.up.isPressed && !this.character.actions.down.isPressed && !this.character.actions.left.isPressed && !this.character.actions.right.isPressed;
    }
    anyDirection() {
        return this.character.actions.up.isPressed || this.character.actions.down.isPressed || this.character.actions.left.isPressed || this.character.actions.right.isPressed;
    }
    fallInAir() {
        if (!this.character.rayHasHit) {
            this.character.setState(new Falling(this.character));
        }
    }
    animationEnded(timeStep) {
        if (this.character.mixer !== undefined) {
            if (this.animationLength === undefined) {
                console.error(this.constructor.name + 'Error: Set this.animationLength in state constructor!');
                return false;
            }
            else {
                return this.timer > this.animationLength - timeStep;
            }
        }
        else {
            return true;
        }
    }
    setAppropriateDropState(allreadyJumped) {
        if (this.character.groundImpactData.velocity.y < -6) {
            this.character.setState(new DropRolling(this.character));
        }
        else if (this.character.groundImpactData.velocity.y > -4.5 && allreadyJumped) {
            console.log('here');
            this.character.setState(new DropUp(this.character));
        }
        else if (this.anyDirection()) {
            if (this.character.groundImpactData.velocity.y < -2) {
                this.character.setState(new DropRunning(this.character));
            }
            else {
                if (this.character.actions.run.isPressed) {
                    this.character.setState(new Sprint(this.character));
                }
                else {
                    this.character.setState(new Walk(this.character));
                }
            }
        }
        else {
            this.character.setState(new DropIdle(this.character));
        }
    }
    setAppropriateStartWalkState() {
        let range = Math.PI;
        let angle = Utils.getSignedAngleBetweenVectors(this.character.orientation, this.character.getCameraRelativeMovementVector());
        if (angle > range * 0.8) {
            this.character.setState(new StartWalkBackLeft(this.character));
        }
        else if (angle < -range * 0.8) {
            this.character.setState(new StartWalkBackRight(this.character));
        }
        else if (angle > range * 0.3) {
            this.character.setState(new StartWalkLeft(this.character));
        }
        else if (angle < -range * 0.3) {
            this.character.setState(new StartWalkRight(this.character));
        }
        else {
            this.character.setState(new StartWalkForward(this.character));
        }
    }
    playAnimation(animName, fadeIn) {
        this.animationLength = this.character.setAnimation(animName, fadeIn);
    }
}
