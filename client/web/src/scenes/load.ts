import { InterpolationBuffer } from "interpolation-buffer";
import { Player, PlayerState } from "../../../../api/types";
import { HathoraClient, HathoraConnection, UpdateArgs } from "../../../.hathora/client";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "../utils";

export class LoadScene extends Phaser.Scene {
  create() {
    this.add.text(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, "Loading...", { fontSize: "50px" }).setOrigin(0.5);

    const client = new HathoraClient();
    if (sessionStorage.getItem("token") === null) {
      client.loginAnonymous().then((token) => {
        sessionStorage.setItem("token", token);
        start(client, token, this.scene);
      });
    } else {
      const token = sessionStorage.getItem("token")!;
      start(client, token, this.scene);
    }
  }
}

function start(client: HathoraClient, token: string, scenePlugin: Phaser.Scenes.ScenePlugin) {
  let connection: HathoraConnection;
  let stateBuffer: InterpolationBuffer<PlayerState>;
  const eventsBuffer: string[] = [];
  getConnection(client, token, ({ state, updatedAt, events }) => {
    eventsBuffer.push(...events);
    if (stateBuffer === undefined) {
      stateBuffer = new InterpolationBuffer<PlayerState>(state, 25, lerp);
      scenePlugin.start("help", { user: HathoraClient.getUserFromToken(token), stateBuffer, eventsBuffer, connection });
    } else {
      stateBuffer.enqueue(state, updatedAt);
    }
  }).then((conn) => (connection = conn));
}

async function getConnection(client: HathoraClient, token: string, onStateChange: (args: UpdateArgs) => void) {
  if (location.pathname.length > 1) {
    return client.connect(token, location.pathname.split("/").pop()!, onStateChange, console.error);
  } else {
    const stateId = await client.create(token, {});
    history.pushState({}, "", `/${stateId}`);
    return client.connect(token, stateId, onStateChange, console.error);
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
