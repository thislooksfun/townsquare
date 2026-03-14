const knownTeams = ["townsfolk", "outsider", "minion", "demon", "fabled"];

function imageForRole(roleOrReminder, grimoire) {
  if (roleOrReminder.image && grimoire.isImageOptIn) {
    return roleOrReminder.image;
  }

  const roleId = roleOrReminder.role || roleOrReminder.id;

  try {
    return require(`./assets/icons/${roleId}.png`);
  } catch (e) {
    console.warn(`Couldn't find image for ${roleId}, using fallback`, e);
    if (knownTeams.includes(roleOrReminder.team)) {
      return require(`./assets/icons/${roleOrReminder.team}.png`);
    } else {
      return require("./assets/icons/custom.png");
    }
  }
}

export { imageForRole };
