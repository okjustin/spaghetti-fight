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
  const [log, setLog] = useState([]);

  const addLog = (text) => {
    setLog(prev => [...prev.slice(-9), text]);
  };  

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
      name: 'Noah',
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
      
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      for (const noodle of noodles.current.values()) {
        ctx.fillStyle = noodle.color;
        for (const point of noodle.trail) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const noodle of noodles.current.values()) {
        const head = noodle.trail[noodle.trail.length - 1];
        if (!head) continue;
      
        ctx.fillStyle = noodle.alive ? '#fff' : '#888';
        ctx.fillText(noodle.name, head.x, head.y - RADIUS - 2);
      }
    };

    const update = (delta) => {
      const toKill = new Set();
      const nextHeads = new Map();
    
      // Step 1: Precalculate next head position for every living noodle
      for (const noodle of noodles.current.values()) {
        if (!noodle.alive) continue;
    
        const last = noodle.trail[noodle.trail.length - 1];
        const newX = last.x + Math.cos(noodle.angle) * SPEED * delta;
        const newY = last.y + Math.sin(noodle.angle) * SPEED * delta;
    
        nextHeads.set(noodle.id, { x: newX, y: newY });
      }
    
      // Step 2: Head-on collision detection
      for (const [id1, head1] of nextHeads.entries()) {
        for (const [id2, head2] of nextHeads.entries()) {
          if (id1 >= id2) continue;
    
          if (distance(head1, head2) < RADIUS * 2) {
            toKill.add(id1);
            toKill.add(id2);
    
            const a = noodles.current.get(id1);
            const b = noodles.current.get(id2);
            addLog(`${a?.name} and ${b?.name} bonked heads!`);
          }
        }
      }
    
      // Step 3: Process all movement and trail collisions
      for (const noodle of noodles.current.values()) {
        if (!noodle.alive || toKill.has(noodle.id)) continue;
    
        const { left, right } = noodle.controls;
        if (keys.current[left]) noodle.angle -= 2 * delta;
        if (keys.current[right]) noodle.angle += 2 * delta;
    
        const newPos = nextHeads.get(noodle.id);
        if (!newPos) continue;
    
        // Wall collision
        if (
          newPos.x < 0 || newPos.x >= GAME_SIZE ||
          newPos.y < 0 || newPos.y >= GAME_SIZE
        ) {
          toKill.add(noodle.id);
          addLog(`${noodle.name} hit the wall.`);
          continue;
        }
    
        // Trail collision (self and others)
        let collided = false;
    
        for (const other of noodles.current.values()) {
          const isSelf = noodle.id === other.id;
          const trail = isSelf ? other.trail.slice(0, -10) : other.trail;
    
          for (const point of trail) {
            if (distance(newPos, point) < RADIUS * 2) {
              toKill.add(noodle.id);
              collided = true;
              addLog(`${noodle.name} crashed into ${isSelf ? 'itself' : other.name}`);
              break;
            }
          }
    
          if (collided) break;
        }
    
        // Push position if not dead
        if (!toKill.has(noodle.id)) {
          noodle.trail.push(newPos);
        }
      }
    
      // Step 4: Finalise deaths
      for (const id of toKill) {
        const n = noodles.current.get(id);
        if (n) n.alive = false;
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
        position: 'relative',
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
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#fff',
          maxWidth: '300px',
          maxHeight: '120px',
          overflowY: 'auto',
        }}
      >
        {log.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
      </div>
    </div>
  );  
}
