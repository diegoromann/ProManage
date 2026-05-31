'use strict';

/* === Bloque JS original 6 === */
(function(){
const CLEAN_INSTALL_FLAG = 'promanage_clean_install_v1';
const ADMIN_USER = { id: 'admin', name: 'Administrador Maestro', email: 'admin@promanage.com', password: 'admin123', role: 'admin' };
try {
    if (localStorage.getItem(CLEAN_INSTALL_FLAG) !== '1') {
        Object.keys(localStorage).forEach(function(key){
            if (key.indexOf('pm_') === 0 || key === 'theme') localStorage.removeItem(key);
        });
        localStorage.setItem('pm_users', JSON.stringify([ADMIN_USER]));
        localStorage.setItem(CLEAN_INSTALL_FLAG, '1');
    }
} catch(error) {
    console.warn('ProManage: no se pudo limpiar el almacenamiento inicial', error);
}
})();
let users = JSON.parse(localStorage.getItem('pm_users')) || [
{ id: 'admin', name: 'Administrador Maestro', email: 'admin@promanage.com', password: 'admin123', role: 'admin' }
];
let companies = JSON.parse(localStorage.getItem('pm_companies')) || [];
let projects = JSON.parse(localStorage.getItem('pm_projects')) || [];
let members = JSON.parse(localStorage.getItem('pm_members')) || [];
let employees = JSON.parse(localStorage.getItem('pm_employees')) || [];
let clients = JSON.parse(localStorage.getItem('pm_clients')) || [];
let finances = JSON.parse(localStorage.getItem('pm_finances')) || [];
let inventory = JSON.parse(localStorage.getItem('pm_inventory')) || [];
let activityLogs = JSON.parse(localStorage.getItem('pm_activityLogs')) || [];
let currentUser = JSON.parse(localStorage.getItem('pm_currentUser')) || null;
let selectedCompanyId = localStorage.getItem('pm_selectedCompanyId') || null;
let isRegisterMode = false;
let currentSectionId = 'dash';
let currentProjectSubView = 'lista';
let currentProjectFilter = 'all';
window.addEventListener('DOMContentLoaded', () => {
applySavedTheme();
if (currentUser) {
openCompanyPicker();
} else {
showAuthWrapper();
}
});
function showAuthWrapper() {
document.getElementById('authWrapper').style.display = 'flex';
document.getElementById('companyPickerWrapper').style.display = 'none';
document.getElementById('dashboardWrapper').style.display = 'none';
}
function togglePasswordVisibility(inputId, btn) {
const input = document.getElementById(inputId);
if (input.type === 'password') {
input.type = 'text';
btn.innerText = 'Ocultar';
} else {
input.type = 'password';
btn.innerText = 'Ver';
}
}
function toggleAuthMode() {
isRegisterMode = !isRegisterMode;
document.getElementById('authTitle').innerText = isRegisterMode ? 'Crear Cuenta ProManage' : 'ProManage';
document.getElementById('btnAuthSubmit').innerText = isRegisterMode ? 'Registrarse' : 'Iniciar Sesión';
document.getElementById('authToggleText').innerText = isRegisterMode ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?';
document.getElementById('authToggleLink').innerText = isRegisterMode ? 'Inicia sesión' : 'Regístrate aquí';
document.getElementById('regNameGroup').style.display = isRegisterMode ? 'block' : 'none';
document.getElementById('regPasswordConfirmGroup').style.display = isRegisterMode ? 'block' : 'none';
document.getElementById('authMessage').innerHTML = '';
}
function ensureAdminUser() {
try {
const defaultAdmin = { id: 'admin', name: 'Administrador Maestro', email: 'admin@promanage.com', password: 'admin123', role: 'admin' };
if (!Array.isArray(users)) users = [];
const adminIndex = users.findIndex(u => String(u.email || '').toLowerCase() === 'admin@promanage.com' || u.id === 'admin');
if (adminIndex === -1) {
users.unshift(defaultAdmin);
} else {
users[adminIndex] = { ...defaultAdmin, ...users[adminIndex], id: 'admin', email: 'admin@promanage.com', password: 'admin123', role: 'admin' };
}
localStorage.setItem('pm_users', JSON.stringify(users));
} catch(error) {
console.warn('ProManage: no se pudo reparar el usuario admin', error);
}
}
function handleAuth() {
ensureAdminUser();
const email = document.getElementById('authEmail').value.trim();
const password = document.getElementById('authPassword').value;
const msgZone = document.getElementById('authMessage');
if (!email || !password) return msgZone.innerHTML = `<div class="error">Por favor, rellene todos los campos obligatorios.</div>`;
if (isRegisterMode) {
const name = document.getElementById('regName').value.trim();
const confirmPass = document.getElementById('authPasswordConfirm').value;
if (!name) return msgZone.innerHTML = `<div class="error">Debe ingresar su nombre completo.</div>`;
if (password !== confirmPass) return msgZone.innerHTML = `<div class="error">Las contraseñas introducidas no coinciden.</div>`;
if (email.toLowerCase() === 'admin@promanage.com') return msgZone.innerHTML = `<div class="error">Este correo está reservado para la administración central.</div>`;
if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return msgZone.innerHTML = `<div class="error">El correo electrónico ya se encuentra registrado.</div>`;
const newUser = { id: 'u_' + Date.now(), name, email, password, role: 'user' };
users.push(newUser);
localStorage.setItem('pm_users', JSON.stringify(users));
currentUser = newUser;
} else {
const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
if (!found) return msgZone.innerHTML = `<div class="error">Credenciales incorrectas. Verifique su correo y contraseña.</div>`;
currentUser = found;
}
localStorage.setItem('pm_currentUser', JSON.stringify(currentUser));
showToast(`Bienvenido de nuevo, ${currentUser.name}`, 'success');
document.getElementById('authEmail').value = '';
document.getElementById('authPassword').value = '';
document.getElementById('authMessage').innerHTML = '';
openCompanyPicker();
}
function openCompanyPicker() {
document.getElementById('authWrapper').style.display = 'none';
document.getElementById('companyPickerWrapper').style.display = 'flex';
document.getElementById('dashboardWrapper').style.display = 'none';
const pickerList = document.getElementById('companyPickerList');
pickerList.innerHTML = '';
const userCompanies = (currentUser.role === 'admin' || currentUser.email === 'admin@promanage.com')
? companies
: companies.filter(c => c.createdBy === currentUser.id);
if (userCompanies.length === 0) {
pickerList.innerHTML = `<div style="color:var(--text-secondary); text-align:center; font-size:14px; font-style:italic; padding: 20px;">No posee organizaciones registradas en su perfil.</div>`;
} else {
userCompanies.forEach(comp => {
const btn = document.createElement('button');
btn.className = 'company-item-btn';
btn.innerHTML = `<span>${escapeHtml(comp.name)}</span><span style="font-size:12px; color:var(--accent); font-weight:600;">Ingresar →</span>`;
btn.onclick = () => selectCompany(comp.id);
pickerList.appendChild(btn);
});
}
}
function submitCreateCompany() {
const name = document.getElementById('newCompanyName').value.trim();
if (!name) return showToast('Debe ingresar un nombre válido para la organización', 'error');
companies.push({ id: 'c_' + Date.now(), name: name, createdBy: currentUser.id });
localStorage.setItem('pm_companies', JSON.stringify(companies));
document.getElementById('newCompanyName').value = '';
showToast('Espacio de trabajo creado correctamente', 'success');
pushActivityLog(`Creación de empresa: ${name}`);
openCompanyPicker();
}
function selectCompany(companyId) {
selectedCompanyId = companyId;
localStorage.setItem('pm_selectedCompanyId', selectedCompanyId);
const comp = companies.find(c => c.id === companyId);
document.getElementById('currentCompanyNavbarLabel').innerText = comp ? comp.name : 'Empresa';
document.getElementById('navbarUserAvatar').innerText = currentUser.name.charAt(0).toUpperCase();
document.getElementById('dropdownUserName').innerText = currentUser.name;
document.getElementById('dropdownUserRole').innerText = currentUser.role === 'admin' ? 'Administrador' : 'Ingeniero';
document.getElementById('companyPickerWrapper').style.display = 'none';
document.getElementById('dashboardWrapper').style.display = 'flex';
switchSection('dash');
pushActivityLog('Ingreso al espacio de trabajo operativo.');
}
function switchSection(sectionId) {
currentSectionId = sectionId;
document.querySelectorAll('.section').forEach(s => {
s.classList.remove('active', 'page-enter');
});
document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
const targetSection = document.getElementById(`section-${sectionId}`);
if (targetSection) {
targetSection.classList.add('active', 'page-enter');
setTimeout(() => { targetSection.classList.remove('page-enter'); }, 500);
}
const activeMenu = document.getElementById(`menu-${sectionId}`);
if (activeMenu) activeMenu.classList.add('active');
const headers = {
'dash': 'Panel General',
'projects': 'Estructura de Proyectos',
'team': 'Roles y Especialistas',
'employees': 'Directorio de Empleados',
'clients': 'Cartera de Clientes',
'finances': 'Panel Financiero',
'inventory': 'Control de Inventario',
'reports': 'Reportes Generales'
};
document.getElementById('sectionTitle').innerText = headers[sectionId] || 'ProManage Hub';
toggleSidebar(false);
syncDataModelsUI();
}
function toggleSidebar(open) {
const side = document.getElementById('sidebar');
if(open) side.classList.add('active');
else side.classList.remove('active');
}
function toggleUserDropdown() {
document.getElementById('userMenuDropdown').classList.toggle('active');
}
function syncDataModelsUI() {
if (!selectedCompanyId) return;
if (currentSectionId === 'dash') renderDashboardMetrics();
else if (currentSectionId === 'projects') renderProjectsHub();
else if (currentSectionId === 'team') renderMembers();
else if (currentSectionId === 'employees') renderEmployees();
else if (currentSectionId === 'clients') renderClients();
else if (currentSectionId === 'finances') renderFinances();
else if (currentSectionId === 'inventory') renderInventory();
renderActivityLogs();
}
function renderDashboardMetrics() {
const compProjects = projects.filter(p => p.companyId === selectedCompanyId);
const compFinances = finances.filter(f => f.companyId === selectedCompanyId);
document.getElementById('statTotalProjects').innerText = compProjects.length;
document.getElementById('statActiveProjects').innerText = compProjects.filter(p => p.status === 'en-proceso').length;
document.getElementById('statTotalEmployees').innerText = employees.filter(e => e.companyId === selectedCompanyId).length;
let balance = 0;
compFinances.forEach(f => {
balance += f.type === 'ingreso' ? parseFloat(f.amount||0) : -parseFloat(f.amount||0);
});
const balElement = document.getElementById('statFinancialBalance');
balElement.innerText = `$${balance.toLocaleString('es-CL', { minimumFractionDigits: 2 })}`;
balElement.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';
const criticalBody = document.getElementById('dashCriticalProjectsTableBody');
criticalBody.innerHTML = '';
const highPriorityProjs = compProjects.filter(p => p.priority === 'alta');
if (highPriorityProjs.length === 0) {
criticalBody.innerHTML = `<tr><td colspan="2" class="empty-state">No hay frentes en ruta crítica actualmente.</td></tr>`;
return;
}
highPriorityProjs.forEach(p => {
criticalBody.innerHTML += `
<tr><td style="font-weight:600; color:var(--text-primary);">${escapeHtml(p.title)}</td><td style="text-align:right;"><span class="status-badge status-${p.status}">${p.status}</span></td></tr>`;
});
}
function switchProjectView(viewKey) {
currentProjectSubView = viewKey;
document.querySelectorAll('.project-subview').forEach(v => {
v.style.display = 'none';
v.classList.remove('page-enter');
});
document.querySelectorAll('.view-tab-btn').forEach(b => b.classList.remove('active'));
const targetView = document.getElementById(`projectView-${viewKey}`);
if(targetView) {
targetView.style.display = 'block';
targetView.classList.add('page-enter');
}
document.getElementById(`tab-btn-${viewKey}`).classList.add('active');
renderProjectsHub();
}
function filterProjects(filterKey) {
currentProjectFilter = filterKey;
document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
document.getElementById(`filter-${filterKey}`).classList.add('active');
renderProjectsHub();
}
function renderProjectsHub() {
let data = projects.filter(p => p.companyId === selectedCompanyId);
if (currentProjectFilter !== 'all') data = data.filter(p => p.status === currentProjectFilter);
if (currentProjectSubView === 'lista') {
const tbody = document.getElementById('projectsListTableBody');
tbody.innerHTML = '';
if (data.length === 0) {
tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay proyectos registrados que coincidan con el filtro.</td></tr>`;
return;
}
data.forEach(p => {
const leader = members.find(m => m.id === p.ownerId)?.name || 'Sin asignación';
tbody.innerHTML += `
<tr><td><span style="cursor:pointer; font-weight:600; color:var(--accent);" onclick="openProjectDetailsModal('${p.id}')">${escapeHtml(p.title)}</span></td><td>${escapeHtml(leader)}</td><td><span class="priority-badge priority-${p.priority}">${p.priority}</span></td><td><span class="status-badge status-${p.status}">${p.status}</span></td><td style="text-align:right;"><button class="action-text-btn" onclick="openEditProjectModal('${p.id}')">Editar</button><button class="action-text-btn danger" onclick="deleteProject('${p.id}')">Eliminar</button></td></tr>`;
});
} else if (currentProjectSubView === 'kanban') {
['pendiente', 'en-proceso', 'completado'].forEach(c => {
const container = document.getElementById(`kanban-cards-${c}`);
container.innerHTML = '';
const list = data.filter(p => p.status === c);
document.getElementById(`count-${c}`).innerText = list.length;
list.forEach(p => {
container.innerHTML += `
<div class="project-card" draggable="true" ondragstart="handleDragStart(event, '${p.id}')"><h4 onclick="openProjectDetailsModal('${p.id}')">${escapeHtml(p.title)}</h4><p>${escapeHtml(p.description || 'Sin descripción detallada.')}</p><div class="project-info"><span class="priority-badge priority-${p.priority}">${p.priority}</span><button class="action-text-btn" style="font-size:11px; padding:4px 8px;" onclick="openEditProjectModal('${p.id}')">Editar</button></div></div>`;
});
});
}
}
let draggedProjectId = null;
function handleDragStart(e, id) { draggedProjectId = id; }
function allowDrop(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function handleDrop(e, statusKey) {
e.preventDefault();
e.currentTarget.classList.remove('drag-over');
if (!draggedProjectId) return;
const proj = projects.find(p => p.id === draggedProjectId);
if (proj) {
proj.status = statusKey;
localStorage.setItem('pm_projects', JSON.stringify(projects));
showToast(`Estado del proyecto actualizado`, 'success');
pushActivityLog(`Movimiento Kanban: ${proj.title} -> ${statusKey}`);
renderProjectsHub();
}
draggedProjectId = null;
}
function openCreateProjectModal() {
document.getElementById('projectModalTitle').innerText = 'Nuevo Proyecto';
document.getElementById('editProjectId').value = '';
document.getElementById('projTitle').value = '';
document.getElementById('projDesc').value = '';
populateOwnersSelect('projOwnerSelect');
openModal('projectModal');
}
function openEditProjectModal(id) {
const proj = projects.find(p => p.id === id);
if (!proj) return;
document.getElementById('projectModalTitle').innerText = 'Editar Proyecto';
document.getElementById('editProjectId').value = proj.id;
document.getElementById('projTitle').value = proj.title;
document.getElementById('projDesc').value = proj.description || '';
document.getElementById('projPriority').value = proj.priority || 'media';
document.getElementById('projStatus').value = proj.status || 'en-proceso';
populateOwnersSelect('projOwnerSelect', proj.ownerId);
openModal('projectModal');
}
function populateOwnersSelect(selectId, selectedId = null) {
const select = document.getElementById(selectId);
select.innerHTML = '<option value="">Sin Asignar Liderazgo</option>';
members.filter(m => m.companyId === selectedCompanyId).forEach(m => {
select.innerHTML += `<option value="${m.id}" ${m.id === selectedId ? 'selected' : ''}>${escapeHtml(m.name)} - ${escapeHtml(m.role)}</option>`;
});
}
function submitProjectForm() {
const id = document.getElementById('editProjectId').value;
const title = document.getElementById('projTitle').value.trim();
const desc = document.getElementById('projDesc').value.trim();
if (!title) return showToast('El título de la obra es un campo obligatorio.', 'error');
if (id) {
const proj = projects.find(p => p.id === id);
if(proj) {
Object.assign(proj, {
title,
description: desc,
ownerId: document.getElementById('projOwnerSelect').value,
priority: document.getElementById('projPriority').value,
status: document.getElementById('projStatus').value
});
showToast('Proyecto actualizado exitosamente', 'success');
pushActivityLog(`Modificación de proyecto: ${title}`);
}
} else {
projects.push({
id: 'p_' + Date.now(),
companyId: selectedCompanyId,
title,
description: desc,
ownerId: document.getElementById('projOwnerSelect').value,
priority: document.getElementById('projPriority').value,
status: document.getElementById('projStatus').value,
attachments: []
});
showToast('Proyecto creado de forma correcta', 'success');
pushActivityLog(`Nuevo proyecto creado: ${title}`);
}
localStorage.setItem('pm_projects', JSON.stringify(projects));
closeModal('projectModal');
renderProjectsHub();
renderDashboardMetrics();
}
function deleteProject(id) {
if(!confirm('¿Está seguro de eliminar permanentemente este frente operativo? Esta acción no se puede deshacer.')) return;
projects = projects.filter(p => p.id !== id);
localStorage.setItem('pm_projects', JSON.stringify(projects));
showToast('Proyecto eliminado correctamente.', 'success');
renderProjectsHub();
renderDashboardMetrics();
}
let draftAttachments = [];
function handleLocalFileUpload(e) {
const file = e.target.files[0];
if(!file) return;
document.getElementById('newMediaName').value = file.name;
const applyData = function(dataUrl) {
document.getElementById('newMediaUrl').value = dataUrl;
document.getElementById('newMediaType').value = file.type.startsWith('image/') ? 'imagen' : 'documento';
};
if (file.type.startsWith('image/') && typeof fileToDataUrl === 'function') {
fileToDataUrl(file).then(applyData).catch(function(){
const reader = new FileReader();
reader.onload = function(event) { applyData(event.target.result); };
reader.readAsDataURL(file);
});
} else {
const reader = new FileReader();
reader.onload = function(event) { applyData(event.target.result); };
reader.readAsDataURL(file);
}
}
function openProjectDetailsModal(id) {
selectedDetailProjectId = id;
const proj = projects.find(p => p.id === id);
if (!proj) return;
document.getElementById('detailProjTitle').innerText = proj.title;
document.getElementById('detailProjDesc').innerText = proj.description || 'Sin descripción ni alcance ingresado.';
document.getElementById('detailProjOwner').innerText = members.find(m => m.id === proj.ownerId)?.name || 'Sin Asignación';
document.getElementById('detailProjPriorityBadge').className = `priority-badge priority-${proj.priority}`;
document.getElementById('detailProjPriorityBadge').innerText = proj.priority;
document.getElementById('detailProjStatusBadge').className = `status-badge status-${proj.status}`;
document.getElementById('detailProjStatusBadge').innerText = proj.status;
document.getElementById('mediaFileInput').value = '';
document.getElementById('newMediaName').value = '';
document.getElementById('newMediaUrl').value = '';
draftAttachments = [...(proj.attachments || [])];
renderDraftMediaUI();
openModal('projectDetailsModal');
}
function renderDraftMediaUI() {
const grid = document.getElementById('detailMediaGrid');
grid.innerHTML = '';
if (draftAttachments.length === 0) {
grid.innerHTML = `<div style="grid-column: 1/-1; color:var(--text-secondary); font-size:13px; font-style:italic;">No hay evidencias adjuntas.</div>`;
return;
}
draftAttachments.forEach((att, idx) => {
let previewHTML = att.type === 'imagen'
? `<img src="${escapeHtml(att.url)}" alt="Evidencia">`
: `<div class="media-thumb-placeholder">Documento</div>`;
grid.innerHTML += `
<div class="media-item-card"><button class="delete-media-btn" onclick="removeAttachmentFromDraft(${idx})" title="Eliminar adjunto">×</button>
${previewHTML}
<span title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</span></div>`;
});
}
function addAttachmentToDraft() {
const name = document.getElementById('newMediaName').value.trim();
const url = document.getElementById('newMediaUrl').value.trim();
const type = document.getElementById('newMediaType').value;
if (!name || !url) return showToast('Por favor, selecciona un archivo local primero antes de añadirlo.', 'error');
draftAttachments.push({ type, name, url });
document.getElementById('mediaFileInput').value = '';
document.getElementById('newMediaName').value = '';
document.getElementById('newMediaUrl').value = '';
renderDraftMediaUI();
showToast('Archivo cargado a la lista temporal.', 'success');
}
function removeAttachmentFromDraft(idx) {
draftAttachments.splice(idx, 1);
renderDraftMediaUI();
}
function persistMultimediaChanges() {
const proj = projects.find(p => p.id === selectedDetailProjectId);
if (proj) {
proj.attachments = [...draftAttachments];
localStorage.setItem('pm_projects', JSON.stringify(projects));
showToast('Repositorio multimedia guardado de manera definitiva.', 'success');
pushActivityLog(`Evidencias actualizadas en obra: ${proj.title}`);
closeModal('projectDetailsModal');
}
}
function generateReport(format) {
if (format === 'PDF') {
showToast('Compilando documento consolidado con imágenes. Preparando ventana de impresión...', 'success');
pushActivityLog('Generación de reporte PDF consolidado.');
generatePrintableView();
setTimeout(() => {
window.print();
}, 1000);
}
}
function generatePrintableView() {
const printDiv = document.getElementById('printArea');
const comp = companies.find(c => c.id === selectedCompanyId);
let html = `
<div class="print-header"><h1>Reporte Técnico Consolidado</h1><h2>Organización: ${comp ? escapeHtml(comp.name) : 'No definida'}</h2><p>Fecha de Generación: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p></div>
`;
const compProjects = projects.filter(p => p.companyId === selectedCompanyId);
if (compProjects.length === 0) {
html += `<p style="text-align:center; font-size: 16px;">No existen proyectos registrados en esta organización para reportar.</p>`;
} else {
compProjects.forEach(p => {
const leader = members.find(m => m.id === p.ownerId)?.name || 'Sin responsable asignado';
html += `
<div class="print-project"><h2>Frente Operativo: ${escapeHtml(p.title)}</h2><div class="print-project-meta"><span><strong>Líder a Cargo:</strong> ${escapeHtml(leader)}</span><span><strong>Estado Actual:</strong> ${p.status.toUpperCase()}</span><span><strong>Prioridad:</strong> ${p.priority.toUpperCase()}</span></div><div class="print-project-desc">${escapeHtml(p.description || 'Sin alcance definido en la ficha.')}</div>
`;
if (p.attachments && p.attachments.length > 0) {
html += `<h3>Evidencias y Archivos Adjuntos:</h3><div class="print-img-container">`;
p.attachments.forEach(att => {
if (att.type === 'imagen') {
html += `<div class="print-img-box"><img src="${att.url}" class="print-img"><br><strong>${escapeHtml(att.name)}</strong></div>`;
} else {
html += `<div style="width: 100%;"><div class="print-doc-box">Documento Adjunto (No visual): <strong>${escapeHtml(att.name)}</strong></div></div>`;
}
});
html += `</div>`;
} else {
html += `<p style="font-size: 12px; color: #777; font-style: italic;">Sin archivos adjuntos registrados para este frente.</p>`;
}
html += `</div>`;
});
}
printDiv.innerHTML = html;
}
function renderMembers() {
const tbody = document.getElementById('membersTableBody');
const data = members.filter(m => m.companyId === selectedCompanyId);
if(data.length === 0) return tbody.innerHTML = `<tr><td colspan="3" class="empty-state">No hay especialistas registrados.</td></tr>`;
tbody.innerHTML = data.map(m => `
<tr><td style="font-weight:500;">${escapeHtml(m.name)}</td><td>${escapeHtml(m.role)}</td><td style="width: 100px; text-align:right;"><button class="action-text-btn danger" onclick="deleteEntity('pm_members', 'members', '${m.id}')">Eliminar</button></td></tr>`).join('');
}
function submitCreateMember() {
const name=document.getElementById('memName').value.trim(), role=document.getElementById('memRole').value.trim();
if(!name || !role) return showToast('Complete los datos del especialista.', 'error');
members.push({id:'m_'+Date.now(), companyId:selectedCompanyId, name, role});
localStorage.setItem('pm_members',JSON.stringify(members));
closeModal('createMemberModal'); syncDataModelsUI(); showToast('Especialista añadido exitosamente.','success');
}
function renderEmployees() {
const tbody = document.getElementById('employeesTableBody');
const data = employees.filter(e => e.companyId === selectedCompanyId);
if(data.length === 0) return tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay personal registrado en nómina.</td></tr>`;
tbody.innerHTML = data.map(e => `
<tr><td style="font-weight:500;">${escapeHtml(e.name)}</td><td>${escapeHtml(e.position)}</td><td>${escapeHtml(e.dept)}</td><td><span class="status-badge status-${e.status === 'activo' ? 'activo' : 'inactivo'}">${e.status}</span></td><td style="text-align:right;"><button class="action-text-btn danger" onclick="deleteEntity('pm_employees', 'employees', '${e.id}')">Eliminar</button></td></tr>`).join('');
}
function submitCreateEmployee() {
const name=document.getElementById('empName').value.trim(), pos=document.getElementById('empPosition').value.trim(), dept=document.getElementById('empDept').value.trim(), status=document.getElementById('empStatus').value;
if(!name || !pos) return showToast('Complete nombre y cargo obligatorios.','error');
employees.push({id:'e_'+Date.now(), companyId:selectedCompanyId, name, position:pos, dept, status});
localStorage.setItem('pm_employees',JSON.stringify(employees));
closeModal('createEmployeeModal'); syncDataModelsUI(); showToast('Empleado registrado en nómina.','success');
}
function renderClients() {
const tbody = document.getElementById('clientsTableBody');
const data = clients.filter(c => c.companyId === selectedCompanyId);
if(data.length === 0) return tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No hay clientes en la cartera.</td></tr>`;
tbody.innerHTML = data.map(c => `
<tr><td style="font-weight:500;">${escapeHtml(c.name)}</td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.phone)}</td><td style="text-align:right;"><button class="action-text-btn danger" onclick="deleteEntity('pm_clients', 'clients', '${c.id}')">Eliminar</button></td></tr>`).join('');
}
function submitCreateClient() {
const name=document.getElementById('cliName').value.trim(), email=document.getElementById('cliEmail').value.trim(), phone=document.getElementById('cliPhone').value.trim();
if(!name) return showToast('La Razón Social es obligatoria.','error');
clients.push({id:'cli_'+Date.now(), companyId:selectedCompanyId, name, email, phone});
localStorage.setItem('pm_clients',JSON.stringify(clients));
closeModal('createClientModal'); syncDataModelsUI(); showToast('Nuevo cliente incorporado.','success');
}
function renderFinances() {
const tbody = document.getElementById('financesTableBody');
const data = finances.filter(f => f.companyId === selectedCompanyId);
let tin=0, teg=0;
if(data.length === 0) return tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay movimientos financieros.</td></tr>`;
tbody.innerHTML = data.map(f => {
let v = parseFloat(f.amount||0);
f.type === 'ingreso' ? tin += v : teg += v;
let colorClass = f.type === 'ingreso' ? 'success' : 'danger';
let sign = f.type === 'ingreso' ? '+' : '-';
return `
<tr><td><span class="status-badge status-${f.type === 'ingreso' ? 'activo' : 'pendiente'}">${f.type}</span></td><td>${escapeHtml(f.category)}</td><td style="color:var(--${colorClass}); font-weight:600;">${sign}$${v.toLocaleString('es-CL')}</td><td style="color:var(--text-secondary);">${f.date || 'Hoy'}</td><td style="text-align:right;"><button class="action-text-btn danger" onclick="deleteEntity('pm_finances', 'finances', '${f.id}')">Anular</button></td></tr>`;
}).join('');
document.getElementById('finTotalIngresos').innerText=`$${tin.toLocaleString('es-CL')}`;
document.getElementById('finTotalEgresos').innerText=`$${teg.toLocaleString('es-CL')}`;
}
function submitCreateFinance() {
const type=document.getElementById('finType').value, cat=document.getElementById('finCategory').value.trim(), amount=parseFloat(document.getElementById('finAmount').value||0);
if(!cat || amount <= 0) return showToast('Ingrese una glosa y monto válido.','error');
finances.push({id:'fin_'+Date.now(), companyId:selectedCompanyId, type, category:cat, amount, date:new Date().toLocaleDateString()});
localStorage.setItem('pm_finances',JSON.stringify(finances));
closeModal('createFinanceModal'); syncDataModelsUI(); showToast('Asiento contable registrado correctamente.','success');
}
function renderInventory() {
const tbody = document.getElementById('inventoryTableBody');
const data = inventory.filter(i => i.companyId === selectedCompanyId);
if(data.length === 0) return tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Bodega principal vacía.</td></tr>`;
tbody.innerHTML = data.map(i => {
let stockStatus = i.stock > 10 ? 'En Stock' : (i.stock > 0 ? 'Mínimo' : 'Agotado');
let stockClass = i.stock > 10 ? 'activo' : (i.stock > 0 ? 'warning' : 'danger');
return `
<tr><td style="font-weight:500;">${escapeHtml(i.product)}</td><td>${escapeHtml(i.category)}</td><td>${i.stock} un.</td><td>$${parseFloat(i.price||0).toLocaleString('es-CL')}</td><td><span class="status-badge" style="background:var(--bg-tertiary); border:1px solid var(--border); color:var(--text-secondary);">${stockStatus}</span></td><td style="text-align:right;"><button class="action-text-btn danger" onclick="deleteEntity('pm_inventory', 'inventory', '${i.id}')">Eliminar</button></td></tr>`;
}).join('');
}
function submitCreateInventory() {
const prod=document.getElementById('invProduct').value.trim(), cat=document.getElementById('invCategory').value.trim(), stock=parseInt(document.getElementById('invStock').value||0), price=parseFloat(document.getElementById('invPrice').value||0);
if(!prod) return showToast('El nombre del insumo es requerido.','error');
inventory.push({id:'inv_'+Date.now(), companyId:selectedCompanyId, product:prod, category:cat, stock, price});
localStorage.setItem('pm_inventory',JSON.stringify(inventory));
closeModal('createInventoryModal'); syncDataModelsUI(); showToast('Insumo añadido al almacén.','success');
}
function deleteEntity(key, arrName, id) {
if(confirm('¿Seguro que desea eliminar este registro permanentemente?')) {
window[arrName] = window[arrName].filter(x => x.id !== id);
localStorage.setItem(key, JSON.stringify(window[arrName]));
syncDataModelsUI();
showToast('Registro eliminado con éxito.', 'success');
}
}
let pomodoroInterval = null;
let pomodoroSecondsLeft = 1500;
let pomodoroIsRunning = false;
function toggleDashPomodoro() {
const btn = document.getElementById('btnDashPomodoroToggle');
if(pomodoroIsRunning) {
clearInterval(pomodoroInterval);
btn.innerText = 'Reanudar Enfoque';
} else {
pomodoroInterval = setInterval(()=> {
pomodoroSecondsLeft--;
if(pomodoroSecondsLeft <= 0) {
resetDashPomodoro();
showToast('¡Bloque completado!', 'success');
pushActivityLog('Ciclo de Pomodoro de 25m finalizado.');
}
updatePomodoroDisplay();
}, 1000);
btn.innerText = 'Pausar Reloj';
}
pomodoroIsRunning = !pomodoroIsRunning;
}
function resetDashPomodoro() {
clearInterval(pomodoroInterval);
pomodoroIsRunning = false;
pomodoroSecondsLeft = 1500;
updatePomodoroDisplay();
document.getElementById('btnDashPomodoroToggle').innerText = 'Iniciar Enfoque';
}
function updatePomodoroDisplay() {
const m = Math.floor(pomodoroSecondsLeft/60).toString().padStart(2,'0');
const s = (pomodoroSecondsLeft%60).toString().padStart(2,'0');
document.getElementById('dashPomodoroDisplay').innerText = `${m}:${s}`;
}
let focusTimerInterval = null, focusSecondsLeft = 1500, focusTimerIsRunning = false;
function launchFocusModeFromDetails() {
const p = projects.find(x => x.id === selectedDetailProjectId);
if(!p) return;
closeModal('projectDetailsModal');
document.getElementById('focusModeProjectTitle').innerText = p.title;
document.getElementById('focusModeProjectDesc').innerText = p.description || 'Sin alcance ingresado.';
document.getElementById('focusModeOverlay').classList.add('active');
resetFocusTimer();
}
function toggleFocusTimer() {
const b = document.getElementById('btnFocusTimerToggle');
if(focusTimerIsRunning) {
clearInterval(focusTimerInterval);
b.innerText = 'Reanudar';
} else {
focusTimerInterval = setInterval(() => {
focusSecondsLeft--;
if(focusSecondsLeft <= 0) {
alert('¡Gran trabajo! Sesión de enfoque finalizada exitosamente.');
exitFocusMode();
pushActivityLog('Sesión Focus completada.');
}
updateFocusDisplay();
}, 1000);
b.innerText = 'Pausar';
}
focusTimerIsRunning = !focusTimerIsRunning;
}
function resetFocusTimer() {
clearInterval(focusTimerInterval);
focusTimerIsRunning = false;
focusSecondsLeft = 1500;
updateFocusDisplay();
document.getElementById('btnFocusTimerToggle').innerText = 'Iniciar';
}
function updateFocusDisplay() {
const m = Math.floor(focusSecondsLeft/60).toString().padStart(2,'0');
const s = (focusSecondsLeft%60).toString().padStart(2,'0');
document.getElementById('focusTimerDisplay').innerText = `${m}:${s}`;
}
function exitFocusMode() {
clearInterval(focusTimerInterval);
focusTimerIsRunning = false;
document.getElementById('focusModeOverlay').classList.remove('active');
switchSection('projects');
}
function pushActivityLog(m) {
activityLogs.unshift({ m, t: new Date().toLocaleTimeString() });
if(activityLogs.length > 40) activityLogs.pop();
localStorage.setItem('pm_activityLogs', JSON.stringify(activityLogs));
renderActivityLogs();
}
function renderActivityLogs() {
const c = document.getElementById('activityLogsContainer');
if(c) {
c.innerHTML = activityLogs.map(l => `
<div class="log-item"><span>${escapeHtml(l.m)}</span><span style="color:var(--text-tertiary); font-size: 11px;">${l.t}</span></div>`).join('') || `<div class="empty-state" style="padding: 20px !important;">Sin eventos recientes.</div>`;
}
}
function showToast(text, type='success') {
const c = document.getElementById('toastContainer');
const i = document.createElement('div');
i.className = `toast-item toast-${type}`;
const iconHTML = type === 'success'
? `<div style="background:var(--success); color:white; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">✓</div>`
: `<div style="background:var(--danger); color:white; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">!</div>`;
i.innerHTML = `${iconHTML} <span>${escapeHtml(text)}</span>`;
c.appendChild(i);
setTimeout(() => { i.style.opacity = '0'; setTimeout(()=>i.remove(),300); }, 3500);
}
function toggleTheme() {
const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
document.documentElement.setAttribute('data-theme', next);
localStorage.setItem('pm_theme', next);
document.getElementById('themeToggleText').innerText = next === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
}
function applySavedTheme() {
const t = localStorage.getItem('pm_theme') || 'dark';
document.documentElement.setAttribute('data-theme', t);
document.getElementById('themeToggleText').innerText = t === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
}
function logout() {
localStorage.removeItem('pm_currentUser');
localStorage.removeItem('pm_selectedCompanyId');
currentUser = null;
selectedCompanyId = null;
showAuthWrapper();
}
function escapeHtml(str) {
return str ? str.toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;") : '';
}
// Cierre de Menú de Perfil al hacer clic fuera
document.addEventListener('click', function(e) {
if(!e.target.closest('.user-menu-wrap')) {
const dropdown = document.getElementById('userMenuDropdown');
if(dropdown) dropdown.classList.remove('active');
}
});
// Utilidades Modales
function openModal(id) {
// Limpiar inputs genéricos
document.querySelectorAll(`#${id} input:not([type="hidden"]), #${id} textarea`).forEach(i => i.value = '');
document.getElementById(id).classList.add('active');
}
function closeModal(id) {
document.getElementById(id).classList.remove('active');
}


/* === Bloque JS original 7 === */
document.addEventListener('DOMContentLoaded', () => {
setTimeout(() => {
if (typeof renderReportProjects === 'undefined') {
window.renderReportProjects = function() {
const select = document.getElementById('reportProjectSelect');
if (!select || !window.projects) return;
select.innerHTML = '';
projects.forEach(project => {
const option = document.createElement('option');
option.value = project.id;
option.textContent = project.title;
select.appendChild(option);
});
};
renderReportProjects();
}
}, 80);
});
const originalSubmitCreateFinance = window.submitCreateFinance;
window.submitCreateFinance = function() {
const currency = document.getElementById('finCurrency')?.value || 'USD';
const source = document.getElementById('finSource')?.value || 'No especificado';
if (typeof finances !== 'undefined') {
const lastItem = finances[finances.length - 1];
if (lastItem) {
lastItem.currency = currency;
lastItem.source = source;
}
localStorage.setItem('pm_finances', JSON.stringify(finances));
}
if (originalSubmitCreateFinance) {
originalSubmitCreateFinance();
}
};
window.generateSingleProjectPDF = function() {
const projectId = document.getElementById('reportProjectSelect')?.value;
if (!projectId) {
alert('Selecciona un proyecto');
return;
}
const project = projects.find(p => p.id === projectId);
if (!project) {
alert('Proyecto no encontrado');
return;
}
const printArea = document.getElementById('printArea');
let attachmentsHTML = '';
if (project.attachments && project.attachments.length > 0) {
project.attachments.forEach(file => {
if (
file.url &&
(
file.url.startsWith('data:image') ||
file.type.includes('image')
)
) {
attachmentsHTML += `
<div style="
width:100%;
margin-bottom:30px;
page-break-inside:avoid;
text-align:center;
"><img
src="${file.url}"
style="
width:100%;
max-width:700px;
border-radius:12px;
border:2px solid #ddd;
object-fit:contain;
display:block;
margin:auto;
"
><div style="
margin-top:10px;
font-size:14px;
color:#444;
font-weight:600;
">
${file.name || 'Imagen adjunta'}
</div></div>
`;
} else {
attachmentsHTML += `
<div class="print-doc-box">
Documento adjunto: ${file.name || 'Archivo'}
</div>
`;
}
});
} else {
attachmentsHTML = '<p>No existen archivos adjuntos.</p>';
}
printArea.innerHTML = `
<div class="print-header"><h1>REPORTE PROFESIONAL DE PROYECTO</h1><h2>${project.title}</h2></div><div class="print-project"><div class="print-project-meta"><div><strong>Estado:</strong> ${project.status}</div><div><strong>Prioridad:</strong> ${project.priority}</div></div><div class="print-project-desc">
${project.description || 'Sin descripción'}
</div><h3 style="margin-bottom:20px;">Evidencias y Fotografías</h3><div class="print-img-container">
${attachmentsHTML}
</div></div>
`;
window.print();
};


/* === Bloque JS original 8 === */
window.currentUploadedFileData = null;
window.handleLocalFileUpload = function(event) {
const file = event.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = function(e) {
window.currentUploadedFileData = {
name: file.name,
url: e.target.result,
type: file.type || 'archivo'
};
document.getElementById('newMediaName').value = file.name;
if (file.type.startsWith('image')) {
document.getElementById('newMediaType').value = 'imagen';
} else {
document.getElementById('newMediaType').value = 'documento';
}
document.getElementById('newMediaUrl').value = e.target.result;
alert('Archivo cargado correctamente');
};
reader.readAsDataURL(file);
};
window.addAttachmentToDraft = function() {
const name = document.getElementById('newMediaName').value;
const url = document.getElementById('newMediaUrl').value;
const type = document.getElementById('newMediaType').value;
if (!name || !url) {
alert('Debes seleccionar un archivo primero');
return;
}
const projectTitle = document.getElementById('detailProjTitle')?.innerText;
const project = projects.find(p => p.title === projectTitle);
if (!project) {
alert('Proyecto no encontrado');
return;
}
if (!project.attachments) {
project.attachments = [];
}
project.attachments.push({
id: 'att_' + Date.now(),
name,
url,
type
});
localStorage.setItem('pm_projects', JSON.stringify(projects));
renderProjectAttachments(project);
alert('Archivo adjuntado correctamente');
};
window.renderProjectAttachments = function(project) {
const grid = document.getElementById('detailMediaGrid');
if (!grid) return;
grid.innerHTML = '';
if (!project.attachments || project.attachments.length === 0) {
grid.innerHTML = '<p style="color:var(--text-secondary);">No hay archivos adjuntos.</p>';
return;
}
project.attachments.forEach(file => {
let preview = '';
if (file.url && file.url.startsWith('data:image')) {
preview = `<img src="${file.url}" style="width:100%; height:90px; object-fit:cover; border-radius:6px;">`;
} else {
preview = `<div class="media-thumb-placeholder">ARCHIVO</div>`;
}
grid.innerHTML += `
<div class="media-item-card">
${preview}
<span>${file.name}</span></div>
`;
});
};


/* === Bloque JS original 9 === */
window.populateReportProjects = function() {
const select = document.getElementById('reportProjectSelect');
if (!select) return;
select.innerHTML = '';
if (!projects || projects.length === 0) {
const option = document.createElement('option');
option.textContent = 'No existen proyectos';
option.value = '';
select.appendChild(option);
return;
}
projects.forEach(project => {
const option = document.createElement('option');
option.value = project.id;
option.textContent = project.title;
select.appendChild(option);
});
};
document.addEventListener('DOMContentLoaded', () => {
setTimeout(() => {
populateReportProjects();
}, 90);
});
const originalSwitchSection = window.switchSection;
window.switchSection = function(sectionId) {
if (originalSwitchSection) {
originalSwitchSection(sectionId);
}
if (sectionId === 'reports') {
setTimeout(() => {
populateReportProjects();
}, 300);
}
};


/* === Bloque JS original 10 === */
window.pendingProjectFiles = [];
document.addEventListener('DOMContentLoaded', () => {
setTimeout(() => {
const fileInput = document.getElementById('projectFilesInput');
if (fileInput) {
fileInput.addEventListener('change', async function(event) {
const files = Array.from(event.target.files);
window.pendingProjectFiles = [];
const preview = document.getElementById('projectFilesPreview');
if (preview) {
preview.innerHTML = '';
}
for (const file of files) {
const pushPendingFile = function(dataUrl) {
const fileData = {
id: 'proj_file_' + Date.now() + Math.random(),
name: file.name,
url: dataUrl,
type: file.type || 'archivo'
};
window.pendingProjectFiles.push(fileData);
if (preview) {
preview.innerHTML += `
<div style="
padding:10px;
margin-bottom:10px;
border:1px solid var(--border);
border-radius:8px;
background:var(--bg-primary);
font-size:13px;
">
📎 ${file.name}
</div>
`;
}
};
if (String(file.type || '').startsWith('image/') && typeof fileToDataUrl === 'function') {
fileToDataUrl(file).then(pushPendingFile).catch(function(){
const reader = new FileReader();
reader.onload = function(e) { pushPendingFile(e.target.result); };
reader.readAsDataURL(file);
});
} else {
const reader = new FileReader();
reader.onload = function(e) { pushPendingFile(e.target.result); };
reader.readAsDataURL(file);
}
}
});
}
}, 120);
});
const originalSubmitProjectForm = window.submitProjectForm;
window.submitProjectForm = function() {
const editingId = document.getElementById('editProjectId')?.value;
setTimeout(() => {
let targetProject = null;
if (editingId) {
targetProject = projects.find(p => p.id === editingId);
} else {
targetProject = projects[projects.length - 1];
}
if (targetProject) {
if (!targetProject.attachments) {
targetProject.attachments = [];
}
if (window.pendingProjectFiles.length > 0) {
targetProject.attachments.push(...window.pendingProjectFiles);
localStorage.setItem('pm_projects', JSON.stringify(projects));
window.pendingProjectFiles = [];
}
}
}, 500);
if (originalSubmitProjectForm) {
originalSubmitProjectForm();
}
};
window.calculateGlobalBalanceConversion = function() {
const target = document.getElementById('globalCurrencySelect').value;
const rates = {
USD: 1,
GTQ: 7.8,
EUR: 0.92,
MXN: 17.1,
COP: 3900
};
let totalUSD = 0;
const savedFinances = JSON.parse(localStorage.getItem('pm_finances') || '[]');
if (!savedFinances || savedFinances.length === 0) {
document.getElementById('globalConvertedResult').innerHTML = `
No existen transacciones registradas
`;
return;
}
savedFinances.forEach(fin => {
const amount = parseFloat(fin.amount || fin.net || 0);
const currency = fin.currency || 'USD';
let usdValue = amount;
if (currency === 'GTQ') usdValue = amount / 7.8;
if (currency === 'EUR') usdValue = amount / 0.92;
if (currency === 'MXN') usdValue = amount / 17.1;
if (currency === 'COP') usdValue = amount / 3900;
if (
fin.type === 'egreso' ||
fin.type === 'expense'
) {
usdValue *= -1;
}
totalUSD += usdValue;
});
let converted = totalUSD;
if (target === 'GTQ') converted = totalUSD * 7.8;
if (target === 'EUR') converted = totalUSD * 0.92;
if (target === 'MXN') converted = totalUSD * 17.1;
if (target === 'COP') converted = totalUSD * 3900;
document.getElementById('globalConvertedResult').innerHTML = `
<div style="font-size:16px; margin-bottom:10px;">
Balance Global Convertido
</div><div style="font-size:34px; font-weight:800;">
${converted.toLocaleString(undefined, {
minimumFractionDigits: 2,
maximumFractionDigits: 2
})} ${target}
</div>
`;
};


/* === Bloque JS original 11 === */
document.addEventListener('DOMContentLoaded',()=>{
const analytics = document.getElementById('enterpriseDashboardAnalytics');
const dashboard = document.getElementById('dashboard');
function syncAnalytics(){
if(!analytics) return;
if(!dashboard){
analytics.style.display='none';
return;
}
const visible =
dashboard.classList.contains('active') ||
dashboard.style.display === 'block' ||
dashboard.style.display === '';
analytics.style.display = visible ? 'block' : 'none';
}
syncAnalytics();
if(dashboard && 'MutationObserver' in window){
new MutationObserver(syncAnalytics).observe(dashboard,{attributes:true,attributeFilter:['class','style']});
}
document.addEventListener('click',()=>window.requestAnimationFrame(syncAnalytics),{passive:true});
window.addEventListener('resize',()=>window.requestAnimationFrame(syncAnalytics),{passive:true});
});


/* === Bloque JS original 12 === */
(function(){
function pmHideStartupLoaders(){
const splash = document.getElementById('pmSplash');
const loader = document.getElementById('pmLoader');
[splash, loader].forEach(el => {
if(!el) return;
el.classList.add('hidden');
el.style.pointerEvents = 'none';
window.setTimeout(() => { el.style.display = 'none'; }, 220);
});
}
function pmRunIdle(fn, fallbackDelay){
const runner = () => { try { fn(); } catch(error) { console.warn('ProManage init:', error); } };
if('requestIdleCallback' in window) requestIdleCallback(runner, { timeout: fallbackDelay || 900 });
else window.setTimeout(runner, fallbackDelay || 160);
}
if(document.readyState === 'loading'){
document.addEventListener('DOMContentLoaded', () => window.setTimeout(pmHideStartupLoaders, 60), { once:true });
}else{
window.setTimeout(pmHideStartupLoaders, 0);
}
window.addEventListener('load', pmHideStartupLoaders, { once:true });
window.addEventListener('load',()=>{
if(window.lucide) pmRunIdle(()=>lucide.createIcons(), 220);
pmRunIdle(()=>{ if(typeof initGlobalSearch === 'function') initGlobalSearch(); }, 260);
pmRunIdle(()=>{ if(typeof initLocalPreferences === 'function') initLocalPreferences(); }, 300);
pmRunIdle(()=>{ if(window.Chart && typeof initPremiumCharts === 'function') initPremiumCharts(); }, 520);
pmRunIdle(()=>{ if(window.anime && typeof premiumRevealAnimations === 'function') premiumRevealAnimations(); }, 620);
},{ once:true });
})();
function premiumRevealAnimations(){
if(!window.anime) return;
anime({
targets:'.panel,.card,.stats-card,.pm-kpi,.pm-chart-card',
translateY:[18,0],
opacity:[0,1],
delay:anime.stagger(60),
duration:700,
easing:'easeOutExpo'
});
}
function initPremiumCharts(){
if(!window.Chart) return;
const financeCanvas = document.getElementById('financeChart');
const projectsCanvas = document.getElementById('projectsChart');
if(!financeCanvas || !projectsCanvas) return;
if(window.premiumChartsInitialized) return;
window.premiumChartsInitialized = true;
const finances = JSON.parse(localStorage.getItem('pm_finances') || '[]');
const projects = JSON.parse(localStorage.getItem('pm_projects') || '[]');
let ingresos = 0;
let egresos = 0;
finances.forEach(f=>{
const amount = parseFloat(f.amount || f.net || 0);
if(
f.type === 'egreso' ||
f.type === 'expense'
){
egresos += amount;
}else{
ingresos += amount;
}
});
new Chart(financeCanvas,{
type:'bar',
data:{
labels:['Ingresos','Egresos'],
datasets:[{
data:[ingresos,egresos],
borderRadius:16,
backgroundColor:[
'rgba(6,182,212,.75)',
'rgba(139,92,246,.75)'
]
}]
},
options:{
responsive:true,
plugins:{
legend:{display:false}
},
scales:{
x:{
ticks:{color:'#94a3b8'},
grid:{display:false}
},
y:{
ticks:{color:'#94a3b8'},
grid:{color:'rgba(255,255,255,.05)'}
}
}
}
});
const completed = projects.filter(p =>
String(p.status || '').toLowerCase().includes('complet')
).length;
const active = projects.filter(p =>
String(p.status || '').toLowerCase().includes('activo') ||
String(p.status || '').toLowerCase().includes('progreso')
).length;
const pending = Math.max(projects.length - completed - active,0);
new Chart(projectsCanvas,{
type:'doughnut',
data:{
labels:['Completados','Activos','Pendientes'],
datasets:[{
data:[completed,active,pending],
backgroundColor:[
'#06b6d4',
'#6366f1',
'#8b5cf6'
],
borderWidth:0
}]
},
options:{
responsive:true,
plugins:{
legend:{
labels:{
color:'#f8fafc'
}
}
}
}
});
}
function initGlobalSearch(){
const input = document.getElementById('globalSearchInput');
if(!input) return;
input.addEventListener('input',()=>{
const term = input.value.toLowerCase();
document.querySelectorAll('.project-card,.client-card,.employee-card,tr').forEach(el=>{
const text = el.innerText.toLowerCase();
el.style.display =
text.includes(term)
? ''
: 'none';
});
});
}
function initLocalPreferences(){
localStorage.setItem(
'pm_last_visit',
new Date().toISOString()
);
}
window.exportProjectsExcel = function(){
if(!window.XLSX){
if(typeof showToast === 'function') showToast('El exportador Excel aún está cargando. Intenta de nuevo en unos segundos.', 'error');
return;
}
const projects = JSON.parse(localStorage.getItem('pm_projects') || '[]');
const ws = XLSX.utils.json_to_sheet(projects);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Projects');
XLSX.writeFile(wb, 'ProManage_Projects.xlsx');
premiumToast('Excel exportado correctamente');
};
function premiumToast(message){
let wrap = document.getElementById('premiumToastWrap');
if(!wrap){
wrap = document.createElement('div');
wrap.id = 'premiumToastWrap';
wrap.style.cssText = `
position:fixed;
top:20px;
right:20px;
z-index:999999999;
display:flex;
flex-direction:column;
gap:12px;
`;
document.body.appendChild(wrap);
}
const toast = document.createElement('div');
toast.style.cssText = `
min-width:320px;
background:rgba(17,24,39,.88);
backdrop-filter:blur(16px);
border:1px solid rgba(255,255,255,.05);
border-radius:20px;
padding:18px;
box-shadow:0 10px 30px rgba(0,0,0,.3);
color:#fff;
`;
toast.innerHTML = `
<div style="font-weight:700;margin-bottom:6px;">
ProManage Enterprise
</div><div style="color:#94a3b8;">
${message}
</div><div style="
height:4px;
margin-top:14px;
border-radius:999px;
overflow:hidden;
background:rgba(255,255,255,.05);
"><div style="
width:100%;
height:100%;
background:linear-gradient(90deg,#6366f1,#06b6d4);
animation:toastProgress 4s linear forwards;
"></div></div>
`;
wrap.appendChild(toast);
setTimeout(()=>{
toast.remove();
},4000);
}
function openCommandPalette(){
let palette = document.getElementById('pmPalette');
if(!palette){
palette = document.createElement('div');
palette.id = 'pmPalette';
palette.style.cssText = `
position:fixed;
inset:0;
background:rgba(0,0,0,.72);
backdrop-filter:blur(10px);
display:flex;
align-items:flex-start;
justify-content:center;
padding-top:10vh;
z-index:999999999;
`;
palette.innerHTML = `
<div style="
width:min(760px,92vw);
background:#111827;
border-radius:24px;
overflow:hidden;
border:1px solid rgba(255,255,255,.05);
"><input
id="paletteSearch"
placeholder="Buscar acciones..."
style="
width:100%;
padding:24px;
background:transparent;
border:none;
color:#fff;
font-size:18px;
"
><div id="paletteResults"></div></div>
`;
document.body.appendChild(palette);
const actions = [
['Abrir Finanzas','finances'],
['Abrir Dashboard','dashboard'],
['Abrir Reportes','reports'],
['Abrir Pomodoro','pomodoro']
];
const results = palette.querySelector('#paletteResults');
actions.forEach(a=>{
const item = document.createElement('div');
item.style.cssText = `
padding:18px 24px;
border-top:1px solid rgba(255,255,255,.04);
cursor:pointer;
color:#fff;
`;
item.innerText = a[0];
item.onclick = ()=>{
if(typeof switchSection === 'function'){
switchSection(a[1]);
}
palette.remove();
};
results.appendChild(item);
});
}
}
document.addEventListener('keydown',(e)=>{
if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){
e.preventDefault();
openCommandPalette();
}
});


/* === Bloque JS original 13 === */
window.addEventListener('load',()=>{
const html=document.documentElement;
const saved=localStorage.getItem('theme')||localStorage.getItem('pm_theme')||'dark';
html.setAttribute('data-theme',saved);
const runCharts = () => {
if(typeof window.renderMinimalCharts === 'function') {
window.renderMinimalCharts();
return;
}
if(typeof Chart==='undefined') return;
Chart.defaults.color='#94a3b8';
Chart.defaults.borderColor='rgba(255,255,255,.08)';
const proj=document.getElementById('projectsModernChart');
if(proj && !Chart.getChart(proj)){
new Chart(proj,{
type:'doughnut',
data:{labels:['Pendientes','En proceso','Completados'],
datasets:[{data:[12,19,7],backgroundColor:['#f59e0b','#06b6d4','#10b981'],borderWidth:0}]},
options:{responsive:true,plugins:{legend:{position:'bottom'}}}
});
}
const fin=document.getElementById('financeModernChart');
if(fin && !Chart.getChart(fin)){
new Chart(fin,{
type:'line',
data:{labels:['Ene','Feb','Mar','Abr','May','Jun'],
datasets:[{label:'Balance',data:[12,19,9,22,18,31],tension:.45,fill:true,
backgroundColor:'rgba(124,58,237,.15)',borderColor:'#7c3aed'}]},
options:{responsive:true}
});
}
};
if('requestIdleCallback' in window) requestIdleCallback(runCharts,{timeout:1200});
else setTimeout(runCharts,260);
},{ once:true });


/* === Bloque JS original 14 === */
(function(){
"use strict";
const STORAGE_KEYS = {
projects: "pm_projects",
members: "pm_members",
employees: "pm_employees",
clients: "pm_clients",
finances: "pm_finances",
inventory: "pm_inventory",
activity: "pm_activityLogs",
companies: "pm_companies"
};
function readJson(key, fallback) {
try {
const value = localStorage.getItem(key);
return value ? JSON.parse(value) : fallback;
} catch (error) {
console.warn("No se pudo leer", key, error);
return fallback;
}
}
function getData(name) {
const globalValue = window[name];
if (Array.isArray(globalValue)) return globalValue;
return readJson(STORAGE_KEYS[name], []);
}
function currentCompanyId() {
return window.selectedCompanyId || localStorage.getItem("pm_selectedCompanyId") || "";
}
function filterCompany(items) {
const companyId = currentCompanyId();
if (!companyId) return items;
return items.filter(item => !item.companyId || item.companyId === companyId);
}
function formatCurrency(value) {
const amount = Number(value || 0);
return amount.toLocaleString("es-GT", {
style: "currency",
currency: "USD",
maximumFractionDigits: 2
});
}
function normalize(value) {
return String(value ?? "")
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.toLowerCase()
.trim();
}
function updateThemeText(theme) {
const label = document.getElementById("themeToggleText");
if (label) label.innerText = theme === "dark" ? "Modo Claro" : "Modo Oscuro";
}
function applyTheme(theme) {
const safeTheme = theme === "light" ? "light" : "dark";
document.documentElement.setAttribute("data-theme", safeTheme);
document.body?.setAttribute("data-theme", safeTheme);
localStorage.setItem("pm_theme", safeTheme);
localStorage.setItem("theme", safeTheme);
updateThemeText(safeTheme);
refreshChartDefaults();
setTimeout(renderMinimalCharts, 80);
}
window.toggleTheme = function() {
const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
applyTheme(current === "dark" ? "light" : "dark");
};
window.applySavedTheme = function() {
applyTheme(localStorage.getItem("pm_theme") || localStorage.getItem("theme") || "dark");
};
function refreshChartDefaults() {
if (typeof Chart === "undefined") return;
const styles = getComputedStyle(document.documentElement);
Chart.defaults.color = styles.getPropertyValue("--text-secondary").trim() || "#a3a3a3";
Chart.defaults.borderColor = styles.getPropertyValue("--border").trim() || "#27272a";
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
}
function chartColors() {
const styles = getComputedStyle(document.documentElement);
return {
accent: styles.getPropertyValue("--accent").trim() || "#3b82f6",
success: styles.getPropertyValue("--success").trim() || "#22c55e",
warning: styles.getPropertyValue("--warning").trim() || "#f59e0b",
danger: styles.getPropertyValue("--danger").trim() || "#ef4444",
muted: styles.getPropertyValue("--text-muted").trim() || "#737373",
border: styles.getPropertyValue("--border").trim() || "#27272a"
};
}
function destroyChart(canvas) {
if (!canvas || typeof Chart === "undefined") return;
const existing = Chart.getChart(canvas);
if (existing) existing.destroy();
}
window.renderMinimalCharts = function() {
if (typeof Chart === "undefined") return;
const now = Date.now();
if (window.__pmMinimalChartsLastRender && now - window.__pmMinimalChartsLastRender < 450) return;
window.__pmMinimalChartsLastRender = now;
refreshChartDefaults();
const colors = chartColors();
const finances = filterCompany(getData("finances"));
const projects = filterCompany(getData("projects"));
const financeCanvas = document.getElementById("financeModernChart");
if (financeCanvas) {
destroyChart(financeCanvas);
let ingresos = 0;
let egresos = 0;
finances.forEach(item => {
const amount = Number(item.amount || item.net || item.total || 0);
const type = normalize(item.type || item.tipo || "");
if (type.includes("egreso") || type.includes("expense") || type.includes("costo")) {
egresos += amount;
} else {
ingresos += amount;
}
});
new Chart(financeCanvas, {
type: "bar",
data: {
labels: ["Ingresos", "Egresos", "Balance"],
datasets: [{
label: "Monto",
data: [ingresos, egresos, ingresos - egresos],
backgroundColor: [colors.success, colors.danger, colors.accent],
borderRadius: 10,
maxBarThickness: 38
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { display: false },
tooltip: {
callbacks: {
label: context => formatCurrency(context.raw)
}
}
},
scales: {
x: { grid: { display: false } },
y: {
beginAtZero: true,
ticks: {
callback: value => Number(value).toLocaleString("es-GT")
}
}
}
}
});
}
const projectsCanvas = document.getElementById("projectsModernChart");
if (projectsCanvas) {
destroyChart(projectsCanvas);
const completed = projects.filter(p => normalize(p.status).includes("complet")).length;
const active = projects.filter(p => normalize(p.status).includes("proceso") || normalize(p.status).includes("activo")).length;
const pending = Math.max(projects.length - completed - active, 0);
new Chart(projectsCanvas, {
type: "doughnut",
data: {
labels: ["En proceso", "Completados", "Pendientes"],
datasets: [{
data: [active, completed, pending],
backgroundColor: [colors.accent, colors.success, colors.muted],
borderColor: getComputedStyle(document.documentElement).getPropertyValue("--bg-secondary").trim() || "#111",
borderWidth: 3,
hoverOffset: 4
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
cutout: "68%",
plugins: {
legend: {
position: "bottom",
labels: {
boxWidth: 10,
boxHeight: 10,
usePointStyle: true
}
}
}
}
});
}
};
function getSearchItems() {
const sectionMap = {
projects: "projects",
members: "team",
employees: "employees",
clients: "clients",
finances: "finances",
inventory: "inventory"
};
const items = [];
filterCompany(getData("projects")).forEach(project => {
items.push({
type: "Proyecto",
title: project.title || project.name || "Proyecto sin nombre",
meta: [project.status, project.priority, project.description].filter(Boolean).join(" · "),
section: sectionMap.projects
});
});
filterCompany(getData("members")).forEach(member => {
items.push({
type: "Especialista",
title: member.name || "Especialista",
meta: member.role || member.specialty || "",
section: sectionMap.members
});
});
filterCompany(getData("employees")).forEach(employee => {
items.push({
type: "Empleado",
title: employee.name || "Empleado",
meta: [employee.position, employee.dept, employee.status].filter(Boolean).join(" · "),
section: sectionMap.employees
});
});
filterCompany(getData("clients")).forEach(client => {
items.push({
type: "Cliente",
title: client.name || client.company || "Cliente",
meta: [client.email, client.phone].filter(Boolean).join(" · "),
section: sectionMap.clients
});
});
filterCompany(getData("finances")).forEach(finance => {
items.push({
type: "Finanza",
title: finance.category || finance.concept || finance.description || "Movimiento financiero",
meta: [finance.type, formatCurrency(finance.amount || finance.net || 0), finance.date].filter(Boolean).join(" · "),
section: sectionMap.finances
});
});
filterCompany(getData("inventory")).forEach(item => {
items.push({
type: "Inventario",
title: item.product || item.name || "Artículo",
meta: [item.category, item.stock ? `Stock: ${item.stock}` : "", item.price ? formatCurrency(item.price) : ""].filter(Boolean).join(" · "),
section: sectionMap.inventory
});
});
return items;
}
window.toggleGlobalSearchPanel = function(force) {
const shell = document.getElementById("pageSearchShell");
const input = document.getElementById("globalSearchInput");
if (!shell || !input) return;
const shouldOpen = typeof force === "boolean" ? force : !shell.classList.contains("active");
shell.classList.toggle("active", shouldOpen);
if (shouldOpen) {
setTimeout(() => input.focus(), 30);
performGlobalSearch(input.value);
} else {
input.value = "";
performGlobalSearch("");
}
};
function resetCurrentRows() {
document.querySelectorAll(".pm-search-hidden").forEach(el => el.classList.remove("pm-search-hidden"));
}
function filterVisibleRows(term) {
resetCurrentRows();
if (!term) return;
const activeSection = document.querySelector(".section.active");
if (!activeSection) return;
activeSection.querySelectorAll("tbody tr, .project-card").forEach(el => {
const match = normalize(el.innerText).includes(term);
el.classList.toggle("pm-search-hidden", !match);
});
}
window.performGlobalSearch = function(rawValue) {
const shell = document.getElementById("pageSearchShell");
const results = document.getElementById("globalSearchResults");
const query = normalize(rawValue);
if (!shell || !results) return;
shell.classList.toggle("has-query", Boolean(query));
if (!query) {
results.innerHTML = '<div class="search-empty-item">Escribe para buscar proyectos, clientes, empleados, finanzas o inventario.</div>';
shell.classList.remove("has-results");
resetCurrentRows();
return;
}
const found = getSearchItems()
.map(item => ({
...item,
haystack: normalize(`${item.type} ${item.title} ${item.meta}`)
}))
.filter(item => item.haystack.includes(query))
.slice(0, 10);
filterVisibleRows(query);
if (!found.length) {
results.innerHTML = '<div class="search-empty-item">No encontré coincidencias con esa búsqueda.</div>';
shell.classList.remove("has-results");
return;
}
shell.classList.add("has-results");
results.innerHTML = found.map((item, index) => `
<button type="button" class="search-result-item" data-result-index="${index}"><span class="search-result-type">${item.type}</span><span class="search-result-title">${escapeForSearch(item.title)}</span><span class="search-result-meta">${escapeForSearch(item.meta || "Abrir módulo")}</span></button>
`).join("");
results.querySelectorAll(".search-result-item").forEach((button, index) => {
button.addEventListener("click", () => {
const item = found[index];
if (typeof window.switchSection === "function") {
window.switchSection(item.section);
}
setTimeout(() => filterVisibleRows(query), 120);
toggleGlobalSearchPanel(true);
});
});
};
function escapeForSearch(value) {
return String(value ?? "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}
window.initGlobalSearch = function() {
const shell = document.getElementById("pageSearchShell");
const input = document.getElementById("globalSearchInput");
if (!shell || !input) return;
performGlobalSearch(input.value || "");
};
window.exportProjectsExcel = function() {
if (typeof XLSX === "undefined") {
alert("No se encontró la librería XLSX. Revisa tu conexión a internet y vuelve a intentar.");
return;
}
const workbook = XLSX.utils.book_new();
const datasets = [
["Proyectos", getData("projects")],
["Finanzas", getData("finances")],
["Clientes", getData("clients")],
["Empleados", getData("employees")],
["Especialistas", getData("members")],
["Inventario", getData("inventory")],
["Actividad", getData("activity")],
["Organizaciones", getData("companies")]
];
datasets.forEach(([sheetName, rows]) => {
const safeRows = Array.isArray(rows) && rows.length ? rows : [{ mensaje: "Sin registros" }];
const worksheet = XLSX.utils.json_to_sheet(safeRows.map(row => ({ ...row })));
XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
});
const today = new Date().toISOString().slice(0, 10);
XLSX.writeFile(workbook, `ProManage_Exportacion_Completa_${today}.xlsx`);
if (typeof window.premiumToast === "function") {
window.premiumToast("Excel completo exportado");
} else if (typeof window.showToast === "function") {
window.showToast("Excel completo exportado", "success");
}
};
function removeOrphanVisuals() {
document.querySelector(".pm-header")?.remove();
document.getElementById("enterpriseDashboardAnalytics")?.remove();
document.querySelectorAll(".hamburger-btn, .pm-command-trigger").forEach(el => el.remove());
const projectsSection = document.getElementById("section-projects");
const projectPanel = document.querySelector(".projects-chart-panel");
if (projectsSection && projectPanel && projectPanel.parentElement !== projectsSection) {
projectsSection.appendChild(projectPanel);
}
}
const originalSwitchSection = window.switchSection;
if (typeof originalSwitchSection === "function") {
window.switchSection = function(sectionId) {
const result = originalSwitchSection.apply(this, arguments);
setTimeout(() => {
renderMinimalCharts();
initGlobalSearch();
}, 80);
return result;
};
}
document.addEventListener("click", function(event) {
const shell = document.getElementById("pageSearchShell");
if (shell && !shell.contains(event.target)) {
shell.classList.remove("active", "has-results", "has-query");
resetCurrentRows();
const input = document.getElementById("globalSearchInput");
if (input) input.value = "";
}
});
document.addEventListener("keydown", function(event) {
if (event.key === "Escape") {
const shell = document.getElementById("pageSearchShell");
if (shell?.classList.contains("active")) {
event.preventDefault();
toggleGlobalSearchPanel(false);
}
}
});
document.addEventListener("DOMContentLoaded", function() {
removeOrphanVisuals();
applySavedTheme();
initGlobalSearch();
const renderOnce = () => {
if(window.__pmInitialMinimalChartsDone) return;
window.__pmInitialMinimalChartsDone = true;
renderMinimalCharts();
};
if('requestIdleCallback' in window) requestIdleCallback(renderOnce,{timeout:700});
else setTimeout(renderOnce,180);
if (window.lucide) {
window.requestAnimationFrame(() => window.lucide.createIcons());
}
});
window.addEventListener("load", function() {
removeOrphanVisuals();
applySavedTheme();
if(!window.__pmInitialMinimalChartsDone){
if('requestIdleCallback' in window) requestIdleCallback(()=>renderMinimalCharts(),{timeout:900});
else setTimeout(renderMinimalCharts,220);
window.__pmInitialMinimalChartsDone = true;
}
},{ once:true });
})();


/* === Bloque JS original 15 === */
(function(){
"use strict";
const PM_KEYS = [
"pm_users", "pm_companies", "pm_projects", "pm_members", "pm_employees", "pm_clients",
"pm_finances", "pm_inventory", "pm_activityLogs", "pm_currentUser", "pm_selectedCompanyId",
"pm_theme", "pm_enterpriseTimeline", "pm_automation_rules", "pm_manual_backups", "pm_auto_backup"
];
const state = {
simulatorChart: null,
renderTimer: null
};
function readJSON(key, fallback){
try {
const raw = localStorage.getItem(key);
return raw ? JSON.parse(raw) : fallback;
} catch(error){
console.warn("ProManage Enterprise: error leyendo", key, error);
return fallback;
}
}
function writeJSON(key, value){
localStorage.setItem(key, JSON.stringify(value));
}
function getCompanyId(){
try {
if (typeof selectedCompanyId !== "undefined" && selectedCompanyId) return selectedCompanyId;
} catch(error) {}
return localStorage.getItem("pm_selectedCompanyId") || "";
}
function getRows(key){
const rows = readJSON(key, []);
return Array.isArray(rows) ? rows : [];
}
function scoped(rows){
const cid = getCompanyId();
if (!cid) return rows;
return rows.filter(row => !row.companyId || row.companyId === cid);
}
function projectsData(){ return scoped(getRows("pm_projects")); }
function financesData(){ return scoped(getRows("pm_finances")); }
function employeesData(){ return scoped(getRows("pm_employees")); }
function clientsData(){ return scoped(getRows("pm_clients")); }
function membersData(){ return scoped(getRows("pm_members")); }
function inventoryData(){ return scoped(getRows("pm_inventory")); }
function logsData(){ return getRows("pm_activityLogs"); }
function timelineData(){ return scoped(getRows("pm_enterpriseTimeline")); }
function normalize(value){
return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function safe(value){
return String(value ?? "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}
function money(value, currency="GTQ"){
const n = Number(value || 0);
return n.toLocaleString("es-GT", { style:"currency", currency, maximumFractionDigits: 2 });
}
function percent(value){
return `${Math.round(Number(value || 0))}%`;
}
function clamp(value, min=0, max=100){
return Math.max(min, Math.min(max, Number(value || 0)));
}
function parseDate(value){
if (!value) return null;
if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
const raw = String(value).trim();
const direct = new Date(raw);
if (!Number.isNaN(direct.getTime())) return direct;
const match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
if (match) {
const d = Number(match[1]);
const m = Number(match[2]) - 1;
const y = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
const dt = new Date(y, m, d);
if (!Number.isNaN(dt.getTime())) return dt;
}
return null;
}
function isExpense(item){
const t = normalize(item.type || item.tipo || item.kind || "");
return t.includes("egreso") || t.includes("expense") || t.includes("costo") || t.includes("gasto");
}
function financeTotals(){
let ingresos = 0, egresos = 0;
financesData().forEach(item => {
const amount = Math.abs(Number(item.amount || item.net || item.total || 0));
if (isExpense(item)) egresos += amount;
else ingresos += amount;
});
return { ingresos, egresos, balance: ingresos - egresos };
}
function projectProgress(project){
const explicit = Number(project.progress ?? project.avance ?? project.percent ?? NaN);
if (!Number.isNaN(explicit)) return clamp(explicit);
const status = normalize(project.status || project.estado || "");
if (status.includes("complet") || status.includes("pagado") || status.includes("final")) return 100;
if (status.includes("proceso") || status.includes("activo") || status.includes("ejec")) return 58;
if (status.includes("pausa")) return 32;
return 16;
}
function dueDate(project){
return parseDate(project.dueDate || project.deadline || project.endDate || project.fechaFin || project.vencimiento);
}
function projectExpenses(project){
const title = normalize(project.title || project.name || "");
if (!title) return 0;
return financesData().reduce((sum, item) => {
const haystack = normalize(`${item.projectId || ""} ${item.project || ""} ${item.category || ""} ${item.concept || ""} ${item.description || ""}`);
const idMatch = project.id && String(item.projectId || "") === String(project.id);
const titleMatch = haystack && title.length > 3 && haystack.includes(title.slice(0, 18));
return (idMatch || titleMatch) && isExpense(item) ? sum + Math.abs(Number(item.amount || item.net || 0)) : sum;
}, 0);
}
function taskStats(project){
const tasks = Array.isArray(project.tasks) ? project.tasks : [];
if (tasks.length) {
const today = new Date(); today.setHours(0,0,0,0);
const completed = tasks.filter(t => normalize(t.status || t.estado).includes("complet") || t.done === true).length;
const overdue = tasks.filter(t => {
const d = parseDate(t.dueDate || t.deadline || t.vencimiento);
return d && d < today && !(normalize(t.status || t.estado).includes("complet") || t.done === true);
}).length;
return { total: tasks.length, completed, pending: tasks.length - completed, overdue };
}
const progress = projectProgress(project);
return {
total: 1,
completed: progress >= 100 ? 1 : 0,
pending: progress >= 100 ? 0 : 1,
overdue: 0
};
}
function calculateProjectRisk(project){
const progress = projectProgress(project);
const tasks = taskStats(project);
const date = dueDate(project);
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const daysLeft = date ? Math.ceil((date - today) / 86400000) : null;
const budget = Number(project.budget || project.presupuesto || project.estimatedBudget || 0);
const spent = projectExpenses(project);
const budgetUsed = budget > 0 ? clamp((spent / budget) * 100, 0, 160) : null;
const priority = normalize(project.priority || project.prioridad || "media");
let score = 18;
if (progress < 35) score += 20;
if (progress >= 80) score -= 10;
if (tasks.pending > 0) score += Math.min(18, tasks.pending * 6);
if (tasks.overdue > 0) score += Math.min(26, tasks.overdue * 10);
if (daysLeft !== null && daysLeft < 0 && progress < 100) score += 25;
else if (daysLeft !== null && daysLeft <= 3 && progress < 80) score += 12;
if (budgetUsed !== null && budgetUsed > 90 && progress < 100) score += 18;
else if (budgetUsed !== null && budgetUsed > 70) score += 8;
if (priority.includes("alta")) score += 14;
if (normalize(project.status).includes("complet")) score -= 35;
score = clamp(score, 0, 100);
const level = score >= 68 ? "Alto" : score >= 42 ? "Medio" : "Bajo";
const className = score >= 68 ? "pm-risk-high" : score >= 42 ? "pm-risk-medium" : "pm-risk-low";
const recommendations = [];
if (daysLeft !== null && daysLeft < 0 && progress < 100) recommendations.push("Proyecto atrasado: actualiza fecha, responsable o prioridad.");
if (budgetUsed !== null && budgetUsed > 80) recommendations.push("Presupuesto consumido rápidamente: revisa egresos asociados.");
if (progress < 40) recommendations.push("Bajo avance detectado: divide entregables y define próximos hitos.");
if (tasks.pending > 0) recommendations.push("Hay tareas pendientes: enfoca el siguiente ciclo en desbloqueos.");
if (!recommendations.length) recommendations.push("Riesgo controlado: mantén seguimiento semanal y documentación actualizada.");
return { score, level, className, progress, tasks, daysLeft, budget, spent, budgetUsed, recommendations };
}
function calculateHealthScore(){
const projects = projectsData();
const finances = financeTotals();
const logs = logsData();
const risks = projects.map(calculateProjectRisk);
const completed = projects.filter(p => projectProgress(p) >= 100).length;
const active = projects.filter(p => normalize(p.status).includes("proceso") || normalize(p.status).includes("activo")).length;
const overdue = risks.reduce((sum, r) => sum + (r.tasks.overdue || 0) + (r.daysLeft !== null && r.daysLeft < 0 && r.progress < 100 ? 1 : 0), 0);
const progressAvg = projects.length ? projects.reduce((sum, p) => sum + projectProgress(p), 0) / projects.length : 70;
const completionRatio = projects.length ? (completed / projects.length) * 100 : 70;
const financeHealth = finances.ingresos <= 0 && finances.egresos > 0
? 35
: finances.ingresos <= 0
? 62
: clamp(58 + ((finances.balance / Math.max(finances.ingresos, 1)) * 42), 20, 100);
const activityHealth = clamp(42 + logs.length * 1.8, 35, 100);
const riskPenalty = risks.length ? risks.reduce((sum, r) => sum + r.score, 0) / risks.length * .22 : 0;
const score = clamp((progressAvg * .28) + (completionRatio * .20) + (financeHealth * .26) + (activityHealth * .16) + (active ? 8 : 0) - riskPenalty - overdue * 4);
const state = score >= 82 ? "Excelente" : score >= 67 ? "Bueno" : score >= 48 ? "Riesgo" : "Crítico";
const explanations = [];
if (overdue > 0) explanations.push(`El score bajó por ${overdue} tarea/proyecto vencido o atrasado.`);
if (finances.balance >= 0 && finances.ingresos > 0) explanations.push("Tus finanzas mejoraron: el balance actual se mantiene positivo.");
if (finances.balance < 0) explanations.push("El balance financiero está presionando la salud general del sistema.");
if (progressAvg >= 70) explanations.push(`El progreso promedio de proyectos está en ${percent(progressAvg)}.`);
if (activityHealth > 70) explanations.push("La actividad general subió por registros recientes del equipo.");
if (!explanations.length) explanations.push("Aún falta información para generar conclusiones más precisas.");
return { score: Math.round(score), state, progressAvg, completionRatio, financeHealth, activityHealth, overdue, active, completed, totalProjects: projects.length, finances, explanations };
}
function renderHealthScore(){
const health = calculateHealthScore();
const ring = document.getElementById("healthScoreRing");
const value = document.getElementById("healthScoreValue");
const badge = document.getElementById("healthStateBadge");
const indicators = document.getElementById("healthIndicators");
const explanations = document.getElementById("healthExplanations");
if (!ring || !value || !badge) return;
ring.style.setProperty("--score", health.score);
value.textContent = health.score;
badge.textContent = health.state;
badge.className = `pm-state-badge pm-state-${normalize(health.state)}`;
if (indicators) {
indicators.innerHTML = [
["Productividad", percent((health.progressAvg + health.completionRatio) / 2)],
["Balance", money(health.finances.balance)],
["Proyectos", `${health.completed}/${health.totalProjects}`],
["Actividad", percent(health.activityHealth)]
].map(([label, val]) => `<div class="pm-mini-metric"><span>${label}</span><strong>${val}</strong></div>`).join("");
}
if (explanations) {
explanations.innerHTML = health.explanations.map(text => `<div class="pm-insight-item">${safe(text)}</div>`).join("");
}
}
function renderProjectRiskPanel(){
const container = document.getElementById("projectRiskList");
const summary = document.getElementById("projectRiskSummary");
if (!container) return;
const projects = projectsData();
const risks = projects.map(project => ({ project, risk: calculateProjectRisk(project) }));
const low = risks.filter(x => x.risk.level === "Bajo").length;
const medium = risks.filter(x => x.risk.level === "Medio").length;
const high = risks.filter(x => x.risk.level === "Alto").length;
const avg = risks.length ? risks.reduce((sum, x) => sum + x.risk.score, 0) / risks.length : 0;
if (summary) {
summary.innerHTML = [
["Riesgo bajo", low],
["Riesgo medio", medium],
["Riesgo alto", high],
["Índice riesgo", percent(avg)]
].map(([label, val]) => `<div class="pm-mini-metric"><span>${label}</span><strong>${val}</strong></div>`).join("");
}
if (!projects.length) {
container.innerHTML = `<div class="pm-insight-item"><strong>Sin proyectos.</strong> Crea proyectos para activar el análisis de riesgo.</div>`;
return;
}
container.innerHTML = risks
.sort((a,b) => b.risk.score - a.risk.score)
.map(({ project, risk }) => {
const days = risk.daysLeft === null ? "Sin fecha" : risk.daysLeft < 0 ? `${Math.abs(risk.daysLeft)} días tarde` : `${risk.daysLeft} días`;
const budget = risk.budgetUsed === null ? "Sin presupuesto" : percent(risk.budgetUsed);
return `
<article class="pm-risk-card"><div class="pm-risk-title"><h4>${safe(project.title || project.name || "Proyecto")}</h4><span class="pm-risk-chip ${risk.className}">Riesgo ${risk.level}</span></div><span class="pm-muted-note">Avance estimado: ${percent(risk.progress)}</span><div class="pm-progress-track"><div class="pm-progress-fill" style="--value:${clamp(risk.progress)}%"></div></div><div class="pm-risk-facts"><div>Pendientes<strong>${risk.tasks.pending}</strong></div><div>Vencidas<strong>${risk.tasks.overdue}</strong></div><div>Tiempo restante<strong>${days}</strong></div><div>Presupuesto usado<strong>${budget}</strong></div></div><div class="pm-recommendation"><strong>Recomendación:</strong> ${safe(risk.recommendations[0])}</div></article>`;
}).join("");
}
function estimateMonthlyAverages(){
const rows = financesData();
if (!rows.length) return { income: 0, expense: 0 };
const now = new Date();
const relevant = rows.filter(row => {
const d = parseDate(row.date || row.fecha);
return !d || ((now - d) / 86400000) <= 95;
});
const used = relevant.length ? relevant : rows;
let income = 0, expense = 0;
used.forEach(row => {
const amount = Math.abs(Number(row.amount || row.net || row.total || 0));
if (isExpense(row)) expense += amount;
else income += amount;
});
const months = Math.max(1, Math.min(3, Math.ceil(used.length / 4)));
return { income: Math.round(income / months), expense: Math.round(expense / months) };
}
function prefillFinancialSimulator(){
const avg = estimateMonthlyAverages();
const income = document.getElementById("simMonthlyIncome");
const expense = document.getElementById("simMonthlyExpense");
const months = document.getElementById("simMonths");
const reduction = document.getElementById("simReduction");
if (income && !Number(income.value)) income.value = avg.income || "";
if (expense && !Number(expense.value)) expense.value = avg.expense || "";
if (months && !Number(months.value)) months.value = 6;
if (reduction && !Number(reduction.value)) reduction.value = 15;
}
function runFinancialSimulator(){
const avg = estimateMonthlyAverages();
const income = Number(document.getElementById("simMonthlyIncome")?.value || avg.income || 0);
const expense = Number(document.getElementById("simMonthlyExpense")?.value || avg.expense || 0);
const months = clamp(Number(document.getElementById("simMonths")?.value || 6), 1, 36);
const reduction = clamp(Number(document.getElementById("simReduction")?.value || 15), 0, 80) / 100;
const labels = Array.from({ length: months }, (_, i) => `Mes ${i + 1}`);
const normal = [];
const optimistic = [];
const critical = [];
let n = 0, o = 0, c = 0;
for (let i = 1; i <= months; i++) {
n += income - expense;
o += (income * 1.06) - (expense * (1 - reduction));
c += (income * .92) - (expense * 1.12);
normal.push(Math.round(n));
optimistic.push(Math.round(o));
critical.push(Math.round(c));
}
renderSimulatorChart(labels, normal, optimistic, critical);
const results = document.getElementById("financialSimulatorResults");
if (results) {
const saved = expense * reduction * months;
const totalExpense = expense * months;
results.innerHTML = `
<div class="pm-scenario-card"><h4>Optimista <span class="pm-scenario-chip pm-risk-low">${money(optimistic.at(-1) || 0)}</span></h4><p>Con ingresos +6% y reducción de gastos de ${Math.round(reduction * 100)}%, podrías cerrar con este balance acumulado.</p></div><div class="pm-scenario-card"><h4>Normal <span class="pm-scenario-chip pm-risk-medium">${money(normal.at(-1) || 0)}</span></h4><p>Si continúas con este ritmo gastarás ${money(totalExpense)} en ${months} meses.</p></div><div class="pm-scenario-card"><h4>Crítico <span class="pm-scenario-chip pm-risk-high">${money(critical.at(-1) || 0)}</span></h4><p>Con ingresos -8% y gastos +12%, el balance podría caer a este escenario.</p></div><div class="pm-insight-item"><strong>Ahorro simulado:</strong> reduciendo gastos ${Math.round(reduction * 100)}% ahorrarías ${money(saved)}.</div>`;
}
}
function renderSimulatorChart(labels, normal, optimistic, critical){
if (typeof Chart === "undefined") return;
const canvas = document.getElementById("financialSimulatorChart");
if (!canvas) return;
if (state.simulatorChart) state.simulatorChart.destroy();
const styles = getComputedStyle(document.documentElement);
const accent = styles.getPropertyValue("--accent").trim() || "#3b82f6";
const success = styles.getPropertyValue("--success").trim() || "#22c55e";
const danger = styles.getPropertyValue("--danger").trim() || "#ef4444";
const text = styles.getPropertyValue("--text-secondary").trim() || "#a3a3a3";
state.simulatorChart = new Chart(canvas, {
type: "line",
data: {
labels,
datasets: [
{ label: "Optimista", data: optimistic, borderColor: success, backgroundColor: "transparent", tension: .35, pointRadius: 2 },
{ label: "Normal", data: normal, borderColor: accent, backgroundColor: "transparent", tension: .35, pointRadius: 2 },
{ label: "Crítico", data: critical, borderColor: danger, backgroundColor: "transparent", tension: .35, pointRadius: 2 }
]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { labels: { color: text, usePointStyle: true, boxWidth: 8 } } },
scales: {
x: { grid: { display: false }, ticks: { color: text } },
y: { ticks: { color: text, callback: value => Number(value).toLocaleString("es-GT") } }
}
}
});
}
function generateInsights(){
const projects = projectsData();
const finances = financesData();
const logs = logsData();
const insights = [];
const totals = financeTotals();
const expenseByCategory = {};
finances.forEach(row => {
if (!isExpense(row)) return;
const cat = row.category || row.concept || "Sin categoría";
expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Math.abs(Number(row.amount || row.net || 0));
});
const topExpense = Object.entries(expenseByCategory).sort((a,b)=>b[1]-a[1])[0];
if (topExpense) insights.push(`<strong>Mayor gasto:</strong> tu categoría con mayor egreso es ${safe(topExpense[0])} con ${money(topExpense[1])}.`);
if (totals.ingresos || totals.egresos) {
const ratio = totals.ingresos ? (totals.egresos / totals.ingresos) * 100 : 100;
insights.push(`<strong>Finanzas:</strong> tus egresos representan ${percent(ratio)} de los ingresos registrados.`);
}
if (projects.length) {
const riskiest = projects.map(p => ({ p, r: calculateProjectRisk(p) })).sort((a,b)=>b.r.score-a.r.score)[0];
insights.push(`<strong>Proyecto crítico:</strong> ${safe(riskiest.p.title || "un proyecto")} tiene riesgo ${riskiest.r.level.toLowerCase()} por ${safe(riskiest.r.recommendations[0])}`);
const completed = projects.filter(p => projectProgress(p) >= 100).length;
insights.push(`<strong>Productividad:</strong> llevas ${completed} de ${projects.length} proyectos completados o finalizados.`);
}
const hourCounts = {};
logs.forEach(log => {
const time = String(log.t || log.time || "");
const hour = Number((time.match(/(\d{1,2}):/) || [])[1]);
if (!Number.isNaN(hour)) hourCounts[hour] = (hourCounts[hour] || 0) + 1;
});
const peak = Object.entries(hourCounts).sort((a,b)=>b[1]-a[1])[0];
if (peak) insights.push(`<strong>Actividad:</strong> tu mayor concentración de actividad aparece alrededor de las ${peak[0]}:00.`);
const afterEight = Object.entries(hourCounts).filter(([h]) => Number(h) >= 20).reduce((s, [,v]) => s + v, 0);
if (afterEight > 2) insights.push(`<strong>Horario:</strong> hay actividad frecuente después de las 8 PM; considera mover tareas críticas a horas de mayor energía.`);
if (!insights.length) insights.push("<strong>Datos insuficientes:</strong> registra proyectos, finanzas y actividad para activar insights más precisos.");
return insights;
}
function renderInsights(){
const box = document.getElementById("smartInsightsList");
if (!box) return;
box.innerHTML = generateInsights().map(i => `<div class="pm-insight-item">${i}</div>`).join("");
}
function defaultRules(){
return [
{ id:"dueTomorrow", title:"Vencimientos cercanos", description:"Si un proyecto vence mañana, muestra alerta interna.", enabled:true },
{ id:"expenseLimit", title:"Límite de gasto", description:"Si un gasto supera el límite definido, marca advertencia.", enabled:true, limit:5000 },
{ id:"projectRisk", title:"Proyecto atrasado", description:"Si un proyecto queda atrasado o con riesgo alto, aumenta prioridad a alta.", enabled:false },
{ id:"goalCelebration", title:"Meta alcanzada", description:"Si la mayoría de proyectos está completada, genera celebración.", enabled:true },
{ id:"autoBackup", title:"Backup automático", description:"Crea una copia local automática diaria del sistema.", enabled:true }
];
}
function getRules(){
const saved = readJSON("pm_automation_rules", null);
if (!Array.isArray(saved)) {
const rules = defaultRules();
writeJSON("pm_automation_rules", rules);
return rules;
}
const defaults = defaultRules();
return defaults.map(d => ({ ...d, ...(saved.find(s => s.id === d.id) || {}) }));
}
function saveRules(rules){
writeJSON("pm_automation_rules", rules);
}
function renderAutomations(){
const list = document.getElementById("automationRulesList");
if (!list) return;
const rules = getRules();
list.innerHTML = rules.map(rule => `
<div class="pm-automation-rule"><div><h4>${safe(rule.title)}</h4><p>${safe(rule.description)}</p>
${rule.id === "expenseLimit" ? `<div class="form-group" style="margin:10px 0 0; max-width:180px;"><label>Límite</label><input type="number" id="expenseLimitInput" value="${Number(rule.limit || 5000)}" onchange="PMEnterprise.updateExpenseLimit(this.value)"></div>` : ""}
</div><button type="button" class="pm-switch ${rule.enabled ? "active" : ""}" aria-label="Activar regla" onclick="PMEnterprise.toggleAutomationRule('${rule.id}')"></button></div>`).join("");
runAutomations(false);
}
function toggleAutomationRule(id){
const rules = getRules().map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule);
saveRules(rules);
renderAutomations();
toast("Regla actualizada");
}
function updateExpenseLimit(value){
const limit = Math.max(0, Number(value || 0));
const rules = getRules().map(rule => rule.id === "expenseLimit" ? { ...rule, limit } : rule);
saveRules(rules);
runAutomations(false);
}
function runAutomations(manual=false){
const alerts = [];
const rules = getRules().filter(r => r.enabled);
const projects = projectsData();
const finances = financesData();
const now = new Date();
const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().slice(0,10);
if (rules.some(r => r.id === "dueTomorrow")) {
projects.forEach(project => {
const d = dueDate(project);
if (d && d.toISOString().slice(0,10) === tomorrowStr && projectProgress(project) < 100) {
alerts.push(`<strong>Vence mañana:</strong> ${safe(project.title)} necesita revisión antes del cierre.`);
}
});
}
const expenseRule = rules.find(r => r.id === "expenseLimit");
if (expenseRule) {
finances.filter(isExpense).forEach(row => {
const amount = Math.abs(Number(row.amount || row.net || 0));
if (amount > Number(expenseRule.limit || 5000)) alerts.push(`<strong>Gasto alto:</strong> ${safe(row.category || "Movimiento")} supera el límite con ${money(amount)}.`);
});
}
if (rules.some(r => r.id === "projectRisk")) {
const allProjects = getRows("pm_projects");
let changed = false;
allProjects.forEach(project => {
if (getCompanyId() && project.companyId !== getCompanyId()) return;
const risk = calculateProjectRisk(project);
if (risk.level === "Alto" && normalize(project.priority) !== "alta") {
project.priority = "alta";
changed = true;
alerts.push(`<strong>Prioridad elevada:</strong> ${safe(project.title)} se marcó como alta por riesgo.`);
}
});
if (changed) {
writeJSON("pm_projects", allProjects);
try { if (typeof projects !== "undefined") projects = allProjects; } catch(error) {}
}
}
if (rules.some(r => r.id === "goalCelebration") && projects.length) {
const completed = projects.filter(p => projectProgress(p) >= 100).length;
if ((completed / projects.length) >= .75) alerts.push(`<strong>Meta alcanzada:</strong> ${completed} de ${projects.length} proyectos están completados. Excelente ritmo.`);
}
if (rules.some(r => r.id === "autoBackup")) createAutoBackup(false);
const box = document.getElementById("automationAlertsList");
if (box) {
box.innerHTML = alerts.length
? alerts.slice(0, 6).map(a => `<div class="pm-automation-alert">${a}</div>`).join("")
: `<div class="pm-automation-alert"><strong>Sin alertas activas.</strong> Las reglas están monitoreando el sistema localmente.</div>`;
}
if (manual) toast(alerts.length ? `Automatizaciones ejecutadas: ${alerts.length} alerta(s)` : "Automatizaciones ejecutadas sin alertas");
return alerts;
}
function addTimelineEvent(message, type="system"){
const rows = getRows("pm_enterpriseTimeline");
rows.unshift({
id: `tl_${Date.now()}_${Math.random().toString(16).slice(2)}`,
companyId: getCompanyId(),
message,
type,
date: new Date().toISOString()
});
writeJSON("pm_enterpriseTimeline", rows.slice(0, 120));
}
function renderTimeline(){
const box = document.getElementById("advancedTimeline");
if (!box) return;
let rows = timelineData();
if (!rows.length) {
const logs = logsData().slice(0, 12).map((log, index) => ({
message: log.m || log.message || "Actividad registrada",
date: new Date(Date.now() - index * 3600000).toISOString(),
type: "legacy"
}));
rows = logs;
}
if (!rows.length) {
box.innerHTML = `<div class="pm-timeline-item"><strong>Sin eventos.</strong><small>La línea de tiempo se llenará automáticamente.</small></div>`;
return;
}
box.innerHTML = rows.slice(0, 28).map(row => {
const d = parseDate(row.date) || new Date();
return `<div class="pm-timeline-item"><strong>${safe(row.message)}</strong><small>${d.toLocaleString("es-GT", { dateStyle:"medium", timeStyle:"short" })}</small></div>`;
}).join("");
}
function getBackupPayload(){
const payload = { exportedAt: new Date().toISOString(), version: "ProManage Enterprise Local Backup", data: {} };
Object.keys(localStorage).forEach(key => {
if (key.startsWith("pm_")) payload.data[key] = localStorage.getItem(key);
});
return payload;
}
function createAutoBackup(force=true){
const currentDay = new Date().toISOString().slice(0,10);
const existing = readJSON("pm_auto_backup", null);
if (!force && existing?.day === currentDay) return;
writeJSON("pm_auto_backup", { day: currentDay, payload: getBackupPayload() });
renderBackupSystem();
}
function createManualBackup(){
const backups = readJSON("pm_manual_backups", []);
backups.unshift({ createdAt: new Date().toISOString(), payload: getBackupPayload() });
writeJSON("pm_manual_backups", backups.slice(0, 5));
renderBackupSystem();
toast("Backup manual creado");
}
function downloadJSON(filename, payload){
const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = filename;
document.body.appendChild(a);
a.click();
a.remove();
URL.revokeObjectURL(url);
}
function exportFullBackupJSON(){
const stamp = new Date().toISOString().slice(0,10);
downloadJSON(`ProManage_Backup_Completo_${stamp}.json`, getBackupPayload());
toast("Backup JSON exportado");
}
function triggerImportBackup(){
document.getElementById("backupImportFile")?.click();
}
function importBackupFile(file){
if (!file) return;
const reader = new FileReader();
reader.onload = () => {
try {
const parsed = JSON.parse(String(reader.result || "{}"));
const data = parsed.data || parsed;
Object.entries(data).forEach(([key, value]) => {
if (key.startsWith("pm_")) localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
});
hydrateGlobalsFromStorage();
renderAll();
if (typeof window.syncDataModelsUI === "function") window.syncDataModelsUI();
toast("Backup importado correctamente");
} catch(error) {
alert("No se pudo importar el JSON. Verifica que sea un backup válido de ProManage.");
}
};
reader.readAsText(file);
}
function restoreLatestAutoBackup(){
const backup = readJSON("pm_auto_backup", null);
if (!backup?.payload?.data) {
alert("Todavía no existe un backup automático disponible.");
return;
}
if (!confirm("¿Restaurar el último backup automático? Esto reemplazará los datos actuales de ProManage.")) return;
Object.entries(backup.payload.data).forEach(([key, value]) => {
if (key.startsWith("pm_")) localStorage.setItem(key, value);
});
hydrateGlobalsFromStorage();
renderAll();
if (typeof window.syncDataModelsUI === "function") window.syncDataModelsUI();
toast("Backup automático restaurado");
}
function hydrateGlobalsFromStorage(){
try { if (typeof users !== "undefined") users = readJSON("pm_users", users); } catch(error) {}
try { if (typeof companies !== "undefined") companies = readJSON("pm_companies", companies); } catch(error) {}
try { if (typeof projects !== "undefined") projects = readJSON("pm_projects", projects); } catch(error) {}
try { if (typeof members !== "undefined") members = readJSON("pm_members", members); } catch(error) {}
try { if (typeof employees !== "undefined") employees = readJSON("pm_employees", employees); } catch(error) {}
try { if (typeof clients !== "undefined") clients = readJSON("pm_clients", clients); } catch(error) {}
try { if (typeof finances !== "undefined") finances = readJSON("pm_finances", finances); } catch(error) {}
try { if (typeof inventory !== "undefined") inventory = readJSON("pm_inventory", inventory); } catch(error) {}
try { if (typeof activityLogs !== "undefined") activityLogs = readJSON("pm_activityLogs", activityLogs); } catch(error) {}
}
function renderBackupSystem(){
const box = document.getElementById("backupStatusPanel");
if (!box) return;
const auto = readJSON("pm_auto_backup", null);
const manual = readJSON("pm_manual_backups", []);
const localSize = Object.keys(localStorage).filter(k => k.startsWith("pm_")).reduce((sum, key) => sum + String(localStorage.getItem(key) || "").length, 0);
box.innerHTML = `
<div class="pm-backup-status-item"><strong>Backup automático</strong><br>${auto?.payload?.exportedAt ? new Date(auto.payload.exportedAt).toLocaleString("es-GT") : "Pendiente de creación"}</div><div class="pm-backup-status-item"><strong>Backups manuales</strong><br>${manual.length} guardado(s) localmente</div><div class="pm-backup-status-item"><strong>Tamaño local</strong><br>${(localSize / 1024).toFixed(1)} KB aprox.</div>`;
}
function renderCEOPreview(){
const box = document.getElementById("ceoReportPreview");
if (!box) return;
const h = calculateHealthScore();
const totals = financeTotals();
const risks = projectsData().map(calculateProjectRisk);
const highRisk = risks.filter(r => r.level === "Alto").length;
box.innerHTML = `
<div class="pm-ceo-card"><span>Health Score</span><strong>${h.score}/100</strong></div><div class="pm-ceo-card"><span>Estado General</span><strong>${safe(h.state)}</strong></div><div class="pm-ceo-card"><span>Balance</span><strong>${money(totals.balance)}</strong></div><div class="pm-ceo-card"><span>Proyectos en riesgo</span><strong>${highRisk}</strong></div><div class="pm-ceo-card"><span>Progreso promedio</span><strong>${percent(h.progressAvg)}</strong></div><div class="pm-ceo-card"><span>Actividad registrada</span><strong>${logsData().length}</strong></div>`;
}
function executiveReportHTML(){
const h = calculateHealthScore();
const totals = financeTotals();
const projects = projectsData();
const risks = projects.map(p => ({ p, r: calculateProjectRisk(p) })).sort((a,b)=>b.r.score-a.r.score);
const insights = generateInsights();
const company = (readJSON("pm_companies", []).find(c => c.id === getCompanyId()) || {}).name || "Organización";
const recommendations = h.explanations.concat(insights.map(i => i.replace(/<[^>]+>/g,""))).slice(0, 8);
return `
<div class="pm-print-exec"><section class="pm-print-cover"><p>ProManage CEO Executive Report</p><h1>Reporte Ejecutivo</h1><p>${safe(company)} · Generado el ${new Date().toLocaleString("es-GT")}</p><div class="pm-print-grid"><div class="pm-print-kpi"><span>Health Score</span><strong>${h.score}/100</strong></div><div class="pm-print-kpi"><span>Estado</span><strong>${safe(h.state)}</strong></div><div class="pm-print-kpi"><span>Balance</span><strong>${money(totals.balance)}</strong></div></div></section><section class="pm-print-section"><h2>Resumen financiero</h2><div class="pm-print-grid"><div class="pm-print-kpi"><span>Ingresos</span><strong>${money(totals.ingresos)}</strong></div><div class="pm-print-kpi"><span>Egresos</span><strong>${money(totals.egresos)}</strong></div><div class="pm-print-kpi"><span>Balance</span><strong>${money(totals.balance)}</strong></div></div><div class="pm-print-bar"><div style="width:${clamp(h.financeHealth)}%"></div></div><p>Salud financiera estimada: ${percent(h.financeHealth)}.</p></section><section class="pm-print-section"><h2>Progreso de proyectos</h2><div class="pm-print-bar"><div style="width:${clamp(h.progressAvg)}%"></div></div><table class="pm-print-table"><thead><tr><th>Proyecto</th><th>Avance</th><th>Riesgo</th><th>Recomendación</th></tr></thead><tbody>${risks.slice(0, 8).map(({p,r}) => `<tr><td>${safe(p.title || p.name || "Proyecto")}</td><td>${percent(r.progress)}</td><td>${r.level}</td><td>${safe(r.recommendations[0])}</td></tr>`).join("") || `<tr><td colspan="4">Sin proyectos registrados</td></tr>`}</tbody></table></section><section class="pm-print-section"><h2>KPIs operativos</h2><div class="pm-print-grid"><div class="pm-print-kpi"><span>Productividad</span><strong>${percent((h.progressAvg + h.completionRatio) / 2)}</strong></div><div class="pm-print-kpi"><span>Proyectos</span><strong>${h.totalProjects}</strong></div><div class="pm-print-kpi"><span>Clientes</span><strong>${clientsData().length}</strong></div><div class="pm-print-kpi"><span>Empleados</span><strong>${employeesData().length}</strong></div><div class="pm-print-kpi"><span>Inventario</span><strong>${inventoryData().length}</strong></div><div class="pm-print-kpi"><span>Especialistas</span><strong>${membersData().length}</strong></div></div></section><section class="pm-print-section"><h2>Conclusiones y recomendaciones</h2><ul>${recommendations.map(r => `<li>${safe(r)}</li>`).join("")}</ul></section></div>`;
}
function generateCEOExecutiveReport(){
const preview = document.getElementById("ceoReportPreview");
renderCEOPreview();
if (preview) preview.scrollIntoView({ behavior:"smooth", block:"center" });
toast("CEO Report actualizado");
}
function exportExecutivePDF(){
const printArea = document.getElementById("printArea");
if (!printArea) return alert("No se encontró el área de impresión del sistema.");
printArea.innerHTML = executiveReportHTML();
setTimeout(() => window.print(), 120);
addTimelineEvent("CEO Report ejecutivo exportado a PDF.", "report");
renderTimeline();
}
function toast(message){
if (typeof window.showToast === "function") window.showToast(message, "success");
else if (typeof window.premiumToast === "function") window.premiumToast(message);
else console.log(message);
}
function renderAll(){
clearTimeout(state.renderTimer);
state.renderTimer = setTimeout(() => {
renderHealthScore();
renderProjectRiskPanel();
prefillFinancialSimulator();
if (document.getElementById("financialSimulatorChart")) runFinancialSimulator();
renderInsights();
renderAutomations();
renderTimeline();
renderBackupSystem();
renderCEOPreview();
if (window.lucide) window.lucide.createIcons();
}, 60);
}
function attachImportListener(){
const input = document.getElementById("backupImportFile");
if (!input || input.dataset.pmAttached) return;
input.dataset.pmAttached = "true";
input.addEventListener("change", event => {
importBackupFile(event.target.files?.[0]);
event.target.value = "";
});
}
function enhanceGlobalSearch(){
const oldPerform = window.performGlobalSearch;
if (typeof oldPerform !== "function" || oldPerform.__enterpriseEnhanced) return;
const enhanced = function(rawValue){
const result = oldPerform.apply(this, arguments);
const shell = document.getElementById("pageSearchShell");
const results = document.getElementById("globalSearchResults");
const query = normalize(rawValue);
if (shell && results && query && normalize("Centro Ejecutivo Health Score Insights Automatizaciones Backup CEO Report").includes(query)) {
shell.classList.add("has-results");
results.insertAdjacentHTML("afterbegin", `<button type="button" class="search-result-item" onclick="switchSection('intelligence')"><span class="search-result-type">Centro Ejecutivo</span><span class="search-result-title">Health Score, Insights, Automatizaciones y Backup</span><span class="search-result-meta">Abrir módulo ejecutivo</span></button>`);
}
return result;
};
enhanced.__enterpriseEnhanced = true;
window.performGlobalSearch = enhanced;
}
function wrapExistingFunctions(){
const oldSwitch = window.switchSection;
if (typeof oldSwitch === "function" && !oldSwitch.__enterpriseEnhanced) {
const wrappedSwitch = function(sectionId){
const result = oldSwitch.apply(this, arguments);
if (sectionId === "intelligence") {
const title = document.getElementById("sectionTitle");
if (title) title.innerText = "Centro Ejecutivo";
}
renderAll();
return result;
};
wrappedSwitch.__enterpriseEnhanced = true;
window.switchSection = wrappedSwitch;
}
const oldSync = window.syncDataModelsUI;
if (typeof oldSync === "function" && !oldSync.__enterpriseEnhanced) {
const wrappedSync = function(){
const result = oldSync.apply(this, arguments);
renderAll();
return result;
};
wrappedSync.__enterpriseEnhanced = true;
window.syncDataModelsUI = wrappedSync;
}
const oldPush = window.pushActivityLog;
if (typeof oldPush === "function" && !oldPush.__enterpriseEnhanced) {
const wrappedPush = function(message){
const result = oldPush.apply(this, arguments);
addTimelineEvent(message, "activity");
renderTimeline();
renderHealthScore();
return result;
};
wrappedPush.__enterpriseEnhanced = true;
window.pushActivityLog = wrappedPush;
}
}
window.PMEnterprise = {
renderAll,
calculateHealthScore,
calculateProjectRisk,
prefillFinancialSimulator,
runFinancialSimulator,
generateCEOExecutiveReport,
exportExecutivePDF,
exportFullBackupJSON,
triggerImportBackup,
createManualBackup,
restoreLatestAutoBackup,
toggleAutomationRule,
updateExpenseLimit,
runAutomations,
renderProjectRiskPanel,
renderInsights,
addTimelineEvent
};
document.addEventListener("DOMContentLoaded", () => {
attachImportListener();
wrapExistingFunctions();
enhanceGlobalSearch();
createAutoBackup(false);
renderAll();
});
window.addEventListener("load", () => {
attachImportListener();
wrapExistingFunctions();
enhanceGlobalSearch();
setTimeout(renderAll, 500);
});
})();


/* === Bloque JS original 16 === */
(function(){
"use strict";
const HISTORY_KEY = "pm_smartAssistantHistory";
const MAX_HISTORY = 70;
const DEFAULT_EMPTY = "Todavía no tengo suficiente información para analizar eso. Agrega tareas, proyectos o movimientos financieros para generar insights.";
function readJSON(key, fallback){
try {
const raw = localStorage.getItem(key);
if (!raw) return fallback;
const parsed = JSON.parse(raw);
return parsed ?? fallback;
} catch(error) {
return fallback;
}
}
function writeJSON(key, value){
try { localStorage.setItem(key, JSON.stringify(value)); } catch(error) {}
}
function getCompanyId(){
try {
if (typeof selectedCompanyId !== "undefined" && selectedCompanyId) return selectedCompanyId;
} catch(error) {}
return localStorage.getItem("pm_selectedCompanyId") || "";
}
function scoped(rows){
const companyId = getCompanyId();
if (!Array.isArray(rows)) return [];
return rows.filter(item => !companyId || !item || !item.companyId || item.companyId === companyId);
}
function projectsData(){ return scoped(readJSON("pm_projects", [])); }
function financesData(){ return scoped(readJSON("pm_finances", [])); }
function activityData(){
const base = scoped(readJSON("pm_activityLogs", []));
const enterprise = scoped(readJSON("pm_enterpriseTimeline", []));
return [...base, ...enterprise].filter(Boolean);
}
function tasksData(){
const direct = scoped(readJSON("pm_tasks", []));
const fromProjects = [];
projectsData().forEach(project => {
if (Array.isArray(project.tasks)) {
project.tasks.forEach(task => fromProjects.push({ ...task, projectId: project.id, projectTitle: project.title || project.name || "Proyecto" }));
}
});
return [...direct, ...fromProjects].filter(Boolean);
}
function normalize(value){
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");
}
function todayStart(){
const now = new Date();
return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
function parseDate(value){
if (!value) return null;
if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
const raw = String(value).trim();
if (!raw) return null;
const direct = new Date(raw);
if (!Number.isNaN(direct.getTime())) return direct;
const parts = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
if (parts) {
const day = Number(parts[1]);
const month = Number(parts[2]) - 1;
const year = Number(parts[3].length === 2 ? "20" + parts[3] : parts[3]);
const parsed = new Date(year, month, day);
if (!Number.isNaN(parsed.getTime())) return parsed;
}
return null;
}
function daysBetween(date){
if (!date) return null;
return Math.ceil((date.getTime() - todayStart().getTime()) / 86400000);
}
function formatMoney(value){
const n = Number(value || 0);
return "Q" + n.toLocaleString("es-GT", { maximumFractionDigits: 2 });
}
function percent(value){
return Math.round(Number(value || 0)) + "%";
}
function isExpense(row){
const type = normalize(row.type || row.tipo || row.kind || row.movimiento);
return type.includes("egreso") || type.includes("gasto") || type.includes("salida") || type.includes("expense");
}
function isIncome(row){
const type = normalize(row.type || row.tipo || row.kind || row.movimiento);
return type.includes("ingreso") || type.includes("entrada") || type.includes("income");
}
function taskDueDate(task){
return parseDate(task.dueDate || task.deadline || task.vencimiento || task.fechaLimite || task.endDate || task.fechaFin);
}
function isTaskCompleted(task){
const status = normalize(task.status || task.estado || task.state);
return task.done === true || task.completed === true || status.includes("complet") || status.includes("finaliz") || status.includes("hecha");
}
function projectDueDate(project){
return parseDate(project.dueDate || project.deadline || project.endDate || project.fechaFin || project.vencimiento);
}
function projectProgress(project){
if (typeof project.progress !== "undefined") return Math.max(0, Math.min(100, Number(project.progress) || 0));
const status = normalize(project.status || project.estado);
if (status.includes("complet")) return 100;
if (status.includes("proceso") || status.includes("activo") || status.includes("ejec")) return 58;
if (status.includes("pausa")) return 35;
return 18;
}
function projectRisk(project){
const tasks = Array.isArray(project.tasks) ? project.tasks : [];
const completedTasks = tasks.filter(isTaskCompleted).length;
const overdueTasks = tasks.filter(task => {
const d = taskDueDate(task);
return d && d < todayStart() && !isTaskCompleted(task);
}).length;
const pendingTasks = Math.max(0, tasks.length - completedTasks);
const daysLeft = daysBetween(projectDueDate(project));
const progress = projectProgress(project);
const priority = normalize(project.priority || project.prioridad);
const budget = Number(project.budget || project.presupuesto || project.estimatedBudget || 0);
const spent = Number(project.spent || project.usedBudget || project.gastado || 0);
const budgetUsed = budget > 0 ? Math.min(160, (spent / budget) * 100) : 0;
let score = 0;
if (priority.includes("alta")) score += 14;
if (pendingTasks > 0) score += Math.min(20, pendingTasks * 4);
if (overdueTasks > 0) score += Math.min(28, overdueTasks * 12);
if (daysLeft !== null && daysLeft < 0 && progress < 100) score += 32;
else if (daysLeft !== null && daysLeft <= 3 && progress < 80) score += 18;
if (budgetUsed > 85) score += 18;
if (progress < 35 && normalize(project.status || project.estado).includes("proceso")) score += 12;
let level = "Bajo";
if (score >= 60) level = "Alto";
else if (score >= 30) level = "Medio";
return { project, score, level, progress, pendingTasks, overdueTasks, daysLeft, budgetUsed };
}
function getHistory(){
const saved = readJSON(HISTORY_KEY, []);
return Array.isArray(saved) ? saved.slice(-MAX_HISTORY) : [];
}
function saveHistory(history){
writeJSON(HISTORY_KEY, history.slice(-MAX_HISTORY));
}
function escapeHTML(value){
return String(value ?? "").replace(/[&<>'"]/g, char => ({
"&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#039;", '"':"&quot;"
}[char]));
}
function pushLog(message){
try {
if (typeof pushActivityLog === "function") pushActivityLog(message);
} catch(error) {}
try {
const rows = readJSON("pm_smartAssistantEvents", []);
rows.unshift({ id: "sa_" + Date.now(), companyId: getCompanyId(), message, date: new Date().toISOString() });
writeJSON("pm_smartAssistantEvents", rows.slice(0, 80));
} catch(error) {}
}
function response(text, actions){
return { text: text || DEFAULT_EMPTY, actions: Array.isArray(actions) ? actions : [] };
}
function analyzeFinances(){
const rows = financesData();
if (!rows.length) return response(DEFAULT_EMPTY, [{ label:"Abrir Finanzas", section:"finances" }]);
let ingresos = 0;
let egresos = 0;
const expenses = [];
const byCategory = {};
rows.forEach(row => {
const amount = Number(row.amount || row.monto || row.value || 0);
const category = row.category || row.categoria || "Sin categoría";
if (isIncome(row)) ingresos += amount;
else if (isExpense(row)) {
egresos += amount;
expenses.push({ ...row, amount, category });
byCategory[category] = (byCategory[category] || 0) + amount;
} else {
// Mantiene compatibilidad con registros antiguos sin tipo claro.
if (amount >= 0) ingresos += amount;
else egresos += Math.abs(amount);
}
});
const balance = ingresos - egresos;
const biggest = expenses.sort((a,b) => b.amount - a.amount)[0];
const topCategory = Object.entries(byCategory).sort((a,b) => b[1] - a[1])[0];
const burnRatio = ingresos > 0 ? (egresos / ingresos) * 100 : egresos > 0 ? 100 : 0;
const trend = balance >= 0 ? "saludable" : "presionada";
const recommendation = burnRatio > 75
? "Recomiendo revisar gastos altos y definir un límite semanal para la categoría principal."
: "Tus gastos están dentro de un rango controlado; puedes usar el simulador financiero para proyectar ahorro.";
return response(
`Finanzas ${trend}:\n` +
`• Ingresos registrados: ${formatMoney(ingresos)}\n` +
`• Gastos registrados: ${formatMoney(egresos)}\n` +
`• Balance actual: ${formatMoney(balance)}\n` +
`${biggest ? `• Mayor gasto: ${escapeHTML(biggest.category)} por ${formatMoney(biggest.amount)}\n` : ""}` +
`${topCategory ? `• Categoría con más gasto: ${escapeHTML(topCategory[0])} (${formatMoney(topCategory[1])})\n` : ""}` +
`${recommendation}`,
[{ label:"Abrir Finanzas", section:"finances" }, { label:"Ver CEO Report", section:"reports" }]
);
}
function analyzeTasks(){
const tasks = tasksData();
const projects = projectsData();
const overdue = tasks.filter(task => {
const d = taskDueDate(task);
return d && d < todayStart() && !isTaskCompleted(task);
});
const pending = tasks.filter(task => !isTaskCompleted(task));
const dueTomorrow = tasks.filter(task => {
const d = taskDueDate(task);
return d && daysBetween(d) === 1 && !isTaskCompleted(task);
});
if (!tasks.length) {
const riskyProjects = projects.map(projectRisk).filter(r => r.level !== "Bajo");
if (!projects.length) return response(DEFAULT_EMPTY, [{ label:"Abrir Proyectos", section:"projects" }]);
return response(
`No encontré tareas individuales registradas, pero sí ${projects.length} proyecto(s).\n` +
`Detecté ${riskyProjects.length} proyecto(s) con señales de riesgo por estado, prioridad o fechas.\n` +
`Recomendación: agrega tareas internas por proyecto para que el asistente pueda detectar vencidas y productividad con más precisión.`,
[{ label:"Abrir Proyectos", section:"projects" }]
);
}
const quickWin = pending.length ? "Completa primero tareas de menos de 20 minutos para liberar carga operativa." : "Excelente: no tengo tareas pendientes registradas.";
return response(
`Estado de tareas:\n` +
`• Pendientes: ${pending.length}\n` +
`• Atrasadas: ${overdue.length}\n` +
`• Vencen mañana: ${dueTomorrow.length}\n` +
`${overdue.length ? "Prioriza las vencidas de alta prioridad y bloquea un ciclo Pomodoro para cerrarlas.\n" : "No detecté tareas atrasadas con fecha válida.\n"}` +
`${quickWin}`,
[{ label:"Abrir Proyectos", section:"projects" }]
);
}
function analyzeProjects(){
const projects = projectsData();
if (!projects.length) return response(DEFAULT_EMPTY, [{ label:"Abrir Proyectos", section:"projects" }]);
const risks = projects.map(projectRisk).sort((a,b) => b.score - a.score);
const top = risks[0];
const high = risks.filter(r => r.level === "Alto").length;
const medium = risks.filter(r => r.level === "Medio").length;
const avgProgress = risks.reduce((sum, r) => sum + r.progress, 0) / Math.max(1, risks.length);
const title = top.project.title || top.project.name || "Proyecto sin nombre";
const reason = [];
if (top.overdueTasks) reason.push(`${top.overdueTasks} tarea(s) vencida(s)`);
if (top.daysLeft !== null && top.daysLeft < 0) reason.push(`${Math.abs(top.daysLeft)} día(s) de atraso`);
if (top.budgetUsed > 85) reason.push(`presupuesto consumido al ${percent(top.budgetUsed)}`);
if (!reason.length) reason.push("prioridad/avance actual");
return response(
`Análisis de proyectos:\n` +
`• Proyectos evaluados: ${projects.length}\n` +
`• Riesgo alto: ${high}\n` +
`• Riesgo medio: ${medium}\n` +
`• Avance promedio: ${percent(avgProgress)}\n` +
`Proyecto más sensible: “${escapeHTML(title)}” (${top.level}) por ${reason.join(", ")}.\n` +
`Recomendación: revisa alcance, responsable y próximos bloqueos antes de crear nuevas tareas.`,
[{ label:"Abrir Proyectos", section:"projects" }, { label:"Ver Centro Ejecutivo", section:"intelligence" }]
);
}
function analyzeProductivity(){
const tasks = tasksData();
const activities = activityData();
const completed = tasks.filter(isTaskCompleted).length;
const total = tasks.length;
const completion = total ? (completed / total) * 100 : 0;
const today = new Date().toDateString();
const todayActivities = activities.filter(item => {
const d = parseDate(item.date || item.createdAt || item.timestamp || item.time);
return d && d.toDateString() === today;
}).length;
const pomodoroMentions = activities.filter(item => normalize(item.message || item.text || item.title || item.description).includes("pomodoro")).length;
if (!total && !activities.length) return response(DEFAULT_EMPTY, [{ label:"Abrir Panel", section:"dash" }]);
const status = completion >= 75 ? "alta" : completion >= 45 ? "estable" : "mejorable";
return response(
`Productividad ${status}:\n` +
`${total ? `• Tareas completadas: ${completed}/${total} (${percent(completion)})\n` : "• No hay tareas medibles todavía.\n"}` +
`• Actividad registrada hoy: ${todayActivities} evento(s)\n` +
`• Ciclos Pomodoro detectados: ${pomodoroMentions}\n` +
`${completion < 60 ? "Recomendación: trabaja con bloques de 25 minutos y cierra tareas pequeñas antes de iniciar nuevas." : "Recomendación: mantén el ritmo y documenta avances importantes en proyectos críticos."}`,
[{ label:"Abrir Panel", section:"dash" }, { label:"Abrir Centro Ejecutivo", section:"intelligence" }]
);
}
function localHealthScore(){
const projects = projectsData();
const finances = financesData();
const tasks = tasksData();
const risks = projects.map(projectRisk);
const completedProjects = projects.filter(p => normalize(p.status || p.estado).includes("complet")).length;
const completedTasks = tasks.filter(isTaskCompleted).length;
const overdueTasks = tasks.filter(t => {
const d = taskDueDate(t);
return d && d < todayStart() && !isTaskCompleted(t);
}).length;
let ingresos = 0, egresos = 0;
finances.forEach(row => {
const amount = Number(row.amount || row.monto || 0);
if (isExpense(row)) egresos += amount;
else ingresos += Math.max(0, amount);
});
const progress = risks.length ? risks.reduce((sum, r) => sum + r.progress, 0) / risks.length : 45;
const projectCompletion = projects.length ? (completedProjects / projects.length) * 100 : 45;
const taskCompletion = tasks.length ? (completedTasks / tasks.length) * 100 : 50;
const financeScore = ingresos <= 0 && egresos > 0 ? 25 : ingresos <= 0 ? 50 : Math.max(15, Math.min(100, 58 + ((ingresos - egresos) / Math.max(ingresos, 1)) * 42));
const riskPenalty = risks.filter(r => r.level === "Alto").length * 8 + risks.filter(r => r.level === "Medio").length * 3 + overdueTasks * 5;
const score = Math.max(0, Math.min(100, (progress * .25) + (projectCompletion * .18) + (taskCompletion * .22) + (financeScore * .25) + 10 - riskPenalty));
const rounded = Math.round(score);
const state = rounded >= 82 ? "Excelente" : rounded >= 66 ? "Bueno" : rounded >= 45 ? "Riesgo" : "Crítico";
return { score: rounded, state, overdue: overdueTasks, financeBalance: ingresos - egresos, riskHigh: risks.filter(r => r.level === "Alto").length };
}
function analyzeHealthScore(){
let health = null;
try {
if (window.PMEnterprise && typeof window.PMEnterprise.calculateHealthScore === "function") {
health = window.PMEnterprise.calculateHealthScore();
}
} catch(error) {}
if (!health || typeof health.score === "undefined") health = localHealthScore();
const score = Math.round(Number(health.score || 0));
const state = health.state || (score >= 82 ? "Excelente" : score >= 66 ? "Bueno" : score >= 45 ? "Riesgo" : "Crítico");
const recommendations = [];
if ((health.overdue || 0) > 0) recommendations.push("cierra tareas/proyectos vencidos para recuperar puntos rápidamente");
if ((health.finances && health.finances.balance < 0) || health.financeBalance < 0) recommendations.push("reduce gastos variables o registra nuevos ingresos");
if ((health.riskHigh || 0) > 0) recommendations.push("revisa proyectos en riesgo alto");
if (!recommendations.length) recommendations.push("mantén actividad constante y documenta avances diarios");
return response(
`Health Score actual: ${score}/100 (${state}).\n` +
`Para mejorarlo, recomiendo: ${recommendations.join("; ")}.\n` +
`Acción sugerida: revisa el Centro Ejecutivo y prioriza el bloque con peor indicador antes de seguir agregando trabajo.`,
[{ label:"Abrir Centro Ejecutivo", section:"intelligence" }]
);
}
function generateDailySummary(){
const finances = analyzeFinances().text;
const tasks = analyzeTasks().text;
const projects = analyzeProjects().text;
const health = analyzeHealthScore().text;
const hasAnyData = projectsData().length || financesData().length || tasksData().length || activityData().length;
if (!hasAnyData) return response(DEFAULT_EMPTY, [{ label:"Abrir Panel", section:"dash" }]);
return response(
`Resumen ejecutivo de hoy:\n\n` +
`${health.split("\n")[0]}\n` +
`${projects.split("\n").slice(0, 5).join("\n")}\n\n` +
`${finances.split("\n").slice(0, 4).join("\n")}\n\n` +
`${tasks.split("\n").slice(0, 4).join("\n")}\n\n` +
`Prioridad recomendada: atiende primero proyectos en riesgo, luego gastos altos y finalmente tareas rápidas.`,
[{ label:"Abrir Centro Ejecutivo", section:"intelligence" }, { label:"Abrir CEO Report", section:"reports" }]
);
}
function detectUserIntent(message){
const m = normalize(message);
if (!m.trim()) return "empty";
if (/(finanza|gasto|ingreso|balance|dinero|mayor gasto|ahorro|presupuesto)/.test(m)) return "finances";
if (/(tarea|atrasad|vencid|pendient|critica|críticas|criticas)/.test(m)) return "tasks";
if (/(proyecto|riesgo|obra|avance|atraso|presupuesto usado)/.test(m)) return "projects";
if (/(productividad|pomodoro|rendimiento|trabajo|complet)/.test(m)) return "productivity";
if (/(score|salud|health|mejorar|puntuacion|puntuación)/.test(m)) return "health";
if (/(resumen|hoy|sistema|general|estado|reporte|modulo|módulo|revisar)/.test(m)) return "summary";
return "summary";
}
function answerMessage(message){
const intent = detectUserIntent(message);
if (intent === "finances") return analyzeFinances();
if (intent === "tasks") return analyzeTasks();
if (intent === "projects") return analyzeProjects();
if (intent === "productivity") return analyzeProductivity();
if (intent === "health") return analyzeHealthScore();
if (intent === "summary") return generateDailySummary();
return response(DEFAULT_EMPTY);
}
function createPanelIfNeeded(){
if (document.getElementById("pmSmartAssistantPanel")) return;
const panel = document.createElement("div");
panel.className = "pm-assistant-panel";
panel.id = "pmSmartAssistantPanel";
panel.setAttribute("aria-hidden", "true");
panel.innerHTML = `
<div class="pm-assistant-panel-header"><span class="pm-assistant-avatar" aria-hidden="true">✦</span><div class="pm-assistant-title"><strong>Smart System Assistant</strong><span><span class="pm-online-dot"></span> Copiloto local · sin APIs</span></div><div class="pm-assistant-header-actions"><button type="button" class="pm-assistant-icon-btn" onclick="clearSmartAssistantChat()" title="Limpiar conversación">↺</button><button type="button" class="pm-assistant-icon-btn" onclick="toggleSmartAssistant(false)" title="Cerrar">×</button></div></div><div class="pm-assistant-quick-prompts" aria-label="Preguntas rápidas"><button type="button" class="pm-assistant-chip" onclick="smartAssistantQuick('Analizar finanzas')">Analizar finanzas</button><button type="button" class="pm-assistant-chip" onclick="smartAssistantQuick('Tareas críticas')">Tareas críticas</button><button type="button" class="pm-assistant-chip" onclick="smartAssistantQuick('Proyecto en riesgo')">Proyecto en riesgo</button><button type="button" class="pm-assistant-chip" onclick="smartAssistantQuick('Resumen de hoy')">Resumen de hoy</button><button type="button" class="pm-assistant-chip" onclick="smartAssistantQuick('Mejorar score')">Mejorar score</button><button type="button" class="pm-assistant-chip" onclick="smartAssistantQuick('Productividad')">Productividad</button></div><div class="pm-assistant-messages" id="pmAssistantMessages"></div><div class="pm-assistant-composer"><input type="text" class="pm-assistant-input" id="pmAssistantInput" placeholder="Pregúntame sobre finanzas, tareas, riesgo o productividad..." autocomplete="off"><button type="button" class="pm-assistant-send" onclick="sendSmartAssistantMessage()" aria-label="Enviar">➜</button></div><div class="pm-assistant-footnote">Análisis generado con reglas locales, datos de localStorage y lógica JavaScript del sistema.</div>
`;
document.body.appendChild(panel);
const input = document.getElementById("pmAssistantInput");
if (input) {
input.addEventListener("keydown", event => {
if (event.key === "Enter") sendSmartAssistantMessage();
if (event.key === "Escape") toggleSmartAssistant(false);
});
}
}
function renderHistory(){
createPanelIfNeeded();
const box = document.getElementById("pmAssistantMessages");
if (!box) return;
const history = getHistory();
if (!history.length) {
box.innerHTML = `
<div class="pm-assistant-empty">
Soy tu copiloto interno de ProManage. Puedo analizar finanzas, tareas, proyectos en riesgo, productividad, health score y resumen ejecutivo usando solo datos locales.
</div><div class="pm-assistant-message assistant"><div class="pm-assistant-bubble">Prueba preguntando: “¿Qué proyecto está en riesgo?” o “¿Cómo van mis finanzas?”.</div><span class="pm-assistant-meta">Smart Assistant</span></div>`;
return;
}
box.innerHTML = history.map(item => {
const actions = Array.isArray(item.actions) && item.role === "assistant" ? `
<div class="pm-assistant-actions">
${item.actions.map(action => `<button type="button" class="pm-assistant-action" onclick="smartAssistantOpenSection('${escapeHTML(action.section)}')">${escapeHTML(action.label || 'Abrir')}</button>`).join("")}
</div>` : "";
return `
<div class="pm-assistant-message ${item.role === "user" ? "user" : "assistant"}"><div class="pm-assistant-bubble">${escapeHTML(item.text)}</div>
${actions}
<span class="pm-assistant-meta">${item.role === "user" ? "Tú" : "Smart Assistant"}</span></div>`;
}).join("");
box.scrollTop = box.scrollHeight;
}
function addMessage(role, text, actions){
const history = getHistory();
history.push({ id: "msg_" + Date.now() + Math.random().toString(16).slice(2), role, text, actions: actions || [], createdAt: new Date().toISOString(), companyId: getCompanyId() });
saveHistory(history);
renderHistory();
}
function showTyping(){
createPanelIfNeeded();
const box = document.getElementById("pmAssistantMessages");
if (!box) return;
const typing = document.createElement("div");
typing.className = "pm-assistant-message assistant";
typing.id = "pmAssistantTyping";
typing.innerHTML = `<div class="pm-assistant-bubble"><span class="pm-assistant-typing">Analizando <i></i><i></i><i></i></span></div><span class="pm-assistant-meta">Smart Assistant</span>`;
box.appendChild(typing);
box.scrollTop = box.scrollHeight;
}
function hideTyping(){
const typing = document.getElementById("pmAssistantTyping");
if (typing) typing.remove();
}
function processAssistantMessage(message){
const clean = String(message || "").trim();
if (!clean) return;
addMessage("user", clean);
showTyping();
window.setTimeout(() => {
hideTyping();
let result;
try { result = answerMessage(clean); }
catch(error) { result = response(DEFAULT_EMPTY); }
addMessage("assistant", result.text, result.actions);
pushLog("Smart Assistant analizó: " + clean);
}, 520 + Math.min(520, clean.length * 8));
}
function initAssistant(){
createPanelIfNeeded();
renderHistory();
}
window.toggleSmartAssistant = function(force){
createPanelIfNeeded();
const panel = document.getElementById("pmSmartAssistantPanel");
if (!panel) return;
const shouldOpen = typeof force === "boolean" ? force : !panel.classList.contains("active");
panel.classList.toggle("active", shouldOpen);
panel.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
const chevron = document.querySelector(".pm-assistant-chevron");
if (chevron) chevron.style.transform = shouldOpen ? "rotate(180deg)" : "rotate(0deg)";
if (shouldOpen) {
renderHistory();
window.setTimeout(() => document.getElementById("pmAssistantInput")?.focus(), 80);
}
};
window.sendSmartAssistantMessage = function(){
const input = document.getElementById("pmAssistantInput");
const value = input ? input.value : "";
if (input) input.value = "";
processAssistantMessage(value);
};
window.smartAssistantQuick = function(prompt){
toggleSmartAssistant(true);
processAssistantMessage(prompt);
};
window.clearSmartAssistantChat = function(){
writeJSON(HISTORY_KEY, []);
renderHistory();
};
window.smartAssistantOpenSection = function(section){
if (!section) return;
try {
if (typeof switchSection === "function") switchSection(section);
if (window.innerWidth <= 768 && typeof toggleSidebar === "function") toggleSidebar(false);
toggleSmartAssistant(false);
} catch(error) {}
};
// API global solicitada por el prompt del proyecto.
window.analyzeFinances = analyzeFinances;
window.analyzeTasks = analyzeTasks;
window.analyzeProjects = analyzeProjects;
window.analyzeProductivity = analyzeProductivity;
window.analyzeHealthScore = analyzeHealthScore;
window.generateDailySummary = generateDailySummary;
window.detectUserIntent = detectUserIntent;
document.addEventListener("DOMContentLoaded", initAssistant);
window.addEventListener("load", () => window.setTimeout(initAssistant, 350));
})();


/* === Bloque JS original 17 === */
(function(){
'use strict';
const STORE_KEY = 'pm_projectImages';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];
function safeHtml(value){
try {
if (typeof escapeHtml === 'function') return escapeHtml(value);
} catch(error) {}
return String(value ?? '')
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;')
.replace(/'/g, '&#039;');
}
function notify(message, type){
try {
if (typeof showToast === 'function') showToast(message, type || 'success');
else console.log(message);
} catch(error) { console.log(message); }
}
function logActivity(message){
try {
if (typeof pushActivityLog === 'function') pushActivityLog(message);
} catch(error) {}
}
function projectIdOf(projectId){
return String(projectId || '').trim();
}
function readImageStore(){
try {
const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
} catch(error) {
console.warn('No se pudo leer la galería de proyectos:', error);
return {};
}
}
function writeImageStore(store){
try {
const nextStore = store || {};
localStorage.setItem(STORE_KEY, JSON.stringify(nextStore));
window.projectImages = nextStore;
return true;
} catch(error) {
console.error('No se pudo guardar la imagen en localStorage:', error);
notify('No se pudo guardar la imagen. Puede que sea demasiado pesada para localStorage.', 'error');
return false;
}
}
function formatBytes(bytes){
const n = Number(bytes || 0);
if (!n) return 'Tamaño no disponible';
if (n < 1024) return n + ' B';
if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
return (n / (1024 * 1024)).toFixed(2) + ' MB';
}
function getExtension(name){
return String(name || '').split('.').pop().toLowerCase();
}
function isAllowedImage(fileOrMeta){
const name = fileOrMeta?.name || '';
const type = String(fileOrMeta?.type || '').toLowerCase();
const ext = getExtension(name);
return ALLOWED_MIME.includes(type) || ALLOWED_EXT.includes(ext);
}
function normalizeMime(fileOrMeta){
const type = String(fileOrMeta?.type || '').toLowerCase();
const ext = getExtension(fileOrMeta?.name || '');
if (type === 'image/png' || ext === 'png') return 'image/png';
if (type === 'image/webp' || ext === 'webp') return 'image/webp';
return 'image/jpeg';
}
function createImageRecord(projectId, meta){
const cleanProjectId = projectIdOf(projectId);
return {
id: meta.id || ('img_' + Date.now() + '_' + Math.random().toString(16).slice(2)),
projectId: cleanProjectId,
name: meta.name || 'imagen-proyecto.jpg',
type: normalizeMime(meta),
size: Number(meta.size || 0),
sizeLabel: formatBytes(meta.size),
dataUrl: meta.dataUrl || meta.url || '',
createdAt: meta.createdAt || new Date().toISOString()
};
}
function saveImageRecord(projectId, record){
try {
const cleanProjectId = projectIdOf(projectId);
if (!cleanProjectId || !record?.dataUrl) return null;
const store = readImageStore();
if (!Array.isArray(store[cleanProjectId])) store[cleanProjectId] = [];
const normalized = createImageRecord(cleanProjectId, record);
const alreadyExists = store[cleanProjectId].some(img =>
(img.id && img.id === normalized.id) ||
(img.name === normalized.name && img.dataUrl === normalized.dataUrl)
);
if (!alreadyExists) store[cleanProjectId].push(normalized);
if (!writeImageStore(store)) return null;
return normalized;
} catch(error) {
console.error('Error guardando registro de imagen:', error);
notify('No se pudo guardar la imagen del proyecto.', 'error');
return null;
}
}
function dataUrlByteSize(dataUrl){
try {
const base64 = String(dataUrl || '').split(',')[1] || '';
return Math.round(base64.length * 0.75);
} catch(error) {
return 0;
}
}
function fileToDataUrl(file){
return new Promise((resolve, reject) => {
const readOriginal = () => {
try {
const reader = new FileReader();
reader.onload = e => resolve(e.target.result);
reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
reader.readAsDataURL(file);
} catch(error) {
reject(error);
}
};
try {
if (!file || !String(file.type || '').startsWith('image/') || typeof URL === 'undefined') {
readOriginal();
return;
}
const objectUrl = URL.createObjectURL(file);
const img = new Image();
img.onload = () => {
try {
const width = img.naturalWidth || img.width || 0;
const height = img.naturalHeight || img.height || 0;
const maxSide = 1400;
if (!width || !height) {
URL.revokeObjectURL(objectUrl);
readOriginal();
return;
}
const scale = Math.min(1, maxSide / Math.max(width, height));
if (scale === 1 && Number(file.size || 0) < 360 * 1024) {
URL.revokeObjectURL(objectUrl);
readOriginal();
return;
}
const canvas = document.createElement('canvas');
canvas.width = Math.max(1, Math.round(width * scale));
canvas.height = Math.max(1, Math.round(height * scale));
const ctx = canvas.getContext('2d', { alpha: true });
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
let dataUrl = canvas.toDataURL('image/jpeg', 0.72);
if (!String(dataUrl).startsWith('data:image/')) dataUrl = canvas.toDataURL('image/png');
URL.revokeObjectURL(objectUrl);
resolve(dataUrl);
} catch(error) {
URL.revokeObjectURL(objectUrl);
readOriginal();
}
};
img.onerror = () => {
URL.revokeObjectURL(objectUrl);
readOriginal();
};
img.src = objectUrl;
} catch(error) {
readOriginal();
}
});
}
window.getProjectImages = function(projectId){
try {
const cleanProjectId = projectIdOf(projectId);
const store = readImageStore();
const images = Array.isArray(store[cleanProjectId]) ? store[cleanProjectId] : [];
return images.filter(img => img && img.dataUrl && String(img.dataUrl).startsWith('data:image'));
} catch(error) {
console.error('Error obteniendo imágenes del proyecto:', error);
return [];
}
};
window.saveProjectImage = async function(projectId, file){
try {
const cleanProjectId = projectIdOf(projectId);
if (!cleanProjectId) throw new Error('No hay projectId activo.');
if (!file) throw new Error('No se recibió archivo.');
if (!isAllowedImage(file)) {
notify('Solo se permiten imágenes JPG, JPEG, PNG o WEBP.', 'error');
return null;
}
const dataUrl = await fileToDataUrl(file);
const optimizedType = String(dataUrl).startsWith('data:image/png') ? 'image/png' : (String(dataUrl).startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg');
const optimizedSize = dataUrlByteSize(dataUrl) || file.size;
const saved = saveImageRecord(cleanProjectId, {
name: file.name,
type: optimizedType,
size: optimizedSize,
dataUrl
});
if (saved) {
logActivity('Imagen agregada a proyecto: ' + file.name);
}
return saved;
} catch(error) {
console.error('Error en saveProjectImage:', error);
notify('No se pudo procesar la imagen seleccionada.', 'error');
return null;
}
};
window.deleteProjectImage = function(projectId, imageId){
try {
const cleanProjectId = projectIdOf(projectId);
const store = readImageStore();
const list = Array.isArray(store[cleanProjectId]) ? store[cleanProjectId] : [];
const next = list.filter(img => img.id !== imageId);
store[cleanProjectId] = next;
writeImageStore(store);
window.renderProjectGallery(cleanProjectId);
notify('Imagen eliminada de la galería del proyecto.', 'success');
logActivity('Imagen eliminada de galería de proyecto.');
} catch(error) {
console.error('Error eliminando imagen:', error);
notify('No se pudo eliminar la imagen.', 'error');
}
};
window.cleanupProjectImages = function(projectId){
try {
const cleanProjectId = projectIdOf(projectId);
if (!cleanProjectId) return;
const store = readImageStore();
if (store[cleanProjectId]) {
delete store[cleanProjectId];
writeImageStore(store);
}
} catch(error) {
console.error('Error limpiando imágenes del proyecto:', error);
}
};
function imageDateLabel(iso){
try {
return new Date(iso).toLocaleDateString() + ' ' + new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
} catch(error) { return 'Fecha no disponible'; }
}
function ensureLightbox(){
if (document.getElementById('pmProjectImageLightbox')) return;
const lightbox = document.createElement('div');
lightbox.id = 'pmProjectImageLightbox';
lightbox.className = 'pm-image-lightbox';
lightbox.innerHTML = `
<div class="pm-image-lightbox-backdrop" onclick="closeProjectImageLightbox()"></div><div class="pm-image-lightbox-card"><button type="button" class="pm-image-lightbox-close" onclick="closeProjectImageLightbox()">×</button><img id="pmProjectImageLightboxImg" alt="Imagen ampliada del proyecto"><div class="pm-image-lightbox-meta"><strong id="pmProjectImageLightboxName">Imagen</strong><span id="pmProjectImageLightboxInfo">Galería del proyecto</span></div></div>`;
document.body.appendChild(lightbox);
}
window.openProjectImageLightbox = function(projectId, imageId){
try {
ensureLightbox();
const image = window.getProjectImages(projectId).find(img => img.id === imageId);
if (!image) return;
document.getElementById('pmProjectImageLightboxImg').src = image.dataUrl;
document.getElementById('pmProjectImageLightboxName').textContent = image.name || 'Imagen del proyecto';
document.getElementById('pmProjectImageLightboxInfo').textContent = `${imageDateLabel(image.createdAt)} · ${image.sizeLabel || formatBytes(image.size)}`;
document.getElementById('pmProjectImageLightbox').classList.add('active');
} catch(error) {
console.error('Error abriendo lightbox:', error);
}
};
window.closeProjectImageLightbox = function(){
const lightbox = document.getElementById('pmProjectImageLightbox');
if (lightbox) lightbox.classList.remove('active');
};
function galleryEmptyHTML(){
return `
<div class="pm-gallery-empty"><div class="pm-gallery-empty-icon">IMG</div><strong>Este proyecto aún no tiene imágenes.</strong><span>Sube fotografías JPG, PNG o WEBP para crear una galería independiente y mostrarlas en el PDF.</span></div>`;
}
window.renderProjectGallery = function(projectId){
try {
const grid = document.getElementById('detailMediaGrid');
if (!grid) return;
const cleanProjectId = projectIdOf(projectId || window.selectedDetailProjectId);
const images = window.getProjectImages(cleanProjectId);
grid.classList.add('pm-project-gallery-grid');
if (!images.length) {
grid.innerHTML = galleryEmptyHTML();
return;
}
grid.innerHTML = images.map(img => `
<article class="pm-project-image-card"><div class="pm-project-image-thumb" onclick="openProjectImageLightbox('${safeHtml(cleanProjectId)}','${safeHtml(img.id)}')"><img src="${img.dataUrl}" alt="${safeHtml(img.name)}" loading="lazy" decoding="async"><div class="pm-project-image-overlay"><button type="button" onclick="event.stopPropagation(); openProjectImageLightbox('${safeHtml(cleanProjectId)}','${safeHtml(img.id)}')">Ver grande</button></div></div><div class="pm-project-image-info"><strong title="${safeHtml(img.name)}">${safeHtml(img.name)}</strong><span>${safeHtml(imageDateLabel(img.createdAt))}</span><small>${safeHtml(img.sizeLabel || formatBytes(img.size))}</small></div><button type="button" class="pm-project-image-delete" onclick="deleteProjectImage('${safeHtml(cleanProjectId)}','${safeHtml(img.id)}')" title="Eliminar imagen">×</button></article>`).join('');
} catch(error) {
console.error('Error renderizando galería:', error);
const grid = document.getElementById('detailMediaGrid');
if (grid) grid.innerHTML = galleryEmptyHTML();
}
};
function ensureGalleryUI(){
try {
const modal = document.getElementById('projectDetailsModal');
if (!modal) return;
const title = Array.from(modal.querySelectorAll('h3')).find(h => /Repositorio|Evidencias|Archivos/i.test(h.textContent));
if (title) title.textContent = 'Galería del proyecto';
const help = Array.from(modal.querySelectorAll('p')).find(p => /Sube imágenes|reporte PDF|obra/i.test(p.textContent));
if (help) help.textContent = 'Cada proyecto tiene su propia galería independiente. Las imágenes se guardan por ID del proyecto y aparecerán como fotos reales en los PDF.';
const input = document.getElementById('mediaFileInput');
if (input) {
input.setAttribute('accept', '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp');
input.setAttribute('multiple', 'multiple');
}
const uploadBox = input?.closest('div[style*="dashed"]') || input?.parentElement?.parentElement;
if (uploadBox && !document.getElementById('pmGalleryUploadHint')) {
const hint = document.createElement('div');
hint.id = 'pmGalleryUploadHint';
hint.className = 'pm-gallery-upload-hint';
hint.innerHTML = `
<div class="pm-gallery-upload-icon">+</div><div><strong>Subida rápida de imágenes</strong><span>Selecciona una o varias fotografías. Se guardan automáticamente en la galería de este proyecto.</span></div>`;
uploadBox.insertBefore(hint, uploadBox.firstChild);
}
const nameField = document.getElementById('newMediaName');
if (nameField) nameField.placeholder = 'El nombre se toma automáticamente del archivo';
const addButton = Array.from(modal.querySelectorAll('button')).find(btn => /Añadir a la lista/i.test(btn.textContent || ''));
if (addButton) {
addButton.textContent = 'Subir imágenes';
addButton.onclick = function(){ document.getElementById('mediaFileInput')?.click(); };
}
const saveButton = document.getElementById('btnSaveMultimedia');
if (saveButton) saveButton.textContent = 'Cerrar galería';
} catch(error) {
console.warn('No se pudo ajustar la UI de galería:', error);
}
}
async function handleProjectImagesFromInput(input, projectId){
const cleanProjectId = projectIdOf(projectId);
const files = Array.from(input?.files || []);
if (!cleanProjectId || !files.length) return;
const valid = files.filter(isAllowedImage);
if (valid.length !== files.length) {
notify('Algunos archivos fueron ignorados. Solo se aceptan JPG, JPEG, PNG o WEBP.', 'error');
}
if (!valid.length) return;
const grid = document.getElementById('detailMediaGrid');
if (grid) {
grid.innerHTML = `
<div class="pm-gallery-loading"><span></span><strong>Guardando imágenes...</strong><small>Convirtiendo a Base64 y asociando al proyecto actual.</small></div>`;
}
let savedCount = 0;
for (const file of valid) {
const saved = await window.saveProjectImage(cleanProjectId, file);
if (saved) savedCount += 1;
}
input.value = '';
const nameInput = document.getElementById('newMediaName');
const urlInput = document.getElementById('newMediaUrl');
if (nameInput) nameInput.value = '';
if (urlInput) urlInput.value = '';
window.renderProjectGallery(cleanProjectId);
notify(savedCount === 1 ? 'Imagen guardada en esta galería.' : `${savedCount} imágenes guardadas en esta galería.`, 'success');
}
window.handleLocalFileUpload = function(event){
try {
const projectId = projectIdOf(window.selectedDetailProjectId);
if (!projectId) {
notify('Abre primero un proyecto para asociar imágenes a su galería.', 'error');
return;
}
handleProjectImagesFromInput(event.target, projectId);
} catch(error) {
console.error('Error cargando imágenes locales:', error);
notify('No se pudieron cargar las imágenes.', 'error');
}
};
window.addAttachmentToDraft = function(){
try {
const input = document.getElementById('mediaFileInput');
if (input && input.files && input.files.length) {
window.handleLocalFileUpload({ target: input });
return;
}
const projectId = projectIdOf(window.selectedDetailProjectId);
const name = document.getElementById('newMediaName')?.value?.trim();
const dataUrl = document.getElementById('newMediaUrl')?.value?.trim();
const type = document.getElementById('newMediaType')?.value === 'imagen' ? 'image/jpeg' : '';
if (!projectId || !name || !dataUrl || !String(dataUrl).startsWith('data:image')) {
notify('Selecciona una imagen válida para guardarla en la galería del proyecto.', 'error');
return;
}
saveImageRecord(projectId, { name, type, dataUrl, size: 0 });
window.renderProjectGallery(projectId);
notify('Imagen guardada en la galería del proyecto.', 'success');
} catch(error) {
console.error('Error agregando imagen:', error);
notify('No se pudo agregar la imagen.', 'error');
}
};
window.persistMultimediaChanges = function(){
try {
const projectId = projectIdOf(window.selectedDetailProjectId);
window.renderProjectGallery(projectId);
notify('Galería del proyecto actualizada.', 'success');
if (typeof closeModal === 'function') closeModal('projectDetailsModal');
} catch(error) {
console.error('Error persistiendo galería:', error);
}
};
function migrateLegacyAttachments(){
try {
if (!Array.isArray(window.projects)) return;
const store = readImageStore();
let migrated = 0;
window.projects.forEach(project => {
if (!project?.id || !Array.isArray(project.attachments)) return;
const cleanProjectId = projectIdOf(project.id);
if (!Array.isArray(store[cleanProjectId])) store[cleanProjectId] = [];
project.attachments.forEach(file => {
const dataUrl = file?.dataUrl || file?.url || '';
const looksImage = String(dataUrl).startsWith('data:image') || file?.type === 'imagen' || String(file?.type || '').startsWith('image');
if (!looksImage || !dataUrl) return;
const normalized = createImageRecord(cleanProjectId, {
id: file.id,
name: file.name || 'imagen-migrada.jpg',
type: file.type && file.type !== 'imagen' ? file.type : 'image/jpeg',
size: file.size || dataUrlByteSize(dataUrl) || 0,
dataUrl,
createdAt: file.createdAt || new Date().toISOString()
});
const alreadyExists = store[cleanProjectId].some(img =>
(img.id && img.id === normalized.id) ||
(img.name === normalized.name && img.dataUrl === normalized.dataUrl)
);
if (!alreadyExists) {
store[cleanProjectId].push(normalized);
migrated += 1;
}
});
});
if (migrated) {
writeImageStore(store);
console.info(`Galería ProManage: ${migrated} imágenes heredadas sincronizadas por projectId.`);
}
} catch(error) {
console.warn('No se pudieron migrar adjuntos heredados:', error);
}
}
function printGalleryHTML(projectId){
migrateLegacyAttachments();
const images = window.getProjectImages(projectId);
if (!images.length) {
return `<p class="pm-print-empty">Este proyecto aún no tiene imágenes.</p>`;
}
return `
<h3 class="pm-print-gallery-title">Galería del proyecto</h3><div class="pm-print-gallery-grid">
${images.map(img => `
<figure class="pm-print-image-card"><img src="${img.dataUrl}" alt="${safeHtml(img.name)}" loading="lazy" decoding="async"><figcaption>${safeHtml(img.name || 'Imagen del proyecto')}</figcaption></figure>`).join('')}
</div>`;
}
function projectLeader(project){
try {
return window.members?.find(m => m.id === project.ownerId)?.name || 'Sin responsable asignado';
} catch(error) { return 'Sin responsable asignado'; }
}
window.generatePrintableView = function(){
try {
const printDiv = document.getElementById('printArea');
if (!printDiv) return;
const comp = window.companies?.find(c => c.id === window.selectedCompanyId);
const compProjects = (window.projects || []).filter(p => p.companyId === window.selectedCompanyId);
let html = `
<div class="print-header"><h1>Reporte Técnico Consolidado</h1><h2>Organización: ${safeHtml(comp ? comp.name : 'No definida')}</h2><p>Fecha de Generación: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p></div>`;
if (!compProjects.length) {
html += `<p style="text-align:center; font-size:16px;">No existen proyectos registrados en esta organización para reportar.</p>`;
} else {
compProjects.forEach(project => {
html += `
<section class="print-project pm-print-project-block"><h2>Frente Operativo: ${safeHtml(project.title)}</h2><div class="print-project-meta"><span><strong>Líder a Cargo:</strong> ${safeHtml(projectLeader(project))}</span><span><strong>Estado Actual:</strong> ${safeHtml(String(project.status || '').toUpperCase())}</span><span><strong>Prioridad:</strong> ${safeHtml(String(project.priority || '').toUpperCase())}</span></div><div class="print-project-desc">${safeHtml(project.description || 'Sin alcance definido en la ficha.')}</div>
${printGalleryHTML(project.id)}
</section>`;
});
}
printDiv.innerHTML = html;
} catch(error) {
console.error('Error generando vista imprimible:', error);
notify('No se pudo preparar el PDF con imágenes.', 'error');
}
};
window.generateSingleProjectPDF = function(){
try {
const projectId = document.getElementById('reportProjectSelect')?.value;
if (!projectId) return alert('Selecciona un proyecto');
const project = (window.projects || []).find(p => p.id === projectId);
if (!project) return alert('Proyecto no encontrado');
const printArea = document.getElementById('printArea');
if (!printArea) return alert('No se encontró el área de impresión');
printArea.innerHTML = `
<div class="print-header"><h1>REPORTE PROFESIONAL DE PROYECTO</h1><h2>${safeHtml(project.title)}</h2><p>Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p></div><section class="print-project pm-print-project-block"><div class="print-project-meta"><span><strong>Responsable:</strong> ${safeHtml(projectLeader(project))}</span><span><strong>Estado:</strong> ${safeHtml(project.status || '')}</span><span><strong>Prioridad:</strong> ${safeHtml(project.priority || '')}</span></div><div class="print-project-desc">${safeHtml(project.description || 'Sin descripción')}</div>
${printGalleryHTML(project.id)}
</section>`;
logActivity('PDF de proyecto generado con galería real: ' + project.title);
window.setTimeout(() => window.print(), 500);
} catch(error) {
console.error('Error generando PDF individual:', error);
notify('No se pudo generar el PDF del proyecto.', 'error');
}
};
function imageFormatForPDF(image){
const type = String(image?.type || '').toLowerCase();
const data = String(image?.dataUrl || '').slice(0, 40).toLowerCase();
if (type.includes('png') || data.includes('image/png')) return 'PNG';
if (type.includes('webp') || data.includes('image/webp')) return 'WEBP';
return 'JPEG';
}
function dataUrlToImage(dataUrl){
return new Promise((resolve, reject) => {
const img = new Image();
img.onload = () => resolve(img);
img.onerror = reject;
img.src = dataUrl;
});
}
async function convertToPngDataUrl(dataUrl){
const img = await dataUrlToImage(dataUrl);
const canvas = document.createElement('canvas');
canvas.width = img.naturalWidth || img.width;
canvas.height = img.naturalHeight || img.height;
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
return canvas.toDataURL('image/png');
}
window.addProjectImagesToPDF = async function(doc, projectId, startY){
try {
if (!doc || typeof doc.addImage !== 'function') return startY || 20;
const images = window.getProjectImages(projectId);
if (!images.length) return startY || 20;
const pageWidth = doc.internal?.pageSize?.getWidth ? doc.internal.pageSize.getWidth() : 210;
const pageHeight = doc.internal?.pageSize?.getHeight ? doc.internal.pageSize.getHeight() : 297;
const margin = 14;
const gap = 8;
const cardW = (pageWidth - margin * 2 - gap) / 2;
const imgH = 42;
let x = margin;
let y = Number(startY || 20);
if (y > pageHeight - 70) { doc.addPage(); y = margin; }
doc.setFontSize?.(13);
doc.text?.('Galería del proyecto', margin, y);
y += 8;
for (let i = 0; i < images.length; i++) {
const image = images[i];
if (y + imgH + 16 > pageHeight - margin) {
doc.addPage();
y = margin;
x = margin;
}
let dataUrl = image.dataUrl;
let format = imageFormatForPDF(image);
if (format === 'WEBP') {
try {
dataUrl = await convertToPngDataUrl(image.dataUrl);
format = 'PNG';
} catch(error) {
console.warn('No se pudo convertir WEBP para jsPDF:', error);
}
}
try {
doc.addImage(dataUrl, format, x, y, cardW, imgH, undefined, 'FAST');
} catch(error) {
try {
const fallback = await convertToPngDataUrl(image.dataUrl);
doc.addImage(fallback, 'PNG', x, y, cardW, imgH, undefined, 'FAST');
} catch(innerError) {
console.warn('Imagen omitida en PDF:', innerError);
continue;
}
}
doc.setFontSize?.(8);
const label = String(image.name || 'Imagen del proyecto').slice(0, 48);
doc.text?.(label, x, y + imgH + 5);
if (x === margin) {
x = margin + cardW + gap;
} else {
x = margin;
y += imgH + 16;
}
}
return y + imgH + 16;
} catch(error) {
console.error('Error en addProjectImagesToPDF:', error);
return startY || 20;
}
};
const previousOpenProjectDetailsModal = window.openProjectDetailsModal;
window.openProjectDetailsModal = function(id){
try {
window.selectedDetailProjectId = id;
if (typeof previousOpenProjectDetailsModal === 'function') previousOpenProjectDetailsModal(id);
ensureGalleryUI();
migrateLegacyAttachments();
window.renderProjectGallery(id);
} catch(error) {
console.error('Error abriendo detalles del proyecto con galería:', error);
if (typeof previousOpenProjectDetailsModal === 'function') previousOpenProjectDetailsModal(id);
}
};
const previousDeleteProject = window.deleteProject;
window.deleteProject = function(id){
try {
const beforeExists = Array.isArray(window.projects) && window.projects.some(p => p.id === id);
if (typeof previousDeleteProject === 'function') previousDeleteProject(id);
window.setTimeout(() => {
const stillExists = Array.isArray(window.projects) && window.projects.some(p => p.id === id);
if (beforeExists && !stillExists) window.cleanupProjectImages(id);
}, 150);
} catch(error) {
console.error('Error eliminando proyecto con limpieza de galería:', error);
}
};
const pendingImageRecords = [];
function setupProjectModalImageInput(){
try {
const input = document.getElementById('projectFilesInput');
const preview = document.getElementById('projectFilesPreview');
if (!input || input.dataset.pmGalleryReady === 'true') return;
input.dataset.pmGalleryReady = 'true';
input.setAttribute('accept', '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp');
input.setAttribute('multiple', 'multiple');
input.addEventListener('change', async function(event){
const files = Array.from(event.target.files || []);
pendingImageRecords.length = 0;
if (preview) preview.innerHTML = '';
const valid = files.filter(isAllowedImage);
if (valid.length !== files.length) notify('Solo se adjuntarán imágenes JPG, JPEG, PNG o WEBP.', 'error');
for (const file of valid) {
const dataUrl = await fileToDataUrl(file);
const optimizedType = String(dataUrl).startsWith('data:image/png') ? 'image/png' : (String(dataUrl).startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg');
const optimizedSize = dataUrlByteSize(dataUrl) || file.size;
const record = createImageRecord('', { name: file.name, type: optimizedType, size: optimizedSize, dataUrl });
pendingImageRecords.push(record);
if (preview) {
preview.innerHTML += `
<div class="pm-pending-image-preview"><img src="${dataUrl}" alt="${safeHtml(file.name)}" loading="lazy" decoding="async"><span>${safeHtml(file.name)}</span><small>${formatBytes(optimizedSize)}</small></div>`;
}
}
});
} catch(error) {
console.warn('No se pudo preparar input de imágenes del proyecto:', error);
}
}
const previousSubmitProjectForm = window.submitProjectForm;
window.submitProjectForm = function(){
const editingId = document.getElementById('editProjectId')?.value;
if (typeof previousSubmitProjectForm === 'function') previousSubmitProjectForm();
window.setTimeout(() => {
try {
const target = editingId
? (window.projects || []).find(p => p.id === editingId)
: (window.projects || [])[Math.max(0, (window.projects || []).length - 1)];
if (target?.id && pendingImageRecords.length) {
pendingImageRecords.forEach(record => saveImageRecord(target.id, record));
pendingImageRecords.length = 0;
const preview = document.getElementById('projectFilesPreview');
if (preview) preview.innerHTML = '';
notify('Imágenes guardadas en la galería independiente del proyecto.', 'success');
logActivity('Galería creada/actualizada para proyecto: ' + target.title);
}
} catch(error) {
console.error('No se pudieron asociar imágenes pendientes:', error);
}
}, 650);
};
function initProjectGalleryLayer(){
if (window.__pmProjectGalleryLayerReady) return;
window.__pmProjectGalleryLayerReady = true;
window.projectImages = readImageStore();
ensureLightbox();
ensureGalleryUI();
setupProjectModalImageInput();
}
document.addEventListener('DOMContentLoaded', () => window.setTimeout(initProjectGalleryLayer, 120));
window.addEventListener('load', () => window.setTimeout(initProjectGalleryLayer, 360), { once:true });
})();


/* === Bloque JS original 18 === */
(function(){
'use strict';
const IMAGE_STORE_KEY = 'pm_projectImages';
function readJSON(key, fallback){
try {
const raw = localStorage.getItem(key);
if (!raw) return fallback;
const parsed = JSON.parse(raw);
return parsed == null ? fallback : parsed;
} catch(error) {
console.warn('ProManage: no se pudo leer', key, error);
return fallback;
}
}
function writeJSON(key, value){
try {
localStorage.setItem(key, JSON.stringify(value));
return true;
} catch(error) {
console.warn('ProManage: no se pudo guardar', key, error);
return false;
}
}
function safeText(value){
try {
if (typeof escapeHtml === 'function') return escapeHtml(value);
} catch(error) {}
return String(value ?? '')
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;')
.replace(/'/g, '&#039;');
}
function normalize(value){
return String(value ?? '').trim().toLowerCase();
}
function getCurrentCompanyIdSafe(){
try {
if (typeof selectedCompanyId !== 'undefined' && selectedCompanyId) return selectedCompanyId;
} catch(error) {}
try {
if (window.selectedCompanyId) return window.selectedCompanyId;
} catch(error) {}
return localStorage.getItem('pm_selectedCompanyId') || '';
}
window.pmGetProjectsSafe = function(){
let list = [];
try {
if (typeof projects !== 'undefined' && Array.isArray(projects)) list = projects;
} catch(error) {}
if ((!Array.isArray(list) || !list.length) && Array.isArray(window.projects)) list = window.projects;
if (!Array.isArray(list) || !list.length) list = readJSON('pm_projects', []);
return Array.isArray(list) ? list : [];
};
window.pmFindProjectSafe = function(rawProjectId){
const value = String(rawProjectId ?? '').trim();
const all = window.pmGetProjectsSafe();
if (!value) return null;
let project = all.find(p => String(p?.id ?? '').trim() === value);
if (project) return project;
const lower = normalize(value);
project = all.find(p => normalize(p?.id) === lower);
if (project) return project;
/* Fallback solo para reparar selects antiguos que hayan guardado título/nombre. */
project = all.find(p => normalize(p?.title) === lower || normalize(p?.name) === lower);
if (project) return project;
const select = document.getElementById('reportProjectSelect');
const option = select?.selectedOptions?.[0];
const optionId = option?.dataset?.projectId || option?.getAttribute('data-project-id');
if (optionId) {
project = all.find(p => String(p?.id ?? '').trim() === String(optionId).trim());
if (project) return project;
}
return null;
};
function projectLeaderSafe(project){
try {
if (typeof projectLeader === 'function') return projectLeader(project);
} catch(error) {}
try {
const membersList = typeof members !== 'undefined' && Array.isArray(members) ? members : readJSON('pm_members', []);
const owner = membersList.find(m => m.id === project?.ownerId);
return owner?.name || 'Sin asignar';
} catch(error) {
return 'Sin asignar';
}
}
function getProjectImagesSafe(projectId){
try {
if (typeof window.getProjectImages === 'function') {
const images = window.getProjectImages(projectId);
if (Array.isArray(images)) return images;
}
} catch(error) {}
const store = readJSON(IMAGE_STORE_KEY, {});
return Array.isArray(store[String(projectId || '').trim()]) ? store[String(projectId || '').trim()] : [];
}
function formatBytes(bytes){
const value = Number(bytes || 0);
if (!value) return '';
if (value < 1024) return value + ' B';
if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
return (value / (1024 * 1024)).toFixed(1) + ' MB';
}
function printGalleryHTMLSafe(projectId){
const images = getProjectImagesSafe(projectId).filter(img => String(img?.dataUrl || '').startsWith('data:image'));
if (!images.length) {
return `
<div class="print-gallery-empty" style="margin-top:24px; padding:16px; border:1px dashed #cfcfcf; border-radius:12px; color:#555; background:#fafafa;">
Este proyecto aún no tiene imágenes.
</div>`;
}
return `
<div class="print-gallery-section" style="margin-top:30px; page-break-inside:auto; break-inside:auto;"><h3 style="font-size:18px; margin-bottom:16px; color:#111;">Galería del proyecto</h3><div class="print-img-container" style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:18px; align-items:start;">
${images.map(image => `
<figure class="print-img-box" style="margin:0; break-inside:avoid; page-break-inside:avoid; border:1px solid #ddd; border-radius:12px; padding:10px; background:#fff;"><img class="print-img" src="${image.dataUrl}" alt="${safeText(image.name || 'Imagen del proyecto')}" style="width:100%; height:210px; object-fit:cover; border-radius:8px; display:block;"><figcaption style="margin-top:8px; font-size:12px; color:#444; line-height:1.4; word-break:break-word;"><strong>${safeText(image.name || 'Imagen del proyecto')}</strong><br>
${safeText(image.createdAt ? new Date(image.createdAt).toLocaleDateString() : '')}${image.size ? ' · ' + safeText(formatBytes(image.size)) : ''}
</figcaption></figure>`).join('')}
</div></div>`;
}
function migrateLegacyProjectImagesSafe(){
try {
const all = window.pmGetProjectsSafe();
if (!all.length) return;
const store = readJSON(IMAGE_STORE_KEY, {});
let changed = false;
all.forEach(project => {
const projectId = String(project?.id || '').trim();
if (!projectId) return;
if (!Array.isArray(store[projectId])) store[projectId] = [];
const attachments = Array.isArray(project?.attachments) ? project.attachments : [];
attachments.forEach(file => {
const dataUrl = file?.dataUrl || file?.url || file?.src || '';
const type = file?.type || (String(dataUrl).slice(0, 30).includes('png') ? 'image/png' : 'image/jpeg');
if (!String(dataUrl).startsWith('data:image')) return;
const already = store[projectId].some(img => img.dataUrl === dataUrl || (img.name === file?.name && img.size === file?.size));
if (already) return;
store[projectId].push({
id: 'legacy_img_' + Date.now() + '_' + Math.random().toString(16).slice(2),
projectId,
name: file?.name || 'Imagen heredada',
type,
size: Number(file?.size || 0),
dataUrl,
createdAt: file?.createdAt || new Date().toISOString(),
source: 'legacy-attachment-hotfix'
});
changed = true;
});
});
if (changed) writeJSON(IMAGE_STORE_KEY, store);
} catch(error) {
console.warn('ProManage: migración defensiva de imágenes omitida.', error);
}
}
function refreshReportProjectsSafe(){
try {
const select = document.getElementById('reportProjectSelect');
if (!select) return;
const currentValue = select.value;
const companyId = getCurrentCompanyIdSafe();
let all = window.pmGetProjectsSafe();
const scoped = companyId ? all.filter(p => !p.companyId || String(p.companyId) === String(companyId)) : all;
if (scoped.length) all = scoped;
select.innerHTML = '';
if (!all.length) {
select.innerHTML = '<option value="">No hay proyectos disponibles</option>';
return;
}
all.forEach(project => {
const option = document.createElement('option');
option.value = String(project?.id || '');
option.dataset.projectId = String(project?.id || '');
option.textContent = project?.title || project?.name || 'Proyecto sin nombre';
select.appendChild(option);
});
const hasCurrent = Array.from(select.options).some(option => option.value === currentValue);
if (hasCurrent) select.value = currentValue;
} catch(error) {
console.warn('ProManage: no se pudo refrescar selector de reportes.', error);
}
}
window.renderReportProjects = refreshReportProjectsSafe;
window.pmRefreshReportProjects = refreshReportProjectsSafe;
window.generateSingleProjectPDF = function(){
try {
migrateLegacyProjectImagesSafe();
refreshReportProjectsSafe();
const select = document.getElementById('reportProjectSelect');
const selectedValue = select?.value || '';
const project = window.pmFindProjectSafe(selectedValue);
if (!selectedValue) {
alert('Selecciona un proyecto');
return;
}
if (!project) {
console.warn('ProManage PDF: proyecto no encontrado para value:', selectedValue, window.pmGetProjectsSafe());
alert('No se pudo encontrar ese proyecto. Volví a sincronizar la lista de reportes; selecciónalo de nuevo.');
refreshReportProjectsSafe();
return;
}
const projectId = String(project.id || selectedValue).trim();
const printArea = document.getElementById('printArea');
if (!printArea) {
alert('No se encontró el área de impresión.');
return;
}
printArea.innerHTML = `
<div class="print-header"><h1>REPORTE PROFESIONAL DE PROYECTO</h1><h2>${safeText(project.title || project.name || 'Proyecto')}</h2><p>Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p></div><section class="print-project pm-print-project-block"><div class="print-project-meta"><span><strong>Responsable:</strong> ${safeText(projectLeaderSafe(project))}</span><span><strong>Estado:</strong> ${safeText(project.status || 'No definido')}</span><span><strong>Prioridad:</strong> ${safeText(project.priority || 'No definida')}</span></div><div class="print-project-desc">${safeText(project.description || 'Sin descripción')}</div>
${printGalleryHTMLSafe(projectId)}
</section>`;
try {
if (typeof logActivity === 'function') logActivity('PDF de proyecto generado con galería real: ' + (project.title || project.name || projectId));
else if (typeof pushActivityLog === 'function') pushActivityLog('PDF de proyecto generado con galería real: ' + (project.title || project.name || projectId));
} catch(error) {}
window.setTimeout(() => window.print(), 300);
} catch(error) {
console.error('Error generando PDF individual corregido:', error);
alert('No se pudo generar el PDF del proyecto. Revisa la consola para más detalles.');
}
};
const previousPrintableView = window.generatePrintableView;
window.generatePrintableView = function(){
try {
migrateLegacyProjectImagesSafe();
const printDiv = document.getElementById('printArea');
if (!printDiv) return previousPrintableView ? previousPrintableView.apply(this, arguments) : undefined;
const companyId = getCurrentCompanyIdSafe();
const companiesList = (() => {
try { return typeof companies !== 'undefined' && Array.isArray(companies) ? companies : readJSON('pm_companies', []); }
catch(error) { return readJSON('pm_companies', []); }
})();
const comp = companiesList.find(c => String(c.id) === String(companyId));
const compProjects = window.pmGetProjectsSafe().filter(p => !companyId || !p.companyId || String(p.companyId) === String(companyId));
let html = `
<div class="print-header"><h1>Reporte Técnico Consolidado</h1><h2>Organización: ${safeText(comp ? comp.name : 'No definida')}</h2><p>Fecha de Generación: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p></div>`;
if (!compProjects.length) {
html += '<p style="text-align:center; font-size:16px;">No existen proyectos registrados en esta organización para reportar.</p>';
} else {
compProjects.forEach(project => {
const projectId = String(project.id || '').trim();
html += `
<section class="print-project pm-print-project-block"><h2>Frente Operativo: ${safeText(project.title || project.name || 'Proyecto')}</h2><div class="print-project-meta"><span><strong>Líder a Cargo:</strong> ${safeText(projectLeaderSafe(project))}</span><span><strong>Estado Actual:</strong> ${safeText(String(project.status || '').toUpperCase())}</span><span><strong>Prioridad:</strong> ${safeText(String(project.priority || '').toUpperCase())}</span></div><div class="print-project-desc">${safeText(project.description || 'Sin alcance definido en la ficha.')}</div>
${projectId ? printGalleryHTMLSafe(projectId) : ''}
</section>`;
});
}
printDiv.innerHTML = html;
} catch(error) {
console.error('Error generando vista imprimible corregida:', error);
if (previousPrintableView) return previousPrintableView.apply(this, arguments);
}
};
const previousDeleteProject = window.deleteProject;
if (typeof previousDeleteProject === 'function') {
window.deleteProject = function(id){
const beforeId = String(id || '').trim();
const result = previousDeleteProject.apply(this, arguments);
window.setTimeout(() => {
try {
const stillExists = window.pmGetProjectsSafe().some(p => String(p.id || '').trim() === beforeId);
if (!stillExists && beforeId && typeof window.cleanupProjectImages === 'function') window.cleanupProjectImages(beforeId);
refreshReportProjectsSafe();
} catch(error) {}
}, 80);
return result;
};
}
const previousSwitchSection = window.switchSection;
if (typeof previousSwitchSection === 'function' && !previousSwitchSection.__pmReportRefreshWrapped) {
const wrapped = function(sectionId){
const result = previousSwitchSection.apply(this, arguments);
if (sectionId === 'reports') window.setTimeout(refreshReportProjectsSafe, 80);
return result;
};
wrapped.__pmReportRefreshWrapped = true;
window.switchSection = wrapped;
}
function initHotfix(){
migrateLegacyProjectImagesSafe();
refreshReportProjectsSafe();
document.querySelectorAll('.close-sidebar-btn').forEach(button => button.remove());
}
document.addEventListener('DOMContentLoaded', () => window.setTimeout(initHotfix, 120));
window.addEventListener('load', () => window.setTimeout(initHotfix, 500));
})();


/* === Bloque JS original 19 === */
(function(){
'use strict';
const IMAGE_STORE_KEY = 'pm_projectImages';
function readJSON(key, fallback){
try {
const raw = localStorage.getItem(key);
if (!raw) return fallback;
const parsed = JSON.parse(raw);
return parsed == null ? fallback : parsed;
} catch(error) {
console.warn('ProManage PDF limpio: no se pudo leer ' + key, error);
return fallback;
}
}
function safe(value){
return String(value ?? '')
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;')
.replace(/'/g, '&#039;');
}
function cleanText(value, fallback){
const text = String(value ?? '').trim();
return text || fallback || 'No definido';
}
function formatDate(value){
try {
if (!value) return '';
const date = new Date(value);
if (Number.isNaN(date.getTime())) return '';
return date.toLocaleDateString();
} catch(error) {
return '';
}
}
function formatBytes(bytes){
const value = Number(bytes || 0);
if (!value) return '';
if (value < 1024) return value + ' B';
if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
return (value / (1024 * 1024)).toFixed(1) + ' MB';
}
function getProjectsSafe(){
try {
if (typeof window.pmGetProjectsSafe === 'function') {
const data = window.pmGetProjectsSafe();
if (Array.isArray(data)) return data;
}
} catch(error) {}
try {
if (typeof projects !== 'undefined' && Array.isArray(projects)) return projects;
} catch(error) {}
if (Array.isArray(window.projects)) return window.projects;
return readJSON('pm_projects', []);
}
function findProjectSafe(value){
const raw = String(value ?? '').trim();
if (!raw) return null;
try {
if (typeof window.pmFindProjectSafe === 'function') {
const project = window.pmFindProjectSafe(raw);
if (project) return project;
}
} catch(error) {}
const projectsList = getProjectsSafe();
let project = projectsList.find(p => String(p?.id ?? '').trim() === raw);
if (project) return project;
const lower = raw.toLowerCase();
project = projectsList.find(p => String(p?.id ?? '').trim().toLowerCase() === lower);
if (project) return project;
const select = document.getElementById('reportProjectSelect');
const optionId = select?.selectedOptions?.[0]?.dataset?.projectId || select?.selectedOptions?.[0]?.getAttribute('data-project-id');
if (optionId) {
project = projectsList.find(p => String(p?.id ?? '').trim() === String(optionId).trim());
if (project) return project;
}
return projectsList.find(p =>
String(p?.title ?? '').trim().toLowerCase() === lower ||
String(p?.name ?? '').trim().toLowerCase() === lower
) || null;
}
function getMembersSafe(){
try {
if (typeof members !== 'undefined' && Array.isArray(members)) return members;
} catch(error) {}
if (Array.isArray(window.members)) return window.members;
return readJSON('pm_members', []);
}
function projectLeaderSafe(project){
try {
if (typeof projectLeader === 'function') return projectLeader(project);
} catch(error) {}
const ownerId = project?.ownerId || project?.leaderId || project?.memberId;
const member = getMembersSafe().find(m => String(m?.id) === String(ownerId));
return member?.name || project?.leader || project?.responsible || 'Sin responsable asignado';
}
function getCompanySafe(project){
const companyId = project?.companyId || localStorage.getItem('pm_selectedCompanyId') || '';
const companies = (() => {
try {
if (typeof window.companies !== 'undefined' && Array.isArray(window.companies)) return window.companies;
} catch(error) {}
try {
if (typeof companies !== 'undefined' && Array.isArray(companies)) return companies;
} catch(error) {}
return readJSON('pm_companies', []);
})();
return companies.find(c => String(c?.id) === String(companyId))?.name || 'Organización no definida';
}
function getProjectImagesSafe(projectId){
const id = String(projectId || '').trim();
if (!id) return [];
try {
if (typeof window.getProjectImages === 'function') {
const images = window.getProjectImages(id);
if (Array.isArray(images)) {
return images.filter(img => String(img?.dataUrl || '').startsWith('data:image'));
}
}
} catch(error) {}
const store = readJSON(IMAGE_STORE_KEY, {});
const images = Array.isArray(store[id]) ? store[id] : [];
return images.filter(img => String(img?.dataUrl || '').startsWith('data:image'));
}
function imageCardsHTML(images){
if (!images.length) {
return `
<div class="empty-gallery">
Este proyecto aún no tiene imágenes.
</div>`;
}
return `
<div class="gallery-grid">
${images.map((image, index) => {
const date = formatDate(image.createdAt);
const size = formatBytes(image.size);
return `
<figure class="image-card"><img src="${image.dataUrl}" alt="${safe(image.name || 'Imagen del proyecto')}" loading="eager"><figcaption><strong>${safe(image.name || 'Imagen ' + (index + 1))}</strong><span>${safe([date, size].filter(Boolean).join(' · ') || 'Evidencia del proyecto')}</span></figcaption></figure>`;
}).join('')}
</div>`;
}
function buildProjectOnlyReportHTML(project){
const projectId = String(project?.id || '').trim();
const images = getProjectImagesSafe(projectId);
const generatedAt = new Date();
const title = cleanText(project?.title || project?.name, 'Proyecto');
const description = cleanText(project?.description || project?.desc || project?.details, 'Sin descripción registrada.');
const status = cleanText(project?.status || project?.estado, 'No definido');
const priority = cleanText(project?.priority || project?.prioridad, 'No definida');
const leader = cleanText(projectLeaderSafe(project), 'Sin responsable asignado');
const company = cleanText(getCompanySafe(project), 'Organización no definida');
const progress = project?.progress ?? project?.avance ?? project?.percent ?? '';
const startDate = formatDate(project?.startDate || project?.fechaInicio || project?.createdAt);
const endDate = formatDate(project?.endDate || project?.dueDate || project?.deadline || project?.fechaFin || project?.vencimiento);
return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reporte de Proyecto - ${safe(title)}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111827}body{font-family:Inter,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5}.report{width:100%}.cover{padding:24px 0 26px;border-bottom:3px solid #111827;margin-bottom:26px;page-break-inside:avoid;break-inside:avoid}.eyebrow{text-transform:uppercase;letter-spacing:2px;font-size:10px;font-weight:800;color:#6b7280;margin:0 0 10px}h1{font-size:34px;line-height:1.05;letter-spacing:-1px;margin:0 0 10px;color:#0f172a}.subtitle{margin:0;color:#4b5563;font-size:14px}.meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:24px 0;page-break-inside:avoid;break-inside:avoid}.meta-card{border:1px solid #d1d5db;border-radius:12px;padding:12px 14px;background:#f9fafb;min-height:62px}.meta-card span{display:block;color:#6b7280;font-size:10px;text-transform:uppercase;font-weight:800;letter-spacing:.6px;margin-bottom:4px}.meta-card strong{color:#111827;font-size:14px;word-break:break-word}.section{margin:24px 0;page-break-inside:avoid;break-inside:avoid}.section h2{font-size:18px;margin:0 0 10px;color:#111827}.description{border-left:4px solid #111827;background:#f8fafc;padding:16px;border-radius:0 12px 12px 0;color:#374151;white-space:pre-wrap}.gallery-section{margin-top:28px}.gallery-title{display:flex;align-items:baseline;justify-content:space-between;gap:12px;border-bottom:1px solid #e5e7eb;padding-bottom:10px;margin-bottom:16px}.gallery-title h2{margin:0}.gallery-title span{color:#6b7280;font-size:12px}.gallery-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.image-card{margin:0;border:1px solid #d1d5db;border-radius:14px;padding:10px;background:#fff;page-break-inside:avoid;break-inside:avoid}.image-card img{width:100%;height:205px;object-fit:cover;display:block;border-radius:10px;border:1px solid #e5e7eb}.image-card figcaption{margin-top:9px;color:#4b5563;font-size:11px;line-height:1.35;word-break:break-word}.image-card figcaption strong{display:block;color:#111827;font-size:12px;margin-bottom:2px}.image-card figcaption span{color:#6b7280}.empty-gallery{border:1px dashed #cbd5e1;border-radius:14px;padding:18px;color:#64748b;background:#f8fafc}.footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:11px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.image-card{page-break-inside:avoid;break-inside:avoid}.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style></head><body><main class="report"><header class="cover"><p class="eyebrow">Reporte profesional de proyecto</p><h1>${safe(title)}</h1><p class="subtitle">${safe(company)} · Generado el ${safe(generatedAt.toLocaleDateString())} a las ${safe(generatedAt.toLocaleTimeString())}</p></header><section class="meta-grid"><div class="meta-card"><span>ID del proyecto</span><strong>${safe(projectId || 'No disponible')}</strong></div><div class="meta-card"><span>Responsable</span><strong>${safe(leader)}</strong></div><div class="meta-card"><span>Estado</span><strong>${safe(status)}</strong></div><div class="meta-card"><span>Prioridad</span><strong>${safe(priority)}</strong></div>
${progress !== '' ? `<div class="meta-card"><span>Avance</span><strong>${safe(progress)}%</strong></div>` : ''}
${startDate ? `<div class="meta-card"><span>Fecha de inicio</span><strong>${safe(startDate)}</strong></div>` : ''}
${endDate ? `<div class="meta-card"><span>Fecha límite</span><strong>${safe(endDate)}</strong></div>` : ''}
</section><section class="section"><h2>Información del proyecto</h2><div class="description">${safe(description)}</div></section><section class="gallery-section"><div class="gallery-title"><h2>Galería del proyecto</h2><span>${images.length} imagen${images.length === 1 ? '' : 'es'}</span></div>
${imageCardsHTML(images)}
</section><footer class="footer">
Documento generado localmente por ProManage. Este PDF contiene únicamente datos del proyecto seleccionado y sus imágenes asociadas por ID.
</footer></main></body></html>`;
}
function waitForImages(doc, timeoutMs){
const images = Array.from(doc.images || []);
if (!images.length) return Promise.resolve();
const imagePromises = images.map(img => new Promise(resolve => {
if (img.complete) return resolve();
img.onload = () => resolve();
img.onerror = () => resolve();
}));
const timeout = new Promise(resolve => setTimeout(resolve, timeoutMs || 1200));
return Promise.race([Promise.all(imagePromises), timeout]);
}
function printIsolatedHTML(html){
return new Promise((resolve, reject) => {
try {
const old = document.getElementById('pm-clean-project-pdf-frame');
if (old) old.remove();
const frame = document.createElement('iframe');
frame.id = 'pm-clean-project-pdf-frame';
frame.setAttribute('title', 'ProManage PDF limpio');
frame.style.position = 'fixed';
frame.style.right = '0';
frame.style.bottom = '0';
frame.style.width = '0';
frame.style.height = '0';
frame.style.border = '0';
frame.style.opacity = '0';
frame.style.pointerEvents = 'none';
document.body.appendChild(frame);
const doc = frame.contentDocument || frame.contentWindow.document;
doc.open();
doc.write(html);
doc.close();
const executePrint = async () => {
try {
await waitForImages(doc, 1800);
frame.contentWindow.focus();
frame.contentWindow.print();
setTimeout(() => frame.remove(), 6000);
resolve();
} catch(error) {
frame.remove();
reject(error);
}
};
if (doc.readyState === 'complete') {
setTimeout(executePrint, 180);
} else {
frame.onload = () => setTimeout(executePrint, 180);
setTimeout(executePrint, 900);
}
} catch(error) {
reject(error);
}
});
}
function notify(message, type){
try {
if (typeof showToast === 'function') return showToast(message, type || 'success');
} catch(error) {}
if (type === 'error') console.error(message);
else console.log(message);
}
function logProjectPDF(project){
try {
const title = project?.title || project?.name || project?.id || 'Proyecto';
if (typeof logActivity === 'function') logActivity('PDF limpio de proyecto generado: ' + title);
else if (typeof pushActivityLog === 'function') pushActivityLog('PDF limpio de proyecto generado: ' + title);
} catch(error) {}
}
window.generateSingleProjectPDF = function(){
try {
if (typeof window.pmRefreshReportProjects === 'function') {
try { window.pmRefreshReportProjects(); } catch(error) {}
}
const select = document.getElementById('reportProjectSelect');
const selectedValue = select?.value || select?.selectedOptions?.[0]?.dataset?.projectId || '';
if (!selectedValue) {
alert('Selecciona un proyecto');
return;
}
const project = findProjectSafe(selectedValue);
if (!project) {
console.warn('ProManage PDF limpio: proyecto no encontrado para:', selectedValue, getProjectsSafe());
alert('No se pudo encontrar ese proyecto. Vuelve a entrar al módulo Reportes y selecciónalo de nuevo.');
return;
}
const html = buildProjectOnlyReportHTML(project);
printIsolatedHTML(html)
.then(() => {
logProjectPDF(project);
notify('PDF limpio preparado: solo incluye el proyecto seleccionado y sus imágenes.', 'success');
})
.catch(error => {
console.error('Error imprimiendo PDF limpio del proyecto:', error);
alert('No se pudo preparar el PDF limpio del proyecto. Revisa la consola para más detalles.');
});
} catch(error) {
console.error('Error generando PDF limpio del proyecto:', error);
alert('No se pudo generar el PDF del proyecto.');
}
};
})();


/* === Bloque JS original 20 === */
(function(){
function hide(){['pmSplash','pmLoader'].forEach(function(id){var el=document.getElementById(id);if(el){el.classList.add('hidden');el.style.pointerEvents='none';setTimeout(function(){el.style.display='none';},180);}});}
function ensureVisible(){var auth=document.getElementById('authWrapper');var dash=document.getElementById('dashboardWrapper');var picker=document.getElementById('companyPickerWrapper');if(auth&&dash&&picker&&dash.style.display==='none'&&picker.style.display==='none'){auth.style.display='flex';}}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(hide,90);setTimeout(ensureVisible,260);},{once:true});}else{setTimeout(hide,0);setTimeout(ensureVisible,260);}
setTimeout(hide,850);
})();



/* === ProManage FIX PACK 2026-05-28: móvil cómodo, splash normal, PWA, PDF con galería y Excel profesional === */
(function(){
'use strict';
const START = Date.now();
const MIN_SPLASH_MS = 1250;
function $(id){ return document.getElementById(id); }
function readJSON(key, fallback){ try{ const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; } }
function writeJSON(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); return true; }catch(e){ console.warn('No se pudo guardar '+key, e); return false; } }
function notify(message,type){ try{ if(typeof showToast==='function') showToast(message,type||'success'); else if(typeof premiumToast==='function') premiumToast(message); else console.log(message); }catch(e){ console.log(message); } }
function safe(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function money(v){ const n=Number(v||0); return new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ',maximumFractionDigits:2}).format(n); }
function bytes(n){ n=Number(n||0); if(!n) return '0 KB'; if(n<1024) return n+' B'; if(n<1024*1024) return (n/1024).toFixed(1)+' KB'; return (n/(1024*1024)).toFixed(2)+' MB'; }
function allPMStorageBytes(){ return Object.keys(localStorage).filter(k=>k.startsWith('pm_')).reduce((a,k)=>a+String(localStorage.getItem(k)||'').length,0); }
function projectList(){ try{ if(typeof projects!=='undefined' && Array.isArray(projects)) return projects; }catch(e){} if(Array.isArray(window.projects)) return window.projects; return readJSON('pm_projects',[]); }
function financeList(){ try{ if(typeof finances!=='undefined' && Array.isArray(finances)) return finances; }catch(e){} if(Array.isArray(window.finances)) return window.finances; return readJSON('pm_finances',[]); }
function clientList(){ try{ if(typeof clients!=='undefined' && Array.isArray(clients)) return clients; }catch(e){} if(Array.isArray(window.clients)) return window.clients; return readJSON('pm_clients',[]); }
function inventoryList(){ try{ if(typeof inventory!=='undefined' && Array.isArray(inventory)) return inventory; }catch(e){} if(Array.isArray(window.inventory)) return window.inventory; return readJSON('pm_inventory',[]); }
function currentCompanyId(){ try{ if(typeof selectedCompanyId!=='undefined' && selectedCompanyId) return selectedCompanyId; }catch(e){} return window.selectedCompanyId || localStorage.getItem('pm_selectedCompanyId') || ''; }
function scope(rows){ const id=currentCompanyId(); return !id ? rows : rows.filter(r=>!r || !r.companyId || String(r.companyId)===String(id)); }
function syncLayoutState(){
  const dash=$('dashboardWrapper'), auth=$('authWrapper'), picker=$('companyPickerWrapper');
  const dashInline=(dash?.style?.display || '').replace(/\s/g,'').toLowerCase();
  const dashVisible=!!dash && dashInline!=='' && dashInline!=='none';
  document.body.classList.toggle('pm-dashboard-active', dashVisible);
  document.body.classList.toggle('pm-auth-screen-active', !dashVisible && !!auth && getComputedStyle(auth).display!=='none');
  document.body.classList.toggle('pm-picker-active', !dashVisible && !!picker && getComputedStyle(picker).display!=='none');
  if(!dashVisible){
    $('sidebar')?.classList.remove('active');
    $('pmSmartAssistantPanel')?.classList.remove('active');
    const panel=document.querySelector('.pm-assistant-panel'); if(panel) panel.classList.remove('active');
  }
}
function keepSplashVisible(){
  const splash=$('pmSplash');
  const loader=$('pmLoader');
  if(loader) loader.style.display='none';
  if(!splash) return;
  splash.classList.add('pm-visible-lock');
  splash.classList.remove('hidden','pm-finished');
  splash.style.display='flex';
}
function finishSplash(){
  const splash=$('pmSplash'); if(!splash) return;
  const elapsed=Date.now()-START;
  const delay=Math.max(0, MIN_SPLASH_MS-elapsed);
  setTimeout(()=>{
    splash.classList.remove('pm-visible-lock');
    splash.classList.add('pm-finished','hidden');
    splash.style.pointerEvents='none';
    setTimeout(()=>{ splash.style.display='none'; }, 380);
  }, delay);
}
keepSplashVisible();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ syncLayoutState(); keepSplashVisible(); finishSplash(); },{once:true});
else { syncLayoutState(); finishSplash(); }
window.addEventListener('load',()=>{ syncLayoutState(); finishSplash(); },{once:true});
setInterval(syncLayoutState, 700);
['click','input','change'].forEach(evt=>document.addEventListener(evt,()=>setTimeout(syncLayoutState,60),true));
const oldSwitch=window.switchSection;
if(typeof oldSwitch==='function') window.switchSection=function(section){ const r=oldSwitch.apply(this,arguments); setTimeout(syncLayoutState,80); if(innerWidth<=1024) window.scrollTo({top:0,behavior:'smooth'}); return r; };

function installManifest(){
  try{
    if(document.querySelector('link[rel="manifest"]')) return;
    const manifest={name:'ProManage',short_name:'ProManage',start_url:'./index.html',display:'standalone',background_color:'#050505',theme_color:'#c9a86a',description:'Gestión local de proyectos, finanzas, inventario y reportes.',icons:[{src:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="112" fill="%23050505"/%3E%3Cpath d="M126 322V150h155c67 0 109 34 109 88s-42 87-109 87h-69v37h-86Zm86-105h63c18 0 29-9 29-23s-11-23-29-23h-63v46Z" fill="%23c9a86a"/%3E%3Cpath d="M126 385h260v-55H126v55Z" fill="%23f1dfad"/%3E%3C/svg%3E',sizes:'512x512',type:'image/svg+xml'}]};
    const link=document.createElement('link'); link.rel='manifest'; link.href='data:application/manifest+json,'+encodeURIComponent(JSON.stringify(manifest)); document.head.appendChild(link);
  }catch(e){}
}
installManifest();
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredInstallPrompt=e; });
window.installProManageApp=async function(){
  if(deferredInstallPrompt){ deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice.catch(()=>{}); deferredInstallPrompt=null; }
  else alert('Para instalar en iPhone: toca Compartir y luego “Agregar a pantalla de inicio”. En Android: menú del navegador > Instalar app.');
};

function normalizeImageRecord(raw, projectId, index){
  if(!raw) return null;
  const dataUrl=raw.dataUrl || raw.url || raw.src || raw.base64 || raw.image || raw.content || '';
  if(!String(dataUrl).startsWith('data:image')) return null;
  return { id: raw.id || ('img_'+index), projectId, name: raw.name || raw.filename || raw.title || ('Imagen '+(index+1)), type: raw.type || 'image/jpeg', size: raw.size || Math.round((String(dataUrl).split(',')[1]||'').length*.75), dataUrl, createdAt: raw.createdAt || raw.date || raw.uploadedAt || '' };
}
function collectProjectImages(project){
  const projectId=String(project?.id||'').trim();
  const out=[]; const seen=new Set();
  function addList(list){ if(!Array.isArray(list)) return; list.forEach((x,i)=>{ const img=normalizeImageRecord(x,projectId,out.length+i); if(img && !seen.has(img.dataUrl)){ seen.add(img.dataUrl); out.push(img); } }); }
  try{ if(typeof window.getProjectImages==='function') addList(window.getProjectImages(projectId)); }catch(e){}
  const stores=['pm_projectImages','pm_project_images','pm_projectsImages','pm_gallery','pm_media','pm_attachments'];
  stores.forEach(key=>{
    const data=readJSON(key, null);
    if(!data) return;
    if(Array.isArray(data)) addList(data.filter(x=>String(x?.projectId||x?.project||x?.parentId||'')===projectId));
    else if(Array.isArray(data[projectId])) addList(data[projectId]);
  });
  ['images','gallery','media','attachments','files','evidence','evidences'].forEach(k=>addList(project?.[k]));
  return out;
}
function findProject(raw){
  const value=String(raw||'').trim(); const all=projectList(); if(!value) return null;
  let p=all.find(x=>String(x?.id||'').trim()===value); if(p) return p;
  const lower=value.toLowerCase();
  p=all.find(x=>String(x?.id||'').trim().toLowerCase()===lower || String(x?.title||x?.name||'').trim().toLowerCase()===lower); if(p) return p;
  const opt=$('reportProjectSelect')?.selectedOptions?.[0]; const oid=opt?.dataset?.projectId || opt?.getAttribute('data-project-id');
  return oid ? all.find(x=>String(x?.id||'').trim()===String(oid).trim()) || null : null;
}
function projectReportHTML(project){
  const images=collectProjectImages(project); const now=new Date();
  const title=project?.title || project?.name || 'Proyecto';
  const desc=project?.description || project?.desc || project?.details || 'Sin descripción registrada.';
  const status=project?.status || project?.estado || 'No definido'; const priority=project?.priority || project?.prioridad || 'No definida';
  const progress=project?.progress ?? project?.avance ?? project?.percent ?? '';
  const gallery=images.length?`<div class="gallery-grid">${images.map((img,i)=>`<figure><img src="${img.dataUrl}" alt="${safe(img.name)}"><figcaption><strong>${safe(img.name||('Imagen '+(i+1)))}</strong><span>${safe([img.createdAt?new Date(img.createdAt).toLocaleDateString('es-GT'):'', img.size?bytes(img.size):''].filter(Boolean).join(' · '))}</span></figcaption></figure>`).join('')}</div>`:`<div class="empty">Este proyecto aún no tiene imágenes guardadas en su galería.</div>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte ${safe(title)}</title><style>@page{size:A4;margin:13mm}*{box-sizing:border-box}body{margin:0;color:#111827;background:white;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}.cover{padding:26px 0 24px;border-bottom:4px solid #111827;margin-bottom:24px}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:900;color:#6366f1;margin:0 0 9px}h1{font-size:34px;line-height:1.05;margin:0 0 9px;letter-spacing:-1px}.subtitle{color:#4b5563;margin:0}.meta{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:22px 0}.card{border:1px solid #d1d5db;border-radius:12px;padding:12px;background:#f8fafc}.card span{display:block;color:#6b7280;font-size:10px;text-transform:uppercase;font-weight:900;letter-spacing:.5px}.card strong{display:block;margin-top:4px;font-size:14px}.section{margin:24px 0;break-inside:avoid}.desc{border-left:4px solid #111827;background:#f8fafc;border-radius:0 12px 12px 0;padding:16px;white-space:pre-wrap}.gallery-head{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid #e5e7eb;margin:28px 0 16px;padding-bottom:10px}.gallery-head h2{margin:0;font-size:18px}.gallery-head span{color:#6b7280}.gallery-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.gallery-grid figure{margin:0;border:1px solid #d1d5db;border-radius:14px;padding:10px;break-inside:avoid;background:white}.gallery-grid img{width:100%;height:210px;object-fit:cover;border-radius:9px;border:1px solid #e5e7eb;display:block}.gallery-grid figcaption{margin-top:8px;font-size:11px;color:#4b5563;word-break:break-word}.gallery-grid figcaption strong{display:block;color:#111827;font-size:12px}.gallery-grid figcaption span{color:#6b7280}.empty{border:1px dashed #cbd5e1;border-radius:14px;background:#f8fafc;color:#64748b;padding:18px}.footer{margin-top:26px;border-top:1px solid #e5e7eb;padding-top:10px;color:#6b7280;font-size:11px}@media print{.gallery-grid figure{page-break-inside:avoid;break-inside:avoid}}</style></head><body><main><header class="cover"><p class="eyebrow">Reporte profesional de proyecto</p><h1>${safe(title)}</h1><p class="subtitle">Generado el ${now.toLocaleDateString('es-GT')} a las ${now.toLocaleTimeString('es-GT')}</p></header><section class="meta"><div class="card"><span>ID</span><strong>${safe(project?.id||'No disponible')}</strong></div><div class="card"><span>Estado</span><strong>${safe(status)}</strong></div><div class="card"><span>Prioridad</span><strong>${safe(priority)}</strong></div><div class="card"><span>Avance</span><strong>${progress!==''?safe(progress)+'%':'No registrado'}</strong></div></section><section class="section"><h2>Información del proyecto</h2><div class="desc">${safe(desc)}</div></section><section><div class="gallery-head"><h2>Galería del proyecto</h2><span>${images.length} imagen${images.length===1?'':'es'}</span></div>${gallery}</section><footer class="footer">Documento generado localmente por ProManage. Solo contiene datos del proyecto seleccionado y su galería asociada.</footer></main></body></html>`;
}
function printHTML(html){ return new Promise((resolve,reject)=>{ try{ const old=$('pm-project-pdf-frame-v2'); if(old) old.remove(); const frame=document.createElement('iframe'); frame.id='pm-project-pdf-frame-v2'; frame.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none'; document.body.appendChild(frame); const doc=frame.contentDocument||frame.contentWindow.document; doc.open(); doc.write(html); doc.close(); const run=()=>{ const imgs=[...doc.images]; Promise.race([Promise.all(imgs.map(img=>new Promise(r=>{ if(img.complete) r(); else{ img.onload=r; img.onerror=r; }}))), new Promise(r=>setTimeout(r,2500))]).then(()=>{ frame.contentWindow.focus(); frame.contentWindow.print(); setTimeout(()=>frame.remove(),6000); resolve(); }); }; if(doc.readyState==='complete') setTimeout(run,250); else frame.onload=()=>setTimeout(run,250); }catch(e){ reject(e); } }); }
window.generateSingleProjectPDF=function(){
  try{
    if(typeof window.pmRefreshReportProjects==='function') try{ window.pmRefreshReportProjects(); }catch(e){}
    const select=$('reportProjectSelect'); const value=select?.value || select?.selectedOptions?.[0]?.dataset?.projectId || '';
    if(!value){ alert('Selecciona un proyecto'); return; }
    const project=findProject(value); if(!project){ alert('No se pudo encontrar ese proyecto. Vuelve a seleccionarlo en Reportes.'); return; }
    printHTML(projectReportHTML(project)).then(()=>notify('PDF preparado con la galería real del proyecto.','success')).catch(err=>{ console.error(err); alert('No se pudo preparar el PDF con imágenes.'); });
  }catch(err){ console.error(err); alert('No se pudo generar el PDF del proyecto.'); }
};

function aoaSheet(rows){ return XLSX.utils.aoa_to_sheet(rows); }
function setWidths(ws, widths){ ws['!cols']=widths.map(w=>({wch:w})); }
function addAutoFilter(ws, range){ ws['!autofilter']={ref:range}; }
function professionalFinanceWorkbook(){
  const wb=XLSX.utils.book_new(); const finances=scope(financeList()); const projects=scope(projectList()); const inventory=scope(inventoryList()); const clients=scope(clientList());
  const income=finances.filter(f=>String(f.type||'').toLowerCase().includes('ingreso')).reduce((a,f)=>a+Number(f.amount||0),0);
  const expenses=finances.filter(f=>!String(f.type||'').toLowerCase().includes('ingreso')).reduce((a,f)=>a+Number(f.amount||0),0);
  const balance=income-expenses; const now=new Date();
  const resumen=aoaSheet([
    ['ProManage - Reporte Financiero Profesional'],
    ['Generado', now.toLocaleString('es-GT')],
    [],
    ['Indicador','Valor'],
    ['Ingresos', income],
    ['Egresos', expenses],
    ['Balance', balance],
    ['Proyectos registrados', projects.length],
    ['Clientes registrados', clients.length],
    ['Productos en inventario', inventory.length],
    ['Registros financieros', finances.length],
    ['Almacenamiento local usado', bytes(allPMStorageBytes())]
  ]); setWidths(resumen,[32,22]); XLSX.utils.book_append_sheet(wb,resumen,'Resumen Ejecutivo');
  const finRows=[['Tipo','Categoría','Monto','Fecha','Empresa','ID']].concat(finances.map(f=>[f.type||'',f.category||f.categoria||'',Number(f.amount||0),f.date||f.fecha||'',f.companyId||'',f.id||'']));
  const fin=aoaSheet(finRows); setWidths(fin,[14,26,16,18,22,24]); addAutoFilter(fin,'A1:F'+Math.max(1,finRows.length)); XLSX.utils.book_append_sheet(wb,fin,'Finanzas');
  const byCat={}; finances.forEach(f=>{ const cat=f.category||f.categoria||'Sin categoría'; if(!byCat[cat]) byCat[cat]={ingresos:0,egresos:0,balance:0}; const amt=Number(f.amount||0); if(String(f.type||'').toLowerCase().includes('ingreso')) byCat[cat].ingresos+=amt; else byCat[cat].egresos+=amt; byCat[cat].balance=byCat[cat].ingresos-byCat[cat].egresos; });
  const catRows=[['Categoría','Ingresos','Egresos','Balance']].concat(Object.entries(byCat).map(([k,v])=>[k,v.ingresos,v.egresos,v.balance])); const cat=aoaSheet(catRows); setWidths(cat,[30,16,16,16]); addAutoFilter(cat,'A1:D'+Math.max(1,catRows.length)); XLSX.utils.book_append_sheet(wb,cat,'Resumen por Categoría');
  const proRows=[['Proyecto','Estado','Prioridad','Avance','Empresa','ID']].concat(projects.map(p=>[p.title||p.name||'',p.status||p.estado||'',p.priority||p.prioridad||'',p.progress??p.avance??'',p.companyId||'',p.id||''])); const pro=aoaSheet(proRows); setWidths(pro,[34,18,18,12,22,24]); addAutoFilter(pro,'A1:F'+Math.max(1,proRows.length)); XLSX.utils.book_append_sheet(wb,pro,'Proyectos');
  const invRows=[['Item','Cantidad','Unidad','Costo','Estado','ID']].concat(inventory.map(i=>[i.name||i.item||i.product||'',i.quantity??i.qty??'',i.unit||'',i.cost??i.price??'',i.status||'',i.id||''])); const inv=aoaSheet(invRows); setWidths(inv,[32,14,14,16,18,24]); addAutoFilter(inv,'A1:F'+Math.max(1,invRows.length)); XLSX.utils.book_append_sheet(wb,inv,'Inventario');
  wb.Props={Title:'ProManage Reporte Financiero',Subject:'Exportación profesional',Author:'ProManage',CreatedDate:new Date()};
  return wb;
}
window.exportProjectsExcel=function(){
  if(typeof XLSX==='undefined'){ alert('El exportador Excel aún está cargando. Intenta de nuevo en unos segundos.'); return; }
  const stamp=new Date().toISOString().slice(0,10);
  XLSX.writeFile(professionalFinanceWorkbook(), 'ProManage_Reporte_Profesional_'+stamp+'.xlsx');
  notify('Excel profesional exportado correctamente.','success');
};
window.exportProfessionalFinanceExcel=window.exportProjectsExcel;

window.exportFullBackupJSON = window.exportFullBackupJSON || function(){ const payload={exportedAt:new Date().toISOString(),version:'ProManage Backup',data:{}}; Object.keys(localStorage).filter(k=>k.startsWith('pm_')).forEach(k=>payload.data[k]=localStorage.getItem(k)); const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='ProManage_Backup_'+new Date().toISOString().slice(0,10)+'.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); notify('Backup exportado.','success'); };
function injectSystemHealth(){
  const dash=$('section-dash') || document.querySelector('.section.active'); if(!dash || $('pmSystemHealthMini')) return;
  const holder=document.createElement('div'); holder.id='pmSystemHealthMini'; holder.className='pm-system-health-floating';
  const finances=scope(financeList()); const ingresos=finances.filter(f=>String(f.type||'').toLowerCase().includes('ingreso')).reduce((a,f)=>a+Number(f.amount||0),0); const egresos=finances.filter(f=>!String(f.type||'').toLowerCase().includes('ingreso')).reduce((a,f)=>a+Number(f.amount||0),0);
  holder.innerHTML=`<div class="pm-health-mini"><span>Estado local</span><strong>${bytes(allPMStorageBytes())}</strong></div><div class="pm-health-mini"><span>Balance</span><strong>${money(ingresos-egresos)}</strong></div><div class="pm-health-mini"><span>Proyectos</span><strong>${scope(projectList()).length}</strong></div><div class="pm-health-mini"><span>Respaldo</span><strong>${readJSON('pm_auto_backup',null)?.day||'Recomendado'}</strong></div>`;
  const first=dash.querySelector('.stats-grid,.panel,.pm-kpis'); dash.insertBefore(holder, first || dash.firstChild);
}
setTimeout(injectSystemHealth,900); setInterval(()=>{ if(document.body.classList.contains('pm-dashboard-active')) injectSystemHealth(); },5000);
})();


/* =========================================================
   PREMIUM STABILITY + RESPONSIVE DRAWER CONTROLLER
   ========================================================= */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);
  function visible(el){
    if(!el) return false;
    const inline=(el.style.display||'').trim().toLowerCase();
    if(inline && inline !== 'none') return true;
    try{return getComputedStyle(el).display !== 'none' && el.offsetParent !== null;}catch(e){return false;}
  }
  function isDashboardActive(){
    const dash=$('dashboardWrapper'), auth=$('authWrapper'), picker=$('companyPickerWrapper');
    if(!dash) return false;
    const dashDisplay=(dash.style.display||'').replace(/\s/g,'').toLowerCase();
    const authHidden=!auth || (auth.style.display||'').replace(/\s/g,'').toLowerCase()==='none' || getComputedStyle(auth).display==='none';
    const pickerHidden=!picker || (picker.style.display||'').replace(/\s/g,'').toLowerCase()==='none' || getComputedStyle(picker).display==='none';
    return dashDisplay !== 'none' && authHidden && pickerHidden;
  }
  function closeMobileSidebar(){
    $('sidebar')?.classList.remove('active');
    $('pmMobileSidebarBackdrop')?.classList.remove('active');
    document.body.classList.remove('pm-mobile-sidebar-open');
  }
  function toggleMobileSidebar(){
    const side=$('sidebar'); if(!side) return;
    const open=!side.classList.contains('active');
    side.classList.toggle('active', open);
    $('pmMobileSidebarBackdrop')?.classList.toggle('active', open);
    document.body.classList.toggle('pm-mobile-sidebar-open', open);
  }
  function ensureDrawerControls(){
    if(!$('pmMobileSidebarToggle')){
      const b=document.createElement('button');
      b.id='pmMobileSidebarToggle';
      b.className='pm-mobile-sidebar-toggle';
      b.type='button';
      b.setAttribute('aria-label','Abrir menú');
      b.innerHTML='<i aria-hidden="true"></i><span>Menú</span>';
      b.addEventListener('click', toggleMobileSidebar);
      document.body.appendChild(b);
    }
    if(!$('pmMobileSidebarBackdrop')){
      const bg=document.createElement('div');
      bg.id='pmMobileSidebarBackdrop';
      bg.className='pm-mobile-sidebar-backdrop';
      bg.addEventListener('click', closeMobileSidebar);
      document.body.appendChild(bg);
    }
  }
  function syncPremiumLayout(){
    const dash=$('dashboardWrapper'), auth=$('authWrapper'), picker=$('companyPickerWrapper'), splash=$('pmSplash'), loader=$('pmLoader');
    ensureDrawerControls();
    const active=isDashboardActive();
    document.body.classList.toggle('pm-dashboard-active', active);
    document.body.classList.toggle('pm-auth-active', !active && visible(auth));
    document.body.classList.toggle('pm-picker-active', !active && visible(picker));
    const toggle=$('pmMobileSidebarToggle'), bg=$('pmMobileSidebarBackdrop');
    if(toggle) toggle.style.display = active ? '' : 'none';
    if(!active){ closeMobileSidebar(); }
    if(active){
      if(dash && (dash.style.display||'').toLowerCase()==='none') dash.style.display='flex';
      if(auth) auth.style.display='none';
      if(picker) picker.style.display='none';
      [splash, loader].forEach(el=>{ if(el){ el.classList.add('hidden'); el.style.display='none'; el.style.opacity='0'; el.style.visibility='hidden'; el.style.pointerEvents='none'; }});
    }
    if(window.innerWidth > 1024){
      closeMobileSidebar();
      if(active && $('sidebar')) $('sidebar').classList.remove('active');
    }
  }
  ['load','resize','orientationchange','pageshow'].forEach(evt=>window.addEventListener(evt,()=>setTimeout(syncPremiumLayout,50),{passive:true}));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(syncPremiumLayout,50),{once:true}); else setTimeout(syncPremiumLayout,50);
  document.addEventListener('click',e=>{
    if(e.target && e.target.closest && e.target.closest('.sidebar .menu-item') && window.innerWidth <= 1024){ setTimeout(closeMobileSidebar,120); }
    setTimeout(syncPremiumLayout,80);
  },true);
  document.addEventListener('change',()=>setTimeout(syncPremiumLayout,80),true);
  document.addEventListener('input',()=>setTimeout(syncPremiumLayout,80),true);
  setInterval(syncPremiumLayout,900);

  function wrap(name, after){
    const old=window[name];
    if(typeof old !== 'function') return;
    if(old.__pmPremiumWrapped) return;
    const fn=function(){
      const result=old.apply(this,arguments);
      setTimeout(after||syncPremiumLayout,80);
      setTimeout(after||syncPremiumLayout,260);
      return result;
    };
    fn.__pmPremiumWrapped=true;
    window[name]=fn;
  }
  ['handleAuth','submitCreateCompany','selectCompany','openCompanyPicker','logout','switchSection','toggleUserDropdown'].forEach(n=>wrap(n,syncPremiumLayout));

  window.toggleProManageMobileMenu=toggleMobileSidebar;
  window.closeProManageMobileMenu=closeMobileSidebar;

  function addRefinedMotion(){
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards=[...document.querySelectorAll('.stat-card,.panel,.project-card,.kanban-column')].slice(0,80);
    cards.forEach(card=>{
      if(card.dataset.pmTiltReady) return;
      card.dataset.pmTiltReady='1';
      card.addEventListener('mousemove',ev=>{
        const r=card.getBoundingClientRect();
        const x=((ev.clientX-r.left)/r.width-.5)*4;
        const y=((ev.clientY-r.top)/r.height-.5)*-4;
        card.style.transform=`translateY(-4px) perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
      });
      card.addEventListener('mouseleave',()=>{card.style.transform='';});
    });
  }
  setTimeout(addRefinedMotion,700);
  setInterval(addRefinedMotion,3000);

  function cleanBadUpgradeCopy(){
    // Removes any previous experimental marketing copy if an older cache/script left it behind.
    const bad=$('pmOsLoginShowcase');
    if(bad) bad.remove();
    [...document.querySelectorAll('*')].slice(0,80).forEach(el=>{
      if(el.childNodes && el.childNodes.length===1 && el.textContent && /ProManage\s+OS\s+Upgrade|Control total para proyectos reales|Dashboard ejecutivo, finanzas/i.test(el.textContent)) el.remove();
    });
  }
  setTimeout(cleanBadUpgradeCopy,120);
  setInterval(cleanBadUpgradeCopy,1500);
})();

/* ==========================================================
   ProManage Premium Runtime V2
   UI polish, responsive stability, animated mark, mobile drawer.
   Does not remove or replace existing business functions.
   ========================================================== */
(function(){
  'use strict';
  const $ = (id)=>document.getElementById(id);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const raf = (fn)=>requestAnimationFrame(()=>requestAnimationFrame(fn));

  function premiumState(){
    const dash=$('dashboardWrapper'), auth=$('authWrapper'), picker=$('companyPickerWrapper');
    const dashboardVisible=!!(dash && getComputedStyle(dash).display!=='none');
    document.body.classList.toggle('pm-dashboard-active', dashboardVisible);
    document.body.classList.toggle('pm-auth-active', !!(auth && getComputedStyle(auth).display!=='none'));
    document.body.classList.toggle('pm-picker-active', !!(picker && getComputedStyle(picker).display!=='none'));
    if(dashboardVisible){
      ['pmSplash','pmLoader'].forEach(id=>{const el=$(id); if(el){el.classList.add('hidden'); el.style.display='none'; el.style.opacity='0'; el.style.visibility='hidden';}});
    }
    if(window.innerWidth>1024){
      const sb=$('sidebar'); if(sb) sb.classList.remove('active');
      const bd=$('pmMobileSidebarBackdrop'); if(bd) bd.classList.remove('active');
    }
  }

  function ensureOrbs(){
    if(document.querySelector('.pm-premium-orb-layer')) return;
    const layer=document.createElement('div');
    layer.className='pm-premium-orb-layer';
    layer.innerHTML='<span class="pm-premium-orb"></span><span class="pm-premium-orb"></span><span class="pm-premium-orb"></span>';
    document.body.prepend(layer);
  }

  function ensureLoginMark(){
    $$('.login-card,.company-picker-card').forEach(card=>{
      if(card.querySelector('.pm-premium-mark')) return;
      const mark=document.createElement('div');
      mark.className='pm-premium-mark';
      const first=card.firstElementChild;
      card.insertBefore(mark, first || null);
    });
  }

  const iconMap={
    dash:'⌂',intelligence:'✦',projects:'▦',team:'◇',employees:'◌',clients:'◎',finances:'₿',inventory:'□',reports:'◫'
  };
  function refineSidebar(){
    const brand=document.querySelector('.brand-info');
    if(brand && !brand.querySelector('.pm-sidebar-logo')){
      const dot=brand.querySelector('.sidebar-brand-dot');
      const logo=document.createElement('span');
      logo.className='pm-sidebar-logo';
      brand.insertBefore(logo, dot || brand.firstChild);
    }
    $$('.sidebar .menu-item').forEach(item=>{
      if(item.querySelector('.pm-menu-icon')) return;
      const key=(item.id||'').replace('menu-','');
      const ico=document.createElement('span');
      ico.className='pm-menu-icon';
      ico.textContent=iconMap[key] || '•';
      item.insertBefore(ico,item.firstChild);
    });
    const sidebar=$('sidebar');
    if(sidebar && !sidebar.querySelector('.pm-sidebar-foot')){
      const foot=document.createElement('div');
      foot.className='pm-sidebar-foot';
      foot.innerHTML='<strong>Sistema activo</strong><span>Datos locales protegidos</span>';
      sidebar.appendChild(foot);
    }
  }

  function ensureMobileControls(){
    if(!$('pmMobileSidebarBackdrop')){
      const bd=document.createElement('div');
      bd.id='pmMobileSidebarBackdrop';
      bd.className='pm-mobile-sidebar-backdrop';
      bd.addEventListener('click',closeMobileSidebar,{passive:true});
      document.body.appendChild(bd);
    }
    if(!$('pmMobileSidebarToggle')){
      const btn=document.createElement('button');
      btn.id='pmMobileSidebarToggle';
      btn.className='pm-mobile-sidebar-toggle';
      btn.type='button';
      btn.setAttribute('aria-label','Abrir menú');
      btn.innerHTML='<i aria-hidden="true"></i><span>Menú</span>';
      btn.addEventListener('click',toggleMobileSidebar);
      document.body.appendChild(btn);
    }
  }
  function toggleMobileSidebar(){
    if(window.innerWidth>1024) return;
    const sb=$('sidebar'), bd=$('pmMobileSidebarBackdrop');
    if(!sb) return;
    const active=!sb.classList.contains('active');
    sb.classList.toggle('active',active);
    if(bd) bd.classList.toggle('active',active);
    const btn=$('pmMobileSidebarToggle');
    if(btn) btn.setAttribute('aria-label', active?'Cerrar menú':'Abrir menú');
  }
  function closeMobileSidebar(){
    const sb=$('sidebar'), bd=$('pmMobileSidebarBackdrop');
    if(sb) sb.classList.remove('active');
    if(bd) bd.classList.remove('active');
  }
  window.toggleProManageMobileMenu=toggleMobileSidebar;
  window.closeProManageMobileMenu=closeMobileSidebar;

  function revealVisible(){
    const els=$$('.stat-card,.panel,.project-card,.kanban-column,.table-responsive,.content-header').filter(el=>!el.dataset.pmRevealed);
    const vh=window.innerHeight||800;
    els.slice(0,80).forEach((el,i)=>{
      const r=el.getBoundingClientRect();
      if(r.top<vh+120){
        el.dataset.pmRevealed='1';
        el.classList.add('pm-reveal');
        el.style.animationDelay=Math.min(i*0.025,.25)+'s';
      }
    });
  }

  function addRipples(){
    $$('button,.menu-item,.company-item-btn,.view-tab-btn,.filter-btn').forEach(el=>{
      if(el.dataset.pmRippleReady) return;
      el.dataset.pmRippleReady='1';
      el.addEventListener('click',ev=>{
        const style=getComputedStyle(el);
        if(style.position==='static') el.style.position='relative';
        el.style.overflow='hidden';
        const r=el.getBoundingClientRect();
        const s=document.createElement('span');
        s.className='pm-premium-ripple';
        s.style.left=(ev.clientX-r.left)+'px';
        s.style.top=(ev.clientY-r.top)+'px';
        el.appendChild(s);
        setTimeout(()=>s.remove(),780);
      },{passive:true});
    });
  }

  function animateCounters(){
    $$('.stat-card .value').forEach(el=>{
      const text=(el.textContent||'').trim();
      if(el.dataset.pmLastValue===text) return;
      el.dataset.pmLastValue=text;
      el.classList.remove('pm-counter-flash');
      void el.offsetWidth;
      el.classList.add('pm-counter-flash');
    });
  }

  function premiumTilt(){
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $$('.stat-card,.panel,.project-card,.kanban-column,.company-item-btn').slice(0,110).forEach(card=>{
      if(card.dataset.pmTiltV2) return;
      card.dataset.pmTiltV2='1';
      card.addEventListener('mousemove',ev=>{
        if(window.innerWidth<1025) return;
        const r=card.getBoundingClientRect();
        const x=((ev.clientX-r.left)/Math.max(r.width,1)-.5)*5.5;
        const y=((ev.clientY-r.top)/Math.max(r.height,1)-.5)*-5.5;
        card.style.transform=`translateY(-5px) perspective(1100px) rotateX(${y}deg) rotateY(${x}deg)`;
      },{passive:true});
      card.addEventListener('mouseleave',()=>{card.style.transform='';},{passive:true});
    });
  }

  function cleanGeneratedCopy(){
    const bad=/ProManage\s+OS\s+Upgrade|Control total para proyectos reales|Dashboard ejecutivo, finanzas, evidencias/i;
    $$('body *').slice(0,160).forEach(el=>{
      if(el.children.length===0 && bad.test(el.textContent||'')) el.remove();
    });
  }

  function boot(){
    ensureOrbs();
    ensureLoginMark();
    ensureMobileControls();
    refineSidebar();
    premiumState();
    revealVisible();
    addRipples();
    animateCounters();
    premiumTilt();
    cleanGeneratedCopy();
  }

  ['load','resize','orientationchange','pageshow'].forEach(evt=>window.addEventListener(evt,()=>raf(boot),{passive:true}));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>raf(boot),{once:true}); else raf(boot);
  document.addEventListener('click',ev=>{
    if(ev.target && ev.target.closest && ev.target.closest('.sidebar .menu-item') && window.innerWidth<=1024){setTimeout(closeMobileSidebar,130)}
    setTimeout(()=>raf(boot),120);
  },true);
  document.addEventListener('input',()=>setTimeout(()=>raf(boot),120),true);
  document.addEventListener('change',()=>setTimeout(()=>raf(boot),120),true);
  setInterval(boot,1600);

  function wrap(name){
    const original=window[name];
    if(typeof original!=='function' || original.__pmPremiumV2) return;
    const wrapped=function(){
      const out=original.apply(this,arguments);
      setTimeout(()=>raf(boot),80);
      setTimeout(()=>raf(boot),280);
      return out;
    };
    wrapped.__pmPremiumV2=true;
    window[name]=wrapped;
  }
  ['handleAuth','toggleAuthMode','submitCreateCompany','selectCompany','openCompanyPicker','logout','switchSection','toggleUserDropdown','toggleSmartAssistant','renderDashboard','renderProjects','renderFinances','renderInventory'].forEach(wrap);
})();

/* =========================================================
   PROMANAGE GRAPHITE PREMIUM V3 RUNTIME
   Tema claro real + layout escritorio/móvil estable + look sin azul/morado.
   ========================================================= */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const raf2 = fn => requestAnimationFrame(()=>requestAnimationFrame(fn));

  function setThemeMeta(theme){
    let meta=document.querySelector('meta[name="theme-color"]');
    if(!meta){ meta=document.createElement('meta'); meta.name='theme-color'; document.head.appendChild(meta); }
    meta.content = theme === 'light' ? '#f5f1e8' : '#050505';
  }
  function applyGraphiteTheme(theme){
    const safe = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', safe);
    if(document.body) document.body.setAttribute('data-theme', safe);
    try{ localStorage.setItem('pm_theme', safe); localStorage.setItem('theme', safe); }catch(e){}
    setThemeMeta(safe);
    const label=$('themeToggleText');
    if(label) label.textContent = safe === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
    return safe;
  }
  window.applyTheme = applyGraphiteTheme;
  window.toggleTheme = function(){
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyGraphiteTheme(current === 'light' ? 'dark' : 'light');
    syncGraphiteLayout(true);
  };

  function isDisplayNone(el){
    if(!el) return true;
    const inline=(el.style.display||'').trim().toLowerCase();
    if(inline === 'none') return true;
    try{return getComputedStyle(el).display === 'none';}catch(e){return false;}
  }
  function currentCompanyExists(){
    try{
      const id=(typeof selectedCompanyId !== 'undefined' && selectedCompanyId) ? selectedCompanyId : localStorage.getItem('pm_selectedCompanyId');
      if(!id) return false;
      const list=JSON.parse(localStorage.getItem('pm_companies')||'[]');
      return Array.isArray(list) && list.some(c=>String(c.id)===String(id));
    }catch(e){return !!localStorage.getItem('pm_selectedCompanyId');}
  }
  function shouldDashboardBeActive(){
    const dash=$('dashboardWrapper'), auth=$('authWrapper'), picker=$('companyPickerWrapper');
    if(!dash) return false;
    const dashInline=(dash.style.display||'').trim().toLowerCase();
    if(dashInline && dashInline !== 'none') return true;
    try{ if(getComputedStyle(dash).display !== 'none' && dash.offsetParent !== null) return true; }catch(e){}
    if(currentCompanyExists() && auth && picker && isDisplayNone(auth) && isDisplayNone(picker)) return true;
    return false;
  }
  function hideLoadingLayers(){
    ['pmSplash','pmLoader'].forEach(id=>{
      const el=$(id);
      if(el){
        el.classList.add('hidden');
        el.style.display='none';
        el.style.opacity='0';
        el.style.visibility='hidden';
        el.style.pointerEvents='none';
      }
    });
  }
  function ensureMobileControls(){
    if(!$('pmMobileSidebarBackdrop')){
      const bg=document.createElement('div');
      bg.id='pmMobileSidebarBackdrop';
      bg.className='pm-mobile-sidebar-backdrop';
      bg.addEventListener('click',closeGraphiteSidebar,{passive:true});
      document.body.appendChild(bg);
    }
    if(!$('pmMobileSidebarToggle')){
      const b=document.createElement('button');
      b.id='pmMobileSidebarToggle';
      b.className='pm-mobile-sidebar-toggle';
      b.type='button';
      b.setAttribute('aria-label','Abrir menú');
      b.innerHTML='<i aria-hidden="true"></i><span>Menú</span>';
      b.addEventListener('click',toggleGraphiteSidebar);
      document.body.appendChild(b);
    }else if(!$('pmMobileSidebarToggle').querySelector('i')){
      $('pmMobileSidebarToggle').innerHTML='<i aria-hidden="true"></i><span>Menú</span>';
    }
  }
  function closeGraphiteSidebar(){
    const sb=$('sidebar'), bg=$('pmMobileSidebarBackdrop'), b=$('pmMobileSidebarToggle');
    if(sb) sb.classList.remove('active');
    if(bg) bg.classList.remove('active');
    document.body.classList.remove('pm-mobile-sidebar-open');
    if(b) b.setAttribute('aria-label','Abrir menú');
  }
  function toggleGraphiteSidebar(){
    if(window.innerWidth > 1024) return;
    const sb=$('sidebar'), bg=$('pmMobileSidebarBackdrop'), b=$('pmMobileSidebarToggle');
    if(!sb) return;
    const open=!sb.classList.contains('active');
    sb.classList.toggle('active',open);
    if(bg) bg.classList.toggle('active',open);
    document.body.classList.toggle('pm-mobile-sidebar-open',open);
    if(b) b.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
  }
  window.toggleProManageMobileMenu=toggleGraphiteSidebar;
  window.closeProManageMobileMenu=closeGraphiteSidebar;

  function syncGraphiteLayout(force){
    if(!document.body) return;
    ensureMobileControls();
    const dash=$('dashboardWrapper'), auth=$('authWrapper'), picker=$('companyPickerWrapper');
    const active=shouldDashboardBeActive();
    document.body.classList.toggle('pm-dashboard-active', active);
    document.body.classList.toggle('pm-auth-active', !active && !!auth && !isDisplayNone(auth));
    document.body.classList.toggle('pm-picker-active', !active && !!picker && !isDisplayNone(picker));
    if(active){
      if(dash) { dash.style.display='flex'; dash.style.visibility='visible'; dash.style.opacity='1'; }
      if(auth) auth.style.display='none';
      if(picker) picker.style.display='none';
      hideLoadingLayers();
      const sb=$('sidebar');
      if(sb){ sb.style.display='flex'; if(window.innerWidth>1024) sb.classList.remove('active'); }
      const main=document.querySelector('.main-content');
      if(main){ main.style.display='block'; main.style.visibility='visible'; main.style.opacity='1'; }
    }else{
      closeGraphiteSidebar();
    }
    const toggle=$('pmMobileSidebarToggle');
    if(toggle) toggle.style.display = active ? '' : 'none';
    if(window.innerWidth>1024) closeGraphiteSidebar();
  }

  function refineVisualDetails(){
    // Elimina texto promocional de intentos previos si quedó cacheado.
    const bad=/ProManage\s+OS\s+Upgrade|Control total para proyectos reales|Dashboard ejecutivo, finanzas, evidencias|experiencia premium optimizada/i;
    $$('body *').slice(0,220).forEach(el=>{
      if(el.children.length===0 && bad.test(el.textContent||'')) el.remove();
    });
    // Marca sobria en login/empresa sin textos extras.
    $$('.login-card,.company-picker-card').forEach(card=>{
      if(!card.querySelector('.pm-premium-mark')){
        const mark=document.createElement('div');
        mark.className='pm-premium-mark';
        card.insertBefore(mark,card.firstElementChild||null);
      }
    });
    // Iconos discretos de menú si faltan.
    const iconMap={dash:'⌂',intelligence:'✦',projects:'▦',team:'◇',employees:'◌',clients:'◎',finances:'Q',inventory:'□',reports:'◫'};
    $$('.sidebar .menu-item').forEach(item=>{
      if(!item.querySelector('.pm-menu-icon')){
        const key=(item.id||'').replace('menu-','');
        const ico=document.createElement('span'); ico.className='pm-menu-icon'; ico.textContent=iconMap[key]||'•';
        item.insertBefore(ico,item.firstChild);
      }
    });
    const sidebar=$('sidebar');
    if(sidebar && !sidebar.querySelector('.pm-sidebar-foot')){
      const foot=document.createElement('div');
      foot.className='pm-sidebar-foot';
      foot.innerHTML='<strong>Sistema activo</strong><span>ProManage local</span>';
      sidebar.appendChild(foot);
    }
  }
  function addMotion(){
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $$('.stat-card,.panel,.project-card,.kanban-column,.media-item-card').slice(0,100).forEach((el,i)=>{
      if(!el.dataset.pmGraphiteReveal){
        el.dataset.pmGraphiteReveal='1';
        el.style.animationDelay=Math.min(i*.018,.24)+'s';
        el.classList.add('pm-reveal');
      }
    });
  }
  function boot(){
    applyGraphiteTheme(localStorage.getItem('pm_theme') || localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'dark');
    refineVisualDetails();
    syncGraphiteLayout(true);
    addMotion();
  }

  function wrapAction(name){
    const original=window[name];
    if(typeof original !== 'function' || original.__pmGraphiteV3) return;
    const wrapped=function(){
      const out=original.apply(this,arguments);
      setTimeout(()=>raf2(boot),40);
      setTimeout(()=>raf2(boot),180);
      setTimeout(()=>raf2(boot),420);
      return out;
    };
    wrapped.__pmGraphiteV3=true;
    window[name]=wrapped;
  }
  ['handleAuth','toggleAuthMode','submitCreateCompany','selectCompany','openCompanyPicker','logout','switchSection','toggleUserDropdown','toggleSmartAssistant','renderDashboard','renderProjects','renderFinances','renderInventory'].forEach(wrapAction);

  ['DOMContentLoaded','load','pageshow','resize','orientationchange'].forEach(evt=>window.addEventListener(evt,()=>setTimeout(()=>raf2(boot),evt==='resize'?60:20),{passive:true}));
  document.addEventListener('click',ev=>{
    if(ev.target && ev.target.closest && ev.target.closest('.sidebar .menu-item') && window.innerWidth<=1024){ setTimeout(closeGraphiteSidebar,120); }
    setTimeout(()=>raf2(boot),90);
  },true);
  document.addEventListener('change',()=>setTimeout(()=>raf2(boot),90),true);
  document.addEventListener('input',()=>setTimeout(()=>raf2(boot),90),true);
  setInterval(()=>syncGraphiteLayout(false),1200);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
