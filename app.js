import * as THREE from 'three';

let canvas, ctx;
let perlin;
let scene, camera, renderer, terrain3D;
let currentMode = 'heightmap';

// Initialize the application
function init() {
    canvas = document.getElementById('terrainCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create Perlin noise instance
    perlin = new PerlinNoise(Math.random() * 10000);
    
    // Initialize Three.js for 3D mode
    initThreeJS();
    
    // Set up event listeners
    document.getElementById('generateBtn').addEventListener('click', () => {
        perlin = new PerlinNoise(Math.random() * 10000);
        generateTerrain();
    });
    
    document.getElementById('gridSize').addEventListener('input', updateSliderValue);
    document.getElementById('amplitude').addEventListener('input', updateSliderValue);
    document.getElementById('frequency').addEventListener('input', updateSliderValue);
    document.getElementById('octaves').addEventListener('input', updateSliderValue);
    
    document.getElementById('terrain').addEventListener('change', (e) => {
        currentMode = e.target.value;
        generateTerrain();
    });
    
    // Generate initial terrain
    generateTerrain();
}

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    if (renderer) {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
    generateTerrain();
}

function updateSliderValue(e) {
    document.getElementById(`${e.target.id}Value`).textContent = e.target.value;
    generateTerrain();
}

function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
}

function generateTerrain() {
    const gridSize = parseFloat(document.getElementById('gridSize').value);
    const amplitude = parseFloat(document.getElementById('amplitude').value);
    const frequency = parseFloat(document.getElementById('frequency').value);
    const octaves = parseInt(document.getElementById('octaves').value);
    
    switch (currentMode) {
        case 'heightmap':
            generateHeightMap(gridSize, amplitude, frequency, octaves);
            break;
        case 'colormap':
            generateColorMap(gridSize, amplitude, frequency, octaves);
            break;
        case '3d':
            generate3DTerrain(gridSize, amplitude, frequency, octaves);
            break;
    }
}

function generateHeightMap(gridSize, amplitude, frequency, octaves) {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const nx = x / width * gridSize;
            const ny = y / height * gridSize;
            
            const value = perlin.fbm(nx, ny, octaves, frequency, amplitude);
            const normalizedValue = (value + 1) / 2; // Convert to 0-1 range
            
            const index = (y * width + x) * 4;
            const shade = Math.floor(normalizedValue * 255);
            
            data[index] = shade;     // R
            data[index + 1] = shade; // G
            data[index + 2] = shade; // B
            data[index + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function generateColorMap(gridSize, amplitude, frequency, octaves) {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const nx = x / width * gridSize;
            const ny = y / height * gridSize;
            
            const value = perlin.fbm(nx, ny, octaves, frequency, amplitude);
            const normalizedValue = (value + 1) / 2; // Convert to 0-1 range
            
            const index = (y * width + x) * 4;
            
            // Color mapping based on height value
            if (normalizedValue < 0.2) {
                // Deep water
                data[index] = 0;
                data[index + 1] = 0;
                data[index + 2] = 128;
            } else if (normalizedValue < 0.4) {
                // Shallow water
                data[index] = 30;
                data[index + 1] = 144;
                data[index + 2] = 255;
            } else if (normalizedValue < 0.45) {
                // Sand
                data[index] = 240;
                data[index + 1] = 240;
                data[index + 2] = 64;
            } else if (normalizedValue < 0.55) {
                // Grass
                data[index] = 50;
                data[index + 1] = 220;
                data[index + 2] = 20;
            } else if (normalizedValue < 0.7) {
                // Forest
                data[index] = 16;
                data[index + 1] = 160;
                data[index + 2] = 0;
            } else if (normalizedValue < 0.8) {
                // Rock
                data[index] = 128;
                data[index + 1] = 128;
                data[index + 2] = 128;
            } else {
                // Snow
                data[index] = 250;
                data[index + 1] = 250;
                data[index + 2] = 250;
            }
            
            data[index + 3] = 255; // Alpha
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function generate3DTerrain(gridSize, amplitude, frequency, octaves) {
    // Hide 2D canvas
    canvas.style.display = 'none';
    
    // Clear previous terrain
    if (terrain3D) {
        scene.remove(terrain3D);
        terrain3D.geometry.dispose();
        terrain3D.material.dispose();
    }
    
    // Create terrain geometry
    const geometry = new THREE.PlaneGeometry(20, 20, 100, 100);
    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        side: THREE.DoubleSide
    });
    
    // Get vertices and modify based on noise
    const position = geometry.attributes.position;
    const colors = [];
    
    for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        
        // Calculate height using Perlin noise
        const nx = (x / 20 + 0.5) * gridSize;
        const ny = (y / 20 + 0.5) * gridSize;
        const height = perlin.fbm(nx, ny, octaves, frequency, amplitude) * 5;
        
        // Update vertex position
        position.setZ(i, height);
        
        // Color based on height
        const normalizedHeight = (height + 5) / 10; // Convert to 0-1 range
        
        if (normalizedHeight < 0.2) {
            colors.push(0, 0, 0.5); // Deep water
        } else if (normalizedHeight < 0.4) {
            colors.push(0.12, 0.56, 1); // Shallow water
        } else if (normalizedHeight < 0.45) {
            colors.push(0.94, 0.94, 0.25); // Sand
        } else if (normalizedHeight < 0.55) {
            colors.push(0.2, 0.85, 0.1); // Grass
        } else if (normalizedHeight < 0.7) {
            colors.push(0.06, 0.63, 0); // Forest
        } else if (normalizedHeight < 0.8) {
            colors.push(0.5, 0.5, 0.5); // Rock
        } else {
            colors.push(0.98, 0.98, 0.98); // Snow
        }
    }
    
    // Add colors to geometry
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Compute normals for proper lighting
    geometry.computeVertexNormals();
    
    // Create mesh and add to scene
    terrain3D = new THREE.Mesh(geometry, material);
    terrain3D.rotation.x = -Math.PI / 2; // Rotate to horizontal plane
    scene.add(terrain3D);
    
    // Set up renderer if it was hidden before
    if (!renderer.domElement.parentElement) {
        canvas.parentElement.appendChild(renderer.domElement);
    }
    
    // Start animation
    animate();
}

function animate() {
    if (currentMode !== '3d') return;
    
    requestAnimationFrame(animate);
    
    // Rotate terrain slightly for better visibility
    if (terrain3D) {
        terrain3D.rotation.z += 0.001;
    }
    
    renderer.render(scene, camera);
}

// Start the application when the page loads
window.addEventListener('load', init);

