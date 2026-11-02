let lifts = JSON.parse(localStorage.getItem('teo_ride') || '[]');
let activeTab = 'all';
let filter = {from:'', to:'', date:''};
let tempCarImage = '';

if(lifts.length===0){
  lifts = [
    {id:1, type:'driver', from:'Port Elizabeth', to:'Kokstad', date:'2026-11-06', time:'09:00', seats:3, price:350, name:'Liya', whatsapp:'0781234567', carMake:'Toyota', carModel:'Corolla', carColor:'White', plate:'ND 123-456', carImage:'images/car.png'},
    {id:2, type:'passenger', from:'Cape Town', to:'Durban', date:'2026-12-13', time:'16:00', seats:2, name:'Thando', whatsapp:'0781234567'},
  ];
  localStorage.setItem('teo_ride', JSON.stringify(lifts));
}

document.getElementById('pCarPic')?.addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    tempCarImage = ev.target.result;
    const prev = document.getElementById('preview');
    prev.src = tempCarImage;
    prev.classList.remove('hidden');
  }
  reader.readAsDataURL(file);
});

function toggleDriverFields(){
  const type = document.getElementById('pType').value;
  document.getElementById('driverFields').style.display = type==='driver' ? 'block' : 'none';
}

function render(){
  const c = document.getElementById('lifts');
  let list = [...lifts];
  if(activeTab!=='all') list = list.filter(l=>l.type===activeTab);
  if(filter.from) list = list.filter(l=>l.from.toLowerCase().includes(filter.from.toLowerCase()));
  if(filter.to) list = list.filter(l=>l.to.toLowerCase().includes(filter.to.toLowerCase()));
  if(filter.date) list = list.filter(l=>l.date===filter.date);
  if(list.length===0){ c.innerHTML=`<p style="grid-column:1/-1;text-align:center;opacity:.6;padding:30px">No rides yet. Be first to post on Teo Rides!</p>`; return; }
  c.innerHTML = list.map(l=>`
    <div class="card ${l.type}">
      <div class="route">${l.from} <span>→</span> ${l.to}</div>
      <div class="meta">📅 ${l.date} ${l.time? 'at '+l.time:''}<br>${l.type==='driver'?`💺 Seats: ${l.seats}`:`🧍 Needed: ${l.seats}`}<br>👤 ${l.name}${l.type==='driver'?`<br>🚗 ${l.carMake} ${l.carModel} (${l.carColor})<br><span class="plate">${l.plate}</span>`:''}</div>
      ${l.carImage?`<img class="car" src="${l.carImage}">`:''}
      ${l.type==='driver'?`<div class="price">R${l.price} / seat</div>`:''}
      <a class="wa" target="_blank" href="https://wa.me/${formatWA(l.whatsapp)}?text=Hi ${l.name}, ride ${l.from} to ${l.to} on ${l.date} - Teo Rides">WhatsApp ${l.name}</a>
      <button class="del" onclick="deleteLift(${l.id})">Delete</button>
    </div>
  `).join('');
}
function formatWA(n){ let x=n.replace(/\D/g,''); if(x.startsWith('0')) x='27'+x.slice(1); return x; }
function setTab(t){ activeTab=t; document.querySelectorAll('.tab').forEach(b=>{ if(b.dataset.tab) b.classList.toggle('active', b.dataset.tab===t) }); render(); }
function applyFilter(){ filter.from=document.getElementById('fFrom').value; filter.to=document.getElementById('fTo').value; filter.date=document.getElementById('fDate').value; render(); }
function clearFilter(){ fFrom.value=''; fTo.value=''; fDate.value=''; filter={from:'',to:'',date:''}; render(); }
function openPost(){ postModal.classList.remove('hidden'); toggleDriverFields(); }
function closePost(){ postModal.classList.add('hidden'); }
function saveLift(){
  const type = pType.value;
  const data = {
    id: Date.now(), type: type,
    from: pFrom.value.trim(), to: pTo.value.trim(),
    date: pDate.value, time: pTime.value,
    seats: parseInt(pSeats.value)||1, price: parseInt(pPrice.value)||0,
    name: pName.value.trim(), whatsapp: pWA.value.trim(),
    carMake: pCarMake.value.trim(), carModel: pCarModel.value.trim(),
    carColor: pCarColor.value.trim(), plate: pPlate.value.trim(),
    carImage: type==='driver' ? tempCarImage : ''
  };
  if(!data.from||!data.to||!data.date||!data.name||!data.whatsapp){ alert("Fill From, To, Date, Name, WhatsApp"); return; }
  if(type==='driver' && (!data.plate || !data.carImage)){ alert("Driver must add Plate Number + Car Picture"); return; }
  lifts.unshift(data);
  localStorage.setItem('teo_ride', JSON.stringify(lifts));
  closePost(); render(); tempCarImage=''; preview.classList.add('hidden');
}
function deleteLift(id){ if(confirm("Delete?")){ lifts=lifts.filter(l=>l.id!==id); localStorage.setItem('teo_ride', JSON.stringify(lifts)); render(); } }
toggleDriverFields(); render();