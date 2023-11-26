const state = () => ({
  cohosts: [],
});

const getters = {};

const actions = {};

const mutations = {
  clear(state) {
    state.cohosts = [];
  },
  set(state, cohosts = []) {
    state.cohosts = cohosts;
  },
  add(state, playerId) {
    const index = state.cohosts.indexOf(playerId);
    if (index === -1) state.cohosts.push(playerId);
  },
  remove(state, playerId) {
    const index = state.cohosts.indexOf(playerId);
    if (index !== -1) state.cohosts.splice(index, 1);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
