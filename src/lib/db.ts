import { Pool } from '@neondatabase/serverless';

interface MockColumn {
  id: number;
  table_id: number;
  column_name: string;
  column_type: string;
  is_nullable: boolean;
  is_unique?: boolean;
  references_table?: string | null;
  created_at: string;
}

export interface ServiceFilter {
  column: string;
  source: 'auth' | 'path' | 'query';
  param_name?: string; // name of path parameter or query parameter
  operator?: '=' | 'ILIKE' | '>' | '<' | '>=' | '<=';
}

export interface UpdateRule {
  allowed_fields?: string[]; // Column names that client payload is allowed to update
  fixed_fields?: Record<string, any>; // Static values always applied on update (e.g. status: 'done')
}

export interface MockService {
  id: number;
  table_id: number;
  service_name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description?: string;
  require_auth: boolean;
  filters: ServiceFilter[];
  update_rule?: UpdateRule;
  created_at: string;
}

export interface AllowedEndpoints {
  allow_get_list: boolean;
  allow_get_id: boolean;
  allow_post: boolean;
  allow_put: boolean;
  allow_delete: boolean;
}

export const DEFAULT_ALLOWED_ENDPOINTS: AllowedEndpoints = {
  allow_get_list: true,
  allow_get_id: true,
  allow_post: true,
  allow_put: true,
  allow_delete: true,
};

interface MockTable {
  id: number;
  table_name: string;
  id_type?: 'serial' | 'uuid';
  enable_pagination?: boolean;
  page_size?: number;
  enable_auth?: boolean;
  user_id_column?: string | null;
  allowed_endpoints?: AllowedEndpoints;
  created_at: string;
}

declare global {
  var _mockDb: {
    tables: MockTable[];
    columns: MockColumn[];
    services: MockService[];
    records: Record<string, any[]>;
    settings: Record<string, string>;
    tableCounter: number;
    columnCounter: number;
    serviceCounter: number;
  } | undefined;
}

if (!globalThis._mockDb) {
  globalThis._mockDb = {
    tables: [],
    columns: [],
    services: [],
    records: {},
    settings: {
      'cors_allow_all': 'true',
      'cors_whitelist': '',
    },
    tableCounter: 1,
    columnCounter: 1,
    serviceCounter: 1,
  };

  const feedbackTableId = globalThis._mockDb.tableCounter++;
  globalThis._mockDb.tables.push({
    id: feedbackTableId,
    table_name: 'feedback',
    id_type: 'serial',
    enable_pagination: true,
    page_size: 10,
    created_at: new Date().toISOString(),
  });

  globalThis._mockDb.columns.push(
    { id: globalThis._mockDb.columnCounter++, table_id: feedbackTableId, column_name: 'title', column_type: 'text', is_nullable: false, created_at: new Date().toISOString() },
    { id: globalThis._mockDb.columnCounter++, table_id: feedbackTableId, column_name: 'type', column_type: 'text', is_nullable: false, created_at: new Date().toISOString() },
    { id: globalThis._mockDb.columnCounter++, table_id: feedbackTableId, column_name: 'description', column_type: 'text', is_nullable: false, created_at: new Date().toISOString() }
  );

  globalThis._mockDb.records['user_feedback'] = [];
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
        enable_auth BOOLEAN DEFAULT FALSE,
        user_id_column VARCHAR(255),
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
      ALTER TABLE system_columns ADD COLUMN IF NOT EXISTS is_unique BOOLEAN DEFAULT FALSE
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
    await pool.query(`
      ALTER TABLE system_tables ADD COLUMN IF NOT EXISTS enable_auth BOOLEAN DEFAULT FALSE
    `);
    await pool.query(`
      ALTER TABLE system_tables ADD COLUMN IF NOT EXISTS user_id_column VARCHAR(255)
    `);
    await pool.query(`
      ALTER TABLE system_tables ADD COLUMN IF NOT EXISTS allowed_endpoints JSONB DEFAULT '{"allow_get_list": true, "allow_get_id": true, "allow_post": true, "allow_put": true, "allow_delete": true}'
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_services (
        id SERIAL PRIMARY KEY,
        table_id INTEGER REFERENCES system_tables(id) ON DELETE CASCADE,
        service_name VARCHAR(255) NOT NULL,
        method VARCHAR(10) DEFAULT 'GET',
        description TEXT,
        require_auth BOOLEAN DEFAULT FALSE,
        filters JSONB DEFAULT '[]',
        update_rule JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(table_id, service_name, method)
      )
    `);
    await pool.query(`
      ALTER TABLE system_services ADD COLUMN IF NOT EXISTS update_rule JSONB DEFAULT '{}'
    `);

    const settingsCheck = await pool.query("SELECT COUNT(*) FROM system_settings WHERE key = 'cors_allow_all'");
    if (parseInt(settingsCheck.rows[0]?.count || 0, 10) === 0) {
      await pool.query("INSERT INTO system_settings (key, value) VALUES ('cors_allow_all', 'true'), ('cors_whitelist', '')");
    }

    const feedbackCheck = await pool.query("SELECT id FROM system_tables WHERE table_name = 'feedback'");
    if (feedbackCheck.rows.length === 0) {
      const tableRes = await pool.query(
        "INSERT INTO system_tables (table_name, id_type, enable_pagination, page_size) VALUES ('feedback', 'serial', true, 10) RETURNING id"
      );
      const tableId = tableRes.rows[0].id;
      await pool.query(
        "INSERT INTO system_columns (table_id, column_name, column_type, is_nullable) VALUES " +
        "($1, 'title', 'text', false), " +
        "($1, 'type', 'text', false), " +
        "($1, 'description', 'text', false)",
        [tableId]
      );
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "user_feedback" (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "title" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "description" TEXT NOT NULL
        )
      `);
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

function filterMockList(sql: string, params: any[], tableName: string, list: any[]) {
  let filtered = [...list];
  const tableMeta = mockDb.tables.find(t => t.table_name === tableName);
  const sqlLower = sql.toLowerCase();

  if (sqlLower.includes('ilike') && params && params.length > 0) {
    const searchVal = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
    if (searchVal && tableMeta) {
      const keyword = searchVal.replace(/%/g, '').toLowerCase();
      const textCols = mockDb.columns
        .filter(c => c.table_id === tableMeta.id && c.column_type === 'text')
        .map(c => c.column_name);
      filtered = filtered.filter(row => {
        return textCols.some(col => {
          const val = row[col];
          return val && String(val).toLowerCase().includes(keyword);
        });
      });
    }
  }

  const colEqualsMatches = [...sql.matchAll(/"([a-zA-Z0-9_]+)"\s*=\s*\$([0-9]+)/g)];
  for (const match of colEqualsMatches) {
    const colName = match[1];
    const paramIndex = parseInt(match[2], 10) - 1;
    const expectedValue = params[paramIndex];
    if (expectedValue !== undefined) {
      filtered = filtered.filter(row => String(row[colName]) === String(expectedValue));
    }
  }

  return filtered;
}

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
      const list = mockDb.records[tableName] || [];
      const filtered = filterMockList(sql, params, tableName, list);
      return { rows: [{ count: filtered.length, total: filtered.length }] };
    }
  }

  if (sqlLower.startsWith('select * from user_') || sqlLower.startsWith('select * from "user_')) {
    const tableNameMatch = sql.match(/from\s+([a-zA-Z0-9_"]+)/i);
    if (!tableNameMatch) return { rows: [] };
    const rawName = tableNameMatch[1];
    const tableName = rawName.replace(/["']/g, '');
    const list = mockDb.records[tableName] || [];
    let resultList = filterMockList(sql, params, tableName, list);

    const orderMatch = sql.match(/order\s+by\s+([a-zA-Z0-9_]+)\s+(desc|asc)/i);
    if (orderMatch) {
      const field = orderMatch[1];
      const direction = orderMatch[2].toLowerCase();
      resultList = [...resultList].sort((a, b) => {
        if (a[field] < b[field]) return direction === 'desc' ? 1 : -1;
        if (a[field] > b[field]) return direction === 'desc' ? -1 : 1;
        return 0;
      });
    }

    const limitMatch = sql.match(/limit\s+(\$\d+|\d+)/i);
    const offsetMatch = sql.match(/offset\s+(\$\d+|\d+)/i);
    
    if (limitMatch && offsetMatch && params && params.length >= 2) {
      const limitParamIdx = parseInt(limitMatch[1].replace('$', ''), 10) - 1;
      const offsetParamIdx = parseInt(offsetMatch[1].replace('$', ''), 10) - 1;
      const limit = params[limitParamIdx];
      const offset = params[offsetParamIdx];
      resultList = resultList.slice(offset, offset + limit);
    } else if (params && params.length >= 2 && sqlLower.includes('limit') && sqlLower.includes('offset')) {
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      resultList = resultList.slice(offset, offset + limit);
    }
    return { rows: resultList };
  }

  return { rows: [] };
}

export async function createTable(
  tableName: string,
  columns: { name: string; type: string; nullable?: boolean; isUnique?: boolean; referencesTable?: string }[],
  config?: {
    idType?: 'serial' | 'uuid';
    enablePagination?: boolean;
    pageSize?: number;
    enableAuth?: boolean;
    userIdColumn?: string | null;
    allowedEndpoints?: AllowedEndpoints;
  }
): Promise<void> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const prefixedTable = `user_${safeName}`;
  const idType = config?.idType || 'serial';
  const enablePagination = config?.enablePagination || false;
  const pageSize = config?.pageSize || 10;
  const enableAuth = config?.enableAuth || false;
  const userIdColumn = config?.userIdColumn || null;
  if (columns.some(c => c.name === 'id' || c.name === 'created_at')) {
    throw new Error("System columns 'id' and 'created_at' are added automatically. Do not include them in the column definitions.");
  }

  const allowedEndpoints = config?.allowedEndpoints || DEFAULT_ALLOWED_ENDPOINTS;

  if (pool) {
    await initDb();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tableRes = await client.query(
        'INSERT INTO system_tables (table_name, id_type, enable_pagination, page_size, enable_auth, user_id_column, allowed_endpoints) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [safeName, idType, enablePagination, pageSize, enableAuth, userIdColumn, JSON.stringify(allowedEndpoints)]
      );
      const tableId = tableRes.rows[0].id;

      for (const col of columns) {
        await client.query(
          'INSERT INTO system_columns (table_id, column_name, column_type, is_nullable, is_unique, references_table) VALUES ($1, $2, $3, $4, $5, $6)',
          [tableId, col.name, col.type, col.nullable !== false, !!col.isUnique, col.referencesTable || null]
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
        if (col.isUnique) sqlDef += ' UNIQUE';
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
    enable_auth: enableAuth,
    user_id_column: userIdColumn,
    allowed_endpoints: allowedEndpoints,
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
      is_unique: !!col.isUnique,
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

export async function updateTableConfig(
  tableId: number,
  config: {
    idType?: 'serial' | 'uuid';
    enablePagination?: boolean;
    pageSize?: number;
    enableAuth?: boolean;
    userIdColumn?: string | null;
    allowedEndpoints?: AllowedEndpoints;
  }
): Promise<void> {
  if (pool) {
    await initDb();
    await pool.query(
      `UPDATE system_tables 
       SET id_type = COALESCE($1, id_type),
           enable_pagination = COALESCE($2, enable_pagination),
           page_size = COALESCE($3, page_size),
           enable_auth = COALESCE($4, enable_auth),
           user_id_column = $5,
           allowed_endpoints = COALESCE($6, allowed_endpoints)
       WHERE id = $7`,
      [
        config.idType,
        config.enablePagination,
        config.pageSize,
        config.enableAuth,
        config.userIdColumn,
        config.allowedEndpoints ? JSON.stringify(config.allowedEndpoints) : null,
        tableId,
      ]
    );
    return;
  }

  const match = mockDb.tables.find(t => t.id === tableId);
  if (match) {
    if (config.idType !== undefined) match.id_type = config.idType;
    if (config.enablePagination !== undefined) match.enable_pagination = config.enablePagination;
    if (config.pageSize !== undefined) match.page_size = config.pageSize;
    if (config.enableAuth !== undefined) match.enable_auth = config.enableAuth;
    if (config.userIdColumn !== undefined) match.user_id_column = config.userIdColumn;
    if (config.allowedEndpoints !== undefined) match.allowed_endpoints = config.allowedEndpoints;
  }
}

export async function addColumnToTable(
  tableId: number,
  column: {
    name: string;
    type: string;
    nullable?: boolean;
    isUnique?: boolean;
    referencesTable?: string | null;
  }
): Promise<void> {
  const safeColName = column.name.replace(/[^a-zA-Z0-9_]/g, '');
  if (!safeColName) throw new Error('Invalid column name');

  if (safeColName === 'id' || safeColName === 'created_at') {
    throw new Error(`Column '${safeColName}' already exists as a system primary/timestamp column`);
  }

  const allowedTypes = ['text', 'integer', 'boolean', 'timestamp', 'relation'];
  const type = allowedTypes.includes(column.type) ? column.type : 'text';
  const isNullable = column.nullable !== false;
  const isUnique = !!column.isUnique;
  const referencesTable = type === 'relation' ? column.referencesTable : null;

  if (pool) {
    await initDb();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tableRes = await client.query('SELECT table_name FROM system_tables WHERE id = $1', [tableId]);
      if (tableRes.rows.length === 0) throw new Error('Table not found');
      const tableName = tableRes.rows[0].table_name;
      const prefixedTable = `user_${tableName}`;

      // Check duplicate column
      const dupCheck = await client.query(
        'SELECT id FROM system_columns WHERE table_id = $1 AND column_name = $2',
        [tableId, safeColName]
      );
      if (dupCheck.rows.length > 0) throw new Error(`Column '${safeColName}' already exists in this table`);

      await client.query(
        'INSERT INTO system_columns (table_id, column_name, column_type, is_nullable, is_unique, references_table) VALUES ($1, $2, $3, $4, $5, $6)',
        [tableId, safeColName, type, isNullable, isUnique, referencesTable]
      );

      let sqlDef = `"${safeColName}" `;
      if (type === 'relation' && referencesTable) {
        const refRes = await client.query('SELECT id_type FROM system_tables WHERE table_name = $1', [referencesTable]);
        const refIdType = refRes.rows[0]?.id_type || 'serial';
        const fkType = refIdType === 'uuid' ? 'UUID' : 'INTEGER';
        sqlDef += `${fkType} REFERENCES "user_${referencesTable}"(id) ON DELETE SET NULL`;
      } else if (type === 'integer') {
        sqlDef += 'INTEGER';
      } else if (type === 'boolean') {
        sqlDef += 'BOOLEAN';
      } else if (type === 'timestamp') {
        sqlDef += 'TIMESTAMP';
      } else {
        sqlDef += 'TEXT';
      }

      if (!isNullable) {
        sqlDef += ' NOT NULL DEFAULT \'\'';
      }

      if (isUnique) {
        sqlDef += ' UNIQUE';
      }

      await client.query(`ALTER TABLE "${prefixedTable}" ADD COLUMN IF NOT EXISTS ${sqlDef}`);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return;
  }

  const tableMeta = mockDb.tables.find(t => t.id === tableId);
  if (!tableMeta) throw new Error('Table not found');

  const dup = mockDb.columns.find(c => c.table_id === tableId && c.column_name === safeColName);
  if (dup) throw new Error(`Column '${safeColName}' already exists in this table`);

  mockDb.columns.push({
    id: mockDb.columnCounter++,
    table_id: tableId,
    column_name: safeColName,
    column_type: type,
    is_nullable: isNullable,
    is_unique: isUnique,
    references_table: referencesTable || null,
    created_at: new Date().toISOString(),
  });
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
    if (!validColumns.includes('id')) {
      validColumns.push('id');
    }
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
  const customId = data.id !== undefined && data.id !== null && data.id !== '' ? data.id : null;
  const newRow: Record<string, any> = {
    id: customId !== null ? customId : (tableMeta.id_type === 'uuid' ? generateUuid() : mockDb.records[prefixedTable].length + 1),
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
    const tableRes = await pool.query(
      `SELECT id, id_type FROM system_tables WHERE table_name = $1`,
      [safeName]
    );
    const tableMeta = tableRes.rows[0];

    const columnsConfig = await pool.query(
      `SELECT column_name FROM system_columns WHERE table_id = $1`,
      [tableMeta?.id]
    );
    const validColumns = columnsConfig.rows.map((r: any) => r.column_name);
    if (!validColumns.includes('id')) {
      validColumns.push('id');
    }
    const fields = Object.keys(data).filter(key => validColumns.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    for (const key of fields) {
      values.push(data[key]);
      if (key === 'id' && tableMeta?.id_type === 'uuid') {
        setClauses.push(`"id" = $${values.length}::uuid`);
      } else {
        setClauses.push(`"${key}" = $${values.length}`);
      }
    }

    const wherePlaceholder = `$${values.length + 1}${tableMeta?.id_type === 'uuid' ? '::uuid' : ''}`;
    const queryStr = `UPDATE "${prefixedTable}" SET ${setClauses.join(', ')} WHERE id = ${wherePlaceholder} RETURNING *`;
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

  if (data.id !== undefined && data.id !== null && data.id !== '') {
    updatedRow.id = data.id;
  }

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

export async function getServicesByTableId(tableId: number): Promise<MockService[]> {
  if (pool) {
    await initDb();
    const res = await pool.query(
      'SELECT id, table_id, service_name, method, description, require_auth, filters, update_rule, created_at FROM system_services WHERE table_id = $1 ORDER BY id ASC',
      [tableId]
    );
    return res.rows.map((r: any) => ({
      ...r,
      filters: typeof r.filters === 'string' ? JSON.parse(r.filters) : r.filters || [],
      update_rule: typeof r.update_rule === 'string' ? JSON.parse(r.update_rule) : r.update_rule || {},
    }));
  }
  return mockDb.services.filter(s => s.table_id === tableId);
}

export async function createService(
  tableId: number,
  service: {
    service_name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description?: string;
    require_auth?: boolean;
    filters?: ServiceFilter[];
    update_rule?: UpdateRule;
  }
): Promise<MockService> {
  const safeServiceName = service.service_name.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
  const method = service.method || 'GET';
  const requireAuth = !!service.require_auth;
  const filters = service.filters || [];
  const updateRule = service.update_rule || {};

  if (pool) {
    await initDb();
    const res = await pool.query(
      `INSERT INTO system_services (table_id, service_name, method, description, require_auth, filters, update_rule)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, table_id, service_name, method, description, require_auth, filters, update_rule, created_at`,
      [tableId, safeServiceName, method, service.description || '', requireAuth, JSON.stringify(filters), JSON.stringify(updateRule)]
    );
    return {
      ...res.rows[0],
      filters: typeof res.rows[0].filters === 'string' ? JSON.parse(res.rows[0].filters) : res.rows[0].filters || [],
      update_rule: typeof res.rows[0].update_rule === 'string' ? JSON.parse(res.rows[0].update_rule) : res.rows[0].update_rule || {},
    };
  }

  const existingIdx = mockDb.services.findIndex(
    s => s.table_id === tableId && s.service_name === safeServiceName && s.method === method
  );
  if (existingIdx !== -1) {
    throw new Error(`Service '${safeServiceName}' with method ${method} already exists for this table`);
  }

  const newService: MockService = {
    id: mockDb.serviceCounter++,
    table_id: tableId,
    service_name: safeServiceName,
    method,
    description: service.description || '',
    require_auth: requireAuth,
    filters,
    update_rule: updateRule,
    created_at: new Date().toISOString(),
  };
  mockDb.services.push(newService);
  return newService;
}

export async function deleteService(serviceId: number): Promise<void> {
  if (pool) {
    await initDb();
    await pool.query('DELETE FROM system_services WHERE id = $1', [serviceId]);
    return;
  }
  mockDb.services = mockDb.services.filter(s => s.id !== serviceId);
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
