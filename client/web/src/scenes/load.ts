import { InterpolationBuffer } from "interpolation-buffer";
import { Player, PlayerState } from "../../../../api/types";
import { HathoraClient, HathoraConnection, StateId, UpdateArgs } from "../../../.hathora/client";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "../utils";

export class LoadScene extends Phaser.Scene {
  private client!: HathoraClient;
  private token!: string;
  private stateId!: string;

  constructor() {
    super("load");
  }

  init({ client, token, stateId }: { client: HathoraClient; token: string; stateId: StateId }) {
    this.client = client;
    this.token = token;
    this.stateId = stateId;
  }

  create() {
    this.add.text(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, "Loading...", { fontSize: "50px" }).setOrigin(0.5);
    let stateBuffer: InterpolationBuffer<PlayerState>;
    const eventsBuffer: string[] = [];
    const connection = this.client.connect(
      this.token,
      this.stateId,
      ({ state, updatedAt, events }) => {
        eventsBuffer.push(...events);
        if (stateBuffer === undefined) {
          stateBuffer = new InterpolationBuffer<PlayerState>(state, 25, lerp);
          this.scene.start("help", {
            user: HathoraClient.getUserFromToken(this.token),
            stateBuffer,
            eventsBuffer,
            connection,
          });
        } else {
          stateBuffer.enqueue(state, updatedAt);
        }
      },
      console.error
    );
  }
}

function lerp(from: PlayerState, to: PlayerState, pctElapsed: number): PlayerState {
  return {
    players: to.players.map((toPlayer) => {
      const fromPlayer = from.players.find((p) => p.id === toPlayer.id);
      return fromPlayer !== undefined ? lerpPlayer(fromPlayer, toPlayer, pctElapsed) : toPlayer;
    }),
    platforms: to.platforms,
    star: to.star,
  };
}

function lerpPlayer(from: Player, to: Player, pctElapsed: number): Player {
  return {
    id: from.id,
    x: from.x + (to.x - from.x) * pctElapsed,
    y: from.y + (to.y - from.y) * pctElapsed,
  };
}
