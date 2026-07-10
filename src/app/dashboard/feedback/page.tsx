'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Pagination from '@mui/material/Pagination';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RateReviewIcon from '@mui/icons-material/RateReview';

interface FeedbackItem {
  id: number;
  title: string;
  type: string;
  description: string;
  created_at: string;
}

const FeedbackPage = () => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Saran');
  const [description, setDescription] = useState('');
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFeedbacks = useCallback(async (currentPage: number) => {
    try {
      const res = await fetch(`/api/v1/feedback?page=${currentPage}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch feedback list');
      const json = await res.json();
      setFeedbacks(json.data || []);
      if (json.pagination) {
        setTotalPages(json.pagination.total_pages || 1);
      }
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks(page);
  }, [page, fetchFeedbacks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setAlert({ type: 'error', message: 'All fields are required' });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), type, description: description.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit feedback');
      }

      setAlert({ type: 'success', message: 'Thank you! Your feedback has been submitted.' });
      setTitle('');
      setDescription('');
      setPage(1);
      fetchFeedbacks(1);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChipColor = (feedbackType: string) => {
    switch (feedbackType) {
      case 'Bug Report':
        return 'error';
      case 'Request Fitur':
        return 'warning';
      default:
        return 'success';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 850, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <RateReviewIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            User Feedback & Feature Requests
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Submit suggestions, request new features, or report bugs to help improve the system.
          </Typography>
        </Box>
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ borderRadius: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Feedback Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="Saran">Saran</MenuItem>
                <MenuItem value="Request Fitur">Request Fitur</MenuItem>
                <MenuItem value="Bug Report">Bug Report</MenuItem>
              </TextField>

              <TextField
                label="Judul Feedback"
                placeholder="e.g. Tambahkan integrasi dengan Redis"
                variant="outlined"
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                sx={{ flexGrow: 1 }}
              />
            </Box>

            <TextField
              multiline
              rows={4}
              label="Deskripsikan"
              placeholder="Berikan detail penjelasan mengenai saran atau request fitur Anda..."
              variant="outlined"
              size="small"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                sx={{ minWidth: 150 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
          All Submitted Feedback
        </Typography>

        {feedbacks.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textPosition: 'center', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              No feedback submitted yet. Be the first to submit!
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {feedbacks.map((item) => (
              <Accordion key={item.id} variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: '100%', pr: 2 }}>
                    <Chip
                      label={item.type}
                      size="small"
                      color={getChipColor(item.type)}
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', flexGrow: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {item.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, val) => setPage(val)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FeedbackPage;
