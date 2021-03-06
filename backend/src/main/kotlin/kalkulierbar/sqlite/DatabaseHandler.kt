package kalkulierbar.sqlite

import java.sql.*

class DatabaseHandler {

    companion object {
        private var connection: Connection? = null

        public fun init() {
            try {
                Class.forName("org.sqlite.JDBC")
                connection = DriverManager.getConnection("jdbc:sqlite:test.db")
            } catch (e: Exception) {
                println("Connection to database could not be established")
                println(e.message)
            }
        }

        public fun createTable(identifier: String) {
            if (connection != null) {
                val stmt = (connection as Connection).createStatement()
                val create: String =
                    "CREATE TABLE IF NOT EXISTS $identifier (formula VARCHAR(8000) NOT NULL, statistics VARCHAR(8000) NOT NULL, score INTEGER NOT NULL);"
                stmt.execute(create)
                stmt.close()
            }
        }

        public fun insert(identifier: String, keyFormula: String, statisticsJSON: String, score: Int) {
            statisticsJSON.replace("\"", "\\\"")
            if (connection != null) {
                val stmt = (connection as Connection).createStatement()
                val insert: String =
                    "INSERT INTO $identifier VALUES (\"$keyFormula\", '$statisticsJSON', $score);"
                stmt.execute(insert)
                stmt.close()
            }
        }

        public fun query(identifier: String, formula: String): MutableList<String> {
            val returnList = mutableListOf<String>()
            if (connection != null) {
                val stmt = (connection as Connection).createStatement()
                val query: String = "SELECT * FROM $identifier WHERE formula = \"$formula\" ORDER BY score DESC;"
                val result: ResultSet = stmt.executeQuery(query)
                while (result.next()) {
                    val tmp = result.getString(2).toString()
                    returnList.add(tmp)
                }
                stmt.close()
            }
            return returnList
        }
    }
}
