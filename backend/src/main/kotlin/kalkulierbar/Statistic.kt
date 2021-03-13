package kalkulierbar

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonConfiguration
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.modules.SerializersModule
import kalkulierbar.sequentCalculus.SequentCalculusStatistic
import kalkulierbar.signedtableaux.SignedModalTableauxStatistic

interface Statistic {

    public var userName: String?

    public var score: Int

    /**
     * The function returns the score of the statistic object
     * @return The score of the statistic
     */
    public fun calculateScore(): Int

    /**
     * Returns the column names of the data that is stored within this interface.
     * The column names are needed by the Frontend and need to be ordered in the same order serialization happens
     */
    public fun columnNames(): List<String>
}

val StatisticModule = SerializersModule {
    polymorphic(Statistic::class) {
        SequentCalculusStatistic::class with SequentCalculusStatistic.serializer()
        SignedModalTableauxStatistic::class with SignedModalTableauxStatistic.serializer()
    }
}

@Serializable
class Statistics(
    val formula: String
) {
    var entries: List<Statistic> = listOf<Statistic>()
    var columnNames: List<String> = listOf<String>()

    constructor(entries: List<Statistic>, formula: String):this(formula) {
        this.entries = entries
        this.columnNames = entries[0].columnNames()
    }

    constructor(entries: List<String>, formula: String, endpoint: StatisticCalculus<*>): this(formula) {

        var statistics = entries.map { endpoint.jsonToStatistic(it) }

        statistics = statistics.sortedBy { it.score }
        statistics = statistics.asReversed()

        this.entries = statistics
        this.columnNames = statistics[0].columnNames()
    }

    public fun toJson(): String {
        return Json(context = StatisticModule).stringify(Statistics.serializer(), this)
    }
}
