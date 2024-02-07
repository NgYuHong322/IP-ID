let userDataFromMongoDB; 
function getUserData() {
  const userDataString = localStorage.getItem('userData');
  if (userDataString) {
    return JSON.parse(userDataString);
  }
  return {};
}

async function fetchAndUpdateLocalVariable() {
  try {
    const userInfo = await getUserData();

    if (!userInfo || !userInfo._id) {
      return;
    }

    const userId = userInfo._id.toString();

    const response = await fetch(`http://localhost:8082/getUserData?userId=${userId}`);

    if (!response.ok) {
      return;
    }

    const userData = await response.json();

    if (userData && userData.user) {
      userDataFromMongoDB = userData.user;
    } else {
    }
  } catch (error) {
  }
}

async function getUserInfo() {
  fetchAndUpdateLocalVariable();
  return userDataFromMongoDB || {};
}

getUserInfo();


// JavaScript to show and hide the popup
document.addEventListener('DOMContentLoaded', function () {
  const popup = document.getElementById('popup');
  const closePopupButton = document.getElementById('closePopup');

  function showPopup() {
      popup.classList.remove('hidden');
  }

  function hidePopup() {
      popup.classList.add('hidden');
  }

  closePopupButton.addEventListener('click', function () {
      hidePopup();
  });
  document.getElementById('formContact').addEventListener('submit', function(event) {
    event.preventDefault();
    // Show loading animation
    document.getElementById('popup').classList.remove('hidden');

    // Simulate loading delay (adjust the duration as needed)
    setTimeout(function() {
        // Hide loading animation
        document.getElementById('loading-animation').classList.add('hidden');
        document.getElementById('modal').classList.remove('hidden');
    }, 2000); // 2000 milliseconds (2 seconds) as an example duration
  });
});
