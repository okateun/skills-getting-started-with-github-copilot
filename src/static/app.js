document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: Unregister a participant from an activity
  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      return { ok: response.ok, result };
    } catch (error) {
      console.error("Error unregistering participant:", error);
      return { ok: false, result: null };
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Title
        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        // Description
        const descP = document.createElement("p");
        descP.textContent = details.description;
        activityCard.appendChild(descP);

        // Schedule
        const schedP = document.createElement("p");
        const schedStrong = document.createElement("strong");
        schedStrong.textContent = "Schedule:";
        schedP.appendChild(schedStrong);
        schedP.appendChild(document.createTextNode(" " + details.schedule));
        activityCard.appendChild(schedP);

        // Availability
        const availP = document.createElement("p");
        const availStrong = document.createElement("strong");
        availStrong.textContent = "Availability:";
        availP.appendChild(availStrong);
        availP.appendChild(document.createTextNode(" " + spotsLeft + " spots left"));
        activityCard.appendChild(availP);

        // Participants block
        const participantsBlock = document.createElement("div");
        participantsBlock.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = `${details.participants.length}`;
        participantsHeader.appendChild(badge);
        participantsBlock.appendChild(participantsHeader);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = p;
            nameSpan.className = "participant-email";

            const delBtn = document.createElement("button");
            delBtn.className = "delete-btn";
            delBtn.title = "Unregister participant";
            delBtn.textContent = "🗑️";
            delBtn.addEventListener("click", async () => {
              const confirmed = confirm(`Unregister ${p} from ${name}?`);
              if (!confirmed) return;

              const { ok, result } = await unregisterParticipant(name, p);
              if (ok) {
                messageDiv.textContent = result?.message || "Participant unregistered";
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");

                // Refresh the activities to show updated participants and counts
                fetchActivities();
              } else {
                messageDiv.textContent = result?.detail || "Failed to unregister participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }

              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);

            ul.appendChild(li);
          });
          participantsBlock.appendChild(ul);
        } else {
          const emptyP = document.createElement("p");
          emptyP.className = "participant-empty";
          emptyP.textContent = "No participants yet. Be the first to sign up!";
          participantsBlock.appendChild(emptyP);
        }

        activityCard.appendChild(participantsBlock);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so the new participant shows up immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
