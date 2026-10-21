
const API_URL = "http://localhost:3001/applications";

// Get all applications
export async function getApplications() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch applications");
  }

  return response.json();
}

// Get applications by applicant
export async function getApplicationsByApplicant(applicantId) {
  const response = await fetch(
    `${API_URL}?applicantId=${encodeURIComponent(applicantId)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch your applications");
  }

  return response.json();
}

// Get applications for a particular gig
export async function getApplicationsByGig(gigId) {
  const response = await fetch(
    `${API_URL}?gigId=${encodeURIComponent(gigId)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch gig applications");
  }

  return response.json();
}

// Create a new application
export async function createApplication(applicationData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...applicationData,
      status: applicationData.status || "Pending",
      createdAt:
        applicationData.createdAt || new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to submit application");
  }

  return response.json();
}

// Update an application
export async function updateApplication(id, updates) {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update application");
  }

  return response.json();
}

// Delete an application
export async function deleteApplication(id) {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete application");
  }

  return true;
}
