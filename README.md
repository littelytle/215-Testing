
# IEP Minute Pro

A professional, collaborative tool for IEP teams to log service minutes and track student progress.

## Deployment to Vercel

1. **GitHub**: Create a new repository and push this code.
2. **Vercel**: Import the repository into a new Vercel project.
3. **Environment Variables**:
   - In the Vercel Dashboard, go to **Settings > Environment Variables**.
   - Add a variable called `API_KEY`.
   - Paste your Google Gemini API Key as the value.
4. **Build**: Vercel will automatically build the project using Vite.

## Local Development

1. Install dependencies: `npm install`
2. Run locally: `npm run dev`

## Team Collaboration
- Use the **Team Setup** tab to export your student list for other team members to import.
- Configure a Google Sheets Sync URL to centralize data automatically.
