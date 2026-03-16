import Vue from "vue";
import Vuex from "vuex";
import persistence from "./persistence";
import socket from "./socket";
import cohosts from "./modules/cohosts";
import players from "./modules/players";
import session from "./modules/session";
import editionJSON from "../editions.json";
import rolesJSON from "../roles.json";
import fabledJSON from "../fabled.json";
import jinxesJSON from "../jinxes.json";
import { setupRole } from "../utils";

Vue.use(Vuex);

const allRoles = rolesJSON.map(setupRole);
const allFabled = fabledJSON.map(setupRole);

// helper functions
const getRolesByEdition = (edition = editionJSON[0]) => {
  return new Map(
    allRoles
      .filter((r) => r.edition === edition.id || edition.roles.includes(r.id))
      .sort((a, b) => b.team.localeCompare(a.team))
      .map((role) => [role.id, role]),
  );
};

const getTravellersNotInEdition = (edition = editionJSON[0]) => {
  return new Map(
    allRoles
      .filter(
        (r) =>
          r.team === "traveller" &&
          r.edition !== edition.id &&
          !edition.roles.includes(r.id),
      )
      .map((role) => [role.id, role]),
  );
};

const set =
  (key) =>
  ({ grimoire }, val) => {
    grimoire[key] = val;
  };

const toggle =
  (key) =>
  ({ grimoire }, val) => {
    if (val === true || val === false) {
      grimoire[key] = val;
    } else {
      grimoire[key] = !grimoire[key];
    }
  };

const clean = (id) => id.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

// global data maps
const editionJSONbyId = new Map(
  editionJSON.map((edition) => [edition.id, edition]),
);
const rolesJSONbyId = new Map(allRoles.map((role) => [role.id, role]));
const fabled = new Map(fabledJSON.map((role) => [role.id, role]));

const allJinxes = new Map();
for (const [first, jinxes] of Object.entries(jinxesJSON)) {
  if (!rolesJSONbyId.has(first))
    throw new Error(`Jinx references nonexistent role '${first}'`);
  const jinxMap = new Map();
  for (const [second, jinx] of Object.entries(jinxes)) {
    if (!rolesJSONbyId.has(second))
      throw new Error(`Jinx references nonexistent role '${second}'`);
    jinxMap.set(second, jinx);
  }
  allJinxes.set(first, jinxMap);
}

// base definition for custom roles
const customRole = {
  id: "",
  name: "",
  images: [],
  customImages: undefined,
  alignment: 0,
  ability: "",
  edition: "custom",
  firstNight: 0,
  firstNightReminder: "",
  otherNight: 0,
  otherNightReminder: "",
  reminders: [],
  remindersGlobal: [],
  setup: false,
  team: "townsfolk",
  isCustom: true,
};

export default new Vuex.Store({
  modules: {
    cohosts,
    players,
    session,
  },
  state: {
    grimoire: {
      isNight: false,
      isNightOrder: true,
      isPublic: false,
      isMenuOpen: false,
      isStatic: false,
      isMuted: false,
      isImageOptIn: false,
      mismatchWarnings: true,
      smolBluffs: false,
      teamColors: false,
      zoom: 0,
      background: "",
      playerName: "",
      playerPronouns: "",
    },
    modals: {
      edition: false,
      fabled: false,
      gameState: false,
      nightOrder: false,
      reference: false,
      reminder: false,
      role: false,
      roles: false,
      voteHistory: false,
    },
    edition: editionJSONbyId.get("tb"),
    roles: getRolesByEdition(),
    otherTravellers: getTravellersNotInEdition(),
    fabled,
    jinxes: allJinxes,
  },
  getters: {
    /**
     * Return all custom roles, with default values and non-essential data stripped.
     * Role object keys will be replaced with a numerical index to conserve bandwidth.
     * @param roles
     * @returns {[]}
     */
    customRolesStripped: ({ roles }) => {
      const customRoles = [];
      const customKeys = Object.keys(customRole);
      const strippedProps = [
        "firstNightReminder",
        "otherNightReminder",
        "isCustom",
      ];
      roles.forEach((role) => {
        if (!role.isCustom) {
          customRoles.push({ id: role.id });
        } else {
          const strippedRole = {};
          for (let prop in role) {
            if (strippedProps.includes(prop)) {
              continue;
            }
            const value = role[prop];
            if (customKeys.includes(prop) && value !== customRole[prop]) {
              strippedRole[customKeys.indexOf(prop)] = value;
            }
          }
          customRoles.push(strippedRole);
        }
      });
      return customRoles;
    },
    rolesJSONbyId: () => rolesJSONbyId,
  },
  actions: {
    newGame({ state, dispatch, commit }) {
      if (state.session.isSpectator) return;
      dispatch("players/clearRoles");
      commit("session/clearVoteHistory");
      commit("toggleModal", "roles");
    },
  },
  mutations: {
    setZoom: set("zoom"),
    setBackground: set("background"),
    setPlayerName: set("playerName"),
    setPlayerPronouns: set("playerPronouns"),
    toggleMuted: toggle("isMuted"),
    toggleMenu: toggle("isMenuOpen"),
    toggleMismatchWarnings: toggle("mismatchWarnings"),
    toggleNightOrder: toggle("isNightOrder"),
    toggleSmolBluffs: toggle("smolBluffs"),
    toggleTeamColors: toggle("teamColors"),
    toggleStatic: toggle("isStatic"),
    toggleNight: toggle("isNight"),
    toggleGrimoire: toggle("isPublic"),
    toggleImageOptIn: toggle("isImageOptIn"),
    toggleModal({ modals }, name) {
      if (name) {
        modals[name] = !modals[name];
      }
      for (let modal in modals) {
        if (modal === name) continue;
        modals[modal] = false;
      }
    },
    /**
     * Store custom roles
     * @param state
     * @param roles Array of role IDs or full role definitions
     */
    setCustomRoles(state, roles) {
      const processedRoles = roles
        // replace numerical role object keys with matching key names
        .map((role) => {
          if (role[0]) {
            const customKeys = Object.keys(customRole);
            const mappedRole = {};
            for (let prop in role) {
              if (customKeys[prop]) {
                mappedRole[customKeys[prop]] = role[prop];
              }
            }
            return mappedRole;
          } else {
            return role;
          }
        })
        // clean up role.id
        .map((role) => {
          role.id = clean(role.id);
          return role;
        })
        .map(setupRole)
        // map existing roles to base definition or pre-populate custom roles to ensure all properties
        .map(
          (role) =>
            rolesJSONbyId.get(role.id) ||
            state.roles.get(role.id) ||
            Object.assign({}, customRole, role),
        )
        // default empty icons and placeholders, clean up firstNight / otherNight
        .map((role) => {
          if (rolesJSONbyId.get(role.id)) return role;
          role.firstNight = Math.abs(role.firstNight);
          role.otherNight = Math.abs(role.otherNight);
          return role;
        })
        // filter out roles that don't match an existing role and also don't have name/ability/team
        .filter((role) => role.name && role.ability && role.team)
        // sort by team
        .sort((a, b) => b.team.localeCompare(a.team));
      // convert to Map without Fabled
      state.roles = new Map(
        processedRoles
          .filter((role) => role.team !== "fabled")
          .map((role) => [role.id, role]),
      );
      // update Fabled to include custom Fabled from this script
      state.fabled = new Map([
        ...processedRoles
          .filter((r) => r.team === "fabled")
          .map((r) => [r.id, r]),
        ...allFabled.map((role) => [role.id, role]),
      ]);
      // update extraTravellers map to only show travellers not in this script
      state.otherTravellers = new Map(
        allRoles
          .filter(
            (r) => r.team === "traveller" && !roles.some((i) => i.id === r.id),
          )
          .map((role) => [role.id, role]),
      );
    },
    setEdition(state, edition) {
      if (editionJSONbyId.has(edition.id)) {
        state.edition = editionJSONbyId.get(edition.id);
        state.roles = getRolesByEdition(state.edition);
        state.otherTravellers = getTravellersNotInEdition(state.edition);
      } else {
        state.edition = edition;
      }
      state.modals.edition = false;
    },
  },
  plugins: [persistence, socket],
});
