import { MAP_WIDTH, MAP_HEIGHT } from "../../../../shared/constants";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../utils";
import backgroundUrl from "../assets/lobby.png";

export class HelpScene extends Phaser.Scene {
  constructor() {
    super("help");
  }

  preload() {
    this.load.image("background", backgroundUrl);
  }

  init(args: any) {
    this.input.keyboard.on("keydown-ENTER", () => this.scene.start("game", args));
    this.input.on("pointerdown", () => this.scene.start("game", args));
  }

  create() {
    this.add.sprite(0, 0, "background").setOrigin(0, 0);
    this.add
      .text(
        VIEWPORT_WIDTH / 2,
        VIEWPORT_HEIGHT / 2,
        `Move around with the arrow keys.
Press space to die and turn into a platform.
Get to the top and collect the star.

Click anywhere to start.`,
        { fontSize: "30px", fontFamily: "futura", color: "black" }
      )
      .setOrigin(0.5);
  }
}
