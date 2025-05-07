const fs = require('fs/promises');
const { GoogleAuth } = require('google-auth-library');
const dotenv = require('dotenv');
dotenv.config();

const fetch = require('node-fetch');


async function sendFilesToCloudRun() {
  const jsonFilePath = './fileNames.json'; // Path to your JSON file
  const fileData = await fs.readFile(jsonFilePath, 'utf8');
  const fileNames = JSON.parse(fileData);

  const targetAudience = process.env.THUMBNAIL_CLOUD_URL;
  const auth = new GoogleAuth();

  // Define request function within sendFilesToCloudRun
  const client = await auth.getIdTokenClient(targetAudience);
  const token = await client.idTokenProvider.fetchIdToken(targetAudience);

  console.info(`request with target audience ${targetAudience}`);

  // Process all files in parallel
  const promises = fileNames.map(async (file) => {
    const fileEvent = {
      name: file.originalFilename,
      bucket: 'file-sharing-ku-dev', // Replace with your bucket name
    };

    try {
      const response = await fetch(targetAudience, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fileEvent),
      });

      if (response.ok) {
        console.log(`Processed: ${file.originalFilename}`);
      } else {
        console.error(`Failed to process: ${file.originalFilename}, Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error processing: ${file.originalFilename}, Error: ${error.message}`);
    }
  });

  // Wait for all promises to complete
  await Promise.all(promises);
  console.log('All files processed.');
}

sendFilesToCloudRun().catch((error) => console.error('Error:', error.message));
