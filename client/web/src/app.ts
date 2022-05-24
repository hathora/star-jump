import Phaser from "phaser";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "./utils";
import { LoadScene } from "./scenes/load";
import { GameScene } from "./scenes/game";
import { HelpScene } from "./scenes/help";

new Phaser.Game({
  type: Phaser.AUTO,
  width: VIEWPORT_WIDTH,
  height: VIEWPORT_HEIGHT,
  backgroundColor: "#4488aa",
  scene: [LoadScene, HelpScene, GameScene],
});
