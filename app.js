(function(){
  function load(key){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; } }
  function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  const KEY_PRODUCTS = 'gv_products_v1';
  const KEY_SALES = 'gv_sales_v1';
  const pages = { home: document.getElementById('page-home'), manage: document.getElementById('page-manage'), sell: document.getElementById('page-sell'), history: document.getElementById('page-history') };
  const stats = { products: document.getElementById('stat-products'), stock: document.getElementById('stat-stock'), value: document.getElementById('stat-value') };
  const prodListEl = document.getElementById('products-list');
  const sellSelect = document.getElementById('sell-product');
  const salesListEl = document.getElementById('sales-list');
  const imageInput = document.getElementById('p-image');
  const imageName = document.getElementById('p-image-name');
  window.nav = function(page){
    Object.values(pages).forEach(p=>p.classList.remove('active'));
    pages[page].classList.add('active');
    if(page==='home') refreshStats();
    if(page==='manage') renderProducts();
    if(page==='sell') renderSell();
    if(page==='history') renderSales();
    window.scrollTo(0,0);
  };
  let products = load(KEY_PRODUCTS);
  let sales = load(KEY_SALES);
  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
  imageInput.addEventListener('change', function(){ if(this.files && this.files[0]){ imageName.textContent = this.files[0].name; } else { imageName.textContent = 'Aucun fichier choisi'; } });
  window.saveProduct = function(){
    const name = document.getElementById('p-name').value.trim();
    const desc = document.getElementById('p-desc').value.trim();
    const buy = document.getElementById('p-buy').value;
    const sale = document.getElementById('p-sale').value;
    const qty = document.getElementById('p-qty').value;
    if(!name || !sale) { alert('Nom et Prix de vente requis'); return; }
    const file = imageInput.files && imageInput.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = function(e){
        const imgData = e.target.result;
        _saveProductToStorage({ id: uid(), name, description: desc, priceBuy: buy?parseFloat(buy):null, priceSale: parseFloat(sale), quantity: parseInt(qty||0), image: imgData });
      };
      reader.readAsDataURL(file);
    } else {
      _saveProductToStorage({ id: uid(), name, description: desc, priceBuy: buy?parseFloat(buy):null, priceSale: parseFloat(sale), quantity: parseInt(qty||0), image: null });
    }
  };
  function _saveProductToStorage(prod){
    products.unshift(prod);
    save(KEY_PRODUCTS, products);
    document.getElementById('form-product').reset();
    imageName.textContent = 'Aucun fichier choisi';
    alert('Produit enregistré');
    renderProducts();
    refreshStats();
  }
  function renderProducts(){
    products = load(KEY_PRODUCTS);
    if(products.length===0){ prodListEl.innerHTML = '<div>Aucun produit enregistré</div>'; return; }
    prodListEl.innerHTML = '';
    products.forEach(p=>{
      const div = document.createElement('div');
      div.className = 'product-item';
      const img = document.createElement('img');
      if(p.image) img.src = p.image; else { img.src = 'assets/icon.png'; }
      const body = document.createElement('div');
      body.innerHTML = `<strong>${p.name}</strong><div>Prix: ${Math.round(p.priceSale)} FCFA</div><div>Qté: ${p.quantity}</div>`;
      const btn = document.createElement('button');
      btn.textContent = 'Edit';
      btn.onclick = ()=> editProduct(p.id);
      div.appendChild(img); div.appendChild(body); div.appendChild(btn);
      prodListEl.appendChild(div);
    });
  }
  window.deleteAllProducts = function(){ if(!confirm('Supprimer tous les produits ?')) return; products = []; save(KEY_PRODUCTS, products); sales = []; save(KEY_SALES, sales); renderProducts(); renderSales(); refreshStats(); alert('Tous les produits supprimés'); };
  function editProduct(id){ const p = products.find(x=>x.id===id); if(!p) return; document.getElementById('p-name').value = p.name; document.getElementById('p-desc').value = p.description||''; document.getElementById('p-buy').value = p.priceBuy||''; document.getElementById('p-sale').value = p.priceSale; document.getElementById('p-qty').value = p.quantity; window.scrollTo(0,0); }
  function renderSell(){ products = load(KEY_PRODUCTS); sellSelect.innerHTML = '<option value="">Aucun produit</option>'; products.forEach(p=>{ const opt = document.createElement('option'); opt.value = p.id; opt.textContent = `${p.name} (Qté: ${p.quantity})`; sellSelect.appendChild(opt); }); }
  window.saveSale = function(){ const pid = sellSelect.value; const qty = parseInt(document.getElementById('sell-qty').value||'0'); const city = document.getElementById('sell-city').value.trim(); const cname = document.getElementById('sell-name').value.trim(); const phone = document.getElementById('sell-phone').value.trim(); if(!pid){ alert('Sélectionnez un produit'); return; } if(qty<=0){ alert('Quantité invalide'); return; } const p = products.find(x=>x.id===pid); if(!p){ alert('Produit introuvable'); return; } if(qty>p.quantity){ alert('Stock insuffisant'); return; } p.quantity = p.quantity - qty; save(KEY_PRODUCTS, products); const s = { id: uid(), productId: p.id, productName: p.name, quantity: qty, unitPrice: p.priceSale, clientName: cname||null, clientPhone: phone||null, clientCity: city||null, createdAt: new Date().toISOString() }; sales.unshift(s); save(KEY_SALES, sales); alert('Vente enregistrée'); refreshStats(); renderSell(); renderSales(); generateInvoicePdf(s); document.getElementById('sell-qty').value=''; document.getElementById('sell-city').value=''; document.getElementById('sell-name').value=''; document.getElementById('sell-phone').value=''; };
  function renderSales(){ sales = load(KEY_SALES); if(sales.length===0){ salesListEl.innerHTML = '<div>Aucune vente enregistrée</div>'; return; } salesListEl.innerHTML = ''; sales.forEach(s=>{ const d = document.createElement('div'); d.className = 'product-item'; d.innerHTML = `<div style="flex:1"><strong>${s.productName}</strong><div>${s.quantity} x ${Math.round(s.unitPrice)} FCFA = ${Math.round(s.quantity*s.unitPrice)} FCFA</div><div>${s.clientName||'-'} • ${s.clientPhone||'-'} • ${s.clientCity||'-'}</div><div style="font-size:12px;color:#666">${new Date(s.createdAt).toLocaleString()}</div></div>`; salesListEl.appendChild(d); }); }
  window.deleteAllSales = function(){ if(!confirm('Supprimer tout l\'historique ?')) return; sales = []; save(KEY_SALES, sales); renderSales(); alert('Historique effacé'); };
  function refreshStats(){ products = load(KEY_PRODUCTS); sales = load(KEY_SALES); const totalQty = products.reduce((t,p)=>t+(p.quantity||0),0); const value = products.reduce((t,p)=>t+((p.priceSale||0)*(p.quantity||0)),0); stats.products.textContent = products.length; stats.stock.textContent = totalQty; stats.value.textContent = Math.round(value) + ' FCFA'; }
  function generateInvoicePdf(s){ try{ if(window.jspdf && window.jspdf.jsPDF){ const { jsPDF } = window.jspdf; const doc = new jsPDF(); doc.setFontSize(18); doc.text('FACTURE',14,20); doc.setFontSize(12); doc.text('GESTION DE VENTE - TATA CAMM SOLAIRE',14,30); doc.text('Produit: ' + s.productName,14,42); doc.text('Quantité: ' + s.quantity,14,50); doc.text('Prix unitaire: ' + Math.round(s.unitPrice) + ' FCFA',14,58); doc.text('Total: ' + Math.round(s.unitPrice*s.quantity) + ' FCFA',14,66); if(s.clientName) doc.text('Client: ' + s.clientName,14,78); doc.text('Date: ' + new Date(s.createdAt).toLocaleString(),14,90); doc.save('facture_' + s.id + '.pdf'); } else { alert('PDF non disponible (jsPDF manquant).'); } }catch(e){ console.error(e); alert('Erreur création PDF'); } }
  window.exportSalesPdf = function(){ try{ if(window.jspdf && window.jspdf.jsPDF){ const { jsPDF } = window.jspdf; const doc = new jsPDF(); doc.setFontSize(18); doc.text('Historique des ventes',14,20); let y = 34; sales.forEach(s=>{ doc.setFontSize(12); doc.text(`${s.productName} — ${s.quantity} x ${Math.round(s.unitPrice)} FCFA = ${Math.round(s.quantity*s.unitPrice)} FCFA`,14,y); y+=8; doc.text(`Client: ${s.clientName||'-'} • Tel: ${s.clientPhone||'-'} • Ville: ${s.clientCity||'-'}`,14,y); y+=8; doc.text(`Date: ${new Date(s.createdAt).toLocaleString()}`,14,y); y+=12; if(y>270){ doc.addPage(); y=20; } }); doc.save('historique_ventes.pdf'); } else { alert('PDF non disponible (jsPDF manquant).'); } }catch(e){ console.error(e); alert('Erreur export PDF'); } };
  refreshStats(); renderProducts(); renderSell(); renderSales();
  window.nav = window.nav || (p=>{});
})();
