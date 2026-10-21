export const DEMO_PASSWORD = 'Campus@123';

const SEED_ID_PREFIX = '00000000-0000-4000-8000-';

export const isDemoUser = (user) => user.id.startsWith(SEED_ID_PREFIX);

export const demoEmail = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@campus.edu`;
