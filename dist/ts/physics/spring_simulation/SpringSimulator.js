import * as THREE from 'three';
import { SimulatorBase } from './SimulatorBase';
import { SimulationFrame } from './SimulationFrame';
import { spring } from '../../core/FunctionLibrary';
export class SpringSimulator extends SimulatorBase {
    position;
    velocity;
    target;
    cache;
    constructor(fps, mass, damping, startPosition = 0, startVelocity = 0) {
        // Construct base
        super(fps, mass, damping);
        // Simulated values
        this.position = startPosition;
        this.velocity = startVelocity;
        // Simulation parameters
        this.target = 0;
        // Initialize cache by pushing two frames
        this.cache = []; // At least two frames
        for (let i = 0; i < 2; i++) {
            this.cache.push(new SimulationFrame(startPosition, startVelocity));
        }
    }
    /**
     * Advances the simulation by given time step
     * @param {number} timeStep
     */
    simulate(timeStep) {
        // Generate new frames
        this.generateFrames(timeStep);
        // Return values interpolated between cached frames
        this.position = THREE.MathUtils.lerp(this.cache[0].position, this.cache[1].position, this.offset / this.frameTime);
        this.velocity = THREE.MathUtils.lerp(this.cache[0].velocity, this.cache[1].velocity, this.offset / this.frameTime);
    }
    /**
     * Gets another simulation frame
     */
    getFrame(isLastFrame) {
        return spring(this.lastFrame().position, this.target, this.lastFrame().velocity, this.mass, this.damping);
    }
}
