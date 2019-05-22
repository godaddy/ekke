module.exports = {
  root: true,
  extends: ['godaddy-react'],
  globals: {
    '__DEV__': 'readonly',
    'ErrorUtils': 'readonly'
  },
  rules: {
    'no-process-env': 0,
    'max-statements': 0,
    'no-new-func': 0,
    'complexity': 0,
    'no-console': 0,
    'no-sync': 0
  }
}
