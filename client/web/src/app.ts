import Phaser from "phaser";
import { InterpolationBuffer } from "interpolation-buffer";
import { HathoraClient, UpdateArgs } from "../../.hathora/client";
import { Direction, Player, PlayerState, UserId } from "../../../api/types";
import { UserData } from "../../../api/base";

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 800;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const PLATFORM_HEIGHT = 32;

let buffer: InterpolationBuffer<PlayerState> | undefined;
const players: Map<UserId, Phaser.GameObjects.Sprite> = new Map();
const platforms: { x: number; y: number }[] = [];

class GameScene extends Phaser.Scene {
  private user!: UserData;

  preload() {
    this.load.spritesheet("player", "/dude.png", { frameWidth: 32, frameHeight: 48 });

    const token = sessionStorage.getItem("token")!;
    this.user = HathoraClient.getUserFromToken(token);
  }

  create() {
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
    });
    this.anims.create({
      key: "turn",
      frames: [{ key: "player", frame: 4 }],
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 5, end: 8 }),
      frameRate: 10,
    });
  }

  update() {
    if (buffer === undefined) {
      return;
    }
    const state = buffer.getInterpolatedState(Date.now());
    state.players.forEach(({ id, x, y }) => {
      if (!players.has(id)) {
        const sprite = new Phaser.GameObjects.Sprite(this, x, y, "player").setOrigin(0, 0);
        this.add.existing(sprite);
        players.set(id, sprite);
        if (id === this.user.id) {
          this.cameras.main.startFollow(sprite);
        }
      } else {
        const sprite = players.get(id)!;
        if (x < sprite.x) {
          sprite.anims.play("left", true);
        } else if (x > sprite.x) {
          sprite.anims.play("right", true);
        } else {
          sprite.anims.play("turn", true);
        }
        sprite.x = x;
        sprite.y = y;
      }
    });
    state.platforms.forEach(({ x, y, width }) => {
      if (platforms.find((platform) => platform.x === x && platform.y === y) === undefined) {
        this.add.rectangle(x, y, width, PLATFORM_HEIGHT, 0x00ff00).setOrigin(0, 0);
        platforms.push({ x, y });
      }
    });
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: VIEWPORT_WIDTH,
  height: VIEWPORT_HEIGHT,
  backgroundColor: "#4488aa",
  scene: GameScene,
};

setupApp().then(() => new Phaser.Game(config));

async function setupApp() {
  const client = new HathoraClient();

  if (sessionStorage.getItem("token") === null) {
    sessionStorage.setItem("token", await client.loginAnonymous());
  }
  const token = sessionStorage.getItem("token")!;
  const user = HathoraClient.getUserFromToken(token);
  const connection = await getConnection(client, token, ({ state, updatedAt }) => {
    if (state.players.find((player) => player.id === user.id) === undefined) {
      connection.joinGame({});
    }
    if (buffer === undefined) {
      buffer = new InterpolationBuffer<PlayerState>(state, 50, lerp);
    } else {
      buffer.enqueue(state, updatedAt);
    }
  });

  const keysDown: Set<string> = new Set();
  function handleKeyEvt(e: KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.key)) {
      return;
    }
    if (e.type === "keydown") {
      if (keysDown.has(e.key)) {
        return;
      }
      keysDown.add(e.key);
    } else if (e.type === "keyup") {
      keysDown.delete(e.key);
    }
    const inputs = {
      horizontal: keysDown.has("ArrowLeft")
        ? Direction.LEFT
        : keysDown.has("ArrowRight")
        ? Direction.RIGHT
        : Direction.NONE,
      up: keysDown.has("ArrowUp"),
    };
    connection.setInputs({ inputs });
  }
  document.addEventListener("keydown", handleKeyEvt);
  document.addEventListener("keyup", handleKeyEvt);
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
  };
}

function lerpPlayer(from: Player, to: Player, pctElapsed: number): Player {
  return {
    id: from.id,
    x: from.x + (to.x - from.x) * pctElapsed,
    y: from.y + (to.y - from.y) * pctElapsed,
  };
}
