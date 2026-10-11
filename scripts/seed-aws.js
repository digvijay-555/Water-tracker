/**
 * Water Tracker - AWS DynamoDB Seeding Script
 * 
 * Populates live AWS DynamoDB tables with demonstration tankers,
 * community shortage reports, and sample requests.
 * 
 * Usage:
 *   STACK_NAME=water-tracker node scripts/seed-aws.js
 *   or:
 *   TANKERS_TABLE=... REQUESTS_TABLE=... BOOKINGS_TABLE=... REPORTS_TABLE=... node scripts/seed-aws.js
 */

import {
  DEMO_TANKERS,
  DEMO_REQUESTS,
  DEMO_BOOKINGS,
  DEMO_REPORTS,
} from './seed-demo-data.js';

const region = process.env.AWS_REGION || 'ap-south-1';

async function resolveTableNames() {
  const stackName = process.env.STACK_NAME || process.env.SAM_STACK_NAME || 'water-tracker';
  let tankersTable = process.env.TANKERS_TABLE;
  let requestsTable = process.env.REQUESTS_TABLE;
  let bookingsTable = process.env.BOOKINGS_TABLE;
  let reportsTable = process.env.REPORTS_TABLE;

  if (tankersTable && requestsTable && bookingsTable && reportsTable) {
    return { tankersTable, requestsTable, bookingsTable, reportsTable };
  }

  console.log(`Querying CloudFormation stack "${stackName}" in region "${region}" for table outputs...`);
  try {
    const { CloudFormationClient, DescribeStacksCommand } = await import('@aws-sdk/client-cloudformation');
    const cfn = new CloudFormationClient({ region });
    const res = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
    const outputs = res.Stacks?.[0]?.Outputs || [];

    for (const out of outputs) {
      if (out.OutputKey === 'TankersTableName') tankersTable = out.OutputValue;
      if (out.OutputKey === 'RequestsTableName') requestsTable = out.OutputValue;
      if (out.OutputKey === 'BookingsTableName') bookingsTable = out.OutputValue;
      if (out.OutputKey === 'ShortageReportsTableName') reportsTable = out.OutputValue;
    }
  } catch (err) {
    console.warn(`Could not fetch CloudFormation outputs automatically: ${err.message}`);
    console.log(`Falling back to default naming convention: WaterTracker-<Table>-${stackName}`);
  }

  return {
    tankersTable: tankersTable || `WaterTracker-Tankers-${stackName}`,
    requestsTable: requestsTable || `WaterTracker-Requests-${stackName}`,
    bookingsTable: bookingsTable || `WaterTracker-Bookings-${stackName}`,
    reportsTable: reportsTable || `WaterTracker-ShortageReports-${stackName}`,
  };
}

async function run() {
  console.log('====================================================');
  console.log(' Water Tracker - Live AWS DynamoDB Seeding');
  console.log('====================================================\n');

  const tables = await resolveTableNames();
  console.log('Target Tables:');
  console.log(`  - Tankers:          ${tables.tankersTable}`);
  console.log(`  - Requests:         ${tables.requestsTable}`);
  console.log(`  - Bookings:         ${tables.bookingsTable}`);
  console.log(`  - Shortage Reports: ${tables.reportsTable}\n`);

  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, PutCommand } = await import('@aws-sdk/lib-dynamodb');

  const client = new DynamoDBClient({ region });
  const docClient = DynamoDBDocumentClient.from(client);

  console.log(`1. Seeding ${DEMO_TANKERS.length} Tankers...`);
  for (const t of DEMO_TANKERS) {
    await docClient.send(new PutCommand({ TableName: tables.tankersTable, Item: t }));
  }

  console.log(`2. Seeding ${DEMO_REQUESTS.length} Requests...`);
  for (const r of DEMO_REQUESTS) {
    await docClient.send(new PutCommand({ TableName: tables.requestsTable, Item: r }));
  }

  console.log(`3. Seeding ${DEMO_BOOKINGS.length} Bookings...`);
  for (const b of DEMO_BOOKINGS) {
    await docClient.send(new PutCommand({ TableName: tables.bookingsTable, Item: b }));
  }

  console.log(`4. Seeding ${DEMO_REPORTS.length} Shortage Reports...`);
  for (const rp of DEMO_REPORTS) {
    await docClient.send(new PutCommand({ TableName: tables.reportsTable, Item: rp }));
  }

  console.log('\n====================================================');
  console.log(' Successfully seeded all demonstration records into AWS!');
  console.log('====================================================');
}

run().catch(err => {
  console.error('\nSeeding failed:', err);
  process.exit(1);
});
