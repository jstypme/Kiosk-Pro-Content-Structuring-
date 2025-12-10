import React, { useEffect, useRef } from 'react';

const COLORS = [
  '#4c1d95', // Violet 900
  '#5b21b6', // Violet 800
  '#312e81', // Indigo 900
  '#4338ca', // Indigo 700
  '#6d28d9', // Purple 700
];

class Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  mass: number;

  constructor(w: number, h: number) {
    this.radius = Math.random() * 50 + 20; // Radius between 20 and 70
    this.x = Math.random() * (w - this.radius * 2) + this.radius;
    this.y = Math.random() * (h / 3); // Start in top third
    this.vx = (Math.random() - 0.5) * 4; // Random horizontal velocity
    this.vy = Math.random() * 2; // Initial slight drop
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.mass = this.radius;
  }

  update(w: number, h: number) {
    // Gravity
    this.vy += 0.05;

    // Movement
    this.x += this.vx;
    this.y += this.vy;

    // Floor Bounce
    if (this.y + this.radius > h) {
      this.y = h - this.radius;
      // Bounce with energy retention
      this.vy *= -0.9;
      
      // If velocity is very low, kick it up again to keep animation alive
      if (Math.abs(this.vy) < 4) {
         this.vy = -(Math.random() * 10 + 8);
         this.vx = (Math.random() - 0.5) * 6;
      }
    }

    // Ceiling Bounce
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy *= -0.8;
    }

    // Wall Bounce
    if (this.x + this.radius > w) {
      this.x = w - this.radius;
      this.vx *= -0.9;
    } else if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx *= -0.9;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 15;
    ctx.shadowOffsetY = 15;

    // 3D Gradient Look
    const gradient = ctx.createRadialGradient(
      this.x - this.radius / 3,
      this.y - this.radius / 3,
      this.radius / 10,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, '#a78bfa'); // Light highlight
    gradient.addColorStop(0.2, this.color); // Main color
    gradient.addColorStop(1, '#000000'); // Dark edge

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

const BackgroundAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles: Ball[] = [];
    let animationFrameId: number;

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      particles = [];
      const particleCount = Math.max(10, Math.floor(width / 100)); // Responsive count
      
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Ball(width, height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#0f0c29');
      bgGradient.addColorStop(0.5, '#302b63');
      bgGradient.addColorStop(1, '#24243e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.update(width, height);
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        // Optional: Re-init particles on resize to prevent getting stuck
        // init(); 
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
    />
  );
};

export default BackgroundAnimation;