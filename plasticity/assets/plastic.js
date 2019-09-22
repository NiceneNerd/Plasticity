function crc32(string) {
    return new Checksum('crc32').updateStringly(string).result;
}

function populate_ais(aiprog) {
    for (const [idx, ai] of Object.entries(aiprog.ais)) {
        $('#ai_list').append(
            `<option value="${parseInt(idx.replace('AI_', ''))}">${idx}: ${ai.objects.Def.params.ClassName.String32}</option>`
        );
    }
}

class ParameterList {
    constructor(data) {
        this.lists = data.lists;
        this.objects = data.objects;
    }

    object(name) {
        return this.objects[crc32(name)]
    }

    list(name) {
        return this.lists[crc32(name)]
    }

    set_object(name, value) {
        this.objects[crc32(name)] = value;
    }

    set_list(name, value) {
        this.lists[crc32(name)] = value;
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
        return this.params[crc32(name)];
    }

    set_param(name, value) {
        this.params[crc32(name)] = value;
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
            ais[`AI_${i}`] = ai;
            return ais;
        }, {});
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
}