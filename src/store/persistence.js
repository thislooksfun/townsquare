module.exports = (store) => {
  const updatePagetitle = (isPublic) =>
    (document.title = `Blood on the Clocktower ${
      isPublic ? "Town Square" : "Grimoire"
    }`);

  // initialize data
  if (localStorage.getItem("background")) {
    store.commit("setBackground", localStorage.background);
  }
  if (localStorage.getItem("muted")) {
    store.commit("toggleMuted", true);
  }
  if (localStorage.getItem("mismatchWarnings")) {
    store.commit("toggleMismatchWarnings", true);
  }
  if (localStorage.getItem("smolBluffs")) {
    store.commit("toggleSmolBluffs", true);
  }
  if (localStorage.getItem("static")) {
    store.commit("toggleStatic", true);
  }
  if (localStorage.getItem("teamColors")) {
    store.commit("toggleTeamColors", true);
  }
  if (localStorage.getItem("imageOptIn")) {
    store.commit("toggleImageOptIn", true);
  }
  if (localStorage.getItem("zoom")) {
    store.commit("setZoom", parseFloat(localStorage.getItem("zoom")));
  }
  if (localStorage.getItem("isGrimoire")) {
    store.commit("toggleGrimoire", false);
    updatePagetitle(false);
  }
  if (localStorage.roles !== undefined) {
    store.commit("setCustomRoles", JSON.parse(localStorage.roles));
    store.commit("setEdition", { id: "custom" });
  }
  if (localStorage.edition !== undefined) {
    // this will initialize state.roles for official editions
    store.commit("setEdition", JSON.parse(localStorage.edition));
  }
  if (localStorage.bluffs !== undefined) {
    JSON.parse(localStorage.bluffs).forEach((role, index) => {
      store.commit("players/setBluff", {
        index,
        role: store.state.roles.get(role) || {},
      });
    });
  }
  if (localStorage.fabled !== undefined) {
    store.commit("players/setFabled", {
      fabled: JSON.parse(localStorage.fabled).map(
        (fabled) => store.state.fabled.get(fabled.id) || fabled,
      ),
    });
  }
  if (localStorage.players) {
    store.commit(
      "players/set",
      JSON.parse(localStorage.players).map((player) => ({
        ...player,
        role:
          store.state.roles.get(player.role) ||
          store.getters.rolesJSONbyId.get(player.role) ||
          {},
      })),
    );
  }
  if (localStorage.cohosts) {
    store.commit("cohosts/set", JSON.parse(localStorage.cohosts));
  }
  /**** Session related data *****/
  if (localStorage.getItem("playerId")) {
    store.commit("session/setPlayerId", localStorage.getItem("playerId"));
  }
  if (localStorage.getItem("session") && !window.location.hash.substr(1)) {
    const [spectator, sessionId, cohost] = JSON.parse(
      localStorage.getItem("session"),
    );
    store.commit("session/setSpectator", spectator);
    store.commit("session/setSessionId", sessionId);
    store.commit("session/setCohost", !!cohost);
  }

  // listen to mutations
  store.subscribe(({ type, payload }, state) => {
    switch (type) {
      case "toggleGrimoire":
        if (!state.grimoire.isPublic) {
          localStorage.setItem("isGrimoire", 1);
        } else {
          localStorage.removeItem("isGrimoire");
        }
        updatePagetitle(state.grimoire.isPublic);
        break;
      case "setBackground":
        if (payload) {
          localStorage.setItem("background", payload);
        } else {
          localStorage.removeItem("background");
        }
        break;
      case "toggleMuted":
        if (state.grimoire.isMuted) {
          localStorage.setItem("muted", 1);
        } else {
          localStorage.removeItem("muted");
        }
        break;
      case "toggleMismatchWarnings":
        if (state.grimoire.mismatchWarnings) {
          localStorage.setItem("mismatchWarnings", 1);
        } else {
          localStorage.removeItem("mismatchWarnings");
        }
        break;
      case "toggleSmolBluffs":
        if (state.grimoire.smolBluffs) {
          localStorage.setItem("smolBluffs", 1);
        } else {
          localStorage.removeItem("smolBluffs");
        }
        break;
      case "toggleStatic":
        if (state.grimoire.isStatic) {
          localStorage.setItem("static", 1);
        } else {
          localStorage.removeItem("static");
        }
        break;
      case "toggleTeamColors":
        if (state.grimoire.teamColors) {
          localStorage.setItem("teamColors", 1);
        } else {
          localStorage.removeItem("teamColors");
        }
        break;
      case "toggleImageOptIn":
        if (state.grimoire.isImageOptIn) {
          localStorage.setItem("imageOptIn", 1);
        } else {
          localStorage.removeItem("imageOptIn");
        }
        break;
      case "setZoom":
        if (payload !== 0) {
          localStorage.setItem("zoom", payload);
        } else {
          localStorage.removeItem("zoom");
        }
        break;
      case "setEdition":
        localStorage.setItem("edition", JSON.stringify(payload));
        if (state.edition.isOfficial) {
          localStorage.removeItem("roles");
        }
        break;
      case "setCustomRoles":
        if (!payload.length) {
          localStorage.removeItem("roles");
        } else {
          localStorage.setItem("roles", JSON.stringify(payload));
        }
        break;
      case "players/setBluff":
        localStorage.setItem(
          "bluffs",
          JSON.stringify(state.players.bluffs.map(({ id }) => id)),
        );
        break;
      case "players/setFabled":
        localStorage.setItem(
          "fabled",
          JSON.stringify(
            state.players.fabled.map((fabled) =>
              fabled.isCustom ? fabled : { id: fabled.id },
            ),
          ),
        );
        break;
      case "players/add":
      case "players/update":
      case "players/remove":
      case "players/clear":
      case "players/set":
      case "players/swap":
      case "players/move":
        if (state.players.players.length) {
          localStorage.setItem(
            "players",
            JSON.stringify(
              state.players.players.map((player) => ({
                ...player,
                // simplify the stored data
                role: player.role.id || {},
              })),
            ),
          );
        } else {
          localStorage.removeItem("players");
        }
        break;
      case "cohosts/add":
      case "cohosts/remove":
        console.log("Cohosts updated!", state.cohosts.cohosts);
        if (state.cohosts.cohosts.length) {
          localStorage.setItem(
            "cohosts",
            JSON.stringify(state.cohosts.cohosts),
          );
        } else {
          localStorage.removeItem("cohosts");
        }
        break;
      case "session/setSessionId":
        if (payload) {
          localStorage.setItem(
            "session",
            JSON.stringify([
              state.session.isSpectator,
              payload,
              state.session.isCohost,
            ]),
          );
        } else {
          localStorage.removeItem("session");
        }
        break;
      case "session/setPlayerId":
        if (payload) {
          localStorage.setItem("playerId", payload);
        } else {
          localStorage.removeItem("playerId");
        }
        break;
    }
  });
};
