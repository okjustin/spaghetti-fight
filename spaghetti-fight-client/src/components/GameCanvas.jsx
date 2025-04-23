import { useEffect, useRef, useState } from 'react';

const GAME_SIZE = 800;
const SPEED = 40; // Change this freely now, it won't explode your noodles
const RADIUS = 5;

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const generateStartPosition = (id, index = 0) => {
  const spacing = 200;
  return {
    x: 200 + spacing * (index % 3),
    y: 200 + spacing * Math.floor(index / 3),
  };
};

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const keys = useRef({});
  const [scale, setScale] = useState(1);
  const [log, setLog] = useState([]);
  const [round, setRound] = useState(1);
  const [waitingForSpace, setWaitingForSpace] = useState(false);
  const [winnerName, setWinnerName] = useState(null);
  const [scoreboard, setScoreboard] = useState({});
  const noodles = useRef(new Map());

  const addLog = (text) => {
    setLog((prev) => [...prev.slice(-9), text]);
  };

  const playerConfigs = [
    { id: 'player-1', name: 'Justin', color: 'red', controls: { left: 'ArrowLeft', right: 'ArrowRight' } },
    { id: 'player-2', name: 'BotBob', color: 'blue', controls: { left: 'a', right: 'd' } },
    { id: 'player-3', name: 'Noodlord', color: 'green', controls: { left: 'j', right: 'l' } },
  ];

  const startNextRound = () => {
    setWaitingForSpace(false);
    setWinnerName(null);
    setRound((prev) => prev + 1);

    let i = 0;
    noodles.current.forEach((n) => {
      n.trail = [generateStartPosition(n.id, i)];
      n.angle = Math.random() * Math.PI * 2;
      n.alive = true;
      i++;
    });

    addLog(`Round ${round + 1} begins!`);
  };

  const resetGame = () => {
    setWaitingForSpace(false);
    setWinnerName(null);
    setRound(1);

    const newScores = {};
    let i = 0;

    playerConfigs.forEach((config) => {
      noodles.current.set(config.id, {
        ...config,
        trail: [generateStartPosition(config.id, i)],
        angle: Math.random() * Math.PI * 2,
        alive: true,
      });
      newScores[config.id] = 0;
      i++;
    });

    setScoreboard(newScores);
    addLog(`New game starting — Round 1`);
  };

  useEffect(() => {
    resetGame();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => (keys.current[e.key] = true);
    const handleKeyUp = (e) => (keys.current[e.key] = false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
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

        const head = noodle.trail[noodle.trail.length - 1];
        if (head) {
          ctx.fillStyle = noodle.alive ? '#fff' : '#888';
          ctx.font = '16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(noodle.name, head.x, head.y - RADIUS - 2);
        }
      }
    };

    const update = (delta) => {
      if (waitingForSpace) return;

      const toKill = new Set();
      const nextHeads = new Map();

      for (const noodle of noodles.current.values()) {
        if (!noodle.alive) continue;
        const last = noodle.trail[noodle.trail.length - 1];
        const newX = last.x + Math.cos(noodle.angle) * SPEED * delta;
        const newY = last.y + Math.sin(noodle.angle) * SPEED * delta;
        nextHeads.set(noodle.id, { x: newX, y: newY });
      }

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

      for (const noodle of noodles.current.values()) {
        if (!noodle.alive || toKill.has(noodle.id)) continue;

        const { left, right } = noodle.controls;
        if (keys.current[left]) noodle.angle -= 2 * delta;
        if (keys.current[right]) noodle.angle += 2 * delta;

        const newPos = nextHeads.get(noodle.id);
        if (!newPos) continue;

        if (
          newPos.x < 0 || newPos.x >= GAME_SIZE ||
          newPos.y < 0 || newPos.y >= GAME_SIZE
        ) {
          toKill.add(noodle.id);
          addLog(`${noodle.name} hit the wall.`);
          continue;
        }

        let collided = false;
        for (const other of noodles.current.values()) {
          const isSelf = noodle.id === other.id;
          if (isSelf && noodle.trail.length < 20) continue;

          const trail = isSelf
            ? other.trail.filter((point) => distance(point, newPos) >= RADIUS * 2)
            : other.trail;

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

        if (!toKill.has(noodle.id)) {
          noodle.trail.push(newPos);
        }
      }

      for (const id of toKill) {
        const n = noodles.current.get(id);
        if (n) n.alive = false;
      }

      const alive = Array.from(noodles.current.values()).filter((n) => n.alive);

      if (!waitingForSpace) {
        if (alive.length === 1) {
          const winner = alive[0];
          winner.trail = [winner.trail[winner.trail.length - 1]]; // freeze position
          setWinnerName(winner.name);
          setWaitingForSpace(true);
          keys.current = {};
          setScoreboard((prev) => {
            const updated = {
              ...prev,
              [winner.id]: (prev[winner.id] || 0) + 1,
            };
            addLog(`${winner.name} wins round ${round}!`);
            return updated;
          });
        } else if (alive.length === 0) {
          setWinnerName('Nobody');
          setWaitingForSpace(true);
          keys.current = {};
          addLog(`No one survived round ${round}!`);
        }
      }
    };

    const loop = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      update(delta);
      draw();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
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

  useEffect(() => {
    const handleSpace = (e) => {
      if (e.code === 'Space' && waitingForSpace) {
        if (round < 5) {
          startNextRound();
        } else {
          resetGame();
        }
      }
    };

    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [waitingForSpace, round]);

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
      {waitingForSpace && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            padding: '10px 20px',
            color: '#fff',
            fontSize: '24px',
            borderRadius: '10px',
            fontFamily: 'monospace',
          }}
        >
          {round < 5
            ? `${winnerName} wins round ${round}! Press SPACE for next round`
            : `${winnerName} wins the game! Press SPACE to restart`}
        </div>
      )}
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
