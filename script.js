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
  if(page === "opcion4.html") {
    gapiCalendarLoaded();
    initGoogleCalendar();
  }
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

async function initializeGapiClient() {
  await gapi.client.init({ discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] });
  gapiInited = true;
}

function initGoogleAuth() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (resp)=>{
      if(resp.error) throw resp;
      document.getElementById("drive-login").style.display="none";
      document.getElementById("drive-section").style.display="block";
      await listFiles();
    },
  });
}

function authorizeDrive() { 
  if(!tokenClient) initGoogleAuth();
  tokenClient.requestAccessToken({prompt:'consent'});
}

async function listFiles() {
  if(!gapiInited) await initializeGapiClient();
  const res = await gapi.client.drive.files.list({
    q:`'${FOLDER_ID}' in parents and trashed=false`,
    fields:'files(id,name,webViewLink)'
  });
  const files=document.getElementById("file-list");
  files.innerHTML="";
  if(!res.result.files || res.result.files.length==0){
    files.innerHTML="<li>No hay archivos disponibles.</li>";
    return;
  }
  res.result.files.forEach(f=>{
    files.innerHTML+=`<li><a href="${f.webViewLink}" target="_blank">${f.name}</a></li>`
  });
}

async function uploadFile(e){
  e.preventDefault();
  const file=document.getElementById("file-input").files[0];
  if(!file) return alert("Selecciona un archivo.");
  
  const metadata={name:file.name, parents:[FOLDER_ID]};
  const form=new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], {type:"application/json"}));
  form.append("file", file);

  const token=gapi.client.getToken();
  if(!token) return alert("Debes iniciar sesión en Google primero.");
  const accessToken=token.access_token;

  await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",{
    method:"POST",
    headers:new Headers({"Authorization":"Bearer "+accessToken}),
    body:form,
  });

  alert("Archivo subido con éxito.");
  await listFiles();
}

function initOption10(){ 
  document.getElementById("upload-form").addEventListener("submit", uploadFile);
  gapiLoaded();
  initGoogleAuth();
}

/* === Google Calendar === */
const CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_ID = 'comiteavatelmadrid@gmail.com';

let calendarTokenClient, gapiCalendarInited = false;

function gapiCalendarLoaded() {
  gapi.load('client', initializeCalendarClient);
}

async function initializeCalendarClient() {
  await gapi.client.init({
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
  });
  gapiCalendarInited = true;
}

function initGoogleCalendar() {
  calendarTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: CALENDAR_SCOPES,
    callback: async (tokenResponse) => {
      if(tokenResponse.error) throw tokenResponse;
      await listUpcomingEvents();
    }
  });
}

function authorizeCalendar() {
  if(!calendarTokenClient) initGoogleCalendar();
  calendarTokenClient.requestAccessToken({ prompt: 'consent' });
}

async function listUpcomingEvents() {
  if(!gapiCalendarInited) await initializeCalendarClient();

  const response = await gapi.client.calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: (new Date()).toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 10,
    orderBy: 'startTime'
  });

  const container = document.getElementById('calendar-events');
  container.innerHTML = '';

  const events = response.result.items;
  if(!events || events.length===0){
    container.innerHTML='<p>No hay eventos próximos.</p>';
    return;
  }

  events.forEach(event => {
    const isAllDay = !!event.start.date;
    const start = new Date(event.start.dateTime || event.start.date);
    const day = start.getDate();
    const month = start.toLocaleString('es-ES', { month: 'short' });
    const year = start.getFullYear();
    const hours = start.getHours().toString().padStart(2,'0');
    const minutes = start.getMinutes().toString().padStart(2,'0');

    const card = document.createElement('div');
    card.className = 'event-card';

    const dateDiv = document.createElement('div');
    dateDiv.className = 'event-date' + (isAllDay ? ' all-day' : '');
    dateDiv.innerHTML = `${day}<span>${month}</span>`;

    const infoDiv = document.createElement('div');
    infoDiv.className = 'event-info';
    infoDiv.innerHTML = `<strong>${event.summary || 'Sin título'}</strong><br>
                         <em>${isAllDay ? 'Todo el día' : `${hours}:${minutes} - ${year}`}</em>`;

    card.appendChild(dateDiv);
    card.appendChild(infoDiv);
    container.appendChild(card);
  });
}

/* === Cargar primera página al abrir dashboard === */
loadPage("opcion1.html");
