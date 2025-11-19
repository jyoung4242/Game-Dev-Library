import { Actor, CollisionContact, CollisionStartEvent, CollisionEndEvent, Component, TileMap } from "excalibur";

type Side = "left" | "right" | "top" | "bottom";

/**
 * Tracks which entities are touching this entity currently.
 *
 * left, right, top, and bottom will contain active or fixed entities,
 * while passives will contain passive entities.
 */
export class TouchingComponent extends Component {
  type = "touching";

  private contacts = new Map<
    string,
    {
      contact: CollisionContact;
      actor: Actor | TileMap;
      side: Side;
    }
  >();

  left = new Set<Actor | TileMap>();
  right = new Set<Actor | TileMap>();
  top = new Set<Actor | TileMap>();
  bottom = new Set<Actor | TileMap>();

  /**
   * Entities that are touching this entity but are not solid. They are
   * not tracked by side because they can move through the entity.
   */
  passives = new Set<Actor | TileMap>();

  onAdd(owner: Actor): void {
    // collect up all of the collisionstart/end events for each frame
    owner.on("collisionstart", (ev: CollisionStartEvent) => {
      let other: Actor | TileMap = ev.other.owner as Actor | TileMap;

      if (other.collider) {
        const side = ev.side.toLowerCase() as "left" | "right" | "top" | "bottom";
        this.contacts.set(ev.contact.id, {
          contact: ev.contact,
          actor: other,
          side,
        });
        this.updateSides();
      }
    });

    owner.on("collisionend", (ev: CollisionEndEvent) => {
      let otherActor: Actor | TileMap = ev.other.owner as Actor | TileMap;
      this.contacts.delete(ev.lastContact.id);
      this.updateSides();
    });
  }

  private updateSides() {
    this.left.clear();
    this.right.clear();
    this.top.clear();
    this.bottom.clear();

    for (const { side, actor } of this.contacts.values()) {
      this[side].add(actor);
    }
  }
}
