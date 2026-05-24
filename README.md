# The Track

A starter template for building modern web apps with **Rails 8**, **Inertia.js**, **React 19**, and **Vite**.

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Backend    | Ruby on Rails 8.1, PostgreSQL       |
| Bridge     | Inertia.js 3                        |
| Frontend   | React 19, TypeScript 6              |
| Styling    | Tailwind CSS 4                      |
| Bundler    | Vite 8                              |
| Auth       | Devise 5                            |
| Deploy     | Kamal, Docker                       |

## Prerequisites

- Ruby 3.4+
- Node.js 18+
- PostgreSQL

## Getting Started

```bash
# Install dependencies
bundle install
npm install

# Setup the database
bin/rails db:create db:migrate

# Start the development server
bin/dev
```

`bin/dev` runs both the Rails server and the Vite dev server concurrently via `Procfile.dev`.

## Project Structure

```
app/
├── controllers/       # Rails controllers — render Inertia pages
├── models/            # Active Record models
├── frontend/
│   ├── pages/         # React page components (mapped to routes)
│   ├── components/    # Shared React components
│   └── entrypoints/   # Vite entry points
config/
├── initializers/
│   └── inertia_rails.rb   # Inertia configuration
vite.config.ts             # Vite + React + Tailwind plugin config
```

## How It Works

Rails handles routing, controllers, and data. Instead of server-rendered views, controllers render **React components** via Inertia.js — no API layer or client-side router needed.

```ruby
# app/controllers/projects_controller.rb
def index
  render inertia: 'Projects/Index', props: { projects: Project.all }
end
```

```tsx
// app/frontend/pages/Projects/Index.tsx
export default function Index({ projects }: { projects: Project[] }) {
  return <ul>{projects.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}
```
