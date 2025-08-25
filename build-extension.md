# Chrome Extension Build Instructions

## Building the Extension

1. **Build the extension:**
   ```bash
   npm run build:extension
   ```
   or
   ```bash
   vite build --config vite.config.extension.ts
   ```

2. **The built extension will be in the `dist-extension` folder**

## Installing the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist-extension` folder
5. The extension will be loaded and ready to use

## Using the Extension

1. Click the extension icon in Chrome's toolbar
2. The HS Code Predictor will open in a side panel
3. Enter product details to get AI-powered HS code predictions

## Publishing to Chrome Web Store

1. **Prepare for publishing:**
   - Ensure all icons are properly sized and included
   - Test the extension thoroughly
   - Review the manifest.json for accuracy

2. **Create a Developer account:**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Pay the one-time $5 registration fee

3. **Upload your extension:**
   - Zip the `dist-extension` folder
   - Upload to the Developer Dashboard
   - Fill in store listing details
   - Submit for review

## Extension Features

- **Side Panel Interface:** Clean, focused UI for HS code analysis
- **AI-Powered Predictions:** Uses advanced AI for accurate classifications
- **Real-time Analysis:** Instant results as you type
- **Compliance Ready:** Built for international trade regulations

## Development

For development, use:
```bash
npm run dev:extension
```

This will watch for changes and rebuild automatically.