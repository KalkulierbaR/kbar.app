import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import ControlFAB from "../../../components/control-fab";
import Dialog from "../../../components/dialog";
import FAB from "../../../components/fab";
import CenterIcon from "../../../components/icons/center";
import CheckCircleIcon from "../../../components/icons/check-circle";
import FactoriseIcon from "../../../components/icons/factorise";
import HideIcon from "../../../components/icons/hide";
import ShowIcon from "../../../components/icons/show";
import OptionList from "../../../components/input/option-list";
import ResolutionCircle from "../../../components/resolution/circle";
import { checkClose, sendMove } from "../../../helpers/api";
import { useAppState } from "../../../helpers/app-state";
import {atomToString, FOLitToString} from "../../../helpers/clause";
import {
    getFOCandidateClauses, getPropCandidateClauses,
    hideClause,
    showHiddenClauses,
} from "../../../helpers/resolution";
import {Calculus, ResolutionCalculusType} from "../../../types/app";
import {
    Atom, FOAtom,
    FOCandidateClause, instanceOfStringClause,
    PropCandidateClause
} from "../../../types/clause";
import {instanceOfFOResolutionState, instanceOfPropResolutionState} from "../../../types/resolution";
import {foExample, propExample} from "./example";

interface Props {
    /**
     * Which calculus to use
     */
    calculus: ResolutionCalculusType;
}


type SelectedClauses = undefined | [number] | [number, number];

const ResolutionView: preact.FunctionalComponent<Props> = ({ calculus }) => {
    const {
        server,
        [calculus]: cState,
        onError,
        onChange,
        onSuccess,
        smallScreen,
    } = useAppState();

    let state = cState;
    const isProp = calculus === Calculus.propResolution;
    const isFO = calculus === Calculus.foResolution;

    const apiInfo = { onChange, onError, server };

    if (!state) {
        // return <p>Keine Daten vorhanden</p>;
        // Default state for easy testing
        state = isProp ? propExample : isFO ? foExample : undefined;
        onChange(calculus, state);
    }

    const [selectedClauses, setSelectedClauses] = useState<SelectedClauses>(
        undefined
    );
    const [showFactoriseDialog, setShowFactoriseDialog] = useState(
        false
    );
    const [selectedFactorizeOption, setSelectedFactorizeOption] = useState<number|undefined>(
        undefined
    );

    const selectedClauseId =
        selectedClauses === undefined ? undefined : selectedClauses[0];

    const selectedClauseAtomsLengthEqual = (length: number) =>
        selectedClauseId === undefined ? false :
            state!.clauseSet.clauses[selectedClauseId].atoms.length === length;

    const selectedClauseAtomsLengthGreater = (length: number) =>
        selectedClauseId === undefined ? false :
            state!.clauseSet.clauses[selectedClauseId].atoms.length > length;

    const showLiteralDialog = selectedClauses && selectedClauses.length === 2;

    let candidateClauses : PropCandidateClause[] | FOCandidateClause[] = [];
    if (isProp && instanceOfPropResolutionState(state)){
        candidateClauses = getPropCandidateClauses(
            state.clauseSet,
            state.highlightSelectable,
            selectedClauseId,
        );
    }
    else if (isFO && instanceOfFOResolutionState(state)){
        candidateClauses = getFOCandidateClauses(
            state.clauseSet,
            state.highlightSelectable,
            selectedClauseId,
        );
    }

    /**
     * The function to call when the user selects a clause
     * @param {number} newClauseId - The id of the clause that was clicked on
     * @returns {void}
     */
    const selectClauseCallback = (newClauseId: number) => {
        if (selectedClauseId === undefined) {
            setSelectedClauses([newClauseId]);
        } else if (newClauseId === selectedClauseId) {
            // The same clause was selected again => reset selection
            setSelectedClauses(undefined);
        } else {
            let candidateClause : PropCandidateClause | FOCandidateClause;
            let foundCandidate = false;
            candidateClauses.forEach((clause: PropCandidateClause | FOCandidateClause) => {
                if(!foundCandidate && clause.index === newClauseId){
                    candidateClause = clause;
                    foundCandidate = true;
                }
            });
            if(foundCandidate) {
                if (candidateClause!.candidateLiterals.length > 1) {
                    // Show dialog for literal selection
                    setSelectedClauses([selectedClauses![0], newClauseId]);
                    return;
                }

                const resolventLiteralId =
                    candidateClause!.candidateLiterals.length === 0
                        ? null
                        : candidateClause!.candidateLiterals[0];

                if(resolventLiteralId != null) {
                    // Send resolve move to backend
                    if (instanceOfStringClause(candidateClause!.clause) && isProp && instanceOfPropResolutionState(state)) {
                        const literal = candidateClause!.clause.atoms[
                                candidateClause!.candidateLiterals[0]
                            ].lit;
                        sendMove(
                            server,
                            calculus,
                            state!,
                            {
                                type: "res-resolve",
                                c1: selectedClauseId,
                                c2: newClauseId,
                                literal,
                            },
                            onChange,
                            onError,
                        );
                    } else if (isFO && instanceOfFOResolutionState(state)) {
                        sendMove(
                            server,
                            calculus,
                            state!,
                            {
                                type: "res-resolveunify",
                                c1: selectedClauseId,
                                c2: newClauseId,
                                l1: candidateClauses[0].index,
                                l2: resolventLiteralId,
                            },
                            onChange,
                            onError,
                        );
                    }
                }
            }
            // Reset selection
            setSelectedClauses(undefined);
        }
    };

    const literalOptions = () => {
        const options: string[] = [];
        if (selectedClauses && selectedClauses.length === 2){
            candidateClauses[selectedClauses[1]].candidateLiterals.map(
                (atomIndex) => {
                    const literal = candidateClauses[
                            selectedClauses[1]
                        ].clause.atoms[atomIndex].lit;

                    options.push(typeof literal === "string" ? literal : FOLitToString(literal));
                }
            )
        }
        return options;
    };

    const selectLiteralOption = (optionIndex: number) => {
        if(selectedClauses && selectedClauses.length === 2) {
            if (isProp && instanceOfPropResolutionState(state)) {
                sendMove(
                    server,
                    calculus,
                    state!,
                    {
                        type: "res-resolve",
                        c1: selectedClauseId!,
                        c2: selectedClauses[1],
                        literal: literalOptions()[optionIndex],
                    },
                    onChange,
                    onError,
                );
            } else if (isFO && instanceOfFOResolutionState(state)) {
                sendMove(
                    server,
                    calculus,
                    state!,
                    {
                        type: "res-resolveunify",
                        c1: selectedClauseId!,
                        c2: selectedClauses[1],
                        l1: optionIndex,
                        l2: candidateClauses[selectedClauses[1]].index,
                    },
                    onChange,
                    onError,
                );
            }
        }
        setSelectedClauses(undefined);
    };

    const factorizeOptions = () => {
        let options: string[] = [];
        if(state !== undefined && selectedClauseId !== undefined) {
            if (isProp && instanceOfPropResolutionState(state)) {
                console.log(state.clauseSet.clauses[selectedClauseId].atoms);
                options = state.clauseSet.clauses[selectedClauseId].atoms.map((atom: Atom) => atomToString(atom));
            } else if (isFO && instanceOfFOResolutionState(state)) {
                options = state.clauseSet.clauses[selectedClauseId].atoms.map((atom: FOAtom) => atomToString(atom));
            }
        }
        return options;
    };

    const selectFactorizeOption = (optionIndex: number) => {
        if(selectedFactorizeOption === undefined){
            setSelectedFactorizeOption(optionIndex);
        }
        else if(optionIndex === selectedFactorizeOption){
            // Same option was selected again -> deselect it
            setSelectedFactorizeOption(undefined);
        }
        else {
            sendMove(
                server,
                calculus,
                state!,
                {
                    type: "res-factorize",
                    c1: selectedClauseId!,
                    a1: selectedFactorizeOption,
                    a2: optionIndex,
                },
                onChange,
                onError,
            );
            setShowFactoriseDialog(false);
            setSelectedClauses(undefined);
        }
    };

    return (
        <Fragment>
            <h2>Resolution View</h2>
            <ResolutionCircle
                clauses={candidateClauses}
                selectClauseCallback={selectClauseCallback}
                selectedClauseId={selectedClauseId}
                highlightSelectable={state!.highlightSelectable}
                newestNode={state!.newestNode}
            />
            <ControlFAB alwaysOpen={!smallScreen}>
                {selectedClauseId !== undefined ?
                    <Fragment>
                        <FAB
                            mini={true}
                            extended={true}
                            label="Hide clause"
                            showIconAtEnd={true}
                            icon={<HideIcon />}
                            onClick={() => {
                                hideClause(
                                    selectedClauseId,
                                    calculus,
                                    {
                                        ...apiInfo,
                                        state,
                                    },
                                );
                                setSelectedClauses(undefined);
                            }}
                        />
                        {selectedClauseAtomsLengthGreater(0) ?
                            <FAB
                                mini={true}
                                extended={true}
                                label="Factorize"
                                showIconAtEnd={true}
                                icon={<FactoriseIcon />}
                                onClick={() => {
                                    if (selectedClauseAtomsLengthEqual(2)) {
                                        sendMove(
                                            server,
                                            calculus,
                                            state!,
                                            {
                                                type: "res-factorize",
                                                c1: selectedClauseId,
                                                a1: 0,
                                                a2: 1,
                                            },
                                            onChange,
                                            onError,
                                        );
                                        return;
                                    }
                                    setShowFactoriseDialog(true);
                                }}
                            />
                        : undefined}
                    </Fragment>
                : undefined }
                {state!.hiddenClauses.clauses.length > 0 ? (
                    <FAB
                        mini={true}
                        extended={true}
                        label="Show all"
                        showIconAtEnd={true}
                        icon={<ShowIcon />}
                        onClick={() => {
                            showHiddenClauses(calculus, {
                                ...apiInfo,
                                state,
                            });
                            setSelectedClauses(undefined);
                        }}
                    />
                ) : undefined}
                <FAB
                    mini={true}
                    extended={true}
                    label="Center"
                    showIconAtEnd={true}
                    icon={<CenterIcon />}
                    onClick={() => dispatchEvent(new CustomEvent("center"))}
                />
                <FAB
                    icon={<CheckCircleIcon />}
                    label="Check"
                    mini={true}
                    extended={true}
                    showIconAtEnd={true}
                    onClick={() =>
                        checkClose(
                        server,
                        onError,
                        onSuccess,
                        calculus,
                        state,
                        )
                    }
                />
            </ControlFAB>
            <Dialog
                open={showLiteralDialog}
                label="Choose Literal"
                onClose={() => setSelectedClauses([selectedClauses![0]])}
            >
                <OptionList
                    options={literalOptions()}
                    selectOptionCallback={selectLiteralOption}
                />
            </Dialog>
            <Dialog
                open={showFactoriseDialog}
                label="Choose 2 atoms to factorize"
                onClose={() => setShowFactoriseDialog(false)}
            >
                <OptionList
                    options={factorizeOptions()}
                    selectedOptionId={selectedFactorizeOption}
                    selectOptionCallback={selectFactorizeOption}
                />
            </Dialog>
        </Fragment>
    );
};

export default ResolutionView;