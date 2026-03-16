<template>
  <Modal
    v-if="modals.reminder && availableReminders.length && players[playerIndex]"
    @close="toggleModal('reminder')"
  >
    <h3>Choose a reminder token</h3>
    <ul class="reminders" v-if="tab === 'inPlayReminders'">
      <li
        v-for="reminder in availableReminders"
        class="reminder"
        :class="[reminder.role.id]"
        :key="reminder.role.id + ' ' + reminder.name"
        @click="addReminder(reminder)"
      >
        <span
          class="icon"
          :style="{ backgroundImage: `url(${imageForRole(reminder.role)})` }"
        ></span>
        <span class="text">{{ reminder.name }}</span>
      </li>
    </ul>
    <ul class="reminders" v-if="tab === 'allReminders'">
      <li
        v-for="reminder in allReminders"
        class="reminder"
        :class="[reminder.role.id]"
        :key="reminder.role.id + ' ' + reminder.name"
        @click="addReminder(reminder)"
      >
        <span
          class="icon"
          :style="{ backgroundImage: `url(${imageForRole(reminder.role)})` }"
        ></span>
        <span class="text">{{ reminder.name }}</span>
      </li>
    </ul>
    <div class="button-group" v-if="playerIndex >= 0">
      <span
        class="button"
        :class="{ townsfolk: tab === 'inPlayReminders' }"
        @click="tab = 'inPlayReminders'"
        >In-Play Reminders</span
      >
      <span
        class="button"
        :class="{ townsfolk: tab === 'allReminders' }"
        @click="tab = 'allReminders'"
        >All Reminders</span
      >
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";
import { imageForRole, setupRole } from "../../utils";

const customRole = setupRole("custom");

const mapReminder = (role) => (name) => ({ role, name });
const dedupeReminders = (reminders) => {
  const seen = new Set();
  return reminders.filter((r) => {
    const key = `${r.role.id}-${r.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default {
  components: { Modal },
  props: ["playerIndex"],
  computed: {
    allReminders() {
      let reminders = [];
      this.$store.state.roles.forEach((role) => {
        reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        if (role.remindersGlobal && role.remindersGlobal.length) {
          reminders = [
            ...reminders,
            ...role.remindersGlobal.map(mapReminder(role)),
          ];
        }
      });

      // add fabled reminders
      this.$store.state.players.fabled.forEach((role) => {
        reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
      });

      // add out of script traveller reminders
      this.$store.state.otherTravellers.forEach((role) => {
        reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
      });

      const sortOrder = [
        "townsfolk",
        "outsider",
        "minion",
        "demon",
        "traveller",
        "fabled",
      ];

      reminders = dedupeReminders(reminders);
      return reminders.toSorted(
        (a, b) =>
          sortOrder.indexOf(a.role.team) - sortOrder.indexOf(b.role.team),
      );
    },
    availableReminders() {
      let reminders = [];
      const { players, bluffs } = this.$store.state.players;
      this.$store.state.roles.forEach((role) => {
        // add reminders from player roles
        if (players.some((p) => p.role.id === role.id)) {
          reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        }
        // add reminders from bluff/other roles
        else if (bluffs.some((bluff) => bluff.id === role.id)) {
          reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        }
        // add global reminders
        if (role.remindersGlobal && role.remindersGlobal.length) {
          reminders = [
            ...reminders,
            ...role.remindersGlobal.map(mapReminder(role)),
          ];
        }
      });
      // add fabled reminders
      this.$store.state.players.fabled.forEach((role) => {
        reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
      });

      // add out of script traveller reminders
      this.$store.state.otherTravellers.forEach((role) => {
        if (players.some((p) => p.role.id === role.id)) {
          reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        }
      });

      reminders.push({ role: customRole, name: "Custom note" });

      reminders = dedupeReminders(reminders);
      return reminders;
    },
    ...mapState(["modals", "grimoire"]),
    ...mapState("players", ["players"]),
  },
  data() {
    return {
      tab: "inPlayReminders",
    };
  },
  methods: {
    addReminder(reminder) {
      const player = this.$store.state.players.players[this.playerIndex];
      let value;
      if (reminder.role === customRole) {
        const name = prompt("Add a custom reminder note");
        if (!name) return;
        value = [...player.reminders, { role: customRole, name }];
      } else {
        value = [...player.reminders, reminder];
      }
      this.$store.commit("players/update", {
        player,
        property: "reminders",
        value,
      });
      this.tab = "inPlayReminders";
      this.$store.commit("toggleModal", "reminder");
    },
    ...mapMutations(["toggleModal"]),
    imageForRole(role) {
      return imageForRole(role, this.grimoire);
    },
  },
};
</script>

<style scoped lang="scss">
ul.reminders {
  gap: 24px;
  margin: 24px 0;
  padding: 8px;
  // FIXME: Make this relative to the containing element!
  max-height: 64vh;
  width: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  align-content: flex-start;
}

ul.reminders .reminder {
  background: url("../../assets/reminder.png") center center;
  background-size: 100%;
  width: 14vh;
  height: 14vh;
  max-width: 100px;
  max-height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 50%;
  border: 3px solid black;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  line-height: 100%;
  transition: transform 500ms ease;

  .icon {
    position: absolute;
    top: 0;
    width: 90%;
    height: 90%;
    background-size: 100%;
    background-position: center center;
    background-repeat: no-repeat;
  }

  .text {
    color: black;
    font-size: 65%;
    font-weight: bold;
    text-align: center;
    top: 28%;
    width: 80%;
    line-height: 1;
  }

  &:hover {
    transform: scale(1.2);
  }
}
</style>
