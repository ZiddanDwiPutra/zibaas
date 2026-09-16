'use client';

import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import SchemaIcon from '@mui/icons-material/Schema';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ApiIcon from '@mui/icons-material/Api';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ClearIcon from '@mui/icons-material/Clear';
import userGuides from '@/data/user_guide.json';

interface GuideItem {
  title: string;
  description: string;
  example?: string;
}

interface EndpointItem {
  method: string;
  path: string;
  description: string;
}

interface GuideSection {
  id: string;
  icon: string;
  tag: string;
  title: string;
  description: string;
  items?: GuideItem[];
  endpoints?: EndpointItem[];
}

const getSectionIcon = (iconName: string) => {
  switch (iconName) {
    case 'schema':
      return <SchemaIcon sx={{ color: 'primary.main', fontSize: 24 }} />;
    case 'account_tree':
      return <AccountTreeIcon sx={{ color: 'primary.main', fontSize: 24 }} />;
    case 'api':
      return <ApiIcon sx={{ color: 'primary.main', fontSize: 24 }} />;
    case 'search':
      return <SearchIcon sx={{ color: 'primary.main', fontSize: 24 }} />;
    case 'security':
      return <SecurityIcon sx={{ color: 'primary.main', fontSize: 24 }} />;
    case 'storage':
      return <StorageIcon sx={{ color: 'primary.main', fontSize: 24 }} />;
    default:
      return <MenuBookIcon sx={{ color: 'primary.main', fontSize: 24 }} />;
  }
};

const getMethodColor = (method: string): 'success' | 'primary' | 'warning' | 'error' | 'default' => {
  switch (method) {
    case 'GET':
      return 'primary';
    case 'POST':
      return 'success';
    case 'PUT':
      return 'warning';
    case 'DELETE':
      return 'error';
    default:
      return 'default';
  }
};

const matchesQuery = (text: string | undefined, query: string): boolean => {
  if (!text) return false;
  return text.toLowerCase().includes(query);
};

const filterGuideSection = (section: GuideSection, query: string): boolean => {
  const q = query.toLowerCase();
  if (matchesQuery(section.title, q) || matchesQuery(section.tag, q) || matchesQuery(section.description, q)) {
    return true;
  }
  if (section.items?.some(item => matchesQuery(item.title, q) || matchesQuery(item.description, q) || matchesQuery(item.example, q))) {
    return true;
  }
  if (section.endpoints?.some(ep => matchesQuery(ep.method, q) || matchesQuery(ep.path, q) || matchesQuery(ep.description, q))) {
    return true;
  }
  return false;
};

const EndpointList = ({ endpoints }: { endpoints: EndpointItem[] }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
      {endpoints.map((ep, idx) => (
        <Paper
          key={idx}
          variant="outlined"
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            bgcolor: 'action.hover',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: { sm: 280 } }}>
            <Chip
              label={ep.method}
              size="small"
              color={getMethodColor(ep.method)}
              sx={{ fontWeight: 700, fontSize: '0.75rem', minWidth: 60 }}
            />
            <Typography
              variant="body2"
              component="code"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'text.primary',
                wordBreak: 'break-all',
              }}
            >
              {ep.path}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
            {ep.description}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};

const GuideItemList = ({ items }: { items: GuideItem[] }) => {
  return (
    <Grid container spacing={2} sx={{ mt: 0.5 }}>
      {items.map((item, idx) => (
        <Grid key={idx} size={{ xs: 12, md: items.length === 1 ? 12 : 6 }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 1.5,
              bgcolor: 'background.paper',
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.75 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {item.description}
              </Typography>
            </Box>
            {item.example && (
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: 'action.selected',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="caption"
                  component="code"
                  sx={{
                    fontFamily: 'monospace',
                    color: 'primary.main',
                    fontWeight: 600,
                    display: 'block',
                    wordBreak: 'break-all',
                  }}
                >
                  {item.example}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

const GuideCard = ({ section }: { section: GuideSection }) => {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                {getSectionIcon(section.icon)}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {section.title}
              </Typography>
            </Box>
            <Chip
              label={section.tag}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
            {section.description}
          </Typography>

          {section.endpoints && <EndpointList endpoints={section.endpoints} />}
          {section.items && <GuideItemList items={section.items} />}
        </Box>
      </CardContent>
    </Card>
  );
};

const GuidePage = () => {
  const guideList = userGuides as GuideSection[];
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGuides = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return guideList;
    return guideList.filter(section => filterGuideSection(section, trimmed));
  }, [guideList, searchQuery]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, maxWidth: 950, mx: 'auto', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MenuBookIcon sx={{ color: 'primary.main', fontSize: { xs: 28, sm: 32 } }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              User Guide & Documentation
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Panduan lengkap desain skema database, relasi foreign key, integrasi REST API, search, pagination, dan konfigurasi CORS.
            </Typography>
          </Box>
        </Box>

        <TextField
          size="small"
          placeholder="Cari panduan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', md: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.5 }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Box>

      {filteredGuides.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Tidak ada panduan yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
          </Typography>
          <Button size="small" variant="outlined" onClick={() => setSearchQuery('')}>
            Reset Pencarian
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {filteredGuides.map((section) => (
            <GuideCard key={section.id} section={section} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default GuidePage;
