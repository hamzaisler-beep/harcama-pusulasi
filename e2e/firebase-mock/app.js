export class FirebaseError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "FirebaseError";
  }
}

const apps = [];
export function initializeApp(config) {
  const app = { name: "[DEFAULT]", options: config };
  apps.push(app);
  return app;
}
export function getApps() {
  return apps;
}
export function getApp() {
  return apps[0];
}
