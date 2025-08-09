# osp-web

## Open Source Panopticon (OSP) - Truth Verification Platform

OSP is a production-ready truth verification platform that enables users to capture and share verifiable media evidence. By combining timestamped, geotagged media with a dynamic trust scoring system, OSP creates an immutable archive of real-world events for journalistic, civic, and accountability purposes.

---

## 🌐 Web Platform Overview

The OSP web interface provides public access to verified media content, enabling exploration, commentary, and accountability.

### Key Features
- **Public Content Viewing**: Browse media submissions without authentication
- **Interactive Search**:
  - Filter by geographic region (Leaflet.js + OpenStreetMap)
  - Date/time range selectors
- **User Actions (Authenticated)**:
  - View own uploaded content
  - Comment on public media
  - Delete personal content
- **Account Management**:
  - Sign in via Apple/Google (same as mobile)
  - Sign out
  - Delete account (creation only allowed on mobile)

### Technical Implementation
- **Frontend Framework**: Vanilla JS + HTML/CSS (lightweight, zero-bundler)
- **Interactive Map**: [Leaflet.js](https://leafletjs.com/) with OSM tiles
- **Storage**: Local hosting during development
- **Authentication**: JWT tokens from shared FastAPI backend
- **Responsive Design**: Mobile-friendly layout

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Poetry (dependency management)
- FastAPI backend running locally (`osp-backend`)
- Mobile app for account creation (iOS/Android)

### Local Development Setup

1. **Start the Backend Server**
   ```bash
   cd ../osp-backend
   poetry install
   alembic upgrade head
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Serve the Web Interface**
   ```bash
   cd osp-web
   python3 -m http.server 8001 --directory public
   ```

3. **Access the Platform**
   Open http://localhost:8001 in your browser

---

## 🔧 Web Architecture

```
osp-web/
├── public/
│   ├── index.html               # Main application shell
│   ├── style.css                # Responsive styling
│   └── favicon.ico
└── src/
    ├── map.js                   # Leaflet initialization & marker rendering
    └── search.js                # Filter logic (date range, coordinates)
```

### Core Functionality

#### `map.js`
- Initializes Leaflet map with OSM base layer
- Renders media markers from API data
- Handles click events to show media details
- Supports region-based filtering

#### `search.js`
- Manages date/time range inputs
- Validates and sanitizes coordinate filters
- Calls backend search endpoint `/api/v1/media/search`
- Updates map view based on results

#### Cross-Origin Requests
The frontend communicates with the backend at `http://localhost:8000` using:
- CORS headers (handled by FastAPI)
- JWT authentication for protected routes
- JSON request/response format

---

## 🔍 Search & Filter Capabilities

Users can explore media through:
- **Interactive Map**:
  - Pan and zoom to region of interest
  - Click markers to view media + trust score
- **Date/Time Filters**:
  - Select start/end datetime ranges
  - Filter media by capture time
- **Combined Queries**:
  - Search within geographic bounds AND time windows
  - Results update dynamically

---

## 🔐 Authentication Flow

Web uses same credentials as mobile apps:
1. Click "Sign In" → Redirect to Apple/Google OAuth
2. After successful authentication:
   - Backend validates ID token
   - Issues JWT (access + refresh tokens)
   - Client stores tokens securely
3. Subsequent requests include `Authorization: Bearer <token>`

> **Note**: Account creation is only possible through mobile apps. Web supports sign-in, sign-out, and account deletion.

---

## 🧪 Testing & Verification

### Manual Verification Steps
1. Start backend server (`uvicorn app.main:app --port 8000`)
2. Serve web files (`python3 -m http.server 8001`)
3. Open `http://localhost:8001`
4. Verify:
   - [ ] Map loads successfully
   - [ ] Sample media appears (if seeded)
   - [ ] Date filters are functional
   - [ ] Sign-in button present
   - [ ] Responsive design works on different screen sizes

### Unit Testing
Web logic is tested via:
```bash
# Run web unit tests (when testing framework added)
npm test  # (placeholder - framework to be added)
```

Currently relies on integration testing through end-to-end flows.

---

## 🔄 Integration with Backend

### API Endpoints Used
| Endpoint | Method | Description |
|--------|--------|-------------|
| `/api/v1/media` | GET | List media (public) |
| `/api/v1/media/search` | POST | Search with filters |
| `/api/v1/media/{id}` | GET | Get single media item |
| `/api/v1/media/{id}` | DELETE | Delete own media |
| `/api/v1/comments` | POST | Add comment |
| `/api/v1/auth/token` | POST | User sign-in |
| `/api/v1/users/me` | DELETE | Delete account |

All requests require proper JWT authentication (except public media reads).

---

## 🛠️ Development Notes

### Stubbed Services
- **Map Tiles**: During development, uses public OSM tiles.
- **Authentication**: Mock tokens accepted in dev mode (`MOCK_TOKEN`)
- **Media Storage**: Backend serves files from local filesystem

### Future Enhancements
- [ ] Add bundler (Vite/Webpack) for scalability
- [ ] Implement client-side routing
- [ ] Add PWA support for offline viewing
- [ ] Integrate analytics dashboard
- [ ] Support media clustering on map

---

## 📄 License
MIT License - see LICENSE file in root directory

---

## 🙌 Contributing
Please open issues and pull requests in the main repository. Coordinate with backend and mobile teams when modifying shared interfaces.

> This project is part of the larger OSP monorepo:
> - `osp-backend`: FastAPI service
> - `osp-web`: This web frontend
> - `osp-android`: Android client
> - `osp-ios`: iOS client

---

## 💬 Contact
For questions or collaboration, please open a discussion in the project repository.

---

*OSP: Empowering truth through verifiable citizen media*
