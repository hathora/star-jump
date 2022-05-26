import { InterpolationBuffer } from "interpolation-buffer";
import { UserData } from "../../../../api/base";
import { Inputs, PlayerState, Star, UserId, XDirection, YDirection } from "../../../../api/types";
import { HathoraConnection } from "../../../.hathora/client";
import { MAP_HEIGHT, MAP_WIDTH, PLATFORM_HEIGHT } from "../../../../shared/constants";

export class GameScene extends Phaser.Scene {
  private user!: UserData;
  private buffer!: InterpolationBuffer<PlayerState>;

  private players: Map<UserId, Phaser.GameObjects.Sprite> = new Map();
  private platforms: { x: number; y: number }[] = [];
  private star: Star | undefined;

  private idleCount = 0;

  constructor() {
    super("game");
  }

  preload() {
    this.load.spritesheet("player", "/player.png", { frameWidth: 32, frameHeight: 32 });
    this.load.image("platform", "/brick.png");
    this.load.image("star", "/star.png");
    this.load.image("background", "/background.png");
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
    this.add.tileSprite(0, 0, MAP_WIDTH, MAP_HEIGHT, "background").setOrigin(0, 0);

    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 10 }),
      frameRate: 10,
    });
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player", { start: 11, end: 22 }),
      frameRate: 10,
    });
    this.anims.create({
      key: "jump",
      frames: [{ key: "player", frame: 23 }],
    });
    this.anims.create({
      key: "fall",
      frames: [{ key: "player", frame: 24 }],
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
        sprite.setTileScale(0.25, 0.25).setOrigin(0, 0);
        this.add.existing(sprite);
        this.platforms.push({ x, y });
      }
    });
    if (this.star === undefined) {
      this.star = state.star;
      this.add.sprite(state.star.x, state.star.y, "star").setScale(0.25).setOrigin(0, 0);
    }
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
      sprite.setFlipX(true);
    } else if (x > sprite.x) {
      sprite.setFlipX(false);
    }

    let idle = false;
    if (y < sprite.y) {
      sprite.anims.play("jump", true);
    } else if (y > sprite.y) {
      sprite.anims.play("fall", true);
    } else if (x !== sprite.x) {
      sprite.anims.play("walk", true);
    } else {
      idle = true;
      if (this.idleCount > 2) {
        sprite.anims.play("idle", true);
      }
    }
    if (idle) {
      this.idleCount++;
    } else {
      this.idleCount = 0;
    }

    sprite.x = x;
    sprite.y = y;
  }
}
