# MCPhony - Production Voice Translation Platform

A futuristic voice chat application with real-time translation and text-to-speech capabilities powered by ElevenLabs and DeepL APIs.

## Features

- 🎤 Real-time voice recording and analysis
- 🌍 Multi-language translation with DeepL
- 🔊 High-quality text-to-speech with ElevenLabs
- 📱 Mobile-optimized interface
- 🔗 Friend connection system
- ⚡ MCP integration for enhanced performance
- 🎨 Futuristic Matrix-style UI

## Setup Instructions

### 1. API Keys Configuration

Replace the placeholder API keys in `config.js`:

```javascript
window.MCPhonyConfig = {
    ELEVENLABS_API_KEY: 'your_elevenlabs_api_key_here',
    DEEPL_API_KEY: 'your_deepl_api_key_here',
    // ... rest of config
};
```

### 2. Getting API Keys

**ElevenLabs API Key:**
1. Go to [ElevenLabs](https://elevenlabs.io)
2. Create an account or sign in
3. Navigate to Profile Settings → API Keys
4. Copy your API key

**DeepL API Key:**
1. Go to [DeepL API](https://www.deepl.com/pro-api)
2. Create a free or pro account
3. Go to your account settings
4. Copy your authentication key

### 3. Configuration Options

#### ElevenLabs Settings:
- `DEFAULT_VOICE_ID`: Default voice (Rachel: `21m00Tcm4TlvDq8ikWAM`)
- `VOICE_STABILITY`: Voice stability (0.0-1.0)
- `VOICE_SIMILARITY`: Voice similarity boost (0.0-1.0)
- `VOICE_STYLE`: Voice style exaggeration (0.0-1.0)

#### DeepL Settings:
- `BASE_URL`: Use `https://api-free.deepl.com/v2` for free tier
- `SUPPORTED_LANGUAGES`: Language code mappings

### 4. MCP Integration (Optional)

For enhanced performance, MCPhony supports MCP servers:

1. **Enable MCP**: Set `MCP.ENABLED: true` in config
2. **Start MCP Servers** (if available):
   ```bash
   # ElevenLabs MCP Server (port 3002)
   # DeepL MCP Server (port 3003)
   ```

### 5. Running the Application

#### Development:
```bash
# Navigate to project directory
cd futuristic-voice-chat

# Start local server
python -m http.server 8000
# OR
npx serve .
```

Access at:
- Desktop: `http://localhost:8000/index.html`
- Mobile: `http://localhost:8000/mobile-index.html`

#### Production Deployment:

**Option 1: Netlify**
1. Drag and drop the project folder to [netlify.com](https://netlify.com)
2. Configure environment variables for API keys (recommended)

**Option 2: Vercel**
1. Connect your GitHub repository to [vercel.com](https://vercel.com)
2. Add API keys as environment variables

**Option 3: GitHub Pages**
1. Enable Pages in repository settings
2. Note: API keys will be visible in client-side code

## Usage

### Basic Voice Translation:
1. Click/hold the microphone button
2. Speak your message
3. Select target language
4. Click "Play" to hear translation

### Friend Connection:
1. Share your Voice ID with a friend
2. Enter friend's Voice ID
3. Click "Connect"
4. Send voice messages back and forth

### Voice Analysis:
- Real-time language detection
- Gender and pitch analysis
- Confidence scoring

## API Limits & Costs

### ElevenLabs:
- **Free Tier**: 10,000 characters/month
- **Starter**: $5/month - 30,000 characters
- **Creator**: $22/month - 100,000 characters

### DeepL:
- **Free Tier**: 500,000 characters/month
- **Pro**: Starting at $6.99/month

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.5+)
- Mobile browsers: Optimized interface

## Security Notes

⚠️ **Important**: API keys are visible in client-side code. For production:

1. Use environment variables
2. Implement server-side proxy
3. Add rate limiting
4. Consider API key rotation

## Troubleshooting

### Common Issues:

**Microphone not working:**
- Ensure HTTPS (required for microphone access)
- Check browser permissions
- Test with different browsers

**API Errors:**
- Verify API keys are correct
- Check API usage limits
- Ensure proper CORS configuration

**MCP Connection Issues:**
- Verify MCP servers are running
- Check WebSocket connections
- Review console logs for errors

## Development

### File Structure:
```
futuristic-voice-chat/
├── index.html              # Desktop interface
├── mobile-index.html       # Mobile interface
├── config.js               # Configuration & API keys
├── elevenlabs-service.js   # ElevenLabs API integration
├── deepl-service.js        # DeepL API integration
├── mcp-integration.js      # MCP server connections
├── voice-analyzer.js       # Voice analysis utilities
├── translation-service.js  # Translation logic
├── voice-chat.js          # Main application logic
├── voice-mcp-client.js    # MCP client utilities
├── matrix-effect.js       # Visual effects
├── styles.css             # Desktop styles
├── mobile-styles.css      # Mobile styles
└── README.md              # This file
```

### Contributing:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review console logs for errors
3. Verify API configurations
4. Test with minimal examples

---

**MCPhony** - Bringing the future of voice communication to today! 🚀
