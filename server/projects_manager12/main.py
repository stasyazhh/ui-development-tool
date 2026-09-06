import psycopg2
conn = psycopg2.connect("dbname=ui_projects user=postgres")
cur = conn.cursor()
cur.execute("CREATE TABLE test1 (id serial PRIMARY KEY, num integer, data varchar);")
cur.execute("INSERT INTO test (num, data) VALUES (%s, %s)",
 (100, "abc'def"))
cur.execute("SELECT * FROM test;")
cur.fetchone()
(1, 100, "abc'def")
conn.commit()
cur.close()
conn.close()