import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../utils";

export class HelpScene extends Phaser.Scene {
  constructor() {
    super("help");
  }

  init(args: any) {
    this.input.keyboard.on("keydown-ENTER", () => this.scene.start("game", args));
    this.input.on("pointerdown", () => this.scene.start("game", args));
  }

  create() {
    this.add
      .text(
        VIEWPORT_WIDTH / 2,
        VIEWPORT_HEIGHT / 2,
        `Move around with the arrow keys.
Press space to die and turn into a platform.
Get to the top and collect the star.

Click anywhere to start.`,
        { fontSize: "30px" }
      )
      .setOrigin(0.5);
  }
}
