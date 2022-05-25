import { InterpolationBuffer } from "interpolation-buffer";
import { UserData } from "../../../../api/base";
import { PlayerState } from "../../../../api/types";
import { HathoraConnection } from "../../../.hathora/client";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../utils";

export class HelpScene extends Phaser.Scene {
  constructor() {
    super("help");
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
    this.input.keyboard.on("keydown-ENTER", () => {
      this.scene.start("game", { connection, buffer, user });
    });
  }

  create() {
    this.add
      .text(
        VIEWPORT_WIDTH / 2,
        VIEWPORT_HEIGHT / 2,
        `Move around with the arrow keys.
Press space to die and turn into a platform.
Get to the top and collect the star.

Press enter to start.`,
        { fontSize: "30px" }
      )
      .setOrigin(0.5);
  }
}
