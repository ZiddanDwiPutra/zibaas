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
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';

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
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchFeedbacks = useCallback(async (
    currentPage: number,
    currentLimit: number,
    currentSearch: string,
    currentFilterType: string
  ) => {
    setIsListLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(currentLimit),
      });
      if (currentSearch.trim()) {
        params.set('search', currentSearch.trim());
      }
      if (currentFilterType && currentFilterType !== 'all') {
        params.set('type', currentFilterType);
      }
      const res = await fetch(`/api/v1/feedback?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch feedback list');
      const json = await res.json();
      setFeedbacks(json.data || []);
      if (json.pagination) {
        setTotalPages(json.pagination.total_pages || 1);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsListLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsListLoading(true);
    const handler = setTimeout(() => {
      fetchFeedbacks(page, pageSize, searchQuery, filterType);
    }, 250);
    return () => clearTimeout(handler);
  }, [page, pageSize, searchQuery, filterType, fetchFeedbacks]);

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
      fetchFeedbacks(1, pageSize, searchQuery, filterType);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsListLoading(true);
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setIsListLoading(true);
    setSearchQuery('');
    setPage(1);
  };

  const handleFilterTypeChange = (e: SelectChangeEvent<string>) => {
    setIsListLoading(true);
    setFilterType(e.target.value);
    setPage(1);
  };

  const handlePageSizeChange = (e: SelectChangeEvent<number>) => {
    setIsListLoading(true);
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, val: number) => {
    setIsListLoading(true);
    setPage(val);
  };

  const displayedFeedbacks = feedbacks;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, maxWidth: 900, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <RateReviewIcon sx={{ color: 'primary.main', fontSize: { xs: 28, sm: 32 } }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            User Feedback & Feature Requests
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Submit suggestions, request new features, or report bugs to help improve the system.
          </Typography>
        </Box>
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ borderRadius: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
          Submit New Feedback
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <TextField
                select
                label="Feedback Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                size="small"
                sx={{ width: { xs: '100%', sm: 200 } }}
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
                fullWidth
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
                sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 150 }, py: { xs: 1, sm: 0.75 } }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              All Submitted Feedback
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Showing {displayedFeedbacks.length} items
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1.5,
            }}
          >
            <FormControl size="small" sx={{ width: { xs: '100%', sm: 170 } }}>
              <Select
                value={filterType}
                onChange={handleFilterTypeChange}
                size="small"
                startAdornment={<FilterListIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />}
                sx={{ height: 40, fontSize: '0.85rem' }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="Saran">Saran</MenuItem>
                <MenuItem value="Request Fitur">Request Fitur</MenuItem>
                <MenuItem value="Bug Report">Bug Report</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: { xs: '100%', sm: 240 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch} sx={{ p: 0.5 }}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          </Box>
        </Box>

        {isListLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6, minHeight: 200 }}>
            <CircularProgress size={36} />
          </Box>
        ) : displayedFeedbacks.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: searchQuery || filterType !== 'all' ? 1.5 : 0 }}>
              {searchQuery || filterType !== 'all'
                ? 'No feedback matches your filter criteria.'
                : 'No feedback submitted yet. Be the first to submit!'}
            </Typography>
            {(searchQuery || filterType !== 'all') && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setIsListLoading(true);
                  setSearchQuery('');
                  setFilterType('all');
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            )}
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {displayedFeedbacks.map((item) => (
              <Accordion key={item.id} variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: { xs: 1.5, sm: 2 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 1.5,
                      width: '100%',
                      pr: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: { xs: '100%', sm: 'auto' }, gap: 1 }}>
                      <Chip
                        label={item.type}
                        size="small"
                        color={getChipColor(item.type)}
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'block', sm: 'none' } }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', flexGrow: 1, wordBreak: 'break-word' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, px: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word' }}>
                    {item.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mt: 2,
                pt: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  Show:
                </Typography>
                <FormControl size="small">
                  <Select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    size="small"
                    sx={{ height: 34, fontSize: '0.85rem' }}
                  >
                    <MenuItem value={10}>10 / page</MenuItem>
                    <MenuItem value={20}>20 / page</MenuItem>
                    <MenuItem value={30}>30 / page</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FeedbackPage;
