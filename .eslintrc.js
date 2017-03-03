module.exports = {
  "rules": {
    "indent": [
      2,
      2,
      {
        "VariableDeclarator": 2,
        "SwitchCase": 1
      }
    ],
    "linebreak-style": [
      2,
      "unix"
    ],
    "semi": [
      2,
      "always"
    ],
    "curly": "error",
    "quotes": [
      "error",
      "double"
    ]
  },
  "env": {
    "es6": true,
    "node": true
  },
  "extends": "eslint:recommended"
};
