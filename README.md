# Niu Niu Calculator

A Progressive Web App (PWA) for calculating the best **Niu Niu (牛牛)** poker hand with advanced features.

## 🚀 Live Demo

Deploy this app to: **https://ehzuy.github.io/Gnau/**

## 📋 Features

### Smart Hand Evaluation
- **Double Pair Detection & Prioritization**: Automatically identifies and prioritizes hands with double (matching) pairs for 2× earning potential
- **3 ↔ 6 Swap Flexibility**: Treats 3s and 6s as interchangeable values, generating all possible variants to find the optimal hand configuration
- **Niu Niu Calculation**: Correctly evaluates traditional Niu Niu poker hands and assigns scoring

### User Experience
- Responsive web interface for easy hand calculation
- Offline-capable Progressive Web App
- Works on mobile and desktop devices
- Fast, client-side computation with Python backend logic

## 🎮 How It Works

1. Input your 5-card poker hand
2. The calculator generates all possible variants with the 3↔6 swap rule
3. Evaluates each variant to find the best hand configuration
4. Displays the optimal hand with:
   - Whether it's a valid Niu Niu
   - The best scoring combination
   - Double pair status (if applicable)
   - Final score and rank

## 📦 Project Structure

```
ngao/
├── main.py          # Core Niu Niu hand evaluation logic
├── app.js           # Progressive Web App client logic
├── index.html       # Main application interface
├── style.css        # Application styling
├── manifest.json    # PWA configuration
├── sw.js            # Service Worker for offline support
└── pwa/             # PWA assets
```

## 🔧 Technology Stack

- **Backend Logic**: Python (hand evaluation algorithm)
- **Frontend**: HTML5, CSS3, JavaScript
- **Architecture**: Progressive Web App (PWA)
- **Deployment**: GitHub Pages

## 📝 Key Algorithm Features

- **Variant Generation**: Automatically generates all 3↔6 combinations
- **Best Hand Selection**: Evaluates all variants to find the mathematically best outcome
- **Double Pair Recognition**: Special handling for matching pairs to maximize earnings
- **Efficient Evaluation**: Optimized combination checking for fast results

## 🌐 Deployment

To deploy to GitHub Pages at `https://ehzuy.github.io/Gnau/`:

1. Push your code to the `gh-pages` branch, or
2. Configure GitHub Actions to build and deploy automatically
3. Enable GitHub Pages in your repository settings

## 📲 Install as App

Since this is a PWA, you can:
- Add to home screen on mobile devices
- Install as a standalone app on desktops
- Use offline once loaded

---

**Niu Niu (牛牛)** is a traditional Chinese poker game. This calculator helps optimize hand evaluation with intelligent pair detection and flexible number swapping.
