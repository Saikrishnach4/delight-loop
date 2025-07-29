import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
} from '@mui/material';

const ABTestingPanel = ({ campaign, onSave }) => {
  const [abTest, setAbTest] = useState({
    enabled: false,
    variantA: '',
    variantB: '',
    testSize: 1000,
  });

  const handleSave = () => {
    onSave({ ...campaign, abTest });
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        A/B Testing
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        A/B testing lets you test two different versions of your email to see which one performs better.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Version A
              </Typography>
              <TextField
                fullWidth
                label="Subject Line A"
                value={abTest.variantA}
                onChange={(e) => setAbTest(prev => ({ ...prev, variantA: e.target.value }))}
                placeholder="e.g., Get 20% off today!"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                This version will be sent to 50% of your subscribers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Version B
              </Typography>
              <TextField
                fullWidth
                label="Subject Line B"
                value={abTest.variantB}
                onChange={(e) => setAbTest(prev => ({ ...prev, variantB: e.target.value }))}
                placeholder="e.g., Limited time offer - 20% discount"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                This version will be sent to 50% of your subscribers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!abTest.variantA || !abTest.variantB}
        >
          Save A/B Test
        </Button>
      </Box>

      {abTest.variantA && abTest.variantB && (
        <Alert severity="success" sx={{ mt: 2 }}>
          A/B test configured! Version A: "{abTest.variantA}" vs Version B: "{abTest.variantB}"
        </Alert>
      )}
    </Box>
  );
};

export default ABTestingPanel; 