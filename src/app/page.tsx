'use client';

import React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ZapIcon from '@mui/icons-material/FlashOn';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';

const HomePage = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Paper
        elevation={0}
        sx={{
          borderBottom: '1px solid #dadce0',
          bgcolor: '#ffffff',
          py: 1.5,
          px: { xs: 2, sm: 4 },
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudQueueIcon sx={{ color: '#1a73e8' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#202124' }}>
              Zibaas Console
            </Typography>
          </Box>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" size="small" sx={{ color: '#1a73e8', borderColor: '#dadce0' }}>
              Go to Console
            </Button>
          </Link>
        </Box>
      </Paper>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 6, sm: 8 },
          px: { xs: 2.5, sm: 3 },
          textAlign: 'center',
        }}
      >
        <Box sx={{ maxWidth: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              color: '#202124',
              lineHeight: 1.2,
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
            }}
          >
            Deploy Relational Database REST APIs in Seconds
          </Typography>

          <Typography variant="body1" sx={{ color: '#5f6368', maxWidth: 600, fontSize: { xs: '0.95rem', sm: '1.1rem' }, lineHeight: 1.6 }}>
            A developer platform to build instant backend routes, schemas, and spreadsheet browsers powered by Next.js and Neon Postgres.
          </Typography>

          <Link href="/dashboard" style={{ textDecoration: 'none', width: '100%', maxWidth: 300 }}>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              size="large"
              sx={{ bgcolor: '#1a73e8', py: 1.5, px: 4, width: '100%', mt: 1 }}
            >
              Enter Console Dashboard
            </Button>
          </Link>
        </Box>

        <Box sx={{ maxWidth: 1000, width: '100%', mt: { xs: 6, sm: 8 } }}>
          <Divider sx={{ mb: { xs: 4, sm: 6 } }} />
          <Grid container spacing={{ xs: 2, sm: 4 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined" sx={{ textAlign: 'left', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: { xs: 2, sm: 2.5 } }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: '#e8f0fe',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1a73e8',
                    }}
                  >
                    <ZapIcon />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#202124' }}>
                    Instant Deployment
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5f6368', lineHeight: 1.5 }}>
                    Compile physical Postgres tables and hook up REST paths instantly without migrations.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined" sx={{ textAlign: 'left', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: { xs: 2, sm: 2.5 } }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: '#e8f0fe',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1a73e8',
                    }}
                  >
                    <CodeIcon />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#202124' }}>
                    Unified Catch-All Rest
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5f6368', lineHeight: 1.5 }}>
                    Expose standardized CRUD routes with strict column structures and data validations.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined" sx={{ textAlign: 'left', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: { xs: 2, sm: 2.5 } }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: '#e8f0fe',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1a73e8',
                    }}
                  >
                    <SecurityIcon />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#202124' }}>
                    Sandboxed Identifiers
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5f6368', lineHeight: 1.5 }}>
                    Secure custom SQL identifier sanitization prevents any SQL Injection vulnerabilities.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Box
        sx={{
          py: 3,
          px: 2,
          textAlign: 'center',
          borderTop: '1px solid #dadce0',
          bgcolor: '#ffffff',
          color: '#5f6368',
          fontSize: '0.75rem',
        }}
      >
        © 2026 Zibaas Console. Powered by Next.js &amp; Neon Serverless Cloud.
      </Box>
    </Box>
  );
};

export default HomePage;
