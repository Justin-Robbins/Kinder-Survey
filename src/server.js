const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const BUCKET_NAME = 'Kinder Survey';

// Get all surveys
app.get('/api/surveys', async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    // Filter only JSON files and get metadata
    const surveys = data
      .filter(file => file.name.endsWith('.json'))
      .map(file => ({
        id: file.id,
        name: file.name.replace('.json', ''),
        filename: file.name,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        size: file.metadata?.size || 0
      }));

    res.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Get a specific survey
app.get('/api/surveys/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(fullFilename);

    if (error) throw error;

    const text = await data.text();
    const surveyData = JSON.parse(text);

    res.json(surveyData);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// Create or update a survey
app.post('/api/surveys', async (req, res) => {
  try {
    const { surveyData, filename } = req.body;
    
    if (!surveyData || !filename) {
      return res.status(400).json({ error: 'Survey data and filename are required' });
    }

    // Add metadata
    const dataWithMetadata = {
      ...surveyData,
      metadata: {
        author: '',
        createdAt: surveyData.metadata?.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };

    const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    const jsonString = JSON.stringify(dataWithMetadata, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Upload (upsert will overwrite if exists)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullFilename, blob, {
        contentType: 'application/json',
        upsert: true
      });

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Survey published successfully',
      filename: fullFilename
    });
  } catch (error) {
    console.error('Error saving survey:', error);
    res.status(500).json({ error: 'Failed to save survey' });
  }
});

// Delete a survey
app.delete('/api/surveys/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fullFilename]);

    if (error) throw error;

    res.json({ success: true, message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});