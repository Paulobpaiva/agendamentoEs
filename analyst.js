function loadRequests(status) {
  console.log(`Carregando solicitações com status: ${status}`);
  const requests = getFromStorage('requests').filter(request => request.status === status);
  console.log(`Solicitações filtradas (${status}):`, requests);
  const tbody = document.getElementById(`${status}Requests`);
  if (!tbody) {
    console.error(`Tabela ${status}Requests não encontrada`);
    return;
  }
  tbody.innerHTML = '';
  requests.forEach(request => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${request.id}</td>
      <td>${request.destinationDescription}</td>
      <td>${new Date(request.requestedDateTime).toLocaleString('pt-BR')}</td>
      <td>${request.carType}</td>
      <td>${request.reason}</td>
      ${status === 'pendente' ? `
        <td>
          <button onclick="showApproveModal(${request.id})" class="bg-blue-dark text-white p-2 rounded hover:bg-blue-hover">Aprovar</button>
          <button onclick="rejectRequest(${request.id})" class="bg-gray-medium text-white p-2 rounded hover:bg-gray-hover">Rejeitar</button>
        </td>` : ''}
    `;
    tbody.appendChild(row);
  });
}

function showApproveModal(requestId) {
  const modal = document.getElementById('approveModal');
  if (!modal) {
    console.error('Modal de aprovação não encontrado');
    return;
  }
  const drivers = getFromStorage('drivers');
  const driverSelect = document.getElementById('driverSelect');
  if (!driverSelect) {
    console.error('Elemento driverSelect não encontrado');
    return;
  }
  driverSelect.innerHTML = '<option value="">Selecione um motorista</option>';
  drivers.forEach(driver => {
    const option = document.createElement('option');
    option.value = driver.id;
    option.textContent = driver.name;
    driverSelect.appendChild(option);
  });
  modal.classList.remove('hidden');
  document.getElementById('modalConfirm').onclick = () => approveRequest(requestId);
  document.getElementById('modalCancel').onclick = () => modal.classList.add('hidden');
}

function approveRequest(requestId) {
  const driverId = document.getElementById('driverSelect').value;
  if (!driverId) {
    alert('Selecione um motorista.');
    return;
  }
  const requests = getFromStorage('requests');
  const request = requests.find(r => r.id === requestId);
  if (!request) {
    console.error(`Solicitação ${requestId} não encontrada`);
    return;
  }
  request.status = 'aprovado';
  request.driverId = driverId;
  request.vehicleId = getFromStorage('vehicles').find(v => v.type === request.carType).id;
  saveToStorage('requests', requests);
  document.getElementById('approveModal').classList.add('hidden');
  loadRequests('pendente');
  loadRequests('aprovado');
}

function rejectRequest(requestId) {
  const requests = getFromStorage('requests');
  const request = requests.find(r => r.id === requestId);
  if (!request) {
    console.error(`Solicitação ${requestId} não encontrada`);
    return;
  }
  request.status = 'rejeitado';
  saveToStorage('requests', requests);
  loadRequests('pendente');
  loadRequests('rejeitado');
}

document.addEventListener('DOMContentLoaded', () => {
  loadRequests('pendente');
  loadRequests('aprovado');
  loadRequests('rejeitado');
});