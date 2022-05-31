import { InterpolationBuffer } from "interpolation-buffer";
import { Player, PlayerState } from "../../../../api/types";
import { MAP_WIDTH, MAP_HEIGHT } from "../../../../shared/constants";
import { HathoraClient, StateId } from "../../../.hathora/client";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "../utils";
import backgroundUrl from "../assets/lobby.png";

export type BufferType = { state: PlayerState; events: string[] };

export class LoadScene extends Phaser.Scene {
  private client!: HathoraClient;
  private token!: string;
  private stateId!: string;

  constructor() {
    super("load");
  }

  preload() {
    this.load.image("background", backgroundUrl);
  }

  init({ client, token, stateId }: { client: HathoraClient; token: string; stateId: StateId }) {
    this.client = client;
    this.token = token;
    this.stateId = stateId;
  }

  create() {
    this.add.sprite(0, 0, "background").setOrigin(0, 0).setDisplaySize(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    this.add
      .text(VIEWPORT_WIDTH / 2, (VIEWPORT_HEIGHT / 3) * 4, "Loading...", {
        fontSize: "50px",
        fontFamily: "futura",
        color: "black",
      })
      .setOrigin(0.5);
    let buffer: InterpolationBuffer<BufferType>;
    const connection = this.client.connect(
      this.token,
      this.stateId,
      ({ state, updatedAt, events }) => {
        if (buffer === undefined) {
          buffer = new InterpolationBuffer({ state, events }, 25, lerp);
          this.scene.start("help", {
            user: HathoraClient.getUserFromToken(this.token),
            buffer,
            connection,
          });
        } else {
          buffer.enqueue({ state, events }, updatedAt);
        }
      },
      console.error
    );
  }
}

function lerp(from: BufferType, to: BufferType, pctElapsed: number): BufferType {
  const state = {
    players: to.state.players.map((toPlayer) => {
      const fromPlayer = from.state.players.find((p) => p.id === toPlayer.id);
      return fromPlayer !== undefined ? lerpPlayer(fromPlayer, toPlayer, pctElapsed) : toPlayer;
    }),
    platforms: to.state.platforms,
    star: to.state.star,
    startTime: to.state.startTime,
    finishTime: to.state.finishTime,
  };
  return { state, events: to.events };
}

function lerpPlayer(from: Player, to: Player, pctElapsed: number): Player {
  return {
    id: from.id,
    x: from.x + (to.x - from.x) * pctElapsed,
    y: from.y + (to.y - from.y) * pctElapsed,
  };
}
