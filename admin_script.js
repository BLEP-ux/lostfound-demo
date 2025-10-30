document.getElementById("adminLoginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const user = document.getElementById("adminUser").value.trim();
  const pass = document.getElementById("adminPass").value.trim();
  const error = document.getElementById("adminError");

  // Demo admin credentials
  const admin = {
    username: "admin",
    password: "admin123"
  };

  if (user === admin.username && pass === admin.password) {
    window.location.href = "admin_dashboard.html";
  } else {
    error.textContent = "Invalid admin credentials.";
  }
});
