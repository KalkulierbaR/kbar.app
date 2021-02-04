export interface Rule<L = string>{
    name: L;
    site: string;
    applicableOn?: string;
}
export interface  RuleSet<L=string>{
    rules: Rule<L>[];
} 
export function getNormalRuleSet(){
    const ruleSet: RuleSet<string> = {rules: [
        {name:"Ax",site:"both"},
        {name:"notLeft",site:"left", applicableOn: "not"},
        {name:"notRight",site:"right", applicableOn: "not"},
        {name:"andLeft",site:"left", applicableOn: "and"},
        {name:"andRight",site:"right", applicableOn: "and"},
        {name:"orLeft",site:"left", applicableOn: "or"},
        {name:"orRight",site:"right", applicableOn: "or"},
        {name:"impLeft",site:"left", applicableOn: "impl"},
        {name:"impRight",site:"right", applicableOn: "impl"}
    ]}
    return ruleSet;
}

export function getFORuleSet(){
    const ruleSet: RuleSet<string> = {rules: [
        {name:"Ax",site:"both"},
        {name:"notLeft",site:"left", applicableOn: "not"},
        {name:"notRight",site:"right", applicableOn: "not"},
        {name:"andLeft",site:"left", applicableOn: "and"},
        {name:"andRight",site:"right", applicableOn: "and"},
        {name:"orLeft",site:"left", applicableOn: "or"},
        {name:"orRight",site:"right", applicableOn: "or"},
        {name:"impLeft",site:"left", applicableOn: "impl"},
        {name:"impRight",site:"right", applicableOn: "impl"},
        {name:"allLeft",site:"left", applicableOn: "allquant"},
        {name:"allRight",site:"right", applicableOn: "allquant"},
        {name:"exLeft",site:"left", applicableOn: "exquant"},
        {name:"exRight",site:"right", applicableOn: "exquant"},
    ]}
    return ruleSet;
}

export type SelectedRule = undefined | [number];