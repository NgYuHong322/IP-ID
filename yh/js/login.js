// Function to toggle password visibility
function togglePasswordVisibility(inputId, toggleIconId) {
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = document.getElementById(toggleIconId);

  const type = passwordInput.type === 'password' ? 'text' : 'password';

  passwordInput.type = type;

  toggleIcon.className = type === 'password' ? 'fa-solid fa-lock hover:cursor-pointer' : 'fa-solid fa-unlock-alt hover:cursor-pointer';
}



document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('togglePassword').addEventListener('click', function () {
    togglePasswordVisibility('password', 'togglePassword');
  })
  const loginForm = document.querySelector('.signin');
  const appleButton = document.querySelector('.social-icon-apple');


  if (loginForm && appleButton) {
    // Parse the query parameters from the URL
    const queryParams = new URLSearchParams(window.location.search);
    const username = queryParams.get('username');

    // Autofill the login form with the username
    if (username) {
      const usernameInput = loginForm.querySelector('input[name="username"]');
      if (usernameInput) {
        usernameInput.value = decodeURIComponent(username);
      }
    }

    const isAppleDevice = /iPhone|iPad|Mac/i.test(navigator.userAgent);

    // Hide the Apple button if the user is not on an Apple device
    if (!isAppleDevice) {
      appleButton.style.display = 'none';

    }

    // Add event listener to the login form's submit button
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      const errorMessageElement = document.getElementById('error-message');
      
      // Check for null before accessing properties
      if (errorMessageElement) {
        errorMessageElement.classList.add('hidden');
        errorMessageElement.textContent = '';
      }

      try {
        const response = await fetch('http://localhost:8082/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: usernameInput ? usernameInput.value : null,
            password: passwordInput ? passwordInput.value : null,
          }),
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log(responseData)
          if (responseData.success) {
            const userData = responseData.userData;

            // Extract specific properties
            const { _id, username } = userData;
            
            // Create a new object with only the desired properties
            const userDataToStore = {
              _id,
              username,
            };
            
            localStorage.setItem('isLoggedIn', 'true');

            // Store the selected data in local storage
            localStorage.setItem('userData', JSON.stringify(userDataToStore));

        
            // Dispatch a custom event indicating successful login
            const loginEvent = new Event('loginSuccess');
            document.dispatchEvent(loginEvent);
        
            // Store a flag in local storage to indicate that the user is logged in
        
            // Wait for a short duration before redirecting to allow the event and local storage update to be processed
            setTimeout(() => {
              window.location.href = 'home.html'
            }, 100); // Adjust the timeout duration as needed
        }

        } else {
          // Add red border to corresponding input fields
          if (response.status === 400 && usernameInput) {
            errorMessageElement.classList.remove('hidden');
            errorMessageElement.textContent = 'Username not found';
            usernameInput.classList.add('error-border');
            passwordInput.classList.remove('error-border');
          } else if (response.status === 401 && passwordInput) {
            errorMessageElement.classList.remove('hidden');
            errorMessageElement.textContent = 'Password incorrect';
            passwordInput.classList.add('error-border');
            usernameInput.classList.remove('error-border');
          } else {
            // Clear borders if the error is not related to username or password
            if (usernameInput) {
              usernameInput.classList.remove('error-border');
            }
            if (passwordInput) {
              passwordInput.classList.remove('error-border');
            }
          }
        }
      } catch (error) {
        console.error('Error during login:', error);

        // Handle other errors (e.g., network issues)
        // Optionally display an error message to the user
        if (errorMessageElement) {
          errorMessageElement.classList.remove('hidden');
          errorMessageElement.textContent = 'An error occurred. Please try again later.';
        }
      }
    });
  }
});
