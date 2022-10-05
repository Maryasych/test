export class ClosestObjectFinder {
    closestObject;
    closestDistance = Number.POSITIVE_INFINITY;
    referencePosition;
    maxDistance = Number.POSITIVE_INFINITY;
    constructor(referencePosition, maxDistance) {
        this.referencePosition = referencePosition;
        if (maxDistance !== undefined)
            this.maxDistance = maxDistance;
    }
    consider(object, objectPosition) {
        let distance = this.referencePosition.distanceTo(objectPosition);
        if (distance < this.maxDistance && distance < this.closestDistance) {
            this.closestDistance = distance;
            this.closestObject = object;
        }
    }
}
