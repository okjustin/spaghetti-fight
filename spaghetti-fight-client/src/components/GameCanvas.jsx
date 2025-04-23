import { useEffect, useRef } from 'react';

export default function GameCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let x = 50;
    let y = 50;
    let dx = 10;
    let dy = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'red';
      ctx.fillRect(x, y, 10, 10);
    };

    const update = () => {
      x += dx;
      y += dy;

      draw();
    };

    const interval = setInterval(update, 100);

    const handleKey = (e) => {
      if (e.key === 'ArrowUp') [dx, dy] = [0, -10];
      if (e.key === 'ArrowDown') [dx, dy] = [0, 10];
      if (e.key === 'ArrowLeft') [dx, dy] = [-10, 0];
      if (e.key === 'ArrowRight') [dx, dy] = [10, 0];
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKey);
    }
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} />;
}