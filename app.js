// app.js - Arquivo principal da aplicação

// Configurações iniciais
const params = {
    width: 30,
    height: 30,
    spacing: 12,
    stiffness: 0.5,
    damping: 0.03,
    density: 1.0,
    gravity: 0.5,
    wind: 0.0,
    pattern: 'stripes',
    patternColor1: '#FF5722',
    patternColor2: '#FFFFFF',
    showWireframe: false,
    mouseInteraction: true,
    mouseRadius: 60,
    mouseStrength: 0.7,
    imageScale: 1.0
};

// Elementos do DOM
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const statusDisplay = document.getElementById('status');

// Variáveis de estado
let patternCanvas = document.createElement('canvas');
let patternTexture = null;
let customImage = null;
let mouse = { x: 0, y: 0, prevX: 0, prevY: 0, isDown: false };
let selectedParticle = null;

// Inicializa a simulação
const clothSim = new ClothSimulation();

function update() {
    updatePhysics();
    render();
    requestAnimationFrame(update);
}


// Função principal de inicialização
function init() {
    resizeCanvas();
    clothSim.createIrregularCloth(params.width, params.height, params.spacing);
    createPattern();
    setupControls();
    setupMouseInteraction();
    update();
}

// Atualiza o status na interface
function updateStatus(message, isError = false) {
    statusDisplay.textContent = message;
    statusDisplay.style.background = isError ? '#f44336' : '#4CAF50';
    setTimeout(() => {
        if (statusDisplay.textContent === message) {
            statusDisplay.textContent = "Pronto para interagir";
            statusDisplay.style.background = 'rgba(0,0,0,0.7)';
        }
    }, 3000);
}

// Configura o input de imagem
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        updateStatus("Processando imagem...");
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                customImage = img;
                params.pattern = 'custom';
                updateStatus(`Imagem carregada: ${file.name}`);
                createPattern();
            };
            img.onerror = function() {
                updateStatus("Erro ao carregar imagem", true);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Cria o padrão/textura
function createPattern() {
    patternCanvas.width = params.width * params.spacing;
    patternCanvas.height = params.height * params.spacing;
    const patternCtx = patternCanvas.getContext('2d');
    
    if (params.pattern === 'custom' && customImage) {
        const imgRatio = customImage.width / customImage.height;
        const canvasRatio = patternCanvas.width / patternCanvas.height;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        if (imgRatio > canvasRatio) {
            drawHeight = patternCanvas.height;
            drawWidth = drawHeight * imgRatio;
            offsetX = (patternCanvas.width - drawWidth) / 2;
        } else {
            drawWidth = patternCanvas.width;
            drawHeight = drawWidth / imgRatio;
            offsetY = (patternCanvas.height - drawHeight) / 2;
        }
        
        drawWidth *= params.imageScale;
        drawHeight *= params.imageScale;
        offsetX = (patternCanvas.width - drawWidth) / 2;
        offsetY = (patternCanvas.height - drawHeight) / 2;
        
        patternCtx.drawImage(customImage, offsetX, offsetY, drawWidth, drawHeight);
    } else {
        switch (params.pattern) {
            case 'stripes':
                patternCtx.fillStyle = params.patternColor1;
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
                patternCtx.fillStyle = params.patternColor2;
                for (let x = 0; x < patternCanvas.width; x += 20) {
                    patternCtx.fillRect(x, 0, 10, patternCanvas.height);
                }
                break;
            case 'checker':
                const size = 15;
                patternCtx.fillStyle = params.patternColor1;
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
                patternCtx.fillStyle = params.patternColor2;
                for (let y = 0; y < patternCanvas.height; y += size * 2) {
                    for (let x = 0; x < patternCanvas.width; x += size * 2) {
                        patternCtx.fillRect(x, y, size, size);
                        patternCtx.fillRect(x + size, y + size, size, size);
                    }
                }
                break;
            case 'solid':
            default:
                patternCtx.fillStyle = params.patternColor1;
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
                break;
        }
    }
    
    patternTexture = patternCanvas;
}

// Configura os controles da interface
function setupControls() {
    const gui = new dat.GUI({ width: 300 });
    
    gui.add(params, 'width', 5, 40).step(1).name('Largura').onChange(resetSimulation);
    gui.add(params, 'height', 5, 40).step(1).name('Altura').onChange(resetSimulation);
    gui.add(params, 'spacing', 5, 20).step(1).name('Espaçamento').onChange(resetSimulation);
    
    const physics = gui.addFolder('Física');
    physics.add(params, 'stiffness', 0.1, 1.0).name('Rigidez').onChange(updateSprings);
    physics.add(params, 'damping', 0.01, 0.1).name('Amortecimento').onChange(updateSprings);
    physics.add(params, 'density', 0.1, 5.0).name('Densidade').onChange(updateMasses);
    physics.add(params, 'gravity', 0, 2.0).name('Gravidade');
    physics.add(params, 'wind', 0, 0.5).name('Vento');
    
    const appearance = gui.addFolder('Aparência');
    appearance.add(params, 'pattern', ['stripes', 'checker', 'solid', 'custom']).name('Padrão').onChange(createPattern);
    appearance.addColor(params, 'patternColor1').name('Cor 1').onChange(createPattern);
    appearance.addColor(params, 'patternColor2').name('Cor 2').onChange(createPattern);
    appearance.add(params, 'imageScale', 0.1, 2).name('Escala Imagem').onChange(createPattern);
    appearance.add(params, 'showWireframe').name('Mostrar Malha');
    
    const interaction = gui.addFolder('Interação');
    interaction.add(params, 'mouseInteraction').name('Ativar Mouse');
    interaction.add(params, 'mouseRadius', 10, 100).name('Raio do Mouse');
    interaction.add(params, 'mouseStrength', 0.1, 2).name('Força do Mouse');
    
    gui.add({
        uploadImage: () => imageInput.click()
    }, 'uploadImage').name('Upload Imagem');
}

// Configura a interação com o mouse
function setupMouseInteraction() {
    canvas.addEventListener('mousemove', (e) => {
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        if (mouse.isDown && params.mouseInteraction) {
            if (!selectedParticle) findClosestParticle();
            if (selectedParticle) {
                selectedParticle.pos.x = mouse.x;
                selectedParticle.pos.y = mouse.y;
            } else {
                applyMouseForce();
            }
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        mouse.isDown = true;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (params.mouseInteraction) findClosestParticle();
    });

    canvas.addEventListener('mouseup', () => {
        mouse.isDown = false;
        selectedParticle = null;
    });

    // Eventos de toque
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
        if (mouse.isDown && params.mouseInteraction) applyMouseForce();
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        mouse.isDown = true;
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
        if (params.mouseInteraction) findClosestParticle();
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        mouse.isDown = false;
        selectedParticle = null;
    }, { passive: false });
}

function findClosestParticle() {
    let minDist = params.mouseRadius;
    selectedParticle = null;
    
    for (let i = 0; i < clothSim.particles.length; i++) {
        const p = clothSim.particles[i];
        if (p.pinned) continue;
        
        const dx = p.pos.x - mouse.x;
        const dy = p.pos.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
            minDist = dist;
            selectedParticle = p;
        }
    }
    return selectedParticle;
}

function applyMouseForce() {
    const mouseVelX = mouse.x - mouse.prevX;
    const mouseVelY = mouse.y - mouse.prevY;
    
    for (let i = 0; i < clothSim.particles.length; i++) {
        const p = clothSim.particles[i];
        if (p.pinned || p === selectedParticle) continue;
        
        const dx = p.pos.x - mouse.x;
        const dy = p.pos.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        const radiusSq = params.mouseRadius * params.mouseRadius;
        
        if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const forceFactor = params.mouseStrength * (1 - dist / params.mouseRadius);
            
            p.pos.x += mouseVelX * forceFactor;
            p.pos.y += mouseVelY * forceFactor;
        }
    }
}

// Atualiza a física da simulação
function updatePhysics() {
    if (params.mouseInteraction && mouse.isDown && !selectedParticle) {
        applyMouseForce();
    }
    
    // Atualiza partículas
    for (let i = 0; i < clothSim.particles.length; i++) {
        const p = clothSim.particles[i];
        if (p.pinned || p === selectedParticle) continue;
        
        const force = { x: 0, y: params.gravity * p.mass };
        force.x += Math.sin(Date.now() * 0.001) * params.wind * p.mass;
        
        const temp = { x: p.pos.x, y: p.pos.y };
        const velX = p.pos.x - p.prevPos.x;
        const velY = p.pos.y - p.prevPos.y;
        
        p.pos.x += velX * 0.99 + force.x / p.mass;
        p.pos.y += velY * 0.99 + force.y / p.mass;
        
        p.prevPos = temp;
    }
    
    // Atualiza molas
    for (let i = 0; i < clothSim.springs.length; i++) {
        const s = clothSim.springs[i];
        const p1 = clothSim.particles[s.a];
        const p2 = clothSim.particles[s.b];
        
        const dx = p2.pos.x - p1.pos.x;
        const dy = p2.pos.y - p1.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) continue;
        
        const diff = (s.restLength - dist) / dist * s.stiffness;
        const fx = dx * diff;
        const fy = dy * diff;
        
        if (!p1.pinned && p1 !== selectedParticle) {
            p1.pos.x -= fx * 0.5;
            p1.pos.y -= fy * 0.5;
        }
        
        if (!p2.pinned && p2 !== selectedParticle) {
            p2.pos.x += fx * 0.5;
            p2.pos.y += fy * 0.5;
        }
    }
    
    // Colisão com o chão
    for (let i = 0; i < clothSim.particles.length; i++) {
        const p = clothSim.particles[i];
        if (p.pos.y > canvas.height - 10) {
            p.pos.y = canvas.height - 10;
        }
    }
}

// Renderiza a cena
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ordena triângulos por profundidade (para possível extensão 3D)
    const sortedTriangles = clothSim.triangles.map(t => {
        const p0 = clothSim.particles[t[0]].pos;
        const p1 = clothSim.particles[t[1]].pos;
        const p2 = clothSim.particles[t[2]].pos;
        return { 
            t, 
            avgZ: ((p0.z || 0) + (p1.z || 0) + (p2.z || 0)) / 3 
        };
    }).sort((a, b) => b.avgZ - a.avgZ);
    
    // Renderiza cada triângulo
    for (let i = 0; i < sortedTriangles.length; i++) {
        const { t } = sortedTriangles[i];
        const p0 = clothSim.particles[t[0]].pos;
        const p1 = clothSim.particles[t[1]].pos;
        const p2 = clothSim.particles[t[2]].pos;
        
        const uv0 = clothSim.uvs[t[0]];
        const uv1 = clothSim.uvs[t[1]];
        const uv2 = clothSim.uvs[t[2]];
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.closePath();
        ctx.clip();
        
        // Mapeamento de textura
        const tx0 = uv0.u * patternTexture.width;
        const ty0 = uv0.v * patternTexture.height;
        const tx1 = uv1.u * patternTexture.width;
        const ty1 = uv1.v * patternTexture.height;
        const tx2 = uv2.u * patternTexture.width;
        const ty2 = uv2.v * patternTexture.height;
        
        const denom = (tx1 - tx0) * (ty2 - ty0) - (ty1 - ty0) * (tx2 - tx0);
        if (Math.abs(denom) > 1e-6) {
            const a = ((p1.x - p0.x) * (ty2 - ty0) - (p2.x - p0.x) * (ty1 - ty0)) / denom;
            const b = ((p2.x - p0.x) * (tx1 - tx0) - (p1.x - p0.x) * (tx2 - tx0)) / denom;
            const c = p0.x - a * tx0 - b * ty0;
            const d = ((p1.y - p0.y) * (ty2 - ty0) - (p2.y - p0.y) * (ty1 - ty0)) / denom;
            const e = ((p2.y - p0.y) * (tx1 - tx0) - (p1.y - p0.y) * (tx2 - tx0)) / denom;
            const f = p0.y - d * tx0 - e * ty0;
            ctx.transform(a, d, b, e, c, f);
        }
        
        ctx.drawImage(patternTexture, 0, 0);
        ctx.restore();
        
        if (params.showWireframe) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    // Renderiza partículas fixas
    ctx.fillStyle = '#000';
    for (let i = 0; i < clothSim.fixedParticles.length; i++) {
        const p = clothSim.fixedParticles[i];
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Mostra área de influência do mouse
    if (params.mouseInteraction && mouse.isDown) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, params.mouseRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Funções utilitárias
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Centraliza o tecido
    if (clothSim.particles.length > 0) {
        const offsetX = (canvas.width - (params.width * params.spacing)) / 2;
        const offsetY = 50;
        
        for (let i = 0; i < clothSim.particles.length; i++) {
            const p = clothSim.particles[i];
            p.pos.x += offsetX - p.pos.x + (i % params.width) * params.spacing;
            p.pos.y += offsetY - p.pos.y + Math.floor(i / params.width) * params.spacing;
            p.prevPos = { ...p.pos };
        }
    }
}

function resetSimulation() {
    clothSim.particles = [];
    clothSim.springs = [];
    clothSim.triangles = [];
    clothSim.uvs = [];
    clothSim.fixedParticles = [];
    
    clothSim.createIrregularCloth(params.width, params.height, params.spacing);
    createPattern();
    selectedParticle = null;
}

function updateSprings() {
    for (let i = 0; i < clothSim.springs.length; i++) {
        clothSim.springs[i].stiffness = params.stiffness;
        clothSim.springs[i].damping = params.damping;
    }
}

function updateMasses() {
    for (let i = 0; i < clothSim.particles.length; i++) {
        clothSim.particles[i].mass = 1.0 * params.density;
    }
}

// Inicialização
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', init);