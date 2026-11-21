// Renderer-only window CustomEvent names used to bridge components that don't
// share a React tree (e.g. the Settings route asking AppLayout to reopen the
// onboarding tour).

/** Dispatched from Settings → Help to relaunch the first-time welcome tour. */
export const LAUNCH_ONBOARDING_EVENT = 'sky-movie:launch-onboarding';
