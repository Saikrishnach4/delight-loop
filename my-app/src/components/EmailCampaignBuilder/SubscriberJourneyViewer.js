import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Card,
  CardContent,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Timeline as TimelineIcon,
  Email as EmailIcon,
  OpenInNew as OpenInNewIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

const SubscriberJourneyViewer = ({ campaign }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [showJourney, setShowJourney] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (campaign?.subscribers) {
      setSubscribers(campaign.subscribers);
    }
  }, [campaign]);

  const handleViewJourney = async (subscriber) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `/api/campaigns/${campaign._id}/subscriber/${subscriber.email}/journey`
      );
      setSelectedSubscriber(response.data.journey);
      setShowJourney(true);
    } catch (error) {
      console.error('Error fetching subscriber journey:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(subscriber =>
    subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscriber.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscriber.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'unsubscribed':
        return 'error';
      case 'bounced':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStepStatus = (stepHistory, stepNumber) => {
    const step = stepHistory.find(h => h.stepNumber === stepNumber);
    if (!step) return 'pending';
    if (step.clickedAt) return 'clicked';
    if (step.openedAt) return 'opened';
    if (step.sentAt) return 'sent';
    return 'pending';
  };

  const getStepStatusColor = (status) => {
    switch (status) {
      case 'clicked':
        return 'success';
      case 'opened':
        return 'primary';
      case 'sent':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <PersonIcon />
          Subscriber Management
        </Typography>
        <TextField
          size="small"
          placeholder="Search subscribers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Current Step</TableCell>
              <TableCell>Subscribed</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubscribers.map((subscriber) => (
              <TableRow key={subscriber.email}>
                <TableCell>{subscriber.email}</TableCell>
                <TableCell>
                  {subscriber.firstName} {subscriber.lastName}
                </TableCell>
                <TableCell>
                  <Chip
                    label={subscriber.status}
                    color={getStatusColor(subscriber.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={`Step ${subscriber.currentStep}`}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(subscriber.subscribedAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Journey">
                    <IconButton
                      size="small"
                      onClick={() => handleViewJourney(subscriber)}
                      disabled={isLoading}
                    >
                      <TimelineIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Subscriber Journey Dialog */}
      <Dialog open={showJourney} onClose={() => setShowJourney(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <TimelineIcon />
            Subscriber Journey
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedSubscriber && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Subscriber Info
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Email:</strong> {selectedSubscriber.subscriber.email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Name:</strong> {selectedSubscriber.subscriber.firstName} {selectedSubscriber.subscriber.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Status:</strong> {selectedSubscriber.subscriber.status}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Current Step:</strong> {selectedSubscriber.subscriber.currentStep}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Subscribed:</strong> {format(new Date(selectedSubscriber.subscriber.subscribedAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Behavior Summary
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Opens:</strong> {selectedSubscriber.behavior.opens.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Clicks:</strong> {selectedSubscriber.behavior.clicks.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Purchases:</strong> {selectedSubscriber.behavior.purchases.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Last Activity:</strong> {selectedSubscriber.behavior.lastActivity ? 
                        format(new Date(selectedSubscriber.behavior.lastActivity), 'MMM dd, yyyy HH:mm') : 
                        'Never'
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Campaign Journey Timeline
                </Typography>
                <Timeline position="alternate">
                  {selectedSubscriber.stepHistory.map((step, index) => (
                    <TimelineItem key={index}>
                      <TimelineOppositeContent color="text.secondary">
                        {step.sentAt && format(new Date(step.sentAt), 'MMM dd, HH:mm')}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={getStepStatusColor(step.status)}>
                          <EmailIcon />
                        </TimelineDot>
                        {index < selectedSubscriber.stepHistory.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Paper elevation={3} sx={{ p: 2 }}>
                          <Typography variant="h6" component="span">
                            Step {step.stepNumber}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Status: {step.status}
                          </Typography>
                          {step.openedAt && (
                            <Typography variant="body2" color="textSecondary">
                              Opened: {format(new Date(step.openedAt), 'MMM dd, HH:mm')}
                            </Typography>
                          )}
                          {step.clickedAt && (
                            <Typography variant="body2" color="textSecondary">
                              Clicked: {format(new Date(step.clickedAt), 'MMM dd, HH:mm')}
                            </Typography>
                          )}
                        </Paper>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                  
                  {selectedSubscriber.nextStep && (
                    <TimelineItem>
                      <TimelineOppositeContent color="text.secondary">
                        Next
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color="default">
                          <TrendingUpIcon />
                        </TimelineDot>
                      </TimelineSeparator>
                      <TimelineContent>
                        <Paper elevation={3} sx={{ p: 2 }}>
                          <Typography variant="h6" component="span">
                            Step {selectedSubscriber.nextStep.stepNumber}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {selectedSubscriber.nextStep.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Trigger: {selectedSubscriber.nextStep.triggers.type}
                          </Typography>
                        </Paper>
                      </TimelineContent>
                    </TimelineItem>
                  )}
                </Timeline>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJourney(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SubscriberJourneyViewer;