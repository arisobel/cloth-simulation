// cloth.js

class ClothSimulation {
    constructor() {
      this.particles = [];
      this.springs = [];
      this.triangles = [];
      this.uvs = [];
      this.fixedParticles = [];
    }
  
    createIrregularCloth(width, height, spacing) {
      // Cria partículas em grid regular
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const particle = {
            pos: { x: x * spacing, y: y * spacing },
            prevPos: { x: x * spacing, y: y * spacing },
            mass: 1.0,
            pinned: y === 0 && (x % 5 === 0 || x === width - 1)
          };
          this.particles.push(particle);
          this.uvs.push({ u: x / (width - 1), v: y / (height - 1) });
          
          if (particle.pinned) {
            this.fixedParticles.push(particle);
          }
        }
      }
  
      // Cria molas com padrão irregular
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          
          // Molas estruturais (sempre presentes)
          if (x < width - 1) this.addSpring(idx, idx + 1, spacing);
          if (y < height - 1) this.addSpring(idx, idx + width, spacing);
          
          // Molas diagonais (padrão irregular)
          if (x < width - 1 && y < height - 1) {
            // Alterna entre diagonais \ e / baseado na posição
            if ((x + y) % 2 === 0) {
              this.addSpring(idx, idx + width + 1, spacing * Math.sqrt(2));
            } else {
              this.addSpring(idx + 1, idx + width, spacing * Math.sqrt(2));
            }
          }
        }
      }
  
      // Cria triângulos para renderização
      this.createTriangles(width, height);
    }
  
    createTriangles(width, height) {
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
          const idx = y * width + x;
          
          // Alterna a direção dos triângulos baseado na posição
          if ((x + y) % 2 === 0) {
            this.triangles.push([idx, idx + 1, idx + width]);
            this.triangles.push([idx + 1, idx + width + 1, idx + width]);
          } else {
            this.triangles.push([idx, idx + 1, idx + width + 1]);
            this.triangles.push([idx, idx + width + 1, idx + width]);
          }
        }
      }
    }
  
    addSpring(a, b, restLength) {
      this.springs.push({
        a, b, restLength,
        stiffness: 0.5,
        damping: 0.03
      });
    }
  }