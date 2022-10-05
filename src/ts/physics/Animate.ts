import { Vec3 } from 'cannon';
import { Object3D } from 'three';
export class Animate {
  public pObject: CANNON.Body;
  public position: CANNON.Vec3;
  public vObject: Object3D;
  private step: number;
  private frame: number = 0;
  private keyframes: any;
  private keyframeLength: number;
  private fwd: boolean = true;
  private currPosition: CANNON.Vec3 = new CANNON.Vec3();
  private nextPosition: CANNON.Vec3 = new CANNON.Vec3();
  private velocity: CANNON.Vec3 = new CANNON.Vec3();
  private currAngular: CANNON.Vec3 = new CANNON.Vec3();
  private nextAngular: CANNON.Vec3 = new CANNON.Vec3();
  private angularVelocity: CANNON.Vec3 = new CANNON.Vec3();
  private t: number;
  private angularStep: number;
  private _frames: Array<Vec3[]> = [];
  private max: number;

  constructor(pObject: CANNON.Body, vObject: Object3D) {
    this.pObject = pObject;
    this.vObject = vObject;
    this.step = this.vObject.userData.speed || 1
    this.angularStep = this.step || 1
    this.position = pObject.position;
    this.keyframes = [pObject.position.clone(), pObject.angularVelocity.clone()];
    this.keyframeLength = this.keyframes.length - 1;
    this.t = 0;
    const position = this.vObject.userData?.position?.length || 0;
    const rotation = this.vObject.userData?.rotation?.length || 0;
    this.max = Math.max(position, rotation);
    this.makeKeyframes();
  }

  makeKeyframes() {
    
    if (this.max) {
      for (let i = 0; i < this.max; i += 3) {
        this._frames.push([
          new CANNON.Vec3(
            this.vObject.userData.position?.[i] || 0,
            this.vObject.userData.position?.[i + 1] || 0,
            this.vObject.userData.position?.[i + 2] || 0
          ),
          new CANNON.Vec3(
            this.vObject.userData.rotation?.[i] || 0,
            this.vObject.userData.rotation?.[i + 1] || 0,
            this.vObject.userData.rotation?.[i + 2] || 0
          )
        ]);
      }
    }
    this.keyframes = [this.keyframes, ...this._frames];
    this.currPosition = this.keyframes[this.frame][0];
    this.nextPosition = this.keyframes[this.frame + 1][0];
    this.currAngular = this.keyframes[this.frame][1];
    this.nextAngular = this.keyframes[this.frame + 1][1];
    this.getVelocity();
  }

  getVelocity() {
    // @ts-ignore
    let target = this.currPosition.vsub(this.nextPosition);
    let d = target
      .toArray()
      .map((el) => Math.abs(el))
      .sort((a, b) => (a < b ? 1 : -1))[0];
    this.velocity.set((target.x / d) * -1 * this.step, (target.y / d) * -1 * this.step, (target.z / d) * -1 * this.step);
    this.angularVelocity.copy(this.nextAngular);
  }

  getKeyframe() {
    this.currPosition = this.keyframes[this.frame][0];
    this.nextPosition = this.keyframes[this.frame + (this.fwd ? 1 : -1)][0];
    this.currAngular = this.keyframes[this.frame][1];
    this.nextAngular = this.keyframes[this.frame + (this.fwd ? 1 : -1)][1];

    this.getVelocity();
  }

  move() {
    if (this.nextPosition.isZero()) {
      this.pObject.angularVelocity.copy(this.angularVelocity);
      
      this.t = this.t + (this.angularStep * 0.002);
      
      if(this.t > 1){
        this.angularStep = -this.angularStep
        this.angularVelocity.negate(this.angularVelocity)
      } 
      else if(this.t < 0){
        this.angularStep = -this.angularStep
        this.angularVelocity.negate(this.angularVelocity)  
      }
    } else if (this.position.almostEquals(this.nextPosition, 0.1)) {
      if (this.fwd) {
        this.frame++;
        if (!this.keyframes[this.frame + 1]) this.fwd = false;
      } else {
        this.frame--;
        if (!this.keyframes[this.frame - 1]) this.fwd = true;
      }
      this.getKeyframe();
    } else {
      this.position.copy(this.pObject.position);
      this.pObject.velocity.copy(this.velocity);
    }
  }
}
