# README.md

## SM 3D Printing Store – Full‑stack Replica

### Overview
A modern, responsive e‑commerce front‑end for a 3‑D‑printing store built with **React + Vite + TypeScript + Tailwind**. The front‑end is served by an **Express** server that proxies all API calls (`/api/*`) to a **Python back‑end** running on Render. The admin portal includes a dedicated **Edit** page for editing admin user details.

### Project Structure
```
new_website_3d/
├─ src/
│  ├─ components/        # Header, Footer, LoadingCube, ProductCard, AdminTable
│  ├─ hooks/             # useProducts, useAdmin
│  ├─ pages/             # Home, Shop, CustomPrint, Cart, Checkout, Admin, EditAdmin, NotFound
│  ├─ App.tsx
│  └─ main.tsx
├─ backend/
│  └─ server.js          # Express static server + /api proxy
├─ .github/workflows/ci.yml
├─ render.yaml            # Render service definition for the front‑end
├─ package.json
├─ vite.config.ts
├─ tailwind.config.js
├─ postcss.config.cjs
├─ tsconfig.json
└─ README.md
```

### Local Development
```bash
# Install dependencies
npm install

# Run the Vite dev server (frontend)
npm run dev   # → http://localhost:5173

# Build production bundle
npm run build

# Serve the built bundle with Express (makes /api proxy work)
node backend/server.js   # → http://localhost:3000
```

The Express server reads the environment variable `PYTHON_BACKEND_URL` to forward API requests to the Python back‑end. During local development you can set it in a `.env` file:
```
PYTHON_BACKEND_URL=http://localhost:8000
```

### CI/CD – GitHub Actions
The workflow defined in `.github/workflows/ci.yml` performs:
1. Checkout repository
2. Set up Node 20
3. Install dependencies (`npm ci`)
4. Lint (`npm run lint`)
5. Run **Jest** unit tests (`npm test`)
6. Run **Cypress** end‑to‑end tests (`cypress-io/github-action`)
7. Build the production bundle (`npm run build`)
8. Archive the bundle + `backend/server.js`
9. Deploy to **Render** via the Render CLI, updating the `PYTHON_BACKEND_URL` secret.

#### Required GitHub Secrets
| Secret | Description |
|--------|-------------|
| `RENDER_API_KEY` | Render API token with permission to create/update services |
| `RENDER_FRONTEND_SERVICE_ID` | The ID of the front‑end service created on Render (e.g., `srv-abc123`) |
| `PYTHON_BACKEND_URL` | URL of the already‑deployed Python back‑end on Render |
| *(optional)* additional env vars such as `DATABASE_URL` |

### Render Deployment
`render.yaml` describes the front‑end service:
```yaml
services:
  - type: web
    name: sm-3d-frontend
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: node backend/server.js
    envVars:
      - key: PYTHON_BACKEND_URL
        value: ""
    autoDeploy: true
```
Create the service once on Render, then the CI workflow will update the `PYTHON_BACKEND_URL` variable and redeploy on each push.

### Testing
#### Unit tests (Jest)
Example test file: `src/__tests__/Header.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import { Header } from '../components/Header';
import { BrowserRouter } from 'react-router-dom';

test('renders site title and navigation links', () => {
  render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
  expect(screen.getByText(/SM 3D Printing Store/i)).toBeInTheDocument();
  expect(screen.getByText(/Browse Store/i)).toBeInTheDocument();
  expect(screen.getByText(/Custom Print/i)).toBeInTheDocument();
  expect(screen.getByText(/Admin/i)).toBeInTheDocument();
});
```
Run with `npm test`.

#### End‑to‑end tests (Cypress)
Example test file: `cypress/e2e/admin_edit.cy.ts`
```ts
describe('Admin edit flow', () => {
  it('loads admin list and navigates to edit page', () => {
    cy.visit('/admin');
    cy.contains('Admin Users');
    cy.get('a').contains('Edit').first().click();
    cy.url().should('include', '/admin/edit/');
    cy.get('input[name="name"]').should('exist');
    cy.get('button').contains('Save Changes').click();
    cy.url().should('include', '/admin');
  });
});
```
Run with `npm run cypress` (or via the GitHub Action).

### Lighthouse Performance Audit
A script is defined in `package.json`:
```json
"lighthouse": "npm run build && lighthouse http://localhost:5000 --output html --output-path ./lighthouse-report.html"
```
After a successful deployment, run the script locally (or on a CI runner) to generate a mobile performance report. Aim for **≥ 90 %** across all categories.

### How to Deploy
1. **Create a GitHub repository** (private or public).  
   ```bash
   git init
   git remote add origin <owner>/<repo>
   git add .
   git commit -m "Initial full‑stack replica"
   git branch -M main
   git push -u origin main
   ```
2. **Add the required secrets** (see table above) in the repository Settings → Secrets → Actions.
3. **Create the front‑end service on Render** (use the `render.yaml` content).  
   Copy the service ID and add it as `RENDER_FRONTEND_SERVICE_ID`.
4. **Push** – the GitHub Actions workflow will run automatically, lint, test, build, and deploy.
5. After deployment, open the live URL (e.g., `https://sm-3d-store.onrender.com`). Verify that the site loads, navigation works, and the admin edit page functions.

### License
MIT – feel free to fork, modify, and redeploy under your own domain.
