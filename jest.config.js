module.exports = {
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'vue'],
    transform: {
      '^.+\\.js$': 'babel-jest',
      '.*\\.(vue)$': '@vue/vue3-jest',
    },
  };
  