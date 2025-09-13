/**
 * Documentation Data Loader
 *
 * This module handles loading and applying dynamically generated documentation data
 * to the website. It fetches version information and other data from the generated
 * JSON files and updates the DOM accordingly.
 *
 * Features:
 * - Graceful error handling for missing data files
 * - Fallback values when data fetch fails
 * - Progressive enhancement approach
 * - Console logging for debugging
 */

/**
 * Safely fetch JSON data with error handling
 * @param {string} url - The URL to fetch
 * @returns {Promise<any|null>} - The parsed JSON data or null on error
 */
async function safeFetch(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
      return null;
    }
    const data = await response.json();
    console.log(`✓ Loaded data from ${url}:`, data);
    return data;
  } catch (error) {
    console.warn(`Error fetching ${url}:`, error.message);
    return null;
  }
}

/**
 * Update DOM elements with version information
 * @param {string} version - The version string to display
 */
function updateVersionElements(version) {
  const versionElements = document.querySelectorAll('[data-version="cli"]');

  versionElements.forEach((element) => {
    if (element.tagName === 'SPAN' || element.tagName === 'CODE') {
      // For inline elements, update text content
      element.textContent = `@sammons/code-outline-cli@${version}`;
    } else {
      // For other elements, update inner text
      element.innerText = element.innerText.replace(
        /@sammons\/code-outline-cli(@[\d.]+)?/g,
        `@sammons/code-outline-cli@${version}`
      );
    }

    // Add visual indicator that version was loaded dynamically
    element.style.fontWeight = 'bold';
    element.title = `Version ${version} (loaded dynamically)`;
  });

  console.log(
    `✓ Updated ${versionElements.length} version elements with version ${version}`
  );
}

/**
 * Update install command elements with dynamic commands
 * @param {Object} commands - Install commands object
 */
function updateInstallCommands(commands) {
  if (!commands || typeof commands !== 'object') {
    return;
  }

  // Update npm command elements
  const npmElements = document.querySelectorAll('[data-install="npm"]');
  npmElements.forEach((element) => {
    if (commands.npm) {
      element.textContent = commands.npm;
      element.title = 'Install command (loaded dynamically)';
    }
  });

  // Update npx command elements
  const npxElements = document.querySelectorAll('[data-install="npx"]');
  npxElements.forEach((element) => {
    if (commands.npx) {
      element.textContent = commands.npx;
      element.title = 'Run command (loaded dynamically)';
    }
  });

  console.log(
    `✓ Updated install commands: npm=${npmElements.length}, npx=${npxElements.length} elements`
  );
}

/**
 * Update supported file types display
 * @param {string[]} supportedFiles - Array of supported file extensions
 */
function updateSupportedFiles(supportedFiles) {
  if (!Array.isArray(supportedFiles)) {
    return;
  }

  const supportedFilesElements = document.querySelectorAll(
    '[data-supported-files]'
  );
  supportedFilesElements.forEach((element) => {
    const format = element.getAttribute('data-supported-files');

    if (format === 'list') {
      element.textContent = supportedFiles.join(', ');
    } else if (format === 'extensions') {
      element.textContent = supportedFiles.map((ext) => `.${ext}`).join(', ');
    } else {
      element.textContent = supportedFiles.join(', ');
    }

    element.title = 'Supported file types (loaded dynamically)';
  });

  console.log(
    `✓ Updated ${supportedFilesElements.length} supported files elements`
  );
}

/**
 * Update output formats display
 * @param {string[]} formats - Array of supported output formats
 */
function updateOutputFormats(formats) {
  if (!Array.isArray(formats)) {
    return;
  }

  const formatElements = document.querySelectorAll('[data-output-formats]');
  formatElements.forEach((element) => {
    element.textContent = formats.join(', ');
    element.title = 'Output formats (loaded dynamically)';
  });

  console.log(`✓ Updated ${formatElements.length} output format elements`);
}

/**
 * Show loading indicators
 */
function showLoadingIndicators() {
  const loadingElements = document.querySelectorAll('[data-loading]');
  loadingElements.forEach((element) => {
    element.style.opacity = '0.6';
    element.style.cursor = 'wait';
  });
}

/**
 * Hide loading indicators
 */
function hideLoadingIndicators() {
  const loadingElements = document.querySelectorAll('[data-loading]');
  loadingElements.forEach((element) => {
    element.style.opacity = '1';
    element.style.cursor = 'default';
  });
}

/**
 * Main documentation loader function
 */
async function loadDocumentationData() {
  console.log('🔄 Loading documentation data...');
  showLoadingIndicators();

  try {
    // Determine the base URL for data files
    const baseURL =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
        ? '/data/' // Development
        : '/code-outline-cli/data/'; // Production (GitHub Pages)

    // Load all data files in parallel
    const [versionsData, installCommands, supportedFiles, outputFormats] =
      await Promise.all([
        safeFetch(`${baseURL}versions.json`),
        safeFetch(`${baseURL}install-commands.json`),
        safeFetch(`${baseURL}supported-files.json`),
        safeFetch(`${baseURL}formats.json`),
      ]);

    // Update DOM elements with loaded data
    if (versionsData && versionsData['@sammons/code-outline-cli']) {
      updateVersionElements(versionsData['@sammons/code-outline-cli']);
    } else {
      console.warn('⚠️  Version data not available, using fallback');
      updateVersionElements('latest');
    }

    if (installCommands) {
      updateInstallCommands(installCommands);
    }

    if (supportedFiles) {
      updateSupportedFiles(supportedFiles);
    }

    if (outputFormats) {
      updateOutputFormats(outputFormats);
    }

    console.log('✅ Documentation data loading completed');
  } catch (error) {
    console.error('❌ Error loading documentation data:', error);
    // Graceful fallback - update with default values
    updateVersionElements('latest');
  } finally {
    hideLoadingIndicators();
  }
}

/**
 * Initialize documentation loading when DOM is ready
 */
function initializeDocsLoader() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDocumentationData);
  } else {
    // DOM already loaded
    loadDocumentationData();
  }
}

// Start the loading process
initializeDocsLoader();

// Export functions for potential external use
export {
  loadDocumentationData,
  updateVersionElements,
  updateInstallCommands,
  updateSupportedFiles,
  updateOutputFormats,
};
