export class PathNode {
    object;
    path;
    nextNode;
    previousNode;
    constructor(child, path) {
        this.object = child;
        this.path = path;
    }
}
