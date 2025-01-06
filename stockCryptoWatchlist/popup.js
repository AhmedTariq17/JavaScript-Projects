// OpenAI API key (replace this with your actual API key)
// Use the OpenAI key from config.js
const OPENAI_API_KEY = API_KEYS.OPENAI;

// Get elements from the popup.html
const watchlist = document.getElementById('watchlist');
const addWatchlistBtn = document.getElementById('add-watchlist-btn');
const watchlistSymbol = document.getElementById('watchlist-symbol');
const newsList = document.getElementById('news-list');
const alertBtn = document.getElementById('set-alert-btn');
const themeToggleIcon = document.getElementById('theme-toggle-icon'); // Icon element
const errorMessage = document.getElementById('error-message'); // Error message element
const body = document.body;
const chartContainer = document.getElementById('chart-container');
const loadingIndicator = document.getElementById('loading-indicator'); // Loading spinner
const suggestionsContainer = document.getElementById('suggestions-container'); // Suggestions dropdown container

// ChatGPT elements for the AI assistant
const askAiBtn = document.getElementById('ask-ai-btn');
const aiQuestionInput = document.getElementById('ai-question');
const aiResponseContainer = document.getElementById('ai-response');

// Track the currently displayed symbol for chart re-rendering
let currentSymbol = '';

// Debounce function to limit the number of API calls for suggestions
function debounce(func, delay) {
  let debounceTimer;
  return function (...args) {
    const context = this;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

// Initialize and load the watchlist from chrome storage
chrome.storage.local.get(['watchlist'], (data) => {
  const symbols = data.watchlist || [];
  renderWatchlist(symbols);
});

// Function to apply dark mode to elements
function applyDarkMode(isDark) {
  const allElements = document.querySelectorAll('.light, .dark');
  allElements.forEach(el => {
    if (isDark) {
      el.classList.remove('light');
      el.classList.add('dark');
    } else {
      el.classList.remove('dark');
      el.classList.add('light');
    }
  });

  // Update the toggle icon
  themeToggleIcon.textContent = isDark ? '🌙' : '☀️';

  // Re-render the current chart with the updated theme
  if (currentSymbol) {
    renderStockChart(currentSymbol);
  }
}

// Initialize theme and load previous state from chrome storage
chrome.storage.local.get('theme', (data) => {
  const theme = data.theme || 'light';
  applyDarkMode(theme === 'dark');
});

// Handle theme toggle by clicking the icon
themeToggleIcon.addEventListener('click', function() {
  const isDarkMode = body.classList.contains('dark');
  applyDarkMode(!isDarkMode);
  chrome.storage.local.set({ theme: !isDarkMode ? 'dark' : 'light' });
});

// Show and hide loading indicator
function showLoading() {
  loadingIndicator.classList.remove('hidden');
}

function hideLoading() {
  loadingIndicator.classList.add('hidden');
}

// Function to add symbol to watchlist instantly when the user knows the symbol
function addSymbolToWatchlist(symbol) {
  chrome.storage.local.get('watchlist', (data) => {
    const symbols = data.watchlist || [];
    if (!symbols.includes(symbol)) {
      symbols.push(symbol);
      chrome.storage.local.set({ watchlist: symbols }, () => {
        renderWatchlist(symbols);
        watchlistSymbol.value = ''; // Clear input
        errorMessage.classList.add('hidden'); // Hide error message
      });
    } else {
      errorMessage.textContent = 'Symbol already in the watchlist!';
      errorMessage.classList.remove('hidden');
    }
  });
}

// Event listener for adding symbol immediately when pressing Enter or clicking the button
addWatchlistBtn.addEventListener('click', () => {
  const symbol = watchlistSymbol.value.toUpperCase();
  if (symbol) {
    addSymbolToWatchlist(symbol);
  } else {
    errorMessage.textContent = 'Please enter a valid symbol.';
    errorMessage.classList.remove('hidden');
  }
});

// Add symbol to watchlist when pressing 'Enter' in the input field
watchlistSymbol.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const symbol = watchlistSymbol.value.toUpperCase();
    if (symbol) {
      addSymbolToWatchlist(symbol);
    } else {
      errorMessage.textContent = 'Please enter a valid symbol.';
      errorMessage.classList.remove('hidden');
    }
  }
});

// Function to render the watchlist
function renderWatchlist(symbols) {
  watchlist.innerHTML = ''; // Clear current watchlist
  symbols.forEach(symbol => {
    const listItem = document.createElement('li');
    listItem.className = `list-group-item ${body.classList.contains('dark') ? 'dark' : 'light'}`;
    
    // Create the symbol text element
    const symbolText = document.createElement('span');
    symbolText.textContent = symbol;
    symbolText.className = 'symbol-text';

    // Create the remove button element
    const removeBtn = document.createElement('span');
    removeBtn.textContent = 'X';
    removeBtn.className = 'remove-btn';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent click from triggering chart display
      removeSymbolFromWatchlist(symbol); // Function to remove symbol from watchlist
    });

    // Append the symbol text and remove button to the list item
    listItem.appendChild(symbolText);
    listItem.appendChild(removeBtn);

    // Click event to render the chart for the selected symbol
    listItem.addEventListener('click', () => {
      currentSymbol = symbol; // Set the current symbol for future re-renders
      renderStockChart(symbol);
    });

    watchlist.appendChild(listItem);
  });
}

// Function to remove symbol from watchlist
function removeSymbolFromWatchlist(symbol) {
  chrome.storage.local.get('watchlist', (data) => {
    let symbols = data.watchlist || [];
    symbols = symbols.filter(s => s !== symbol);
    chrome.storage.local.set({ watchlist: symbols }, () => {
      renderWatchlist(symbols);
    });
  });
}

// Function to render stock chart using TradingView
function renderStockChart(symbol) {
  showLoading(); // Show loading indicator while chart is loading
  const theme = body.classList.contains('dark') ? 'dark' : 'light';
  const iframe = document.createElement('iframe');
  iframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_5f73d&symbol=${symbol}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=MACD@tv-basicstudies%1FRSI@tv-basicstudies&hideideas=1&theme=${theme}`;
  iframe.width = "100%";
  iframe.height = "400px";
  iframe.style.border = 'none';
  chartContainer.innerHTML = ''; // Clear previous chart
  chartContainer.appendChild(iframe);
  hideLoading(); // Hide loading indicator after chart is loaded
}

// Fetch and display news with loading indicator
async function fetchNews() {
  showLoading(); // Show loading indicator
  const finnhubAPI = `https://finnhub.io/api/v1/news?category=general&token=${API_KEYS.FINNHUB}`;
  try {
    const response = await fetch(finnhubAPI);
    const data = await response.json();
    hideLoading(); // Hide loading indicator

    if (Array.isArray(data) && data.length > 0) {
      newsList.innerHTML = "";
      data.slice(0, 5).forEach(article => {
        const newsCard = document.createElement('div');
        newsCard.classList.add('news-card', body.classList.contains('dark') ? 'dark' : 'light');

        const headline = document.createElement('a');
        headline.href = article.url;
        headline.target = '_blank';
        headline.textContent = article.headline;
        headline.classList.add('news-headline');

        newsCard.appendChild(headline);
        newsList.appendChild(newsCard);
      });
    } else {
      throw new Error("No articles found");
    }
  } catch (error) {
    hideLoading(); // Hide loading indicator
    newsList.innerHTML = `<div class="news-card ${body.classList.contains('dark') ? 'dark' : 'light'}">Error fetching news: ${error.message}</div>`;
  }
}

// Function to fetch symbol suggestions from Finnhub API based on user input
async function fetchSymbolSuggestions(query) {
  if (!query) {
    suggestionsContainer.style.display = 'none'; // Hide suggestions if query is empty
    return;
  }

  const url = `https://finnhub.io/api/v1/search?q=${query}&token=${API_KEYS.FINNHUB}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.result.length > 0) {
      // Dynamically sort suggestions based on relevance to the query
      const sortedSuggestions = sortSuggestionsDynamically(data.result, query);
      renderSuggestions(sortedSuggestions);  // Pass the sorted result to renderSuggestions
    } else {
      suggestionsContainer.style.display = 'none';  // Hide if no results
    }
  } catch (error) {
    console.error('Error fetching stock symbols:', error);
    suggestionsContainer.style.display = 'none';  // Hide if there's an error
  }
}

// Function to dynamically sort suggestions based on relevance
function sortSuggestionsDynamically(suggestions, query) {
  // Convert query to uppercase for case-insensitive matching
  const queryUpper = query.toUpperCase();

  return suggestions.sort((a, b) => {
    const symbolA = a.symbol.toUpperCase();
    const symbolB = b.symbol.toUpperCase();

    // Prioritize exact matches (symbol matches query exactly)
    if (symbolA === queryUpper && symbolB !== queryUpper) {
      return -1;
    }
    if (symbolB === queryUpper && symbolA !== queryUpper) {
      return 1;
    }

    // Prioritize symbols that start with the query
    const startsWithA = symbolA.startsWith(queryUpper);
    const startsWithB = symbolB.startsWith(queryUpper);

    if (startsWithA && !startsWithB) {
      return -1;
    }
    if (startsWithB && !startsWithA) {
      return 1;
    }

    // Prioritize symbols that contain the query (but not start with it)
    const containsA = symbolA.includes(queryUpper);
    const containsB = symbolB.includes(queryUpper);

    if (containsA && !containsB) {
      return -1;
    }
    if (containsB && !containsA) {
      return 1;
    }

    // If none of the above apply, sort alphabetically
    return symbolA.localeCompare(symbolB);
  });
}

// Function to render suggestions in the dropdown (limit to 5 for better performance)
function renderSuggestions(suggestions) {
  // Clear previous suggestions
  suggestionsContainer.innerHTML = '';

  // Limit suggestions to the top 5 results for better performance
  const limitedSuggestions = suggestions.slice(0, 5);

  // Create suggestion items based on the API response
  limitedSuggestions.forEach(item => {
    const suggestionItem = document.createElement('div');
    suggestionItem.classList.add('suggestion-item');
    suggestionItem.textContent = `${item.symbol} - ${item.description}`;  // Show symbol and description
    
    // Add click event to populate the input when clicking a suggestion
    suggestionItem.addEventListener('click', () => {
      watchlistSymbol.value = item.symbol;
      suggestionsContainer.style.display = 'none';  // Hide suggestions after selection
    });

    suggestionsContainer.appendChild(suggestionItem);
  });

  // Show the container if there are suggestions
  if (limitedSuggestions.length > 0) {
    suggestionsContainer.style.display = 'block';
  } else {
    suggestionsContainer.style.display = 'none';
  }
}

// Event listener for input on the watchlist symbol input with debouncing for suggestions
watchlistSymbol.addEventListener('input', debounce((e) => {
  const input = e.target.value.trim();

  // Fetch dynamic suggestions based on the user's input
  fetchSymbolSuggestions(input);
}, 300));  // Delay of 300ms to debounce

// Hide suggestions when the user clicks outside of the input or suggestions container
document.addEventListener('click', (e) => {
  if (!suggestionsContainer.contains(e.target) && e.target !== watchlistSymbol) {
    suggestionsContainer.style.display = 'none';
  }
});

// Function to send a question to ChatGPT and get a response
async function askChatGPT(question) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  
  // Prepare the API request payload
  const data = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant who answers questions about the stock market and cryptocurrencies.' },
      { role: 'user', content: question }
    ],
    max_tokens: 100,
    temperature: 0.7
  };

  try {
    // Send the request to the OpenAI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(data)
    });

    // Parse the response from ChatGPT
    const result = await response.json();

    // Log the result for debugging
    console.log('OpenAI API Response:', result);

    // Check if the response contains choices and return the content
    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content;
    } else {
      // Return a default message if no valid response is found
      return 'No valid response from AI. Please try again.';
    }
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    return 'Error getting response from AI.';
  }
}

// Event listener for Ask AI button
askAiBtn.addEventListener('click', async () => {
  const question = aiQuestionInput.value;
  
  if (!question) {
    aiResponseContainer.textContent = 'Please enter a question.';
    return;
  }

  // Display loading message
  aiResponseContainer.textContent = 'Thinking...';

  try {
    // Get AI response from ChatGPT
    const aiResponse = await askChatGPT(question);

    // Display AI response
    aiResponseContainer.textContent = aiResponse;
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    aiResponseContainer.textContent = 'Error getting response from AI.';
  }
});

// Run fetch functions on load
fetchNews();

