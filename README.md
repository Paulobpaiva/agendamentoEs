# 🚗 Sistema de Agendamento de Veículos

Sistema web para solicitação e análise de transporte de veículos, desenvolvido como parte de um projeto acadêmico na **UFPE**. A aplicação permite que usuários solicitem veículos a partir de um ponto de origem fixo, visualizem rotas no mapa, recebam confirmações por e-mail e gerenciem o status das solicitações.

---

## ✨ Funcionalidades

### ✅ Solicitação de Veículo

- Formulário para inserir:
  - CEP de destino
  - Descrição do endereço
  - E-mail
  - Data e horário
  - Motivo da solicitação
  - Tipo de carro (Sedan, SUV ou Van)
- Validação de CEP, e-mail e horários disponíveis
- Exibição da rota no mapa com **Leaflet**
- Confirmação via **modal** com fundo cinza e letras pretas, posicionado sobre o campo "Endereço de Origem"
- Envio de e-mail com protocolo de solicitação via **Brevo API**

### ✅ Análise de Solicitações

- Visualização de solicitações pendentes, aprovadas e rejeitadas em tabelas
- Aprovação com seleção de motorista via modal
- Rejeição com atualização automática de status

### ✅ Persistência

- Armazenamento local de veículos e solicitações via `localStorage`

---

## 🛠 Tecnologias Utilizadas

### 🔹 Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
- Tailwind CSS (com classes personalizadas)
- Leaflet.js `v1.9.4` (para mapas)
- Flatpickr `v4.x` (para seleção de data e hora)

### 🔹 Backend/Serviços
- `localStorage` para persistência
- **Brevo API** para envio de e-mails

### 🔹 Ferramentas de Desenvolvimento
- Visual Studio Code
- Live Server (extensão)
- Python HTTP server (alternativa)

---

## ⚙️ Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge)
- Conexão com a internet (para carregar mapas e enviar e-mails)
- Chave da API da Brevo
- Python 3.x **ou** extensão **Live Server** no VS Code

---

## 🚀 Instalação

```bash
git clone https://github.com/Paulobpaiva/agendamentoEs.git
cd agendamentoEs
