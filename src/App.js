import 'survey-core/survey-core.min.css';
import React, { useState, useEffect } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { surveyLocalization } from 'survey-core';
import 'survey-core/i18n/japanese';
import 'survey-core/i18n/english';
import './survey-builder.css';

const API_URL = 'http://localhost:3001/api';

const SurveyBuilder = () => {
  const [mode, setMode] = useState('builder');
  const [surveyTitle, setSurveyTitle] = useState('My Survey');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [surveyLanguage, setSurveyLanguage] = useState('en');
  const [sections, setSections] = useState([
    {
      id: 1,
      name: 'section1',
      title: 'Section 1',
      visibleIf: '',
      questions: [
        {
          id: 1,
          type: 'text',
          name: 'question1',
          title: 'What is your name?',
          isRequired: true,
          choices: []
        }
      ]
    }
  ]);
  
  const handleLanguageChange = (language) => {
    setSurveyLanguage(language);
  };

  const [activeSectionId, setActiveSectionId] = useState(1);
  const [editingQuestion, setEditingQuestion] = useState(sections[0].questions[0]);
  const [expandedSections, setExpandedSections] = useState([1]);
  const [surveySettingsExpanded, setSurveySettingsExpanded] = useState(true);
  const [editingMode, setEditingMode] = useState('question'); // 'survey', 'section', 'question'
  const [surveys, setSurveys] = useState([]);
  const [loadedSurveyId, setLoadedSurveyId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
    
  // Add this useEffect to fetch surveys on mount
  useEffect(() => {
    fetchSurveys();
  }, []);

  // Add this useEffect to track unsaved changes
  useEffect(() => {
    if (loadedSurveyId) {
      setHasUnsavedChanges(true);
    }
  }, [surveyTitle, surveyDescription, sections, loadedSurveyId]);

  const questionTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'comment', label: 'Long Text (Comment)' },
    { value: 'radiogroup', label: 'Multiple Choice (Single)' },
    { value: 'checkbox', label: 'Multiple Choice (Multiple)' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'rating', label: 'Rating Scale' },
    { value: 'boolean', label: 'Yes/No' }
  ];

  const activeSection = sections.find(s => s.id === activeSectionId);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const selectSurveySettings = () => {
    setEditingMode('survey');
    setSurveySettingsExpanded(true);
  };

  const selectSection = (sectionId) => {
    setActiveSectionId(sectionId);
    setEditingMode('section');
    setEditingQuestion(null);
  };

  const selectQuestion = (question, sectionId) => {
    setActiveSectionId(sectionId);
    setEditingQuestion(question);
    setEditingMode('question');
  };

  const addSection = () => {
    const newId = Math.max(...sections.map(s => s.id), 0) + 1;
    const newSection = {
      id: newId,
      name: `section${newId}`,
      title: `Section ${newId}`,
      visibleIf: '',
      questions: [
        {
          id: Date.now(),
          type: 'text',
          name: `question${Date.now()}`,
          title: 'New Question',
          isRequired: false,
          choices: []
        }
      ]
    };
    setSections([...sections, newSection]);
    setActiveSectionId(newId);
    setExpandedSections([...expandedSections, newId]);
    setEditingMode('section');
    setEditingQuestion(null);
  };

  const updateSection = (id, updates) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const deleteSection = (id) => {
    if (sections.length === 1) {
      alert('Cannot delete the last section');
      return;
    }
    setSections(sections.filter(s => s.id !== id));
    if (activeSectionId === id) {
      const remainingSections = sections.filter(s => s.id !== id);
      setActiveSectionId(remainingSections[0]?.id);
      setEditingMode('section');
      setEditingQuestion(null);
    }
  };

  const addQuestion = (sectionId) => {
    const newId = Date.now();
    const newQuestion = {
      id: newId,
      type: 'text',
      name: `question${newId}`,
      title: 'New Question',
      isRequired: false,
      choices: []
    };
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion] } : s
    ));
    setEditingQuestion(newQuestion);
    setActiveSectionId(sectionId);
    setEditingMode('question');
  };

  const updateQuestion = (sectionId, questionId, updates) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { 
            ...s, 
            questions: s.questions.map(q => 
              q.id === questionId ? { ...q, ...updates } : q
            ) 
          } 
        : s
    ));
    if (editingQuestion?.id === questionId) {
      setEditingQuestion({ ...editingQuestion, ...updates });
    }
  };

  const deleteQuestion = (sectionId, questionId) => {
    const section = sections.find(s => s.id === sectionId);
    if (section.questions.length === 1) {
      alert('Cannot delete the last question in a section');
      return;
    }
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, questions: s.questions.filter(q => q.id !== questionId) } 
        : s
    ));
    if (editingQuestion?.id === questionId) {
      const remainingQuestions = section.questions.filter(q => q.id !== questionId);
      setEditingQuestion(remainingQuestions[0] || null);
      if (remainingQuestions.length > 0) {
        setEditingMode('question');
      } else {
        setEditingMode('section');
      }
    }
  };

  const moveQuestion = (sectionId, questionId, direction) => {
    const section = sections.find(s => s.id === sectionId);
    const index = section.questions.findIndex(q => q.id === questionId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === section.questions.length - 1)
    ) {
      return;
    }
    const newQuestions = [...section.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, questions: newQuestions } : s
    ));
  };

  const generateSurveyJSON = () => {
    return {
      title: surveyTitle,
      description: surveyDescription,
      showProgressBar: 'top',
      showQuestionNumbers: 'on',
      locale: surveyLanguage,
      pages: sections.map(section => {
        const page = {
          name: section.name,
          title: section.title,
          elements: section.questions.map(q => {
            const element = {
              type: q.type,
              name: q.name,
              title: q.title,
              isRequired: q.isRequired
            };
            if (['radiogroup', 'checkbox', 'dropdown'].includes(q.type) && q.choices.length > 0) {
              element.choices = q.choices;
            }
            if (q.visibleIf) {
              element.visibleIf = q.visibleIf;
            }
            return element;
          })
        };
        if (section.visibleIf) {
          page.visibleIf = section.visibleIf;
        }
        return page;
      })
    };
  };

  const survey = new Model(generateSurveyJSON());
  survey.onComplete.add((sender) => {
    console.log('Survey Results:', sender.data);
    alert('Survey completed! Check console for results.');
  });

  const needsChoices = (type) => ['radiogroup', 'checkbox', 'dropdown'].includes(type);
  
  const fetchSurveys = async () => {
    try {
      const response = await fetch(`${API_URL}/surveys`);
      const data = await response.json();
      setSurveys(data);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      alert('Failed to load surveys');
    }
  };

  const loadSurvey = async (surveyId) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Load this survey anyway?')) {
        return;
      }
    }

    try {
      const response = await fetch(`${API_URL}/surveys/${surveyId}`);
      const data = await response.json();
      
      setSurveyTitle(data.title || 'My Survey');
      setSurveyDescription(data.description || '');
      setSurveyLanguage(data.locale || 'en');
      
      const loadedSections = data.pages.map((page, index) => ({
        id: index + 1,
        name: page.name,
        title: page.title,
        visibleIf: page.visibleIf || '',
        questions: page.elements.map((el, qIndex) => ({
          id: Date.now() + qIndex,
          type: el.type,
          name: el.name,
          title: el.title,
          isRequired: el.isRequired || false,
          choices: el.choices || [],
          visibleIf: el.visibleIf || ''
        }))
      }));
      
      setSections(loadedSections);
      setActiveSectionId(loadedSections[0]?.id);
      setEditingQuestion(loadedSections[0]?.questions[0]);
      setLoadedSurveyId(surveyId);
      setHasUnsavedChanges(false);
      alert('Survey loaded successfully!');
    } catch (error) {
      console.error('Error loading survey:', error);
      alert('Failed to load survey');
    }
  };

  const publishSurvey = async () => {
    if (!surveyTitle.trim()) {
      alert('Please enter a survey title');
      return;
    }

    setIsPublishing(true);
    try {
      const surveyData = generateSurveyJSON();
      
      const response = await fetch(`${API_URL}/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyData,
          surveyId: loadedSurveyId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setLoadedSurveyId(result.surveyId);
        setHasUnsavedChanges(false);
        await fetchSurveys();
        alert('Survey published successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error publishing survey:', error);
      alert('Failed to publish survey');
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteSurvey = async (surveyId) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/surveys/${surveyId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchSurveys();
        if (loadedSurveyId === surveyId) {
          setLoadedSurveyId(null);
        }
        alert('Survey deleted successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      alert('Failed to delete survey');
    }
  };

  return (
    <div className="app">
      <Header 
        mode={mode}
        onModeChange={setMode}
        onPublish={publishSurvey}
        isPublishing={isPublishing}
        hasUnsavedChanges={hasUnsavedChanges}
        onExport={() => {
          console.log('Survey JSON:', JSON.stringify(generateSurveyJSON(), null, 2));
          alert('Survey JSON logged to console!');
        }}
      />

      {mode === 'builder' ? (
        <BuilderView
          surveys={surveys}
          loadedSurveyId={loadedSurveyId}
          onLoadSurvey={loadSurvey}
          onDeleteSurvey={deleteSurvey}
          surveyTitle={surveyTitle}
          surveyDescription={surveyDescription}
          sections={sections}
          activeSection={activeSection}
          editingQuestion={editingQuestion}
          editingMode={editingMode}
          expandedSections={expandedSections}
          surveySettingsExpanded={surveySettingsExpanded}
          questionTypes={questionTypes}
          onTitleChange={setSurveyTitle}
          onDescriptionChange={setSurveyDescription}
          onAddSection={addSection}
          onUpdateSection={updateSection}
          onDeleteSection={deleteSection}
          onSelectSurveySettings={selectSurveySettings}
          onSelectSection={selectSection}
          onToggleSection={toggleSection}
          onToggleSurveySettings={() => setSurveySettingsExpanded(!surveySettingsExpanded)}
          onAddQuestion={addQuestion}
          onSelectQuestion={selectQuestion}
          onUpdateQuestion={updateQuestion}
          onDeleteQuestion={deleteQuestion}
          onMoveQuestion={moveQuestion}
          needsChoices={needsChoices}
          surveyLanguage={surveyLanguage}
          onLanguageChange={handleLanguageChange}
        />
      ) : (
        <PreviewView survey={survey} />
      )}
    </div>
  );
};

const Header = ({ mode, onModeChange, onPublish, isPublishing, hasUnsavedChanges }) => (
  <header className="header">
    <div className="header-content">
      <div className="header-left">
        <h1 className="title">Survey Builder</h1>
        {hasUnsavedChanges && <span className="unsaved-indicator">● Unsaved changes</span>}
      </div>
      <div className="header-actions">
        <button
          onClick={() => onModeChange('builder')}
          className={`btn ${mode === 'builder' ? 'btn-active' : ''}`}
        >
          Build
        </button>
        <button
          onClick={() => onModeChange('preview')}
          className={`btn ${mode === 'preview' ? 'btn-active' : ''}`}
        >
          Preview
        </button>
        <button 
          onClick={onPublish} 
          className="btn"
          disabled={isPublishing}
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  </header>
);

const ChevronIcon = ({ isExpanded }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="currentColor"
    style={{ 
      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s'
    }}
  >
    <path d="M6 4l4 4-4 4V4z" />
  </svg>
);

const SurveyListSidebar = ({ surveys, loadedSurveyId, onLoadSurvey, onDeleteSurvey }) => (
  <aside className="survey-list-sidebar">
    <div className="survey-list-header">
      <h3>Saved Surveys</h3>
      <span className="survey-count">{(surveys || []).length}</span>
    </div>
    <div className="survey-list">
      {(surveys || []).length === 0 ? (
        <div className="survey-list-empty">
          No surveys yet. Publish your first survey!
        </div>
      ) : (
        (surveys || []).map((survey) => (
          <div 
            key={survey.id}
            className={`survey-list-item ${loadedSurveyId === survey.id ? 'survey-list-item-active' : ''}`}
          >
            <div 
              className="survey-list-item-content"
              onClick={() => onLoadSurvey(survey.id)}
            >
              <div className="survey-list-item-name">{survey.name}</div>
              <div className="survey-list-item-date">
                {new Date(survey.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <button
              className="survey-list-item-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSurvey(survey.id);
              }}
              title="Delete survey"
            >
              🗑️
            </button>
          </div>
        ))
      )}
    </div>
  </aside>
);

const BuilderView = ({
  surveys,
  loadedSurveyId,
  surveyLanguage,
  onLanguageChange,
  onLoadSurvey,
  onDeleteSurvey,
  surveyTitle,
  surveyDescription,
  sections,
  activeSection,
  editingQuestion,
  editingMode,
  expandedSections,
  surveySettingsExpanded,
  questionTypes,
  onTitleChange,
  onDescriptionChange,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onSelectSurveySettings,
  onSelectSection,
  onToggleSection,
  onToggleSurveySettings,
  onAddQuestion,
  onSelectQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  needsChoices
}) => (
  <div className="main-content">
    <div className="builder-layout-with-surveys">
      <SurveyListSidebar 
        surveys={surveys}
        loadedSurveyId={loadedSurveyId}
        onLoadSurvey={onLoadSurvey}
        onDeleteSurvey={onDeleteSurvey}
      />
    <div className="builder-layout">
      <aside className="sidebar">
        <div className="tree-container">
          {/* Survey Settings */}
          <div className="tree-item tree-item-root">
            <div 
              className={`tree-item-header ${editingMode === 'survey' ? 'tree-item-active' : ''}`}
              onClick={onSelectSurveySettings}
            >
              <button 
                className="tree-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSurveySettings();
                }}
              >
                <ChevronIcon isExpanded={surveySettingsExpanded} />
              </button>
              <span className="tree-item-title">Survey Settings</span>
            </div>
          </div>

          {/* Sections */}
          {surveySettingsExpanded && sections.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            const isActive = editingMode === 'section' && activeSection?.id === section.id;
            
            return (
              <div key={section.id} className="tree-item">
                <div 
                  className={`tree-item-header ${isActive ? 'tree-item-active' : ''}`}
                  onClick={() => onSelectSection(section.id)}
                >
                  <button 
                    className="tree-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSection(section.id);
                    }}
                  >
                    <ChevronIcon isExpanded={isExpanded} />
                  </button>
                  <span className="tree-item-title">{section.title}</span>
                  <span className="tree-item-count">{section.questions.length}</span>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (window.confirm('Delete this section?')) {
                        onDeleteSection(section.id);
                      }
                    }}
                    className="tree-delete-btn"
                    title="Delete section"
                  >
                    🗑️
                  </button>
                </div>

                {/* Questions */}
                {isExpanded && (
                  <div className="tree-children">
                    {section.questions.map((question, index) => {
                      const isQuestionActive = editingMode === 'question' && editingQuestion?.id === question.id;
                      
                      return (
                        <div 
                          key={question.id}
                          className={`tree-question ${isQuestionActive ? 'tree-item-active' : ''}`}
                          onClick={() => onSelectQuestion(question, section.id)}
                        >
                          <span className="question-number">{index + 1}</span>
                          <span className="tree-question-title">{question.title}</span>
                          <span className="tree-question-type">
                            {questionTypes.find(t => t.value === question.type)?.label}
                          </span>
                          <div className="tree-question-actions">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onMoveQuestion(section.id, question.id, 'up'); 
                              }}
                              disabled={index === 0}
                              className="btn-icon"
                            >
                              ▲
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onMoveQuestion(section.id, question.id, 'down'); 
                              }}
                              disabled={index === section.questions.length - 1}
                              className="btn-icon"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button 
                      className="tree-add-btn"
                      onClick={() => onAddQuestion(section.id)}
                    >
                      + Add Question
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Section Button */}
          {surveySettingsExpanded && (
            <button className="tree-add-section-btn" onClick={onAddSection}>
              + Add Section
            </button>
          )}
        </div>
      </aside>

      <main className="editor-panel">
        {editingMode === 'survey' ? (
          <SurveySettingsEditor
            surveyTitle={surveyTitle}
            surveyDescription={surveyDescription}
            surveyLanguage={surveyLanguage}
            onTitleChange={onTitleChange}
            onDescriptionChange={onDescriptionChange}
            onLanguageChange={onLanguageChange}
          />
        ) : editingMode === 'section' && activeSection ? (
          <SectionEditor
            section={activeSection}
            onUpdate={(updates) => onUpdateSection(activeSection.id, updates)}
            onDelete={() => {
              if (window.confirm('Delete this section?')) {
                onDeleteSection(activeSection.id);
              }
            }}
          />
        ) : editingMode === 'question' && editingQuestion && activeSection ? (
          <QuestionEditor
            question={editingQuestion}
            sectionId={activeSection.id}
            questionTypes={questionTypes}
            onUpdate={(updates) => onUpdateQuestion(activeSection.id, editingQuestion.id, updates)}
            onDelete={() => onDeleteQuestion(activeSection.id, editingQuestion.id)}
            needsChoices={needsChoices}
          />
        ) : (
          <EmptyState />
        )}
      </main>
      </div>
    </div>
  </div>
);

const SurveySettingsEditor = ({ 
  surveyTitle, 
  surveyDescription, 
  surveyLanguage,
  onTitleChange, 
  onDescriptionChange,
  onLanguageChange
}) => (
  <div className="card">
    <div className="editor-header">
      <h3 className="editor-title">Survey Settings</h3>
    </div>

    <div className="form-group-container">
      <div className="form-group">
        <label className="label">Survey Title</label>
        <input
          type="text"
          value={surveyTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="input"
        />
      </div>
      <div className="form-group">
        <label className="label">Description</label>
        <textarea
          value={surveyDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="textarea"
        />
      </div>
      
      <div className="form-group">
        <label className="label">Survey Language</label>
        <div className="language-selector">
          <label className="radio-label">
            <input
              type="radio"
              name="surveyLanguage"
              value="en"
              checked={surveyLanguage === 'en'}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="radio"
            />
            <span>English</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="surveyLanguage"
              value="ja"
              checked={surveyLanguage === 'ja'}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="radio"
            />
            <span>日本語 (Japanese)</span>
          </label>
        </div>
        <div className="help-text">
          💡 This will change the language of survey UI elements like buttons, error messages, etc.
        </div>
      </div>
    </div>
  </div>
);

const SectionEditor = ({ section, onUpdate, onDelete }) => (
  <div className="card">
    <div className="editor-header">
      <h3 className="editor-title">Section Settings</h3>
      <button
        onClick={onDelete}
        className="btn btn-danger"
      >
        Delete Section
      </button>
    </div>

    <div className="form-group-container">
      <div className="form-group">
        <label className="label">Section Title</label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="input"
        />
      </div>
      <div className="form-group">
        <label className="label">Section Conditional Logic (Optional)</label>
        <input
          type="text"
          value={section.visibleIf || ''}
          onChange={(e) => onUpdate({ visibleIf: e.target.value })}
          placeholder="{question1} = 'Yes'"
          className="input"
        />
        <div className="help-text">
          💡 Skip this section based on answers: {`{question1} = 'Yes'`}
        </div>
      </div>
    </div>
  </div>
);

const QuestionEditor = ({ question, sectionId, questionTypes, onUpdate, onDelete, needsChoices }) => {
  const [tempChoicesText, setTempChoicesText] = React.useState(
    question.choices.join('\n')
  );

  React.useEffect(() => {
    setTempChoicesText(question.choices.join('\n'));
  }, [question.id]);

  const handleChoicesChange = (e) => {
    setTempChoicesText(e.target.value);
  };

  const handleChoicesBlur = () => {
    const cleaned = tempChoicesText
      .split('\n')
      .map(c => c.trim())
      .filter(c => c);
    onUpdate({ choices: cleaned });
  };

  return (
    <div className="card">
      <div className="editor-header">
        <h3 className="editor-title">Edit Question</h3>
        <button
          onClick={() => {
            if (window.confirm('Delete this question?')) {
              onDelete();
            }
          }}
          className="btn btn-danger"
        >
          Delete
        </button>
      </div>

      <div className="form-group-container">
        <div className="form-group">
          <label className="label">Question Type</label>
          <select
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value })}
            className="select"
          >
            {questionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label">Question Text</label>
          <input
            type="text"
            value={question.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="input"
          />
        </div>

        <div className="checkbox-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={question.isRequired}
              onChange={(e) => onUpdate({ isRequired: e.target.checked })}
              className="checkbox"
            />
            <span>Required Question</span>
          </label>
        </div>

        {needsChoices(question.type) && (
          <div className="form-group">
            <label className="label">Answer Choices (one per line)</label>
            <textarea
              value={tempChoicesText}
              onChange={handleChoicesChange}
              onBlur={handleChoicesBlur}
              rows={6}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              className="textarea"
            />
          </div>
        )}

        <div className="form-group">
          <label className="label">Conditional Logic (Optional)</label>
          <input
            type="text"
            value={question.visibleIf || ''}
            onChange={(e) => onUpdate({ visibleIf: e.target.value })}
            placeholder="{question1} = 'Yes'"
            className="input"
          />
          <div className="help-text">
            💡 Example: {`{question1} = 'Yes'`} or {`{rating} = 'Poor'`}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="card empty-state">
    <div className="empty-icon">📋</div>
    <div className="empty-title">No item selected</div>
    <p className="empty-description">
      Select a survey setting, section, or question from the left panel to edit
    </p>
  </div>
);

const PreviewView = ({ survey }) => (
  <div className="preview-fullscreen">
    <Survey model={survey} />
  </div>
);

export default SurveyBuilder;