// In-Memory Data Store for Campus Gig & SkillSwap Portal
import { initialUsers, initialGigs, initialApplications, initialReviews } from './seed.js';

export let users = JSON.parse(JSON.stringify(initialUsers));
export let gigs = JSON.parse(JSON.stringify(initialGigs));
export let applications = JSON.parse(JSON.stringify(initialApplications));
export let reviews = JSON.parse(JSON.stringify(initialReviews));

let gigSeq = 26;
let appSeq = 25;
let revSeq = 9;
let userSeq = 13;

export const nextGigId = () => `g${gigSeq++}`;
export const nextAppId = () => `a${appSeq++}`;
export const nextRevId = () => `r${revSeq++}`;
export const nextUserId = () => `u${userSeq++}`;

export const resetStore = () => {
  users = JSON.parse(JSON.stringify(initialUsers));
  gigs = JSON.parse(JSON.stringify(initialGigs));
  applications = JSON.parse(JSON.stringify(initialApplications));
  reviews = JSON.parse(JSON.stringify(initialReviews));
  gigSeq = 26;
  appSeq = 25;
  revSeq = 9;
  userSeq = 13;
  return {
    users: users.length,
    gigs: gigs.length,
    applications: applications.length,
    reviews: reviews.length,
  };
};
