import { useEffect, useRef, useState } from 'react';

const GAME_SIZE = 800;

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const pos = useRef({ x: 400, y: 400 });
  const angle = useRef(0);
  const speed = 100;
  const keys = useRef({});
  const trail = useRef([]);
  const isDead = useRef(false);

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    const draw = () => {
      ctx.fillStyle = isDead.current ? '#330000' : '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    
      ctx.fillStyle = 'red';
      for (const point of trail.current) {
        ctx.fillRect(point.x, point.y, 2, 2);
      }
    };
    
    const update = (delta) => {
      if (isDead.current) return;
    
      if (keys.current.ArrowLeft) angle.current -= 2 * delta;
      if (keys.current.ArrowRight) angle.current += 2 * delta;
    
      pos.current.x += Math.cos(angle.current) * speed * delta;
      pos.current.y += Math.sin(angle.current) * speed * delta;

      const head = { x: pos.current.x, y: pos.current.y };
      const minSelfDistance = 5;

      const trailToCheck = trail.current.slice(0, -10);

      for (const point of trailToCheck) {
        if (distance(head, point) < minSelfDistance) {
          isDead.current = true;
          console.log('💀 Noodle committed suicide.');
          return;
        }
      }
    
      trail.current.push({ x: pos.current.x, y: pos.current.y });
    
      if (
        pos.current.x < 0 ||
        pos.current.x >= GAME_SIZE ||
        pos.current.y < 0 ||
        pos.current.y >= GAME_SIZE
      ) {
        isDead.current = true;
        console.log('💀 Noodle has perished at the wall.');
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

  function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }  

  return (
    <div
      ref={wrapperRef}
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
