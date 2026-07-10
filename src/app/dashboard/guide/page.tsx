'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import LoginIcon from '@mui/icons-material/Login';
import AddBoxIcon from '@mui/icons-material/AddBox';
import TableChartIcon from '@mui/icons-material/TableChart';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import PowerIcon from '@mui/icons-material/Power';

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

export default function GuidePage() {
  const [tabVal, setTabVal] = useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 900, mx: 'auto' }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Console Documentation & Guide
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Learn how to generate dynamic schemas and integrate APIs in your applications.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
        <Tabs
          value={tabVal}
          onChange={(_, val) => setTabVal(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label="Bahasa Indonesia" sx={{ fontSize: '0.85rem', fontWeight: 600 }} />
          <Tab label="English" sx={{ fontSize: '0.85rem', fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ p: 4 }}>
          <TabPanel value={tabVal} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Panduan Penggunaan Zibaas No-Code Engine
              </Typography>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><LoginIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Langkah 1: Masuk Ke Konsol
                    </Typography>
                    
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><AddBoxIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Langkah 2: Buat Skema Tabel Baru
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
                      Buka menu <strong>Create Table</strong> di navigasi samping. Masukkan nama tabel (hanya huruf dan angka) dan tentukan kolom-kolom data yang Anda inginkan (Text, Number, Boolean, atau Timestamp). Klik <strong>Deploy API</strong> untuk mengompilasi rute API Anda secara instan.
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><TableChartIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Langkah 3: Kelola Data (Spreadsheet Browser)
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
                      Setelah tabel dibuat, klik <strong>Data Browser</strong> di dashboard. Anda akan melihat antarmuka spreadsheet dinamis untuk memasukkan baris baru secara visual, mengubah isi sel secara langsung (inline editing), serta menghapus rekaman data.
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><IntegrationInstructionsIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Langkah 4: Integrasikan Endpoint REST API
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
                      Salin URL REST API dinamis yang tersedia di dashboard (misalnya <code>/api/v1/products</code>). Anda dapat melakukan request berikut:
                      <br />
                      - <code>GET /api/v1/{"{nama_tabel}"}</code> untuk mengambil list data (semua baris).
                      <br />
                      - <code>GET /api/v1/{"{nama_tabel}"}/{"{id}"}</code> untuk mengambil satu data spesifik per ID.
                      <br />
                      - <code>POST /api/v1/{"{nama_tabel}"}</code> untuk memasukkan data baru.
                      <br />
                      - <code>PUT /api/v1/{"{nama_tabel}"}/{"{id}"}</code> untuk mengubah data per ID.
                      <br />
                      - <code>DELETE /api/v1/{"{nama_tabel}"}/{"{id}"}</code> untuk menghapus data per ID.
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><PowerIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Langkah 5: Hubungkan ke Database Neon Cloud
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
                      Untuk memindahkan penyimpanan dari memori lokal (sandbox) ke cloud server Postgres, buat file <code>.env</code> di direktori root dan masukkan URL koneksi Neon database Anda:
                      <br />
                      <code>NEON_DATABASE_URL=&quot;postgresql://user:password@host/dbname?sslmode=require&quot;</code>
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabVal} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Zibaas No-Code Engine User Manual
              </Typography>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><LoginIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Step 1: Authenticate Console
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
                      Use the default system credentials to log in:
                      
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><AddBoxIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Step 2: Generate Table Schemas
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
                      Click on the <strong>Create Table</strong> menu item in the sidebar. Set a table name (alphanumeric only) and specify column nodes (Text, Number, Boolean, or Timestamp). Click <strong>Deploy API</strong> to compile your endpoint route immediately.
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><TableChartIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Step 3: Browse and Modify Rows
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
                      Go to the <strong>Data Browser</strong> panel next to your deployed tables. An interactive spreadsheet-like workspace lets you insert records, edit cells inline, and delete rows directly.
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><IntegrationInstructionsIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Step 4: Integrate REST APIs
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
                      Copy the custom API path shown on the dashboard (e.g. <code>/api/v1/products</code>) to hit CRUD actions from your codebases:
                      <br />
                      - <code>GET /api/v1/{"{table_name}"}</code>: Read all data rows.
                      <br />
                      - <code>GET /api/v1/{"{table_name}"}/{"{id}"}</code>: Read a single row by ID.
                      <br />
                      - <code>POST /api/v1/{"{table_name}"}</code>: Create a new row.
                      <br />
                      - <code>PUT /api/v1/{"{table_name}"}/{"{id}"}</code>: Edit a row by ID.
                      <br />
                      - <code>DELETE /api/v1/{"{table_name}"}/{"{id}"}</code>: Remove a row by ID.
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}><PowerIcon /></Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Step 5: Connect Neon Database URL
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
                      Move storage from memory sandboxing to cloud servers. Simply write your connection string inside a local <code>.env</code> file:
                      <br />
                      <code>NEON_DATABASE_URL=&quot;postgresql://user:password@host/dbname?sslmode=require&quot;</code>
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
