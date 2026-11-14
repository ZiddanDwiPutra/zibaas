export function formatBadRequestError(err: any): string {
  const msg = err?.message || String(err || 'Bad request');
  const code = err?.code;

  if (code === '23505' || msg.includes('duplicate key value')) {
    return 'Bad Request: Duplicate value violates unique constraint or primary key.';
  }
  if (code === '23502' || msg.includes('violates not-null constraint')) {
    return 'Bad Request: Missing required field violates not-null constraint.';
  }
  if (code === '23503' || msg.includes('violates foreign key constraint')) {
    return 'Bad Request: Foreign key reference does not exist.';
  }
  if (code === '22P02' || msg.includes('invalid input syntax')) {
    return 'Bad Request: Invalid data format or type syntax.';
  }
  if (
    msg.includes('already exists') ||
    msg.includes('specified more than once') ||
    msg.includes('reserved') ||
    msg.includes('required') ||
    msg.includes('Invalid')
  ) {
    return `Bad Request: ${msg}`;
  }

  return msg;
}
