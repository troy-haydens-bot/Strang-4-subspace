// Matrix input handling
let currentMatrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
let scene, camera, renderer, controls;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    setupMatrixInputs();
    setupEventListeners();
    initThreeJS();
});

function setupEventListeners() {
    document.getElementById('rows').addEventListener('change', setupMatrixInputs);
    document.getElementById('cols').addEventListener('change', setupMatrixInputs);
}

function setupMatrixInputs() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const container = document.getElementById('matrix-container');
    
    // Resize current matrix or create new one
    let newMatrix = [];
    for (let i = 0; i < rows; i++) {
        newMatrix[i] = [];
        for (let j = 0; j < cols; j++) {
            if (i < currentMatrix.length && j < currentMatrix[0].length) {
                newMatrix[i][j] = currentMatrix[i][j];
            } else {
                newMatrix[i][j] = i === j ? 1 : 0; // Identity-like
            }
        }
    }
    currentMatrix = newMatrix;
    
    // Generate HTML
    let html = '<div style="display: grid; grid-template-columns: repeat(' + cols + ', auto); gap: 4px;">';
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            html += `<input type="number" step="any" class="matrix-input" id="m-${i}-${j}" value="${currentMatrix[i][j]}">`;
        }
    }
    html += '</div>';
    container.innerHTML = html;
}

function getMatrixFromInputs() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const matrix = [];
    
    for (let i = 0; i < rows; i++) {
        matrix[i] = [];
        for (let j = 0; j < cols; j++) {
            const val = document.getElementById(`m-${i}-${j}`).value;
            matrix[i][j] = parseFloat(val) || 0;
        }
    }
    return matrix;
}

function loadExample() {
    // Example: 3x3 matrix with rank 2
    currentMatrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    document.getElementById('rows').value = 3;
    document.getElementById('cols').value = 3;
    setupMatrixInputs();
}

async function calculateSubspaces() {
    const matrix = getMatrixFromInputs();
    
    try {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matrix })
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        displayResults(data);
        visualizeSubspaces(data);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to calculate subspaces. Make sure the backend is running.');
    }
}

function displayResults(data) {
    document.getElementById('results').classList.remove('hidden');
    
    // Update dimensions
    document.getElementById('dim-m').textContent = data.dimensions.m;
    document.getElementById('dim-n').textContent = data.dimensions.n;
    document.getElementById('dim-rank').textContent = data.dimensions.rank;
    document.getElementById('dim-nullity').textContent = data.dimensions.n - data.dimensions.rank;
    
    // Update subspace cards
    document.getElementById('col-dim').textContent = `dim: ${data.column_space.dimension}`;
    document.getElementById('col-ambient').textContent = `Ambient: ${data.column_space.ambient}`;
    
    document.getElementById('null-dim').textContent = `dim: ${data.null_space.dimension}`;
    document.getElementById('null-ambient').textContent = `Ambient: ${data.null_space.ambient}`;
    
    document.getElementById('row-dim').textContent = `dim: ${data.row_space.dimension}`;
    document.getElementById('row-ambient').textContent = `Ambient: ${data.row_space.ambient}`;
    
    document.getElementById('left-null-dim').textContent = `dim: ${data.left_null_space.dimension}`;
    document.getElementById('left-null-ambient').textContent = `Ambient: ${data.left_null_space.ambient}`;
}

// Three.js Visualization
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add axes
    addAxes();
    
    // Animation loop
    animate();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function addAxes() {
    const axisLength = 3;
    const colors = [0xff0000, 0x00ff00, 0x0000ff]; // RGB
    const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1)
    ];
    const labels = ['x', 'y', 'z'];
    
    directions.forEach((dir, i) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            dir.clone().multiplyScalar(axisLength)
        ]);
        const material = new THREE.LineBasicMaterial({ color: colors[i], linewidth: 2 });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
    });
    
    // Grid
    const gridHelper = new THREE.GridHelper(6, 6, 0x444444, 0x333333);
    scene.add(gridHelper);
}

function visualizeSubspaces(data) {
    // Clear previous visualizations (keep axes)
    const objectsToRemove = [];
    scene.traverse((child) => {
        if (child.userData.isSubspace) {
            objectsToRemove.push(child);
        }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));
    
    // Visualize each subspace
    if (data.column_space.basis && data.column_space.basis.length > 0) {
        visualizeBasis(data.column_space.basis, 0x3b82f6, 'column'); // Blue
    }
    
    if (data.null_space.basis && data.null_space.basis.length > 0 && data.null_space.dimension > 0) {
        visualizeBasis(data.null_space.basis, 0xef4444, 'null'); // Red
    }
    
    if (data.row_space.basis && data.row_space.basis.length > 0) {
        visualizeBasis(data.row_space.basis, 0x22c55e, 'row', true); // Green, offset
    }
    
    if (data.left_null_space.basis && data.left_null_space.basis.length > 0 && data.left_null_space.dimension > 0) {
        visualizeBasis(data.left_null_space.basis, 0xa855f7, 'left-null', true); // Purple, offset
    }
}

function visualizeBasis(basis, color, name, offset = false) {
    const basisVectors = Array.isArray(basis[0]) ? basis : [basis];
    const colorObj = new THREE.Color(color);
    
    basisVectors.forEach((vec, idx) => {
        if (!Array.isArray(vec) || vec.length === 0) return;
        
        // Pad to 3D if necessary
        const x = vec[0] || 0;
        const y = vec[1] || 0;
        const z = vec[2] || 0;
        
        const start = new THREE.Vector3(0, 0, 0);
        const end = new THREE.Vector3(x, y, z);
        
        if (offset) {
            start.add(new THREE.Vector3(0.1, 0.1, 0.1));
            end.add(new THREE.Vector3(0.1, 0.1, 0.1));
        }
        
        // Arrow
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const length = start.distanceTo(end);
        
        if (length > 0.01) {
            const arrowHelper = new THREE.ArrowHelper(
                direction,
                start,
                length,
                color,
                0.2,
                0.1
            );
            arrowHelper.userData.isSubspace = true;
            scene.add(arrowHelper);
        }
    });
    
    // If 2D subspace, add a plane
    if (basisVectors.length >= 2) {
        const v1 = basisVectors[0];
        const v2 = basisVectors[1];
        
        if (v1 && v2) {
            const vec1 = new THREE.Vector3(v1[0] || 0, v1[1] || 0, v1[2] || 0);
            const vec2 = new THREE.Vector3(v2[0] || 0, v2[1] || 0, v2[2] || 0);
            
            // Create plane geometry
            const planeGeometry = new THREE.PlaneGeometry(3, 3);
            const planeMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            
            // Orient plane
            const normal = new THREE.Vector3().crossVectors(vec1, vec2).normalize();
            plane.lookAt(normal);
            
            if (offset) {
                plane.position.add(new THREE.Vector3(0.1, 0.1, 0.1));
            }
            
            plane.userData.isSubspace = true;
            scene.add(plane);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}