import { Fragment, h } from "preact";
import { PropCalculusType } from "../../../../types/calculus";
import { PSCState } from "../../../../types/calculus/psc";
import { useAppState } from "../../../../util/app-state";
import AddIcon from "../../../icons/add";
import ControlFAB from "../../../input/control-fab";
import CheckCloseFAB from "../../../input/fab/check-close";
import DownloadFAB from "../../../input/fab/download";
import FAB from "../../../input/fab";
import UndoIcon from "../../../icons/undo";
import { sendMove } from "../../../../util/api";

interface Props {
    /**
     * Which calculus to use
     */
    calculus:PropCalculusType;
    /**
     * The current calculus state
     */
    state: PSCState;
    /**
     * Which node is currently selected
     */
    selectedNodeId?: number;
    /**
     * Callback if expand FAB is clicked
     */
    expandCallback: () => void;
}

const PSCFAB: preact.FunctionalComponent<Props> = ({
    calculus,
    state,
    selectedNodeId,
    expandCallback,
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
                                    }
                                }}
                            />
                    </Fragment>
                ) : (
                    <Fragment>
                        <FAB
                            icon={<AddIcon />}
                            label="Expand"
                            mini={true}
                            extended={true}
                            showIconAtEnd={true}
                            onClick={expandCallback}
                        />
                    </Fragment>
                )}   
            </ControlFAB>
                
        </Fragment>
    );
}; 

export default PSCFAB;