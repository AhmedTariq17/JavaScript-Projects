// Inject dark mode styles
const darkModeStyles = `
  html, body {
    background-color: #121212 !important;
    color: #e0e0e0 !important;
  }
  img, video {
    opacity: 0.8;
  }
  a {
    color: #bb86fc !important;
  }
  /* Invert other bright elements */
  * {
    background-color: #121212 !important;
    color: #e0e0e0 !important;
  }
`;

// Create a <style> element and inject CSS
const styleElement = document.createElement('style');
styleElement.innerText = darkModeStyles;
document.head.appendChild(styleElement);
