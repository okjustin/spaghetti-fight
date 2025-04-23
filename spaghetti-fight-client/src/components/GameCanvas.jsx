import { useRef, useEffect } from 'react';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const pos = useRef({ x: 400, y: 300 });
  const angle = useRef(0);
  const speed = 100;
  const keys = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let lastTime = performance.now();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'red';
      ctx.fillRect(pos.current.x, pos.current.y, 5, 5);
    };

    const update = (delta) => {
      if (keys.current.ArrowLeft) angle.current -= 2 * delta;
      if (keys.current.ArrowRight) angle.current += 2 * delta;

      pos.current.x += Math.cos(angle.current) * speed * delta;
      pos.current.y += Math.sin(angle.current) * speed * delta;
    };

    const loop = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      update(delta);
      draw();
      requestAnimationFrame(loop);
    };

    const handleKeyDown = (e) => keys.current[e.key] = true;
    const handleKeyUp = (e) => keys.current[e.key] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />;
}
