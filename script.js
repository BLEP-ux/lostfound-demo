document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("error");

  // Demo-only credentials
  const demoUser = {
    email: "student@earist.edu.ph",
    password: "12345"
  };

  if (email === demoUser.email && password === demoUser.password) {
    window.location.href = "dashboard.html";
  } else {
    error.textContent = "Invalid email or password.";
  }
});
