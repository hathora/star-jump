import { InterpolationBuffer } from "interpolation-buffer";
import { UserData } from "../../../../api/base";
import { Inputs, Platform, Player, PlayerState, Star, UserId, XDirection, YDirection } from "../../../../api/types";
import { HathoraConnection } from "../../../.hathora/client";
import { MAP_HEIGHT, MAP_WIDTH, PLATFORM_HEIGHT } from "../../../../shared/constants";

import playerUrl from "../assets/player.png";
import platformUrl from "../assets/brick.png";
import starUrl from "../assets/star.png";
import backgroundUrl from "../assets/background.png";
import jumpUrl from "../assets/jump.mp3";
import musicUrl from "../assets/music.ogg";

export class GameScene extends Phaser.Scene {
  private user!: UserData;
  private stateBuffer!: InterpolationBuffer<PlayerState>;
  private eventsBuffer!: string[];

  private players: Map<UserId, Phaser.GameObjects.Sprite> = new Map();
  private platforms: { x: number; y: number }[] = [];
  private star: Star | undefined;

  private jumpSound!: Phaser.Sound.BaseSound;

  private idleCount = 0;

  constructor() {
    super("game");
  }

  preload() {
    this.load.spritesheet("player", playerUrl, { frameWidth: 32, frameHeight: 32 });
    this.load.image("platform", platformUrl);
    this.load.image("star", starUrl);
    this.load.image("background", backgroundUrl);
    this.load.audio("jump", jumpUrl);
    this.load.audio("music", musicUrl);
  }

  init({
    user,
    stateBuffer,
    eventsBuffer,
    connection,
  }: {
    user: UserData;
    stateBuffer: InterpolationBuffer<PlayerState>;
    eventsBuffer: string[];
    connection: HathoraConnection;
  }) {
    this.user = user;
    this.stateBuffer = stateBuffer;
    this.eventsBuffer = eventsBuffer;

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

    this.sound.play("music", { loop: true });
    this.jumpSound = this.sound.add("jump");

    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 10 }),
      frameRate: 15,
    });
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player", { start: 11, end: 22 }),
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
    const state = this.stateBuffer.getInterpolatedState(Date.now());
    state.players.forEach((player) => {
      if (!this.players.has(player.id)) {
        this.addPlayer(player);
      } else {
        this.updatePlayer(player);
      }
    });
    state.platforms.forEach((platform) => {
      if (this.platforms.find((p) => p.x === platform.x && p.y === platform.y) === undefined) {
        this.addPlatform(platform);
      }
    });
    if (this.star === undefined) {
      this.star = state.star;
      this.add.sprite(state.star.x, state.star.y, "star").setScale(0.25).setOrigin(0, 0);
    }

    this.eventsBuffer.forEach((event) => {
      if (event === "jump") {
        this.jumpSound.play();
      } else {
        console.error("Unkown event: ", event);
      }
    });
    this.eventsBuffer.splice(0, this.eventsBuffer.length);
  }

  private addPlayer({ id, x, y }: Player) {
    const sprite = new Phaser.GameObjects.Sprite(this, x, y, "player").setOrigin(0, 0);
    this.add.existing(sprite);
    this.players.set(id, sprite);
    if (id === this.user.id) {
      this.cameras.main.startFollow(sprite);
    }
  }

  private addPlatform({ x, y, width }: Platform) {
    const sprite = new Phaser.GameObjects.TileSprite(this, x, y, width, PLATFORM_HEIGHT, "platform")
      .setTileScale(0.25, 0.25)
      .setOrigin(0, 0);
    this.add.existing(sprite);
    this.platforms.push({ x, y });
  }

  private updatePlayer({ id, x, y }: Player) {
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
