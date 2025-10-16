/* GESTION DE VENTE - app.js
   - Enregistrement fonctionnel des produits dans localStorage
   - Supprimer tous les produits
   - Exporter en PDF
   - Images converties en base64 (réduit taille) */

const LS_KEY = 'gestion_de_vente_products_v1';

// load products
function loadProducts(){
  try{
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  }catch(e){ return []; }
}
function saveProducts(list){
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// resize image file to base64 dataURL (max width 800)
function fileToDataUrl(file, maxW=800, quality=0.8){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = function(ev){
      const img = new Image();
      img.onload = function(){
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = ()=> resolve(null);
      img.src = ev.target.result;
    };
    reader.onerror = ()=> reject();
    reader.readAsDataURL(file);
  });
}

// render product list
function renderList(){
  const list = loadProducts();
  const container = document.getElementById('productList');
  if(!container) return;
  container.innerHTML = '';
  if(list.length === 0){
    container.innerHTML = '<div>Aucun produit enregistré</div>';
    return;
  }
  list.forEach((p, idx)=>{
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img class="thumb" src="${p.image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NgYGD4DwABBAEAj2bKXwAAAABJRU5ErkJggg=='}" alt="${p.name}">
      <div class="info">
        <h4>${p.name}</h4>
        <p>Prix: ${Number(p.price).toLocaleString()} FCFA</p>
      </div>
    `;
    container.appendChild(div);
  });
}

// add product handler
async function addProductHandler(){
  const nameEl = document.getElementById('nomProduit');
  const priceEl = document.getElementById('prixProduit');
  const fileEl = document.getElementById('imageProduitFile');

  const name = nameEl.value.trim();
  const price = Number(priceEl.value) || 0;

  if(!name || price<=0){
    alert('Veuillez entrer le nom et le prix du produit (prix > 0).');
    return;
  }

  let imageData = null;
  if(fileEl.files && fileEl.files[0]){
    try{
      imageData = await fileToDataUrl(fileEl.files[0], 800, 0.8);
    }catch(e){
      imageData = null;
    }
  }

  const list = loadProducts();
  const prod = { id: 'p_'+Date.now(), name, price, image: imageData };
  list.push(prod);
  saveProducts(list);

  // reset form
  nameEl.value = '';
  priceEl.value = '';
  fileEl.value = '';

  renderList();
  alert('✅ Produit enregistré');
}

// delete all
function deleteAllHandler(){
  if(confirm('⚠️ Supprimer tous les produits ?')){
    localStorage.removeItem(LS_KEY);
    renderList();
    alert('🗑️ Tous les produits ont été supprimés');
  }
}

// export to PDF (opens print window)
function exportPdfHandler(){
  const list = loadProducts();
  if(!list.length){ alert('Aucun produit à exporter'); return; }
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write('<html><head><title>Liste produits</title>');
  w.document.write('<style>body{font-family:Arial;padding:20px}h1{color:#ff6600;text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}img{width:60px;height:60px;object-fit:cover}</style>');
  w.document.write('</head><body>');
  w.document.write('<h1>GESTION DE VENTE - Liste des produits</h1>');
  w.document.write('<table><tr><th>Image</th><th>Nom</th><th>Prix (FCFA)</th></tr>');
  list.forEach(p=>{
    w.document.write(`<tr><td><img src="${p.image || ''}" /></td><td>${p.name}</td><td>${Number(p.price).toLocaleString()}</td></tr>`);
  });
  w.document.write('</table></body></html>');
  w.document.close();
  w.print();
}

// init
document.addEventListener('DOMContentLoaded', ()=>{
  // bind buttons
  const saveBtn = document.getElementById('saveBtn');
  if(saveBtn) saveBtn.addEventListener('click', addProductHandler);
  const delBtn = document.getElementById('deleteAllBtn');
  if(delBtn) delBtn.addEventListener('click', deleteAllHandler);
  const expBtn = document.getElementById('exportPdfBtn');
  if(expBtn) expBtn.addEventListener('click', exportPdfHandler);

  renderList();

  // register service worker if available
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(()=>console.log('sw failed'));
  }
});
