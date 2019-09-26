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

class AiProgram {
    constructor(pio) {
        this._aiprog = pio;
        this._ais = Object.keys(pio.lists.param_root.lists.AI.lists).map(key => pio.lists.param_root.lists.AI.lists[key]);
        this._actions = Object.keys(pio.lists.param_root.lists.Action.lists).map(key => pio.lists.param_root.lists.Action.lists[key]);
        this._behaviors = Object.keys(pio.lists.param_root.lists.Behavior.lists).map(key => pio.lists.param_root.lists.Behavior.lists[key]);
        this._queries = Object.keys(pio.lists.param_root.lists.Query.lists).map(key => pio.lists.param_root.lists.Query.lists[key]);
    }

    get ais() {
        return this._ais.reduce((ais, ai, i) => {
            ais[`AI_${i}`] = new ParameterList(ai);
            return ais;
        }, {});
    }

    get_ai_by_index(idx) {
        return new ParameterList(this._ais[idx]);
    }


    get actions() {
        return this._actions.reduce((actions, action, i) => {
            actions[`Action_${i}`] = action;
            return actions;
        }, {});
    }

    get behaviors() {
        return this._behaviors.reduce((behaviors, behavior, i) => {
            behaviors[`Behavior_${i}`] = behavior;
            return behaviors;
        }, {});
    }

    get queries() {
        return this._queries.reduce((queries, query, i) => {
            queries[`Query_${i}`] = query;
            return queries;
        }, {});
    }
    
    get items() {
        return [...this._ais, ...this._actions, ...this._behaviors, ...this._queries]
    }
}

function get_ai_label(idx, ai) {
    return `${idx.replace(/[A-Za-z]+_/, '')}. ` +
            ((ai.objects.Def.params.Name)
                ? ((ai.objects.Def.params.Name.str || ai.objects.Def.params.Name.String32) + `: `)
                : '') +
           `${ai.objects.Def.params.ClassName.String32}`;
}