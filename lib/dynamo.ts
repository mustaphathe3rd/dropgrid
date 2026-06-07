// lib/dynamo.ts
// Singleton DynamoDB Document client.
// Handles marshalling/unmarshalling of JS types to DynamoDB AttributeValues.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    QueryCommand,
    ScanCommand,
    TransactWriteCommand,
    type GetCommandInput,
    type PutCommandInput,
    type UpdateCommandInput,
    type DeleteCommandInput,
    type QueryCommandInput,
    type ScanCommandInput,
    type TransactWriteCommandInput,
} from '@aws-sdk/lib-dynamodb'

function createClient(): DynamoDBClient {
    return new DynamoDBClient({
        region: process.env.AWS_REGION ?? 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        // Increase timeout for edge functions where cold starts can be slow
        requestHandler: {
            requestTimeout: 5000,
            connectionTimeout: 3000,
        },
    })
}

// Module-level singleton - reused across Lambda/Edge invocations in the same container
let _client: DynamoDBClient | null = null
let _docClient: DynamoDBDocumentClient | null = null

function getDocClient(): DynamoDBDocumentClient {
    if (_docClient) return _docClient

    _client = createClient()
    _docClient = DynamoDBDocumentClient.from(_client, {
        marshallOptions: {
            // Don't convert empty string/set to null - we want explicit nulls
            convertEmptyValues: false,
            // Strip undefined keys from objects before writing
            removeUndefinedValues: true,
            // Keep JS numbers as-is (don't convert to DynamoDB Number strings)
            convertClassInstanceToMap: false,
        },
        unmarshallOptions: {
            // Return JS numbers not BigInt for large numbers
            wrapNumbers: false,
        },
    })
    return _docClient
}

// ── Typed wrappers ──────────────────────────────────────────────────────────
// These wrappers infer return types so call sites don't need to cast.

export async function dbGet<T>(input: GetCommandInput): Promise<T | null> {
    const result = await getDocClient().send(new GetCommand(input))
    return (result.Item as T) ?? null
}

export async function dbPut(input: PutCommandInput): Promise<void> {
    await getDocClient().send(new PutCommand(input))
}

export async function dbUpdate(input: UpdateCommandInput): Promise<void> {
    await getDocClient().send(new UpdateCommand(input))
}

export async function dbDelete(input: DeleteCommandInput): Promise<void> {
    await getDocClient().send(new DeleteCommand(input))
}

export async function dbQuery<T>(input: QueryCommandInput): Promise<T[]> {
    const result = await getDocClient().send(new QueryCommand(input))
    return (result.Items as T[]) ?? []
}

export async function dbScan<T>(input: ScanCommandInput): Promise<T[]> {
    const result = await getDocClient().send(new ScanCommand(input))
    return (result.Items as T[]) ?? []
}

export async function dbTransact(
    input: TransactWriteCommandInput
): Promise<void> {
    await getDocClient().send(new TransactWriteCommand(input))
}

// Re-export the raw client for cases that need lower-level access
export { getDocClient }