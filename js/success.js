 const form = document.querySelector("form");
    form.addEventListener("submit", function(e) {
      e.preventDefault(); // Prevent default submission

      const formData = new FormData(this);

      // Send the data to Netlify using a URL-encoded POST request.
      fetch("/", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams(formData).toString()
      })
      .then(response => {
        // Show the overlay and success pop-up
        document.getElementById("overlay").style.display = "block";
        const popup = document.getElementById("successPopup");
        popup.style.display = "block";

        // Optionally, hide the popup and overlay after 3 seconds
        setTimeout(() => {
          popup.style.display = "none";
          document.getElementById("overlay").style.display = "none";
          form.reset(); // Clear form fields if desired
        }, 3000);
      })
      .catch(error => {
        console.error("Error submitting form:", error);
      });
    });
