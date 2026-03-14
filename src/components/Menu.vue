<template>
  <div id="controls">
    <span
      class="whoami"
      :class="{
        standalone: !session.sessionId,
        cohost: session.isCohost,
        spectator: session.isSpectator,
      }"
    >
      {{
        session.isCohost
          ? "Cohost"
          : session.isSpectator
          ? "Player"
          : "Storyteller"
      }}
    </span>
    <span
      class="nomlog-summary"
      v-show="session.voteHistory.length && session.sessionId"
      @click="toggleModal('voteHistory')"
      :title="`${session.voteHistory.length} recent ${
        session.voteHistory.length == 1 ? 'nomination' : 'nominations'
      }`"
    >
      <font-awesome-icon icon="book-dead" />
      {{ session.voteHistory.length }}
    </span>
    <span
      class="connection"
      :class="{
        connecting: session.isConnecting,
        error: session.connectionErrored,
      }"
      v-if="session.sessionId"
      @click="leaveSession"
      :title="`${session.playerCount} other players in this session${
        session.ping ? ' (' + session.ping + 'ms latency)' : ''
      }`"
    >
      <font-awesome-icon icon="broadcast-tower" />
      {{ session.playerCount }}
    </span>
    <div class="menu" :class="{ open: grimoire.isMenuOpen }">
      <font-awesome-icon
        :icon="grimoire.isMenuOpen ? 'times' : 'cog'"
        @click="toggleMenu"
      />
      <ul v-show="grimoire.isMenuOpen">
        <li class="tabs" :class="tab">
          <font-awesome-icon icon="book-open" @click="tab = 'grimoire'" />
          <font-awesome-icon icon="broadcast-tower" @click="tab = 'session'" />
          <font-awesome-icon
            icon="users"
            v-if="!session.isSpectator"
            @click="tab = 'players'"
          />
          <font-awesome-icon
            v-if="!session.isCohost"
            icon="theater-masks"
            @click="tab = 'characters'"
          />
          <font-awesome-icon icon="question" @click="tab = 'help'" />
        </li>

        <template v-if="tab === 'grimoire'">
          <!-- Grimoire -->
          <li class="headline">Grimoire</li>
          <li @click="toggleGrimoire" v-if="players.length">
            <template v-if="!grimoire.isPublic">Hide</template>
            <template v-if="grimoire.isPublic">Show</template>
            <em>[G]</em>
          </li>
          <li @click="toggleNight" v-if="!session.isSpectator">
            <template v-if="!grimoire.isNight">Switch to Night</template>
            <template v-if="grimoire.isNight">Switch to Day</template>
            <em>[S]</em>
          </li>
          <li @click="toggleNightOrder" v-if="players.length">
            Night order
            <em>
              <font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.isNightOrder ? 'check-square' : 'square',
                ]"
              />
            </em>
          </li>
          <li v-if="players.length">
            Zoom
            <em>
              <font-awesome-icon
                @click="setZoom(grimoire.zoom - 1)"
                icon="search-minus"
              />
              {{ Math.round(100 + grimoire.zoom * 10) }}%
              <font-awesome-icon
                @click="setZoom(grimoire.zoom + 1)"
                icon="search-plus"
              />
            </em>
          </li>
          <li @click="setBackground">
            Background image
            <em><font-awesome-icon icon="image" /></em>
          </li>
          <li v-if="!edition.isOfficial" @click="imageOptIn">
            <small>Show Custom Images</small>
            <em
              ><font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.isImageOptIn ? 'check-square' : 'square',
                ]"
            /></em>
          </li>
          <li @click="toggleStatic">
            Disable Animations
            <em
              ><font-awesome-icon
                :icon="['fas', grimoire.isStatic ? 'check-square' : 'square']"
            /></em>
          </li>
          <li @click="toggleMuted">
            Mute Sounds
            <em
              ><font-awesome-icon
                :icon="['fas', grimoire.isMuted ? 'volume-mute' : 'volume-up']"
            /></em>
          </li>
          <li @click="toggleSmolBluffs">
            {{ grimoire.smolBluffs ? "Regular bluffs" : "Small bluffs" }}
            <em
              ><font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.smolBluffs ? 'expand-alt' : 'compress-alt',
                ]"
            /></em>
          </li>
          <li @click="toggleTeamColors">
            Team colors
            <em
              ><font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.teamColors ? 'check-square' : 'square',
                ]"
            /></em>
          </li>
          <li @click="toggleMismatchWarnings">
            Mismatch warnings
            <em
              ><font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.mismatchWarnings ? 'check-square' : 'square',
                ]"
            /></em>
          </li>
        </template>

        <template v-if="tab === 'session'">
          <!-- Session -->
          <li class="headline" v-if="session.sessionId">
            {{ session.isSpectator ? "Playing" : "Hosting" }}
          </li>
          <li class="headline" v-else>Live Session</li>
          <template v-if="!session.sessionId">
            <li @click="hostSession">Host (Storyteller)<em>[H]</em></li>
            <li @click="joinSession">Join (Player)<em>[J]</em></li>
            <li @click="cohostSession">Co-host (Storyteller)</li>
          </template>
          <template v-else>
            <li v-if="session.ping">
              Delay to {{ session.isSpectator ? "host" : "players" }}
              <em>{{ session.ping }}ms</em>
            </li>
            <li @click="copySessionUrl">
              Copy player link
              <em><font-awesome-icon icon="copy" /></em>
            </li>
            <li v-if="!session.isSpectator" @click="newGame">
              New Game
              <em><font-awesome-icon icon="file" /></em>
            </li>
            <li v-if="!session.isSpectator" @click="distributeRoles">
              Send Characters
              <em><font-awesome-icon icon="theater-masks" /></em>
            </li>
            <li
              v-if="session.voteHistory.length || !session.isSpectator"
              @click="toggleModal('voteHistory')"
            >
              Vote history<em>[V]</em>
            </li>
            <li @click="leaveSession">
              Leave Session
              <em>{{ session.sessionId }}</em>
            </li>
          </template>
        </template>

        <template v-if="tab === 'players' && !session.isSpectator">
          <!-- Users -->
          <li class="headline">Players</li>
          <li @click="addPlayers" v-if="players.length < 20">
            Add<em>[A]</em>
          </li>
          <li @click="randomizeSeatings" v-if="players.length > 2">
            Randomize
            <em><font-awesome-icon icon="dice" /></em>
          </li>
          <li @click="clearPlayers" v-if="players.length">
            Remove all
            <em><font-awesome-icon icon="trash-alt" /></em>
          </li>
        </template>

        <template v-if="tab === 'characters'">
          <!-- Characters -->
          <li class="headline">Characters</li>
          <li v-if="!session.isSpectator" @click="toggleModal('edition')">
            Select Edition
            <em>[E]</em>
          </li>
          <li
            @click="toggleModal('roles')"
            v-if="!session.isSpectator && players.length > 4"
          >
            Choose & Assign
            <em>[C]</em>
          </li>
          <li v-if="!session.isSpectator" @click="toggleModal('fabled')">
            Add Fabled
            <em><font-awesome-icon icon="dragon" /></em>
          </li>
          <li @click="clearRoles" v-if="players.length">
            Remove all
            <em><font-awesome-icon icon="trash-alt" /></em>
          </li>
        </template>

        <template v-if="tab === 'help'">
          <!-- Help -->
          <li class="headline">Help</li>
          <li @click="toggleModal('reference')">
            Reference Sheet
            <em>[R]</em>
          </li>
          <li @click="toggleModal('nightOrder')">
            Night Order Sheet
            <em>[N]</em>
          </li>
          <li @click="toggleModal('gameState')">
            Game State JSON
            <em><font-awesome-icon icon="file-code" /></em>
          </li>
          <li>
            <a
              href="https://github.com/thislooksfun/townsquare"
              target="_blank"
            >
              Source code
            </a>
            <em>
              <a
                href="https://github.com/thislooksfun/townsquare"
                target="_blank"
              >
                <font-awesome-icon :icon="['fab', 'github']" />
              </a>
            </em>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState } from "vuex";

export default {
  computed: {
    ...mapState(["grimoire", "session", "edition"]),
    ...mapState("players", ["players"]),
  },
  data() {
    return {
      tab: "grimoire",
    };
  },
  methods: {
    setBackground() {
      const background = prompt("Enter custom background URL");
      if (background || background === "") {
        this.$store.commit("setBackground", background);
      }
    },
    hostSession() {
      if (this.session.sessionId) return;
      const sessionId = prompt(
        "Enter a channel number / name for your session",
        Math.round(Math.random() * 10000),
      );
      if (sessionId) {
        this.$store.commit("session/clearVoteHistory");
        this.$store.commit("cohosts/clear");
        this.$store.commit("session/setSpectator", false);
        this.$store.commit("session/setCohost", false);
        this.$store.commit("session/setSessionId", sessionId);
        this.copySessionUrl();
      }
    },
    cohostSession() {
      if (this.session.sessionId) return this.leaveSession();
      let sessionId = prompt(
        "Enter the channel number / name of the session you want to co-host",
      );
      if (sessionId.match(/^https?:\/\//i)) {
        sessionId = sessionId.split("#").pop();
      }
      if (sessionId) {
        this.$store.commit("session/clearVoteHistory");
        this.$store.commit("cohosts/clear");
        this.$store.commit("session/setSpectator", true);
        this.$store.commit("session/setCohost", true);
        this.$store.commit("toggleGrimoire", false);
        this.$store.commit("session/setSessionId", sessionId);
      }
    },
    copySessionUrl() {
      const url = window.location.href.split("#")[0];
      const link = url + "#" + this.session.sessionId;
      navigator.clipboard.writeText(link);
    },
    newGame() {
      if (this.session.isSpectator) return;

      const popup =
        "Do you want to clear all players' boards and start a new game?";
      if (confirm(popup)) {
        this.$store.dispatch("newGame");
      }
    },
    distributeRoles() {
      if (this.session.isSpectator) return;
      const popup =
        "Do you want to distribute assigned characters to all SEATED players?";
      if (confirm(popup)) {
        this.$store.commit("session/distributeRoles", true);
        setTimeout(
          (() => {
            this.$store.commit("session/distributeRoles", false);
          }).bind(this),
          2000,
        );
      }
    },
    imageOptIn() {
      const popup =
        "Are you sure you want to allow custom images? A malicious script file author might track your IP address this way.";
      if (this.grimoire.isImageOptIn || confirm(popup)) {
        this.toggleImageOptIn();
      }
    },
    joinSession() {
      if (this.session.sessionId) return this.leaveSession();
      let sessionId = prompt(
        "Enter the channel number / name of the session you want to join",
      );
      if (sessionId.match(/^https?:\/\//i)) {
        sessionId = sessionId.split("#").pop();
      }
      if (sessionId) {
        this.$store.commit("session/clearVoteHistory");
        this.$store.commit("cohosts/clear");
        this.$store.commit("session/setSpectator", true);
        this.$store.commit("session/setCohost", false);
        this.$store.commit("toggleGrimoire", false);
        this.$store.commit("session/setSessionId", sessionId);
      }
    },
    leaveSession() {
      if (confirm("Are you sure you want to leave the active live game?")) {
        this.$store.commit("cohosts/clear");
        this.$store.commit("session/setSpectator", false);
        this.$store.commit("session/setCohost", false);
        this.$store.commit("session/setSessionId", "");
        this.$store.dispatch("players/disconnect");
      }
    },
    addPlayers() {
      if (this.session.isSpectator) return;

      const remainingSeats = 20 - this.players.length;
      if (remainingSeats <= 0) {
        alert("Max players already added");
        return;
      }

      const answer = prompt("How many players would you like to add?");
      if (!answer) return;
      const count = parseInt(answer);

      if (Number.isNaN(count)) {
        alert("Please enter a valid number");
        return;
      }

      if (count < 1) {
        alert("Please enter a number greater than 0");
        return;
      }

      if (count > remainingSeats) {
        alert(`You can only add ${remainingSeats} more player(s)`);
        return;
      }

      this.$store.commit("players/add", count);
    },
    randomizeSeatings() {
      if (this.session.isSpectator) return;
      if (confirm("Are you sure you want to randomize seatings?")) {
        this.$store.dispatch("players/randomize");
      }
    },
    clearPlayers() {
      if (this.session.isSpectator) return;
      if (confirm("Are you sure you want to remove all players?")) {
        // abort vote if in progress
        if (this.session.nomination) {
          this.$store.commit("session/nomination");
        }
        this.$store.commit("players/clear");
      }
    },
    clearRoles() {
      if (confirm("Are you sure you want to remove all player roles?")) {
        this.$store.dispatch("players/clearRoles");
      }
    },
    toggleNight() {
      this.$store.commit("toggleNight");
      if (this.grimoire.isNight) {
        this.$store.commit("session/setMarkedPlayer", -1);
      }
    },
    ...mapMutations([
      "toggleMismatchWarnings",
      "toggleGrimoire",
      "toggleMenu",
      "toggleImageOptIn",
      "toggleMuted",
      "toggleNightOrder",
      "toggleTeamColors",
      "toggleSmolBluffs",
      "toggleStatic",
      "setZoom",
      "toggleModal",
    ]),
  },
};
</script>

<style scoped lang="scss">
@import "../vars.scss";

// success animation
@keyframes greenToWhite {
  from {
    color: green;
  }
  to {
    color: white;
  }
}

// Controls
#controls {
  height: 40px;
  position: absolute;
  right: 8px;
  top: 4px;
  text-align: right;
  padding-right: 50px;
  z-index: 75;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
    &.success {
      animation: greenToWhite 1s normal forwards;
      animation-iteration-count: 1;
    }
  }

  > span {
    display: inline-block;
    cursor: pointer;
    z-index: 5;
  }

  span.whoami {
    display: inline-block;
    margin: 0;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    border: 3px solid black;
    box-shadow: 0 0 5px black;
    font-size: 0.75em;
    line-height: 0.75em;
    cursor: default;

    color: $demon;
    &.spectator {
      // color: $townsfolk;
      display: none !important;
    }
    &.cohost {
      color: $traveler;
    }

    &.standalone {
      display: none !important;
    }
  }

  span.nomlog-summary {
    color: $townsfolk;
  }

  span.connection {
    color: white;
    &.connecting {
      color: $success;
      animation: blink 1s infinite;
    }
    &.error {
      color: $demon;
    }
  }
}

@keyframes blink {
  50% {
    opacity: 0.5;
    color: gray;
  }
}

.menu {
  width: 230px;
  transform-origin: 210px 22px;
  position: absolute;
  right: 0;
  top: 0;

  > svg {
    cursor: pointer;
    background: rgba(0, 0, 0, 0.5);
    border: 3px solid black;
    width: 40px;
    height: 40px;
    border-bottom: 0;
    border-radius: 10px;
    padding: 5px;
  }

  a {
    color: white;
    text-decoration: none;
    &:hover {
      color: red;
    }
  }

  ul {
    display: flex;
    list-style-type: none;
    padding: 0;
    margin: 0;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 0 10px black;
    border: 3px solid black;
    border-radius: 10px 0 10px 10px;

    li {
      padding: 2px 5px;
      color: white;
      text-align: left;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 30px;

      &.tabs {
        display: flex;
        padding: 0;
        svg {
          flex-grow: 1;
          flex-shrink: 0;
          height: 35px;
          border-bottom: 3px solid black;
          border-right: 3px solid black;
          padding: 5px 0;
          cursor: pointer;
          transition: color 250ms;
          &:hover {
            color: red;
          }
          &:last-child {
            border-right: 0;
          }
        }
        &.grimoire .fa-book-open,
        &.players .fa-users,
        &.characters .fa-theater-masks,
        &.session .fa-broadcast-tower,
        &.help .fa-question {
          background: linear-gradient(
            to bottom,
            $townsfolk 0%,
            rgba(0, 0, 0, 0.5) 100%
          );
        }
      }

      &:not(.headline):not(.tabs):hover {
        cursor: pointer;
        color: red;
      }

      em {
        flex-grow: 0;
        font-style: normal;
        margin-left: 10px;
        font-size: 80%;
      }
    }

    .headline {
      font-family: PiratesBay, sans-serif;
      letter-spacing: 1px;
      padding: 0 10px;
      text-align: center;
      justify-content: center;
      background: linear-gradient(
        to right,
        $townsfolk 0%,
        rgba(0, 0, 0, 0.5) 20%,
        rgba(0, 0, 0, 0.5) 80%,
        $demon 100%
      );
    }
  }
}
</style>
