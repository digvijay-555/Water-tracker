/**
 * Water Tracker - AWS DynamoDB Seeding Script
 * 
 * Populates live AWS DynamoDB tables with demonstration tankers,
 * community shortage reports, and sample requests.
 * 
 * Uses the AWS CLI directly — 100% dependency-free (no npm packages required).
 */

import { execSync } from 'node:child_process';
import {
  DEMO_TANKERS,
  DEMO_REQUESTS,
  DEMO_BOOKINGS,
  DEMO_REPORTS,
} from './seed-demo-data.js';

const region = process.env.AWS_REGION || 'ap-south-1';
const stackName = process.env.STACK_NAME || process.env.SAM_STACK_NAME || 'water-tracker';

function resolveTableNames() {
  let tankersTable = process.env.TANKERS_TABLE;
  let requestsTable = process.env.REQUESTS_TABLE;
  let bookingsTable = process.env.BOOKINGS_TABLE;
  let reportsTable = process.env.REPORTS_TABLE;

  if (tankersTable && requestsTable && bookingsTable && reportsTable) {
    return { tankersTable, requestsTable, bookingsTable, reportsTable };
  }

  try {
    const raw = execSync(
      `aws cloudformation describe-stacks --stack-name "${stackName}" --region "${region}" --query "Stacks[0].Outputs" --output json`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const outputs = JSON.parse(raw || '[]');
    for (const out of outputs) {
      if (out.OutputKey === 'TankersTableName') tankersTable = out.OutputValue;
      if (out.OutputKey === 'RequestsTableName') requestsTable = out.OutputValue;
      if (out.OutputKey === 'BookingsTableName') bookingsTable = out.OutputValue;
      if (out.OutputKey === 'ShortageReportsTableName') reportsTable = out.OutputValue;
    }
  } catch (err) {
    console.warn(`CloudFormation lookup notice: ${err.message}`);
  }

  return {
    tankersTable: tankersTable || `WaterTracker-Tankers-${stackName}`,
    requestsTable: requestsTable || `WaterTracker-Requests-${stackName}`,
    bookingsTable: bookingsTable || `WaterTracker-Bookings-${stackName}`,
    reportsTable: reportsTable || `WaterTracker-ShortageReports-${stackName}`,
  };
}

function marshall(val) {
  if (typeof val === 'string') return { S: val };
  if (typeof val === 'number') return { N: val.toString() };
  if (typeof val === 'boolean') return { BOOL: val };
  if (Array.isArray(val)) {
    return { L: val.map(marshall) };
  }
  if (val && typeof val === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined && v !== null) {
        res[k] = marshall(v);
      }
    }
    return { M: res };
  }
  return { NULL: true };
}

function toDynamoItem(obj) {
  const item = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) {
      item[k] = marshall(v);
    }
  }
  return item;
}

function putItem(tableName, item) {
  const ddbItem = JSON.stringify(toDynamoItem(item)).replace(/'/g, "'\\''");
  execSync(
    `aws dynamodb put-item --table-name "${tableName}" --region "${region}" --item '${ddbItem}'`,
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );
}

function run() {
  console.log('====================================================');
  console.log(' Water Tracker - Live AWS DynamoDB Seeding');
  console.log('====================================================\n');

  const tables = resolveTableNames();
  console.log('Target Tables:');
  console.log(`  - Tankers:          ${tables.tankersTable}`);
  console.log(`  - Requests:         ${tables.requestsTable}`);
  console.log(`  - Bookings:         ${tables.bookingsTable}`);
  console.log(`  - Shortage Reports: ${tables.reportsTable}\n`);

  console.log(`1. Seeding ${DEMO_TANKERS.length} Tankers...`);
  for (const t of DEMO_TANKERS) {
    putItem(tables.tankersTable, t);
  }

  console.log(`2. Seeding ${DEMO_REQUESTS.length} Requests...`);
  for (const r of DEMO_REQUESTS) {
    putItem(tables.requestsTable, r);
  }

  console.log(`3. Seeding ${DEMO_BOOKINGS.length} Bookings...`);
  for (const b of DEMO_BOOKINGS) {
    putItem(tables.bookingsTable, b);
  }

  console.log(`4. Seeding ${DEMO_REPORTS.length} Shortage Reports...`);
  for (const rp of DEMO_REPORTS) {
    putItem(tables.reportsTable, rp);
  }

  console.log('\n====================================================');
  console.log(' Successfully seeded all demonstration records into AWS!');
  console.log('====================================================');
}

run();
