import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../utils";

export class HelpScene extends Phaser.Scene {
  constructor() {
    super("help");
  }

  create() {
      console.log("Help scene");
    this.add
      .text(
        VIEWPORT_WIDTH / 2,
        VIEWPORT_HEIGHT / 2,
        `Move around with the arrow keys.
Press space to turn into a platform.

Press enter to start.`,
        { fontSize: "30px" }
      )
      .setOrigin(0.5);
  }
}
