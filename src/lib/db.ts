import { Pool } from '@neondatabase/serverless';

interface MockColumn {
  id: number;
  table_id: number;
  column_name: string;
  column_type: string;
  is_nullable: boolean;
  references_table?: string | null;
  created_at: string;
}

interface MockTable {
  id: number;
  table_name: string;
  id_type?: 'serial' | 'uuid';
  enable_pagination?: boolean;
  page_size?: number;
  created_at: string;
}

declare global {
  var _mockDb: {
    tables: MockTable[];
    columns: MockColumn[];
    records: Record<string, any[]>;
    settings: Record<string, string>;
    tableCounter: number;
    columnCounter: number;
  } | undefined;
}

if (!globalThis._mockDb) {
  globalThis._mockDb = {
    tables: [],
    columns: [],
    records: {},
    settings: {
      'cors_allow_all': 'true',
      'cors_whitelist': '',
    },
    tableCounter: 1,
    columnCounter: 1,
  };
}

const mockDb = globalThis._mockDb;

const hasDbUrl = typeof process !== 'undefined' && !!process.env.NEON_DATABASE_URL;
const pool = hasDbUrl ? new Pool({ connectionString: process.env.NEON_DATABASE_URL }) : null;

let isInitialized = false;

async function initDb() {
  if (!pool || isInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_tables (
        id SERIAL PRIMARY KEY,
        table_name VARCHAR(255) UNIQUE NOT NULL,
        id_type VARCHAR(50) DEFAULT 'serial',
        enable_pagination BOOLEAN DEFAULT FALSE,
        page_size INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_columns (
        id SERIAL PRIMARY KEY,
        table_id INTEGER REFERENCES system_tables(id) ON DELETE CASCADE,
        column_name VARCHAR(255) NOT NULL,
        column_type VARCHAR(255) NOT NULL,
        is_nullable BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      )
    `);
    await pool.query(`
      ALTER TABLE system_columns ADD COLUMN IF NOT EXISTS references_table VARCHAR(255)
    `);
    await pool.query(`
      ALTER TABLE system_tables ADD COLUMN IF NOT EXISTS id_type VARCHAR(50) DEFAULT 'serial'
    `);
    await pool.query(`
      ALTER TABLE system_tables ADD COLUMN IF NOT EXISTS enable_pagination BOOLEAN DEFAULT FALSE
    `);
    await pool.query(`
      ALTER TABLE system_tables ADD COLUMN IF NOT EXISTS page_size INTEGER DEFAULT 10
    `);

    const settingsCheck = await pool.query("SELECT COUNT(*) FROM system_settings WHERE key = 'cors_allow_all'");
    if (parseInt(settingsCheck.rows[0]?.count || 0, 10) === 0) {
      await pool.query("INSERT INTO system_settings (key, value) VALUES ('cors_allow_all', 'true'), ('cors_whitelist', '')");
    }

    isInitialized = true;
  } catch (error) {
    console.error(error);
  }
}

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export async function query(sql: string, params: any[] = []): Promise<any> {
  if (pool) {
    await initDb();
    const res = await pool.query(sql, params);
    return { rows: res.rows };
  }

  const sqlLower = sql.toLowerCase().trim();

  if (sqlLower.startsWith('select id, id_type, enable_pagination, page_size from system_tables where table_name =')) {
    const name = params[0];
    const match = mockDb.tables.find(t => t.table_name === name);
    return { rows: match ? [match] : [] };
  }

  if (sqlLower.startsWith('select id from system_tables where table_name =')) {
    const name = params[0];
    const match = mockDb.tables.find(t => t.table_name === name);
    return { rows: match ? [match] : [] };
  }

  if (sqlLower.startsWith('select column_name from system_columns where table_id =')) {
    const tableId = params[0];
    const matches = mockDb.columns.filter(c => c.table_id === tableId);
    return { rows: matches };
  }

  if (sqlLower.startsWith('select column_name, column_type from system_columns where table_id =')) {
    const tableId = params[0];
    const matches = mockDb.columns.filter(c => c.table_id === tableId);
    return { rows: matches };
  }

  if (sqlLower.startsWith('select * from system_tables')) {
    return { rows: mockDb.tables };
  }

  if (sqlLower.startsWith('select * from system_columns where table_id =')) {
    const tableId = params[0];
    return { rows: mockDb.columns.filter(c => c.table_id === tableId) };
  }

  if (sqlLower.startsWith('select count(*)')) {
    const tableNameMatch = sql.match(/from\s+([a-zA-Z0-9_"]+)/i);
    if (tableNameMatch) {
      const rawName = tableNameMatch[1];
      const tableName = rawName.replace(/["']/g, '');
      let list = mockDb.records[tableName] || [];

      if (sqlLower.includes('ilike') && params && params.length > 0) {
        const searchKeyword = params[0].replace(/%/g, '').toLowerCase();
        const tableMeta = mockDb.tables.find(t => t.table_name === tableName);
        if (tableMeta) {
          const textCols = mockDb.columns
            .filter(c => c.table_id === tableMeta.id && c.column_type === 'text')
            .map(c => c.column_name);
          list = list.filter(row => {
            return textCols.some(col => {
              const val = row[col];
              return val && String(val).toLowerCase().includes(searchKeyword);
            });
          });
        }
      }
      return { rows: [{ count: list.length, total: list.length }] };
    }
  }

  if (sqlLower.startsWith('select * from user_') || sqlLower.startsWith('select * from "user_')) {
    const tableNameMatch = sql.match(/from\s+([a-zA-Z0-9_"]+)/i);
    if (!tableNameMatch) return { rows: [] };
    const rawName = tableNameMatch[1];
    const tableName = rawName.replace(/["']/g, '');
    let list = mockDb.records[tableName] || [];

    if (sqlLower.includes('ilike') && params && params.length > 0) {
      const searchKeyword = params[0].replace(/%/g, '').toLowerCase();
      const tableMeta = mockDb.tables.find(t => t.table_name === tableName);
      if (tableMeta) {
        const textCols = mockDb.columns
          .filter(c => c.table_id === tableMeta.id && c.column_type === 'text')
          .map(c => c.column_name);
        list = list.filter(row => {
          return textCols.some(col => {
            const val = row[col];
            return val && String(val).toLowerCase().includes(searchKeyword);
          });
        });
      }
    }

    const orderMatch = sql.match(/order\s+by\s+([a-zA-Z0-9_]+)\s+(desc|asc)/i);
    if (orderMatch) {
      const field = orderMatch[1];
      const direction = orderMatch[2].toLowerCase();
      list = [...list].sort((a, b) => {
        if (a[field] < b[field]) return direction === 'desc' ? 1 : -1;
        if (a[field] > b[field]) return direction === 'desc' ? -1 : 1;
        return 0;
      });
    }

    const limitMatch = sql.match(/limit\s+(\$\d+|\d+)/i);
    const offsetMatch = sql.match(/offset\s+(\$\d+|\d+)/i);
    
    if (limitMatch && offsetMatch && params && params.length >= 2) {
      // Find the index of limit and offset parameters
      const limitParamIdx = parseInt(limitMatch[1].replace('$', ''), 10) - 1;
      const offsetParamIdx = parseInt(offsetMatch[1].replace('$', ''), 10) - 1;
      const limit = params[limitParamIdx];
      const offset = params[offsetParamIdx];
      list = list.slice(offset, offset + limit);
    } else if (params && params.length >= 2 && sqlLower.includes('limit') && sqlLower.includes('offset')) {
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      list = list.slice(offset, offset + limit);
    }
    return { rows: list };
  }

  return { rows: [] };
}

export async function createTable(
  tableName: string,
  columns: { name: string; type: string; nullable?: boolean; referencesTable?: string }[],
  config?: { idType?: 'serial' | 'uuid'; enablePagination?: boolean; pageSize?: number }
): Promise<void> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const prefixedTable = `user_${safeName}`;
  const idType = config?.idType || 'serial';
  const enablePagination = config?.enablePagination || false;
  const pageSize = config?.pageSize || 10;

  if (pool) {
    await initDb();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tableRes = await client.query(
        'INSERT INTO system_tables (table_name, id_type, enable_pagination, page_size) VALUES ($1, $2, $3, $4) RETURNING id',
        [safeName, idType, enablePagination, pageSize]
      );
      const tableId = tableRes.rows[0].id;

      for (const col of columns) {
        await client.query(
          'INSERT INTO system_columns (table_id, column_name, column_type, is_nullable, references_table) VALUES ($1, $2, $3, $4, $5)',
          [tableId, col.name, col.type, col.nullable !== false, col.referencesTable || null]
        );
      }

      const columnDefs = await Promise.all(columns.map(async (col) => {
        let sqlDef = `"${col.name}" `;
        if (col.type === 'relation' && col.referencesTable) {
          const refRes = await client.query('SELECT id_type FROM system_tables WHERE table_name = $1', [col.referencesTable]);
          const refIdType = refRes.rows[0]?.id_type || 'serial';
          const fkType = refIdType === 'uuid' ? 'UUID' : 'INTEGER';
          sqlDef += `${fkType} REFERENCES "user_${col.referencesTable}"(id) ON DELETE SET NULL`;
        } else if (col.type === 'integer') {
          sqlDef += 'INTEGER';
        } else if (col.type === 'boolean') {
          sqlDef += 'BOOLEAN';
        } else if (col.type === 'timestamp') {
          sqlDef += 'TIMESTAMP';
        } else {
          sqlDef += 'TEXT';
        }

        if (col.nullable === false) sqlDef += ' NOT NULL';
        return sqlDef;
      }));

      const idDef = idType === 'uuid' ? 'id UUID PRIMARY KEY DEFAULT gen_random_uuid()' : 'id SERIAL PRIMARY KEY';
      const ddl = `CREATE TABLE "${prefixedTable}" (${idDef}, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ${columnDefs.join(', ')})`;
      await client.query(ddl);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return;
  }

  const existing = mockDb.tables.find(t => t.table_name === safeName);
  if (existing) throw new Error(`Table ${safeName} already exists`);

  const newTableId = mockDb.tableCounter++;
  const newTable: MockTable = {
    id: newTableId,
    table_name: safeName,
    id_type: idType,
    enable_pagination: enablePagination,
    page_size: pageSize,
    created_at: new Date().toISOString(),
  };

  mockDb.tables.push(newTable);

  for (const col of columns) {
    mockDb.columns.push({
      id: mockDb.columnCounter++,
      table_id: newTableId,
      column_name: col.name,
      column_type: col.type,
      is_nullable: col.nullable !== false,
      references_table: col.referencesTable || null,
      created_at: new Date().toISOString(),
    });
  }

  mockDb.records[prefixedTable] = [];
}

export async function dropTable(tableId: number, tableName: string): Promise<void> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const prefixedTable = `user_${safeName}`;

  if (pool) {
    await initDb();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM system_tables WHERE id = $1', [tableId]);
      await client.query(`DROP TABLE IF EXISTS "${prefixedTable}"`);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return;
  }

  mockDb.tables = mockDb.tables.filter(t => t.id !== tableId);
  mockDb.columns = mockDb.columns.filter(c => c.table_id !== tableId);
  delete mockDb.records[prefixedTable];
}

export async function insertRow(tableName: string, data: Record<string, any>): Promise<any> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const prefixedTable = `user_${safeName}`;

  if (pool) {
    const columnsConfig = await pool.query(
      `SELECT column_name FROM system_columns 
       WHERE table_id = (SELECT id FROM system_tables WHERE table_name = $1)`,
      [safeName]
    );
    const validColumns = columnsConfig.rows.map((r: any) => r.column_name);
    const fields = Object.keys(data).filter(key => validColumns.includes(key));
    const values = fields.map(key => data[key]);

    if (fields.length === 0) {
      throw new Error('No valid fields provided');
    }

    const valuePlaceholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const columnNames = fields.map(f => `"${f}"`).join(', ');
    const queryStr = `INSERT INTO "${prefixedTable}" (${columnNames}) VALUES (${valuePlaceholders}) RETURNING *`;
    const res = await pool.query(queryStr, values);
    return res.rows[0];
  }

  const tableMeta = mockDb.tables.find(t => t.table_name === safeName);
  if (!tableMeta) throw new Error(`Table ${safeName} not found`);

  const cols = mockDb.columns.filter(c => c.table_id === tableMeta.id);
  const newRow: Record<string, any> = {
    id: tableMeta.id_type === 'uuid' ? generateUuid() : mockDb.records[prefixedTable].length + 1,
    created_at: new Date().toISOString(),
  };

  for (const c of cols) {
    if (data[c.column_name] !== undefined) {
      let val = data[c.column_name];
      if (c.column_type === 'integer') val = parseInt(val, 10);
      else if (c.column_type === 'boolean') val = val === true || val === 'true';
      newRow[c.column_name] = val;
    } else {
      newRow[c.column_name] = null;
    }
  }

  mockDb.records[prefixedTable].push(newRow);
  return newRow;
}

export async function updateRow(tableName: string, id: any, data: Record<string, any>): Promise<any> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const prefixedTable = `user_${safeName}`;

  if (pool) {
    const columnsConfig = await pool.query(
      `SELECT column_name FROM system_columns 
       WHERE table_id = (SELECT id FROM system_tables WHERE table_name = $1)`,
      [safeName]
    );
    const validColumns = columnsConfig.rows.map((r: any) => r.column_name);
    const fields = Object.keys(data).filter(key => validColumns.includes(key));
    const values = fields.map(key => data[key]);

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClauses = fields.map((f, i) => `"${f}" = $${i + 1}`).join(', ');
    const queryStr = `UPDATE "${prefixedTable}" SET ${setClauses} WHERE id = $${fields.length + 1} RETURNING *`;
    const res = await pool.query(queryStr, [...values, id]);
    return res.rows[0];
  }

  const tableMeta = mockDb.tables.find(t => t.table_name === safeName);
  if (!tableMeta) throw new Error(`Table ${safeName} not found`);

  const list = mockDb.records[prefixedTable] || [];
  const index = list.findIndex(r => String(r.id) === String(id));
  if (index === -1) throw new Error(`Row with id ${id} not found`);

  const cols = mockDb.columns.filter(c => c.table_id === tableMeta.id);
  const updatedRow = { ...list[index] };

  for (const c of cols) {
    if (data[c.column_name] !== undefined) {
      let val = data[c.column_name];
      if (c.column_type === 'integer') val = parseInt(val, 10);
      else if (c.column_type === 'boolean') val = val === true || val === 'true';
      updatedRow[c.column_name] = val;
    }
  }

  list[index] = updatedRow;
  return updatedRow;
}

export async function deleteRow(tableName: string, id: any): Promise<void> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const prefixedTable = `user_${safeName}`;

  if (pool) {
    await pool.query(`DELETE FROM "${prefixedTable}" WHERE id = $1`, [id]);
    return;
  }

  if (mockDb.records[prefixedTable]) {
    mockDb.records[prefixedTable] = mockDb.records[prefixedTable].filter(r => String(r.id) !== String(id));
  }
}

export async function getSetting(key: string): Promise<string> {
  if (pool) {
    await initDb();
    const res = await pool.query('SELECT value FROM system_settings WHERE key = $1', [key]);
    return res.rows[0]?.value || '';
  }
  return mockDb.settings[key] || '';
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (pool) {
    await initDb();
    await pool.query(
      'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, value]
    );
    return;
  }
  mockDb.settings[key] = value;
}
