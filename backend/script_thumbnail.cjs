const fs = require('fs/promises');
const { GoogleAuth } = require('google-auth-library');
const dotenv = require('dotenv');
dotenv.config();

const fetch = require('node-fetch');

// Helper function to split array into chunks of specified size
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function sendFilesToCloudRun() {
  const jsonFilePath = './fileNames.json'; // Path to your JSON file
  const fileData = await fs.readFile(jsonFilePath, 'utf8');
  const fileNames = JSON.parse(fileData);

  const targetAudience = process.env.THUMBNAIL_CLOUD_URL;
  const auth = new GoogleAuth();

  // Get auth client and token
  const client = await auth.getIdTokenClient(targetAudience);
  const token = await client.idTokenProvider.fetchIdToken(targetAudience);

  console.info(`Request with target audience ${targetAudience}`);

  // Split files into batches of 10
  const batchSize = 3;
  const batches = chunkArray(fileNames, batchSize);

  console.log(`Processing ${fileNames.length} files in ${batches.length} batches of up to ${batchSize} files each`);

  // Process each batch sequentially
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1} of ${batches.length}...`);

    // Process files in this batch in parallel
    const batchPromises = batch.map(async (file) => {
      const fileEvent = {
        name: file.originalFilename,
        bucket: process.env.GCLOUD_BUCKET_NAME,
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

    // Wait for current batch to complete before moving to next batch
    await Promise.all(batchPromises);
    console.log(`Completed batch ${batchIndex + 1} of ${batches.length}`);
  }

  console.log('All files processed.');
}

sendFilesToCloudRun().catch((error) => console.error('Error:', error.message));
