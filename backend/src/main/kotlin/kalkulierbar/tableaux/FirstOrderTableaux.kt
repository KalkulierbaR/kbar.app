package kalkulierbar.tableaux

import kalkulierbar.IllegalMove
import kalkulierbar.JSONCalculus
import kalkulierbar.JsonParseException
import kalkulierbar.UnificationImpossible
import kalkulierbar.logic.FirstOrderTerm
import kalkulierbar.logic.FoTermModule
import kalkulierbar.logic.Relation
import kalkulierbar.logic.transform.FirstOrderCNF
import kalkulierbar.logic.transform.Unification
import kalkulierbar.logic.transform.VariableInstantiator
import kalkulierbar.parsers.FirstOrderParser
import kotlinx.serialization.json.Json

val serializer = Json(context = FoTermModule)

@Suppress("TooManyFunctions")
class FirstOrderTableaux : GenericTableaux<Relation>, JSONCalculus<FoTableauxState, FoTableauxMove, FoTableauxParam>() {

    override val identifier = "fo-tableaux"

    override fun parseFormulaToState(formula: String, params: FoTableauxParam?): FoTableauxState {
        val clauses = FirstOrderCNF.transform(FirstOrderParser.parse(formula))

        if (params == null)
            return FoTableauxState(clauses, formula)

        return FoTableauxState(clauses, formula, params.type, params.regular, params.backtracking, params.manualVarAssign)
    }

    override fun applyMoveOnState(state: FoTableauxState, move: FoTableauxMove): FoTableauxState {
        // Pass expand, close, undo moves to relevant subfunction
        return when (move.type) {
            FoMoveType.AUTOCLOSE -> applyAutoCloseBranch(state, move.id1, move.id2)
            FoMoveType.CLOSE -> applyMoveCloseBranch(state, move.id1, move.id2, move.getVarAssignTerms())
            FoMoveType.EXPAND -> applyMoveExpandLeaf(state, move.id1, move.id2)
            FoMoveType.UNDO -> applyMoveUndo(state)
        }
    }

    /**
     * Attempt to close a branch using automatic unification
     * @param state State to apply the close move in
     * @param leafID Leaf to close
     * @param closeNodeID Node to close the leaf with
     * @return state with the close move applied
     */
    private fun applyAutoCloseBranch(state: FoTableauxState, leafID: Int, closeNodeID: Int): FoTableauxState {
        if (state.manualVarAssign)
            throw IllegalMove("Auto-close is not enabled for this proof")

        ensureBasicCloseability(state, leafID, closeNodeID)
        val leaf = state.nodes[leafID]
        val closeNode = state.nodes[closeNodeID]

        // Try to find a unifying variable assignment and pass it to the internal close method
        // which will handle the verification, tree modification, and history management for us
        try {
            val varAssign = Unification.unify(leaf.relation, closeNode.relation)
            return closeBranchCommon(state, leafID, closeNodeID, varAssign)
        } catch (e: UnificationImpossible) {
            throw IllegalMove("Cannot unify '$leaf' and '$closeNode': ${e.message}")
        }
    }

    /**
     * Attempt to close a branch using manual unification
     * @param state State to apply the close move in
     * @param leafID Leaf to close
     * @param closeNodeID Node to close the leaf with
     * @param varAssign Map of variable names and terms to replace them with
     * @return state with the close move applied
     */
    private fun applyMoveCloseBranch(
        state: FoTableauxState,
        leafID: Int,
        closeNodeID: Int,
        varAssign: Map<String, FirstOrderTerm>
    ): FoTableauxState {
        ensureBasicCloseability(state, leafID, closeNodeID)
        return closeBranchCommon(state, leafID, closeNodeID, varAssign)
    }

    /**
     * Close a branch using either computed or manually entered variable assignments
     * NOTE: This does NOT verify closeability.
     *       It is assumed that ensureBasicCloseability has been called before.
     * @param state State to apply the close move in
     * @param leafID Leaf to close
     * @param closeNodeID Node to close the leaf with
     * @param varAssign Map of variable names and terms to replace them with
     * @return state with the close move applied
     */
    private fun closeBranchCommon(
        state: FoTableauxState,
        leafID: Int,
        closeNodeID: Int,
        varAssign: Map<String, FirstOrderTerm>
    ): FoTableauxState {

        // Apply all specified variable instantiations globally
        applyVarInstantiation(state, varAssign)

        val leaf = state.nodes[leafID]
        val closeNode = state.nodes[closeNodeID]

        if (leaf.relation != closeNode.relation)
            throw IllegalMove("Node '$leaf' and '$closeNode' are not equal after variable instantiation")

        // Instantiating variables globally may violate regularity in unexpected places
        if (state.regular && !checkRegularity(state))
            throw IllegalMove("This variable instantiation would violate the proof regularity")

        // Close branch
        leaf.closeRef = closeNodeID
        setNodeClosed(state, leaf)

        // Record close move for backtracking purposes
        if (state.backtracking) {
            val varAssignStrings = varAssign.mapValues { it.value.toString() }
            val move = FoTableauxMove(FoMoveType.CLOSE, leafID, closeNodeID, varAssignStrings)
            state.moveHistory.add(move)
        }

        return state
    }

    /**
     * Expand a clause at a given leaf in the proof tree
     * @param state State to apply expansion in
     * @param leafID Leaf to expand
     * @param clauseID Clause to expand
     * @return State with the expansion applied
     */
    private fun applyMoveExpandLeaf(state: FoTableauxState, leafID: Int, clauseID: Int): FoTableauxState {

        // Ensure that preconditions (correct indices, regularity) are met
        ensureExpandability(state, leafID, clauseID)
        val clause = state.clauseSet.clauses[clauseID]
        val leaf = state.nodes[leafID]

        // Quantified variables need to be unique in every newly expanded clause
        // So we append a suffix with the number of the current expansion to every variable
        val atoms = state.clauseExpandPreprocessing(clause)

        // Add new leaves to the proof tree
        for (atom in atoms) {
            val newLeaf = FoTableauxNode(leafID, atom.lit, atom.negated)
            state.nodes.add(newLeaf)
            leaf.children.add(state.nodes.size - 1)
        }

        // Verify compliance with connectedness criteria
        verifyExpandConnectedness(state, leafID)

        // Record expansion for backtracking
        if (state.backtracking)
            state.moveHistory.add(FoTableauxMove(FoMoveType.EXPAND, leafID, clauseID))

        state.expansionCounter += 1

        return state
    }

    /**
     * Undo a rule application by re-building the state from the move history
     * @param state State in which to apply the undo
     * @return Equivalent state with the most recent rule application removed
     */
    private fun applyMoveUndo(state: FoTableauxState): FoTableauxState {
        if (!state.backtracking)
            throw IllegalMove("Backtracking is not enabled for this proof")

        // Create a fresh clone-state with the same parameters and input formula
        val params = FoTableauxParam(state.type, state.regular, state.backtracking, state.manualVarAssign)
        var freshState = parseFormulaToState(state.formula, params)
        freshState.usedBacktracking = true

        // We don't want to re-do the last move
        state.moveHistory.removeAt(state.moveHistory.size - 1)

        // Re-build the proof tree in the clone state
        state.moveHistory.forEach {
            freshState = applyMoveOnState(freshState, it)
        }

        return freshState
    }

    override fun checkCloseOnState(state: FoTableauxState) = getCloseMessage(state)

    /**
     * Apply a global variable instantiation in the proof tree
     * @param state State to apply instantiation in
     * @param varAssign Map of which variables to replace with which terms
     * @return State with all occurences of variables in the map replaced with their respective terms
     */
    private fun applyVarInstantiation(state: FoTableauxState, varAssign: Map<String, FirstOrderTerm>): FoTableauxState {
        val instantiator = VariableInstantiator(varAssign)

        state.nodes.forEach {
            it.relation.arguments = it.relation.arguments.map { it.accept(instantiator) }
        }

        return state
    }

    /**
     * Parses a JSON state representation into a TableauxState object
     * @param json JSON state representation
     * @return parsed state object
     */
    @Suppress("TooGenericExceptionCaught")
    @kotlinx.serialization.UnstableDefault
    override fun jsonToState(json: String): FoTableauxState {
        try {
            val parsed = serializer.parse(FoTableauxState.serializer(), json)

            // Ensure valid, unmodified state object
            if (!parsed.verifySeal())
                throw JsonParseException("Invalid tamper protection seal, state object appears to have been modified")

            return parsed
        } catch (e: Exception) {
            val msg = "Could not parse JSON state: "
            throw JsonParseException(msg + (e.message ?: "Unknown error"))
        }
    }

    /**
     * Serializes internal state object to JSON
     * @param state State object
     * @return JSON state representation
     */
    @kotlinx.serialization.UnstableDefault
    override fun stateToJson(state: FoTableauxState): String {
        state.render()
        state.computeSeal()
        return serializer.stringify(FoTableauxState.serializer(), state)
    }

    /*
     * Parses a JSON move representation into a TableauxMove object
     * @param json JSON move representation
     * @return parsed move object
     */
    @Suppress("TooGenericExceptionCaught")
    @kotlinx.serialization.UnstableDefault
    override fun jsonToMove(json: String): FoTableauxMove {
        try {
            return Json.parse(FoTableauxMove.serializer(), json)
        } catch (e: Exception) {
            val msg = "Could not parse JSON move: "
            throw JsonParseException(msg + (e.message ?: "Unknown error"))
        }
    }

    /*
     * Parses a JSON parameter representation into a TableauxParam object
     * @param json JSON parameter representation
     * @return parsed param object
     */
    @Suppress("TooGenericExceptionCaught")
    @kotlinx.serialization.UnstableDefault
    override fun jsonToParam(json: String): FoTableauxParam {
        try {
            return Json.parse(FoTableauxParam.serializer(), json)
        } catch (e: Exception) {
            val msg = "Could not parse JSON params"
            throw JsonParseException(msg + (e.message ?: "Unknown error"))
        }
    }
}