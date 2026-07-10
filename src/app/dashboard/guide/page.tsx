'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import SchemaIcon from '@mui/icons-material/Schema';
import ApiIcon from '@mui/icons-material/Api';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';

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
      id={`guide-tabpanel-${index}`}
      aria-labelledby={`guide-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const GuidePage = () => {
  const [tabVal, setTabVal] = useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 950, mx: 'auto' }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Interactive User Guide
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Master schema designs, API integration, CORS policies, and search configurations.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper', overflow: 'hidden' }}>
        <Tabs
          value={tabVal}
          onChange={(_, val) => setTabVal(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, bgcolor: 'background.paper' }}
        >
          <Tab icon={<SchemaIcon fontSize="small" />} iconPosition="start" label="Schema Wizard" sx={{ fontSize: '0.85rem', fontWeight: 600, minHeight: 48 }} />
          <Tab icon={<ApiIcon fontSize="small" />} iconPosition="start" label="CRUD REST APIs" sx={{ fontSize: '0.85rem', fontWeight: 600, minHeight: 48 }} />
          <Tab icon={<SearchIcon fontSize="small" />} iconPosition="start" label="Search & Pagination" sx={{ fontSize: '0.85rem', fontWeight: 600, minHeight: 48 }} />
          <Tab icon={<SecurityIcon fontSize="small" />} iconPosition="start" label="CORS Whitelist" sx={{ fontSize: '0.85rem', fontWeight: 600, minHeight: 48 }} />
          <Tab icon={<StorageIcon fontSize="small" />} iconPosition="start" label="Database Storage" sx={{ fontSize: '0.85rem', fontWeight: 600, minHeight: 48 }} />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={tabVal} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                🏗️ Designing Table Schemas
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                ZiBaaS menyediakan wizard no-code untuk membangun tabel database kustom secara instan tanpa menulis skrip SQL DDL.
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                      Auto-Increment (SERIAL)
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      Tipe ID numerik yang otomatis bertambah (1, 2, 3, dst.) setiap kali data baru dimasukkan. Cocok untuk tabel internal, data sederhana, atau relasi ID terurut.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                      UUID (v4)
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      ID unik global berformat string acak 36-karakter (misal: <code>d3b07384-d113-4ec6-a5d6-c875d688cf41</code>). Sangat disarankan untuk sistem terdistribusi, keamanan tinggi agar ID tidak mudah ditebak, dan integrasi frontend.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabVal} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                🔌 RESTful API Integration
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                Setiap tabel yang Anda buat akan langsung memetakan rute endpoint RESTful yang siap dipanggil dari kode backend atau frontend Anda.
              </Typography>

              <Paper variant="outlined" sx={{ p: 3, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  HTTP Request Methods
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="body2">
                    <code>GET /api/v1/{"{table_name}"}</code> — Mengambil semua baris data dari tabel.
                  </Typography>
                  <Typography variant="body2">
                    <code>GET /api/v1/{"{table_name}"}/{"{id}"}</code> — Mengambil satu baris data spesifik berdasarkan ID.
                  </Typography>
                  <Typography variant="body2">
                    <code>POST /api/v1/{"{table_name}"}</code> — Menyimpan baris data baru (kirim JSON body sesuai kolom).
                  </Typography>
                  <Typography variant="body2">
                    <code>PUT /api/v1/{"{table_name}"}/{"{id}"}</code> — Memperbarui data yang sudah ada berdasarkan ID.
                  </Typography>
                  <Typography variant="body2">
                    <code>DELETE /api/v1/{"{table_name}"}/{"{id}"}</code> — Menghapus baris data permanen berdasarkan ID.
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </TabPanel>

          <TabPanel value={tabVal} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                🔍 Search & Pagination Settings
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                Mengelola data berskala besar menjadi mudah dengan fitur pencarian teks dan batasan halaman otomatis.
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Fuzzy Search
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2 }}>
                      Gunakan parameter <code>?search=kata_kunci</code> untuk melakukan pencarian kata kunci secara case-insensitive pada semua kolom teks sekaligus.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', bgcolor: 'action.selected', p: 1, borderRadius: 1 }}>
                      GET /api/v1/products?search=macbook
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      API Pagination
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2 }}>
                      Aktifkan opsi pagination saat membuat tabel untuk membagi hasil query per halaman menggunakan parameter <code>page</code> dan <code>limit</code>.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', bgcolor: 'action.selected', p: 1, borderRadius: 1 }}>
                      GET /api/v1/products?page=1&limit=10
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabVal} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                🛡️ CORS Whitelist Rules
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                CORS (Cross-Origin Resource Sharing) mengontrol asal usul domain aplikasi frontend yang diizinkan untuk mengakses resource backend API Anda dari web browser.
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Allow All Origins (*)
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      Memperbolehkan semua aplikasi web eksternal dari domain mana pun untuk memanggil API Gateway Anda secara bebas. Sangat berguna untuk pengujian lokal cepat.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Origin Domain Whitelist
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      Membatasi panggilan API hanya dari domain tertentu yang sudah Anda whitelist (misal: <code>https://my-app.com</code>). Browser akan memblokir request di luar daftar tersebut.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabVal} index={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                ☁️ Database Storage & Connections
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                ZiBaaS mendukung penyimpanan lokal cepat di memori (sandbox) atau koneksi langsung ke server database Postgres cloud production (seperti Neon Database).
              </Typography>

              <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Environment Variables Setup
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  Buat file <code>.env</code> di direktori root aplikasi ZiBaaS untuk mengonfigurasi string koneksi cloud database Anda:
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', bgcolor: 'action.selected', p: 1.5, borderRadius: 1, fontFamily: 'monospace' }}>
                  NEON_DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
                </Typography>
              </Paper>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default GuidePage;
