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
      window.location.href = 'login.html'; // Corrected redirection
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
    return;
  }
}


async function getUserInfo() {
  await fetchAndUpdateLocalVariable();
  return userDataFromMongoDB || {};
}

// Function to filter and limit wallet items by type
function filterAndLimitItems(items, type) {
  return items.filter(item => item.type === type).slice(0, 3);
}

// Function to get the appropriate icon class based on wallet item type
function getIconClass(type) {
  switch (type) {
    case 'cash':
      return 'fa fa-money-bill text-black dark:text-gray-800';
    case 'card':
      return 'fa fa-credit-card text-black dark:text-gray-800';
    case 'payment':
      return 'fa fa-wallet text-black dark:text-gray-800';
    case 'stock':
      return 'fa fa-chart-line text-black dark:text-gray-800';
    case 'recharge':
      return 'fa fa-address-card text-black dark:text-gray-800';
    case 'loan':
      return 'fa fa-money-bill-wave text-black dark:text-gray-800';
    default:
      return 'fa fa-question-circle text-black dark:text-gray-800';
  }
}

async function fetchRealTimeExchangeRate(baseCurrency, targetCurrency) {
  try {
    // Define fixed exchange rates for MYR and SGD
    const fixedExchangeRates = {
      'myr': 0.25,  // Example fixed exchange rate for MYR
      'sgd': 0.75,  // Example fixed exchange rate for SGD
      // Add more currencies and their fixed rates as needed
    };

    // Check if the target currency is in the fixed rates table
    if (targetCurrency in fixedExchangeRates) {
      return fixedExchangeRates[targetCurrency];
    } else {
      console.error(`Fixed exchange rate not available for currency: ${targetCurrency}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching fixed exchange rate:', error);
    return null;
  }
}


// Function to auto-fill exchange rate and select options based on selected wallets
async function autoFillExchangeRate() {
  try {
    const baseCurrency = document.getElementById('currency').value;
    const transactionType = getSelectedType();
    const userData = await getUserInfo();
    const walletItems = userData.walletItems;

    // Find the wallet with the specified currency
    const foundWallet = walletItems.find(wallet => wallet.currency === baseCurrency);

    if (foundWallet) {
      // Get the target currency from the wallet
      const targetCurrency = foundWallet.currency;

      // Fetch real-time exchange rate using the base and target currencies
      const exchangeRate = await fetchRealTimeExchangeRate(baseCurrency, targetCurrency);

      if (exchangeRate !== null) {
        // Auto-fill the exchange rate input field
        const exchangeRateInput = document.getElementById('exchangeRate');
        exchangeRateInput.value = exchangeRate.toFixed(4);

        // Populate the payment and receive account dropdowns for transfer type
        if (transactionType === 'transfer') {
          const paymentAccountSelect = document.getElementById('paymentAccount');
          const receiveAccountSelect = document.getElementById('receiveAccount');
          const exchangeRatePayInput = document.getElementById('exchangeRatePay');
          const exchangeRateReceiveInput = document.getElementById('exchangeRateReceive');

          // Clear existing options
          paymentAccountSelect.innerHTML = '';
          receiveAccountSelect.innerHTML = '';

          // Populate options based on user's wallet items
          walletItems.forEach(wallet => {
            const option = document.createElement('option');
            option.value = wallet.currency;
            option.text = wallet.currency;
            paymentAccountSelect.add(option.cloneNode(true));
            receiveAccountSelect.add(option);
          });

          // Auto-fill exchange rates for payment and receive accounts
          const selectedPaymentAccount = paymentAccountSelect.value;
          const selectedReceiveAccount = receiveAccountSelect.value;

          // Set the same exchange rate for payment and receive accounts
          exchangeRatePayInput.value = exchangeRate.toFixed(4);
          exchangeRateReceiveInput.value = exchangeRate.toFixed(4);
        }
      }
    } else {
      console.error(`Wallet not found for currency: ${baseCurrency}`);
    }
  } catch (error) {
    console.error('Error auto-filling exchange rates:', error);
  }
}




// Function to generate card elements for a specific section
function generateCardElements(sectionId, type, items) {
  const container = document.getElementById(sectionId);

  if (container) {
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      const cardElement = document.createElement('div');
      cardElement.classList.add('flex', 'items-center', 'mb-4');

      const iconClass = getIconClass(item.type);
      if (iconClass) {
        const iconElement = document.createElement('i');
        iconElement.className = iconClass;
        cardElement.appendChild(iconElement);
      } else {
        console.error(`Invalid iconClass for type: ${type}`);
      }

      const nameElement = document.createElement('p');
      nameElement.classList.add('text-sm', 'text-gray-600', 'dark:text-gray-900', 'mt-1', 'ml-2');
      nameElement.textContent = item.name;
      cardElement.appendChild(nameElement);

      const amountElement = document.createElement('p');
      amountElement.classList.add('ml-auto', 'text-sm', 'text-gray-600', 'dark:text-gray-900', 'mt-1');
      amountElement.textContent = `$${item.amount}`;
      cardElement.appendChild(amountElement);

      fragment.appendChild(cardElement);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  } else {
    console.error(`Container not found for sectionId: ${sectionId}`);
  }
}

// Function to display wallet data for each section
async function displayWalletData() {
  // Retrieve user data from database
  const userData = await getUserInfo();
  const walletItems = userData.walletItems || [];
  displayUserStocks();


  // Define sections with corresponding IDs and types
  const sections = [
    { id: 'cashSection', type: 'cash' },
    { id: 'cardsSection', type: 'card' }, 
    { id: 'onlinePaymentSection', type: 'payment' },
    { id: 'stocksSection', type: 'stock' },
    { id: 'rechargeCardsSection', type: 'recharge' },
    { id: 'loanSection', type: 'loan' },
  ];

  // Display cards for each section
  sections.forEach(section => {
    const items = filterAndLimitItems(walletItems, section.type);
    generateCardElements(section.id, section.type, items);
  });
}

// Function to fetch and update database on load
async function fetchDatabase() {
  await fetchAndUpdateLocalVariable();
  displayWalletData();

  const userData = await getUserInfo();
  // Check if username exists
  if (userData.username) {
    // Update the content of the element with the username
    const usernamePlaceholder = document.getElementById('usernamePlaceholder');
    if (usernamePlaceholder) {
      usernamePlaceholder.textContent = userData.username;
    }
  }
}

function handleButtonClick(buttonId) {
  const buttons = ['expensesBtn', 'incomeBtn', 'transferBtn'];
  const submitButton = document.getElementById('buttonSection');

  let incomeButton = document.getElementById('incomeBtn');
  let expensesButton = document.getElementById('expensesBtn');
  let transferButton = document.getElementById('transferBtn');
  let amountField = document.getElementById('amountField');
  let amountInput = document.getElementById('amount');
  let transferField = document.getElementById('transferFields');
  let transferHide = document.getElementById('transferHide');

  buttons.forEach((btn, index) => {
    const button = document.getElementById(btn);

    if (buttonId === btn) {
      getCurrentDateTime();
      autoFillExchangeRate();
      button.classList.remove('bg-gray-600', 'text-gray-200');
      button.classList.add('bg-green-100', 'text-black');
      switch (buttonId) {
        case 'expensesBtn':
          transferHide.classList.remove('hidden');
          transferField.classList.add('hidden');
          amountField.classList.remove('text-green-300', 'text-blue-400');
          amountInput.classList.remove('focus:border-green-300', 'text-green-400', 'focus:border-blue-300', 'text-blue-400');
          amountField.classList.add('text-red-300');
          amountInput.classList.add('focus:border-red-400', 'text-red-400');
          expensesButton.classList.remove('hover:bg-red-600');
          expensesButton.classList.add('hover:cursor-default');
          transferButton.classList.remove('hover:cursor-default');
          transferButton.classList.add('hover:bg-blue-600');
          incomeButton.classList.remove('hover:cursor-default');
          incomeButton.classList.add('hover:bg-green-600');
          submitButton.classList.remove('hover:bg-blue-400');
          submitButton.classList.remove('hover:bg-green-400');
          submitButton.classList.add('hover:bg-red-400');
          break;
        case 'incomeBtn':
          transferHide.classList.remove('hidden');
          transferField.classList.add('hidden');
          amountField.classList.remove('text-red-300', 'text-blue-400');
          amountInput.classList.remove('focus:border-red-400', 'text-red-400', 'focus:border-blue-300', 'text-blue-400');
          amountField.classList.add('text-green-300');
          amountInput.classList.add('focus:border-green-300', 'text-green-400');
          incomeButton.classList.remove('hover:bg-green-600');
          incomeButton.classList.add('hover:cursor-default');
          transferButton.classList.add('hover:bg-blue-600');
          transferButton.classList.remove('hover:cursor-default');
          expensesButton.classList.add('hover:bg-red-600');
          expensesButton.classList.remove('hover:cursor-default');
          submitButton.classList.remove('hover:bg-blue-400');
          submitButton.classList.remove('hover:bg-red-400');
          submitButton.classList.add('hover:bg-green-400');
          break;
        case 'transferBtn':
          autoFillExchangeRate();
          transferHide.classList.add('hidden');
          transferField.classList.remove('hidden');
          amountField.classList.remove('text-red-300', 'text-green-400');
          amountInput.classList.remove('focus:border-red-400', 'text-red-400', 'focus:border-green-300', 'text-green-400');
          amountField.classList.add('text-blue-400');
          amountInput.classList.add('focus:border-blue-300', 'text-blue-400');
          transferButton.classList.remove('hover:bg-blue-600');
          transferButton.classList.add('hover:cursor-default');
          incomeButton.classList.add('hover:bg-green-600');
          incomeButton.classList.remove('hover:cursor-default');
          expensesButton.classList.add('hover:bg-red-600');
          expensesButton.classList.remove('hover:cursor-default');
          submitButton.classList.remove('hover:bg-red-400');
          submitButton.classList.remove('hover:bg-green-400');
          submitButton.classList.add('hover:bg-blue-400');
          break;
        default:
          submitButton.style.backgroundColor = '';
          break;
      }
    } else {
      button.classList.remove('bg-green-100', 'text-black');
      button.classList.add('bg-gray-600', 'text-gray-200');
    }
  });
}



function redirectToAccount() {
  sessionStorage.setItem('activeSection', 'wallet-btn');

  // Redirect to the account page
  window.location.href = 'account.html';

}

// Function to get the selected type
function getSelectedType() {
  const expensesBtn = document.getElementById('expensesBtn');
  const incomeBtn = document.getElementById('incomeBtn');
  const transferBtn = document.getElementById('transferBtn');

  if (expensesBtn && expensesBtn.classList.contains('bg-green-100')) {
    return 'expenses';
  } else if (incomeBtn && incomeBtn.classList.contains('bg-green-100')) {
    return 'income';
  } else if (transferBtn && transferBtn.classList.contains('bg-green-100')) {
    return 'transfer';
  }

  return '';
}

// Function to generate the account dropdown
async function populateAccountDropdown(userAccount, dropdownId) {
  const accountDropdown = document.getElementById(dropdownId);
  if (accountDropdown) {
    accountDropdown.innerHTML = ''; // Clear existing options
    const userData = await getUserInfo();
    const storedAccounts = userData.walletItems || [];

    storedAccounts.forEach(account => {
      if (account.name) {
        const option = document.createElement('option');
        option.value = account.name;
        option.textContent = account.name;
        accountDropdown.appendChild(option);
      }
    });
  }
}

// Default the current date and time
function getCurrentDateTime() {
  const singaporeTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));

  // Format the date to the expected format (YYYY-MM-DDTHH:mm)
  const year = singaporeTime.getFullYear();
  const month = (singaporeTime.getMonth() + 1).toString().padStart(2, '0');
  const day = singaporeTime.getDate().toString().padStart(2, '0');
  const hours = singaporeTime.getHours().toString().padStart(2, '0');
  const minutes = singaporeTime.getMinutes().toString().padStart(2, '0');
  
  const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;


  const transactionDateTime = document.getElementById("transactionDateTime");

  if (transactionDateTime) {
    transactionDateTime.value = currentDateTime;
  }
}

// Function to handle the submit button
async function handleTransactionSubmit(event) {
  try {
    event.preventDefault();
    const type = getSelectedType();
    const account = document.getElementById('account').value;
    const beforeAmount = document.getElementById('amount').value;
    const currency = document.getElementById('currency').value;
    const exchangeRate = document.getElementById('exchangeRate')
    const notes = document.getElementById('notes').value;
    const transactionDateTime = document.getElementById('transactionDateTime').value;
    const amount = beforeAmount*exchangeRate;
    const receiveCurrency = document.getElementById('exchangeRateReceive').value;
    const amountInReceiveCurrency = amount / receiveCurrency;
    
    // Get additional fields based on the transaction type
    let additionalFields = {};
    if (type === 'transfer') {
      additionalFields = {
        amountInReceiveCurrency,
        exchangeRate: document.getElementById('exchangeRate').value,
        paymentAccount: document.getElementById('paymentAccount').value,
        exchangeRatePay: document.getElementById('exchangeRatePay').value,
        receiveAccount: document.getElementById('receiveAccount').value,
      };
    }

    

    // Prepare the data to be sent to the server
    const transactionData = {
      account,
      type,
      amount,
      currency,
      notes,
      transactionDateTime,
      ...additionalFields,
    };

    // Get the userId from localStorage
    const userData = await getUserData();
    const userId = userData._id;

    // Make a POST request to the server to handle the transaction
    const response = await fetch(`http://localhost:8082/submitTransaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ...transactionData }),
    });

    const result = await response.json();

    if (response.ok) {

      if (dailyExpensesChart) {
        dailyExpensesChart.destroy();
      }
      // Transaction added successfully, update the local storage and display wallet data
      await fetchAndUpdateLocalVariable();
      displayWalletData();
      populateTransactionHistory(); 
      createMonthlyExpensesChart();
      document.getElementById('addTransactionMenu').reset();
      document.getElementById('addMenu').classList.add('hidden');
    } else {
      const errorMessageElement = document.getElementById('errorMessage');

      if (response.status === 400 && result.error === 'Payment and receive accounts must be different.') {
        errorMessageElement.textContent = 'Payment and receive accounts must be different.';
      } else {
        errorMessageElement.textContent = `Error: ${result.error || 'Unknown error'}`;
      }
      errorMessageElement.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error handling transaction submit:', error);
  }
}

// Function to retrieve transaction history from varibale
async function getTransactionHistoryFromDatabase() {
  try {
    const userData = await getUserInfo();

    const transactionHistory = userData.transactionHistory || [];

    if (Array.isArray(transactionHistory)) {
      return transactionHistory;
    } else if (typeof transactionHistory === 'string') {
      // If transactionHistory is stored as a JSON string, parse it
      const parsedHistory = JSON.parse(transactionHistory);
      if (Array.isArray(parsedHistory)) {
        return parsedHistory;
      }
    }

    return [];
  } catch (error) {
    alert('Error retrieving transaction history:', error);
    return [];
  }
}

function createAccountElement(color, account, amount, transaction) {
  const accountElement = document.createElement('div');
  accountElement.classList.add('font-semibold', 'flex', 'justify-between');

  const amountWithSign = transaction.type === 'expenses' ? `-$${amount}` : (transaction.type === 'income' ? `+$${amount}` : `$${amount}`);

  if (transaction.type === 'expenses' || transaction.type === 'income') {
    const indicatorColorClass = transaction.type === 'expenses' ? 'text-red-500 text-2xl' : 'text-green-500 text-2xl';
    accountElement.innerHTML = `<div class="flex items-center"><span class="${indicatorColorClass}">&#8226;</span><span class="ml-2">${account}</span></div><span class="mr-4">${amountWithSign}</span>`;
  } else if (transaction.type === 'transfer') {
    const paymentAccount = transaction.paymentAccount || 'N/A';
    const receiveAccount = transaction.receiveAccount || 'N/A';
    const indicatorColorClass = 'text-blue-500 text-2xl';
    accountElement.innerHTML = `<div class="flex items-center"><span class="${indicatorColorClass}">&#8226;</span><span class="ml-2"><span class="text-red-600">${paymentAccount}</span> to <span class="text-green-500">${receiveAccount}</span></span></div><span class="mr-4">${amountWithSign}</span>`;
  } else {
    // Handle other transaction types
  }

  return accountElement;
}

function createNotesElement(notes) {
  const notesElement = document.createElement('div');
  notesElement.textContent = notes;
  return notesElement;
}

function createTimeElement(formattedTime) {
  const timeElement = document.createElement('div');
  timeElement.classList.add('text-sm', 'text-gray-500');
  timeElement.textContent = formattedTime;
  return timeElement;
}

async function populateTransactionHistory() {
  try {
    const transactionHistory = await getTransactionHistoryFromDatabase();
    const transactionHistoryContainer = document.getElementById('transactionHistory');

    // Clear previous content
    transactionHistoryContainer.innerHTML = '';

    // Ensure transactionHistory is an array before trying to iterate
    if (!Array.isArray(transactionHistory)) {
      console.error('Transaction history is not an array:', transactionHistory);
      return;
    }

    // Group transactions by date
    const transactionsByDate = new Map();
    transactionHistory.forEach(transaction => {
      const transactionDate = new Date(transaction.transactionDateTime);
      const formattedDate = transactionDate.toLocaleDateString('en-US');

      if (!transactionsByDate.has(formattedDate)) {
        transactionsByDate.set(formattedDate, []);
      }

      transactionsByDate.get(formattedDate).push(transaction);
    });

    // Sort dates in reverse order (newest to oldest)
    const sortedDates = Array.from(transactionsByDate.keys()).sort((a, b) => new Date(b) - new Date(a));

    // Iterate over sorted dates and create HTML elements
    sortedDates.forEach(formattedDate => {
      // Create date element
      const dateElement = document.createElement('div');
      dateElement.classList.add('font-bold', 'text-lg');
      dateElement.textContent = formattedDate;
      transactionHistoryContainer.appendChild(dateElement);

      // Sort transactions within each date group in reverse order (newest to oldest)
      const transactions = transactionsByDate.get(formattedDate).sort((a, b) => new Date(b.transactionDateTime) - new Date(a.transactionDateTime));


      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.transactionDateTime);
        const formattedTime = transactionDate.toLocaleTimeString('en-US');

        // Create transaction details based on type
        const transactionDetails = document.createElement('div');
        transactionDetails.classList.add('ml-4');

        if (transaction.type === 'expenses' || transaction.type === 'income') {
          const accountElement = createAccountElement(
            transaction.type === 'expenses' ? 'red' : 'green',
            transaction.account,
            transaction.amount,
            transaction
          );
          const timeElement = createTimeElement(formattedTime);
          const notesElement = createNotesElement(transaction.notes);

          transactionDetails.appendChild(accountElement);
          transactionDetails.appendChild(timeElement);
          transactionDetails.appendChild(notesElement);
        } else if (transaction.type === 'transfer') {
          const accountElement = createAccountElement('light-blue', transaction.account, transaction.amount, transaction);
          const timeElement = createTimeElement(formattedTime);
          const notesElement = createNotesElement(transaction.notes);

          transactionDetails.appendChild(accountElement);
          transactionDetails.appendChild(timeElement);
          transactionDetails.appendChild(notesElement);
        } else {
          // Handle other transaction types
        }

        transactionHistoryContainer.appendChild(transactionDetails);

        // Add additional spacing between transactions
        const spacingElement = document.createElement('div');
        spacingElement.style.height = '10px'; // Adjust the height as needed
        transactionHistoryContainer.appendChild(spacingElement);
      });
    });
  } catch (error) {
    console.error('Error populating transaction history:', error);
  }
}


// Function to create the daily expenses line chart
async function createMonthlyExpensesChart() {
  try {


    // Get the user's transaction history
    const transactionHistory = await getTransactionHistoryFromDatabase();

    // Check if transaction history is available and is an array
    if (!Array.isArray(transactionHistory)) {
      console.log('No valid transaction history available to create chart.');
      return;
    }

    // Filter transactions for the current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed, so we add 1
    const currentYear = currentDate.getFullYear();

    const filteredTransactions = transactionHistory.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDateTime);
      return (
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    // Get the last day of the current month
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Initialize arrays for expenses, income, and net flow
    const dailyExpensesData = new Array(lastDayOfMonth).fill(0);
    const dailyIncomeData = new Array(lastDayOfMonth).fill(0);

    filteredTransactions.forEach(transaction => {
      const transactionDate = new Date(transaction.transactionDateTime);
      const dayOfMonth = transactionDate.getDate() - 1; // Adjust to 0-indexed day

      // Add expenses (negative amount) and income (positive amount)
      if (transaction.type === 'expenses') {
        dailyExpensesData[dayOfMonth] += parseFloat(transaction.amount);
      } else if (transaction.type === 'income') {
        dailyIncomeData[dayOfMonth] += parseFloat(transaction.amount);
      }
    });

    // Prepare labels for the chart (in the format "MM/DD")
    const labels = Array.from({ length: lastDayOfMonth }, (_, index) => {
      const day = index + 1;
      return `${currentMonth.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    });
    
    // Get the canvas element
    const monthlyExpensesChartCanvas = document.getElementById('dailyExpensesChart').getContext('2d');

    // Create a line chart for daily expenses and income
    dailyExpensesChart = new Chart(monthlyExpensesChartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily Expenses',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            data: dailyExpensesData,
          },
          {
            label: 'Daily Income',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            data: dailyIncomeData,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const expenses = dailyExpensesData[context.dataIndex];
                const income = dailyIncomeData[context.dataIndex];
                const datasetLabel = context.dataset.label;
                const value = context.parsed.y;
                const netFlow = income - expenses;

                if (datasetLabel === 'Daily Expenses') {
                  return `Expenses: ${value}\n Net Flow: ${netFlow}`;
                } else if (datasetLabel === 'Daily Income') {
                  return `Income: ${value}\n  Net Flow: ${netFlow}`;
                }
                return '';
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error('Error creating monthly expenses chart:', error);
  }
}


async function getUserStocks() {
  const userData = await getUserInfo();

  return userData.walletItems || [];
}

// Assuming fetchRealtimeStockData is a function that returns real-time stock data
async function fetchRealtimeStockData(apiKey, stockSymbols) {
  const apiUrl = 'https://finnhub.io/api/v1/quote';
  const stockData = {};

  try {
    for (const symbol of stockSymbols) {
      const response = await fetch(`${apiUrl}?symbol=${symbol}&token=${apiKey}`);
      const data = await response.json();

      // Check if the response contains valid data
      if (data && !data.error) {
        stockData[symbol] = data;
      } else {
        console.error(`Error fetching real-time data for ${symbol}:`, data.error);
      }
    }

    return stockData;
  } catch (error) {
    console.error('Error fetching real-time stock data:', error);
    throw error; // Propagate the error
  }
}

async function displayUserStocks() {
  const userStocks = await getUserStocks();
  const stockElements = userStocks.filter(element => element.type === 'stock');


  if (!Array.isArray(stockElements) || stockElements.length === 0) {
    const stocksContainer = document.getElementById('stocks-container');

    if (stocksContainer) {
      stocksContainer.innerHTML = '';

      const noStocksMessage = document.createElement('p');
      noStocksMessage.textContent = 'You don\'t have any stocks. Add a stock now to see your data.';
      stocksContainer.appendChild(noStocksMessage);
    }

    return;
  }

  const apiKey = 'cmu8s39r01qsv99m4llgcmu8s39r01qsv99m4lm0';

  try {
    const stockSymbols = stockElements.map(stock => stock.name);
    const realtimePrices = await fetchRealtimeStockData(apiKey, stockSymbols);

    const stocksContainer = document.getElementById('stocks-container');

    if (stocksContainer) {
      stocksContainer.innerHTML = '';

      stockElements.forEach(stock => {
        const stockElement = document.createElement('div');
        stockElement.classList.add('flex', 'items-center', 'mb-4');

        const stockNameElement = document.createElement('p');
        stockNameElement.classList.add('ml-2', 'text-gray-800', 'font-semibold');
        stockNameElement.textContent = stock.name;
        stockElement.appendChild(stockNameElement);

        const stockPriceElement = document.createElement('p');
        stockPriceElement.classList.add('ml-2', 'text-green-500');
        const realtimePrice = realtimePrices[stock.name]?.c || 'N/A';
        stockPriceElement.textContent = `$${realtimePrice}`;
        stockElement.appendChild(stockPriceElement);

        stocksContainer.appendChild(stockElement);
      });
    }
  } catch (error) {
    console.error('Error in displayUserStocks:', error);
  }
}


// Handle wallet box click
const cardsBox = document.querySelector('#cardsbox');
if (cardsBox) {
  cardsBox.addEventListener('click', redirectToAccount);
}

// Handle the add button
const menuButton = document.getElementById('menuButton');
const menu = document.getElementById('addMenu');

if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    getCurrentDateTime();
    autoFillExchangeRate();
    menu.classList.remove('hidden');
  });
}


// Handle submit button
const submitButton = document.getElementById('buttonSection');
if (submitButton) {
  submitButton.addEventListener('click', handleTransactionSubmit);
}

// Handle the close button
const closeButton = document.getElementById('closeAddModalButton');
const modal = document.getElementById('addMenu'); 
const amountInput = document.getElementById('account')

if (closeButton && modal) {
  closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    amountInput.removeAttribute('required'); 
    modal.classList.add('hidden'); 
  });
}


window.addEventListener('load', () => {
  fetchAndUpdateLocalVariable();
  fetchDatabase();
  populateAccountDropdown();
  populateTransactionHistory();
  createMonthlyExpensesChart();
});


// Call the function to populate each dropdown
populateAccountDropdown('account', 'account');
populateAccountDropdown('paymentAccount', 'paymentAccount');
populateAccountDropdown('receiveAccount', 'receiveAccount');
