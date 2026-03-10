/* =====================================================
   NICOK ARENA – PROFESSIONAL TOURNAMENT ENGINE
   Fully Integrated Build with live scoring & 3rd place
===================================================== */

const ADMIN_PASSWORD = "admin123";

let isAdminLoggedIn = false;
let editIndex = null;
let mode = "groupStage";

/* ===============================
   DATA STRUCTURES
================================= */

function updateModeDisplay(){
  const displayNames = {
    groupStage: "Group Stage",
    roundRobin: "Round Robin",
    knockout: "Knockout"
  };
  document.getElementById("modeText").innerText = displayNames[mode] || "Group Stage";
}

let tournamentData = {
  groupStage: {}, // unlimited groups
  roundRobin: [],
  knockout: []
};

let fixturesData = [];
let knockoutRounds = [];
let knockoutChampion = null;
let knockoutRunnerUp = null;
let thirdPlaceWinner = null;

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
  updateModeDisplay();
  renderParticipants();
}

/* ===============================
   PARTICIPANT MANAGEMENT
================================= */

function addParticipant() {
  const name = pName.value.trim();
  if (!name) return alert("Enter participant name");

  const fileInput = document.getElementById("pImage");
  const file = fileInput.files[0];

  let image = "";

  if (file) {
    image = URL.createObjectURL(file);
  }

  const data = {
    name,
    image: image,
    info: pInfo.value.trim(),
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
  } else if (mode === "roundRobin") {
    if (editIndex !== null) {
      tournamentData.roundRobin[editIndex] = data;
      editIndex = null;
    } else {
      tournamentData.roundRobin.push(data);
    }
  } else if (mode === "knockout") {
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
  let list = modeName === "groupStage" ? tournamentData.groupStage[group] : tournamentData[modeName];
  list.splice(list.findIndex(p => p.name === name), 1);
  renderParticipants();
}

function clearInputs() {
  pName.value = "";
  pImage.value = "";
  pInfo.value = "";
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
      container.innerHTML += `<h4>Group ${group}</h4><table>${generateTable(list)}</table>`;
    });
  } else if (mode === "roundRobin") {
    container.innerHTML += `<table>${generateTable(tournamentData.roundRobin)}</table>`;
  }

  // ✅ Attach click events after rendering
  document.querySelectorAll("#tablesContainer td.clickable").forEach(td => {
    td.onclick = () => {
      const table = td.closest("table");
      const groupHeader = table.previousElementSibling?.innerText;
      let list;

      if (mode === "groupStage" && groupHeader) {
        const groupName = groupHeader.replace("Group ", "");
        list = tournamentData.groupStage[groupName];
      } else {
        list = tournamentData.roundRobin;
      }

      const index = Number(td.dataset.index);
      const participant = list[index];
      showParticipantPopup(participant);
    };
  });
}

function generateTable(list) {
  list.forEach(p => {
    p.played = p.wins + p.draws + p.losses;
    p.points = p.wins * 3 + p.draws;
  });

  list.sort((a,b) => b.points - a.points || b.diff - a.diff);

  return `<thead>
      <tr><th>#</th><th>Name</th><th>Pts</th><th>P</th><th>W</th><th>D</th><th>L</th><th>+/-</th></tr>
    </thead>
    <tbody>
      ${list.map((p,i) => `<tr>
        <td>${i+1}</td>
        <td class="clickable" data-index="${i}">
          ${p.image ? `<img src="${p.image}" class="player-img">` : ""}
          ${p.name}
        </td>
        <td>${p.points}</td>
        <td>${p.played}</td>
        <td>${p.wins}</td>
        <td>${p.draws}</td>
        <td>${p.losses}</td>
        <td>${p.diff}</td>
      </tr>`).join("")}
    </tbody>`;
}

/* ===============================
   FIXTURES – live editable
================================= */

function generateFixtures() {
  const container = document.getElementById("fixturesContainer");
  container.innerHTML = "";
  fixturesData = [];

  let groups = [];
  if (mode === "roundRobin") groups.push({name:'', list:tournamentData.roundRobin});
  else if (mode === "groupStage") groups = Object.keys(tournamentData.groupStage).map(g=>({name:g,list:tournamentData.groupStage[g]}));

  groups.forEach(g=>{
    const list = g.list;
    if(list.length<2) return;
    if(g.name) container.innerHTML += `<h4>Group ${g.name}</h4>`;
    for(let i=0;i<list.length;i++){
      for(let j=i+1;j<list.length;j++){
        const matchId = `${g.name}-${i}-${j}`;
        fixturesData.push({id:matchId, home:list[i].name, away:list[j].name, homeScore:null, awayScore:null});
        container.innerHTML += `
          <div class="fixture-card" id="fixture-${matchId}">
            <span>${list[i].name}</span>
            <input type="number" placeholder="Score" id="home-${matchId}">
            <span>vs</span>
            <input type="number" placeholder="Score" id="away-${matchId}">
            <span>${list[j].name}</span>
            ${isAdminLoggedIn?`<button onclick="saveFixture('${matchId}')">Save</button>`:""}
          </div>
        `;
      }
    }
  });
}

function saveFixture(matchId){
  const match = fixturesData.find(m=>m.id===matchId);
  const h = Number(document.getElementById(`home-${matchId}`).value);
  const a = Number(document.getElementById(`away-${matchId}`).value);
  if(isNaN(h)||isNaN(a)) return alert("Enter valid scores");

  match.homeScore = h;
  match.awayScore = a;

  updateStandings();
  renderParticipants();

  alert(`Saved: ${match.home} ${h} - ${a} ${match.away}`);
}

function updateStandings(){
  // Reset stats
  if(mode === "groupStage"){
    Object.values(tournamentData.groupStage).forEach(group=>{
      group.forEach(p=>{p.wins=0; p.draws=0; p.losses=0; p.diff=0;});
    });
  }
  if(mode === "roundRobin"){
    tournamentData.roundRobin.forEach(p=>{p.wins=0; p.draws=0; p.losses=0; p.diff=0;});
  }

  fixturesData.forEach(match=>{
    if(match.homeScore===null || match.awayScore===null) return;
    let homePlayer, awayPlayer;
    if(mode==="groupStage"){
      Object.values(tournamentData.groupStage).forEach(group=>{
        group.forEach(p=>{
          if(p.name===match.home) homePlayer=p;
          if(p.name===match.away) awayPlayer=p;
        });
      });
    } else {
      homePlayer = tournamentData.roundRobin.find(p=>p.name===match.home);
      awayPlayer = tournamentData.roundRobin.find(p=>p.name===match.away);
    }
    if(!homePlayer || !awayPlayer) return;

    homePlayer.diff += (match.homeScore - match.awayScore);
    awayPlayer.diff += (match.awayScore - match.homeScore);

    if(match.homeScore > match.awayScore){
      homePlayer.wins++;
      awayPlayer.losses++;
    } else if(match.homeScore < match.awayScore){
      awayPlayer.wins++;
      homePlayer.losses++;
    } else {
      homePlayer.draws++;
      awayPlayer.draws++;
    }
  });
}

/* ===============================
   PARTICIPANT POPUP DISPLAY
================================= */

function showParticipantPopup(participant) {
  const popup = document.getElementById("participantPopup");
  document.getElementById("popupImage").src = participant.image || "https://via.placeholder.com/100";
  document.getElementById("popupName").innerText = participant.name;
  document.getElementById("popupInfo").innerText = participant.info || "No additional info.";

 document.getElementById("popupStats").innerHTML = "";

  popup.classList.remove("hidden");
}

document.getElementById("closePopup").onclick = () => {
  document.getElementById("participantPopup").classList.add("hidden");
};

participantPopup.onclick = (e)=>{
  if(e.target.id === "participantPopup"){
    participantPopup.classList.add("hidden");
  }
};

/* ===============================
   KNOCKOUT ENGINE + 3rd place
================================= */

function generateBracket() {
  if(mode!=='knockout') return;
  const participants=[...tournamentData.knockout];
  if(participants.length<2) return alert("Not enough participants");

  knockoutRounds=[]; knockoutChampion=null; knockoutRunnerUp=null; thirdPlaceWinner=null;

  let firstRound=[];
  for(let i=0;i<participants.length;i+=2){
    firstRound.push({home:participants[i]?.name||"BYE",away:participants[i+1]?.name||"BYE",homeScore:null,awayScore:null,winner:null,loser:null});
  }
  knockoutRounds.push(firstRound);

  let size=firstRound.length;
  while(size>1){
    const next=[];
    for(let i=0;i<Math.ceil(size/2);i++){
      next.push({home:null,away:null,homeScore:null,awayScore:null,winner:null,loser:null});
    }
    knockoutRounds.push(next);
    size=next.length;
  }

  renderBracket();
}

function saveKnockoutScore(roundIndex, matchIndex){
  const match=knockoutRounds[roundIndex][matchIndex];
  const homeScore=Number(document.getElementById(`k-home-${roundIndex}-${matchIndex}`).value);
  const awayScore=Number(document.getElementById(`k-away-${roundIndex}-${matchIndex}`).value);
  if(isNaN(homeScore)||isNaN(awayScore)) return alert("Enter valid scores");
  if(homeScore===awayScore) return alert("No draws in knockout");

  match.homeScore=homeScore; match.awayScore=awayScore;
  match.winner=homeScore>awayScore?match.home:match.away;
  match.loser=homeScore>awayScore?match.away:match.home;

  advanceWinner(roundIndex,matchIndex);
  renderBracket();
}

function advanceWinner(r,m){
  const winner=knockoutRounds[r][m].winner;
  const loser=knockoutRounds[r][m].loser;
 if(r===knockoutRounds.length-1){
  knockoutChampion = winner;
  knockoutRunnerUp = loser;

  if(!document.getElementById("thirdPlaceToggle").checked){
    showKnockoutMedals();
  }
  return;
}
  const nextMatch=knockoutRounds[r+1][Math.floor(m/2)];
  if(m%2===0) nextMatch.home=winner; else nextMatch.away=winner;

  // Place semifinal losers into 3rd place
  if(r===knockoutRounds.length-2 && document.getElementById("thirdPlaceToggle").checked){
    if(!thirdPlaceMatch) thirdPlaceMatch={home:null,away:null,homeScore:null,awayScore:null,winner:null};
    if(m%2===0) thirdPlaceMatch.home=loser; else thirdPlaceMatch.away=loser;
  }
}

let thirdPlaceMatch=null;

function saveThirdPlace(){
  const h=Number(document.getElementById(`thirdHome`).value);
  const a=Number(document.getElementById(`thirdAway`).value);
  if(isNaN(h)||isNaN(a)) return alert("Enter valid scores");
  if(h===a) return alert("No draws in 3rd place");
  thirdPlaceMatch.homeScore=h; thirdPlaceMatch.awayScore=a;
  thirdPlaceMatch.winner=h>a?thirdPlaceMatch.home:thirdPlaceMatch.away;
  thirdPlaceWinner=thirdPlaceMatch.winner;
  showKnockoutMedals();
  renderBracket();
}

function renderBracket(){
  const container=document.getElementById("bracketContainer");
  container.innerHTML="";
  knockoutRounds.forEach((round,ri)=>{
    const roundDiv=document.createElement("div");
    roundDiv.className="round";
    let roundName = "";

if(knockoutRounds.length === 3){
  if(ri===0) roundName="QF";
  if(ri===1) roundName="SF";
  if(ri===2) roundName="FINAL";
}
else if(knockoutRounds.length === 2){
  if(ri===0) roundName="SF";
  if(ri===1) roundName="FINAL";
}
else{
  roundName = ri===knockoutRounds.length-1 ? "FINAL" : `Round ${ri+1}`;
}

roundDiv.innerHTML=`<h4 class="${roundName==='FINAL'?'final-title':''}">${roundName}</h4>`;
    round.forEach((match,mi)=>{
      const div=document.createElement("div");
      div.className="match";
      if(match.winner){
  div.classList.add("winner");
}
if(match.homeScore!==null && match.awayScore!==null){
  div.classList.add("played");
}
      div.innerHTML=`
        <span>${match.home||"-"}</span>
        <input type="number" id="k-home-${ri}-${mi}" value="${match.homeScore??''}">
        <span>vs</span>
        <input type="number" id="k-away-${ri}-${mi}" value="${match.awayScore??''}">
        <span>${match.away||"-"}</span>
        ${isAdminLoggedIn?`<button onclick="saveKnockoutScore(${ri},${mi})">Save</button>`:""}
      `;
      roundDiv.appendChild(div);
    });
    container.appendChild(roundDiv);
  });

if(thirdPlaceMatch && (thirdPlaceMatch.home || thirdPlaceMatch.away)){

  const wrapper=document.createElement("div");
  wrapper.style.marginTop="40px";

  const label=document.createElement("div");
  label.className="third-place-label";
  label.innerText="Third Place";
  wrapper.appendChild(label);

  const div=document.createElement("div");
  div.className="match";

  if(thirdPlaceMatch.winner) div.classList.add("winner");

  div.innerHTML=`
    <span>${thirdPlaceMatch.home||"-"}</span>
    <input type="number" id="thirdHome" value="${thirdPlaceMatch.homeScore??''}">
    <span>vs</span>
    <input type="number" id="thirdAway" value="${thirdPlaceMatch.awayScore??''}">
    <span>${thirdPlaceMatch.away||"-"}</span>
    ${isAdminLoggedIn?`<button onclick="saveThirdPlace()">Save</button>`:""}
  `;

  wrapper.appendChild(div);
  container.appendChild(wrapper);}
}
if(knockoutChampion && thirdPlaceWinner){
  showKnockoutMedals();
}

/* ===============================
   MEDAL PODIUM
================================= */

function showKnockoutMedals(){
  const container=document.getElementById("medalContainer");
  container.innerHTML=`
    ${thirdPlaceWinner?`<div class="podium-place third"><h2>🥉</h2><p>${thirdPlaceWinner}</p></div>`:""}
    <div class="podium-place second"><h2>🥈</h2><p>${knockoutRunnerUp??"TBD"}</p></div>
    <div class="podium-place first"><h2>🥇</h2><p>${knockoutChampion??"TBD"}</p></div>
  `;
  showSection("medals");
}

updateModeDisplay();