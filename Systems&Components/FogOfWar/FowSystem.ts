import { System, Query, World, TransformComponent, SystemType, Component, BodyComponent } from "excalibur";
import { FowChildActor } from "../Actors/walkingPlayer";
import { ExIsoMetricMap } from "./levelGen";

const TIK_INTERVAL = 5;
let TIK = 0;

export class FogExplorerComponent extends Component {
  isActive: boolean;
  constructor(isActive: boolean = true) {
    super();
    this.isActive = isActive;
  }
}

export class FOW extends System {
  explorerQuery: Query<typeof FogExplorerComponent | typeof TransformComponent | typeof BodyComponent>;
  constructor(world: World) {
    super();
    this.explorerQuery = world.query([FogExplorerComponent, TransformComponent, BodyComponent]);
  }

  public priority = 99;
  public systemType = SystemType.Update;
  private _map: ExIsoMetricMap | null = null;

  registerMap(map: ExIsoMetricMap) {
    this._map = map;
  }

  public update() {
    if (!this._map) return;

    for (let entity of this.explorerQuery.entities) {
      TIK++;
      if (TIK % TIK_INTERVAL !== 0) continue;
      TIK = 0;
      const transform = entity.get(TransformComponent);
      const explorer = entity.get(FogExplorerComponent).owner as FowChildActor;

      if (!transform || !explorer || !explorer.isActive) continue;

      const explorerBounds = explorer.graphics.bounds;

      for (const tile of this._map.tiles) {
        const tileGlobalBounds = tile.data.get("bounds");
        if (
          explorerBounds.left < tileGlobalBounds.right &&
          explorerBounds.right > tileGlobalBounds.left &&
          explorerBounds.top < tileGlobalBounds.bottom &&
          explorerBounds.bottom > tileGlobalBounds.top
        ) {
          if (tile.data.get("fog") === false) continue;
          if (this._map.dirtyTiles === undefined) continue;
          //if tile already in dirty tiles, continue
          if (this._map.dirtyTiles.includes(tile)) continue;

          tile.data.set("fog", false);
          this._map.addTag("dirty");
          this._map.dirtyTiles.push(tile);
        }
      }
    }
  }
}
