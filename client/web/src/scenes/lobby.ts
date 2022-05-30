import { HathoraClient } from "../../../.hathora/client";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../utils";
import InputText from "phaser3-rex-plugins/plugins/inputtext.js";

export class LobbyScene extends Phaser.Scene {
  create() {
    this.add
      .text(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 8, "Welcome to Star Jump!", { fontSize: "30px" })
      .setOrigin(0.5);
    const createButton = this.add
      .text(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 3, "Create New Game", { fontSize: "20px" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", async () => {
        const client = new HathoraClient();
        if (sessionStorage.getItem("token") === null) {
          const newToken = await client.loginAnonymous();
          sessionStorage.setItem("token", newToken);
        }

        const token = sessionStorage.getItem("token")!;
        const stateId = await client.create(token, {});
        this.scene.start("load", { client, token, stateId });
      });

    const joinButton = this.add
      .text(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 3 + 150, "Join Existing Game", { fontSize: "20px" })
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5)
      .on("pointerdown", async () => {
        const client = new HathoraClient();
        if (sessionStorage.getItem("token") === null) {
          const newToken = await client.loginAnonymous();
          sessionStorage.setItem("token", newToken);
        }

        const token = sessionStorage.getItem("token")!;
        this.scene.start("load", { client, token, stateId: inputText.text?.trim() });
      });
    const config: InputText.IConfig = {
      border: 10,
      borderColor: "black",
      backgroundColor: "white",
      placeholder: "Room Code",
      color: "black",
    };
    const inputText = new InputText(this, joinButton.x, joinButton.y - 30, 100, 30, config);
    this.add.existing(inputText);
  }
}
