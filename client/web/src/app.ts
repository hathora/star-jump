import Phaser from "phaser";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "./utils";
import { LoadScene } from "./scenes/load";
import { GameScene } from "./scenes/game";
import { HelpScene } from "./scenes/help";
import { LobbyScene } from "./scenes/lobby";

new Phaser.Game({
  type: Phaser.AUTO,
  width: VIEWPORT_WIDTH,
  height: VIEWPORT_HEIGHT,
  backgroundColor: "#4488aa",
  scene: [LobbyScene, LoadScene, HelpScene, GameScene],
  parent: "phaser-container",
  dom: {
    createContainer: true,
  },
});
