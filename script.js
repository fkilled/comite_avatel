/* === Netlify Identity === */
netlifyIdentity.init();
netlifyIdentity.on("login", user => {
  document.getElementById("user-email").innerText = "Usuario: " + user.email;
});
const user = netlifyIdentity.currentUser();
if (user) document.getElementById("user-email").innerText = "Usuario: " + user.email;

function logout() {
  netlifyIdentity.logout();
  window.location.href = "/index.html";
}

/* === Cargar páginas dinámicamente === */
async function loadPage(page) {
  const res = await fetch("pages/" + page);
  const html = await res.text();
  document.getElementById("content-area").innerHTML = html;

  if(page === "opcion10.html") initOption10(); // Google Drive
}

/* Manejar clicks del menú */
document.querySelectorAll('.sidebar nav a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    const page = link.dataset.page;
    loadPage(page);
  });
});

/* === Google Drive === */
const CLIENT_ID = '50924464133-p08sk3tqmijmkvu6j38b754hqhvm2vpn.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly';
const FOLDER_ID = '1reQSfQAspCQmRPAceOG1ZmFxicsCCXih';
let tokenClient, gapiInited = false;

function gapiLoaded() { gapi.load('client', initializeGapiClient); }
async function initializeGapiClient() { await gapi.client.init({ discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] }); gapiInited = true; }
function initGoogleAuth() { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPES, callback: async (resp)=>{ if(resp.error) throw resp; document.getElementById("drive-login").style.display="none"; document.getElementById("drive-section").style.display="block"; await listFiles(); },}); }
function authorizeDrive() { if(!tokenClient)initGoogleAuth(); tokenClient.requestAccessToken({prompt:'consent'}); }
async function listFiles() { if(!gapiInited) await initializeGapiClient(); const res = await gapi.client.drive.files.list({q:`'${FOLDER_ID}' in parents and trashed=false`, fields:'files(id,name,webViewLink)'}); const files=document.getElementById("file-list"); files.innerHTML=""; if(!res.result.files || res.result.files.length==0){ files.innerHTML="<li>No hay archivos disponibles.</li>"; return; } res.result.files.forEach(f=>{ files.innerHTML+=`<li><a href="${f.webViewLink}" target="_blank">${f.name}</a></li>` }); }
async function uploadFile(e){ e.preventDefault(); const file=document.getElementById("file-input").files[0]; if(!file)return alert("Selecciona un archivo."); const metadata={name:file.name, parents:[FOLDER_ID]}; const form=new FormData(); form.append("metadata", new Blob([JSON.stringify(metadata)], {type:"application/json"})); form.append("file", file); const token=gapi.client.getToken(); if(!token)return alert("Debes iniciar sesión en Google primero."); const accessToken=token.access_token; await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",{method:"POST", headers:new Headers({"Authorization":"Bearer "+accessToken}), body:form,}); alert("Archivo subido con éxito."); await listFiles(); }

function initOption10(){ 
  document.getElementById("upload-form").addEventListener("submit", uploadFile);
  gapiLoaded();
  initGoogleAuth();
}

/* === Cargar la primera página al abrir dashboard === */
loadPage("opcion1.html");
