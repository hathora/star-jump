# star-jump

Play on [Itch](https://hpx7.itch.io/star-jump).

Built using [Hathora](https://github.com/hathora/hathora) and [Phaser](https://phaser.io/).

### About

- Physics running on the server using [phaser arcade-physics](https://github.com/yandeu/arcade-physics) at 40fps.
- Server continuosly sychronizes state with clients.
- Client rendering at 60fps using Phaser.
- Client just renders based on server info with interpolation -- no physics running client side.

### Running

1. Make sure you have node 16.12+ installed
2. Make sure you have hathora installed (`npm install -g hathora`)
3. Run `hathora dev`
4. Visit http://localhost:3001

![image](https://user-images.githubusercontent.com/5400947/174648702-71cb2b5b-1d24-4187-b59c-da554b571371.png)
