import { InterpolationBuffer } from "interpolation-buffer";
import { UserData } from "../../../../api/base";
import { Inputs, PlayerState, UserId, XDirection, YDirection } from "../../../../api/types";
import { HathoraConnection } from "../../../.hathora/client";
import { MAP_HEIGHT, MAP_WIDTH, PLATFORM_HEIGHT } from "../../../../shared/constants";

export class GameScene extends Phaser.Scene {
  private user!: UserData;
  private buffer!: InterpolationBuffer<PlayerState>;

  private players: Map<UserId, Phaser.GameObjects.Sprite> = new Map();
  private platforms: { x: number; y: number }[] = [];

  constructor() {
    super("game");
  }

  preload() {
    this.load.spritesheet("player", "/dude.png", { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet("platform", "/tile.png", { frameWidth: 18, frameHeight: 18 });
  }

  init({
    user,
    buffer,
    connection,
  }: {
    user: UserData;
    buffer: InterpolationBuffer<PlayerState>;
    connection: HathoraConnection;
  }) {
    this.user = user;
    this.buffer = buffer;

    connection.joinGame({});

    const keys = this.input.keyboard.createCursorKeys();
    let prevInputs: Inputs | undefined;
    function handleKeyEvt() {
      const inputs: Inputs = {
        horizontal: keys.left.isDown ? XDirection.LEFT : keys.right.isDown ? XDirection.RIGHT : XDirection.NONE,
        vertical: keys.up.isDown ? YDirection.UP : keys.down.isDown ? YDirection.DOWN : YDirection.NONE,
      };
      if (prevInputs === undefined || JSON.stringify(inputs) !== JSON.stringify(prevInputs)) {
        connection.setInputs({ inputs });
        prevInputs = inputs;
      }
    }

    this.input.keyboard.on("keydown-SPACE", () => connection.freeze({}));
    this.input.keyboard.on("keydown", handleKeyEvt);
    this.input.keyboard.on("keyup", handleKeyEvt);
  }

  create() {
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
    });
    this.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: 4 }],
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 5, end: 8 }),
      frameRate: 10,
    });
  }

  update() {
    const state = this.buffer.getInterpolatedState(Date.now());
    state.players.forEach(({ id, x, y }) => {
      if (!this.players.has(id)) {
        this.addPlayer(id, x, y);
      } else {
        this.updatePlayer(id, x, y);
      }
    });
    state.platforms.forEach(({ x, y, width }) => {
      if (this.platforms.find((platform) => platform.x === x && platform.y === y) === undefined) {
        const sprite = new Phaser.GameObjects.TileSprite(this, x, y, width, PLATFORM_HEIGHT, "platform");
        sprite.setOrigin(0, 0);
        this.add.existing(sprite);
        this.platforms.push({ x, y });
      }
    });
  }

  private addPlayer(id: string, x: number, y: number) {
    const sprite = new Phaser.GameObjects.Sprite(this, x, y, "player").setOrigin(0, 0);
    this.add.existing(sprite);
    this.players.set(id, sprite);
    if (id === this.user.id) {
      this.cameras.main.startFollow(sprite);
    }
  }

  private updatePlayer(id: string, x: number, y: number) {
    const sprite = this.players.get(id)!;
    if (x < sprite.x) {
      sprite.anims.play("left", true);
    } else if (x > sprite.x) {
      sprite.anims.play("right", true);
    } else {
      sprite.anims.play("idle", true);
    }
    sprite.x = x;
    sprite.y = y;
  }
}
