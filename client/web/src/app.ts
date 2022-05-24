import Phaser from "phaser";
import { InterpolationBuffer } from "interpolation-buffer";
import { HathoraClient, UpdateArgs } from "../../.hathora/client";
import { Direction, Player, PlayerState, UserId } from "../../../api/types";
import { UserData } from "../../../api/base";

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 800;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

const client = new HathoraClient();
let buffer: InterpolationBuffer<PlayerState> | undefined;
const entities: Map<UserId, Phaser.GameObjects.Sprite> = new Map();

class GameScene extends Phaser.Scene {
  private user!: UserData;

  preload() {
    this.load.spritesheet("player", "/dude.png", { frameWidth: 32, frameHeight: 48 });

    const token = sessionStorage.getItem("token")!;
    this.user = HathoraClient.getUserFromToken(token);
  }

  create() {
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.add.rectangle(200, 500, 400, 32, 0x00ff00).setOrigin(0, 0);

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
    state.entities.forEach(({ id, x, y }) => {
      if (!entities.has(id)) {
        const sprite = new Phaser.GameObjects.Sprite(this, x, y, "player").setOrigin(0, 0);
        this.add.existing(sprite);
        entities.set(id, sprite);
        if (id === this.user.id) {
          this.cameras.main.startFollow(sprite);
        }
      } else {
        const sprite = entities.get(id)!;
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
  if (sessionStorage.getItem("token") === null) {
    sessionStorage.setItem("token", await client.loginAnonymous());
  }
  const token = sessionStorage.getItem("token")!;
  const user = HathoraClient.getUserFromToken(token);
  const connection = await getClient(token, ({ state, updatedAt }) => {
    if (state.entities.find((entity) => entity.id === user.id) === undefined) {
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

async function getClient(token: string, onStateChange: (args: UpdateArgs) => void) {
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
    entities: to.entities.map((toEntity) => {
      const fromEtity = from.entities.find((e) => e.id === toEntity.id);
      return fromEtity !== undefined ? lerpEntity(fromEtity, toEntity, pctElapsed) : toEntity;
    }),
  };
}

function lerpEntity(from: Player, to: Player, pctElapsed: number): Player {
  return {
    id: from.id,
    x: from.x + (to.x - from.x) * pctElapsed,
    y: from.y + (to.y - from.y) * pctElapsed,
  };
}
