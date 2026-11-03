if(lifts.length===0){
  lifts = [
    {id:1, type:'driver', from:'Port Elizabeth', to:'Kokstad', date:'2026-11-06', time:'09:00', seats:3, price:350, name:'Liya', whatsapp:'0781234567', carMake:'Toyota', carModel:'Corolla', carColor:'White', plate:'ND 123-456', carImage:'images/car.png'},
    {id:2, type:'passenger', from:'Cape Town', to:'Durban', date:'2026-12-13', time:'16:00', seats:2, name:'Thando', whatsapp:'0781234567'},
  ];
  localStorage.setItem('teo_ride', JSON.stringify(lifts));
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// YOUR LIVE CONFIG - TeoRides
const firebaseConfig = {
  apiKey: "AIzaSyCbUKh_8Z8OzV5njhQB3uysyvS6A9v2HxE",
  authDomain: "teorides.firebaseapp.com",
  projectId: "teorides",
  storageBucket: "teorides.firebasestorage.app",
  messagingSenderId: "495452921803",
  appId: "1:495452921803:web:cc89d5412a128de8cea04e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const ridesCol = collection(db, "rides");

let allRides = [];
let activeTab = 'all';
let filter = {from:'', to:'', date:''};
let tempFile = null;

const liftsEl = document.getElementById('lifts');
const preview = document.getElementById('preview');
const postModal = document.getElementById('postModal');
const uploadStatus = document.getElementById('uploadStatus');

document.getElementById('pCarPic').addEventListener('change', e=>{
  tempFile = e.target.files[0];
  if(tempFile){
    preview.src = URL.createObjectURL(tempFile);
    preview.classList.remove('hidden');
  }
});

const driverFields = document.getElementById('driverFields');
document.getElementById('pType').addEventListener('change', e=>{
  driverFields.style.display = e.target.value==='driver' ? 'block' : 'none';
});

document.querySelectorAll('.tab[data-tab]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab[data-tab]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

document.querySelector('.tab.post').addEventListener('click', ()=> postModal.classList.remove('hidden'));
document.querySelector('.close').addEventListener('click', ()=> postModal.classList.add('hidden'));
window.addEventListener('click', e=>{ if(e.target===postModal) postModal.classList.add('hidden'); });

document.getElementById('btnSearch').addEventListener('click', ()=>{
  filter.from = document.getElementById('fFrom').value;
  filter.to = document.getElementById('fTo').value;
  filter.date = document.getElementById('fDate').value;
  render();
});
document.getElementById('btnClear').addEventListener('click', ()=>{
  document.getElementById('fFrom').value='';
  document.getElementById('fTo').value='';
  document.getElementById('fDate').value='';
  filter={from:'',to:'',date:''};
  render();
});

function formatWA(n){ let x=n.replace(/\D/g,''); if(x.startsWith('0')) x='27'+x.slice(1); return x; }

function render(){
  let list = [...allRides];
  if(activeTab!=='all') list = list.filter(l=>l.type===activeTab);
  if(filter.from) list = list.filter(l=>l.from.toLowerCase().includes(filter.from.toLowerCase()));
  if(filter.to) list = list.filter(l=>l.to.toLowerCase().includes(filter.to.toLowerCase()));
  if(filter.date) list = list.filter(l=>l.date===filter.date);

  if(list.length===0){ liftsEl.innerHTML=`<p style="grid-column:1/-1;text-align:center;opacity:.6;padding:30px">No rides found. Be the first!</p>`; return; }

  liftsEl.innerHTML = list.map(l=>`
    <div class="card ${l.type}">
      <div class="route">${l.from} <span>→</span> ${l.to}</div>
      <div class="meta">📅 ${l.date} ${l.time? 'at '+l.time:''}<br>${l.type==='driver'?`💺 ${l.seats} seats`:`🧍 Needs ${l.seats}`}<br>👤 ${l.name}${l.type==='driver'?`<br>🚗 ${l.carMake} ${l.carModel} (${l.carColor})<br><span class="plate">${l.plate}</span>`:''}</div>
      ${l.carImage?`<img class="car" src="${l.carImage}" loading="lazy">`:''}
      ${l.price?`<div class="price">R${l.price} / seat</div>`:''}
      <a class="wa" target="_blank" href="https://wa.me/${formatWA(l.whatsapp)}?text=Hi ${encodeURIComponent(l.name)}, I'm from Teo Rides - ${l.from} to ${l.to} on ${l.date}">WhatsApp ${l.name}</a>
      <button class="del" onclick="window.delRide('${l.id}')">Delete</button>
    </div>
  `).join('');
}

window.delRide = async (id)=>{
  if(confirm("Delete this ride?")) await deleteDoc(doc(db, "rides", id));
};

document.getElementById('btnPost').addEventListener('click', async ()=>{
  const pType = document.getElementById('pType').value;
  const data = {
    type: pType,
    from: document.getElementById('pFrom').value.trim(),
    to: document.getElementById('pTo').value.trim(),
    date: document.getElementById('pDate').value,
    time: document.getElementById('pTime').value,
    seats: parseInt(document.getElementById('pSeats').value)||1,
    price: parseInt(document.getElementById('pPrice').value)||0,
    name: document.getElementById('pName').value.trim(),
    whatsapp: document.getElementById('pWA').value.trim(),
    carMake: document.getElementById('pCarMake').value.trim(),
    carModel: document.getElementById('pCarModel').value.trim(),
    carColor: document.getElementById('pCarColor').value.trim(),
    plate: document.getElementById('pPlate').value.trim(),
    carImage: '',
    createdAt: serverTimestamp()
  };

  if(!data.from||!data.to||!data.date||!data.name||!data.whatsapp){ alert("Fill From, To, Date, Name, WhatsApp"); return; }
  if(pType==='driver' && (!data.plate || !tempFile)){ alert("Driver must add Plate No + Car Picture"); return; }

  const btn = document.getElementById('btnPost');
  btn.disabled = true; uploadStatus.textContent = "Posting ride...";

  try{
    if(pType==='driver' && tempFile){
      uploadStatus.textContent = "Uploading car picture...";
      const storageRef = ref(storage, `cars/${Date.now()}_${tempFile.name}`);
      await uploadBytes(storageRef, tempFile);
      data.carImage = await getDownloadURL(storageRef);
    }
    await addDoc(ridesCol, data);
    postModal.classList.add('hidden');
    tempFile=null; preview.classList.add('hidden'); uploadStatus.textContent='';
    document.getElementById('pFrom').value=''; document.getElementById('pTo').value=''; document.getElementById('pName').value=''; document.getElementById('pWA').value=''; document.getElementById('pPlate').value='';
  }catch(e){ alert("Error: "+e.message); uploadStatus.textContent = e.message; }
  btn.disabled=false;
});

// LIVE REALTIME
onSnapshot(query(ridesCol, orderBy("createdAt","desc")), snap=>{
  allRides = snap.docs.map(d=> ({id:d.id, ...d.data()}));
  render();
});
