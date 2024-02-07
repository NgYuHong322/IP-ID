let userDataFromMongoDB; // Variable to store user data fetched from MongoDB

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
      alert('Invalid user info or user ID not found.');
      return;
    }

    const userId = userInfo._id.toString();

    const response = await fetch(`http://localhost:8082/getUserData?userId=${userId}`);

    
    if (!response.ok) {
      alert(`Error: Server returned status ${response.status}`);
      return;
    }

    // Use clone() to create a clone of the response before reading it
    const responseClone = response.clone();
    const responseBody = await response.text();
    const userData = JSON.parse(responseBody);

    if (userData && userData.user) {
      userDataFromMongoDB = userData.user;
    } else {
      alert('No userData.userData found in the response:', userData);
    }

    // Use the cloned response for subsequent processing
    return responseClone;
  } catch (error) {
    alert('Error fetching and updating local variable:', error);
  }
}

async function getUserInfo() {
  await fetchAndUpdateLocalVariable();
  return userDataFromMongoDB || {};
}

function generateWalletItems(type, items) {
    const container = document.getElementById(`collapsibleContent${type}`);

    if (container) {
      const fragment = document.createDocumentFragment();

      items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('flex', 'items-center', 'mb-4');

        const iconClass = getIconClass(item.type);
        if (iconClass) {
          const iconElement = document.createElement('i');
          iconElement.className = iconClass;
          itemElement.appendChild(iconElement);
        } else {
          console.error(`Invalid iconClass for type: ${type}`);
        }

        const nameElement = document.createElement('p');
        nameElement.classList.add('text-sm', 'text-gray-600', 'dark:text-gray-400', 'mt-1', 'ml-2');
        nameElement.textContent = item.name;
        itemElement.appendChild(nameElement);

        const amountElement = document.createElement('p');
        amountElement.classList.add('ml-auto', 'text-sm', 'text-gray-600', 'dark:text-gray-400', 'mt-1');
        amountElement.textContent = `$${item.amount}`;
        itemElement.appendChild(amountElement);

        fragment.appendChild(itemElement);
      });

      container.innerHTML = '';
      container.appendChild(fragment);
    } else {
      console.error(`Container not found for type: ${type}`);
    }
}


function getIconClass(type) {
    switch (type) {
      case 'cash':
        return 'fa fa-money-bill text-black dark:text-white';
      case 'card':
        return 'fa fa-credit-card text-black dark:text-white';
      case 'payment':
        return 'fa fa-wallet text-black dark:text-white';
      case 'stock':
        return 'fa fa-chart-line text-black dark:text-white';
      case 'recharge':
        return 'fa fa-address-card text-black dark:text-white';
      case 'loan':
        return 'fa fa-money-bill-wave text-black dark:text-white'
      default:
        return 'fa fa-question-circle text-black dark:text-white';
    }
}

function calculateTotalAmount(walletItems, type) {
    return walletItems
      .filter(item => item.type === type)
      .reduce((total, item) => total + item.amount, 0);
}

async function displayWalletData() {
    const userData = await getUserInfo();
    const walletData = userData ? userData.walletItems : [];

    const organizedWalletData = {};
    walletData.forEach(item => {
      if (!organizedWalletData[item.type]) {
        organizedWalletData[item.type] = [];
      }
      organizedWalletData[item.type].push(item);
    });

    Object.keys(organizedWalletData).forEach(type => {
      // Try to find the container with a delay in case it's not yet available
      let attempts = 0;
      const findContainerInterval = setInterval(() => {
        const container = document.getElementById(`collapsibleContent${type}`);
        if (container || attempts >= 10) {
          clearInterval(findContainerInterval);
          generateWalletItems(type, organizedWalletData[type]);
          // Calculate and update the total amount
          const totalAmount = calculateTotalAmount(walletData, type);
          const amountElementId = `Amount${type.toLowerCase()}`;
          const amountElement = document.getElementById(amountElementId);

          if (amountElement) {
              amountElement.textContent = `$${totalAmount}`;
          } else {
              console.error(`Amount element not found for type: ${type}`);
          }
        }
        attempts++;
      }, 100);
    });
}


  
// Function to handle the page load event
window.addEventListener('load', async () => {
    await fetchAndUpdateLocalVariable();
    await displayWalletData();
});


const cards = document.querySelectorAll('.relative[data-section]');

cards.forEach(card => {
    card.addEventListener('click', function () {
        const sectionName = this.dataset.section;
        // Show modal
        document.getElementById('authentication-modal').classList.remove('hidden');

        updateModalContent(sectionName);

    });
});

function updateModalContent(sectionName) {
    // Hide all sections
    const modalSections = document.querySelectorAll('#change-info-section > div');
    modalSections.forEach(section => {
        section.classList.add('hidden');

        const inputElement = section.querySelector('input');
        if (inputElement) {
            inputElement.removeAttribute('required');
        }
    });


    document.getElementById('change-info-section').reset(); //to prevent autofill

    // Show the specific section
    const specificSection = Array.from(modalSections).find(section => section.id === sectionName);
    specificSection.classList.remove('hidden');

    // Show the update button
    const button = document.getElementById('update');
    button.classList.remove('hidden');

    // Set the visible field for form submission
    visibleField = sectionName;

    // Set the required attribute for the visible input field
    const inputElement = specificSection.querySelector('input');
    if (inputElement) {
        inputElement.setAttribute('required', 'required');
    }
}
// Attach hideModal function to close button
const closeModalButton = document.getElementById('close'); 
closeModalButton.addEventListener('click', function() {
    document.getElementById('authentication-modal').classList.add('hidden');

});

// Function to update data in local storage
function updateLocalVariable(key, value) {
    userDataFromMongoDB[key] = value;
}

// Function to update data in local storage
function updateLocalStorage(key, value) {
    // Retrieve existing data from local storage
    const storedData = JSON.parse(localStorage.getItem('userData')) || {};

    // Update the specific key with the new value
    storedData[key] = value;

    // Save the updated data back to local storage
    localStorage.setItem('userData', JSON.stringify(storedData));
}

// Function to hide and show password
function setupPasswordToggle(inputId, toggleId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(toggleId);

    if (toggleIcon) {
        toggleIcon.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
    
            // Toggle eye icon
            toggleIcon.innerHTML = type === 'password' ? '<i class="fa fa-eye" aria-hidden="true"></i>' : '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
        });

    }
    
}

// Handle each hide/show button
setupPasswordToggle('oldpassword', 'toggleOldPassword');
setupPasswordToggle('newpassword', 'toogleNewPassword');
setupPasswordToggle('conpassword', 'toggleConPassword');


// Check if username already exist
async function isUsernameUnique(newUsername) {
    try {
        const response = await fetch('http://localhost:8082/checkUsername', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newUsername: newUsername }),
        });

        const result = await response.json();

        return result.success;
    } catch (error) {
        console.error('Error checking username uniqueness:', error);
        return false;
    }
}

// Function to update username
async function updateUsernameOnServer(userId, newUsername) {
    try {
        const response = await fetch('http://localhost:8082/updateUsername', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId, newUsername: newUsername }),
        });

        const result = await response.json();

        if (result.success) {
            // Update successful
            updateLocalStorage('username', newUsername)
            updateLocalVariable('username', newUsername);


        } else {
            // Display error message from the server
            displayErrorMessage(result.message);
        }
    } catch (error) {
        console.error('Error updating username on the server:', error);
        displayErrorMessage('An error occurred. Please try again.');
    }
}

// Function to check if the entered old password matches the stored password
async function checkOldPassword(userId, enteredPassword) {
    try {
        const response = await fetch('http://localhost:8082/checkOldPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                oldPassword: enteredPassword,
            }),
        });

        const result = await response.json();

        if (result.success) {
            return true;
        } else {
            return  false;
        }
    } catch (error) {
        console.error('Error checking old password:', error);
        throw new Error('An error occurred while checking old password');
    }
}



// Function to update new password
async function updatePasswordOnServer(userId, newPassword) {
    try {
        const requestBody = {
            _id: userId,
            newPassword: newPassword,
        };

        const response = await fetch('http://localhost:8082/updatePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        await response.json();
    } catch (error) {
        console.error('Error updating password on the server:', error);
    }
}

// Function to check if email is unique
async function isEmailUnique(email) {
    try {
        const response = await fetch('http://localhost:8082/checkEmailExistence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }),
        });

        const result = await response.json();

        if (result.success) {
            // Email is unique
            return true;
        } else {
            // Email already exists
            return false;
        }
    } catch (error) {
        console.error('Error checking email existence:', error);
        return false;
    }
}

// Function to update email
async function updateEmailOnServer(userId, newEmail) {
    try {
        // Check if the new email already exists
        const isUnique = await isEmailUnique(newEmail);

        if (isUnique) {
            // Make a request to update the email on the server
            const response = await fetch('http://localhost:8082/updateEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userId, newEmail: newEmail }),
            });

            const result = await response.json();

            if (result.success) {
                // Update successful
                updateLocalVariable('email', newEmail);
            } else {
                // Display error message from the server
                displayErrorMessage(result.message);
            }
        } else {
            displayErrorMessage('Email already exists. Please choose a different email.');
        }
    } catch (error) {
        console.error('Error updating email on the server:', error);
        displayErrorMessage('An error occurred. Please try again.');
    }
}

// Function to update Birthdate
async function updateBirthdateOnServer(userId, newBirthdate) {
    try {
        const response = await fetch('http://localhost:8082/updateBirthdate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId, newBirthdate: newBirthdate }),
        });

        const result = await response.json();

        if (result.success) {
            // Update successful
            updateLocalVariable('birthdate', newBirthdate);
        } else {
            // Display error message from the server
            displayErrorMessage(result.message);
        }
    } catch (error) {
        console.error('Error updating birthdate on the server:', error);
        displayErrorMessage('An error occurred. Please try again.');
    }
}

// Function to update currency
async function updateCurrencyOnServer(userId, newCurrency) {
    try {
        const response = await fetch('http://localhost:8082/updateCurrency', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId, newCurrency: newCurrency }),
        });

        const result = await response.json();

        if (result.success) {
            // Update successful
            updateLocalVariable('currency', newCurrency);
        } else {
            // Display error message from the server
            displayErrorMessage(result.message);
        }
    } catch (error) {
        console.error('Error updating currency on the server:', error);
        displayErrorMessage('An error occurred. Please try again.');
    }
}

// Variable to track the currently visible field
let visibleField;

function showField(fieldId) {
    document.getElementById('change-info-section').reset();
    visibleField = fieldId;
    document.getElementById(fieldId).classList.remove('hidden');
}

function displayErrorMessage(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}


// Function to handle form submission
async function handleFormSubmission(event) {
    event.preventDefault();
    const userInfo = await getUserInfo();
    const userId = userInfo._id;
    const formData = new FormData(event.target);
    const username = formData.get('username') ?? {};
    const oldPassword = formData.get('oldpassword') ?? {};
    const newPassword = formData.get('newpassword') ?? {};
    const confirmPassword = formData.get('conpassword') ?? {};
    const email = formData.get('email') ?? {};
    const birthdate = formData.get('birthdate') ?? {};
    const currency = formData.get('currency') ?? {};

    if (username) {
        // Check if the new username already exists
        const isUnique = await isUsernameUnique(username);

        if (isUnique) {
            // Make a request to update the username on the server
            await updateUsernameOnServer(userId, username);
            closeModal();
            return;

        } else {
            displayErrorMessage('Username already exists. Please choose a different username.');
            return;
        }
    }

    if (oldPassword) {
        try {
            const isOldPasswordCorrect = await checkOldPassword(userId, oldPassword);

            if (isOldPasswordCorrect === true) {
                if (newPassword && confirmPassword && newPassword === confirmPassword) {
                    // Make a request to update the password on the server
                    await updatePasswordOnServer(userId, newPassword);
                    closeModal();
                    return;
                } else {
                    displayErrorMessage('Passwords do not match. Please try again.');
                    return;
                }
            } else {
                displayErrorMessage('Incorrect old password. Please try again.');
                return;
            }
        } catch (error) {
            console.error('Error checking old password:', error);
            displayErrorMessage('An error occurred. Please try again.');
            return;
        }
    }

    if (email) {
        // Check if the new email already exists
        const isUnique = await isEmailUnique(email);

        if (isUnique) {
            // Make a request to update the email on the server
            await updateEmailOnServer(userId, email);
        } else {
            displayErrorMessage('Email already exists. Please choose a different email.');
            return;
        }
    }

    if (birthdate) {
        await updateBirthdateOnServer(userId, birthdate);
    }

    if (currency) {
        await updateCurrencyOnServer(userId, currency);

    }

}




// Attach the handleFormSubmission function to the form's submit event
const form = document.querySelector('#change-info-section');
form.addEventListener('submit', handleFormSubmission);

// Function to update account information
async function updateAccountInformation() {
    const userInfo = await getUserInfo();
    // Update the DOM elements
    document.getElementById('usernameValue').textContent = userInfo.username || 'No username available';
    document.getElementById('emailValue').textContent = userInfo.email || 'No email available';
    document.getElementById('passwordValue').textContent = userInfo.password ? '********' : 'No password available';
    document.getElementById('currencyValue').textContent = userInfo.currency || 'No currency available';
    document.getElementById('birthdateValue').textContent = userInfo.birthdate || 'No birthdate available';
}


// Call the function to update account information on page load
updateAccountInformation();




// Function to update the welcome message and user email
async function updateWelcomeMessage() {
    const userInfo = await getUserInfo();
    const { username, email } = userInfo;

    // Update the DOM elements
    document.getElementById('welcomeMessage').textContent = `Welcome, ${username || 'Guest'}`;
    document.getElementById('userEmail').textContent = email || 'No email available';
}


// Function to update account information
async function updateAccountInformation() {
    const userInfo = await getUserInfo();

    const { username, email, password, currency, birthdate } = userInfo;

    // Update the DOM elements
    document.getElementById('usernameValue').textContent = username || 'No username available';
    document.getElementById('emailValue').textContent = email || 'No email available';
    document.getElementById('passwordValue').textContent = password ? '********' : 'No password available';
    document.getElementById('currencyValue').textContent = currency || 'No currency available';
    document.getElementById('birthdateValue').textContent = birthdate || 'No birthdate available';
}

// Call the function to update account information on page load
updateAccountInformation();

// Function to handle button click and update content and button styles
function handleButtonClick(button, contentToShow, otherContents, otherBtn, storageKey) {
    button.addEventListener('click', function () {
        // Change the content
        contentToShow.classList.remove('hidden');
        otherContents.forEach(content => content.classList.add('hidden'));

        // Change the color of the buttons
        button.classList.remove('text-gray-900', 'dark:text-gray-400');
        button.classList.add('text-blue-700', 'dark:text-blue-500');

        otherBtn.forEach(otherButton => {
            otherButton.classList.remove('text-blue-700', 'dark:text-blue-500');
            otherButton.classList.add('text-gray-900', 'dark:text-gray-400');
        });

        // Set active section in session storage
        sessionStorage.setItem(storageKey, button.id);
    });
}

// Function to check and set the active section based on session storage
function setActiveSectionFromStorage() {
    const activeSectionId = sessionStorage.getItem('activeSection');
    if (activeSectionId) {
        const activeSection = document.getElementById(activeSectionId);
        if (activeSection) {
            activeSection.click();
        }
    }
}

// Function to handle collapsible content toggle and save state to local storage
function handleCollapsibleContentToggle(collapseBtn, collapsibleContent, storageKey) {
    const isCollapsed = sessionStorage.getItem(storageKey) === 'true';

    // Set initial state
    if (isCollapsed) {
        collapsibleContent.classList.add('hidden');
    }

    collapseBtn.addEventListener('click', () => {
        collapsibleContent.classList.toggle('hidden');

        // Update local storage state
        sessionStorage.setItem(storageKey, collapsibleContent.classList.contains('hidden').toString());
    });
}

// Account Information
const accountbtn = document.getElementById('account-info-btn');
const accountInformation = document.querySelector("#account-information");

// Wallet
const walletbtn = document.getElementById('wallet-btn');
const wallet = document.querySelector("#wallet");

// FIP
const fipbtn = document.getElementById('fip-btn');
const fip = document.querySelector("#fip");

// Set up button click handlers and collapsible content toggles
if (walletbtn && accountbtn && fipbtn) {
    handleButtonClick(walletbtn, wallet, [accountInformation, fip], [accountbtn, fipbtn], 'activeSection');
    handleButtonClick(accountbtn, accountInformation, [wallet, fip], [walletbtn, fipbtn], 'activeSection');
    handleButtonClick(fipbtn, fip, [accountInformation, wallet], [accountbtn, walletbtn], 'activeSection');
}

// Set up collapsible content toggles
handleCollapsibleContentToggle(document.getElementById('collapseBtnCash'), document.getElementById('collapsibleContentcash'), 'collapseCash');
handleCollapsibleContentToggle(document.getElementById('collapseBtnCards'), document.getElementById('collapsibleContentcard'), 'collapseCards');
handleCollapsibleContentToggle(document.getElementById('collapseBtnOnline'), document.getElementById('collapsibleContentpayment'), 'collapseOnline');
handleCollapsibleContentToggle(document.getElementById('collapseBtnStocks'), document.getElementById('collapsibleContentstock'), 'collapseStocks');
handleCollapsibleContentToggle(document.getElementById('collapseBtnRecharge'), document.getElementById('collapsibleContentRecharge'), 'collapseRecharge');
handleCollapsibleContentToggle(document.getElementById('collapseBtnLoan'), document.getElementById('collapsibleContentloan'), 'collapseLoan');


setActiveSectionFromStorage();
updateWelcomeMessage();


// Function to handle signout 
function showsoModal() {
    document.getElementById('signOutModal').classList.remove('hidden');
}

// Function to hide the modal
function hideModal() {
    document.getElementById('signOutModal').classList.add('hidden');
}

// Event listener for the Sign Out button
document.getElementById('signOutButton').addEventListener('click', function () {
    // Show the modal
    showsoModal();
});

// Event listener for the Confirm Sign Out button in the modal
document.getElementById('confirmSignOut').addEventListener('click', function () {
    // Clear local storage and session storage
    localStorage.clear();
    sessionStorage.clear();


    // Redirect to the home page
    window.location.href = 'home.html';
});

// Event listener for the Cancel button in the modal
document.getElementById('cancelSignOut').addEventListener('click', function () {
    // Hide the modal
    hideModal();
});

// Handle add account
const closeAccModalButton = document.getElementById('closeAccModalButton');
const addItemButton = document.getElementById('walletmodal');
const toggleAddButton = document.getElementById('addButton')

// Function to show pop up window
function showModal() {
    const addWindow = document.getElementById('addWalletItemModal')
    addWindow.classList.remove('hidden')
}

// Function to close the modal
function closeModal() {
    const form = document.getElementById('change-info-section'); 
    form.reset();
    const addWindow = document.getElementById('addWalletItemModal')
    addWindow.classList.add('hidden')
    location.reload();
}

// Function to handle the submit (placeholder for now)
async function submitForm(event) {
    event.preventDefault(); 

    const userInfo = await getUserInfo();
    const userId = userInfo._id;
    const name = document.getElementById('name').value;
    const type = document.getElementById('walletItemType').value;
    const currency = document.getElementById('currencywallet').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const errorMessageWallet = document.getElementById('errorMessageWallet');


    // Make a POST request to the server
    const response = await fetch('http://localhost:8082/addWalletItem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, name, type, currency, amount })
    });

    const result = await response.json();

    closeModal();

    // Check for error in the response
    if (!response.ok) {
        const resultError = result.error || 'An error occurred.';

        // Display an error message to the user
        if (resultError.includes('Wallet item with this name already exists for the user.')) {
            // Show the error message
            errorMessageWallet.classList.add('hidden');
            errorMessageWallet.classList.remove('hidden');
        } else {
            // Hide the error message if there's a different error
            errorMessageWallet.classList.add('hidden');
        }

        return;
    }
}


if (closeModalButton) {
    closeAccModalButton.addEventListener("click", closeModal);
}

if(addItemButton) {
    addItemButton.addEventListener('submit', submitForm);
}

if(toggleAddButton) {
    toggleAddButton.addEventListener("click", showModal);
}


// Handle FIP
function showAllBadges() {
    window.location.href = 'fipBadges.html';
}

const badges = document.getElementById('badges');

if (badges) {
    badges.addEventListener('click', showAllBadges);
}