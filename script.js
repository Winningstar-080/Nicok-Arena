const ADMIN_PASSWORD = "admin123";

let isAdminLoggedIn = false;
let editIndex = null;
let currentGroup = "A";
let mode = "groupStage";

// Dynamic Data Structure
let tournamentData = {
  groupStage: {}, // Unlimited groups
  roundRobin: [],
  knockout: []
};

let rules = "Default rules will appear here.";
let prizes = "Default prizes will appear here.";

/* ===============================
   SHOW SECTIONS
================================= */
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

/* ===============================
   RENDER PARTICIPANTS
================================= */
function renderParticipants() {
  const container = document.getElementById("tablesContainer");
  container.innerHTML = "";

  if (mode === "knockout") {
    document.getElementById("participants").classList.add("hidden");
    document.getElementById("brackets").classList.remove("hidden");
    return;
  } else {
    document.getElementById("participants").classList.remove("hidden");
    document.getElementById("brackets").classList.add("hidden");
  }

  if (mode === "groupStage") {
    // Sort groups alphabetically
    Object.keys(tournamentData.groupStage).sort().forEach(grp => {
      const tableData = tournamentData.groupStage[grp];
      container.innerHTML += `<h4>Group ${grp}</h4><table>${generateTableHTML(tableData)}</table>`;
    });
  }

  if (mode === "roundRobin") {
    const tableData = tournamentData.roundRobin;
    container.innerHTML += `<table>${generateTableHTML(tableData)}</table>`;
  }
}

/* ===============================
   GENERATE TABLE HTML
================================= */
function generateTableHTML(participants) {
  // Auto-calculate points & played
  participants.forEach(p => {
    p.played = p.wins + p.draws + p.losses;
    p.points = (p.wins * 3) + p.draws;
  });

  // Sort by points then diff
  participants.sort((a, b) => {
    if (b.points === a.points) return b.diff - a.diff;
    return b.points - a.points;
  });

  let header = "";
  if (mode === "roundRobin") {
    header = `<tr>
      <th>Pos</th><th>Team</th><th>Points</th><th>Games</th>
      <th>Wins</th><th>Draws</th><th>Losses</th><th>GD</th>
      ${isAdminLoggedIn ? "<th>Actions</th>" : ""}
    </tr>`;
  } else {
    header = `<tr>
      <th>#</th><th>Name</th><th>Pts</th><th>P</th><th>W</th><th>D</th><th>L</th><th>+/-</th>
      ${isAdminLoggedIn ? "<th>Actions</th>" : ""}
    </tr>`;
  }

  let html = `<thead>${header}</thead><tbody>`;

  participants.forEach((p, idx) => {
    html += `<tr>
      <td>${idx + 1}</td>
      <td>${p.name}</td>
      <td>${p.points}</td>
      <td>${p.played}</td>
      <td>${p.wins}</td>
      <td>${p.draws}</td>
      <td>${p.losses}</td>
      <td>${p.diff}</td>
      ${isAdminLoggedIn ? `<td>
        <button onclick="editParticipant('${mode}','${p.name}','${p.group}')">✏</button>
        <button onclick="deleteParticipant('${mode}','${p.name}','${p.group}')">🗑</button>
      </td>` : ""}
    </tr>`;
  });

  html += "</tbody>";
  return html;
}

/* ===============================
   LOGIN
================================= */
function login() {
  if (adminPassword.value === ADMIN_PASSWORD) {
    loginBox.classList.add("hidden");
    adminControls.classList.remove("hidden");
    isAdminLoggedIn = true;
    renderParticipants();
  } else {
    alert("Wrong password");
  }
}

/* ===============================
   ADD OR UPDATE PARTICIPANT
================================= */
function addParticipant() {
  const name = pName.value.trim();
  const wins = Number(pWins.value) || 0;
  const draws = Number(pDraws.value) || 0;
  const losses = Number(pLosses.value) || 0;
  const diff = Number(pDiff.value) || 0;
  const group = groupSelect.value.trim();

  if (!name) { alert("Enter participant name"); return; }

  const data = { name, wins, draws, losses, diff, group };

  if (mode === "groupStage") {
    if (!tournamentData.groupStage[group]) tournamentData.groupStage[group] = [];

    if (editIndex !== null) {
      tournamentData.groupStage[group][editIndex] = data;
      editIndex = null;
    } else {
      tournamentData.groupStage[group].push(data);
    }
  } else if (mode === "roundRobin") {
    if (editIndex !== null) {
      tournamentData.roundRobin[editIndex] = data;
      editIndex = null;
    } else {
      tournamentData.roundRobin.push(data);
    }
  }

  clearInputs();
  renderParticipants();
}

/* ===============================
   EDIT / DELETE
================================= */
function editParticipant(modeName, participantName, group) {
  let list = modeName === "groupStage" ? tournamentData.groupStage[group] : tournamentData.roundRobin;
  let idx = list.findIndex(p => p.name === participantName);
  const p = list[idx];

  pName.value = p.name;
  pWins.value = p.wins;
  pDraws.value = p.draws;
  pLosses.value = p.losses;
  pDiff.value = p.diff;
  groupSelect.value = p.group;

  editIndex = idx;
}

function deleteParticipant(modeName, participantName, group) {
  let list = modeName === "groupStage" ? tournamentData.groupStage[group] : tournamentData.roundRobin;
  let idx = list.findIndex(p => p.name === participantName);
  list.splice(idx, 1);
  renderParticipants();
}

/* ===============================
   CLEAR INPUTS
================================= */
function clearInputs() {
  pName.value = "";
  pWins.value = "";
  pDraws.value = "";
  pLosses.value = "";
  pDiff.value = "";
  groupSelect.value = "";
}

/* ===============================
   RULES / PRIZES / MODE
================================= */
function updateRules() {
  rules = rulesInput.value;
  rulesText.innerText = rules;
}

function updatePrizes() {
  prizes = prizesInput.value;
  prizesText.innerText = prizes;
}

function setMode() {
  mode = modeSelect.value;
  renderParticipants();
  modeText.innerText = modeSelect.options[modeSelect.selectedIndex].text;
}

/* ===============================
   KNOCKOUT BRACKET GENERATOR
================================= */
function generateBracket() {
  if (mode !== "knockout") return;

  const container = document.getElementById("bracketContainer");
  container.innerHTML = "";

  const list = tournamentData.knockout.length ? tournamentData.knockout : [...tournamentData.roundRobin];

  if (list.length < 2) {
    alert("Not enough participants for knockout");
    return;
  }

  for (let i = 0; i < list.length; i += 2) {
    container.innerHTML += `<div>${list[i]?.name || "BYE"} vs ${list[i+1]?.name || "BYE"}</div>`;
  }
}

/* ===============================
   INITIAL DISPLAY
================================= */
rulesText.innerText = rules;
prizesText.innerText = prizes;
modeText.innerText = modeSelect.options[modeSelect.selectedIndex].text;