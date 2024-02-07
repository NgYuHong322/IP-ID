// Function to toggle password visibility
function togglePasswordVisibility(inputId, toggleIconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(toggleIconId);

    const type = passwordInput.type === 'password' ? 'text' : 'password';

    passwordInput.type = type;

    // Change the lock icon based on the password visibility
    toggleIcon.className = type === 'password' ? 'fa-solid fa-lock hover:cursor-pointer' : 'fa-solid fa-unlock-alt hover:cursor-pointer';
}

// Add click event listeners for password fields
document.getElementById('togglePassword').addEventListener('click', function () {
    togglePasswordVisibility('password', 'togglePassword');
});

document.getElementById('toggleConfirmPassword').addEventListener('click', function () {
    togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword');
});

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.querySelector('.signup');

  if (signupForm) {
      signupForm.addEventListener('submit', async (event) => {
          event.preventDefault(); // Prevent the default form submission
          const usernameInput = document.getElementsByName('username')[0];
          const emailInput = document.getElementsByName('emailaddress')[0];
          const passwordInput = document.getElementById('password');
          const confirmPasswordInput = document.getElementById('confirmPassword');
          const errorContainer = document.getElementById('passwordMismatchError');
          const usernameErrorContainer = document.getElementById('usernameError');
          const emailErrorContainer = document.getElementById('emailError');
          
          
          try {
              if (errorContainer) {
                errorContainer.classList.add('hidden');
                usernameErrorContainer.classList.add('hidden');
                emailErrorContainer.classList.add('hidden');
                usernameInput.classList.remove('error-border');
                emailInput.classList.remove('error-border');
                passwordInput.classList.remove('error-border');
                confirmPasswordInput.classList.remove('error-border');
                errorContainer.textContent = '';
              }
              // Check if passwords match
              if (passwordInput.value !== confirmPasswordInput.value) {
                  // Reset errors before validating inputs
                  
                  event.preventDefault(); // Prevent form submission

                  // Ensure that errorContainer is defined before manipulating it
                  if (errorContainer) {
                      errorContainer.classList.remove('hidden'); // Show the error message
                      errorContainer.textContent = 'Passwords do not match';
                  }

                  // Add red border to password and confirm password inputs
                  if (passwordInput) {
                      passwordInput.classList.add('error-border');
                  }
                  if (confirmPasswordInput) {
                      confirmPasswordInput.classList.add('error-border');
                  }

                  return;
              }

              // Clear any previous error messages related to password
              if (errorContainer) {
                  errorContainer.classList.add('hidden'); // Hide the error message
                  passwordInput.classList.remove('error-border');
                  confirmPasswordInput.classList.remove('error-border');
                  errorContainer.textContent = '';
              }

              // Fetch data from the form
              const formData = new FormData(signupForm);
              const userData = {};
              formData.forEach((value, key) => {
                  userData[key] = value;
              });

              const response = await fetch('http://localhost:8082/signup', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(userData),
              });

              if (response.ok) {
                  // Store username in sessionStorage 
                  sessionStorage.setItem('userData', JSON.stringify({ username: userData.username }));

                  // Redirect to login page upon successful registration and auto fill the username for user
                  window.location.href = `login.html?username=${encodeURIComponent(userData.username)}`;

              } else {
                  // Handle different HTTP status codes
                  const errorMessage = await response.text();
                  console.error('Registration failed:', errorMessage);

                  // Handle username error statur 400
                  if (errorMessage.includes('Username') && usernameErrorContainer) {
                      usernameErrorContainer.classList.remove('hidden'); // Show the username error message
                      usernameErrorContainer.textContent = 'Username is already taken. Please choose a different username.';
                  } else if (usernameErrorContainer) {
                      usernameErrorContainer.classList.add('hidden'); // Hide the username error message
                      usernameErrorContainer.textContent = '';
                  }

                  if (errorContainer) {
                      errorContainer.classList.add('hidden'); // Hide the common error message
                      errorContainer.textContent = '';
                  }

                  // Handle username error statur 401
                  if (errorMessage.includes('Email') && emailErrorContainer) {
                      emailErrorContainer.classList.remove('hidden'); // Show the email error message
                      emailErrorContainer.textContent = 'Email is already registered. Please use a different email address.';
                  } else if (emailErrorContainer) {
                      emailErrorContainer.classList.add('hidden'); // Hide the email error message
                      emailErrorContainer.textContent = '';
                  }

                  // Add or remove red border from corresponding input fields based on existence of errors
                  if (errorMessage.includes('Username') && usernameInput) {
                      usernameInput.classList.add('error-border');
                  } else if (usernameInput) {
                      usernameInput.classList.remove('error-border');
                  }

                  if (errorMessage.includes('Email') && emailInput) {
                      emailInput.classList.add('error-border');
                  } else if (emailInput) {
                      emailInput.classList.remove('error-border');
                  }
              }
          } catch (error) {
              console.error('Error during registration:', error);
              // Handle other errors (e.g., network issues)
              // Optionally display an error message to the user
          }
      });
  } else {
      console.error('Signup form not found.');
  }
});
