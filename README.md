# MediaVault - Secure File Sharing

MediaVault is a secure file sharing application for photos and videos, with password-protected folders and administrative controls.

## Features

- Create folders to organize media files
- Password protection for sensitive folders
- Upload photos and videos via direct upload or drag-and-drop
- View media with built-in viewer
- Download individual files or entire folders as ZIP
- Search functionality to quickly find content
- Admin panel for management and monitoring
- Activity logging

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mediavault.git
cd mediavault
```

2. Install frontend dependencies:

```bash
npm install
```

3. Navigate to the backend directory and install backend dependencies:

```bash
cd backend
npm install
```

4. Create a `.env` file in the backend directory with the following content:

```
DATABASE_URL=postgres://username:password@localhost:5432/media_vault_db
ADMIN_PASSWORD=admin123
```

5. Initialize the database:

```bash
npx prisma migrate dev
```

### Running the Application

1. Start the backend server:

```bash
cd backend
npm run start:dev
```

2. In a separate terminal, start the frontend:

```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Admin Access

To access the admin panel:

1. Navigate to the Admin section from the sidebar
2. Use the password defined in your `.env` file (default: admin123)

## Tech Stack

- **Frontend**: React, Material-UI, TypeScript
- **Backend**: NestJS, Prisma, PostgreSQL
- **File Storage**: Local filesystem

## Project Structure

- `/src` - Frontend React application
- `/backend` - NestJS backend API
- `/backend/prisma` - Database schema and migrations

## Key Features

### Password Protection

Folders can be created with password protection to secure sensitive content.

### File Management

Upload, download, and view media files in a user-friendly interface.

### Admin Controls

Admin panel for managing folders, media, and viewing activity logs.

### Search

Search functionality to quickly find content within folders.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
