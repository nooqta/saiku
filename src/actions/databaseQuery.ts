import { Action } from "@/interfaces/action";
import { createConnection, Connection } from 'mysql2/promise';
import dotenv from 'dotenv'; 
dotenv.config();

interface QueryArgs {
  database: string;
  query: string;
  values?: any[];
}

export default class DatabaseQueryAction implements Action {
  name = "database_query";
  description = "Execute a database query";
  arguments = [
    { name: "database", type: "string", required: true },
    { name: "query", type: "string", required: true },
    { name: "values", type: "array", required: false, items: { type: "string" } },
  ];

  private connection: Connection | null = null;


  async init(database: string) {
    this.connection = await createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database,
    });
  }

  async run(args: QueryArgs): Promise<any> {
    await this.init(args.database);

    try {
        // @ts-ignore
      const [results] = await this.connection.execute(args.query, args.values);
      // If the query is SHOW TABLES, map the result to a string
    if (args.query.trim().toUpperCase().includes('SHOW TABLES') && Array.isArray(results)) {
        return results.map((row: any) => Object.values(row)[0]).join(', ');
      }
      return JSON.stringify(results);
    } catch (error) {
      return JSON.stringify(error);
    } 
    
    finally {
      await this.close();
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}
