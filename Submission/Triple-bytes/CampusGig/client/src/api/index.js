import client from './client.js';

const data = (p) => p.then((r) => r.data);

export const signup = (body) => data(client.post('/auth/signup', body));
export const login = (body) => data(client.post('/auth/login', body));
export const getMe = () => data(client.get('/auth/me'));

export const getUsers = () => data(client.get('/users'));
export const getUser = (id) => data(client.get(`/users/${id}`));

export const getGigs = (params) => data(client.get('/gigs', { params }));
export const getGig = (id) => data(client.get(`/gigs/${id}`));
export const createGig = (body) => data(client.post('/gigs', body));
export const updateGigStatus = (id, status) => data(client.patch(`/gigs/${id}`, { status }));
export const getGigApplications = (id) => data(client.get(`/gigs/${id}/applications`));

export const createApplication = (body) => data(client.post('/applications', body));
export const getApplications = (params) => data(client.get('/applications', { params }));
export const decideApplication = (id, status) => data(client.patch(`/applications/${id}`, { status }));

export const createReview = (body) => data(client.post('/reviews', body));
