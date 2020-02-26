import { Calculus, ResolutionCalculusType } from "./app";
import { ClauseSet, FOClauseSet } from "./clause";
import { KNumMap, KPair } from "./kotlin";
import { CnfStrategy, VarAssign } from "./tableaux";

export interface PropResolutionState {
    seal: string;
    clauseSet: ClauseSet;
    hiddenClauses: ClauseSet;
    visualHelp: VisualHelp;
    newestNode: number;
}

export enum VisualHelp {
    none = "NONE",
    highlight = "HIGHLIGHT",
    rearrange = "REARRANGE",
}

export function instanceOfPropResState(
    object: any,
    calculus: ResolutionCalculusType,
): object is PropResolutionState {
    return "clauseSet" in object && calculus === Calculus.propResolution;
}

export interface ResolutionResolveMove {
    type: "res-resolve";
    c1: number;
    c2: number;
    literal: string | null;
}

export type HyperMap = KNumMap<KPair<number, number>>;

export interface HyperResolutionMove {
    type: "res-hyper";
    mainID: number;
    atomMap: HyperMap;
}

export interface ResolutionResolveUnifyMove {
    type: "res-resolveunify";
    c1: number;
    c2: number;
    l1: number;
    l2: number;
}

export interface ResolutionInstantiateMove {
    type: "res-instantiate";
    c1: number;
    varAssign: VarAssign;
}

export interface ResolutionHideMove {
    type: "res-hide";
    c1: number;
}

export interface ResolutionShowMove {
    type: "res-show";
}

export interface PropResolutionFactorizeMove {
    type: "res-factorize";
    c1: number;
}

export interface FOResolutionFactorizeMove {
    type: "res-factorize";
    c1: number;
    atoms: number[];
}

export type BaseResolutionMove =
    | ResolutionResolveMove
    | ResolutionHideMove
    | ResolutionShowMove
    | HyperResolutionMove;

export type PropResolutionMove =
    | BaseResolutionMove
    | PropResolutionFactorizeMove;

export type FOResolutionMove =
    | BaseResolutionMove
    | ResolutionResolveUnifyMove
    | ResolutionInstantiateMove
    | FOResolutionFactorizeMove;

export interface PropResolutionParams {
    cnfStrategy: CnfStrategy;
    visualHelp: VisualHelp;
}

export interface FOResolutionState {
    seal: string;
    clauseSet: FOClauseSet;
    visualHelp: VisualHelp;
    hiddenClauses: FOClauseSet;
    newestNode: number;
}

export function instanceOfFOResState(
    object: any,
    calculus: ResolutionCalculusType,
): object is FOResolutionState {
    return "clauseSet" in object && calculus === Calculus.foResolution;
}

export interface FOResolutionParams {
    visualHelp: VisualHelp;
}