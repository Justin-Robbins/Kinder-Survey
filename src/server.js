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

app.get('/api/surveys/:id/schema', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('SurveySchemas')
      .select('content')
      .eq('id', id)
      .single();

    if (error) throw error;

    const surveyData = typeof data.content === 'string' 
      ? JSON.parse(data.content) 
      : data.content;

    res.json(surveyData);
  } catch (error) {
    console.error('Error fetching survey schema:', error);
    res.status(404).json({ error: 'Survey not found' });
  }
});

// Get all surveys
app.get('/api/surveys', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('SurveySchemas')
      .select('id, content, createdDate, changedDate')
      .order('changedDate', { ascending: false });

    if (error) throw error;

    const surveys = data.map(survey => {
      const content = typeof survey.content === 'string' 
        ? JSON.parse(survey.content) 
        : survey.content;
      
      return {
        id: survey.id,
        name: content.title || 'Untitled Survey',
        filename: survey.id.toString(),
        createdAt: survey.createdDate,
        updatedAt: survey.changedDate
      };
    });

    res.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Get a specific survey by ID
app.get('/api/surveys/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('SurveySchemas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const surveyData = typeof data.content === 'string' 
      ? JSON.parse(data.content) 
      : data.content;

    res.json(surveyData);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// Create or update a survey
app.post('/api/surveys', async (req, res) => {
  try {
    const { surveyData, surveyId } = req.body;
    
    if (!surveyData) {
      return res.status(400).json({ error: 'Survey data is required' });
    }

    if (surveyId) {
      // Update existing survey
      const { data, error } = await supabase
        .from('SurveySchemas')
        .update({ 
          content: surveyData,
          changedDate: new Date().toISOString()
        })
        .eq('id', surveyId)
        .select()
        .single();

      if (error) throw error;

      res.json({ 
        success: true, 
        message: 'Survey updated successfully',
        surveyId: data.id
      });
    } else {
      // Create new survey
      const { data, error } = await supabase
        .from('SurveySchemas')
        .insert({ 
          content: surveyData,
          createdDate: new Date().toISOString(),
          changedDate: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      res.json({ 
        success: true, 
        message: 'Survey created successfully',
        surveyId: data.id
      });
    }
  } catch (error) {
    console.error('Error saving survey:', error);
    res.status(500).json({ error: 'Failed to save survey' });
  }
});

// Delete a survey
app.delete('/api/surveys/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First delete all associated results
    const { error: resultsError } = await supabase
      .from('SurveyResults')
      .delete()
      .eq('survey_schema_id', id);

    if (resultsError) throw resultsError;

    // Then delete the survey schema
    const { error } = await supabase
      .from('SurveySchemas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

// Submit survey results
app.post('/api/surveys/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const { results } = req.body;

    console.log('Received survey submission:', { id, results }); // Debug log

    if (!results) {
      return res.status(400).json({ error: 'Survey results are required' });
    }

    const { data, error } = await supabase
      .from('SurveyResults')
      .insert({
        survey_schema_id: id,
        content: results
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error); // Debug log
      throw error;
    }

    res.json({ 
      success: true, 
      message: 'Survey results submitted successfully',
      resultId: data.id
    });
  } catch (error) {
    console.error('Error submitting survey results:', error);
    res.status(500).json({ 
      error: 'Failed to submit survey results',
      details: error.message 
    });
  }
});

// Get results for a specific survey
app.get('/api/surveys/:id/results', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('SurveyResults')
      .select('*')
      .eq('survey_schema_id', id)
      .order('id', { ascending: false });

    if (error) throw error;

    const results = data.map(result => ({
      id: result.id,
      surveySchemaId: result.survey_schema_id,
      content: typeof result.content === 'string' 
        ? JSON.parse(result.content) 
        : result.content
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching survey results:', error);
    res.status(500).json({ error: 'Failed to fetch survey results' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});