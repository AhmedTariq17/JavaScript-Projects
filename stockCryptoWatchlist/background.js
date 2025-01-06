// Listener when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("Crypto & Stock Tracker installed");
});

// Function to fetch the current price for a given symbol
async function fetchPriceForSymbol(symbol) {
  // API call to get the price - you can modify this to use different APIs
  const cryptoAPI = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`;
  const stockAPI = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=YOUR_API_KEY`;

  // Determine if it's a stock or crypto based on the symbol input
  let price = 0;
  try {
    if (symbol === symbol.toUpperCase() && symbol.length <= 5) {
      // Stock price fetch
      const stockResponse = await fetch(stockAPI);
      const stockData = await stockResponse.json();
      price = stockData["Time Series (5min)"] ? Object.values(stockData["Time Series (5min)"])[0]["1. open"] : 'N/A';
    } else {
      // Crypto price fetch
      const cryptoResponse = await fetch(cryptoAPI);
      const cryptoData = await cryptoResponse.json();
      price = cryptoData[symbol].usd;
    }
    return parseFloat(price);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

// Listener for the alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(`Checking price for ${alarm.name}`);

  // Get the target price from storage
  chrome.storage.local.get(alarm.name, async (data) => {
    const targetPrice = parseFloat(data[alarm.name]);

    // Fetch the current price for the symbol
    const currentPrice = await fetchPriceForSymbol(alarm.name);

    if (currentPrice !== null && currentPrice >= targetPrice) {
      // Send notification if current price is greater than or equal to the target
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.png',
        title: 'Price Alert',
        message: `${alarm.name} has reached your target price of $${targetPrice}`,
      });
    } else if (currentPrice === null) {
      console.error(`Failed to fetch current price for ${alarm.name}`);
    } else {
      console.log(`Current price (${currentPrice}) is less than target price (${targetPrice})`);
    }
  });
});
