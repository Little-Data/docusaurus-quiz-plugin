const path = require('path');

module.exports = function quizPlugin() {
  return {
    name: 'quiz-plugin',
    getThemePath() {
      return path.resolve(__dirname, './theme');
    },
  };
};