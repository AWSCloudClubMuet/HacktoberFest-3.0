# ReliefHub — MySQL setup

## Connect the dashboard to MySQL

1. Start your local MySQL server (for example, from MySQL Workbench's local connection or the MySQL service).
2. In MySQL Workbench, open and run `schema.sql`. It creates the `reliefhub` database and six tables.
3. In VS Code, open a terminal in this folder and run:

   ```powershell
   Copy-Item .env.example .env
   npm install
   ```

4. Open `.env` in VS Code. Set `DB_USER` and `DB_PASSWORD` to your local MySQL login. Keep your real password in `.env`; do not share it or commit it.
5. Start the dashboard from this folder:

   ```powershell
   npm start
   ```

6. Open `http://localhost:8080`.

On startup the API creates any missing tables and imports existing `data.json` records into empty tables. If `data.json` is absent, it imports `seed.json`. It does not overwrite tables that already contain data.

## View saved records

In MySQL Workbench, run:

```sql
USE reliefhub;
SELECT * FROM camps;
SELECT * FROM inventory;
SELECT * FROM needs;
SELECT * FROM dispatches;
SELECT * FROM donations;
SELECT * FROM volunteers;
```

The browser reads and writes through the Node API; MySQL is the persistent database.
