package kalkulierbar.psc

import kalkulierbar.IllegalMove
import kalkulierbar.logic.Var
import kalkulierbar.parsers.PropositionalParser
import kalkulierbar.sequentCalculus.psc.PSC
import kalkulierbar.sequentCalculus.*
import kotlin.test.*

class TestNotRight {
    val instance = PSC()
    val parser = PropositionalParser()

    @Test
    fun testBasic(){
        var state = instance.parseFormulaToState("!a", null)

        state = instance.applyMoveOnState(state, NotRight(0,0))
        val formula1 = parser.parse("a ")
        val node1 = state.tree[state.tree.size - 1]

        assertTrue(node1.leftFormulas[0].synEq(formula1))

        assertTrue(node1.leftFormulas[0] is Var)
    }

    @Test
    fun testParent(){
        var state = instance.parseFormulaToState("!a ", null)
        assertTrue(state.tree[0].parent == null)

        state = instance.applyMoveOnState(state, NotRight(0,0))

        assertTrue(state.tree[0].children.size == 1)
        assertEquals(state.tree[1].parent, 0)
    }

    @Test
    fun testWrongNode() {
        var state = instance.parseFormulaToState("a & !a", null)

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, NotRight(0,0))
        }
    }
}