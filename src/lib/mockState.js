// Shared mock-mode flag — db.js and social.js both read this so the whole app
// (tracking + social) can be previewed via the "Entrar como Teste" path.
let _mock = false
export function setMockMode(on) { _mock = on }
export function isMockMode() { return _mock }
