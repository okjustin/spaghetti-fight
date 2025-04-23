import { useEffect, useRef, useState } from 'react';

const GAME_SIZE = 800;
const SPEED = 100; // pixels per second

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const keys = useRef({});
  const [scale, setScale] = useState(1);

  // Noodle state
  const noodle = useRef({
    id: 'player-1',
    name: 'Justin',
    color: 'red',
    trail: [{ x: 400, y: 400 }],
    angle: 0,
    alive: true,
  });

  // Movement + game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    const draw = () => {
      // Background based on death
      ctx.fillStyle = noodle.current.alive ? '#000' : '#330000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw noodle trail
      ctx.fillStyle = noodle.current.color;
      for (const point of noodle.current.trail) {
        ctx.fillRect(point.x, point.y, 2, 2);
      }
    };

    const update = (delta) => {
      const player = noodle.current;
      if (!player.alive) return;

      // Rotate
      if (keys.current.ArrowLeft) player.angle -= 2 * delta;
      if (keys.current.ArrowRight) player.angle += 2 * delta;

      // Move
      const last = player.trail[player.trail.length - 1];
      const newX = last.x + Math.cos(player.angle) * SPEED * delta;
      const newY = last.y + Math.sin(player.angle) * SPEED * delta;
      const newPos = { x: newX, y: newY };

      // Wall death
      if (
        newX < 0 || newX >= GAME_SIZE ||
        newY < 0 || newY >= GAME_SIZE
      ) {
        player.alive = false;
        console.log(`${player.name} hit the wall.`);
        return;
      }

      // Self collision (skip last 10 to avoid false positives)
      for (const point of player.trail.slice(0, -10)) {
        if (distance(newPos, point) < 5) {
          player.alive = false;
          console.log(`${player.name} noodle suicide.`);
          return;
        }
      }

      // Add new position to trail
      player.trail.push(newPos);
    };

    const loop = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      update(delta);
      draw();
      requestAnimationFrame(loop);
    };

    const handleKeyDown = (e) => (keys.current[e.key] = true);
    const handleKeyUp = (e) => (keys.current[e.key] = false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Responsive scale logic
  useEffect(() => {
    const handleResize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      const newScale = Math.min(w, h) / GAME_SIZE;
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        width={GAME_SIZE}
        height={GAME_SIZE}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${GAME_SIZE}px`,
          height: `${GAME_SIZE}px`,
        }}
      />
    </div>
  );
}
