let map, routingControl, flatpickrInstance;

function initMap() {
  console.log('Inicializando mapa');
  if (typeof L === 'undefined') {
    console.error('Leaflet não está carregado');
    return;
  }
  map = L.map('map').setView([-8.0569, -34.9512], 13); // UFPE
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
}

async function updateRoute(destinationAddress) {
  console.log('Atualizando rota para:', destinationAddress);
  try {
    const originCoords = { lat: -8.0569, lon: -34.9512 }; // UFPE
    const destCoords = await getCoordinatesFromAddress(destinationAddress);
    if (routingControl) {
      map.removeControl(routingControl);
    }
    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(originCoords.lat, originCoords.lon),
        L.latLng(destCoords.lat, destCoords.lon)
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      lineOptions: { styles: [{ color: '#2563eb', weight: 4 }] }
    }).addTo(map);
    console.log('Rota atualizada com sucesso');
  } catch (error) {
    console.error('Erro ao traçar rota:', error.message);
    showModal('Erro', `Não foi possível traçar a rota. Verifique o endereço ou tente outro CEP.`);
  }
}

function showModal(title, message, showCancel = false) {
  console.log('Exibindo modal:', title, message);
  const modal = document.getElementById('modal');
  if (!modal) {
    console.error('Elemento modal não encontrado');
    return;
  }
  const modalContent = modal.querySelector('div');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  if (!modalTitle || !modalMessage) {
    console.error('Elementos modalTitle ou modalMessage não encontrados');
    return;
  }
  modalTitle.textContent = title;
  modalMessage.innerHTML = message;
  document.getElementById('modalCancel').classList.toggle('hidden', !showCancel);
  document.getElementById('modalConfirm').textContent = showCancel ? 'Confirmar' : 'OK';
  document.getElementById('modalConfirm').onclick = () => {
    modal.classList.add('hidden');
    if (title === 'Sucesso') {
      document.getElementById('requestForm').reset();
      if (flatpickrInstance) flatpickrInstance.clear();
    }
  };
  if (showCancel) {
    document.getElementById('modalCancel').onclick = () => modal.classList.add('hidden');
  }
  modal.classList.remove('hidden');
  modalContent.classList.remove('scale-0');
  modalContent.classList.add('scale-100');
}

async function sendConfirmationEmail(email, request) {
  console.log(`Tentando enviar e-mail para ${email} com protocolo #${request.id}`);
  const apiKey = 'SUA_CHAVE_API_BREVO'; // Substituir pela chave do Brevo
  if (!apiKey || apiKey === 'SUA_CHAVE_API_BREVO') {
    console.error('Chave API do Brevo não configurada');
    showModal('Aviso', 'Solicitação registrada, mas a chave API do e-mail não está configurada.');
    return;
  }
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: 'Sistema de Agendamento', email: 'noreply@agendamentoes.com' },
        to: [{ email }],
        subject: `Confirmação de Solicitação #${request.id}`,
        htmlContent: `
          <h2>Solicitação Registrada</h2>
          <p>Prezado(a),</p>
          <p>Sua solicitação foi registrada com sucesso!</p>
          <ul>
            <li><strong>Protocolo:</strong> #${request.id}</li>
            <li><strong>Destino:</strong> ${request.destinationDescription}</li>
            <li><strong>Data/Horário:</strong> ${new Date(request.requestedDateTime).toLocaleString('pt-BR')}</li>
            <li><strong>Tipo de Carro:</strong> ${request.carType}</li>
          </ul>
          <p>Acompanhe o status em nossa plataforma.</p>
          <p>Atenciosamente,<br>Sistema de Agendamento</p>
        `
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro HTTP: ${response.status}, ${errorData.message || 'Erro desconhecido'}`);
    }
    console.log('E-mail enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error.message);
    showModal('Aviso', 'Solicitação registrada, mas falha ao enviar e-mail de confirmação.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();

  // Configurar veículos padrão se não existirem
  if (!getFromStorage('vehicles').length) {
    console.log('Configurando veículos padrão');
    saveToStorage('vehicles', [
      { id: 1, type: 'sedan', availableHours: '08:00-17:00' },
      { id: 2, type: 'suv', availableHours: '08:00-17:00' },
      { id: 3, type: 'van', availableHours: '08:00-17:00' }
    ]);
  }

  const destinationCep = document.getElementById('destinationCep');
  if (destinationCep) {
    destinationCep.addEventListener('blur', async () => {
      const cepInput = destinationCep.value.replace(/\D/g, '');
      console.log('CEP digitado:', cepInput);
      if (cepInput.length === 8) {
        try {
          const address = await getAddressFromCep(cepInput);
          document.getElementById('destinationDescription').value = address;
          await updateRoute(address);
        } catch (error) {
          console.error('Erro ao buscar CEP:', error.message);
          showModal('Erro', 'CEP inválido ou não encontrado. Tente outro CEP.');
          document.getElementById('destinationDescription').value = '';
        }
      } else {
        showModal('Erro', 'Formato de CEP inválido. Use 12345-678.');
        document.getElementById('destinationDescription').value = '';
      }
    });
  } else {
    console.error('Elemento destinationCep não encontrado');
  }

  const carType = document.getElementById('carType');
  if (carType) {
    carType.addEventListener('change', () => {
      const selectedCarType = carType.value;
      console.log('Tipo de carro alterado:', selectedCarType);
      if (flatpickrInstance) {
        const availableTimes = getAvailableDateTimes(selectedCarType);
        console.log('Horários disponíveis atualizados:', availableTimes);
        flatpickrInstance.set('enable', availableTimes);
      }
    });
  }

  const requestedDateTime = document.getElementById('requestedDateTime');
  if (requestedDateTime) {
    try {
      flatpickrInstance = flatpickr('#requestedDateTime', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
        minDate: 'today',
        defaultHour: 8,
        minuteIncrement: 60,
        enable: getAvailableDateTimes(document.getElementById('carType').value),
        locale: {
          firstDayOfWeek: 0,
          weekdays: {
            shorthand: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            longhand: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
          },
          months: {
            shorthand: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            longhand: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
          }
        },
        onReady: () => console.log('Flatpickr pronto'),
        onOpen: () => console.log('Flatpickr aberto')
      });
      console.log('Flatpickr inicializado');
    } catch (error) {
      console.error('Erro ao inicializar Flatpickr:', error.message);
    }
  } else {
    console.error('Elemento requestedDateTime não encontrado');
  }

  const requestForm = document.getElementById('requestForm');
  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const destinationCep = document.getElementById('destinationCep').value;
      const destinationDescription = document.getElementById('destinationDescription').value;
      const email = document.getElementById('email').value;
      const requestedDateTime = document.getElementById('requestedDateTime').value;
      const reason = document.getElementById('reason').value;
      const carType = document.getElementById('carType').value;

      console.log('Dados do formulário:', { destinationCep, destinationDescription, email, requestedDateTime, reason, carType });

      if (!destinationCep || !destinationDescription || !email || !requestedDateTime || !reason || !carType) {
        showModal('Erro', 'Preencha todos os campos.');
        return;
      }

      const cepRegex = /^\d{5}-?\d{3}$/;
      if (!cepRegex.test(destinationCep)) {
        showModal('Erro', 'Formato de CEP inválido. Use 12345-678.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showModal('Erro', 'Formato de e-mail inválido.');
        return;
      }

      const requestedDate = new Date(requestedDateTime);
      const now = new Date();
      if (requestedDate <= now) {
        showModal('Erro', 'A data e horário devem ser futuros.');
        return;
      }

      const availableSlots = getAvailableDateTimes(carType);
      if (!availableSlots.includes(requestedDate.toISOString())) {
        showModal('Erro', 'Horário indisponível para o tipo de carro selecionado.');
        return;
      }

      const request = {
        id: Date.now(),
        origin: document.getElementById('origin').value,
        destinationCep,
        destinationDescription,
        email,
        requestedDateTime,
        reason,
        carType,
        status: 'pendente',
        createdAt: new Date().toISOString()
      };

      console.log('Salvando solicitação:', request);
      try {
        const requests = getFromStorage('requests');
        requests.push(request);
        saveToStorage('requests', requests);
        console.log('Solicitação salva no localStorage');
      } catch (error) {
        console.error('Erro ao salvar solicitação:', error.message);
        showModal('Erro', 'Falha ao salvar a solicitação.');
        return;
      }

      await sendConfirmationEmail(email, request);
      showModal('Sucesso', `Solicitação realizada com sucesso! Protocolo: <strong>#${request.id}</strong>`);
    });
  } else {
    console.error('Elemento requestForm não encontrado');
  }
});