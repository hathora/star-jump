import { ArcadePhysics } from "arcade-physics";
import { Body } from "arcade-physics/lib/physics/arcade/Body";
import { Methods, Context } from "./.hathora/methods";
import { Response } from "../api/base";
import { PlayerState, UserId, ISetInputsRequest, Inputs } from "../api/types";

type InternalPlayer = { id: UserId; body: Body; inputs: Inputs };
type InternalState = { physics: ArcadePhysics; entities: InternalPlayer[] };

export class Impl implements Methods<InternalState> {
  initialize(): InternalState {
    const config = {
      sys: {
        game: { config: {} },
        settings: { physics: { gravity: { y: 300 } } },
        scale: { width: 800, height: 600 },
      },
    };
    return { physics: new ArcadePhysics(config), entities: [] };
  }
  joinGame(state: InternalState, userId: string): Response {
    if (state.entities.find((entity) => entity.id === userId) !== undefined) {
      return Response.error("Already joined");
    }
    const body = state.physics.add.body(20, 20, 32, 48);
    body.pushable = false;
    // @ts-ignore
    body.setCollideWorldBounds(true);
    state.entities.forEach((entity) => state.physics.add.collider(body, entity.body));
    state.entities.push({ id: userId, body, inputs: { left: false, right: false, up: false } });
    return Response.ok();
  }
  setInputs(state: InternalState, userId: UserId, ctx: Context, request: ISetInputsRequest): Response {
    const player = state.entities.find((entity) => entity.id === userId);
    if (player === undefined) {
      return Response.error("Player not joined");
    }
    player.inputs = request.inputs;
    return Response.ok();
  }
  getUserState(state: InternalState, userId: UserId): PlayerState {
    return {
      entities: state.entities.map((entity) => ({
        id: entity.id,
        x: entity.body.x,
        y: entity.body.y,
      })),
    };
  }
  onTick(state: InternalState, ctx: Context, timeDelta: number): void {
    state.entities.forEach(({ inputs, body }) => {
      if (inputs.left) {
        body.setVelocityX(-300);
      } else if (inputs.right) {
        body.setVelocityX(300);
      } else {
        body.setVelocityX(0);
      }
      if (inputs.up && body.blocked.down) {
        body.setVelocityY(-200);
      }
    });
    state.physics.world.update(ctx.time, timeDelta * 1000);
  }
}
