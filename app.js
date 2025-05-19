function getFromStorage(key) {
  console.log(`Lendo ${key} do localStorage`);
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveToStorage(key, data) {
  console.log(`Salvando em ${key} no localStorage`, data);
  localStorage.setItem(key, JSON.stringify(data));
}

async function getAddressFromCep(cep) {
  console.log(`Buscando endereço para CEP: ${cep}`);
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    console.log('Resposta do ViaCEP:', data);
    if (data.erro) throw new Error('CEP inválido');
    return `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error.message);
    throw new Error('Erro ao buscar CEP');
  }
}

async function getCoordinatesFromAddress(address) {
  console.log(`Buscando coordenadas para endereço: ${address}`);
  const formattedAddress = address.replace(/ - /g, ', ').replace(/,+/g, ',').trim();
  console.log(`Endereço formatado: ${formattedAddress}`);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formattedAddress)}&format=json&limit=1&addressdetails=1`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    const data = await response.json();
    console.log('Resposta do Nominatim:', data);
    if (!data.length) {
      const simplifiedAddress = formattedAddress.split(',').slice(-2).join(',').trim();
      console.log(`Tentando endereço simplificado: ${simplifiedAddress}`);
      const retryResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(simplifiedAddress)}&format=json&limit=1`);
      const retryData = await retryResponse.json();
      console.log('Resposta do Nominatim (retry):', retryData);
      if (!retryData.length) throw new Error(`Nenhum resultado encontrado para o endereço: ${address}`);
      return { lat: parseFloat(retryData[0].lat), lon: parseFloat(retryData[0].lon) };
    }
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (error) {
    console.error('Erro ao buscar coordenadas:', error.message);
    throw new Error(`Não foi possível obter coordenadas. ${error.message}`);
  }
}

function getAvailableDateTimes(carType) {
  console.log(`Buscando horários disponíveis para ${carType}`);
  const requests = getFromStorage('requests').filter(r => r.status === 'aprovado' && r.carType === carType);
  const vehicles = getFromStorage('vehicles').filter(v => v.type === carType);
  const availableSlots = [];

  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);

  for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
    vehicles.forEach(vehicle => {
      const [startHour, endHour] = vehicle.availableHours.split('-').map(h => parseInt(h.split(':')[0]));
      for (let hour = startHour; hour <= endHour; hour++) {
        const dateTime = new Date(d);
        dateTime.setHours(hour, 0, 0, 0);
        if (dateTime <= today) continue;
        const isBooked = requests.some(r => {
          const bookedDate = new Date(r.requestedDateTime);
          return bookedDate.getTime() === dateTime.getTime() && r.vehicleId === vehicle.id;
        });
        if (!isBooked) {
          availableSlots.push(dateTime.toISOString());
        }
      }
    });
  }

  console.log(`Horários disponíveis para ${carType}:`, availableSlots);
  return availableSlots;
}