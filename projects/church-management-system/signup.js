// Terms and Conditions Modal Logic
let hasScrolledToBottom = false;
let termsAccepted = false;

function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const icon = document.getElementById(fieldId + "-icon");

  if (field.type === "password") {
    field.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    field.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// Initialize Terms Modal functionality
document.addEventListener("DOMContentLoaded", function () {
  // Terms modal functionality
  const termsModal = document.getElementById("termsModal");
  const openTermsLink = document.getElementById("openTermsLink");
  const termsContent = document.getElementById("termsContent");
  const acceptTermsBtn = document.getElementById("acceptTermsBtn");
  const termsCheckbox = document.getElementById("terms");
  const scrollMessage = document.getElementById("scrollMessage");

  // Open Terms Modal
  openTermsLink.addEventListener("click", function (e) {
    e.preventDefault();
    termsModal.classList.add("active");
    hasScrolledToBottom = false;
    acceptTermsBtn.disabled = true;
    acceptTermsBtn.classList.add(
      "bg-gray-400",
      "cursor-not-allowed",
      "opacity-50"
    );
    acceptTermsBtn.classList.remove(
      "bg-blue-600",
      "hover:bg-blue-700",
      "cursor-pointer"
    );
  });

  // Check scroll position
  termsContent.addEventListener("scroll", function () {
    const scrollTop = termsContent.scrollTop;
    const scrollHeight = termsContent.scrollHeight;
    const clientHeight = termsContent.clientHeight;

    // Check if scrolled to bottom (with 10px tolerance)
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      if (!hasScrolledToBottom) {
        hasScrolledToBottom = true;
        acceptTermsBtn.disabled = false;
        acceptTermsBtn.classList.remove(
          "bg-gray-400",
          "cursor-not-allowed",
          "opacity-50"
        );
        acceptTermsBtn.classList.add(
          "bg-blue-600",
          "hover:bg-blue-700",
          "cursor-pointer"
        );
        scrollMessage.innerHTML =
          '<i class="fas fa-check-circle text-green-600 mr-1"></i>You may now accept';
      }
    }
  });

  // Accept Terms Button
  acceptTermsBtn.addEventListener("click", function () {
    if (hasScrolledToBottom) {
      termsAccepted = true;
      termsCheckbox.disabled = false;
      termsCheckbox.checked = true;
      termsCheckbox.classList.remove("cursor-not-allowed");
      termsModal.classList.remove("active");
    }
  });

  // Close modal when clicking outside
  termsModal.addEventListener("click", function (e) {
    if (e.target === this) {
      this.classList.remove("active");
    }
  });

  // Prevent unchecking terms checkbox
  termsCheckbox.addEventListener("change", function () {
    if (!termsAccepted) {
      this.checked = false;
      openTermsLink.click();
    }
  });

  // Sign Up Form Submission
  document
    .getElementById("signup-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      // Get form values
      const username = document.getElementById("username").value.trim();
      const firstname = document.getElementById("firstname").value.trim();
      const middlename = document.getElementById("middlename").value.trim();
      const lastname = document.getElementById("lastname").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmpassword").value;
      const terms = document.getElementById("terms").checked;

      // Validate username
      if (username.length < 4) {
        showError("Username must be at least 4 characters long");
        return;
      }

      // Validate first name
      if (firstname.length < 2) {
        showError("First name is required");
        return;
      }

      // Validate last name
      if (lastname.length < 2) {
        showError("Last name is required");
        return;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError("Please enter a valid email address");
        return;
      }

      // Validate password
      if (password.length < 6) {
        showError("Password must be at least 6 characters long");
        return;
      }

      // Validate password match
      if (password !== confirmPassword) {
        showError("Passwords do not match");
        return;
      }

      // Validate terms
      if (!terms) {
        showError("You must agree to the Terms and Conditions");
        return;
      }

      // Disable submit button to prevent double submission
      const submitBtn = document.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Account...';

      try {
        // Send data to PHP backend (removed fullname construction)
        const response = await fetch("signup_process.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            firstname: firstname,
            middlename: middlename,
            lastname: lastname,
            email: email,
            password: password,
            confirmpassword: confirmPassword,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Show success message with account number
          const successDiv = document.getElementById("signup-success");
          successDiv.innerHTML = `
                    <div class="text-center">
                        <i class="fas fa-check-circle text-3xl mb-2"></i>
                        <p class="font-bold text-lg">Account Created Successfully!</p>
                        <p class="mt-2">Your Account Number: <span class="font-bold text-xl text-green-800">${data.account_number}</span></p>
                        <p class="text-sm mt-2">Please save this number for your records.</p>
                        <p class="text-sm mt-1">Redirecting to login...</p>
                    </div>
                `;
          successDiv.classList.remove("hidden");

          // Reset form
          document.getElementById("signup-form").reset();

          // Reset terms acceptance
          termsAccepted = false;
          document.getElementById("terms").disabled = true;
          document.getElementById("terms").classList.add("cursor-not-allowed");

          // Redirect to login after 5 seconds
          setTimeout(() => {
            window.location.href = "index.html";
          }, 5000);
        } else {
          // Show error message
          showError(data.message || "An error occurred during registration");

          // Re-enable submit button
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Sign Up';
        }
      } catch (error) {
        console.error("Error:", error);
        showError("Unable to connect to server. Please try again later.");

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Sign Up';
      }
    });
});

function showError(message) {
  const errorDiv = document.getElementById("signup-error");
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");

  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorDiv.classList.add("hidden");
  }, 5000);
}
