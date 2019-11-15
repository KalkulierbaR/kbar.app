package kalkulierbar

/**
 * Framework for Calculus implementations using JSON for serialization
 * Handles serialization and deserialization, letting implementing classes work directly on state
 */
abstract class JSONCalculus<State> : Calculus {

    /**
     * Parses a formula provided as text into a state representation
     * Note that the used format for both the formula and the state may differ for different implementations
     * @param formula logic formula in some given format
     * @return complete state representation of the input formula
     */
    override fun parseFormula(formula: String) = stateToJson(parseFormulaToState(formula))

    /**
     * Parses a formula provided as text into an internal state
     * @param formula logic formula in some given format
     * @return parsed state object
     */
    abstract fun parseFormulaToState(formula: String): State

    /**
     * Takes in a state representation and a move and applies the move on the state if possible.
     * Throws an exception explaining why the move is illegal otherwise.
     * @param state state representation of the current (pre-)state
     * @param move move to apply in the given state
     * @return state representation after move was applied
     */
    override fun applyMove(state: String, move: String) = stateToJson(applyMoveOnState(jsonToState(state), move))

    /**
     * Takes in a state object and a move and applies the move to the state if possible
     * Throws an exception explaining why the move is illegal otherwise
     * @param state current state object
     * @param move move to apply in the given state
     * @return state after the move was applied
     */
    abstract fun applyMoveOnState(state: State, move: String): State

    /**
     * Checks if a given state represents a valid, closed proof.
     * @param state state representation to validate
     * @return true if the given proof is closed and valid, false otherwise
     */
    override fun checkClose(state: String) = checkCloseOnState(jsonToState(state))

    /**
     * Checks if a given state represents a valid, closed proof.
     * @param state state object to validate
     * @return true if the given proof is closed and valid, false otherwise
     */
    abstract fun checkCloseOnState(state: State): Boolean

    /**
     * Parses a JSON state representation into a State object
     * @param json JSON state representation
     * @return parsed state object
     */
    abstract fun jsonToState(json: String): State

    /**
     * Serializes a state object to JSON
     * @param state State object
     * @return JSON state representation
     */
    abstract fun stateToJson(state: State): String
}
