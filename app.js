// ==========================================
// 1. CONFIGURACIÓN DEL ENTORNO 3D
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e);

// Cámaras (Perspectiva y Ortogonal)
const aspecto = container.clientWidth / container.clientHeight;
const frustumSize = 20;
const cameraPerspective = new THREE.PerspectiveCamera(45, aspecto, 0.1, 150);
cameraPerspective.position.set(8, 12, 30);

const cameraOrthographic = new THREE.OrthographicCamera(
    (frustumSize * aspecto) / -2, (frustumSize * aspecto) / 2,
    frustumSize / 2, frustumSize / -2, 0.1, 150
);
cameraOrthographic.position.set(0, 12, 30);
let camera = cameraPerspective;

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; 
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ==========================================
// 2. ILUMINACIÓN ESTUDIO
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);
const dirLightMain = new THREE.DirectionalLight(0xffffff, 1.5);
dirLightMain.position.set(15, 25, 15);
scene.add(dirLightMain);
const dirLightFill = new THREE.DirectionalLight(0xffffff, 0.8);
dirLightFill.position.set(-15, 25, -15);
scene.add(dirLightFill);

const gridHelper = new THREE.GridHelper(60, 60, 0x444444, 0x222222);
scene.add(gridHelper);

// ==========================================
// 3. ESTRUCTURA MULTI-FILA CON ANCHO DE PASILLO VARIABLE
// ==========================================
// Incrementamos la distancia base entre pasillos principales a 4.0 metros para dar aire técnico.
let supermercado = {
    B0: { objetos: [], espaciado: 0.0, zBase: 0.0, esOpuesto: false, anchoPasillo: 3.00 },
    B0_opuesto: { objetos: [], espaciado: 0.0, zBase: 0.0, esOpuesto: true, anchoPasillo: 3.00 },
    B1: { objetos: [], espaciado: 0.0, zBase: 4.0, esOpuesto: false, anchoPasillo: 3.00 },
    B1_opuesto: { objetos: [], espaciado: 0.0, zBase: 4.0, esOpuesto: true, anchoPasillo: 3.00 },
    B2: { objetos: [], espaciado: 0.0, zBase: 8.0, esOpuesto: false, anchoPasillo: 3.00 },
    B2_opuesto: { objetos: [], espaciado: 0.0, zBase: 8.0, esOpuesto: true, anchoPasillo: 3.00 },
    B3: { objetos: [], espaciado: 0.0, zBase: 12.0, esOpuesto: false, anchoPasillo: 3.00 },
    B3_opuesto: { objetos: [], espaciado: 0.0, zBase: 12.0, esOpuesto: true, anchoPasillo: 3.00 },
    B4: { objetos: [], espaciado: 0.0, zBase: 16.0, esOpuesto: false, anchoPasillo: 3.00 },
    B4_opuesto: { objetos: [], espaciado: 0.0, zBase: 16.0, esOpuesto: true, anchoPasillo: 3.00 },
    B5: { objetos: [], espaciado: 0.0, zBase: 20.0, esOpuesto: false, anchoPasillo: 3.00 },
    B5_opuesto: { objetos: [], espaciado: 0.0, zBase: 20.0, esOpuesto: true, anchoPasillo: 3.00 },
    B6: { objetos: [], espaciado: 0.0, zBase: 24.0, esOpuesto: false, anchoPasillo: 3.00 },
    B6_opuesto: { objetos: [], espaciado: 0.0, zBase: 24.0, esOpuesto: true, anchoPasillo: 3.00 },
    B7: { objetos: [], espaciado: 0.0, zBase: 28.0, esOpuesto: false, anchoPasillo: 3.00 },
    B7_opuesto: { objetos: [], espaciado: 0.0, zBase: 28.0, esOpuesto: true, anchoPasillo: 3.00 },
    B8: { objetos: [], espaciado: 0.0, zBase: 32.0, esOpuesto: false, anchoPasillo: 3.00 },
    B8_opuesto: { objetos: [], espaciado: 0.0, zBase: 32.0, esOpuesto: true, anchoPasillo: 3.00 },
    B9: { objetos: [], espaciado: 0.0, zBase: 36.0, esOpuesto: false, anchoPasillo: 3.00 },
    B9_opuesto: { objetos: [], espaciado: 0.0, zBase: 36.0, esOpuesto: true, anchoPasillo: 3.00 }
};

let filaActiva = "B0"; 
let objetoSeleccionado = null;

const grupoModelos = new THREE.Group();
scene.add(grupoModelos);

// Captura de elementos DOM
const rowSelector = document.getElementById('row-selector');
const spacingSlider = document.getElementById('spacing-slider');
const spacingInput = document.getElementById('spacing-input');
const aisleSlider = document.getElementById('aisle-slider');
const aisleInput = document.getElementById('aisle-input');
const objectsListContainer = document.getElementById('objects-list');

if (rowSelector) {
    rowSelector.addEventListener('change', (e) => {
        filaActiva = e.target.value;
        
        // Actualizamos los controles visuales con el estado propio de ESTA fila
        if (spacingSlider) spacingSlider.value = supermercado[filaActiva].espaciado;
        if (spacingInput) spacingInput.value = supermercado[filaActiva].espaciado.toFixed(2);
        
        // Actualizamos el ancho del pasillo compartido por este bloque
        let nombreBase = filaActiva.replace("_opuesto", "");
        if (aisleSlider) aisleSlider.value = supermercado[nombreBase].anchoPasillo;
        if (aisleInput) aisleInput.value = supermercado[nombreBase].anchoPasillo.toFixed(2);

        actualizarListaUI();
    });
}

// ==========================================
// 4. GENERACIÓN AUTOMÁTICA DE LA GALERÍA
// ==========================================
const loader = new THREE.GLTFLoader();
const galleryContainer = document.getElementById('gallery');

fetch('lista_assets.json')
    .then(response => response.json())
    .then(assets => {
        assets.forEach(asset => {
            const boton = document.createElement('button');
            boton.className = 'asset-btn';
            boton.setAttribute('data-model', `GLB/${asset.archivo}`);
            boton.innerHTML = `
                <img src="GLB/${asset.imagen}" alt="${asset.nombre}" class="asset-thumb">
                <span class="asset-name">${asset.nombre}</span>
            `;
            boton.addEventListener('click', () => {
                cargarModelo(boton.getAttribute('data-model'), asset.nombre);
            });
            galleryContainer.appendChild(boton);
        });
    });

function cargarModelo(url, nombreLegible) {
    loader.load(url, (gltf) => {
        const modelo = gltf.scene;
        modelo.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });

        const box = new THREE.Box3().setFromObject(modelo);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        modelo.userData.anchoX = size.x;
        modelo.userData.nombreArchivo = url;
        modelo.userData.idUnico = Date.now() + Math.random().toString(36).substr(2, 5);
        modelo.userData.nombreUI = nombreLegible;
        modelo.userData.perteneceAFila = filaActiva; 

        grupoModelos.add(modelo);
        supermercado[filaActiva].objetos.push(modelo);

        alinearObjetos(filaActiva);
        actualizarListaUI();
    });
}

// ==========================================
// 5. CALIBRACIÓN MILIMÉTRICA DE EJES (X y Z)
// ==========================================

// A. Lógica de junta horizontal (Eje X)
function actualizarEspaciado(nuevoValor) {
    let limitValue = Math.max(-2, Math.min(5, parseFloat(nuevoValor) || 0));
    supermercado[filaActiva].espaciado = limitValue;
    if (spacingSlider) spacingSlider.value = limitValue;
    if (spacingInput) spacingInput.value = limitValue.toFixed(2);
    alinearObjetos(filaActiva);
}
if (spacingSlider) spacingSlider.addEventListener('input', (e) => actualizarEspaciado(e.target.value));
if (spacingInput) {
    spacingInput.addEventListener('input', (e) => { if(e.target.value !== "-" && e.target.value !== "") actualizarEspaciado(e.target.value); });
    spacingInput.addEventListener('wheel', (e) => { e.preventDefault(); actualizarEspaciado(supermercado[filaActiva].espaciado + ((e.deltaY < 0 ? 1 : -1) * 0.01)); });
}

// B. Lógica del Ancho del Pasillo (Eje Z)
function actualizarAnchoPasillo(nuevoValor) {
    let limitValue = Math.max(0.5, Math.min(6, parseFloat(nuevoValor) || 0));
    
    // El ancho del pasillo es un pacto entre la fila normal y su opuesta
    let nombreBase = filaActiva.replace("_opuesto", "");
    supermercado[nombreBase].anchoPasillo = limitValue;
    supermercado[nombreBase + "_opuesto"].anchoPasillo = limitValue;

    if (aisleSlider) aisleSlider.value = limitValue;
    if (aisleInput) aisleInput.value = limitValue.toFixed(2);

    // Refrescamos las dos filas al mismo tiempo para ver el movimiento en espejo
    alinearObjetos(nombreBase);
    alinearObjetos(nombreBase + "_opuesto");
}
if (aisleSlider) aisleSlider.addEventListener('input', (e) => actualizarAnchoPasillo(e.target.value));
if (aisleInput) {
    aisleInput.addEventListener('input', (e) => { if(e.target.value !== "") actualizarAnchoPasillo(e.target.value); });
    aisleInput.addEventListener('wheel', (e) => { 
        e.preventDefault(); 
        let nombreBase = filaActiva.replace("_opuesto", "");
        actualizarAnchoPasillo(supermercado[nombreBase].anchoPasillo + ((e.deltaY < 0 ? 1 : -1) * 0.01)); 
    });
}

function alinearObjetos(idFila) {
    let xAcumulado = 0;
    const datosFila = supermercado[idFila];
    let nombreBase = idFila.replace("_opuesto", "");
    
    // Leemos el ancho del pasillo actual calibrado para este bloque
    let anchoPasilloActual = supermercado[nombreBase].anchoPasillo;

    datosFila.objetos.forEach((modelo, index) => {
        const mitadAnchoActual = modelo.userData.anchoX / 2;
        
        let posX = 0;
        if (index === 0) {
            posX = mitadAnchoActual;
            xAcumulado = modelo.userData.anchoX;
        } else {
            posX = xAcumulado + datosFila.espaciado + mitadAnchoActual;
            xAcumulado = posX + mitadAnchoActual;
        }

        if (datosFila.esOpuesto) {
            modelo.rotation.set(0, Math.PI, 0); // Girado 180°
            // 🚀 LA FÍSICA CALIBRADA: La fila opuesta se para en su Z base más el ancho exacto del pasillo
            modelo.position.set(posX, 0, datosFila.zBase + anchoPasilloActual);
        } else {
            modelo.rotation.set(0, 0, 0);
            modelo.position.set(posX, 0, datosFila.zBase);
        }
    });
}

// ==========================================
// 6. GESTIÓN DE LA UI (FILTRADA POR PASILLO)
// ==========================================
function actualizarListaUI() {
    if (!objectsListContainer) return;
    objectsListContainer.innerHTML = ''; 

    const objetosDeFilaActual = supermercado[filaActiva].objects = supermercado[filaActiva].objetos;

    if (objetosDeFilaActual.length === 0) {
        objectsListContainer.innerHTML = `<p class="empty-list-msg">No hay objetos en la Fila ${filaActiva}</p>`;
        return;
    }

    objetosDeFilaActual.forEach((modelo, index) => {
        const item = document.createElement('div');
        item.className = 'object-item';
        if (objetoSeleccionado === modelo) item.classList.add('selected');

        item.innerHTML = `
            <span style="cursor:pointer; flex-grow:1;">${index + 1}. ${modelo.userData.nombreUI}</span>
            <button class="delete-item-btn">×</button>
        `;

        item.querySelector('span').addEventListener('click', () => {
            if (objetoSeleccionado) desmarcarObjeto(objetoSeleccionado);
            objetoSeleccionado = modelo;
            marcarObjeto(objetoSeleccionado);
            actualizarListaUI();
        });

        item.querySelector('.delete-item-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            eliminarObjetoDeEscena(modelo);
        });

        objectsListContainer.appendChild(item);
    });
}

function eliminarObjetoDeEscena(modelo) {
    if (objetoSeleccionado === modelo) objetoSeleccionado = null;
    grupoModelos.remove(modelo);
    modelo.traverse((child) => { if (child.isMesh) { child.geometry.dispose(); child.material.dispose(); } });

    const fPertenece = modelo.userData.perteneceAFila;
    supermercado[fPertenece].objetos = supermercado[fPertenece].objetos.filter(obj => obj.userData.idUnico !== modelo.userData.idUnico);

    alinearObjetos(fPertenece);
    actualizarListaUI();
}

// ==========================================
// 7. SELECCIÓN E INTERCAMBIO (SWAP)
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (event.clientX < 260 || event.clientX > (window.innerWidth - 320)) return;

    mouse.x = ((event.clientX - 260) / container.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(grupoModelos.children, true);

    if (intersects.length > 0) {
        let rootObject = intersects[0].object;
        while (rootObject.parent && rootObject.parent !== grupoModelos) { rootObject = rootObject.parent; }

        if (objetoSeleccionado) desmarcarObjeto(objetoSeleccionado);
        objetoSeleccionado = rootObject;
        marcarObjeto(objetoSeleccionado);
        
        filaActiva = objetoSeleccionado.userData.perteneceAFila;
        if(rowSelector) rowSelector.value = filaActiva;
        if(spacingSlider) spacingSlider.value = supermercado[filaActiva].espaciado;
        if(spacingInput) spacingInput.value = supermercado[filaActiva].espaciado.toFixed(2);
        
        let nombreBase = filaActiva.replace("_opuesto", "");
        if(aisleSlider) aisleSlider.value = supermercado[nombreBase].anchoPasillo;
        if(aisleInput) aisleInput.value = supermercado[nombreBase].anchoPasillo.toFixed(2);
        
        actualizarListaUI(); 
    }
});

function marcarObjeto(m) { m.traverse((c) => { if (c.isMesh && c.material.emissive) c.material.emissive.setHex(0x333333); }); }
function desmarcarObjeto(m) { m.traverse((c) => { if (c.isMesh && c.material.emissive) c.material.emissive.setHex(0x000000); }); }

window.addEventListener('keydown', (event) => {
    if (event.key === '1' || event.code === 'Numpad1') { camera = cameraOrthographic; camera.position.set(0, 0, 35); camera.lookAt(0,0,0); controls.object = camera; controls.enableRotate = false; controls.target.set(0,0,0); controls.update(); }
    else if (event.key === '3' || event.code === 'Numpad3') { camera = cameraOrthographic; camera.position.set(35, 0, 0); camera.lookAt(0,0,0); controls.object = camera; controls.enableRotate = false; controls.target.set(0,0,0); controls.update(); }
    else if (event.key === '7' || event.code === 'Numpad7') { camera = cameraOrthographic; camera.position.set(0, 35, 0); camera.lookAt(0,0,0); controls.object = camera; controls.enableRotate = false; controls.target.set(0,0,0); controls.update(); }
    else if (event.key === '5' || event.code === 'Numpad5') { camera = cameraPerspective; controls.object = camera; controls.enableRotate = true; controls.update(); }

    if (!objetoSeleccionado) return;
    const f = objetoSeleccionado.userData.perteneceAFila;
    const lista = supermercado[f].objetos;
    const idx = lista.indexOf(objetoSeleccionado);

    if (event.key === 'ArrowRight' && idx < lista.length - 1) {
        [lista[idx], lista[idx + 1]] = [lista[idx + 1], lista[idx]];
        alinearObjetos(f);
        actualizarListaUI();
    } 
    else if (event.key === 'ArrowLeft' && idx > 0) {
        [lista[idx], lista[idx - 1]] = [lista[idx - 1], lista[idx]];
        alinearObjetos(f);
        actualizarListaUI();
    }
});

// ==========================================
// 8. EXPORTACIÓN GENERAL DE LA PLANTA (.JSON)
// ==========================================
const botonExportar = document.getElementById('export-btn');
if(botonExportar) botonExportar.addEventListener('click', exportarTodo);

function exportarTodo() {
    let todosLosAssets = [];

    Object.keys(supermercado).forEach((idFila) => {
        const pasillo = supermercado[idFila];
        pasillo.objetos.forEach((modelo, index) => {
            todosLosAssets.push({
                nombrePasillo: idFila,
                ordenEnFila: index,
                archivoOriginal: modelo.userData.nombreArchivo,
                esInvertido: pasillo.esOpuesto,
                posicionMundo: { 
                    x: parseFloat(modelo.position.x.toFixed(4)), 
                    y: parseFloat(modelo.position.y.toFixed(4)), 
                    z: parseFloat(modelo.position.z.toFixed(4)) 
                }
            });
        });
    });

    if (todosLosAssets.length === 0) { alert("La escena está vacía."); return; }

    const dataPosiciones = {
        configuracion: { totalPasillosActivos: Object.keys(supermercado).length },
        assets: todosLosAssets
    };

    const jsonBlob = new Blob([JSON.stringify(dataPosiciones, null, 2)], { type: 'application/json' });
    const linkJson = document.createElement('a');
    linkJson.href = URL.createObjectURL(jsonBlob);
    linkJson.download = 'posiciones_supermercado.json';
    linkJson.click();
}

// ==========================================
// 9. BUCLE DE RENDER
// ==========================================
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
animate();

window.addEventListener('resize', () => {
    const asp = container.clientWidth / container.clientHeight;
    cameraPerspective.aspect = asp; cameraPerspective.updateProjectionMatrix();
    cameraOrthographic.left = (frustumSize * asp) / -2; cameraOrthographic.right = (frustumSize * asp) / 2; cameraOrthographic.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});