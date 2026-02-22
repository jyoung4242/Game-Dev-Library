import { Entity, Engine, Vector, Action, Actor, vec } from "excalibur";
import { CutsceneAction } from "../CutSceneContent/SharedTypes";
import { PositionNode } from "../../Lib/Graph";

export class FollowPathAction extends CutsceneAction {
  isDone: boolean = false;
  _elapsedTime: number = 0;
  _frameCount: number = 0;
  _path: PositionNode<number>[] = [];
  _speed: number = 0;
  _pathIndex: number = 1;
  _target: Actor;

  constructor(target: Actor, path: PositionNode<number>[], speed: number) {
    super();
    this._path = path;
    this._speed = speed;
    this._target = target;
  }

  isCompleted(): boolean {
    return this.isDone;
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    const startTime = Date.now();
    this._elapsedTime = 0;
    this._frameCount = 0;
    this._pathIndex = 1;

    while (true) {
      this._frameCount++;

      //current Tile
      const currentTile = this._path[0];

      // Check if we've reached the destination
      if (this.isCompleted()) {
        return; // End the generator
      }
      //move entity from one tile to another in path, at 'speed' per frame
      let nextTile = this._path[this._pathIndex];
      let nextWaypointPosition = nextTile.pos.clone();
      let myVelocityVectorNormal = nextWaypointPosition.sub((this._target as Actor).pos).normalize();

      if (Math.abs(myVelocityVectorNormal.x) < 0.5) myVelocityVectorNormal.x = 0;
      if (Math.abs(myVelocityVectorNormal.y) < 0.5) myVelocityVectorNormal.y = 0;
      if (myVelocityVectorNormal.x > 0.9) myVelocityVectorNormal.x = 1;
      if (myVelocityVectorNormal.y > 0.9) myVelocityVectorNormal.y = 1;
      if (myVelocityVectorNormal.x < -0.9) myVelocityVectorNormal.x = -1;
      if (myVelocityVectorNormal.y < -0.9) myVelocityVectorNormal.y = -1;

      const myVelocityVector = myVelocityVectorNormal.scale(this._speed);

      //set velocity vector
      (this._target as Actor).vel = myVelocityVector;
      // check for this._target position to be next Tile's position
      if ((this._target as Actor).pos.distance(nextWaypointPosition) < 1) {
        this._pathIndex++;

        if (this._pathIndex >= this._path.length) {
          (this._target as Actor).pos = nextTile.pos.clone();
          this._pathIndex = this._path.length - 1;
          this.isDone = true;
          (this._target as Actor).vel = vec(0, 0);
        }
      }

      // When complete, set state for isComplete to return true
      this._elapsedTime = Date.now() - startTime;
      yield;
    }
  }
}
