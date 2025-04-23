import { useEffect, useRef, useState } from 'react';

const GAME_SIZE = 800;
const SPEED = 100;
const RADIUS = 5;

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const keys = useRef({});
  const [scale, setScale] = useState(1);

  // 🧠 Store all noodles in a Map
  const noodles = useRef(new Map());

  // Add two local noodles
  useEffect(() => {
    noodles.current.set('player-1', {
      id: 'player-1',
      name: 'Justin',
      color: 'red',
      trail: [{ x: 200, y: 400 }],
      angle: 0,
      alive: true,
      controls: { left: 'ArrowLeft', right: 'ArrowRight' },
    });

    noodles.current.set('player-2', {
      id: 'player-2',
      name: 'BotBob',
      color: 'blue',
      trail: [{ x: 600, y: 400 }],
      angle: Math.PI, // facing left
      alive: true,
      controls: { left: 'a', right: 'd' },
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    const draw = () => {
      const local = noodles.current.get('player-1');
      ctx.fillStyle = local?.alive ? '#000' : '#330000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);      

      for (const noodle of noodles.current.values()) {
        ctx.fillStyle = noodle.color;
        for (const point of noodle.trail) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const update = (delta) => {
      for (const noodle of noodles.current.values()) {
        if (!noodle.alive) continue;

        const { left, right } = noodle.controls;
        if (keys.current[left]) noodle.angle -= 2 * delta;
        if (keys.current[right]) noodle.angle += 2 * delta;

        const last = noodle.trail[noodle.trail.length - 1];
        const newX = last.x + Math.cos(noodle.angle) * SPEED * delta;
        const newY = last.y + Math.sin(noodle.angle) * SPEED * delta;
        const newPos = { x: newX, y: newY };

        // Wall death
        if (
          newX < 0 || newX >= GAME_SIZE ||
          newY < 0 || newY >= GAME_SIZE
        ) {
          noodle.alive = false;
          console.log(`${noodle.name} hit the wall.`);
          continue;
        }

        let collided = false;

        // Loop through all noodles
        for (const other of noodles.current.values()) {
          if (!other.alive) continue;
        
          // Determine which trail points to check
          const isSelf = noodle.id === other.id;
          const trail = isSelf ? other.trail.slice(0, -10) : other.trail;
        
          for (const point of trail) {
            if (distance(newPos, point) < RADIUS * 2) {
              noodle.alive = false;
              collided = true;
              console.log(`${noodle.name} crashed into ${isSelf ? 'itself' : other.name}`);
              break;
            }
          }
        
          if (collided) break;
        }        

        noodle.trail.push(newPos);
      }
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

  // Resizing
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
