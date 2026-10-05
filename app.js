const DEMO_USERS=[
 {email:"admin@lab.local",password:"Admin@123",name:"Lab Administrator",role:"Admin"},
 {email:"official@lab.local",password:"Official@123",name:"Authorized Official",role:"Official"}
];

let inventory=JSON.parse(localStorage.getItem("lab_inventory")||"null")||[
 {id:"ARD-001",name:"Arduino UNO",category:"Microcontroller",bero:"Bero 1",qty:10,available:8,min:2},
 {id:"ESP-001",name:"ESP32 DevKit",category:"Microcontroller",bero:"Bero 1",qty:15,available:12,min:3},
 {id:"STM-001",name:"STM32 Nucleo",category:"Microcontroller",bero:"Bero 1",qty:5,available:5,min:1},
 {id:"MOT-001",name:"DC Motor 12V",category:"Motor",bero:"Bero 1",qty:12,available:9,min:3},
 {id:"DRN-001",name:"Drone ESC",category:"Drone",bero:"Bero 2",qty:8,available:6,min:2}
];
let transactions=JSON.parse(localStorage.getItem("lab_transactions")||"[]");
let officials=JSON.parse(localStorage.getItem("lab_officials")||"null")||[
 {name:"Lab Administrator",email:"admin@lab.local",role:"Admin"},
 {name:"Authorized Official",email:"official@lab.local",role:"Official"}
];
let currentUser=null;

const $=id=>document.getElementById(id);
function save(){localStorage.setItem("lab_inventory",JSON.stringify(inventory));localStorage.setItem("lab_transactions",JSON.stringify(transactions));localStorage.setItem("lab_officials",JSON.stringify(officials))}
function login(e){e.preventDefault();let email=$("email").value.trim(),password=$("password").value;let u=DEMO_USERS.find(x=>x.email===email&&x.password===password);if(!u){$("loginError").textContent="Invalid authorized credentials.";return}currentUser=u;$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("userText").textContent=u.name;$("roleText").textContent=u.role;document.querySelectorAll(".admin-only").forEach(x=>x.classList.toggle("hidden",u.role!=="Admin"));renderAll()}
function logout(){currentUser=null;$("appView").classList.add("hidden");$("loginView").classList.remove("hidden");$("loginForm").reset()}
$("loginForm").addEventListener("submit",login);$("logoutBtn").addEventListener("click",logout);

document.querySelectorAll(".nav").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.page)));
function showPage(page){document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));$(page).classList.remove("hidden");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));$("pageTitle").textContent=page[0].toUpperCase()+page.slice(1);renderAll()}
function renderAll(){renderDashboard();renderInventory();renderTransactions();renderOfficials()}
function renderDashboard(){
 let total=inventory.reduce((a,x)=>a+x.qty,0),available=inventory.reduce((a,x)=>a+x.available,0);
 $("totalItems").textContent=inventory.length;$("availableUnits").textContent=available;$("issuedUnits").textContent=total-available;$("lowStock").textContent=inventory.filter(x=>x.available<=x.min).length;
 let rows=transactions.slice(-8).reverse();
 $("recentTransactions").innerHTML=rows.length?table(["Date","User","Component","Action","Qty"],rows.map(t=>[t.date,t.user,t.item,t.action,t.qty])):"<p class='muted'>No transactions yet.</p>"
}
function table(headers,rows){return `<table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`}
function renderInventory(){
 let q=($("searchInput")?.value||"").toLowerCase();
 let list=inventory.filter(x=>Object.values(x).join(" ").toLowerCase().includes(q));
 $("inventoryTable").innerHTML=table(["ID","Component","Category","Bero","Total","Available","Status","Action"],list.map(x=>{
 let status=x.available<=x.min?`<span class="badge low">LOW</span>`:`<span class="badge in">OK</span>`;
 return [x.id,x.name,x.category,x.bero,x.qty,x.available,status,`<button class="action" onclick="openItem('${x.id}')">Manage</button>`]
 }))
}
$("searchInput").addEventListener("input",renderInventory);

function openItem(id){
 let x=inventory.find(i=>i.id===id);
 $("modalContent").innerHTML=`<h2>${x.name}</h2><p class="muted">${x.id} • ${x.category} • ${x.bero}</p><p><b>Available:</b> ${x.available} / ${x.qty}</p><div style="display:flex;gap:10px;margin-top:20px"><button class="primary" onclick="transaction('${x.id}','OUT')">Issue / OUT</button><button class="action" onclick="transaction('${x.id}','IN')">Return / IN</button></div>${currentUser.role==="Admin"?`<button class="action" style="margin-top:15px" onclick="editItem('${x.id}')">Edit Component</button>`:""}`;
 $("modal").classList.remove("hidden")
}
function transaction(id,action){
 let x=inventory.find(i=>i.id===id);
 if(action==="OUT"&&x.available<=0)return alert("No available stock.");
 if(action==="OUT")x.available--; else if(x.available<x.qty)x.available++; else return alert("All units are already in the lab.");
 transactions.push({date:new Date().toLocaleString(),user:currentUser.name,item:x.id,action,qty:1});
 save();$("modal").classList.add("hidden");renderAll()
}
$("closeModal").addEventListener("click",()=>$("modal").classList.add("hidden"));
$("addItemBtn").addEventListener("click",()=>showItemForm());
function showItemForm(existing=null){
 $("modalContent").innerHTML=`<h2>${existing?"Edit":"Add"} Component</h2><form class="form" id="itemForm">
<label>Component ID</label><input id="fId" value="${existing?.id||""}" required ${existing?"readonly":""}>
<label>Name</label><input id="fName" value="${existing?.name||""}" required>
<label>Category</label><input id="fCat" value="${existing?.category||""}" required>
<label>Bero / Location</label><input id="fBero" value="${existing?.bero||""}" required>
<label>Total Quantity</label><input id="fQty" type="number" min="0" value="${existing?.qty||0}" required>
<label>Minimum Stock Alert</label><input id="fMin" type="number" min="0" value="${existing?.min||1}" required>
<button class="primary">Save Component</button></form>`;
 $("modal").classList.remove("hidden");
 $("itemForm").onsubmit=e=>{e.preventDefault();let id=$("fId").value.trim();let qty=Number($("fQty").value);if(existing){let old=existing.qty;existing.name=$("fName").value;existing.category=$("fCat").value;existing.bero=$("fBero").value;existing.qty=qty;existing.min=Number($("fMin").value);existing.available=Math.min(existing.available+(qty-old),qty)}else{inventory.push({id,name:$("fName").value,category:$("fCat").value,bero:$("fBero").value,qty,available:qty,min:Number($("fMin").value)})}save();$("modal").classList.add("hidden");renderAll()}
}
function editItem(id){showItemForm(inventory.find(x=>x.id===id))}
function renderTransactions(){ $("transactionsTable").innerHTML=transactions.length?table(["Date","User","Component","Action","Qty"],transactions.slice().reverse().map(t=>[t.date,t.user,t.item,`<span class="badge ${t.action==="IN"?"in":"out"}">${t.action}</span>`,t.qty])):"<p class='muted'>No transactions yet.</p>"}
function renderOfficials(){if(currentUser?.role!=="Admin")return;$("officialsTable").innerHTML=table(["Name","Email","Role"],officials.map(x=>[x.name,x.email,x.role]))}
$("addOfficialBtn").addEventListener("click",()=>{$("modalContent").innerHTML=`<h2>Add Official</h2><form class="form" id="officialForm"><label>Name</label><input id="oName" required><label>Email</label><input id="oEmail" type="email" required><label>Role</label><select id="oRole"><option>Official</option><option>Admin</option></select><button class="primary">Add</button></form>`;$("modal").classList.remove("hidden");$("officialForm").onsubmit=e=>{e.preventDefault();officials.push({name:$("oName").value,email:$("oEmail").value,role:$("oRole").value});save();$("modal").classList.add("hidden");renderOfficials()}})
save();