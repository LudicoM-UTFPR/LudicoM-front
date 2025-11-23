import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  type: 'dice' | 'card' | 'pawn' | 'token';
  size: number;
  opacity: number;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Configurar dimensões do canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Cor primária do tema
    const primaryColor = '#E76F51';

    // Inicializar partículas
    const initParticles = () => {
    //   const particleCount = Math.floor((canvas.width * canvas.height) / 25000); // Densidade adaptativa
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000); // Densidade adaptativa
      particlesRef.current = [];

      for (let i = 0; i < particleCount; i++) {
        const types: Particle['type'][] = ['dice', 'card', 'pawn'];
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.01,
          type: types[Math.floor(Math.random() * types.length)],
          size: Math.random() * 20 + 15,
        //   opacity: Math.random() * 0.15 + 0.05,
          opacity: Math.random() * 0.18 + 0.15,
        });
      }
    };

    initParticles();

    // Funções de desenho para cada tipo de elemento
    const drawDice = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      
      // Pontos do dado
      const dotSize = size / 8;
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(-size / 4, -size / 4, dotSize, 0, Math.PI * 2);
      ctx.arc(size / 4, size / 4, dotSize, 0, Math.PI * 2);
      ctx.arc(0, 0, dotSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawCard = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      const width = size * 0.7;
      const height = size;
      ctx.strokeRect(-width / 2, -height / 2, width, height);
      
      // Símbolo no centro
      ctx.beginPath();
      ctx.moveTo(0, -height / 4);
      ctx.lineTo(width / 6, 0);
      ctx.lineTo(0, height / 4);
      ctx.lineTo(-width / 6, 0);
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    };

    const drawPawn = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      
      // Cabeça do peão
      ctx.beginPath();
      ctx.arc(0, -size / 3, size / 4, 0, Math.PI * 2);
      ctx.stroke();
      
      // Corpo do peão
      ctx.beginPath();
      ctx.moveTo(-size / 3, size / 2);
      ctx.lineTo(-size / 6, -size / 6);
      ctx.lineTo(size / 6, -size / 6);
      ctx.lineTo(size / 3, size / 2);
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    };

    const drawToken = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      
      // Círculo externo
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.stroke();
      
      // Estrela interna
      const points = 5;
      const outerRadius = size / 3;
      const innerRadius = size / 6;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / points;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    };

    // Loop de animação
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Atualizar posição
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Wrap around nas bordas
        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;

        // Desenhar baseado no tipo
        switch (particle.type) {
          case 'dice':
            drawDice(ctx, particle.x, particle.y, particle.size, particle.rotation, particle.opacity);
            break;
          case 'card':
            drawCard(ctx, particle.x, particle.y, particle.size, particle.rotation, particle.opacity);
            break;
          case 'pawn':
            drawPawn(ctx, particle.x, particle.y, particle.size, particle.rotation, particle.opacity);
            break;
        }
      });

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationIdRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default AnimatedBackground;
