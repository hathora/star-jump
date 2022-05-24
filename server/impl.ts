import { ArcadePhysics } from "arcade-physics";
import { Body } from "arcade-physics/lib/physics/arcade/Body";
import { StaticBody } from "arcade-physics/lib/physics/arcade/StaticBody";
import { Response } from "../api/base";
import { PlayerState, UserId, ISetInputsRequest, Inputs, Direction } from "../api/types";
import { Methods, Context } from "./.hathora/methods";
import { MAP_HEIGHT, MAP_WIDTH, PLATFORM_HEIGHT } from "../shared/constants";

type InternalPlayer = { id: UserId; body: Body; inputs: Inputs };
type InternalState = {
  physics: ArcadePhysics;
  platforms: StaticBody[];
  players: InternalPlayer[];
};

export class Impl implements Methods<InternalState> {
  initialize(): InternalState {
    const config = {
      sys: {
        game: { config: {} },
        settings: { physics: { gravity: { y: 300 } } },
        scale: { width: MAP_WIDTH, height: MAP_HEIGHT },
      },
    };
    const physics = new ArcadePhysics(config);
    const platforms = [];
    platforms.push(physics.add.staticBody(200, 600, 400, PLATFORM_HEIGHT));
    platforms.push(physics.add.staticBody(700, 700, 100, PLATFORM_HEIGHT));
    return { physics, platforms, players: [] };
  }
  joinGame(state: InternalState, userId: string): Response {
    if (state.players.find((player) => player.id === userId) !== undefined) {
      return Response.error("Already joined");
    }
    const playerBody = state.physics.add.body(20, 20, 32, 48);
    playerBody.pushable = false;
    // @ts-ignore
    playerBody.setCollideWorldBounds(true);
    state.platforms.forEach((platform) => state.physics.add.collider(playerBody, platform));
    state.players.forEach((player) => state.physics.add.collider(playerBody, player.body));
    state.players.push({ id: userId, body: playerBody, inputs: { horizontal: Direction.NONE, up: false } });
    return Response.ok();
  }
  setInputs(state: InternalState, userId: UserId, ctx: Context, request: ISetInputsRequest): Response {
    const player = state.players.find((player) => player.id === userId);
    if (player === undefined) {
      return Response.error("Player not joined");
    }
    player.inputs = request.inputs;
    return Response.ok();
  }
  getUserState(state: InternalState, userId: UserId): PlayerState {
    return {
      players: state.players.map((player) => ({
        id: player.id,
        x: player.body.x,
        y: player.body.y,
      })),
      platforms: state.platforms.map((platform) => ({
        x: platform.x,
        y: platform.y,
        width: platform.width,
      })),
    };
  }
  onTick(state: InternalState, ctx: Context, timeDelta: number): void {
    state.players.forEach(({ inputs, body }) => {
      if (inputs.horizontal === Direction.LEFT) {
        body.setVelocityX(-300);
      } else if (inputs.horizontal === Direction.RIGHT) {
        body.setVelocityX(300);
      } else {
        body.setVelocityX(0);
      }
      if (inputs.up && body.blocked.down) {
        body.setVelocityY(-250);
      }
    });
    state.physics.world.update(ctx.time, timeDelta * 1000);
  }
}
