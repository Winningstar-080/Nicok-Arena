const ADMIN_PASSWORD = "nicokadmin";

let participants = [];
let rules = "Default rules will appear here.";
let prizes = "Default prizes will appear here.";
let mode = "Group Stage";

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function renderParticipants() {
  const table = document.getElementById("participantTable");
  table.innerHTML = "";
  participants.forEach((p) => {
    table.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.points}</td>
        <td>${p.played}</td>
        <td>${p.wins}</td>
        <td>${p.losses}</td>
      </tr>
    `;
  });
}

function login() {
  const pass = document.getElementById("adminPassword").value;
  if (pass === ADMIN_PASSWORD) {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("adminControls").classList.remove("hidden");
  } else alert("Wrong password");
}

function addParticipant() {
  participants.push({
    name: pName.value,
    desc: pDesc.value,
    points: 0,
    played: 0,
    wins: 0,
    losses: 0
  });
  renderParticipants();
}

function updateRules() {
  rules = rulesInput.value;
  document.getElementById("rulesText").innerText = rules;
}

function updatePrizes() {
  prizes = prizesInput.value;
  document.getElementById("prizesText").innerText = prizes;
}

function setMode() {
  mode = modeSelect.value;
  document.getElementById("modeText").innerText = mode;
}

function generateBracket() {
  if (participants.length < 2) return alert("Not enough participants");
  const container = document.getElementById("bracketContainer");
  container.innerHTML = "";
  for (let i = 0; i < participants.length; i += 2) {
    container.innerHTML += `
      <div>${participants[i]?.name || "BYE"} vs ${participants[i+1]?.name || "BYE"}</div>
    `;
  }
}

document.getElementById("rulesText").innerText = rules;
document.getElementById("prizesText").innerText = prizes;
document.getElementById("modeText").innerText = mode;
