import { Fragment, h } from "preact";
import { PropCalculusType, PSCCalculusType } from "../../../../types/calculus";
import { FOSCState, PSCState } from "../../../../types/calculus/psc";
import { useAppState } from "../../../../util/app-state";
import AddIcon from "../../../icons/add";
import ControlFAB from "../../../input/control-fab";
import CheckCloseFAB from "../../../input/fab/check-close";
import DownloadFAB from "../../../input/fab/download";
import FAB from "../../../input/fab";
import UndoIcon from "../../../icons/undo";
import { sendMove } from "../../../../util/api";
import { PSCUndoMove } from "../../../../types/calculus/psc"
import SplitIcon from "../../../icons/split";
import LemmaIcon from "../../../icons/lemma";
import { hyperFab } from "../../../../routes/resolution/view/style.scss";
import HyperIcon from "../../../icons/hyper";
import RouterIcon from "../../../icons/router";
import SwitchIcon from "../../../icons/switch";
import RuleIcon from "../../../icons/rule";
import DeleteIcon from "../../../icons/delete";

interface Props {
    /**
     * Which calculus to use
     */
    calculus:PSCCalculusType;
    /**
     * The current calculus state
     */
    state: PSCState|FOSCState;
    /**
     * Which node is currently selected
     */
    selectedNodeId?: number;
    /**
     * Opens Rule Dialog
     */
    ruleCallback: () => void;
    /**
     * Deletes selected Branch
     */
    pruneCallback: () => void;
}

const PSCFAB: preact.FunctionalComponent<Props> = ({
    calculus,
    state,
    selectedNodeId,
    ruleCallback,
    pruneCallback,
}) => {
    const {
        server,
        smallScreen,
        onChange,
        notificationHandler
    } = useAppState();

    return(
        <Fragment>
            <ControlFAB
                alwaysOpen={!smallScreen}
                couldShowCheckCloseHint={false}
                checkFABPositionFromBottom={1}
            >
                {selectedNodeId === undefined ? (
                    <Fragment>
                        <DownloadFAB
                            state={state}
                            name={calculus}
                            type={calculus}
                        />
                        <CheckCloseFAB calculus={calculus}/>
                        <FAB
                                icon={<UndoIcon />}
                                label="Undo"
                                mini={true}
                                extended={true}
                                showIconAtEnd={true}
                                onClick={() => {
                                    // If the last move added a node, and we undo this, remove the corresponding drag
                                    if (state.tree.length > 0) {
                                        sendMove(
                                            server,
                                            calculus,
                                            state,
                                            {type: "undo"},
                                            onChange,
                                            notificationHandler
                                        )
                                    } else {
                                        return;
                                    }
                                }}
                            />
                    </Fragment>
                ) : (
                    
                    <Fragment>
                        <FAB
                            icon={<RuleIcon/>}
                            label="Rules"
                            mini={true}
                            extended={true}
                            showIconAtEnd={true}
                            onClick={() => {
                                ruleCallback();
                            }}
                        />
                        <FAB
                            icon={<DeleteIcon/>}
                            label="Prune"
                            mini={true}
                            extended={true}
                            showIconAtEnd={true}
                            onClick={() => {
                                pruneCallback();
                            }}
                            />
                    </Fragment>

                )}   
            </ControlFAB>
                
        </Fragment>
    );
}; 

export default PSCFAB;