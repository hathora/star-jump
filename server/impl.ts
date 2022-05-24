import { ArcadePhysics } from "arcade-physics";
import { Body } from "arcade-physics/lib/physics/arcade/Body";
import { Response } from "../api/base";
import { PlayerState, UserId, ISetInputsRequest, Inputs, Direction, IFreezeRequest } from "../api/types";
import { Methods, Context } from "./.hathora/methods";
import { MAP_HEIGHT, MAP_WIDTH, PLATFORM_HEIGHT, PLAYER_HEIGHT, PLAYER_WIDTH } from "../shared/constants";
import { generatePlatforms } from "./generator";

type InternalPlayer = { id: UserId; body: Body; inputs: Inputs };
type InternalState = {
  physics: ArcadePhysics;
  platforms: Body[];
  players: InternalPlayer[];
};

export class Impl implements Methods<InternalState> {
  initialize(ctx: Context): InternalState {
    const config = {
      sys: {
        game: { config: {} },
        settings: { physics: { gravity: { y: 300 } } },
        scale: { width: MAP_WIDTH, height: MAP_HEIGHT },
      },
    };
    const physics = new ArcadePhysics(config);
    const platforms = generatePlatforms(MAP_WIDTH, MAP_HEIGHT, ctx.chance);
    return {
      physics,
      platforms: platforms.map(({ x, y, width }) => makeStaticBody(physics, x, y, width)),
      players: [],
    };
  }
  joinGame(state: InternalState, userId: string): Response {
    if (state.players.find((player) => player.id === userId) !== undefined) {
      return Response.error("Already joined");
    }
    const playerBody = state.physics.add.body(20, 20, PLAYER_WIDTH, PLAYER_HEIGHT);
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
  freeze(state: InternalState, userId: string, ctx: Context, request: IFreezeRequest): Response {
    const player = state.players.find((player) => player.id === userId);
    if (player === undefined) {
      return Response.error("Player not joined");
    }

    const { x, y } = player.body;
    const newPlatform = makeStaticBody(state.physics, x, y, PLAYER_WIDTH);
    state.platforms.push(newPlatform);
    state.players.forEach((p) => state.physics.add.collider(p.body, newPlatform));
    player.body.x = 20;
    player.body.y = 20;
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
function makeStaticBody(physics: ArcadePhysics, x: number, y: number, width: number) {
  const p = physics.add.body(x, y, width, PLATFORM_HEIGHT);
  p.allowGravity = false;
  p.pushable = false;
  return p;
}
