import { Application, Rectangle, Sprite, Texture } from "pixi.js";
import { InterpolationBuffer } from "interpolation-buffer";
import { HathoraClient, UpdateArgs } from "../../.hathora/client";
import { Player, PlayerState, UserId } from "../../../api/types";
import skyUrl from "./assets/sky.png";
import dudeUrl from "./assets/dude.png";

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

const client = new HathoraClient();
const entities: Map<UserId, Sprite> = new Map();

const backgroundTexture = Texture.from(skyUrl);
const dudeTexture = Texture.from(dudeUrl);

setupApp().then((view) => {
  document.body.appendChild(view);
});

async function setupApp() {
  const app = new Application({ width: MAP_WIDTH, height: MAP_HEIGHT });
  app.stage.addChild(Sprite.from(backgroundTexture));

  if (sessionStorage.getItem("token") === null) {
    sessionStorage.setItem("token", await client.loginAnonymous());
  }
  const token = sessionStorage.getItem("token")!;
  const user = HathoraClient.getUserFromToken(token);
  let buffer: InterpolationBuffer<PlayerState> | undefined;
  const connection = await getClient(token, ({ state, updatedAt }) => {
    if (state.entities.find((entity) => entity.id === user.id) === undefined) {
      connection.joinGame({});
    }
    if (buffer === undefined) {
      buffer = new InterpolationBuffer<PlayerState>(state, 100, lerp);
    } else {
      buffer.enqueue(state, updatedAt);
    }
  });

  const keysDown: Set<string> = new Set();
  function handleKeyEvt(e: KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.key)) {
      return;
    }
    if (e.type === "keydown") {
      if (keysDown.has(e.key)) {
        return;
      }
      keysDown.add(e.key);
    } else if (e.type === "keyup") {
      keysDown.delete(e.key);
    }
    const inputs = {
      left: keysDown.has("ArrowLeft"),
      right: keysDown.has("ArrowRight"),
      up: keysDown.has("ArrowUp"),
    };
    connection.setInputs({ inputs });
  }
  document.addEventListener("keydown", handleKeyEvt);
  document.addEventListener("keyup", handleKeyEvt);

  app.ticker.add(() => {
    if (buffer === undefined) {
      return;
    }
    const state = buffer.getInterpolatedState(Date.now());
    state.entities.forEach(({ id, x, y }) => {
      if (!entities.has(id)) {
        const sprite = Sprite.from(new Texture(dudeTexture.baseTexture, new Rectangle(128, 0, 32, 48)));
        sprite.x = x;
        sprite.y = y;
        app.stage.addChild(sprite);
        entities.set(id, sprite);
      } else {
        const sprite = entities.get(id)!;
        sprite.x = x;
        sprite.y = y;
      }
    });
  });

  return app.view;
}

async function getClient(token: string, onStateChange: (args: UpdateArgs) => void) {
  if (location.pathname.length > 1) {
    return client.connect(token, location.pathname.split("/").pop()!, onStateChange, console.error);
  } else {
    const stateId = await client.create(token, {});
    history.pushState({}, "", `/${stateId}`);
    return client.connect(token, stateId, onStateChange, console.error);
  }
}

function lerp(from: PlayerState, to: PlayerState, pctElapsed: number): PlayerState {
  return {
    entities: to.entities.map((toEntity) => {
      const fromEtity = from.entities.find((e) => e.id === toEntity.id);
      return fromEtity !== undefined ? lerpEntity(fromEtity, toEntity, pctElapsed) : toEntity;
    }),
  };
}

function lerpEntity(from: Player, to: Player, pctElapsed: number): Player {
  return {
    id: from.id,
    x: from.x + (to.x - from.x) * pctElapsed,
    y: from.y + (to.y - from.y) * pctElapsed,
  };
}
