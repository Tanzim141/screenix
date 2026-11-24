#  SCREENIX — Movie & Series Discovery Web App

A responsive, API-driven movie and series discovery web application built with **HTML5, CSS3, and Vanilla JavaScript**.

##  Overview

**SCREENIX** lets users browse trending titles, search for movies, series, and anime in real time, filter by category, sort results, inspect full title details in a modal, and maintain a personal watchlist and recent search history saved in `localStorage`.

##  Features

* **Real-Time Search & API Integration:** Queries the OMDb REST API using `fetch()` and `async/await` with error handling and retry support.

* **Dynamic Hero Spotlight:** Showcases featured titles with high-resolution artwork, IMDb ratings, release year, genre, runtime, and trailer search links.

* **Category Filtering & Sorting:** Filter across tabs (`Home`, `Movies`, `Shows`, `Anime`) or quick explore pills (`All`, `Sci-Fi`, `Marvel`, `DC & Dark`, `Action`) and sort by release year or title (`map`, `filter`, `find`, `forEach`, `sort`).

* **Detailed Title Modal:** Displays full plot summary, cast, director, awards, ratings, and quick watchlist controls.

* **Persistent `localStorage`:** Automatically saves your **Watchlist** and **Recent Searches** across browser reloads.

* **Responsive Design & UI States:** Adapts smoothly from desktop to mobile (with a mobile bottom navigation dock) and includes skeleton loaders, empty states, and error states.

## 📁 Project Structure

```
screenix/
├── index.html      # Application layout and semantic markup
├── style.css       # Dark theme, glassmorphism, animations, and responsive rules
├── script.js       # OMDb API calls, DOM rendering, sorting/filtering, and localStorage
└── README.md       # Project documentation
```

##  Tech Stack

* **HTML5**
* **CSS3** (CSS Variables, Grid, Flexbox, Glassmorphism)
* **Vanilla JavaScript (ES6+)**
* **OMDb API** & **Browser `localStorage`**

##  How to Run Locally

1. Clone or download this repository and extract the folder.
2. Open `script.js` and add your active OMDb API key to `API_KEY` on line 1.
3. Open `index.html` in a browser or serve the folder using **VS Code Live Server**.
