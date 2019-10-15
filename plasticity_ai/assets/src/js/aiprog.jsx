class ParameterList {
    constructor(data) {
        this.lists = Object.keys(data.lists).reduce((plists, pkey) => {
            plists[pkey] = new ParameterList(data.lists[pkey]);
            return plists;
        }, {});
        this.objects = Object.keys(data.objects).reduce((pobjs, pkey) => {
            pobjs[pkey] = new ParameterObject(data.objects[pkey]);
            return pobjs;
        }, {});
    }

    object(name) {
        return this.objects[name];
    }

    list(name) {
        return this.lists[name]
    }

    set_object(name, value) {
        this.objects[name] = value;
    }

    set_list(name, value) {
        this.lists[name] = value;
    }
}

class ParameterIO extends ParameterList {
    constructor(data) {
        super(data);
        this.version = data.version;
        this.type = data.type;
    }
}

class ParameterObject {
    constructor(data) {
        this.params = data.params;
    }

    param(name) {
        return this.params[name];
    }

    set_param(name, value) {
        this.params[name] = value;
    }
}

export class AiProgram {
    constructor(pio, trans) {
        this.pio = pio;
        this._ais = Object.keys(pio.lists.param_root.lists.AI.lists).map(key => pio.lists.param_root.lists.AI.lists[key]);
        this._actions = Object.keys(pio.lists.param_root.lists.Action.lists).map(key => pio.lists.param_root.lists.Action.lists[key]);
        this._behaviors = Object.keys(pio.lists.param_root.lists.Behavior.lists).map(key => pio.lists.param_root.lists.Behavior.lists[key]);
        this._queries = Object.keys(pio.lists.param_root.lists.Query.lists).map(key => pio.lists.param_root.lists.Query.lists[key]);
        if (trans) this._trans_map = trans;
    }

    get ais() {
        return this._ais.reduce((ais, ai, i) => {
            ais[`AI_${i}`] = new AiItem(ai);
            return ais;
        }, {});
    }

    add_ai(ai) {
        if (ai.hasOwnProperty('_plist')) { this._ais.push(ai._plist); }
        else { this._ais.push(ai); }
    }

    get_ai_by_index(idx) {
        return new AiItem(this._ais[idx]);
    }


    get actions() {
        return this._actions.reduce((actions, action, i) => {
            actions[`Action_${i}`] = new AiItem(action);
            return actions;
        }, {});
    }

    get behaviors() {
        return this._behaviors.reduce((behaviors, behavior, i) => {
            behaviors[`Behavior_${i}`] = new AiItem(behavior);
            return behaviors;
        }, {});
    }

    get queries() {
        return this._queries.reduce((queries, query, i) => {
            queries[`Query_${i}`] = new AiItem(query);
            return queries;
        }, {});
    }
    
    get items() {
        return [...this._ais, ...this._actions, ...this._behaviors, ...this._queries].map(item => new AiItem(item));
    }

    get labeled_items() {
        return {
            ...this.ais,
            ...this.actions,
            ...this.behaviors,
            ...this.queries
        }
    }

    get roots() {
        return Object.values(this.ais).filter(item => !item.GroupName);
    }

    get_item_parents(idx) {
        return (idx > -1) ? this.items.filter(item => item.child_list && item.child_list.includes(idx)) : [];
    }

    get actions_offset() { return this._ais.length; }
    get behaviors_offset() { return this._ais.length + this._actions.length; }
    get queries_offset() { return this._ais.length + this._actions.length + this._behaviors.length; }

    get_item_type_index(idx) {
        if (idx < this.actions_offset) {return `AI_${idx}`} else
        if (idx < this.behaviors_offset) {return `Action_${idx - this.actions_offset}`} else
        if (idx < this.queries_offset) {return `Behavior_${idx - this.behaviors_offset}`} else
        return `Query_${idx - this.queries_offset}`;
    }

    find_item(needle) {
        for (let i = 0; i < this.items.length; i++) {
            if ((this.items[i].ClassName == needle.ClassName) &&
                (!this.items[i].Name && !needle.Name) || (this.items[i].Name == needle.Name))
                return i;
        }
        return -1;
    }

    async get_tree(trans_map) {
        return await pywebview.api
            .get_ai_tree({pio: this.pio}) || [];
        /* return this.roots.map(r => {
            const idx = this.find_item(r);
            return this._create_ai_tree(idx, trans_map)
        }); */
    }

    _create_ai_tree(idx, trans_map) {
        const ai = this.items[idx];
        let tree = {
            text: try_trans(this.items[idx].Name || this.items[idx].ClassName, trans_map),
            expanded: true,
            index: idx
        }
        if (ai._plist.objects.ChildIdx)
            tree.nodes = ai.child_list.map(i => (i >= 0) ? this._create_ai_tree(i, trans_map) : {});
        return tree;
    }

    clone_pio() {
        return JSON.parse(JSON.stringify(this.pio));
    }

}

export class AiItem {
    constructor(plist) {
        this._plist = JSON.parse(JSON.stringify(plist));
        this.ClassName = this._plist.objects.Def.params.ClassName.String32 || this._plist.objects.Def.params.ClassName.str;
        if (this._plist.objects.Def.params.Name) this.Name = this._plist.objects.Def.params.Name.str;
        if (this._plist.objects.Def.params.GroupName) this.GroupName = this._plist.objects.Def.params.GroupName.str;
    }

    get SInst() { return (this._plist.objects.SInst) ? this._plist.objects.SInst.params : null;}
    get ChildIdx() { return (this._plist.objects.ChildIdx) ? this._plist.objects.ChildIdx.params : null; }
    get BehaviorIdx() { return (this._plist.objects.BehaviorIdx) ? this._plist.objects.BehaviorIdx.params : null; }

    get child_list() {
        return Array.from(new Set(
            (this._plist.objects.ChildIdx) ?
            Object.keys(this.ChildIdx).map(key => this.ChildIdx[key].int)
            : []
        ));
    }
}

export function get_ai_label(idx, ai, trans) {
    if (ai.Name == undefined && ai.ClassName == undefined)
        ai = new AiItem(ai);
    return `${idx}: ` + 
        ((ai.Name) && ((trans ? try_trans(ai.Name, trans) : ai.Name) + ` — `)) +
        `${ai.ClassName}`; /* `${idx.replace(/[A-Za-z]+_/, '')}. ` + */
}

export function try_trans(name, trans_map) {
    return (trans_map && trans_map[name]) ? trans_map[name] : name;
}

export default AiProgram;