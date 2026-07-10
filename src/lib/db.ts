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
  created_at: string;
}

declare global {
  var _mockDb: {
    tables: MockTable[];
    columns: MockColumn[];
    records: Record<string, any[]>;
    tableCounter: number;
    columnCounter: number;
  } | undefined;
}

if (!globalThis._mockDb) {
  globalThis._mockDb = {
    tables: [],
    columns: [],
    records: {},
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
      ALTER TABLE system_columns ADD COLUMN IF NOT EXISTS references_table VARCHAR(255)
    `);
    isInitialized = true;
  } catch (error) {
    console.error(error);
  }
}

export async function query(sql: string, params: any[] = []): Promise<any> {
  if (pool) {
    await initDb();
    const res = await pool.query(sql, params);
    return { rows: res.rows };
  }

  const sqlLower = sql.toLowerCase().trim();

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

  if (sqlLower.startsWith('select * from user_') || sqlLower.startsWith('select * from "user_')) {
    const tableNameMatch = sql.match(/from\s+([a-zA-Z0-9_]+)/i);
    if (!tableNameMatch) return { rows: [] };
    const tableName = tableNameMatch[1];
    let list = mockDb.records[tableName] || [];
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
    return { rows: list };
  }

  return { rows: [] };
}

export async function createTable(
  tableName: string,
  columns: { name: string; type: string; nullable?: boolean; referencesTable?: string }[]
): Promise<void> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const prefixedTable = `user_${safeName}`;

  if (pool) {
    await initDb();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tableRes = await client.query(
        'INSERT INTO system_tables (table_name) VALUES ($1) RETURNING id',
        [safeName]
      );
      const tableId = tableRes.rows[0].id;

      for (const col of columns) {
        await client.query(
          'INSERT INTO system_columns (table_id, column_name, column_type, is_nullable, references_table) VALUES ($1, $2, $3, $4, $5)',
          [tableId, col.name, col.type, col.nullable !== false, col.referencesTable || null]
        );
      }

      const columnDefs = columns.map(col => {
        let sqlDef = `"${col.name}" `;
        if (col.type === 'relation' && col.referencesTable) {
          sqlDef += `INTEGER REFERENCES "user_${col.referencesTable}"(id) ON DELETE SET NULL`;
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
      });

      const ddl = `CREATE TABLE "${prefixedTable}" (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ${columnDefs.join(', ')})`;
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
    id: mockDb.records[prefixedTable].length + 1,
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

export async function updateRow(tableName: string, id: number, data: Record<string, any>): Promise<any> {
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
  const index = list.findIndex(r => r.id === id);
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

export async function deleteRow(tableName: string, id: number): Promise<void> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const prefixedTable = `user_${safeName}`;

  if (pool) {
    await pool.query(`DELETE FROM "${prefixedTable}" WHERE id = $1`, [id]);
    return;
  }

  if (mockDb.records[prefixedTable]) {
    mockDb.records[prefixedTable] = mockDb.records[prefixedTable].filter(r => r.id !== id);
  }
}
