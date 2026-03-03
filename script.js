/* =====================================================
   NICOK ARENA – PROFESSIONAL TOURNAMENT ENGINE
   Fully Integrated Build
===================================================== */

const ADMIN_PASSWORD = "admin123";

let isAdminLoggedIn = false;
let editIndex = null;
let mode = "groupStage";

/* ===============================
   DATA STRUCTURES
================================= */

let tournamentData = {
  groupStage: {},     // unlimited groups
  roundRobin: [],
  knockout: []
};

let fixturesData = [];
let knockoutRounds = [];
let knockoutChampion = null;
let knockoutRunnerUp = null;

/* ===============================
   SECTION NAVIGATION
================================= */

function showSection(id) {
  document.querySelectorAll(".section")
    .forEach(sec => sec.classList.add("hidden"));

  document.getElementById(id).classList.remove("hidden");
}

/* ===============================
   ADMIN LOGIN
================================= */

function login() {
  if (adminPassword.value === ADMIN_PASSWORD) {
    isAdminLoggedIn = true;
    loginBox.classList.add("hidden");
    adminControls.classList.remove("hidden");
    renderParticipants();
  } else {
    alert("Wrong password");
  }
}

/* ===============================
   MODE SWITCH
================================= */

function setMode() {
  mode = modeSelect.value;
  modeText.innerText = modeSelect.options[modeSelect.selectedIndex].text;
  renderParticipants();
}

/* ===============================
   PARTICIPANT MANAGEMENT
================================= */

function addParticipant() {
  const name = pName.value.trim();
  if (!name) return alert("Enter participant name");

  const data = {
    name,
    wins: Number(pWins.value) || 0,
    draws: Number(pDraws.value) || 0,
    losses: Number(pLosses.value) || 0,
    diff: Number(pDiff.value) || 0,
    group: groupSelect.value.trim()
  };

  if (mode === "groupStage") {
    if (!data.group) return alert("Enter group name");

    if (!tournamentData.groupStage[data.group])
      tournamentData.groupStage[data.group] = [];

    if (editIndex !== null) {
      tournamentData.groupStage[data.group][editIndex] = data;
      editIndex = null;
    } else {
      tournamentData.groupStage[data.group].push(data);
    }
  }

  if (mode === "roundRobin") {
    if (editIndex !== null) {
      tournamentData.roundRobin[editIndex] = data;
      editIndex = null;
    } else {
      tournamentData.roundRobin.push(data);
    }
  }

  if (mode === "knockout") {
    if (editIndex !== null) {
      tournamentData.knockout[editIndex] = data;
      editIndex = null;
    } else {
      tournamentData.knockout.push(data);
    }
  }

  clearInputs();
  renderParticipants();
}

function deleteParticipant(modeName, name, group) {
  let list =
    modeName === "groupStage"
      ? tournamentData.groupStage[group]
      : tournamentData[modeName];

  list.splice(list.findIndex(p => p.name === name), 1);
  renderParticipants();
}

function clearInputs() {
  pName.value = "";
  pWins.value = "";
  pDraws.value = "";
  pLosses.value = "";
  pDiff.value = "";
  groupSelect.value = "";
}

/* ===============================
   TABLE RENDERING
================================= */

function renderParticipants() {
  const container = document.getElementById("tablesContainer");
  container.innerHTML = "";

  if (mode === "groupStage") {
    Object.keys(tournamentData.groupStage).forEach(group => {
      const list = tournamentData.groupStage[group];
      if (list.length === 0) return;

      container.innerHTML += `
        <h4>Group ${group}</h4>
        <table>${generateTable(list)}</table>
      `;
    });
  }

  if (mode === "roundRobin") {
    container.innerHTML += `
      <table>${generateTable(tournamentData.roundRobin)}</table>
    `;
  }
}

function generateTable(list) {
  list.forEach(p => {
    p.played = p.wins + p.draws + p.losses;
    p.points = p.wins * 3 + p.draws;
  });

  list.sort((a, b) => {
    if (b.points === a.points) return b.diff - a.diff;
    return b.points - a.points;
  });

  return `
    <thead>
      <tr>
        <th>#</th><th>Name</th><th>Pts</th><th>P</th>
        <th>W</th><th>D</th><th>L</th><th>+/-</th>
      </tr>
    </thead>
    <tbody>
      ${list.map((p, i) => `
        <tr>
          <td>${i+1}</td>
          <td>${p.name}</td>
          <td>${p.points}</td>
          <td>${p.played}</td>
          <td>${p.wins}</td>
          <td>${p.draws}</td>
          <td>${p.losses}</td>
          <td>${p.diff}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
}

/* ===============================
   FIXTURES
================================= */

function generateFixtures() {
  const container = document.getElementById("fixturesContainer");
  container.innerHTML = "";
  fixturesData = [];

  if (mode === "roundRobin") {
    const list = tournamentData.roundRobin;

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        container.innerHTML += `
          <div class="fixture-card">
            ${list[i].name} vs ${list[j].name}
          </div>
        `;
      }
    }
  }

  if (mode === "groupStage") {
    Object.keys(tournamentData.groupStage).forEach(group => {
      const list = tournamentData.groupStage[group];

      if (list.length < 2) return;

      container.innerHTML += `<h4>Group ${group}</h4>`;

      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          container.innerHTML += `
            <div class="fixture-card">
              ${list[i].name} vs ${list[j].name}
            </div>
          `;
        }
      }
    });
  }
}

/* ===============================
   KNOCKOUT ENGINE
================================= */

function generateBracket() {
  if (mode !== "knockout") return;

  const participants = [...tournamentData.knockout];
  if (participants.length < 2)
    return alert("Not enough participants");

  knockoutRounds = [];
  knockoutChampion = null;
  knockoutRunnerUp = null;

  let firstRound = [];

  for (let i = 0; i < participants.length; i += 2) {
    firstRound.push({
      home: participants[i]?.name || "BYE",
      away: participants[i+1]?.name || "BYE",
      homeScore: null,
      awayScore: null,
      winner: null
    });
  }

  knockoutRounds.push(firstRound);

  let size = firstRound.length;
  while (size > 1) {
    const next = [];
    for (let i = 0; i < Math.ceil(size/2); i++) {
      next.push({home:null,away:null,homeScore:null,awayScore:null,winner:null});
    }
    knockoutRounds.push(next);
    size = next.length;
  }

  renderBracket();
}

function enterKnockoutScore(r, m) {
  if (!isAdminLoggedIn) return alert("Admin only");

  const match = knockoutRounds[r][m];

  const h = Number(prompt(`Score for ${match.home}`));
  const a = Number(prompt(`Score for ${match.away}`));

  if (isNaN(h) || isNaN(a)) return;

  if (h === a) return alert("No draws in knockout");

  match.homeScore = h;
  match.awayScore = a;
  match.winner = h > a ? match.home : match.away;

  advanceWinner(r,m);
  renderBracket();
}

function advanceWinner(r,m) {
  if (r === knockoutRounds.length-1) {
    declareChampion();
    return;
  }

  const winner = knockoutRounds[r][m].winner;
  const nextMatch = knockoutRounds[r+1][Math.floor(m/2)];

  if (m % 2 === 0) nextMatch.home = winner;
  else nextMatch.away = winner;
}

function declareChampion() {
  const final = knockoutRounds[knockoutRounds.length-1][0];
  knockoutChampion = final.winner;
  knockoutRunnerUp =
    final.home === knockoutChampion ? final.away : final.home;

  showKnockoutMedals();
}

function renderBracket() {
  const container = document.getElementById("bracketContainer");
  container.innerHTML = "";

  knockoutRounds.forEach((round,ri)=>{
    const roundDiv = document.createElement("div");
    roundDiv.className="round";
    roundDiv.innerHTML += `<h4>Round ${ri+1}</h4>`;

    round.forEach((match,mi)=>{
      const div = document.createElement("div");
      div.className="match";
      div.innerHTML = `
        <div>${match.home||"-"}</div>
        <div>${match.homeScore??""}${match.homeScore!==null?" - ":""}${match.awayScore??""}</div>
        <div>${match.away||"-"}</div>
        ${isAdminLoggedIn?`<button onclick="enterKnockoutScore(${ri},${mi})">Enter Score</button>`:""}
      `;
      roundDiv.appendChild(div);
    });

    container.appendChild(roundDiv);
  });
}

/* ===============================
   MEDAL PODIUM
================================= */

function showKnockoutMedals() {
  const container = document.getElementById("medalContainer");

  container.innerHTML = `
    <div class="podium-place second">
      <h2>🥈</h2>
      <p>${knockoutRunnerUp}</p>
    </div>
    <div class="podium-place first">
      <h2>🥇</h2>
      <p>${knockoutChampion}</p>
    </div>
  `;

  showSection("medals");
}