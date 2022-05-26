# hathora-phaser-demo

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
