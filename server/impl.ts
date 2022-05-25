import { ArcadePhysics } from "arcade-physics";
import { Body } from "arcade-physics/lib/physics/arcade/Body";
import { Response } from "../api/base";
import { PlayerState, UserId, ISetInputsRequest, Inputs, IFreezeRequest, XDirection, YDirection } from "../api/types";
import { Methods, Context } from "./.hathora/methods";
import { MAP_HEIGHT, MAP_WIDTH, PLATFORM_HEIGHT, PLAYER_HEIGHT, PLAYER_WIDTH } from "../shared/constants";
import { BORDER_RADIUS, generatePlatforms } from "./map";

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
      platforms: platforms.map(({ x, y, width }) => makePlatform(physics, x, y, width)),
      players: [],
    };
  }
  joinGame(state: InternalState, userId: string, ctx: Context): Response {
    if (state.players.find((player) => player.id === userId) !== undefined) {
      return Response.error("Already joined");
    }
    const playerBody = state.physics.add.body(
      ctx.chance.natural({ max: MAP_WIDTH }),
      MAP_HEIGHT - BORDER_RADIUS,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
    playerBody.pushable = false;
    // @ts-ignore
    playerBody.setCollideWorldBounds(true);
    state.platforms.forEach((platform) => state.physics.add.collider(playerBody, platform));
    state.players.forEach((player) => state.physics.add.collider(playerBody, player.body));
    state.players.push({
      id: userId,
      body: playerBody,
      inputs: { horizontal: XDirection.NONE, vertical: YDirection.NONE },
    });
    return Response.ok();
  }
  setInputs(state: InternalState, userId: UserId, ctx: Context, request: ISetInputsRequest): Response {
    const player = state.players.find((p) => p.id === userId);
    if (player === undefined) {
      return Response.error("Player not joined");
    }
    player.inputs = request.inputs;
    return Response.ok();
  }
  freeze(state: InternalState, userId: string, ctx: Context, request: IFreezeRequest): Response {
    const player = state.players.find((p) => p.id === userId);
    if (player === undefined) {
      return Response.error("Player not joined");
    }
    if (player.body.y < BORDER_RADIUS || player.body.y > MAP_HEIGHT - BORDER_RADIUS) {
      return Response.error("Too close to border");
    }
    const platform = makePlatform(state.physics, player.body.x, player.body.y, PLAYER_WIDTH);
    state.platforms.push(platform);
    state.players.forEach((p) => state.physics.add.collider(p.body, platform));
    return Response.ok();
  }
  getUserState(state: InternalState, userId: UserId): PlayerState {
    return {
      players: state.players.map(({ id, body }) => ({ id, x: body.x, y: body.y })),
      platforms: state.platforms.map(({ x, y, width }) => ({ x, y, width })),
    };
  }
  onTick(state: InternalState, ctx: Context, timeDelta: number): void {
    state.players.forEach(({ inputs, body }) => {
      if (inputs.horizontal === XDirection.LEFT && !body.blocked.left) {
        body.setVelocityX(-300);
      } else if (inputs.horizontal === XDirection.RIGHT && !body.blocked.right) {
        body.setVelocityX(300);
      } else if (inputs.horizontal === XDirection.NONE) {
        body.setVelocityX(0);
      }
      if (inputs.vertical === YDirection.UP && body.blocked.down) {
        body.setVelocityY(-300);
      } else if (inputs.vertical === YDirection.DOWN && !body.blocked.down) {
        body.setVelocityY(300);
      }
    });

    if (state.players.every(({ body }) => body.velocity.x === 0 && body.velocity.y === 0 && body.blocked.down)) {
      return;
    }

    state.physics.world.update(ctx.time, timeDelta * 1000);
  }
}

function makePlatform(physics: ArcadePhysics, x: number, y: number, width: number) {
  const platform = physics.add.body(Math.round(x), Math.round(y), width, PLATFORM_HEIGHT);
  platform.allowGravity = false;
  platform.pushable = false;
  return platform;
}
