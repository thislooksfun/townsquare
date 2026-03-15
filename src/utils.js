const knownTeams = [
  "townsfolk",
  "outsider",
  "minion",
  "demon",
  "traveller",
  "fabled",
  "loric",
];

function imageForRole(roleOrReminder, grimoire) {
  if (roleOrReminder.image && grimoire.isImageOptIn) {
    if (Array.isArray(roleOrReminder.image)) {
      return roleOrReminder.image[0];
    } else {
      return roleOrReminder.image;
    }
  }

  const roleId = roleOrReminder.role || roleOrReminder.id;

  try {
    return require(`./assets/icons/PNG/${roleId}.png`);
  } catch (e) {
    console.warn(`Couldn't find image for ${roleId}, using fallback`, e);
    if (knownTeams.includes(roleOrReminder.team)) {
      return require(`./assets/icons/PNG/${roleOrReminder.team}.png`);
    } else {
      return require("./assets/custom.png");
    }
  }
}

export { imageForRole };
