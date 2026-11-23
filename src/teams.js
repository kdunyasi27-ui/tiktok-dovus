
export const TEAMS = {
  fb: {
    id: "fb",
    name: "FENERBAHÇE",
    shirt: "FB",
    slogan: "Yaşa Fenerbahçe!",
    colors: ["#164EAA", "#FFE45C"],
    speech: [
      "Yaşa Fenerbahçe!",
      "Sarı lacivert!"
    ]
  },

  gs: {
    id: "gs",
    name: "GALATASARAY",
    shirt: "GS",
    slogan: "Cim Bom Bom!",
    colors: ["#B51D32", "#F4D34E"],
    speech: [
      "Cim Bom Bom!",
      "Şampiyon Galatasaray!"
    ]
  },

  bjk: {
    id: "bjk",
    name: "BEŞİKTAŞ",
    shirt: "BJK",
    slogan: "Kara Kartal!",
    colors: ["#151515", "#EEEEEE"],
    speech: [
      "Kara Kartal!",
      "Şanlı Beşiktaş!"
    ]
  }
};

export const TEAM_ORDER = ["fb", "gs", "bjk"];

export function getTeam(teamId) {
  return TEAMS[teamId] || TEAMS.fb;
}

export function getNextTeam(currentTeam) {
  const index = TEAM_ORDER.indexOf(currentTeam);

  return TEAM_ORDER[
    (index + 1) % TEAM_ORDER.length
  ];
}

export function changeTeam(currentTeam) {
  const nextTeam = getNextTeam(currentTeam);
  const team = getTeam(nextTeam);

  const fighter = document.getElementById("fighter");
  const teamName = document.getElementById("teamName");
  const shirtName = document.getElementById("shirtName");
  const speechBubble = document.getElementById("speechBubble");
  const announcement = document.getElementById("giftAnnouncement");

  if (!fighter) return nextTeam;

  fighter.classList.remove("fb", "gs", "bjk");
  fighter.classList.add(team.id);

  teamName.textContent = team.name;
  shirtName.textContent = team.shirt;
  speechBubble.textContent = team.slogan;
  announcement.textContent = team.slogan;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(
      team.slogan
    );

    voice.lang = "tr-TR";
    voice.rate = 1;
    voice.pitch = 1;

    window.speechSynthesis.speak(voice);
  }

  return nextTeam;
}
