
const API_URL = "http://localhost:3001";

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

export async function getReviews() {
  return request(`${API_URL}/reviews`);
}

export async function getReviewsByGig(gigId) {
  return request(
    `${API_URL}/reviews?gigId=${encodeURIComponent(gigId)}`
  );
}

export async function getReviewsByReviewer(reviewerId) {
  return request(
    `${API_URL}/reviews?reviewerId=${encodeURIComponent(reviewerId)}`
  );
}

export async function getReviewsByReviewee(revieweeId) {
  return request(
    `${API_URL}/reviews?revieweeId=${encodeURIComponent(revieweeId)}`
  );
}

export async function createReview(reviewData) {
  const reviews = await getReviewsByGig(reviewData.gigId);

  const alreadyReviewed = reviews.some(
    (review) =>
      String(review.reviewerId) === String(reviewData.reviewerId)
  );

  if (alreadyReviewed) {
    throw new Error("You have already reviewed this gig.");
  }

  const rating = Number(reviewData.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  return request(`${API_URL}/reviews`, {
    method: "POST",
    body: JSON.stringify({
      ...reviewData,
      rating,
    }),
  });
}

export async function getAverageRating(userId) {
  const reviews = await getReviewsByReviewee(userId);

  if (reviews.length === 0) {
    return {
      average: 0,
      totalReviews: 0,
    };
  }

  const total = reviews.reduce(
    (sum, review) => sum + Number(review.rating || 0),
    0
  );

  return {
    average: Number((total / reviews.length).toFixed(1)),
    totalReviews: reviews.length,
  };
}
