// ============================================================
// FIREBASE - CONEXIÓN Y SINCRONIZACIÓN
// ============================================================

let firebaseActivo = false;


// ------------------------------------------------------------
// COMPROBAR FIREBASE
// ------------------------------------------------------------

function comprobarFirebase() {

  if (
    window.firebaseDB &&
    window.firebaseRef &&
    window.firebaseSet &&
    window.firebaseGet &&
    window.firebaseOnValue
  ) {

    firebaseActivo = true;

    return true;
  }

  firebaseActivo = false;

  return false;
}


// ------------------------------------------------------------
// GUARDAR EN FIREBASE
// ------------------------------------------------------------

async function guardarEnFirebase(ruta, datos) {

  if (!comprobarFirebase()) {
    console.warn("Firebase no está disponible.");
    return false;
  }

  try {

    const referencia = window.firebaseRef(
      window.firebaseDB,
      ruta
    );

    await window.firebaseSet(
      referencia,
      datos
    );

    console.log("Firebase guardado:", ruta);

    return true;

  } catch (error) {

    console.error(
      "Error guardando en Firebase:",
      error
    );

    return false;
  }
}


// ------------------------------------------------------------
// LEER DE FIREBASE
// ------------------------------------------------------------

async function leerDeFirebase(ruta) {

  if (!comprobarFirebase()) {
    return null;
  }

  try {

    const referencia = window.firebaseRef(
      window.firebaseDB,
      ruta
    );

    const snapshot =
      await window.firebaseGet(referencia);

    if (snapshot.exists()) {

      console.log(
        "Datos recibidos de Firebase:",
        ruta
      );

      return snapshot.val();

    }

    return null;

  } catch (error) {

    console.error(
      "Error leyendo Firebase:",
      error
    );

    return null;
  }
}


// ------------------------------------------------------------
// ESCUCHAR CAMBIOS EN FIREBASE
// ------------------------------------------------------------

function escucharFirebase(ruta, callback) {

  if (!comprobarFirebase()) {
    return;
  }

  try {

    const referencia = window.firebaseRef(
      window.firebaseDB,
      ruta
    );

    window.firebaseOnValue(
      referencia,
      snapshot => {

        if (snapshot.exists()) {

          callback(snapshot.val());

        }

      }
    );

    console.log(
      "Escuchando Firebase:",
      ruta
    );

  } catch (error) {

    console.error(
      "Error escuchando Firebase:",
      error
    );

  }
}


// ------------------------------------------------------------
// INICIAR FIREBASE
// ------------------------------------------------------------

function iniciarFirebase() {

  setTimeout(() => {

    if (comprobarFirebase()) {

      console.log(
        "Firebase disponible. Sincronización preparada."
      );

    } else {

      console.warn(
        "Firebase no está disponible."
      );

    }

  }, 1000);

}

iniciarFirebase();

// ============================================================
// PRUEBA DE FIREBASE
// ============================================================

async function probarFirebase() {

  console.log("Probando Firebase...");

  const datosPrueba = {
    mensaje: "Firebase BODEGA funcionando",
    fecha: new Date().toISOString()
  };

  const guardado = await guardarEnFirebase(
    "pruebaConexion",
    datosPrueba
  );

  if (!guardado) {
    console.error("❌ No se pudo guardar la prueba en Firebase");
    return;
  }

  console.log("✅ Datos de prueba guardados");

  const datosLeidos = await leerDeFirebase(
    "pruebaConexion"
  );

  if (datosLeidos) {

    console.log(
      "✅ Datos recuperados de Firebase:",
      datosLeidos
    );

  } else {

    console.error(
      "❌ No se pudieron recuperar los datos"
    );

  }
}

// Helpers shorthand
const el = id => document.getElementById(id);
const qsa = sel => Array.from(document.querySelectorAll(sel));

// ----------------------
// Navigation & setup
// ----------------------
const screens = ['homeScreen','mixScreen','movScreen','bodegaScreen','mapaScreen','barricasScreen','salaBarrScreen','so2Screen','productsScreen','notesScreen'];

function show(id){
  screens.forEach(s => { const node = document.getElementById(s); if(node) node.classList.add('hidden'); });
  const t = document.getElementById(id);
  if(t) t.classList.remove('hidden');
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-back');
  if (btn) {
    show('homeScreen');
  }
});
if (el('btnMix')) el('btnMix').addEventListener('click', ()=> show('mixScreen'));
if (el('btnMov')) el('btnMov').addEventListener('click', ()=> show('movScreen'));
if (el('btnBodega')) el('btnBodega').addEventListener('click', ()=> show('bodegaScreen'));
if (el('btnMapa')) el('btnMapa').addEventListener('click', ()=> { generateMapa(); show('mapaScreen'); });
if (el('btnBarricas')) el('btnBarricas').addEventListener('click', ()=> show('barricasScreen'));
if (el('btnSalaBarr')) el('btnSalaBarr').addEventListener('click', ()=> show('salaBarrScreen'));
if (el('btnSO2')) el('btnSO2').addEventListener('click', ()=> show('so2Screen'));
if (el('btnProducts')) el('btnProducts').addEventListener('click', ()=> show('productsScreen'));

// quick buttons on Bodega screen
if (el('openMapaFromBodega')) el('openMapaFromBodega').addEventListener('click', ()=> { generateMapa(); show('mapaScreen'); });
if (el('refreshMapa')) el('refreshMapa').addEventListener('click', generateMapa);

// ----------------------
// Data: capacities (order 1..23)
// ----------------------
const capacities = [10500,10500,10500,15500,15500,15500,15500,7800,4800,41000,41000,41000,25500,25500,21600,21600,26100,26100,53600,53600,70800,70800,70800];

// ----------------------
// Color mapping
// ----------------------
const colorMap = {
  '24 MOZAS-1':'#5b0913ff','24 MOZAS-2':'#8a1b1bff','24 MOZAS-3':'#9e1440e5','24 MOZAS-4':'#be4650ff',
  'MADREMIA-1':'#070e6dff','MADREMIA-2':'#19487dff','MADREMIA-3':'#1870a3ff','MADREMIA-4':'#40c2ccff',
  'ABRACADABRA-1':'#000000',
  'ABRACADABRA-2':'#1f2933',
  'PLATON-1':'#4b5563',
  'PLATON-2':'#9ca3af',
  'DIVINA-1':'#982787eb',
  'DIVINA-2':'#e333d7',
  'LOQUILLO':'#531c74ff',
  'EL PRINCIPITO':'rgb(219, 210, 34)',
  '300':'#7f4916ff',
  '500':'#36832aff'
};

// ---------- MIXTURAS ----------
const mixBody = el('mixTableBody');
const mixTotal = el('mixTotal');
const mixResults = el('mixResults');
let lastMixVolume = 0;

function makeDepositSelect(){
  let options = [...Array(23)]
    .map((_,i)=>`<option value="${i+1}">${i+1}</option>`)
    .join('');

  // 👉 añadir Barricas
  options += `<option value="barricas">Barricas</option>`;

  return options;
}

// 🔥 IMPORTANTE: evento SOLO UNA VEZ (evita duplicados)
if (el('addMixRow')) {
  el('addMixRow').onclick = () => addMixRow();
}

function addMixRow(dep='', vol='', grad='', ph='', aci='', anyada='', crianza='', duelas='', caract='') {
  if(!mixBody) return;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><select class="mixDep">${makeDepositSelect()}</select></td>
    <td class="mixPct">0%</td>
    <td><input class="mixVol" type="number" step="0.001" value="${vol}"></td>
    <td><input class="mixGrad" type="number" step="0.01" value="${grad}"></td>
    <td><input class="mixPh" type="number" step="0.01" value="${ph}"></td>
    <td><input class="mixAci" type="number" step="0.01" value="${aci}"></td>
     <td>
      <select class="mixAnyada">
        <option value="">—</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
        <option value="2026">2026</option>
        <option value="2027">2027</option>
        <option value="2028">2028</option>
        <option value="2029">2029</option>
        <option value="2030">2030</option>
      </select>
    </td>
    <td><input class="mixCrianza" type="number" step="0.1" value="${crianza}"></td>
    <td><input class="mixDuelas" type="number" step="0.1" value="${duelas}"></td>
    <td><input class="mixCaract" type="text" value="${caract || ''}"></td>
    <td><button class="small delMix">Eliminar</button></td>
  `;

  mixBody.appendChild(tr);

   // Seleccionar añada guardada
  if(anyada) {
    tr.querySelector('.mixAnyada').value = anyada;
  }

  // Eventos
  tr.querySelector('.delMix').addEventListener('click', ()=>{
    tr.remove();
    updateMixTotals();
  });

  tr.querySelector('.mixVol').addEventListener('input', updateMixTotals);

  if(dep) tr.querySelector('.mixDep').value = dep;
}

// ---------- TOTALES ----------
function updateMixTotals(){
  if(!mixBody) return;

  const vols=[...mixBody.querySelectorAll('.mixVol')].map(i=>parseFloat(i.value)||0);
  const total=vols.reduce((a,b)=>a+b,0);

  if(mixTotal) mixTotal.textContent = total.toFixed(0);
  lastMixVolume = total;

  [...mixBody.querySelectorAll('tr')].forEach((r,i)=>{
    const pct = total>0 ? ((vols[i]||0)/total*100).toFixed(1)+'%' : '0%';
    r.querySelector('.mixPct').textContent = pct;
  });
}

// ---------- CALCULAR ----------
if (el('calcMix')) el('calcMix').addEventListener('click', ()=> {

  if(!mixBody) return;

  const rows=[...mixBody.querySelectorAll('tr')];
  if(rows.length===0){
    if(mixResults) mixResults.innerHTML='<p>No hay depósitos.</p>';
    return;
  }

  let total=0,sumGrad=0,sumAci=0,sumH=0,volH=0;

// Litros por añada
let litrosPorAnyada = {};

  // 🔥 NUEVO
  let sumCrianza = 0;
  let sumDuelas = 0;

  let litrosCrianza = 0;
  let litrosDuelas = 0;
  let litrosJoven = 0;

  rows.forEach(r=>{
    const v=parseFloat(r.querySelector('.mixVol').value)||0;
    const g=parseFloat(r.querySelector('.mixGrad').value)||0;
    const a=parseFloat(r.querySelector('.mixAci').value)||0;
    const anyada = r.querySelector('.mixAnyada')?.value || '';

    const pRaw=r.querySelector('.mixPh').value;
    const p = pRaw===''?null:parseFloat(pRaw);

    const c = parseFloat(r.querySelector('.mixCrianza').value) || 0;
    const d = parseFloat(r.querySelector('.mixDuelas').value) || 0;

    total+=v;
    sumGrad+=v*g;
    sumAci+=v*a;

    // ---------- AÑADAS ----------
if(anyada && v > 0){
  if(!litrosPorAnyada[anyada]){
    litrosPorAnyada[anyada] = 0;
  }

  litrosPorAnyada[anyada] += v;
}

    if(p!==null){
      const H = Math.pow(10,-p);
      sumH += H*v;
      volH += v;
    }

    // 🔥 CLASIFICACIÓN
    if(c > 0){
      litrosCrianza += v;
      sumCrianza += v * c;
    }
    else if(d > 0){
      litrosDuelas += v;
      sumDuelas += v * d;
    }
    else{
      litrosJoven += v;
    }

  });

  if(total<=0){
    mixResults.innerHTML='<p>Introduce volúmenes válidos.</p>';
    return;
  }

  const finalGrad = sumGrad/total;
  const finalAci = sumAci/total;
  const finalPH = volH>0 ? -Math.log10(sumH/volH) : '—';

  // 🔥 MEDIAS CORRECTAS
  const crianzaMedia = litrosCrianza > 0 ? sumCrianza / litrosCrianza : 0;
  const duelasMedia = litrosDuelas > 0 ? sumDuelas / litrosDuelas : 0;

  // 🔥 PORCENTAJES CORRECTOS
  const pctCrianza = (litrosCrianza / total) * 100;
  const pctDuelas = (litrosDuelas / total) * 100;
  const pctJoven = (litrosJoven / total) * 100;

  // ---------- PORCENTAJES POR AÑADA ----------
const porcentajesAnyada = Object.entries(litrosPorAnyada)
  .sort((a,b) => Number(a[0]) - Number(b[0]))
  .map(([anyada, litros]) => {
    const porcentaje = (litros / total) * 100;

    return `<p><strong>% Añada ${anyada}:</strong> ${porcentaje.toFixed(1)} %</p>`;
  })
  .join('');

  mixResults.innerHTML = `
    <h3>RESULTADO MEZCLA</h3>
    <p><strong>Depósito Final:</strong> ${el('mixFinalDeposit') ? el('mixFinalDeposit').value || '—' : '—'}</p>
    <p><strong>Volumen Total:</strong> ${total.toFixed(0)} L</p>
    <p><strong>Grado:</strong> ${finalGrad.toFixed(2)} %</p>
    <p><strong>pH:</strong> ${finalPH==='—'?'—':finalPH.toFixed(2)}</p>
    <p><strong>Acidez:</strong> ${finalAci.toFixed(2)} g/L</p>

    <hr>
<h3>PORCENTAJE POR CRIANZA</h3>

    <p><strong>Crianza Media:</strong> ${crianzaMedia.toFixed(1)} Meses</p>
    <p><strong>Duelas Media:</strong> ${duelasMedia.toFixed(1)} Meses</p>

    <p><strong>% Crianza:</strong> ${pctCrianza.toFixed(1)} %</p>
    <p><strong>% Duelas:</strong> ${pctDuelas.toFixed(1)} %</p>
    <p><strong>% Joven:</strong> ${pctJoven.toFixed(1)} %</p>

    <hr>

<h3>PORCENTAJE POR AÑADA</h3>

${porcentajesAnyada}
  `;
});

// ---------- EXPORTAR / GUARDAR (igual que tenías) ----------
if (el('exportMixCSV')) el('exportMixCSV').addEventListener('click', ()=>{
  let csv='Deposito,Porcentaje,Volumen,Grado,pH,Acidez\n';
  [...mixBody.querySelectorAll('tr')].forEach(r=>{
    csv += [
      r.querySelector('.mixDep').value,
      r.querySelector('.mixPct').textContent,
      r.querySelector('.mixVol').value,
      r.querySelector('.mixGrad').value,
      r.querySelector('.mixPh').value,
      r.querySelector('.mixAci').value
    ].join(',')+'\n';
  });
  downloadCSV(csv,'mezclas.csv');
});

if (el('exportMixPDF')) el('exportMixPDF').addEventListener('click', ()=>{
  const tableHtml = tableToPrintableHTML(document.getElementById('mixTable'));
  const html = `<h2>Mezcla</h2>${tableHtml}${mixResults.innerHTML}`;
  openPrint(html);
});

if (el('saveMix')) el('saveMix').addEventListener('click', ()=>{
  const rows = [...mixBody.querySelectorAll('tr')].map(r=>({
    deposito:r.querySelector('.mixDep').value,
    volumen:r.querySelector('.mixVol').value,
    grado:r.querySelector('.mixGrad').value,
    ph:r.querySelector('.mixPh').value,
    acidez:r.querySelector('.mixAci').value,
    anyada: r.querySelector('.mixAnyada')?.value || '',
    crianza:r.querySelector('.mixCrianza')?.value || '',
    duelas:r.querySelector('.mixDuelas')?.value || '',
    caracteristicas:r.querySelector('.mixCaract')?.value || ''
  }));

  const payload = {
    rows,
    finalDeposit: el('mixFinalDeposit') ? el('mixFinalDeposit').value : ''
  };

  localStorage.setItem('mixData', JSON.stringify(payload));
  alert('Mezcla guardada');
});

function loadMix(){
  const raw = localStorage.getItem('mixData');
  if(!raw) return;

  try{
    const obj = JSON.parse(raw);
    if(!mixBody) return;

    mixBody.innerHTML = '';

    (obj.rows||[]).forEach(r =>
      addMixRow(
        r.deposito,
        r.volumen,
        r.grado,
        r.ph,
        r.acidez,
        r.anyada || '',
        r.crianza,
        r.duelas,
        r.caracteristicas
      )
    );

    if(obj.finalDeposit && el('mixFinalDeposit'))
      el('mixFinalDeposit').value = obj.finalDeposit;

    updateMixTotals();

  }catch(e){
    console.error(e);
  }
}

loadMix();
// ---------- MOVIMIENTOS BODEGA (con selección, enviar y deshacer) ----------
const movBody = el('movTableBody');
const movCount = el('movCount');
const movResults = el('movResults');
let movRows = 0; const MOV_MAX = 400;

function makeDepositSelectSmall(){
  // crea opciones del 1 al 23
  const options = [...Array(23)].map((_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');
  // añade la opción "Barricas" al final con value especial
  return options + '<option value="barricas">Barricas</option>';
}


function createMovRow(data = {}){
  if(!movBody) return; if(movRows >= MOV_MAX) return; movRows++;
  const tr = document.createElement('tr');
  tr.dataset.id = Date.now() + '-' + Math.random().toString(36).slice(2,7);
  tr.innerHTML = `
    <td><input type="checkbox" class="movSel"></td>
    <td class="movNum">${movRows}</td>
    <td><select class="movOrig">${makeDepositSelectSmall()}</select></td>
    <td><select class="movDest">${makeDepositSelectSmall()}</select></td>
    <td><input class="movLit" type="number" step="0.01" value="${data.lit||''}"></td>
    <td><input class="movDate" type="date" value="${data.date||''}"></td>
    <td><input class="movObs" type="text" value="${data.obs||''}"></td>
    <td class="movState">${data.state||'Pendiente'}</td>
    <td class="movAction"></td>
  `;
  movBody.appendChild(tr);

  // set selects if provided
  if(data.origen) tr.querySelector('.movOrig').value = data.origen;
  if(data.destino) tr.querySelector('.movDest').value = data.destino;

  renderMovAction(tr);
  tr.querySelector('.movSel').addEventListener('change', ()=> updateControlsState());
  tr.querySelector('.movLit').addEventListener('input', ()=>{});
  movCount.textContent = movRows;
}

function renderMovAction(tr){
  const actionCell = tr.querySelector('.movAction');
  const stateCell  = tr.querySelector('.movState');
  actionCell.innerHTML = '';

  const state = stateCell.textContent.trim().toLowerCase();

  // =========================
  // 👉 ESTADO: PENDIENTE
  // =========================
  if(state !== 'enviado'){
    const btnSend = document.createElement('button');
    btnSend.className = 'small';
    btnSend.textContent = 'Enviar';

    const btnDel = document.createElement('button');
    btnDel.className = 'small';
    btnDel.style.marginLeft = '6px';
    btnDel.textContent = 'Eliminar';

    actionCell.appendChild(btnSend);
    actionCell.appendChild(btnDel);

    btnSend.addEventListener('click', () => {
      const applied = applyMoveToBodega(tr);
      if (!applied) return;

      stateCell.textContent = 'Enviado';
      renderMovAction(tr);
      saveMov();
    });

    btnDel.addEventListener('click', () => {
      const currState = stateCell.textContent.trim().toLowerCase();
      if(currState === 'enviado'){
        revertMoveFromBodega(tr);
      }
      tr.remove();
      renumberMov();
      saveMov();
    });

    return;
  }

  // =========================
  // 👉 ESTADO: ENVIADO
  // =========================
  const btnUndo = document.createElement('button');
  btnUndo.className = 'small';
  btnUndo.textContent = 'Deshacer';

  const btnDel2 = document.createElement('button');
  btnDel2.className = 'small';
  btnDel2.style.marginLeft = '6px';
  btnDel2.textContent = 'Eliminar';

  actionCell.appendChild(btnUndo);
  actionCell.appendChild(btnDel2);

  btnUndo.addEventListener('click', () => {
    revertMoveFromBodega(tr);
    stateCell.textContent = 'Pendiente';
    renderMovAction(tr);
    saveMov();
  });

  btnDel2.addEventListener('click', () => {
    const currState = stateCell.textContent.trim().toLowerCase();
    if(currState === 'enviado'){
      revertMoveFromBodega(tr);
    }
    tr.remove();
    renumberMov();
    saveMov();
  });
}



function applyMoveToBodega(tr){
  try{
    const origVal = tr.querySelector('.movOrig').value;
    const destVal = tr.querySelector('.movDest').value;
    const liters  = parseFloat(tr.querySelector('.movLit').value) || 0;

    if (!liters || !bBody) return false;

    const rows = [...bBody.querySelectorAll('tr')];

    // 🔁 Barricas → Barricas
    if (origVal === 'barricas' && destVal === 'barricas') {
      return true;
    }

    // 🍷 Barricas → Depósito (SUMA destino)
    if (origVal === 'barricas' && destVal !== 'barricas') {
      const dest = parseInt(destVal);
      const rowDest = rows[dest - 1];
      if (!rowDest) return false;

      const volDest = parseFloat(rowDest.querySelector('.volAct').value) || 0;
      const capDest = parseFloat(rowDest.querySelector('.cap').value) || 0;

      if (volDest + liters > capDest) {
        alert(`Movimiento cancelado: el depósito ${dest} superaría su capacidad.`);
        return false;
      }

      rowDest.querySelector('.volAct').value = (volDest + liters).toFixed(0);
      calcBodegaTotals();
      attachVolActHandlers();
      saveMov();
      return true;
    }

    // 🍷 Depósito → Barricas (RESTA origen)
    if (origVal !== 'barricas' && destVal === 'barricas') {
      const orig = parseInt(origVal);
      const rowOrig = rows[orig - 1];
      if (!rowOrig) return false;

      const volOrig = parseFloat(rowOrig.querySelector('.volAct').value) || 0;

      if (liters > volOrig) {
        alert(`Movimiento cancelado: el depósito ${orig} no tiene litros suficientes.`);
        return false;
      }

      rowOrig.querySelector('.volAct').value = (volOrig - liters).toFixed(0);
      calcBodegaTotals();
      attachVolActHandlers();
      saveMov();
      return true;
    }

    // 🍷 Depósito → Depósito
    const orig = parseInt(origVal);
    const dest = parseInt(destVal);
    const rowOrig = rows[orig - 1];
    const rowDest = rows[dest - 1];
    if (!rowOrig || !rowDest) return false;

    const volOrig = parseFloat(rowOrig.querySelector('.volAct').value) || 0;
    const volDest = parseFloat(rowDest.querySelector('.volAct').value) || 0;
    const capDest = parseFloat(rowDest.querySelector('.cap').value) || 0;

    // validar litros suficientes en origen
    if (liters > volOrig) {
      alert(`Movimiento cancelado: el depósito ${orig} solo tiene ${volOrig} L.`);
      return false;
    }

    // validar capacidad destino
    if (volDest + liters > capDest) {
      alert(`Movimiento cancelado: el depósito ${dest} superaría su capacidad.`);
      return false;
    }

    // aplicar movimiento
    rowOrig.querySelector('.volAct').value = (volOrig - liters).toFixed(0);
    rowDest.querySelector('.volAct').value = (volDest + liters).toFixed(0);

    calcBodegaTotals();
    attachVolActHandlers();
    saveMov();
    return true;

  } catch(e){
    console.error(e);
    return false;
  }
}



function revertMoveFromBodega(tr){
  try{
    const origVal = tr.querySelector('.movOrig').value;
    const destVal = tr.querySelector('.movDest').value;
    const liters  = parseFloat(tr.querySelector('.movLit').value) || 0;

    if (!liters || !bBody) return;

    const rows = [...bBody.querySelectorAll('tr')];

    // 🔁 Barricas → Barricas
    if (origVal === 'barricas' && destVal === 'barricas') {
      return;
    }

    // ⏪ Barricas → Depósito (RESTA destino)
    if (origVal === 'barricas' && destVal !== 'barricas') {
      const dest = parseInt(destVal);
      const rowDest = rows[dest - 1];
      if (!rowDest) return;

      const volDest = parseFloat(rowDest.querySelector('.volAct').value) || 0;
      rowDest.querySelector('.volAct').value = Math.max(0, volDest - liters).toFixed(0);
      calcBodegaTotals();
      attachVolActHandlers();
      saveMov();
      return;
    }

    // ⏪ Depósito → Barricas (SUMA origen)
    if (origVal !== 'barricas' && destVal === 'barricas') {
      const orig = parseInt(origVal);
      const rowOrig = rows[orig - 1];
      if (!rowOrig) return;

      const volOrig = parseFloat(rowOrig.querySelector('.volAct').value) || 0;
      rowOrig.querySelector('.volAct').value = (volOrig + liters).toFixed(0);
      calcBodegaTotals();
      attachVolActHandlers();
      saveMov();
      return;
    }

    // ⏪ Depósito → Depósito (normal)
    const orig = parseInt(origVal);
    const dest = parseInt(destVal);
    const rowOrig = rows[orig - 1];
    const rowDest = rows[dest - 1];
    if (!rowOrig || !rowDest) return;

    const volOrig = parseFloat(rowOrig.querySelector('.volAct').value) || 0;
    const volDest = parseFloat(rowDest.querySelector('.volAct').value) || 0;

    rowOrig.querySelector('.volAct').value = (volOrig + liters).toFixed(0);
    rowDest.querySelector('.volAct').value = Math.max(0, volDest - liters).toFixed(0);
    calcBodegaTotals();
    attachVolActHandlers();
    saveMov();

  } catch(e){
    console.error(e);
  }
}



function renumberMov(){ if(!movBody) return; const trs=[...movBody.querySelectorAll('tr')]; movRows=trs.length; trs.forEach((tr,i)=> tr.querySelector('.movNum').textContent = i+1); movCount.textContent = movRows; updateControlsState(); }

if (el('addMovRow')) el('addMovRow').addEventListener('click', ()=> createMovRow());
if (el('gen300')) el('gen300').addEventListener('click', ()=>{ const toCreate = MOV_MAX - movRows; for(let i=0;i<toCreate;i++) createMovRow(); });

if (el('exportMovCSV')) el('exportMovCSV').addEventListener('click', ()=>{ let csv = 'Num,Origen,Destino,Litros,Fecha,Observaciones,Estado\n'; if(!movBody) return; [...movBody.querySelectorAll('tr')].forEach((r,i)=>{ csv += [i+1, r.querySelector('.movOrig').value, r.querySelector('.movDest').value, r.querySelector('.movLit').value, r.querySelector('.movDate').value, `"${r.querySelector('.movObs').value||''}"`, r.querySelector('.movState').textContent].join(',') + '\n'; }); downloadCSV(csv,'movimientos.csv'); });
if (el('exportMovPDF')) el('exportMovPDF').addEventListener('click', ()=>{ const tableHtml = tableToPrintableHTML(document.getElementById('movTable')); const html = `<h2>Movimientos Bodega</h2>${tableHtml}${movResults.innerHTML}`; openPrint(html); });
if (el('saveMov')) el('saveMov').addEventListener('click', ()=>{ saveMov(); alert('Movimientos guardados'); });

function saveMov(){ if(!movBody) return; const rows=[...movBody.querySelectorAll('tr')].map(r=>({ id: r.dataset.id, origen: r.querySelector('.movOrig').value, destino: r.querySelector('.movDest').value, lit: r.querySelector('.movLit').value, date: r.querySelector('.movDate').value, obs: r.querySelector('.movObs').value, state: r.querySelector('.movState').textContent })); localStorage.setItem('movData', JSON.stringify(rows)); }
function loadMov(){ const raw = localStorage.getItem('movData'); if(!raw || !movBody) return; try{ const rows = JSON.parse(raw); movBody.innerHTML=''; rows.forEach(r=> createMovRow(r)); renumberMov(); }catch(e){ console.error(e); } }

// Select all checkbox
if(el('selectAllMov')) el('selectAllMov').addEventListener('change', (e)=>{ const checked = e.target.checked; qsa('.movSel').forEach(cb=> cb.checked = checked); updateControlsState(); });

// Send selected
if (el('sendSelected')) el('sendSelected').addEventListener('click', () => {
  const selected = [...movBody.querySelectorAll('tr')]
    .filter(r => r.querySelector('.movSel') && r.querySelector('.movSel').checked);

  selected.forEach(tr => {
    const stateCell = tr.querySelector('.movState');

    // Saltar si ya está enviado
    if (stateCell.textContent.trim().toLowerCase() === 'enviado') return;

    // 👉 INTENTAR APLICAR EL MOVIMIENTO
    const applied = applyMoveToBodega(tr);

    // ⛔ SI NO SE APLICÓ, NO TOCAR ESTADO NI ACCIONES
    if (!applied) return;

    // ✅ SOLO SI SE APLICÓ DE VERDAD
    stateCell.textContent = 'Enviado';

    const actionCell = tr.querySelector('.movAction');
    actionCell.innerHTML = '';

    const btnUndo = document.createElement('button');
    btnUndo.className = 'small';
    btnUndo.textContent = 'Deshacer';

    const btnDel = document.createElement('button');
    btnDel.className = 'small';
    btnDel.style.marginLeft = '6px';
    btnDel.textContent = 'Eliminar';

    actionCell.appendChild(btnUndo);
    actionCell.appendChild(btnDel);

    btnUndo.addEventListener('click', () => {
      revertMoveFromBodega(tr);
      tr.querySelector('.movState').textContent = 'Pendiente';
      renderMovAction(tr);
    });

    btnDel.addEventListener('click', () => {
      tr.remove();
      renumberMov();
      saveMov();
    });
  });

  saveMov();
});

if(el('deleteSelected')) el('deleteSelected').addEventListener('click', () => {
    if(!movBody) return;

    const selected = [...movBody.querySelectorAll('tr')]
        .filter(tr => tr.querySelector('.movSel')?.checked);

    if(selected.length === 0){
        alert('No hay filas seleccionadas para eliminar.');
        return;
    }

    if(!confirm(`¿Deseas eliminar ${selected.length} fila(s) seleccionadas?`)) return;

    selected.forEach(tr => {
        const state = tr.querySelector('.movState').textContent.trim().toLowerCase();

        // 👉 SI EL MOVIMIENTO YA ESTABA ENVIADO, REVERTIR PRIMERO
        if(state === 'enviado'){
            revertMoveFromBodega(tr);
        }

        tr.remove();
    });

    renumberMov(); // esto solo reordena números visuales
    saveMov();
});



function updateControlsState(){ /* placeholder for enabling/disabling buttons if needed */ }

loadMov();

// ----------------------
// BODEGA: build table with VINO select column
// ----------------------
const bBody = el('bodegaTableBody');
const bResults = el('bodegaResults');

// Lista de años para el select de añada
function makeAnyadaSelect(){
  return [0,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034]
    .map(y=>`<option value="${y}">${y}</option>`).join('');
}

// Select de tipo de vino
function makeVinoSelectHTML(selected='Tinto'){
  return `
    <select class="vino">
      <option value="Tinto" ${selected==='Tinto'?'selected':''}>Tinto</option>
      <option value="Rosado" ${selected==='Rosado'?'selected':''}>Rosado</option>
      <option value="Blanco" ${selected==='Blanco'?'selected':''}>Blanco</option>
    </select>
  `;
}

// Construir tabla vacía
function buildBodega(){
  if(!bBody) return;
  bBody.innerHTML = '';
  for(let i=0;i<23;i++){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="dep-num-col">${i+1}</td>
      <td><input class="cap" type="number" value="${capacities[i]}" readonly></td>
      <td><input class="volAct" type="number" value="0"></td>
      <td><input class="grado" type="number" step="0.01" value="0"></td>
      <td><input class="ph" type="number" step="0.01" value="0"></td>
      <td><input class="acid" type="number" step="0.01" value="0"></td>
      <td>${makeVinoSelectHTML('Tinto')}</td>
      <td><select class="añada">${makeAnyadaSelect()}</select></td>
      <td><input class="so2" type="number" step="0.01" value="0"></td>
      <td class="col-carac"><input class="carac" type="text"></td>
    `;
    bBody.appendChild(tr);
  }
}

// ----------------------
// Adjuntar handlers de volAct
// ----------------------
function attachVolActHandlers(){
  if(!bBody) return;
  [...bBody.querySelectorAll('tr')].forEach((row, idx) => {
    const volInput = row.querySelector('.volAct');
    const capInput = row.querySelector('.cap');
    if(!volInput || !capInput) return;
    if(volInput._volHandlerAttached) return;
    volInput._volHandlerAttached = true;
    volInput.addEventListener('input', ()=>{
      const cap = parseFloat(capInput.value) || 0;
      let val = parseFloat(volInput.value) || 0;
      if(val > cap){
        volInput.value = cap.toFixed(2);
        alert(`Atención: el volumen no puede superar la capacidad del depósito ${idx+1} (${cap.toLocaleString()} L).`);
      }
      calcBodegaTotals();
    });
  });
}

// ----------------------
// Cálculo totales
// ----------------------
function calcBodegaTotals(){
  if(!bBody) return;
  const rows = [...bBody.querySelectorAll('tr')];
  let totalCap=0, totalVol=0, sumGrad=0, sumAcid=0, sumH=0, volH=0;

  rows.forEach(r=>{
    const cap = parseFloat(r.querySelector('.cap').value)||0;
    const v = parseFloat(r.querySelector('.volAct').value)||0;
    const g = parseFloat(r.querySelector('.grado').value)||0;
    const a = parseFloat(r.querySelector('.acid').value)||0;
    const pRaw = r.querySelector('.ph').value;
    const p = pRaw===''?null:parseFloat(pRaw);

    totalCap += cap;
    totalVol += v;
    sumGrad += v*g;
    sumAcid += v*a;

    if(p!==null){
      const H = Math.pow(10,-p);
      sumH += H*v;
      volH += v;
    }
    // 🔹 Resaltar fila si el volumen actual es 0
    if(v === 0){
      r.style.backgroundColor = '#e3bbbb'; // rojo claro
    } else {
      r.style.backgroundColor = ''; // fondo normal
    }
  });

  const avgGrad = totalVol>0 ? sumGrad/totalVol : 0;
  const avgAcid = totalVol>0 ? sumAcid/totalVol : 0;
  const avgPH = volH>0 ? -Math.log10(sumH/volH) : '—';

  if(bResults) bResults.innerHTML = `
    <h3>Totales Bodega</h3>
    <p><strong>Depósitos:</strong> 23</p>
    <p><strong>Capacidad Total:</strong> ${totalCap.toLocaleString()} L</p>
    <p><strong>Volumen Actual Total:</strong> ${totalVol.toLocaleString()} L</p>
    <p><strong>Capacidad Vacío: </strong> ${(totalCap - totalVol).toLocaleString()} L</p>
    <p><strong>Capacidad Uvas: </strong> ${Math.round((totalCap - totalVol)/0.75).toLocaleString()} K<span style="text-transform:lowercase;">g</span></p>
    <p><strong>Grado Medio (Ponderado):</strong> ${avgGrad.toFixed(2)} %</p>
    <p><strong>pH Medio (No Lineal):</strong> ${avgPH==='—'?'—':avgPH.toFixed(2)}</p>
    <p><strong>Ácidez Media (Ponderada):</strong> ${avgAcid.toFixed(2)} g/L</p>
  `;
}

if(bBody) bBody.addEventListener('input', calcBodegaTotals);

// ----------------------
// Guardar Bodega en localStorage
// ----------------------
if (el('saveBodega')) {
  el('saveBodega').addEventListener('click', ()=>{
    if(!bBody) return;
    const rows = [...bBody.querySelectorAll('tr')].map(r => ({
      cap: r.querySelector('.cap')?.value || 0,
      vol: r.querySelector('.volAct')?.value || 0,
      grado: r.querySelector('.grado')?.value || 0,
      ph: r.querySelector('.ph')?.value || 0,
      acid: r.querySelector('.acid')?.value || 0,
      vino: r.querySelector('.vino')?.value || 'Tinto',
      anyada: r.querySelector('.añada')?.value || 0,
      so2: r.querySelector('.so2')?.value || 0, // ✅ Guardado correcto
      carac: r.querySelector('.carac')?.value || ''
    }));
    localStorage.setItem('bodegaData', JSON.stringify(rows));
    alert('Bodega guardada');
  });
}

// ----------------------
// Cargar Bodega desde localStorage
// ----------------------
function loadBodega(){
  const raw = localStorage.getItem('bodegaData');
  if(!bBody) return;
  buildBodega();

  if(!raw) return attachVolActHandlers();

  try{
    const rows = JSON.parse(raw);
    const trs = [...bBody.querySelectorAll('tr')];

    trs.forEach((tr,i)=>{
      if(!rows[i]) return;

      tr.querySelector('.volAct').value = rows[i].vol || 0;
      tr.querySelector('.grado').value = rows[i].grado || 0;
      tr.querySelector('.ph').value = rows[i].ph || 0;
      tr.querySelector('.acid').value = rows[i].acid || 0;
      tr.querySelector('.so2').value = rows[i].so2 || 0; // ✅ Cargado correcto
      tr.querySelector('.carac').value = rows[i].carac || '';
      if(rows[i].vino && tr.querySelector('.vino')) tr.querySelector('.vino').value = rows[i].vino;
      if(rows[i].anyada && tr.querySelector('.añada')) tr.querySelector('.añada').value = rows[i].anyada;
    });

    calcBodegaTotals();
    attachVolActHandlers();

  }catch(e){
    console.error('Error cargando bodega:', e);
  }
}

// ----------------------
// Export PDF
// ----------------------

if (el('exportBodegaPDF')) el('exportBodegaPDF').addEventListener('click', ()=>{
  const tableHtml = tableToPrintableHTML(document.getElementById('bodegaTable'));
  const html = `<h2>Informe Bodega</h2>${tableHtml}${bResults.innerHTML}`;
  openPrint(html);
});


// ----------------------
// Inicialización
// ----------------------
loadBodega();
attachVolActHandlers();
calcBodegaTotals();

// ---------- BARRICAS ---------- (list) ----------
const barrBody = el('barrTableBody');
const barrCount = el('barrCount');
const barrLitros = el('barrLitros');

function makeColorOptions() {
  return Object.keys(colorMap).map(k => `<option value="${k}">${k}</option>`).join('');
}

function addBarrRow(count = 1, type = 225, anyada = 2022, fecha = '', color = '', carac = '') {
  if (!barrBody) return;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="checkbox" class="b_check"></td>
  <td><input class="b_count" type="number" min="1" value="${count}"></td>
    <td>
      <select class="b_type">
        <option value="225">225</option>
        <option value="300">300</option>
        <option value="500">500</option>
        <option value="1900">1900</option>
      </select>
    </td>
    <td class="b_total">0</td>
    <td>
      <select class="b_anyada">
        ${[2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034]
          .map(y => `<option value="${y}">${y}</option>`).join('')}
      </select>
    </td>
    <td><input class="b_fecha" type="date" value="${fecha}"></td>
    <td class="col-carac"><input class="carac" type="text" value="${carac}"></td>
    <td>
      <select class="b_color">${makeColorOptions()}</select>
      <div class="b_color_swatch"></div>
    </td>
    <td>&nbsp;</td>
    <td><button class="small delB">Eliminar</button></td>
  `;

  barrBody.appendChild(tr);

  // Inicializar valores
  tr.querySelector('.b_type').value = type;
  tr.querySelector('.b_anyada').value = anyada;
  tr.querySelector('.b_color').value = color;

  // Swatch color
  const colorSel = tr.querySelector('.b_color');
  const swatch = tr.querySelector('.b_color_swatch');
  swatch.style.width = '72px';
  swatch.style.height = '44px';
  swatch.style.borderRadius = '6px';
  swatch.style.border = '1px solid rgba(0,0,0,0.08)';
  swatch.style.display = 'inline-block';
  swatch.style.marginLeft = '8px';
  swatch.style.background = colorMap[colorSel.value] || '#ddd';

  colorSel.addEventListener('change', () => {
    swatch.style.background = colorMap[colorSel.value] || '#ddd';
  });

  // Cálculo litros barricas
  const compute = () => {
    const cnt = parseFloat(tr.querySelector('.b_count').value) || 0;
    const cap = parseFloat(tr.querySelector('.b_type').value) || 0;
    tr.querySelector('.b_total').textContent = (cnt * cap).toFixed(0);
    updateBarrTotals();
  };

  tr.querySelector('.b_count').addEventListener('input', compute);
  tr.querySelector('.b_type').addEventListener('change', compute);

  tr.querySelector('.delB').addEventListener('click', () => {
    tr.remove();
    updateBarrTotals();
  });

  compute();
}

// Añadir fila
if (el('addBarrRow')) {
  el('addBarrRow').addEventListener('click', () => addBarrRow());
}

// Fila inicial
addBarrRow(1, 225, 2022, '', '', '');

// Totales
function updateBarrTotals() {
  if (!barrBody) return;

  let totalBarr = 0;
  let totalLit = 0;

  [...barrBody.querySelectorAll('tr')].forEach(r => {
    const cnt = parseFloat(r.querySelector('.b_count').value) || 0;
    const cap = parseFloat(r.querySelector('.b_type').value) || 0;
    totalBarr += cnt;
    totalLit += cnt * cap;
  });

  if (barrCount) barrCount.textContent = totalBarr;
  if (barrLitros) barrLitros.textContent = totalLit.toFixed(0);
}

barrBody && barrBody.addEventListener('input', () => {
  updateBarrTotals();
  updateBarrYearTotals();
});

// ---------- GUARDAR ----------
if (el('saveBarr')) {
  el('saveBarr').addEventListener('click', () => {
    if (!barrBody) return;

    const rows = [...barrBody.querySelectorAll('tr')].map(r => ({
      count: r.querySelector('.b_count').value,
      type: r.querySelector('.b_type').value,
      anyada: r.querySelector('.b_anyada').value,
      fecha: r.querySelector('.b_fecha').value,
      color: r.querySelector('.b_color').value,
      carac: r.querySelector('.carac').value,
      vaciar: r.classList.contains('vaciar-pendiente')
    }));

    localStorage.setItem('barrData', JSON.stringify(rows));
    alert('Barricas guardadas correctamente');
  });
  
}

// ---------- CARGAR ----------
function loadBarr() {
  const raw = localStorage.getItem('barrData');
  if (!raw || !barrBody) return;

  try {
    const rows = JSON.parse(raw);
    barrBody.innerHTML = '';
    rows.forEach(r => {
  addBarrRow(
    r.count || 1,
    r.type || 225,
    r.anyada || 2022,
    r.fecha || '',
    r.color || '',
    r.carac || ''
  );

  const lastRow = barrBody.lastElementChild;

  if (r.vaciar) {
    lastRow.classList.add('vaciar-pendiente');
  }
});
    updateBarrTotals();
  } catch (e) {
    console.error(e);
  }
}
if (el('exportBarrPDF')) {
  el('exportBarrPDF').addEventListener('click', () => {

    if (!barrBody) return;

    // ===== 1. CONSTRUIR TABLA LIMPIA PARA PDF =====
    let rowsHtml = '';

    [...barrBody.querySelectorAll('tr')].forEach(r => {

      const count = r.querySelector('.b_count')?.value || '';
      const type = r.querySelector('.b_type');
      const anyada = r.querySelector('.b_anyada');
      const fecha = r.querySelector('.b_fecha')?.value || '';
      const carac = r.querySelector('.carac')?.value || '';
      const color = r.querySelector('.b_color');

      const litros = (parseFloat(count) || 0) * (parseFloat(type?.value) || 0);

      const pendiente = r.classList.contains('vaciar-pendiente');

rowsHtml += `
  <tr style="${pendiente ? 'background:#e3e3ba;' : ''}">
    <td>${count}</td>
    <td>${type?.value || ''}</td>
    <td>${litros.toFixed(0)}</td>
    <td>${anyada?.value || ''}</td>
    <td>${fecha}</td>
    <td>${carac}</td>
    <td>${color?.value || ''}</td>
  </tr>
`;
    });

    const tableHtml = `
      <table border="1" style="width:100%; border-collapse:collapse; text-align:center;">
        <thead>
          <tr>
            <th>BARRICAS</th>
            <th>CAPACIDAD</th>
            <th>LITROS</th>
            <th>AÑADA</th>
            <th>FECHA</th>
            <th>CARACTERÍSTICAS</th>
            <th>TIPO VINO</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
    

    // ===== 2. TOTALES =====
    const totalBarricas = barrCount?.textContent || '0';
    const totalLitros = barrLitros?.textContent || '0';

    const yearTotals = el('barrYearTotals')?.innerHTML || '';
    const pendingTotals = el('barrPendingTotal')?.innerHTML || '';

    // ===== 3. HTML FINAL =====
    const html = `
      <h2>Barricas</h2>

      <p><strong>TOTAL BARRICAS:</strong> ${totalBarricas}</p>
      <p><strong>TOTAL LITROS:</strong> ${totalLitros} L</p>

      <div>${yearTotals}</div>
      <div>${pendingTotals}</div>

      <br>

      ${tableHtml}
    `;

    openPrint(html);
  });
}


loadBarr();
updateBarrYearTotals();

if (el('vaciarBarricas')) {
  el('vaciarBarricas').addEventListener('click', () => {

    const rows = [...barrBody.querySelectorAll('tr')];

    rows.forEach(row => {
      const check = row.querySelector('.b_check');

      if (check && check.checked) {
        row.classList.add('vaciar-pendiente');
      }
    });

    updateBarrYearTotals(); // actualizar litros pendientes
  });
}
if (el('quitarVaciarBarricas')) {
  el('quitarVaciarBarricas').addEventListener('click', () => {

    const rows = [...barrBody.querySelectorAll('tr')];

    rows.forEach(row => {
      const check = row.querySelector('.b_check');

      if (check && check.checked) {
        row.classList.remove('vaciar-pendiente');
      }
    });

    updateBarrYearTotals();
  });
}
function updateBarrYearTotals() {
  if (!barrBody) return;

  let litrosPorAnio = {};
  let litrosPendientes = 0;

  [...barrBody.querySelectorAll('tr')].forEach(r => {
    const cnt = parseFloat(r.querySelector('.b_count')?.value) || 0;
    const cap = parseFloat(r.querySelector('.b_type')?.value) || 0;
    const litros = cnt * cap;

    const anyada = r.querySelector('.b_anyada')?.value || '—';

    // 👉 sumar por añada
    if (!litrosPorAnio[anyada]) litrosPorAnio[anyada] = 0;
    litrosPorAnio[anyada] += litros;

    // 👉 sumar pendientes (amarillo)
    if (r.classList.contains('vaciar-pendiente')) {
      litrosPendientes += litros;
    }
  });

  // ---- MOSTRAR POR AÑADA ----
  const yearDiv = el('barrYearTotals');
  if (yearDiv) {
    let texto = '<strong>LITROS POR AÑADA:</strong> ';

    texto += Object.entries(litrosPorAnio)
      .map(([anio, litros]) => `${anio}: ${litros.toFixed(0)} L`)
      .join(' / ');

    yearDiv.innerHTML = texto;
  }

  // ---- MOSTRAR PENDIENTES ----
  const pendingDiv = el('barrPendingTotal');
  if (pendingDiv) {
  pendingDiv.innerHTML = `<strong>Pendiente de Vaciar:</strong> ${litrosPendientes ? litrosPendientes.toFixed(0) : 0} L`;
}

// ---------- ORDENAR BARRICAS POR CRIANZA ----------
if (el('ordenarBarricas')) {
  el('ordenarBarricas').addEventListener('click', () => {

    if (!barrBody) return;

    const rows = [...barrBody.querySelectorAll('tr')];

    rows.sort((a, b) => {

      const fechaA = a.querySelector('.b_fecha')?.value || '';
      const fechaB = b.querySelector('.b_fecha')?.value || '';

      // Las filas sin fecha van al final
      if (!fechaA && !fechaB) return 0;
      if (!fechaA) return 1;
      if (!fechaB) return -1;

      // Fecha más antigua = más meses de crianza
      // Las fechas YYYY-MM-DD se pueden comparar directamente
      if (fechaA < fechaB) return -1;
      if (fechaA > fechaB) return 1;

      return 0;
    });

    // Volver a colocar las filas en el nuevo orden
    rows.forEach(row => {
      barrBody.appendChild(row);
    });

    updateBarrTotals();
    updateBarrYearTotals();
  });
}
  
}


// ---------- SO2 ----------
if (el('useMixVolume')) el('useMixVolume').addEventListener('click', ()=>{ if(lastMixVolume>0) el('so2Volume').value = lastMixVolume; });
if (el('calcSO2')) el('calcSO2').addEventListener('click', ()=>{ const V = parseFloat(el('so2Volume').value)||0; const A = parseFloat(el('so2Actual').value)||0; const O = parseFloat(el('so2Target').value)||0; const pct = parseFloat(el('so2Percent').value)||23.8; if(V<=0||O<=A){ if(el('so2Results')) el('so2Results').innerHTML='<p style="so2:red">Valores incorrectos</p>'; return; } const delta = O-A; const liters = ((V/1000)*1.4*delta)/pct*0.1; if(el('so2Results')) el('so2Results').innerHTML = `<p><strong>ΔSO₂:</strong> ${delta} mg/L</p><p><strong>Litros Solfosol M:</strong> ${liters.toFixed(2)} L</p>`; });
if (el('exportSO2CSV')) el('exportSO2CSV').addEventListener('click', ()=>{ const V=el('so2Volume').value; const A=el('so2Actual').value; const O=el('so2Target').value; const pct=el('so2Percent').value; const delta=(parseFloat(O)||0)-(parseFloat(A)||0); const liters = ((parseFloat(V)/1000)*1.4*delta)/parseFloat(pct)*0.1; const csv = `Volumen,SO2_actual,SO2_objetivo,Porcentaje,Delta,Litros\n${V},${A},${O},${pct},${delta},${liters}`; downloadCSV(csv,'so2.csv'); });
if (el('exportSO2PDF')) el('exportSO2PDF').addEventListener('click', ()=> { const so2Html = `\n    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">\n      <thead><tr><th>Campo</th><th>Valor</th></tr></thead>\n      <tbody>\n        <tr><td>Volumen (L)</td><td>${el('so2Volume').value||''}</td></tr>\n        <tr><td>SO₂ Actual (mg/L)</td><td>${el('so2Actual').value||''}</td></tr>\n        <tr><td>SO₂ Objetivo (mg/L)</td><td>${el('so2Target').value||''}</td></tr>\n        <tr><td>% Solfosol M</td><td>${el('so2Percent').value||''}</td></tr>\n      </tbody>\n    </table>\n  `; const html = `<h2>Corrección SO₂</h2>${so2Html}${el('so2Results').innerHTML}`; openPrint(html); });
if (el('saveSO2')) el('saveSO2').addEventListener('click', ()=>{ const payload = { V:el('so2Volume').value, actual:el('so2Actual').value, target:el('so2Target').value, pct:el('so2Percent').value }; localStorage.setItem('so2Data', JSON.stringify(payload)); alert('SO₂ guardado'); });
function loadSO2(){ const raw = localStorage.getItem('so2Data'); if(!raw) return; try{ const p = JSON.parse(raw); el('so2Volume').value = p.V||''; el('so2Actual').value = p.actual||''; el('so2Target').value = p.target||''; el('so2Percent').value = p.pct||'23.8'; }catch(e){console.error(e);} }
loadSO2();

// ---------- PRODUCTS ----------
const prodBody = el('prodTableBody');
const productOptions = ["AST","Ácido Tartárico","Chips de Madera","Enzima","Levadura","Nutriente","Tanino","Estabilizante","Clarificante","Bentonita"];
function addProdRow(name='', dose='', lit=''){ if(!prodBody) return; const tr=document.createElement('tr'); tr.innerHTML = `\n    <td>\n      <select class=\"prodName\">${productOptions.map(p=>`<option value=\"${p}\">${p}</option>`).join('')}\n      </select>\n    </td>\n    <td><input class=\"prodDose\" type=\"number\" value=\"${dose}\"></td>\n    <td><input class=\"prodLit\" type=\"number\" value=\"${lit}\"></td>\n    <td class=\"prodHL\">0</td>\n    <td class=\"prodCalc\">0</td>\n    <td><button class=\"small delP\">Eliminar</button></td>\n  `; prodBody.appendChild(tr); if(name) tr.querySelector('.prodName').value = name; const compute = ()=> computeProdRow(tr); tr.querySelector('.prodDose').addEventListener('input', compute); tr.querySelector('.prodLit').addEventListener('input', compute); tr.querySelector('.delP').addEventListener('click', ()=> tr.remove()); }
function computeProdRow(tr){ const dose = parseFloat(tr.querySelector('.prodDose').value)||0; const L = parseFloat(tr.querySelector('.prodLit').value)||0; const hL = L/100; const res = (dose*hL)/1000; tr.querySelector('.prodHL').textContent = hL.toFixed(0); tr.querySelector('.prodCalc').textContent = res.toFixed(2); }
if (el('addProdRow')) el('addProdRow').addEventListener('click', ()=> addProdRow()); addProdRow();
if (el('exportProdCSV')) el('exportProdCSV').addEventListener('click', ()=>{ if(!prodBody) return; let csv = 'Producto,Dosis,Litros,hL,Resultado\n'; [...prodBody.querySelectorAll('tr')].forEach(r=>{ csv += [r.querySelector('.prodName').value, r.querySelector('.prodDose').value, r.querySelector('.prodLit').value, r.querySelector('.prodHL').textContent, r.querySelector('.prodCalc').textContent].join(',')+'\n'; }); downloadCSV(csv,'productos.csv'); });
if (el('exportProdPDF')) el('exportProdPDF').addEventListener('click', ()=> { const tableHtml = tableToPrintableHTML(document.getElementById('prodTable')); const html = `<h2>Cálculos Productos</h2>${tableHtml}${el('prodResults').innerHTML}`; openPrint(html); });
if (el('saveProd')) el('saveProd').addEventListener('click', ()=>{ if(!prodBody) return; const rows=[...prodBody.querySelectorAll('tr')].map(r=>({ name:r.querySelector('.prodName').value, dose:r.querySelector('.prodDose').value, lit:r.querySelector('.prodLit').value })); localStorage.setItem('prodData', JSON.stringify(rows)); alert('Productos guardados'); });
function loadProd(){ const raw = localStorage.getItem('prodData'); if(!raw || !prodBody) return; try{ const rows = JSON.parse(raw); prodBody.innerHTML=''; rows.forEach(r=> addProdRow(r.name||'', r.dose||'', r.lit||'')); }catch(e){console.error(e);} }
loadProd();




// ---------- UTILITIES: print/export/table builder ----------
function tableToPrintableHTML(tableEl) {
  if (!tableEl) return '';

  let html = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">';
  
  // Encabezado
  const ths = tableEl.querySelectorAll('thead th');
  if (ths.length) {
    html += '<thead><tr>';
    ths.forEach(th => {
      const texto = th.textContent.trim().toLowerCase();
      if (!texto.includes('acción') && !texto.includes('accion') && !texto.includes('color')) {
        html += `<th style="background:#dfeff1;">${th.textContent.trim()}</th>`;
      }
    });
    html += '</tr></thead>';
  }

  // Cuerpo
  html += '<tbody>';
  const rows = tableEl.querySelectorAll('tbody tr');
  rows.forEach(row => {
    html += '<tr>';
    Array.from(row.children).forEach(cell => {
      const headerIndex = Array.from(cell.parentNode.children).indexOf(cell);
      const headerText = tableEl.querySelector(`thead tr th:nth-child(${headerIndex+1})`)?.textContent.toLowerCase() || '';
      if (headerText.includes('acción') || headerText.includes('accion') || headerText.includes('color')) return;

      const input = cell.querySelector('input, select, textarea');
      let val = '';
      if (input) {
        if (input.tagName.toLowerCase() === 'select') {
          const selectedOption = input.options[input.selectedIndex];
          val = selectedOption ? selectedOption.text : '';
        } else {
          val = input.value;
        }
      } else {
        val = cell.textContent.trim();
      }
      html += `<td style="vertical-align:top">${val}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  // Solo para barricas: añadir los totales debajo de la tabla
  if (tableEl.id === 'barrTable') {
    const totalBarr = barrCount ? barrCount.textContent : '';
    const totalLit = barrLitros ? barrLitros.textContent : '';
    if (totalBarr || totalLit) {
      html += `<div style="margin-top:12px;font-weight:bold;">
        Total Barricas: ${totalBarr} — Total Litros: ${totalLit} L
      </div>`;
    }
  }

  return html;
}

function openPrint(html){ const stylesheet = document.querySelector('link[rel="stylesheet"]') ? document.querySelector('link[rel="stylesheet"]').href : null; const w = window.open('','_blank'); w.document.open(); w.document.write(`\n    <html>\n      <head>\n        <title>Informe</title>\n        ${stylesheet?`<link rel="stylesheet" href="${stylesheet}">`:''}\n        <style>body{font-family:Inter, Arial, sans-serif;padding:16px;so2:#111}table{font-size:12px}h2{margin-top:0}</style>\n      </head>\n      <body>${html}</body>\n    </html>\n  `); w.document.close(); setTimeout(()=> w.print(), 500); }

// ----------------------
// MAPA: kept as before
// ----------------------
const mapaRowCounts = [7,7,4,5];
const wineColors = {'Tinto':'#5B0B15','Rosado':'#c93fa0','Blanco':'#D6B34A'};
function generateMapa(){ const container = el('mapContainer'); if(!container || !bBody) return; container.innerHTML=''; const rows=[...bBody.querySelectorAll('tr')]; const depositData = rows.map((r,idx)=>{ const cap=parseFloat(r.querySelector('.cap').value)||capacities[idx]; const actual=parseFloat(r.querySelector('.volAct').value)||0; const vinoSelect=r.querySelector('.vino'); const vino= vinoSelect? vinoSelect.value:'Tinto'; const pct = cap>0? Math.min(100,(actual/cap)*100):0; return {index: idx+1, cap, actual, vino, pct}; }); let di=0; mapaRowCounts.forEach((count)=>{ const rowWrap=document.createElement('div'); rowWrap.className='map-row'; for(let i=0;i<count;i++){ const d=depositData[di]; const wrap=document.createElement('div'); wrap.className='dep-wrap'; const depEl=document.createElement('div'); depEl.className='dep'; depEl.setAttribute('data-dep', d.index); const fill=document.createElement('div'); fill.className='fill'; const color = wineColors[d.vino]||wineColors['Tinto']; fill.style.background=color; fill.style.height=`${d.pct}%`; const center=document.createElement('div'); center.className='center'; const dnum=document.createElement('div'); dnum.className='dnum'; dnum.textContent=`D${d.index}`; center.appendChild(dnum); const caption=document.createElement('div'); caption.className='dep-caption'; caption.textContent=`${Math.round(d.actual).toLocaleString()} / ${d.cap.toLocaleString()} L`; const pctBadge=document.createElement('div'); pctBadge.className='pct'; pctBadge.textContent=`${Math.round(d.pct)}%`; depEl.appendChild(fill); depEl.appendChild(center); depEl.appendChild(pctBadge);
  depEl.addEventListener('click', ()=>{ show('bodegaScreen'); const targetRow = bBody.querySelector(`tr:nth-child(${d.index})`); if(targetRow){ targetRow.scrollIntoView({behavior:'smooth', block:'center'}); targetRow.classList.remove('bodega-highlight'); void targetRow.offsetWidth; targetRow.classList.add('bodega-highlight'); } });
  wrap.appendChild(depEl); wrap.appendChild(caption); rowWrap.appendChild(wrap); di++; }
 container.appendChild(rowWrap); }); }

function buildMapSVGString(depositData){ const diameter=140; const spacingX=24; const spacingY=36; const rows=[7,7,4,5]; const maxRow=Math.max(...rows); const width=maxRow*diameter + (maxRow-1)*spacingX + 40; const height=rows.length*diameter + (rows.length-1)*spacingY + 160; let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`; svg += `<style>.label{font-family:Inter, Arial, sans-serif;fill:#fff;text-anchor:middle}.num{font-weight:800;font-size:16px}.pct{font-size:14px}.lit{font-size:12px; fill:#111; text-anchor:middle}.pctbox{font-size:12px;fill:#111}</style>`; let idx=0; let y = 90; for(let r=0;r<rows.length;r++){ const count=rows[r]; const rowWidth=count*diameter + (count-1)*spacingX; let startX=(width-rowWidth)/2 + diameter/2; let x=startX; for(let c=0;c<count;c++){ const d=depositData[idx]; const cx=x; const cy=y; svg += `<circle cx="${cx}" cy="${cy}" r="${diameter/2}" fill="#eeeeee" stroke="rgba(0,0,0,0.08)" stroke-width="3"/>`; const clipId=`clip-${idx}`; svg += `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${diameter/2}"/></clipPath>`; const pct=d.pct; const fillH=(pct/100)*diameter; const fillY=cy + diameter/2 - fillH; const color = (d.vino==='Rosado')? colorMap['ROSADO'] : (d.vino==='Blanco'? '#D6B34A' : '#5B0B15'); svg += `<rect x="${cx - diameter/2}" y="${fillY}" width="${diameter}" height="${fillH}" fill="${color}" clip-path="url(#${clipId})"/>`; svg += `<text class="label num" x="${cx}" y="${cy - 6}">D${d.index}</text>`;  svg += `<text class="lit" x="${cx}" y="${cy + diameter/2 + 18}">${Math.round(d.actual).toLocaleString()} / ${d.cap.toLocaleString()} L</text>`; const badgeW=42, badgeH=20; const bx=cx + diameter/2 - badgeW - 6; const by=cy - diameter/2 + 6; svg += `<rect x="${bx}" y="${by}" rx="6" ry="6" width="${badgeW}" height="${badgeH}" fill="rgba(255,255,255,0.9)"/>`; svg += `<text x="${bx + badgeW/2}" y="${by + badgeH/2 + 5}" class="pctbox" text-anchor="middle">${Math.round(pct)}%</text>`; x += diameter + spacingX; idx++; } y += diameter + spacingY; } svg += `</svg>`; return svg; }

function exportMapaAsJPG(){ if(!bBody) return; const rows=[...bBody.querySelectorAll('tr')]; const depositData = rows.map((r, idx) => { const cap=parseFloat(r.querySelector('.cap').value) || capacities[idx]; const actual=parseFloat(r.querySelector('.volAct').value) || 0; const vinoSelect=r.querySelector('.vino'); const vino = vinoSelect ? vinoSelect.value : 'Tinto'; const pct = cap > 0 ? Math.min(100, (actual / cap) * 100) : 0; return { index: idx+1, cap, actual, vino, pct }; }); const svgStr = buildMapSVGString(depositData); const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr); const img = new Image(); img.onload = function(){ const canvas=document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); const dataURL = canvas.toDataURL('image/jpeg', 0.95); const link=document.createElement('a'); link.href=dataURL; link.download='mapa_depositos.jpg'; document.body.appendChild(link); link.click(); link.remove(); }; img.onerror = function(e){ alert('Error generando imagen SVG -> JPG'); console.error(e); }; img.src = svg64; }
if (el('exportMapaPNG')) el('exportMapaPNG').addEventListener('click', exportMapaAsJPG);
if (el('exportMapaPDF')) el('exportMapaPDF').addEventListener('click', ()=>{ if(!bBody) return; const rows=[...bBody.querySelectorAll('tr')]; const depositData = rows.map((r, idx) => { const cap=parseFloat(r.querySelector('.cap').value) || capacities[idx]; const actual=parseFloat(r.querySelector('.volAct').value) || 0; const vinoSelect=r.querySelector('.vino'); const vino = vinoSelect ? vinoSelect.value : 'Tinto'; const pct = cap > 0 ? Math.min(100, (actual / cap) * 100) : 0; return { index: idx+1, cap, actual, vino, pct }; }); const svgStr = buildMapSVGString(depositData); const html = `<h2>Mapa de Depósitos</h2>${svgStr}`; openPrint(html); });

// ---------- SALA BARRICAS (drag/drop) ----------
const paletteEl = el('palette');
const salaGrid = el('salaGrid');
const salaNumberLabel = el('salaNumber');
let currentSala = 1;
const SALA_COLS = 18; const SALA_ROWS = 10; // per requirements

// initialize palette
const paletteItems = [
  {name:'24 MOZAS-1',label:'MO1'},{name:'24 MOZAS-2',label:'MO2'},{name:'24 MOZAS-3',label:'MO3'},{name:'24 MOZAS-4',label:'MO4'},
  {name:'MADREMIA-1',label:'MM1'},{name:'MADREMIA-2',label:'MM2'},{name:'MADREMIA-3',label:'MM3'},{name:'MADREMIA-4',label:'MM4'},
  {name:'ABRACADABRA-1',label:'AB1'},{name:'ABRACADABRA-2',label:'AB2'},
  {name:'PLATON-1',label:'PL1'},{name:'PLATON-2',label:'PL2'},
  {name:'DIVINA-1',label:'DV1'},{name:'DIVINA-2',label:'DV2'},{name:'LOQUILLO',label:'LQ'},{name:'EL PRINCIPITO',label:'EP'},
  {name:'300',label:'300'},{name:'500',label:'500'}
];

function renderPalette(){ if(!paletteEl) return; paletteEl.innerHTML=''; paletteItems.forEach(it=>{ const d = document.createElement('div');

if (it.name.startsWith('DIVINA')) {
  d.className = 'pallet-item pallet-divina';
} else {
  d.className = 'pallet-item';
} d.draggable=true; d.dataset.name=it.name; d.textContent=it.label; d.style.background = colorMap[it.name] || '#999'; d.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', it.name); }); paletteEl.appendChild(d); }); }
renderPalette();

// Sala storage structure: object { sala1: {...cells...}, sala2:..., sala3:... }
let salaState = { sala1:{}, sala2:{}, sala3:{} };

function buildSalaGrid(){ if(!salaGrid) return; salaGrid.innerHTML=''; for(let r=0;r<SALA_ROWS;r++){ for(let c=0;c<SALA_COLS;c++){ const idx = r*SALA_COLS + c; const cell = document.createElement('div'); cell.className='sala-cell empty'; cell.dataset.idx = idx; cell.dataset.row = r; cell.dataset.col = c; cell.addEventListener('dragover', (e)=> e.preventDefault()); cell.addEventListener('drop', onCellDrop); cell.addEventListener('click', ()=> selectCell(cell)); const label = document.createElement('div'); label.className='cell-label'; cell.appendChild(label); const count = document.createElement('div'); count.className='count'; count.textContent='0'; cell.appendChild(count); salaGrid.appendChild(cell); } } loadSalaState(); renderSala(); }

const BARRICAS_POR_DROP = 4;

function onCellDrop(e){
  e.preventDefault();
  const name = e.dataTransfer.getData('text/plain');
  const cell = e.currentTarget;
  const key = `sala${currentSala}`;
  const idx = cell.dataset.idx;

  const state = salaState[key] || {};
  const cellState = state[idx] || null;

  if(!cellState){
    state[idx] = { colorName: name, count: BARRICAS_POR_DROP };
    salaState[key] = state;
  } else {
    if(cellState.colorName === name){
      cellState.count += BARRICAS_POR_DROP;
    } else {
      alert('Esta casilla ya tiene otro color. Vacíala primero para cambiar.');
      return;
    }
  }

  saveSalaState();
  renderSalaCell(cell, state[idx]);
}


let selectedCell = null;
function selectCell(cell){ if(selectedCell) selectedCell.classList.remove('selected'); selectedCell = cell; selectedCell.classList.add('selected'); }

function renderSalaCell(cell, state){

  const count = cell.querySelector('.count');
  const label = cell.querySelector('.cell-label');

  if(!state){
    cell.classList.add('empty');
    cell.style.background = '';

    count.textContent = '0';
    count.style.background = '';
    count.style.borderRadius = '6px';

    label.textContent = '';
    return;
  }

  cell.classList.remove('empty');

  const col = colorMap[state.colorName] || '#999';

  // La celda siempre igual
  cell.style.background = '';

  // El color va en el bloque interior
  count.style.background = col;
  count.textContent = state.count;

  label.textContent = state.colorName;

  // DIVINA redonda
  if(state.colorName.startsWith('DIVINA')){
    count.style.borderRadius = '50%';
  }else{
    count.style.borderRadius = '6px';
  }
}
function renderSala(){ salaNumberLabel.textContent = currentSala; const key = `sala${currentSala}`; const state = salaState[key] || {}; const cells=[...salaGrid.querySelectorAll('.sala-cell')]; cells.forEach(cell=>{ const idx = cell.dataset.idx; const st = state[idx]; if(st) renderSalaCell(cell, st); else renderSalaCell(cell, null); }); }

function saveSalaState(){ localStorage.setItem('salaState', JSON.stringify(salaState)); }
function loadSalaState(){ const raw = localStorage.getItem('salaState'); if(!raw) return; try{ salaState = JSON.parse(raw); }catch(e){ console.error(e); } }

qsa('.sala-btn').forEach(b=> b.addEventListener('click', (e)=>{ currentSala = parseInt(e.target.dataset.sala); renderSala(); }));

// clear selected cell
if(el('clearCell')) el('clearCell').addEventListener('click', ()=>{ if(!selectedCell) return; const key = `sala${currentSala}`; const idx = selectedCell.dataset.idx; if(salaState[key] && salaState[key][idx]){ delete salaState[key][idx]; saveSalaState(); renderSala(); } });

// Quitar 1 barrica de la casilla seleccionada
if(el('removeOne')) el('removeOne').addEventListener('click', ()=>{ if(!selectedCell) return; const key = `sala${currentSala}`; const idx = selectedCell.dataset.idx; const st = salaState[key] && salaState[key][idx]; if(!st) return; st.count = (st.count||0) - 1; if(st.count <= 0){ delete salaState[key][idx]; } else { salaState[key][idx] = st; } saveSalaState(); renderSala(); });

/*** EXPORTACIÓN SALA DE BARRICAS JPG ***/
function exportSalaCompletaJPG(){
  const key = `sala${currentSala}`;
  const state = salaState[key] || {};

  // Totales
  let totalSala = 0;
  Object.values(state).forEach(c => totalSala += c.count || 0);

  let totalGlobal = 0;
  Object.values(salaState).forEach(s => {
    Object.values(s).forEach(c => totalGlobal += c.count || 0);
  });

  // Medidas
  const cellW = 48, cellH = 48, cols = SALA_COLS, rows = SALA_ROWS;
  const gridW = cols*(cellW+6)+20;
  const gridH = rows*(cellH+6)+40;
  const lateralW = 220;
  const width = gridW + lateralW + 40;
  const height = gridH + 180;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;

  // Título
  svg += `<text x="${width/2}" y="40" font-size="28" text-anchor="middle" font-weight="bold">SALA ${currentSala}</text>`;

  // Cuadrícula
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const idx = r*cols+c;
      const x = 20+c*(cellW+6);
      const y = 70+r*(cellH+6);
      const st = state[idx];
      const fill = st ? (colorMap[st.colorName] || '#ddd') : '#f7f7f8';
      for(let r = 0; r < rows; r++){
  for(let c = 0; c < cols; c++){

    const idx = r * cols + c;
    const x = 20 + c * (cellW + 6);
    const y = 70 + r * (cellH + 6);

    const st = state[idx];

    if(!st){
      svg += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="6" fill="#f7f7f8" stroke="#ddd"/>`;
      continue;
    }

    const fill = colorMap[st.colorName] || '#ddd';
    const esDivina = st.colorName.startsWith('DIVINA');

    if(esDivina){
      const cx = x + cellW / 2;
      const cy = y + cellH / 2;
      const radius = cellW / 2;

      svg += `
        <circle
          cx="${cx}"
          cy="${cy}"
          r="${radius}"
          fill="${fill}"
          stroke="#ddd"
        />
      `;
    } else {
      svg += `
        <rect
          x="${x}"
          y="${y}"
          width="${cellW}"
          height="${cellH}"
          rx="6"
          fill="${fill}"
          stroke="#ddd"
        />
      `;
    }

    svg += `
      <text
        x="${x + cellW / 2}"
        y="${y + cellH / 2}"
        font-size="12"
        text-anchor="middle"
        alignment-baseline="middle"
        fill="#fff"
      >
        ${st.count}
      </text>
    `;
  }
}
      if(st) svg += `<text x="${x+cellW/2}" y="${y+cellH/2}" font-size="12" text-anchor="middle" alignment-baseline="middle" fill="#fff">${st.count}</text>`;
    }
  }

  // Panel lateral
  let yL = 80;
  svg += `<text x="${gridW+30}" y="70" font-size="18" font-weight="bold">Barricas</text>`;
  paletteItems.forEach(p => {
    const esDivina = p.name.startsWith('DIVINA');

if(esDivina){
  svg += `
    <circle
      cx="${gridW + 40}"
      cy="${yL + 10}"
      r="10"
      fill="${colorMap[p.name] || '#999'}"
    />
  `;
} else {
  svg += `
    <rect
      x="${gridW + 30}"
      y="${yL}"
      width="20"
      height="20"
      rx="4"
      fill="${colorMap[p.name] || '#999'}"
    />
  `;
}
    svg += `<text x="${gridW+60}" y="${yL+15}" font-size="14">${p.label}</text>`;
    yL += 28;
  });

  // Totales
  svg += `<rect x="0" y="${gridH+90}" width="${width}" height="70" fill="#e9ecef"/>`;
  svg += `<text x="${width/2}" y="${gridH+120}" font-size="20" text-anchor="middle" font-weight="bold">Total Sala ${currentSala}: ${totalSala} barricas</text>`;
  svg += `<text x="${width/2}" y="${gridH+145}" font-size="18" text-anchor="middle">Total Bodega (3 salas): ${totalGlobal} barricas</text>`;

  svg += `</svg>`;

  const img = new Image();
  img.onload = function(){
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img,0,0);
    const link = document.createElement('a');
    link.download = `Sala_${currentSala}.jpg`;
    link.href = canvas.toDataURL('image/jpeg',0.95);
    link.click();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ASIGNAR EVENTO AL BOTÓN JPG
if(el('exportSalaJPG')) el('exportSalaJPG').addEventListener('click', exportSalaCompletaJPG);


// load and build sala grid
window.addEventListener('DOMContentLoaded', ()=>{ 
  buildSalaGrid(); 
});

// small safety interval to keep totals updated
setInterval(()=>{ try{ calcBodegaTotals();
      attachVolActHandlers(); updateMixTotals(); updateBarrTotals(); renumberMov(); }catch(e){} }, 1000);
// Solo PLATON (gris oscuro) muestra números en negro
function setCellCountColor(cell, bg){
  const count = cell.querySelector('.count');
  if(!count) return;
  if(bg === '#4b5563') count.style.color = '#000';
  else count.style.color = '';
}

document.addEventListener('input', e=>{
  const tr=e.target.closest('tr');
  if(!tr) return;
  const d=tr.querySelector('.prodDose');
  const v=tr.querySelector('.prodVol');
  const r=tr.querySelector('.prodResult');
  if(d&&v&&r){
    r.textContent=((parseFloat(v.value)||0)*(parseFloat(d.value)||0)/1000).toFixed(2);
  }
});

// ---------- ÁCIDO LÁCTICO (tabla independiente corregida) ----------
const lacticBody = el('acidLacticBody');

function addLacticRow(){
  if(!lacticBody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>Ácido Láctico</td>
    <td>
      <select class="lacPct">
        <option value="0.8">80%</option>
        <option value="0.88">88%</option>
      </select>
    </td>
    <td><input class="lacAct" type="number" step="0.01"></td>
    <td><input class="lacObj" type="number" step="0.01"></td>
    <td class="lacDose">0</td>
    <td><input class="lacVol" type="number" step="0.01"></td>
    <td class="lacRes">0</td>
    <td><button class="small delL">Eliminar</button></td>
  `;
  lacticBody.appendChild(tr);

  const compute = ()=>{
    const act = parseFloat(tr.querySelector('.lacAct').value) || 0;
    const obj = parseFloat(tr.querySelector('.lacObj').value) || 0;
    const pct = parseFloat(tr.querySelector('.lacPct').value) || 0;
    const vol = parseFloat(tr.querySelector('.lacVol').value) || 0;

    // FORMULA EXACTA PEDIDA:
    // dosis = (Acidez objetivo - Acidez actual) / porcentaje * 1.2
    const dose = pct ? ((obj - act) / pct) * 1.2 : 0;

    tr.querySelector('.lacDose').textContent = dose.toFixed(2);
    tr.querySelector('.lacRes').textContent = ((vol * dose) / 1000).toFixed(2);
  };

  tr.querySelectorAll('input, select').forEach(elm =>
    elm.addEventListener('input', compute)
  );

  tr.querySelector('.delL').addEventListener('click', ()=> tr.remove());
}

if(el('addLacticRow')) el('addLacticRow').addEventListener('click', addLacticRow);
if(lacticBody && lacticBody.children.length === 0) addLacticRow();

if(el('saveLactic')) el('saveLactic').addEventListener('click', ()=>{
  const rows = [...lacticBody.querySelectorAll('tr')].map(r => ({
    pct: r.querySelector('.lacPct').value,
    act: r.querySelector('.lacAct').value,
    obj: r.querySelector('.lacObj').value,
    vol: r.querySelector('.lacVol').value
  }));
  localStorage.setItem('lacticData', JSON.stringify(rows));
  alert('Ácido láctico guardado');
});

(function loadLactic(){
  const raw = localStorage.getItem('lacticData');
  if(!raw || !lacticBody) return;
  lacticBody.innerHTML = '';
  JSON.parse(raw).forEach(r => {
    addLacticRow();
    const tr = lacticBody.lastElementChild;
    tr.querySelector('.lacPct').value = r.pct;
    tr.querySelector('.lacAct').value = r.act;
    tr.querySelector('.lacObj').value = r.obj;
    tr.querySelector('.lacVol').value = r.vol;
    tr.querySelector('.lacVol').dispatchEvent(new Event('input'));
  });
})();

if(el('exportLacticPDF')) el('exportLacticPDF').addEventListener('click', ()=>{
  const html = `<h2>Corrección Ácido Láctico</h2>` +
    tableToPrintableHTML(document.getElementById('acidLacticTable'));
  openPrint(html);
});


if (el('btnNotes')) el('btnNotes').addEventListener('click', ()=> show('notesScreen'));

// ---------- BLOCKS DE NOTAS ----------
document.addEventListener('DOMContentLoaded', () => {
  const homeScreen = document.getElementById('homeScreen');
  const notesScreen = document.getElementById('notesScreen');

  const btnOpenNotes = document.getElementById('btnNotes'); // Botón en la página principal
  const btnBackNotes = notesScreen.querySelector('.btn-back');

  const noteTitle = document.getElementById('noteTitle');
  const notesText = document.getElementById('notesText');
  const notesList = document.getElementById('notesList');
  const searchInput = document.getElementById('searchNotes');
  const btnSearchNotes = document.getElementById('btnSearchNotes');

  const saveNotesBtn = document.getElementById('saveNotes');
  const clearNotesBtn = document.getElementById('clearNotes');
  const exportPDFBtn = document.getElementById('exportNotesPDF');

  let editingIndex = null; // null si estamos creando nueva nota, número si estamos editando

  // -------------------------------
  // Funciones de almacenamiento
  // -------------------------------
  function getNotes() {
    return JSON.parse(localStorage.getItem('notes')) || [];
  }

  function saveNotesStorage(notes) {
    localStorage.setItem('notes', JSON.stringify(notes));
  }

  // -------------------------------
  // Renderizar lista de notas
  // -------------------------------
  function renderNotes(filter = '', highlightIndex = null) {
  const notes = getNotes();
  notesList.innerHTML = '';

  notes
    .filter(n => n.title.toLowerCase().includes(filter.toLowerCase()))
    .forEach((note, index) => {
      const div = document.createElement('div');
      div.classList.add('note-item');

      if(index === highlightIndex){
        div.classList.add('highlight');
      }

      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.marginBottom = '5px';

      div.innerHTML = `
        <strong>${note.title}</strong>
        <div>
          <button class="view" data-index="${index}">Ver</button>
          <button class="edit" data-index="${index}">Editar</button>
          <button class="delete" data-index="${index}">Borrar</button>
        </div>
      `;
      notesList.appendChild(div);
    });
}

  // -------------------------------
  // Abrir Block de Notas desde la página principal
  // -------------------------------
  btnOpenNotes.addEventListener('click', () => {
    homeScreen.classList.add('hidden');
    notesScreen.classList.remove('hidden');
    renderNotes();
    clearEditor();
  });

  // -------------------------------
  // Volver a la página principal
  // -------------------------------
  btnBackNotes.addEventListener('click', () => {
    notesScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    clearEditor();
    searchInput.value = '';
  });

  // -------------------------------
  // Limpiar editor
  // -------------------------------
  function clearEditor() {
    noteTitle.value = '';
    notesText.value = '';
    editingIndex = null;
  }

  // -------------------------------
  // Guardar nota (crear o editar)
  // -------------------------------
  saveNotesBtn.addEventListener('click', () => {
    const title = noteTitle.value.trim();
    const text = notesText.value.trim();

    if (!title || !text) {
      alert('Título y contenido son requeridos');
      return;
    }

    const notes = getNotes();

    if (editingIndex !== null) {
      // Actualizamos nota existente
      notes[editingIndex] = { title, text };
      editingIndex = null;
      alert('Nota actualizada');
    } else {
      // Creamos nueva nota
      notes.push({ title, text });
      alert('Nota creada');
    }

    saveNotesStorage(notes);
    renderNotes(searchInput.value.trim());
    clearEditor();
  });

  // -------------------------------
  // Borrar contenido del editor
  // -------------------------------
  clearNotesBtn.addEventListener('click', () => {
    if (confirm('¿Borrar contenido actual?')) {
      clearEditor();
    }
  });

  // -------------------------------
  // Exportar nota a PDF
  // -------------------------------
  exportPDFBtn.addEventListener('click', () => {
    if (!noteTitle.value || !notesText.value) {
      alert('Escribe la nota antes de exportar');
      return;
    }
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head><title>${noteTitle.value}</title></head>
        <body>
          <h2>${noteTitle.value}</h2>
          <pre>${notesText.value.replace(/</g, '&lt;')}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  });

// -------------------------------
// Buscar nota y cargar en editor con resaltado
// -------------------------------
btnSearchNotes.addEventListener('click', () => {
  const filter = searchInput.value.trim().toLowerCase();
  const notes = getNotes();

  // Limpiar panel y resaltado si buscador está vacío
  if (!filter) {
    clearEditor();
    renderNotes();
    return;
  }

  // Buscar coincidencia exacta por título
  const index = notes.findIndex(n => n.title.toLowerCase() === filter);

  // Renderizamos todas las notas
  renderNotes();

  if (index !== -1) {
    // Cargar en panel de escritura
    noteTitle.value = notes[index].title;
    notesText.value = notes[index].text;
    editingIndex = index;

    // Resaltar la nota encontrada
    const noteDivs = notesList.querySelectorAll('.note-item');
    if (noteDivs[index]) noteDivs[index].classList.add('highlight');
  } else {
    clearEditor();
    alert('No se encontró ninguna nota con ese título');
  }
});

// -------------------------------
// Escuchar cambios en el buscador para limpiar panel al borrar
// -------------------------------
searchInput.addEventListener('input', () => {
  if (searchInput.value.trim() === '') {
    clearEditor();
    renderNotes(); // quita resaltado
  }
});



  // -------------------------------
  // Ver, Editar y Borrar notas
  // -------------------------------
  notesList.addEventListener('click', (e) => {
    const index = e.target.dataset.index;
    if (index === undefined) return;

    const notes = getNotes();

    if (e.target.classList.contains('view')) {
      noteTitle.value = notes[index].title;
      notesText.value = notes[index].text;
      editingIndex = null; // solo visualización
    }

    if (e.target.classList.contains('edit')) {
      noteTitle.value = notes[index].title;
      notesText.value = notes[index].text;
      editingIndex = parseInt(index); // modo edición activo
    }

   if (e.target.classList.contains('delete')) {
  if (confirm('¿Borrar esta nota?')) {
    notes.splice(index, 1);
    saveNotesStorage(notes);
    searchInput.value = ''; // 👈 limpiar input de búsqueda
    renderNotes();          // 👈 renderizar toda la lista actualizada
    clearEditor();          // 👈 limpiar panel de escritura
  }
}

  });

  // Inicializar lista al cargar
  renderNotes();
});


// BOTÓN BORRAR SALA
if(el('clearSala')){
  el('clearSala').addEventListener('click', () => {
    if (!confirm("¿Seguro que quieres borrar toda la sala?")) return;

    // Limpiar todas las celdas de la sala actual
    const key = `sala${currentSala}`;
    salaState[key] = {};

    // Guardar cambios en localStorage
    saveSalaState();

    // Refrescar la cuadrícula
    renderSala();

    // Opcional: quitar selección
    selectedCell = null;
  });
}

// ========== FUNCION GLOBAL PARA EXPORTAR EXCEL ==========
function exportarExcelPorTabla(idTabla, columnasOcultas = []) {
    const tabla = document.getElementById(idTabla);
    if (!tabla) {
        alert("No se encontró la tabla: " + idTabla);
        return;
    }

    const filas = tabla.querySelectorAll("tr");
    let datos = [];

    filas.forEach((fila) => {
        const celdas = fila.querySelectorAll("th, td");
        let filaDatos = [];

        celdas.forEach((celda, index) => {

            // ❌ Ocultar columnas según lista
            if (columnasOcultas.includes(index)) return;

            // ✔ Select
            if (celda.querySelector("select")) {
                filaDatos.push(celda.querySelector("select").value || "");
                return;
            }

            // ✔ Fecha
            if (celda.querySelector("input[type='date']")) {
                filaDatos.push(celda.querySelector("input[type='date']").value || "");
                return;
            }

            // ✔ Input general
            if (celda.querySelector("input")) {
                filaDatos.push(celda.querySelector("input").value || "");
                return;
            }

            // ✔ Texto
            filaDatos.push(celda.textContent.trim());
        });

        datos.push(filaDatos);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, idTabla + ".xlsx"); // nombre según tabla
}
// MEZCLAS (columna de acción es la 6 -> índice 6)
document.getElementById("exportMixExcel").onclick = () => {
    const tabla = document.getElementById("mixTable");
    const filas = tabla.querySelectorAll("tr");
    let datos = [];

    filas.forEach((fila) => {
        const celdas = fila.querySelectorAll("th, td");
        let filaDatos = [];

        celdas.forEach((celda, index) => {
            // ❌ Ocultar columna de ACCIÓN (índice 6)
            if (index === 6) return;

            // ✔ Select
            if (celda.querySelector("select")) {
                filaDatos.push(celda.querySelector("select").value || "");
                return;
            }

            // ✔ Input
            if (celda.querySelector("input")) {
                filaDatos.push(celda.querySelector("input").value || "");
                return;
            }

            // ✔ Texto
            filaDatos.push(celda.textContent.trim());
        });

        datos.push(filaDatos);
    });

    // 2️⃣ Agregar el resultado del cálculo desde el div corrector
    const resultadosDiv = document.getElementById("mixResults");
    if (resultadosDiv && resultadosDiv.textContent.trim() !== "") {
        datos.push([]);
        datos.push(["RESULTADO DE LA MEZCLA", resultadosDiv.textContent.trim()]);
    }

    // 3️⃣ Crear Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, "Mezclas");
    XLSX.writeFile(wb, "MEZCLAS.xlsx");
};


// MOVIMIENTOS (columna de acción es la 8 -> índice 8)
document.getElementById("exportMovExcel").onclick = () => 
    exportarExcelPorTabla("movTable", [8]);

// BODEGA (NO tiene columna de 'acción', no ocultamos nada)
document.getElementById("exportBodegaExcel").onclick = () => 
    exportarExcelPorTabla("bodegaTable");

// BARRICAS (columna de acción es la 9)
document.getElementById("exportBarrExcel").onclick = () => 
    exportarExcelPorTabla("barrTable", [9]);

// PRODUCTOS (columna de acción es la 5)
document.getElementById("exportProdExcel").onclick = () => 
    exportarExcelPorTabla("prodTable", [5]);

// ACIDO LÁCTICO (acción es la 7)
document.getElementById("exportLacticExcel").onclick = () => 
    exportarExcelPorTabla("acidLacticTable", [7]);

document.getElementById("exportSO2Excel").onclick = () => {
    const inputs = document.querySelectorAll("#so2Screen input");
    const datos = [["Campo", "Valor"]]; // encabezado

    // 1️⃣ Guardar valores de inputs
    inputs.forEach(input => {
        const label = input.previousElementSibling;
        const nombre = label ? label.textContent.trim() : input.id;
        const valor = input.value || "";
        datos.push([nombre, valor]);
    });

    // 2️⃣ Guardar resultados del cálculo
    const resultadosDiv = document.getElementById("so2Results");
    if (resultadosDiv) {
        // Si hay elementos hijos con resultados
        const resultados = resultadosDiv.querySelectorAll("*");
        resultados.forEach((elem, index) => {
            const nombre = elem.dataset.label || "Resultado " + (index + 1);
            const valor = elem.textContent.trim();
            if (valor) datos.push([nombre, valor]);
        });

        // Si el div solo tiene texto plano
        if (resultadosDiv.childElementCount === 0 && resultadosDiv.textContent.trim() !== "") {
            datos.push(["Resultado", resultadosDiv.textContent.trim()]);
        }
    }

    // 3️⃣ Crear Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, "SO2");
    XLSX.writeFile(wb, "SO2.xlsx");
};
function generateMapa(){
  const container = el('mapContainer');
  if(!container || !bBody) return;

  container.innerHTML='';

  const rows = [...bBody.querySelectorAll('tr')];
  const depositData = rows.map((r, idx) => {
    const cap = parseFloat(r.querySelector('.cap').value) || capacities[idx];
    const actual = parseFloat(r.querySelector('.volAct').value) || 0;
    const vinoSelect = r.querySelector('.vino');
    const vino = vinoSelect ? vinoSelect.value : 'Tinto';
    const pct = cap > 0 ? Math.min(100, (actual / cap) * 100) : 0;
    return { index: idx + 1, cap, actual, vino, pct };
  });

  // Crear contenedores de Naves
  const nave1Container = document.createElement('div');
  nave1Container.id = 'nave1';
  const nave2Container = document.createElement('div');
  nave2Container.id = 'nave2';

  // Títulos de Nave
  const h1 = document.createElement('h3'); h1.textContent = 'NAVE MADREMIA'; nave1Container.appendChild(h1);
  const h2 = document.createElement('h3'); h2.textContent = 'NAVE PLATÓN'; nave2Container.appendChild(h2);

  let di = 0;
  mapaRowCounts.forEach((count, rowIdx) => {
    const rowWrap = document.createElement('div');
    rowWrap.className = 'map-row';

    for(let i=0; i<count; i++){
      const d = depositData[di];
      const wrap = document.createElement('div');
      wrap.className = 'dep-wrap';
      
      const depEl = document.createElement('div');
      depEl.className = 'dep';
      depEl.setAttribute('data-dep', d.index);

      const fill = document.createElement('div');
      fill.className = 'fill';
      fill.style.background = wineColors[d.vino] || wineColors['Tinto'];
      fill.style.height = `${d.pct}%`;

      const center = document.createElement('div');
      center.className = 'center';
      const dnum = document.createElement('div');
      dnum.className = 'dnum';
      dnum.textContent = `D${d.index}`;
      center.appendChild(dnum);

      const caption = document.createElement('div');
      caption.className = 'dep-caption';
      caption.textContent = `${Math.round(d.actual).toLocaleString()} / ${d.cap.toLocaleString()} L`;

      const pctBadge = document.createElement('div');
      pctBadge.className = 'pct';
      pctBadge.textContent = `${Math.round(d.pct)}%`;

      depEl.appendChild(fill);
      depEl.appendChild(center);
      depEl.appendChild(pctBadge);

      depEl.addEventListener('click', () => {
        show('bodegaScreen');
        const targetRow = bBody.querySelector(`tr:nth-child(${d.index})`);
        if(targetRow){
          targetRow.scrollIntoView({behavior:'smooth', block:'center'});
          targetRow.classList.remove('bodega-highlight');
          void targetRow.offsetWidth;
          targetRow.classList.add('bodega-highlight');
        }
      });

      wrap.appendChild(depEl);
      wrap.appendChild(caption);
      rowWrap.appendChild(wrap);
      di++;
    }

    // Asignar fila según nave
    if(rowIdx < 2) nave1Container.appendChild(rowWrap); // filas 0 y 1 → Nave 1
    else nave2Container.appendChild(rowWrap);          // filas 2 y 3 → Nave 2
  });

  container.appendChild(nave1Container);
  container.appendChild(nave2Container);
}

// Llamar a la función después de construir la tabla
generateMapa();
// ==== FORZAR QUE SOLO SE USE LA NUEVA EXPORTACIÓN ====

// limpiar eventos anteriores
const btnJPG = document.getElementById("exportMapaPNG");
const btnPDF = document.getElementById("exportMapaPDF");

if(btnJPG){
  btnJPG.replaceWith(btnJPG.cloneNode(true));
}
if(btnPDF){
  btnPDF.replaceWith(btnPDF.cloneNode(true));
}

// volver a capturar los nuevos botones limpios
const btnJPGnew = document.getElementById("exportMapaPNG");
const btnPDFnew = document.getElementById("exportMapaPDF");


/***  NUEVAS FUNCIONES DE EXPORTACIÓN VISUAL  ***/
function exportMapaVisualJPG(){
  const target = document.getElementById("mapContainer");
  if(!target) return alert("No se encuentra el mapa");

  html2canvas(target, { backgroundColor:"#ffffff", scale:2 }).then(canvas=>{
    const jpg = canvas.toDataURL("image/jpeg", 0.95);
    const a = document.createElement("a");
    a.href = jpg;
    a.download = "mapa_depositos.jpg";
    a.click();
  });
}

function exportMapaVisualPDF(){
  const target = document.getElementById("mapContainer");
  if(!target) return alert("No se encuentra el mapa");

  html2canvas(target, { backgroundColor:"#ffffff", scale:2 }).then(canvas=>{
    const img = canvas.toDataURL("image/jpeg", 0.95);
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Mapa de Depósitos</title></head>
      <body style="text-align:center;font-family:Arial">
        <h2>Mapa de Depósitos</h2>
        <img src="${img}" style="width:100%;max-width:1200px"/>
      </body>
      </html>
    `);
    w.document.close();
    setTimeout(()=>w.print(), 400);
  });
}

// ASIGNAR EVENTOS NUEVOS
if(btnJPGnew) btnJPGnew.addEventListener("click", exportMapaVisualJPG);
if(btnPDFnew) btnPDFnew.addEventListener("click", exportMapaVisualPDF);


// =====================================================
// 🔐 BACKUP TOTAL APP BODEGA
// =====================================================

const BACKUP_VERSION = "BODEGA_PRO_V1";

// ---------- EXPORTAR ----------
if (el('exportBackup')) {
  el('exportBackup').addEventListener('click', () => {

    const backup = {
      version: BACKUP_VERSION,
      fecha: new Date().toISOString(),

      mixData: localStorage.getItem('mixData'),
      movData: localStorage.getItem('movData'),
      bodegaData: localStorage.getItem('bodegaData'),
      barrData: localStorage.getItem('barrData'),
      salaState: localStorage.getItem('salaState'),
      so2Data: localStorage.getItem('so2Data'),
      prodData: localStorage.getItem('prodData'),
      lacticData: localStorage.getItem('lacticData'),
      notes: localStorage.getItem('notes')
    };

    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bodega_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    alert('Copia de seguridad descargada');
  });
}

// ---------- IMPORTAR ----------
if (el('importBackup')) {
  el('importBackup').addEventListener('click', () => {
    el('backupFile').click();
  });
}

if (el('backupFile')) {
  el('backupFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = JSON.parse(evt.target.result);

        if (!data.version || data.version !== BACKUP_VERSION) {
          alert('Archivo de copia no compatible');
          return;
        }

        // Restaurar datos
        Object.keys(data).forEach(key => {
          if (key !== 'version' && key !== 'fecha' && data[key]) {
            localStorage.setItem(key, data[key]);
          }
        });

        alert('Copia restaurada. La app se recargará.');
        location.reload();

      } catch(err) {
        alert('Error al cargar la copia');
        console.error(err);
      }
    };

    reader.readAsText(file);
  });
}
/* ================================
   CRIANZA AUTOMÁTICA BARRICAS
   (VERSIÓN SIN BLOQUEOS)
================================ */

function mesesCrianza(fechaEntrada){
  if(!fechaEntrada) return 0;

  const hoy = new Date();
  const entrada = new Date(fechaEntrada);

  let meses = (hoy.getFullYear() - entrada.getFullYear()) * 12;
  meses += hoy.getMonth() - entrada.getMonth();

  const diasMesActual = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0).getDate();
  const diffDias = hoy.getDate() - entrada.getDate();
  const decimal = diffDias / diasMesActual;

  let totalMeses = meses + decimal;
  if(totalMeses < 0) totalMeses = 0;

  return Math.round(totalMeses * 10) / 10;
}


function actualizarCrianzaBarricas(){
  const filas = document.querySelectorAll("#barrTableBody tr");

  filas.forEach(fila=>{
    const fechaInput = fila.querySelector('input[type="date"]');
    if(!fechaInput) return;

    const fecha = fechaInput.value;
    const meses = mesesCrianza(fecha);

    let celda = fila.querySelector(".crianza-cell");

    if(!celda){
      celda = document.createElement("td");
      celda.className = "crianza-cell";
      const celdaFecha = fechaInput.closest("td");
celdaFecha.after(celda);

    }

    celda.textContent = meses ? meses + "" : "";

    // Limpiamos estados anteriores
celda.classList.remove("crianza-aviso", "crianza-peligro");

if (meses >= 20) {
  celda.classList.add("crianza-peligro");   // 🔴 MUY PASADA
} else if (meses >= 12) {
  celda.classList.add("crianza-aviso");     // 🟠 PASADA
}

  });
}


/* ---- ACTUALIZACIONES SEGURAS ---- */

// Cada vez que se añade una fila de barrica
document.getElementById("addBarrRow")?.addEventListener("click", ()=>{
  setTimeout(actualizarCrianzaBarricas, 50);
});

// Cuando cambias una fecha
document.addEventListener("change", e=>{
  if(e.target.type === "date" && e.target.closest("#barrTableBody")){
    actualizarCrianzaBarricas();
  }
});

// Cuando entras en la pantalla
document.getElementById("btnBarricas")?.addEventListener("click", ()=>{
  setTimeout(actualizarCrianzaBarricas, 120);
});

// CREA O SELECCIONA EL PANEL DE TOTALES
let panelTotales = document.getElementById('panel-totales-barricas');
if(!panelTotales){
  panelTotales = document.createElement('div');
  panelTotales.id = 'panel-totales-barricas';
  const salaMain = document.querySelector('.sala-main');
  if(salaMain) salaMain.appendChild(panelTotales);
}

// Totales individuales
let totalSalaActualEl = document.getElementById('total-sala-actual');
if(!totalSalaActualEl){
  totalSalaActualEl = document.createElement('div');
  totalSalaActualEl.id = 'total-sala-actual';
  panelTotales.appendChild(totalSalaActualEl);
}

let totalGlobalEl = document.getElementById('total-global');
if(!totalGlobalEl){
  totalGlobalEl = document.createElement('div');
  totalGlobalEl.id = 'total-global';
  panelTotales.appendChild(totalGlobalEl);
}

// Función que calcula totales
function updateTotalesBarricas(){
  let totalSalaActual = 0;
  const keyActual = `sala${currentSala}`;
  const stateActual = salaState[keyActual] || {};
  for(const idx in stateActual){
    totalSalaActual += stateActual[idx].count || 0;
  }
  totalSalaActualEl.textContent = `Total Sala ${currentSala}: ${totalSalaActual} Barricas`;

  // Total global sumando todas las salas
  let totalGlobal = 0;
  for(let i=1;i<=3;i++){
    const state = salaState[`sala${i}`] || {};
    for(const idx in state){
      totalGlobal += state[idx].count || 0;
    }
  }
  totalGlobalEl.textContent = `Total (3 Salas): ${totalGlobal} Barricas`;
}

// Actualiza automáticamente al renderizar sala
function renderSalaConTotales(){
  renderSala();
  updateTotalesBarricas();
}

// Sobrescribimos el cambio de sala para usar la función con totales
qsa('.sala-btn').forEach(b=>{
  b.addEventListener('click', (e)=>{
    currentSala = parseInt(e.target.dataset.sala);
    renderSalaConTotales();
  });
});

// También actualiza al modificar celdas
function actualizarTodo(){
  renderSalaConTotales();
}

// Llamadas a updateTotalesBarricas después de cambios
// Al hacer drop
const originalOnCellDrop = onCellDrop;
onCellDrop = function(e){
  originalOnCellDrop(e);
  updateTotalesBarricas();
};

// Al quitar o limpiar
if(el('clearCell')) el('clearCell').addEventListener('click', actualizarTodo);
if(el('removeOne')) el('removeOne').addEventListener('click', actualizarTodo);

// Inicializa al cargar
window.addEventListener('DOMContentLoaded', ()=>{
  updateTotalesBarricas();
});

/*** EXPORTAR SALA DE BARRICAS A PDF ***/
function exportSalaCompletaPDF(){
    // Crear un div temporal que contenga el SVG de la sala (igual que en JPG)
    const key = `sala${currentSala}`;
    const state = salaState[key] || {};

    let totalSala = 0;
    Object.values(state).forEach(c => totalSala += c.count || 0);

    let totalGlobal = 0;
    Object.values(salaState).forEach(s => {
        Object.values(s).forEach(c => totalGlobal += c.count || 0);
    });

    // Medidas
    const cellW = 48, cellH = 48, cols = SALA_COLS, rows = SALA_ROWS;
    const gridW = cols*(cellW+6)+20;
    const gridH = rows*(cellH+6)+40;
    const lateralW = 220;
    const width = gridW + lateralW + 40;
    const height = gridH + 180;

    // Crear el SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
    svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;
    svg += `<text x="${width/2}" y="40" font-size="28" text-anchor="middle" font-weight="bold">SALA ${currentSala}</text>`;

   for(let r=0; r<rows; r++){
    for(let c=0; c<cols; c++){

        const idx = r * cols + c;
        const x = 20 + c * (cellW + 6);
        const y = 70 + r * (cellH + 6);

        const st = state[idx];

        if(!st){
            svg += `
                <rect
                    x="${x}"
                    y="${y}"
                    width="${cellW}"
                    height="${cellH}"
                    rx="6"
                    fill="#f7f7f8"
                    stroke="#ddd"
                />
            `;
            continue;
        }

        const fill = colorMap[st.colorName] || '#ddd';

        const esDivina =
            st.colorName === 'DIVINA-1' ||
            st.colorName === 'DIVINA-2';

        if(esDivina){

            svg += `
                <circle
                    cx="${x + cellW/2}"
                    cy="${y + cellH/2}"
                    r="${cellW/2}"
                    fill="${fill}"
                    stroke="#ddd"
                />
            `;

        }else{

            svg += `
                <rect
                    x="${x}"
                    y="${y}"
                    width="${cellW}"
                    height="${cellH}"
                    rx="6"
                    fill="${fill}"
                    stroke="#ddd"
                />
            `;

        }

        svg += `
            <text
                x="${x + cellW/2}"
                y="${y + cellH/2}"
                font-size="12"
                text-anchor="middle"
                alignment-baseline="middle"
                fill="#fff"
            >
                ${st.count}
            </text>
        `;
    }
}

    let yL = 80;
    svg += `<text x="${gridW+30}" y="70" font-size="18" font-weight="bold">Barricas</text>`;
   paletteItems.forEach(p=>{

    const esDivina =
        p.name === 'DIVINA-1' ||
        p.name === 'DIVINA-2';

    if(esDivina){

        svg += `
            <circle
                cx="${gridW + 40}"
                cy="${yL + 10}"
                r="10"
                fill="${colorMap[p.name] || '#999'}"
            />
        `;

    }else{

        svg += `
            <rect
                x="${gridW + 30}"
                y="${yL}"
                width="20"
                height="20"
                rx="4"
                fill="${colorMap[p.name] || '#999'}"
            />
        `;

    }

    svg += `<text x="${gridW+60}" y="${yL+15}" font-size="14">${p.label}</text>`;

    yL += 28;
});

    svg += `<rect x="0" y="${gridH+90}" width="${width}" height="70" fill="#e9ecef"/>`;
    svg += `<text x="${width/2}" y="${gridH+120}" font-size="20" text-anchor="middle" font-weight="bold">Total Sala ${currentSala}: ${totalSala} barricas</text>`;
    svg += `<text x="${width/2}" y="${gridH+145}" font-size="18" text-anchor="middle">Total Bodega (3 salas): ${totalGlobal} barricas</text>`;
    svg += `</svg>`;

    // Insertarlo en un div temporal para html2canvas
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.innerHTML = svg;
    document.body.appendChild(tempDiv);

    html2canvas(tempDiv, { backgroundColor:"#ffffff", scale:2 }).then(canvas=>{
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('landscape');
        pdf.addImage(imgData, 'JPEG', 10, 10, 270, 160);
        pdf.save(`Sala_${currentSala}.pdf`);
        document.body.removeChild(tempDiv);
    }).catch(e=>{
        alert("Error al generar PDF: " + e.message);
        document.body.removeChild(tempDiv);
    });
}

// ASIGNAR EVENTO AL BOTÓN PDF DE SALA
if(el('exportSalaPDF')) el('exportSalaPDF').addEventListener('click', exportSalaCompletaPDF);

// ============================================================
// FIREBASE - SINCRONIZACIÓN BODEGA
// PARTE 1 - SINCRONIZACIÓN GENERAL
// ============================================================

(function iniciarSincronizacionBodega() {

  console.log("🔄 Preparando sincronización Firebase BODEGA...");

  // ----------------------------------------------------------
  // CLAVES QUE YA UTILIZA LA APLICACIÓN
  // ----------------------------------------------------------

  const BODEGA_KEYS_FIREBASE = [
    "mixData",
    "movData",
    "bodegaData",
    "barrData",
    "salaState",
    "so2Data",
    "prodData",
    "lacticData",
    "notes"
  ];


  // ----------------------------------------------------------
  // OBTENER TODOS LOS DATOS ACTUALES DE LOCALSTORAGE
  // ----------------------------------------------------------

  function obtenerDatosBodega() {

    const datos = {};

    BODEGA_KEYS_FIREBASE.forEach(key => {

      const valor = localStorage.getItem(key);

      if (valor !== null) {
        datos[key] = valor;
      }

    });

    return datos;
  }


  // ----------------------------------------------------------
  // GUARDAR LOS DATOS EN FIREBASE
  // ----------------------------------------------------------

  async function sincronizarBodegaFirebase() {

    if (!window.firebaseDB) {
      console.warn("⚠️ Firebase todavía no está disponible.");
      return;
    }

    try {

      const datos = obtenerDatosBodega();

      datos.fechaSincronizacion = new Date().toISOString();

      const ok = await guardarEnFirebase(
        "bodega/datos",
        datos
      );

      if (ok) {
        console.log("☁️ BODEGA sincronizada con Firebase");
      }

    } catch (error) {

      console.error(
        "❌ Error sincronizando BODEGA:",
        error
      );

    }
  }


  // ----------------------------------------------------------
  // HACER LA FUNCIÓN DISPONIBLE PARA EL RESTO DEL PROGRAMA
  // ----------------------------------------------------------

  window.sincronizarBodegaFirebase =
    sincronizarBodegaFirebase;


  console.log(
    "✅ Sistema de sincronización BODEGA preparado."
  );

})();

// ============================================================
// FIREBASE - SINCRONIZACIÓN BODEGA
// PARTE 2 - DETECTAR CAMBIOS EN LOCALSTORAGE
// ============================================================

(function activarVigilanciaBodegaFirebase() {

  console.log("👀 Activando vigilancia de cambios de BODEGA...");

  const KEYS_VIGILADAS = [
    "mixData",
    "movData",
    "bodegaData",
    "barrData",
    "salaState",
    "so2Data",
    "prodData",
    "lacticData",
    "notes"
  ];

  let estadoAnterior = {};

  function obtenerEstadoActual() {

    const estado = {};

    KEYS_VIGILADAS.forEach(key => {
      estado[key] = localStorage.getItem(key);
    });

    return estado;
  }

  function hayCambios(estadoActual) {

    return KEYS_VIGILADAS.some(key => {

      return estadoActual[key] !== estadoAnterior[key];

    });

  }

  async function comprobarCambiosBodega() {

    const estadoActual = obtenerEstadoActual();

    // Primera comprobación:
    // solamente guardamos el estado actual.
    if (Object.keys(estadoAnterior).length === 0) {

      estadoAnterior = estadoActual;

      console.log(
        "📋 Estado inicial de BODEGA registrado."
      );

      return;
    }

    // Comprobamos si algún dato ha cambiado
    if (hayCambios(estadoActual)) {

      console.log(
        "🔄 Cambio detectado en los datos de BODEGA."
      );

      estadoAnterior = estadoActual;

      if (typeof window.sincronizarBodegaFirebase === "function") {

        await window.sincronizarBodegaFirebase();

      }

    }

  }

  // Comprobamos cada 2 segundos
  setInterval(comprobarCambiosBodega, 2000);

  console.log(
    "✅ Vigilancia automática de BODEGA activada."
  );

})();

// ============================================================
// FIREBASE - SINCRONIZACIÓN BODEGA
// PARTE 3 - COMPROBAR LECTURA DE FIREBASE
// ============================================================

async function comprobarDatosBodegaFirebase() {

  console.log("🔎 Comprobando datos de BODEGA en Firebase...");

  if (typeof leerDeFirebase !== "function") {
    console.error("❌ La función leerDeFirebase no está disponible.");
    return;
  }

  const datos = await leerDeFirebase("bodega/datos");

  if (!datos) {
    console.warn("⚠️ No hay datos de BODEGA guardados todavía en Firebase.");
    return;
  }

  console.log("======================================");
  console.log("☁️ DATOS DE BODEGA EN FIREBASE");
  console.log("======================================");

  console.log("Mezclas:", datos.mixData);
  console.log("Movimientos:", datos.movData);
  console.log("Depósitos:", datos.bodegaData);
  console.log("Barricas:", datos.barrData);
  console.log("Sala barricas:", datos.salaState);
  console.log("SO₂:", datos.so2Data);
  console.log("Productos:", datos.prodData);
  console.log("Ácido láctico:", datos.lacticData);
  console.log("Notas:", datos.notes);
  console.log("Fecha sincronización:", datos.fechaSincronizacion);

  console.log("======================================");
  console.log("✅ Lectura de Firebase completada.");
  console.log("======================================");
}

window.comprobarDatosBodegaFirebase =
  comprobarDatosBodegaFirebase;

// ============================================================
// FIREBASE - SINCRONIZACIÓN BODEGA
// PARTE 4 - PRIMERA SINCRONIZACIÓN SEGURA
// ============================================================

async function primeraSincronizacionBodega() {

  console.log("🚀 Iniciando primera sincronización de BODEGA...");

  if (!window.firebaseDB) {
    console.error("❌ Firebase no está disponible.");
    return;
  }

  try {

    // Comprobamos si ya existen datos en Firebase
    const datosFirebase =
      await leerDeFirebase("bodega/datos");

    // --------------------------------------------------------
    // CASO 1: FIREBASE YA TIENE DATOS
    // --------------------------------------------------------

    if (datosFirebase) {

      console.warn(
        "⚠️ Firebase ya contiene datos de BODEGA."
      );

      console.warn(
        "⛔ No se ha sobrescrito ningún dato."
      );

      console.log(
        "Puedes comprobarlos con: comprobarDatosBodegaFirebase()"
      );

      return;
    }

    // --------------------------------------------------------
    // CASO 2: FIREBASE ESTÁ VACÍO
    // --------------------------------------------------------

    console.log(
      "☁️ Firebase está vacío. Subiendo datos actuales..."
    );

    if (
      typeof window.sincronizarBodegaFirebase !== "function"
    ) {

      console.error(
        "❌ No está disponible sincronizarBodegaFirebase()."
      );

      return;
    }

    await window.sincronizarBodegaFirebase();

    console.log(
      "======================================"
    );

    console.log(
      "✅ PRIMERA SINCRONIZACIÓN COMPLETADA"
    );

    console.log(
      "======================================"
    );

  } catch (error) {

    console.error(
      "❌ Error en la primera sincronización:",
      error
    );

  }

}

window.primeraSincronizacionBodega =
  primeraSincronizacionBodega;