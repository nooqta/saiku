import { Action } from "@/interfaces/action";
import { createConnection, Connection } from 'mysql2/promise';
import dotenv from 'dotenv'; 
dotenv.config();

interface QueryArgs {
  database?: string;
  query: string;
  values?: any[];
}

export default class DatabaseQueryAction implements Action {
  name = "database_query";
  description = "Execute a database query";
  arguments = [
    { name: "database", type: "string", required: false },
    { name: "query", type: "string", required: true },
    { name: "values", type: "array", required: false, items: { type: "string" } },
  ];

  private connection: Connection | null = null;


  async init(database: string) {
    const connectionOptions: any = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
    };
    if (database) {
      connectionOptions.database = database;
    }
    this.connection = await createConnection(connectionOptions);
    
  }

  async run(args: QueryArgs): Promise<any> {
    await this.init(args.database || "");

    try {
        // @ts-ignore
      const [results] = await this.connection.execute(args.query, args.values);
    
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
