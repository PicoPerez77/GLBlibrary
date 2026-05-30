// ==========================================
// 1. CONFIGURACIÓN DEL ENTORNO 3D & VARIABLES GLOBALES
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e);

// Cámaras (Perspectiva y Ortogonal)
let aspecto = container.clientWidth / container.clientHeight;
const frustumSize = 20;
const cameraPerspective = new THREE.PerspectiveCamera(45, aspecto, 0.1, 150);
cameraPerspective.position.set(8, 12, 30);

const cameraOrthographic = new THREE.OrthographicCamera(
    (frustumSize * aspecto) / -2, (frustumSize * aspecto) / 2,
    frustumSize / 2, frustumSize / -2, 0.1, 150
);
cameraOrthographic.position.set(0, 12, 30);
let camera = cameraPerspective;

// Motores de selección (Raycasting)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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
// 2. CAPTURA DE ELEMENTOS DEL DOM (HTML)
// ==========================================
const rowSelector = document.getElementById('row-selector');
const spacingSlider = document.getElementById('spacing-slider');
const spacingInput = document.getElementById('spacing-input');
const aisleSlider = document.getElementById('aisle-slider');
const aisleInput = document.getElementById('aisle-input');
const objectsListContainer = document.getElementById('objects-list');
const addGondolaBtn = document.getElementById('add-gondola-end-btn');

// Controles de Iluminación (Declarados globalmente para evitar ReferenceError)
const exposureSlider = document.getElementById('exposure-slider');
const exposureValue = document.getElementById('exposure-value');
const ambientSlider = document.getElementById('ambient-slider');
const ambientValue = document.getElementById('ambient-value');
const mainLightSlider = document.getElementById('main-light-slider');
const mainLightValue = document.getElementById('main-light-value');
const fillLightSlider = document.getElementById('fill-light-slider');
const fillLightValue = document.getElementById('fill-light-value');

// ==========================================
// 3. ILUMINACIÓN ESTUDIO
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const dirLightMain = new THREE.DirectionalLight(0xffffff, 1.5);
dirLightMain.position.set(15, 25, 15);
dirLightMain.castShadow = true; 
scene.add(dirLightMain);

const dirLightFill = new THREE.DirectionalLight(0xffffff, 0.8);
dirLightFill.position.set(-15, 25, -15);
scene.add(dirLightFill);

// ==========================================
// 4. CARGA DINÁMICA DE PISOS REALES (.GLB)
// ==========================================
const loader = new THREE.GLTFLoader(); 
let objetoPisoEscena = null; 

function cambiarPisoGLB(urlModeloPiso) {
    loader.load(urlModeloPiso, (gltf) => {
        if (objetoPisoEscena) {
            scene.remove(objetoPisoEscena);
            objetoPisoEscena.traverse((child) => { 
                if (child.isMesh) { child.geometry.dispose(); child.material.dispose(); } 
            });
        }
        objetoPisoEscena = gltf.scene;
        objetoPisoEscena.traverse((child) => { 
            if (child.isMesh) { child.receiveShadow = true; child.castShadow = false; } 
        });
        objetoPisoEscena.position.set(0, -0.01, 0);
        scene.add(objetoPisoEscena);
    });
}

const floorGalleryContainer = document.getElementById('floor-gallery');
if (floorGalleryContainer) {
    fetch('lista_pisos.json')
        .then(response => response.json())
        .then(pisos => {
            pisos.forEach((piso, index) => {
                const botonPiso = document.createElement('button');
                botonPiso.className = 'asset-btn';
                botonPiso.setAttribute('data-floor', `PISOS/${piso.archivo}`);
                botonPiso.innerHTML = `<img src="PISOS/${piso.imagen}" alt="${piso.nombre}" class="asset-thumb"><span class="asset-name">${piso.nombre}</span>`;
                botonPiso.addEventListener('click', () => cambiarPisoGLB(botonPiso.getAttribute('data-floor')));
                floorGalleryContainer.appendChild(botonPiso);
                if (index === 0) cambiarPisoGLB(`PISOS/${piso.archivo}`);
            });
        });
}

// ==========================================
// 5. ESTRUCTURA MULTI-FILA (DICCIONARIO)
// ==========================================
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

function verificarFiltroBotonPunta() {
    if (!addGondolaBtn) return;
    if (filaActiva.endsWith('_opuesto')) {
        addGondolaBtn.className = 'gondola-btn-active';
        addGondolaBtn.textContent = '+ Añadir Cabezal / Punta de Góndola';
    } else {
        addGondolaBtn.className = 'gondola-btn-inactive';
        addGondolaBtn.textContent = '+ Añadir Cabezal (Solo en filas opuestas)';
    }
}

if (rowSelector) {
    rowSelector.addEventListener('change', (e) => {
        filaActiva = e.target.value;
        verificarFiltroBotonPunta();
        if (spacingSlider) spacingSlider.value = supermercado[filaActiva].espaciado;
        if (spacingInput) spacingInput.value = supermercado[filaActiva].espaciado.toFixed(2);
        let nb = filaActiva.replace("_opuesto", "");
        if (aisleSlider) aisleSlider.value = supermercado[nb].anchoPasillo;
        if (aisleInput) aisleInput.value = supermercado[nb].anchoPasillo.toFixed(2);
        actualizarListaUI();
    });
}

if (addGondolaBtn) {
    addGondolaBtn.addEventListener('click', () => {
        if (!filaActiva.endsWith('_opuesto')) return;
        cargarModelo('GLB/gondola_end.glb', 'Punta de Góndola', true);
    });
}

// ==========================================
// 6. GENERACIÓN AUTOMÁTICA DE LA GALERÍA DE ASSETS
// ==========================================
const galleryContainer = document.getElementById('gallery');
fetch('lista_assets.json')
    .then(response => response.json())
    .then(assets => {
        assets.forEach(asset => {
            const boton = document.createElement('button');
            boton.className = 'asset-btn';
            boton.setAttribute('data-model', `GLB/${asset.archivo}`);
            boton.innerHTML = `<img src="GLB/${asset.imagen}" alt="${asset.nombre}" class="asset-thumb"><span class="asset-name">${asset.nombre}</span>`;
            const esCabezal = asset.archivo.toLowerCase().includes('end') || asset.archivo.toLowerCase().includes('punta');
            
            boton.addEventListener('click', () => {
                if (esCabezal && !filaActiva.endsWith('_opuesto')) {
                    alert("Las puntas de góndola están restringidas únicamente a las filas opuestas.");
                    return;
                }
                cargarModelo(boton.getAttribute('data-model'), asset.nombre, esCabezal);
            });
            galleryContainer.appendChild(boton);
        });
    });

function cargarModelo(url, nombreLegible, esPuntaGondola = false) {
    loader.load(url, (gltf) => {
        const modelo = gltf.scene;
        modelo.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });

        const box = new THREE.Box3().setFromObject(modelo);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        modelo.userData.anchoX = esPuntaGondola ? size.z : size.x;
        modelo.userData.nombreArchivo = url;
        modelo.userData.idUnico = Date.now() + Math.random().toString(36).substr(2, 5);
        modelo.userData.nombreUI = nombreLegible;
        modelo.userData.perteneceAFila = filaActiva; 
        modelo.userData.isGondolaEnd = esPuntaGondola;

        grupoModelos.add(modelo);
        supermercado[filaActiva].objetos.push(modelo);
        alinearObjetos(filaActiva);
        actualizarListaUI();
    });
}

// ==========================================
// 7. MATEMÁTICA DE ALINEACIÓN CON ANCLAJE FIJO EN X
// ==========================================
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

function actualizarAnchoPasillo(nuevoValor) {
    let limitValue = Math.max(0.5, Math.min(6, parseFloat(nuevoValor) || 0));
    let nombreBase = filaActiva.replace("_opuesto", "");
    supermercado[nombreBase].anchoPasillo = limitValue;
    supermercado[nombreBase + "_opuesto"].anchoPasillo = limitValue;
    if (aisleSlider) aisleSlider.value = limitValue;
    if (aisleInput) aisleInput.value = limitValue.toFixed(2);
    alinearObjetos(nombreBase);
    alinearObjetos(nombreBase + "_opuesto");
}
if (aisleSlider) aisleSlider.addEventListener('input', (e) => actualizarAnchoPasillo(e.target.value));
if (aisleInput) {
    aisleInput.addEventListener('input', (e) => { if(e.target.value !== "") actualizarAnchoPasillo(e.target.value); });
    aisleInput.addEventListener('wheel', (e) => { e.preventDefault(); let nb = filaActiva.replace("_opuesto", ""); actualizarAnchoPasillo(supermercado[nb].anchoPasillo + ((e.deltaY < 0 ? 1 : -1) * 0.01)); });
}

function alinearObjetos(idFila) {
    const datosFila = supermercado[idFila];
    let nombreBase = idFila.replace("_opuesto", "");
    let anchoPasilloActual = supermercado[nombreBase].anchoPasillo;

    const puntas = datosFila.objetos.filter(obj => obj.userData.isGondolaEnd);
    const estanterias = datosFila.objetos.filter(obj => !obj.userData.isGondolaEnd);

    let xAcumulado = 0; 
    estanterias.forEach((modelo, index) => {
        const mitadAnchoActual = modelo.userData.anchoX / 2;
        let posX = 0;
        if (index === 0) { posX = mitadAnchoActual; xAcumulado = modelo.userData.anchoX; } 
        else { posX = xAcumulado + datosFila.espaciado + mitadAnchoActual; xAcumulado += datosFila.espaciado + modelo.userData.anchoX; }

        modelo.position.set(posX, 0, datosFila.esOpuesto ? (datosFila.zBase + anchoPasilloActual) : datosFila.zBase);
        modelo.rotation.set(0, datosFila.esOpuesto ? Math.PI : 0, 0);
    });

    puntas.forEach((punta, index) => {
        let posX = 0; let rotY = 0;
        const mitadPunta = punta.userData.anchoX / 2;

        if (index === 0) { posX = 0 - mitadPunta; rotY = datosFila.esOpuesto ? -Math.PI / 2 : Math.PI / 2; } 
        else { posX = xAcumulado + datosFila.espaciado + mitadPunta; rotY = datosFila.esOpuesto ? Math.PI / 2 : -Math.PI / 2; }

        punta.position.set(posX, 0, datosFila.esOpuesto ? (datosFila.zBase + anchoPasilloActual) : datosFila.zBase);
        punta.rotation.set(0, rotY, 0);
    });
}

// ==========================================
// 8. CONTROL DE INTERFACES PARA LAS LUCES
// ==========================================
if (exposureSlider) { exposureSlider.addEventListener('input', (e) => { const val = parseFloat(e.target.value); renderer.toneMappingExposure = val; if (exposureValue) exposureValue.textContent = val.toFixed(1); }); }
if (ambientSlider) { ambientSlider.addEventListener('input', (e) => { const val = parseFloat(e.target.value); ambientLight.intensity = val; if (ambientValue) ambientValue.textContent = val.toFixed(1); }); }
if (mainLightSlider) { mainLightSlider.addEventListener('input', (e) => { const val = parseFloat(e.target.value); dirLightMain.intensity = val; if (mainLightValue) mainLightValue.textContent = val.toFixed(1); }); }
if (fillLightSlider) { fillLightSlider.addEventListener('input', (e) => { const val = parseFloat(e.target.value); dirLightFill.intensity = val; if (fillLightValue) fillLightValue.textContent = val.toFixed(1); }); }

// ==========================================
// 9. GESTIÓN DEL LISTADO DE OBJETOS (UI)
// ==========================================
function actualizarListaUI() {
    if (!objectsListContainer) return;
    objectsListContainer.innerHTML = ''; 
    const objetosDeFilaActual = supermercado[filaActiva].objetos;
    if (objetosDeFilaActual.length === 0) { objectsListContainer.innerHTML = `<p class="empty-list-msg">No hay objetos en la Fila ${filaActiva}</p>`; return; }

    objetosDeFilaActual.forEach((modelo, index) => {
        const item = document.createElement('div');
        item.className = 'object-item';
        if (objetoSeleccionado === modelo) item.classList.add('selected');
        const prefijo = modelo.userData.isGondolaEnd ? "📦 [PUNTA] " : `${index + 1}. `;
        item.innerHTML = `<span style="cursor:pointer; flex-grow:1;">${prefijo}${modelo.userData.nombreUI}</span><button class="delete-item-btn">×</button>`;
        
        item.querySelector('span').addEventListener('click', () => { 
            objetoSeleccionado = modelo; 
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
// 10. RAYCASTING SELECCIÓN POR CLICK & TECLADO
// ==========================================
window.addEventListener('click', (event) => {
    const rect = container.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right) return;
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(grupoModelos.children, true);
    
    if (intersects.length > 0) {
        let rootObject = intersects[0].object;
        while (rootObject.parent && rootObject.parent !== grupoModelos) { rootObject = rootObject.parent; }
        
        objetoSeleccionado = rootObject;
        filaActiva = objetoSeleccionado.userData.perteneceAFila;
        verificarFiltroBotonPunta();
        
        if(rowSelector) rowSelector.value = filaActiva;
        if(spacingSlider) spacingSlider.value = supermercado[filaActiva].espaciado;
        if(spacingInput) spacingInput.value = supermercado[filaActiva].espaciado.toFixed(2);
        
        let nb = filaActiva.replace("_opuesto", "");
        if(aisleSlider) aisleSlider.value = supermercado[nb].anchoPasillo;
        if(aisleInput) aisleInput.value = supermercado[nb].anchoPasillo.toFixed(2);
        actualizarListaUI(); 
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === '1' || event.code === 'Numpad1') { camera = cameraOrthographic; camera.position.set(0, 0, 35); camera.lookAt(0,0,0); controls.object = camera; controls.enableRotate = false; controls.target.set(0,0,0); controls.update(); }
    else if (event.key === '3' || event.code === 'Numpad3') { camera = cameraOrthographic; camera.position.set(35, 0, 0); camera.lookAt(0,0,0); controls.object = camera; controls.enableRotate = false; controls.target.set(0,0,0); controls.update(); }
    else if (event.key === '7' || event.code === 'Numpad7') { camera = cameraOrthographic; camera.position.set(0, 35, 0); camera.lookAt(0,0,0); controls.object = camera; controls.enableRotate = false; controls.target.set(0,0,0); controls.update(); }
    else if (event.key === '5' || event.code === 'Numpad5') { camera = cameraPerspective; controls.object = camera; controls.enableRotate = true; controls.update(); }

    if (!objetoSeleccionado || objetoSeleccionado.userData.isGondolaEnd) return;
    const f = objetoSeleccionado.userData.perteneceAFila;
    const lista = supermercado[f].objetos;
    const idx = lista.indexOf(objetoSeleccionado);
    if (event.key === 'ArrowRight' && idx < lista.length - 1) { if (lista[idx + 1].userData.isGondolaEnd) return; [lista[idx], lista[idx + 1]] = [lista[idx + 1], lista[idx]]; alinearObjetos(f); actualizarListaUI(); } 
    else if (event.key === 'ArrowLeft' && idx > 0) { if (lista[idx - 1].userData.isGondolaEnd) return; [lista[idx], lista[idx - 1]] = [lista[idx - 1], lista[idx]]; alinearObjetos(f); actualizarListaUI(); }
});

// ==========================================
// 11. EXPORTACIÓN GENERAL
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
                esPuntaDeGondola: modelo.userData.isGondolaEnd || false,
                posicionMundo: { x: parseFloat(modelo.position.x.toFixed(4)), y: parseFloat(modelo.position.y.toFixed(4)), z: parseFloat(modelo.position.z.toFixed(4)) }
            });
        });
    });
    if (todosLosAssets.length === 0) { alert("La escena está vacía."); return; }
    const dataPosiciones = { configuracion: { totalPasillosActivos: Object.keys(supermercado).length }, assets: todosLosAssets };
    const jsonBlob = new Blob([JSON.stringify(dataPosiciones, null, 2)], { type: 'application/json' });
    const linkJson = document.createElement('a'); linkJson.href = URL.createObjectURL(jsonBlob); linkJson.download = 'posiciones_supermercado.json'; linkJson.click();
}

// ==========================================
// 12. REDIMENSIONAMIENTO DEL VISOR TRAS RESIZE
// ==========================================
function redimensionarVisor() {
    if (!container || !renderer || !camera) return;
    const ancho = container.clientWidth;
    const alto = container.clientHeight;
    
    renderer.setSize(ancho, alto);
    
    if (camera.isPerspectiveCamera) {
        camera.aspect = ancho / alto;
        camera.updateProjectionMatrix();
    } else if (camera.isOrthographicCamera) {
        const asp = ancho / alto;
        camera.left = (frustumSize * asp) / -2;
        camera.right = (frustumSize * asp) / 2;
        camera.top = frustumSize / 2;
        camera.bottom = frustumSize / -2;
        camera.updateProjectionMatrix();
    }
}
window.addEventListener('resize', redimensionarVisor);

// ==========================================
// 13. BUCLE DE ANIMACIÓN Y RENDERIZADO
// ==========================================
function animate() { 
    requestAnimationFrame(animate); 
    controls.update(); 
    renderer.render(scene, camera); 
}
animate();

// Inicialización del botón cabezal
verificarFiltroBotonPunta(); 

// ==========================================
// 14. LÓGICA DE PANELS ARRASTRABLES (4 EJES COMPLETO)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const rLeft = document.getElementById('resizer-left'); const rRight = document.getElementById('resizer-right');
    const rVLeft = document.getElementById('resizer-v-left'); const rVRight = document.getElementById('resizer-v-right');
    const sLeft = document.getElementById('sidebar-left'); const sRight = document.getElementById('sidebar-right');
    const secAssets = document.getElementById('section-assets'); const secStructures = document.getElementById('section-structures');

    if (rLeft) { rLeft.addEventListener('mousedown', (e) => { e.preventDefault(); document.addEventListener('mousemove', moveLeft); document.addEventListener('mouseup', stopLeft); }); }
    function moveLeft(e) { let x = e.clientX; if (x >= 180 && x <= 450) { sLeft.style.flexBasis = x + 'px'; redimensionarVisor(); } }
    function stopLeft() { document.removeEventListener('mousemove', moveLeft); document.removeEventListener('mouseup', stopLeft); }

    if (rRight) { rRight.addEventListener('mousedown', (e) => { e.preventDefault(); document.addEventListener('mousemove', moveRight); document.addEventListener('mouseup', stopRight); }); }
    function moveRight(e) { let ancho = window.innerWidth - e.clientX; if (ancho >= 240 && ancho <= 500) { sRight.style.flexBasis = ancho + 'px'; redimensionarVisor(); } }
    function stopRight() { document.removeEventListener('mousemove', moveRight); document.removeEventListener('mouseup', stopRight); }

    if (rVLeft) { rVLeft.addEventListener('mousedown', (e) => { e.preventDefault(); document.addEventListener('mousemove', moveVLeft); document.addEventListener('mouseup', stopVLeft); }); }
    function moveVLeft(e) { let rectFondo = sLeft.getBoundingClientRect(); let yInterno = e.clientY - rectFondo.top; let porcentaje = (yInterno / rectFondo.height) * 100; if (porcentaje >= 15 && porcentaje <= 85) { secAssets.style.flexBasis = porcentaje + '%'; } }
    function stopVLeft() { document.removeEventListener('mousemove', moveVLeft); document.removeEventListener('mouseup', stopVLeft); }

    if (rVRight) { rVRight.addEventListener('mousedown', (e) => { e.preventDefault(); document.addEventListener('mousemove', moveVRight); document.addEventListener('mouseup', stopVRight); }); }
    function moveVRight(e) { let rectFondo = sRight.getBoundingClientRect(); let yInterno = e.clientY - rectFondo.top; let porcentaje = (yInterno / rectFondo.height) * 100; if (porcentaje >= 15 && porcentaje <= 85) { secStructures.style.flexBasis = porcentaje + '%'; } }
    function stopVRight() { document.removeEventListener('mousemove', moveVRight); document.removeEventListener('mouseup', stopVRight); }
});