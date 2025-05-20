function loadRequests(status, tableBodyId) {
  const requests = getFromStorage('requests').filter(req => req.status === status);
  const tableBody = document.getElementById(tableBodyId);
  tableBody.innerHTML = '';
  console.log(`Carregando solicitações com status: ${status}`, requests);

  requests.forEach(req => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${req.id}</td>
      <td>${req.destinationDescription}</td>
      <td>${new Date(req.requestedDateTime).toLocaleString('pt-BR')}</td>
      <td>${req.carType}</td>
      <td>${req.reason}</td>
      ${status === 'pendente' ? `
        <td>
          <button class="approve-btn bg-blue-dark text-white p-2 rounded hover:bg-blue-hover mr-2" data-id="${req.id}">Aprovar</button>
          <button class="reject-btn bg-gray-medium text-white p-2 rounded hover:bg-gray-hover" data-id="${req.id}">Rejeitar</button>
        </td>
      ` : ''}
    `;
    tableBody.appendChild(row);
  });

  if (status === 'pendente') {
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', () => showApproveModal(btn.dataset.id));
    });
    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', () => rejectRequest(btn.dataset.id));
    });
  }
}

function showApproveModal(requestId) {
  console.log('Exibindo modal de aprovação para solicitação:', requestId);
  const modal = new bootstrap.Modal(document.getElementById('approveModal'));
  const driverSelect = document.getElementById('driverSelect');
  const modalConfirm = document.getElementById('modalConfirm');
  const modalCancel = document.getElementById('modalCancel');

  driverSelect.innerHTML = `
    <option value="motorista1">Motorista 1</option>
    <option value="motorista2">Motorista 2</option>
    <option value="motorista3">Motorista 3</option>
  `;

  modalConfirm.onclick = () => {
    const driver = driverSelect.value;
    approveRequest(requestId, driver);
    modal.hide();
  };
  modalCancel.onclick = () => modal.hide();

  modal.show();
}

function approveRequest(requestId, driver) {
  console.log(`Aprovando solicitação ${requestId} com motorista ${driver}`);
  const requests = getFromStorage('requests');
  const request = requests.find(req => req.id == requestId);
  if (request) {
    request.status = 'aprovado';
    request.driver = driver;
    saveToStorage('requests', requests);
    loadRequests('pendente', 'pendenteRequests');
    loadRequests('aprovado', 'aprovadoRequests');
  }
}

function rejectRequest(requestId) {
  console.log(`Rejeitando solicitação ${requestId}`);
  const requests = getFromStorage('requests');
  const request = requests.find(req => req.id == requestId);
  if (request) {
    request.status = 'rejeitado';
    saveToStorage('requests', requests);
    loadRequests('pendente', 'pendenteRequests');
    loadRequests('rejeitado', 'rejeitadoRequests');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadRequests('pendente', 'pendenteRequests');
  loadRequests('aprovado', 'aprovadoRequests');
  loadRequests('rejeitado', 'rejeitadoRequests');
});