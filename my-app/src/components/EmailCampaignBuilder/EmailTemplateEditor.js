import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Code as CodeIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const EmailTemplateEditor = ({ template, onSave, onPreview }) => {
  const [emailData, setEmailData] = useState({
    subject: template?.subject || '',
    content: template?.content || '',
    variables: template?.variables || [],
    templateType: template?.templateType || 'default',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const availableVariables = [
    { name: '{{user.name}}', description: 'User Name' },
    { name: '{{user.email}}', description: 'User Email' },
    { name: '{{user.company}}', description: 'Company Name' },
    { name: '{{campaign.name}}', description: 'Campaign Name' },
    { name: '{{unsubscribe.url}}', description: 'Unsubscribe URL' },
    { name: '{{tracking.url}}', description: 'Tracking URL' },
    { name: '{{product.name}}', description: 'Product Name' },
    { name: '{{product.price}}', description: 'Product Price' },
    { name: '{{order.total}}', description: 'Order Total' },
    { name: '{{date}}', description: 'Current Date' },
  ];

  const handleVariableInsert = (variable) => {
    setEmailData(prev => ({
      ...prev,
      content: prev.content + variable.name
    }));
    toast.success(`Added ${variable.description} to content`);
  };

  const handleBold = () => {
    setEmailData(prev => ({
      ...prev,
      content: prev.content + '<strong>Bold Text</strong>'
    }));
    toast.success('Added bold formatting');
  };

  const handleItalic = () => {
    setEmailData(prev => ({
      ...prev,
      content: prev.content + '<em>Italic Text</em>'
    }));
    toast.success('Added italic formatting');
  };

  const handleInsertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      setEmailData(prev => ({
        ...prev,
        content: prev.content + `<a href="${url}">Link Text</a>`
      }));
      toast.success('Added link');
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setEmailData(prev => ({
        ...prev,
        content: prev.content + `<img src="${url}" alt="Image" style="max-width: 100%;" />`
      }));
      toast.success('Added image');
    }
  };

  const handleSave = () => {
    onSave(emailData);
    toast.success('Email template saved successfully!');
  };

  const handlePreview = () => {
    setShowPreview(true);
    onPreview(emailData);
    toast.success('Preview generated!');
  };

  const renderToolbar = () => (
    <Box sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <Tooltip title="Bold">
          <IconButton size="small" onClick={handleBold}>
            <BoldIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton size="small" onClick={handleItalic}>
            <ItalicIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Insert Link">
          <IconButton size="small" onClick={handleInsertLink}>
            <LinkIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Image">
          <IconButton size="small" onClick={handleInsertImage}>
            <ImageIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Table">
          <IconButton size="small">
            <TableIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Toggle Code View">
          <IconButton 
            size="small" 
            onClick={() => setShowCode(!showCode)}
            color={showCode ? 'primary' : 'default'}
          >
            <CodeIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  const renderVariables = () => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Available Variables
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {availableVariables.map((variable) => (
          <Chip
            key={variable.name}
            label={variable.description}
            size="small"
            onClick={() => handleVariableInsert(variable)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
    </Box>
  );

  const renderTemplatePreview = () => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Email Preview
      </Typography>
      <Paper sx={{ p: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="h6" gutterBottom>
          Subject: {emailData.subject}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Box 
          dangerouslySetInnerHTML={{ __html: emailData.content }}
          sx={{ 
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        />
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Email Template Editor</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Template
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ flex: 1 }}>
        {/* Editor Panel */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject..."
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Template Type</InputLabel>
                  <Select
                    value={emailData.templateType}
                    label="Template Type"
                    onChange={(e) => setEmailData(prev => ({ ...prev, templateType: e.target.value }))}
                  >
                    <MenuItem value="default">Default Template</MenuItem>
                    <MenuItem value="welcome">Welcome Template</MenuItem>
                    <MenuItem value="promotional">Promotional Template</MenuItem>
                    <MenuItem value="newsletter">Newsletter Template</MenuItem>
                    <MenuItem value="abandoned-cart">Abandoned Cart</MenuItem>
                    <MenuItem value="order-confirmation">Order Confirmation</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                {renderToolbar()}
                {renderVariables()}
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  label="Email Content"
                  value={emailData.content}
                  onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your email content here... You can use variables like {{user.name}}"
                  sx={{ fontFamily: showCode ? 'monospace' : 'inherit' }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Preview Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            {showPreview ? renderTemplatePreview() : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Template Info
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Use the editor to create your email template. You can insert variables by clicking on the chips below.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Click "Preview" to see how your email will look to recipients.
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handlePreview}
                >
                  Show Preview
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailTemplateEditor; 