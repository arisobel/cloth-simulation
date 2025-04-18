// cloth.js

 class ClothSimulation {
    constructor() {
      this.particles = [];
      this.springs = [];
      this.triangles = [];
      this.uvs = [];
      this.fixedParticles = [];
      this.diagonalPattern = []; // Armazenará o padrão de diagonais
    }
  
    generateRandomDiagonalPattern(width, height) {
        const pattern = [];
        let currentDirection = Math.random() > 0.5 ? 1 : -1;
        
        // Cria padrão em blocos com tamanhos variáveis
        let remaining = width * height;
        while (remaining > 0) {
          // Tamanho do bloco: 2-7 diagonais
          const blockSize = 7 + Math.floor(Math.random() * 5);
          const actualSize = Math.min(blockSize, remaining);
          
          // Adiciona bloco na direção atual
          for (let i = 0; i < actualSize; i++) {
            pattern.push(currentDirection);
          }
          
          remaining -= actualSize;
          currentDirection *= -1; // Alterna direção
        }
        
        this.diagonalPattern = pattern;
      }
  
    createIrregularCloth(width, height, spacing) {
      // Gera o padrão aleatório de diagonais
      this.generateRandomDiagonalPattern(width, height);
      
      // Cria partículas (igual ao anterior)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const particle = {
            pos: { x: x * spacing, y: y * spacing },
            prevPos: { x: x * spacing, y: y * spacing },
            mass: 1.0,
            pinned: y === 0 && (x % 5 === 0 || x === width - 1)
          };
          this.particles.push(particle);
          this.uvs.push({ u: x / (width - 1), v: y / (height - 1) });
          
          if (particle.pinned) this.fixedParticles.push(particle);
        }
      }
  
      // Cria molas com padrão aleatório
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          
          // Molas estruturais
          if (x < width - 1) this.addSpring(idx, idx + 1, spacing);
          if (y < height - 1) this.addSpring(idx, idx + width, spacing);
          
          // Molas diagonais com padrão aleatório
          if (x < width - 1 && y < height - 1) {
            const patternIdx = y * width + x;
            const direction = this.diagonalPattern[patternIdx % this.diagonalPattern.length];
            
            if (direction > 0) {
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
          const patternIdx = y * width + x;
          const direction = this.diagonalPattern[patternIdx % this.diagonalPattern.length];
          
          if (direction > 0) {
            // Diagonal \
            this.triangles.push([idx, idx + 1, idx + width]);
            this.triangles.push([idx + 1, idx + width + 1, idx + width]);
          } else {
            // Diagonal /
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