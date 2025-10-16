// App logic: products and sales stored in localStorage
const STORE_PRODUCTS = 'gv_products_v1'
const STORE_SALES = 'gv_sales_v1'

function $(id){return document.getElementById(id)}

function saveProducts(list){localStorage.setItem(STORE_PRODUCTS, JSON.stringify(list))}
function loadProducts(){return JSON.parse(localStorage.getItem(STORE_PRODUCTS) || '[]')}
function saveSales(list){localStorage.setItem(STORE_SALES, JSON.stringify(list))}
function loadSales(){return JSON.parse(localStorage.getItem(STORE_SALES) || '[]')}

function updateStats(){
  const products = loadProducts()
  const count = products.length
  let stockTotal = 0, value = 0
  products.forEach(p=>{stockTotal += Number(p.qty||0); value += Number(p.price||0)*Number(p.qty||0)})
  $('stat-count').innerText = count
  $('stat-stock').innerText = stockTotal
  $('stat-value').innerText = value.toFixed(0)
  populateProductList()
  populateSaleSelect()
}

function populateProductList(){
  const list = loadProducts()
  const cont = $('product-list')
  if(!list.length){cont.innerText = 'Aucun produit enregistré'; return}
  cont.innerHTML = ''
  list.forEach(p=>{
    const row = document.createElement('div'); row.className='product-row'
    const img = document.createElement('img'); img.src = p.img || 'data:image/png;base64,iVBORw0KGgo='
    const meta = document.createElement('div'); meta.className='product-meta'
    meta.innerHTML = `<strong>${p.name}</strong><div>${p.desc||''}</div><div>Prix vente: ${p.price} FCFA | Qté: ${p.qty}</div>`
    const actions = document.createElement('div'); actions.className='product-actions'
    const btnEdit = document.createElement('button'); btnEdit.innerText='Modifier'; btnEdit.className='secondary'
    btnEdit.onclick = ()=>{ startEditProduct(p.id) }
    const btnRemove = document.createElement('button'); btnRemove.innerText='Supprimer'; btnRemove.className='danger'
    btnRemove.onclick = ()=>{ deleteProduct(p.id) }
    actions.appendChild(btnEdit); actions.appendChild(btnRemove)
    row.appendChild(img); row.appendChild(meta); row.appendChild(actions)
    cont.appendChild(row)
  })
}

function populateSaleSelect(){
  const sel = $('sale-product'); sel.innerHTML=''
  const products = loadProducts()
  if(!products.length){ const opt=document.createElement('option'); opt.text='Aucun produit'; opt.value=''; sel.appendChild(opt); return}
  products.forEach(p=>{ const opt=document.createElement('option'); opt.value=p.id; opt.text=`${p.name} - ${p.price} FCFA (qt:${p.qty})`; sel.appendChild(opt) })
}

function startEditProduct(id){
  const products = loadProducts(); const p = products.find(x=>x.id===id); if(!p) return
  $('edit-id').value = p.id
  $('p-name').value = p.name; $('p-desc').value = p.desc; $('p-cost').value = p.cost; $('p-price').value = p.price; $('p-qty').value = p.qty
  // no need to set image file input
  showPage('manage')
}

function deleteProduct(id){
  if(!confirm('Supprimer ce produit ?')) return
  let products = loadProducts(); products = products.filter(p=>p.id!==id); saveProducts(products); updateStats()
}

function clearAllProducts(){
  if(!confirm('Supprimer tous les produits ?')) return
  saveProducts([]); updateStats()
}

function recordSale(){
  const pid = $('sale-product').value
  if(!pid){ alert('Aucun produit sélectionné'); return }
  const qty = Number($('sale-qty').value||0); if(qty<=0){ alert('Quantité invalide'); return }
  const products = loadProducts(); const p = products.find(x=>x.id===pid); if(!p){ alert('Produit introuvable'); return }
  if(qty>Number(p.qty)){ if(!confirm('Quantité vendue supérieure au stock. Continuer ?')) return }
  // decrement stock
  p.qty = Number(p.qty)-qty; saveProducts(products)
  const sales = loadSales()
  const sale = { id: 's'+Date.now(), productId: p.id, productName: p.name, qty: qty, price: p.price, city: $('sale-city').value, client: $('sale-name').value, phone: $('sale-phone').value, date: new Date().toISOString() }
  sales.unshift(sale); saveSales(sales)
  updateStats(); alert('Vente enregistrée !') 
  generateReceiptPDF(sale)
  showPage('dashboard')
}

function generateReceiptPDF(sale){
  try{
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()
    doc.setFontSize(14); doc.text('FACTURE', 20, 20)
    doc.setFontSize(11);
    doc.text(`Produit: ${sale.productName}`,20,34)
    doc.text(`Quantité: ${sale.qty}`,20,42)
    doc.text(`Prix unitaire: ${sale.price} FCFA`,20,50)
    doc.text(`Total: ${sale.price*sale.qty} FCFA`,20,58)
    doc.text(`Client: ${sale.client||'-'}`,20,66)
    doc.text(`Ville: ${sale.city||'-'}`,20,74)
    doc.text(`Téléphone: ${sale.phone||'-'}`,20,82)
    doc.text(`Date: ${new Date(sale.date).toLocaleString()}`,20,90)
    doc.save(`facture_${sale.id}.pdf`)
  }catch(e){ console.error(e) }
}

function renderSalesList(){
  const sales = loadSales(); const cont = $('sales-list'); if(!sales.length){ cont.innerText='Aucune vente enregistrée'; return }
  cont.innerHTML = ''
  sales.forEach(s=>{
    const row = document.createElement('div'); row.className='product-row'
    const meta = document.createElement('div'); meta.className='product-meta'
    meta.innerHTML = `<strong>${s.productName}</strong><div>Qté: ${s.qty} | Total: ${s.price*s.qty} FCFA</div><div>Client: ${s.client||'-'} - ${s.phone||'-'} - ${s.city||'-'}</div><div>${new Date(s.date).toLocaleString()}</div>`
    row.appendChild(meta); cont.appendChild(row)
  })
}

function clearAllSales(){
  if(!confirm('Effacer toutes les ventes ?')) return
  saveSales([]); renderSalesList(); updateStats()
}

function exportSalesToPDF(){
  const sales = loadSales()
  if(!sales.length){ alert('Aucune vente à exporter'); return }
  try{
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()
    doc.setFontSize(14); doc.text('Historique des ventes',20,20)
    doc.setFontSize(10)
    let y = 30
    sales.forEach((s, idx)=>{
      doc.text(`${idx+1}. ${s.productName} - Qté:${s.qty} - Total:${s.price*s.qty} FCFA - ${new Date(s.date).toLocaleString()}`, 20, y)
      y+=8; if(y>270){ doc.addPage(); y=20 }
    })
    doc.save('historique_ventes.pdf')
  }catch(e){ console.error(e) }
}

/* UI wiring */
document.addEventListener('DOMContentLoaded',()=>{
  // nav buttons
  $('nav-dashboard').onclick = ()=>showPage('manage')
  $('nav-sale').onclick = ()=>showPage('sale')
  $('nav-history').onclick = ()=>showPage('history')
  $('btn-go-manage').onclick = ()=>showPage('manage')
  $('btn-go-sale').onclick = ()=>showPage('sale')
  $('btn-go-history').onclick = ()=>showPage('history')
  $('btn-back-dashboard').onclick = ()=>showPage('dashboard')
  $('btn-sale-back').onclick = ()=>showPage('dashboard')
  $('btn-history-back').onclick = ()=>showPage('dashboard')
  $('btn-delete-all').onclick = clearAllProducts
  $('btn-record-sale').onclick = recordSale
  $('btn-clear-sales').onclick = clearAllSales
  $('btn-export-pdf').onclick = exportSalesToPDF

  // form submit save product
  $('product-form').onsubmit = async function(e){ e.preventDefault()
    const id = $('edit-id').value || ('p'+Date.now())
    const name = $('p-name').value.trim(); const desc = $('p-desc').value.trim()
    const cost = Number($('p-cost').value||0); const price = Number($('p-price').value||0); const qty = Number($('p-qty').value||0)
    let imgData = null
    const f = $('p-img').files[0]
    if(f){ imgData = await readFileAsDataURL(f) }
    const products = loadProducts()
    const existingIndex = products.findIndex(p=>p.id===id)
    const prod = { id, name, desc, cost, price, qty, img: imgData || (products.find(p=>p.id===id)?.img || null) }
    if(existingIndex>=0){ products[existingIndex] = prod } else { products.push(prod) }
    saveProducts(products)
    // reset form
    $('product-form').reset(); $('edit-id').value=''
    updateStats(); alert('Produit enregistré')
    showPage('dashboard')
  }

  updateStats(); renderSalesList()
})

function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file) }) }

function showPage(which){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'))
  if(which==='dashboard') { $('page-dashboard').classList.add('active'); $('nav-dashboard').classList.add('active') }
  else if(which==='manage') { $('page-manage').classList.add('active'); $('nav-dashboard').classList.add('active') }
  else if(which==='sale') { $('page-sale').classList.add('active'); $('nav-sale').classList.add('active') }
  else if(which==='history') { $('page-history').classList.add('active'); $('nav-history').classList.add('active') }
  updateStats(); renderSalesList()
}
