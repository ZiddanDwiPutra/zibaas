'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import HubIcon from '@mui/icons-material/Hub';
import SecurityIcon from '@mui/icons-material/Security';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import GroupIcon from '@mui/icons-material/Group';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useProjectStore } from '@/lib/store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ws-guide-tabpanel-${index}`}
      aria-labelledby={`ws-guide-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const WSGuidePage = () => {
  const { themeMode } = useProjectStore();
  const [tabVal, setTabVal] = useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 950, mx: 'auto' }}>
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: themeMode === 'light' ? '#202124' : '#f5f5f4',
          }}
        >
          WSStore User Guide & Architecture
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
            mt: 0.5,
          }}
        >
          Pelajari konsep Channel Types, Access Control, Event Triggers, dan cara menghubungkan client WebSocket.
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
          border: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tabVal}
          onChange={(_, val) => setTabVal(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
            px: 2,
            bgcolor: themeMode === 'light' ? '#f8f9fa' : '#181614',
          }}
        >
          <Tab
            icon={<HubIcon fontSize="small" />}
            iconPosition="start"
            label="Channel Types"
            sx={{
              fontSize: '0.85rem',
              fontWeight: 600,
              minHeight: 48,
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              '&.Mui-selected': {
                color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
              },
            }}
          />
          <Tab
            icon={<SecurityIcon fontSize="small" />}
            iconPosition="start"
            label="Access Control"
            sx={{
              fontSize: '0.85rem',
              fontWeight: 600,
              minHeight: 48,
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              '&.Mui-selected': {
                color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
              },
            }}
          />
          <Tab
            icon={<FlashOnIcon fontSize="small" />}
            iconPosition="start"
            label="Event Triggers"
            sx={{
              fontSize: '0.85rem',
              fontWeight: 600,
              minHeight: 48,
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              '&.Mui-selected': {
                color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
              },
            }}
          />
          <Tab
            icon={<CodeIcon fontSize="small" />}
            iconPosition="start"
            label="Client Integration"
            sx={{
              fontSize: '0.85rem',
              fontWeight: 600,
              minHeight: 48,
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              '&.Mui-selected': {
                color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
              },
            }}
          />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={tabVal} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
                }}
              >
                📡 Memahami Tipe-Tipe Channel (Channel Types)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: themeMode === 'light' ? '#3c4043' : '#d7ccc8',
                  lineHeight: 1.7,
                }}
              >
                Channel adalah jalur komunikasi streaming real-time terisolasi. WSStore menyediakan 4 model channel yang disesuaikan untuk berbagai kebutuhan aplikasi:
              </Typography>

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      bgcolor: themeMode === 'light' ? '#ffffff' : '#181614',
                      borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <StorageIcon sx={{ color: '#1a73e8' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeMode === 'light' ? '#202124' : '#f5f5f4' }}>
                          Table Watcher (CDC)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', lineHeight: 1.6 }}>
                        <strong>Change Data Capture (CDC):</strong> Memantau mutasi pada tabel database pilihan Anda secara real-time. Ketika ada aksi <em>INSERT</em>, <em>UPDATE</em>, atau <em>DELETE</em>, event payload akan langsung dikirim ke seluruh frontend listener tanpa polling.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      bgcolor: themeMode === 'light' ? '#ffffff' : '#181614',
                      borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <DynamicFeedIcon sx={{ color: '#34a853' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeMode === 'light' ? '#202124' : '#f5f5f4' }}>
                          Pub/Sub Broadcaster
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', lineHeight: 1.6 }}>
                        <strong>Publish / Subscribe Bebas:</strong> Channel untuk menyiarkan pesan kustom dari satu pengirim ke banyak penerima. Sangat ideal untuk ruang obrolan (chat), notifikasi siaran global, atau feed berita dinamis.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      bgcolor: themeMode === 'light' ? '#ffffff' : '#181614',
                      borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <GroupIcon sx={{ color: '#ea4335' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeMode === 'light' ? '#202124' : '#f5f5f4' }}>
                          Presence & Status
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', lineHeight: 1.6 }}>
                        <strong>Pelacakan Kehadiran:</strong> Mendeteksi siapa saja pengguna yang sedang online, bergabung ke room, berpindah status, atau sedang mengetik (typing indicators) secara real-time.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      bgcolor: themeMode === 'light' ? '#ffffff' : '#181614',
                      borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <SwapHorizIcon sx={{ color: '#fbbc04' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeMode === 'light' ? '#202124' : '#f5f5f4' }}>
                          Direct P2P Relay
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', lineHeight: 1.6 }}>
                        <strong>Pesan Langsung & WebRTC Signaling:</strong> Meneruskan pesan privat atau paket negosiasi SDP/ICE candidate antara dua sesi klien tertentu secara cepat dan aman.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabVal} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
                }}
              >
                🔒 Kontrol Akses & Keamanan (Access Control)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: themeMode === 'light' ? '#3c4043' : '#d7ccc8',
                  lineHeight: 1.7,
                }}
              >
                Access Control menentukan izin siapa saja yang dapat melakukan handshake koneksi WebSocket dan menerbitkan frame data ke channel:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    bgcolor: themeMode === 'light' ? '#f8f9fa' : '#181614',
                    borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeMode === 'light' ? '#202124' : '#f5f5f4', mb: 0.5 }}>
                    1. Authenticated Session Only (Direkomendasikan untuk Data Sensitif)
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', lineHeight: 1.6 }}>
                    Klien wajib menyertakan cookie sesi login yang valid atau API Key (<code>ZIBAAS_API_KEY</code>) saat inisiasi koneksi WSS. Koneksi yang tidak terotentikasi akan ditolak dengan kode 401/403.
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    bgcolor: themeMode === 'light' ? '#f8f9fa' : '#181614',
                    borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeMode === 'light' ? '#202124' : '#f5f5f4', mb: 0.5 }}>
                    2. Public Read-Only
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', lineHeight: 1.6 }}>
                    Siapa pun dari frontend publik dapat menyambung dan mendengarkan event stream, namun klien publik tidak diizinkan mengirim pesan atau mutasi kembali ke channel.
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    bgcolor: themeMode === 'light' ? '#f8f9fa' : '#181614',
                    borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeMode === 'light' ? '#202124' : '#f5f5f4', mb: 0.5 }}>
                    3. Public Read & Write
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', lineHeight: 1.6 }}>
                    Koneksi terbuka penuh. Semua klien dapat mendengarkan serta mempublikasikan pesan frame secara bebas. Cocok untuk demo cepat atau simulasi sandbox.
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabVal} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
                }}
              >
                ⚡ Trigger Event Database (Event Triggers)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: themeMode === 'light' ? '#3c4043' : '#d7ccc8',
                  lineHeight: 1.7,
                }}
              >
                Pada tipe channel <strong>Table Watcher (CDC)</strong>, Anda dapat memilih jenis mutasi database mana yang akan memicu pengiriman event frame ke client:
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: themeMode === 'light' ? '#f8f9fa' : '#181614', borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#137333', mb: 0.5 }}>
                      INSERT
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', fontSize: '0.85rem' }}>
                      Memicu event saat baris data baru ditambahkan ke tabel. Mengirimkan seluruh kolom dari data baru tersebut.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: themeMode === 'light' ? '#f8f9fa' : '#181614', borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a73e8', mb: 0.5 }}>
                      UPDATE
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', fontSize: '0.85rem' }}>
                      Memicu event saat baris data diubah. Mengirimkan data sebelum dan sesudah perubahan.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: themeMode === 'light' ? '#f8f9fa' : '#181614', borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#c5221f', mb: 0.5 }}>
                      DELETE
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', fontSize: '0.85rem' }}>
                      Memicu event saat baris data dihapus dari database. Mengirimkan ID baris yang dihapus.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: themeMode === 'light' ? '#f8f9fa' : '#181614', borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b06000', mb: 0.5 }}>
                      Custom RPC Events
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', fontSize: '0.85rem' }}>
                      Menerima dan menyiarkan event trigger khusus aplikasi (misal: tombol klik darurat, reset cache, webhook eksternal).
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabVal} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
                }}
              >
                💻 Contoh Integrasi Client (JavaScript / React)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: themeMode === 'light' ? '#3c4043' : '#d7ccc8',
                  lineHeight: 1.7,
                }}
              >
                Menghubungkan aplikasi web atau mobile ke channel WebSocket WSStore sangat sederhana menggunakan standar native <code>WebSocket</code> API:
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  bgcolor: themeMode === 'light' ? '#f8f9fa' : '#121212',
                  borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  overflowX: 'auto',
                  color: themeMode === 'light' ? '#202124' : '#e0e0e0',
                }}
              >
                <pre style={{ margin: 0 }}>
{`const socket = new WebSocket('ws://localhost:3000/api/v1/ws?channel=stream:orders');

socket.onopen = () => {
  console.log('Connected to WSStore channel');
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time event received:', data);
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

socket.onclose = () => {
  console.log('Disconnected from stream');
};`}
                </pre>
              </Paper>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default WSGuidePage;
