import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import process from 'process';

const SERVICE_ACCOUNT_KEY_PATH = path.join(process.cwd(), 'credentials.json');

export class GoogleDrive {
  async authorize(scopes: string[]): Promise<JWT> {
    const serviceAccountKey = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH, 'utf-8'));
    const jwtClient = new JWT(
      serviceAccountKey.client_email,
      undefined,
      serviceAccountKey.private_key,
      scopes,
    );
    await jwtClient.authorize();
    return jwtClient;
  }

  async getDrive(auth: JWT): Promise<any> {
    return google.drive({ version: 'v3', auth });
  }
}
