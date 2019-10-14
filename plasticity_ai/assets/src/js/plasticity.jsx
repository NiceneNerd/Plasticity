import React, { Component } from "react";
import ReactDOM from "react-dom";
import AiProgram from './aiprog.jsx';
import {TreeItem, PlasticContext} from './general.jsx';
import ProgramItemsView from './items.jsx';

export default class PlasticityRoot extends Component {

    constructor(props) {
        super(props);
        this.state = {
            aiprog: null,
            classes: null,
            trans: null,
            selected: null,
            modified: false,
            path: '',
            loading: false
        }
    }

    async add_ai(type, new_ai) {
        this.set_loading();
        let new_prog = new AiProgram(
            await pywebview.api.add_ai_item({
                'ai': new_ai,
                'prog': this.state.aiprog,
                'type': type
            }),
            this.state.trans
        );
        this.setState({aiprog: new_prog, modified: true, loading: false})
    }

    async remove_ai(idx) {
        this.set_loading();
        let new_prog = new AiProgram(
            await pywebview.api.remove_ai_item({
                idx,
                prog: this.state.aiprog
            }),
            this.state.trans
        );
        this.setState({aiprog: new_prog, modified: true, loading: false});
    }

    update_item(idx, new_item) {
        this.setState({loading: true}, () => {
            let new_pio = this.state.aiprog.clone_pio();
            if (idx.startsWith('AI'))
                new_pio.lists.param_root.lists.AI.lists[idx] = new_item;
            else if (idx.startsWith('Action'))
                new_pio.lists.param_root.lists.Action.lists[idx] = new_item;
            else if (idx.startsWith('Behavior'))
                new_pio.lists.param_root.lists.Behavior.lists[idx] = new_item;
            else if (idx.startsWith('Query'))
                new_pio.lists.param_root.lists.Query.lists[idx] = new_item;
            
            this.setState({
                aiprog: new AiProgram(new_pio), 
                modified: true, 
                loading: false
            });
        });
    }

    async open_file() {
        this.setState({loading: true}, async () => {
            let utils = false;
            if (!this.state.classes || !this.state.trans) {
                const {defs, trans} = await pywebview.api.init()
                utils = { defs, trans };
            }
            pywebview.api.open_file()
                .then(open_ai => {
                    if (open_ai) {
                        if (!open_ai.path) this.setState({loading: false});
                        const aiprog = new AiProgram(open_ai.pio);
                        if (utils) this.setState({
                            aiprog,
                            classes: utils.defs,
                            trans: utils.trans,
                            modified: false,
                            path: open_ai.path,
                            selected: null,
                            loading: false
                        });
                        else this.setState({
                            aiprog,
                            modified: false,
                            path: open_ai.path,
                            selected: null,
                            loading: false
                        });
                    }
                });
        });
    }

    async save_file(path) {
        this.set_loading();
        const response = await pywebview.api.save_file({
            pio: this.state.aiprog.clone_pio(),
            path
        })
        if (response.error)
            alert(`The following error occured when saving this file: ${response.error}`);
        else this.setState({ modified: false, path, loading: false });
    }

    selectItem(idx) {
        $('.tab-pane').removeClass('active show');
        $(`.nav a`).removeClass('active');
        let cat;
        if (idx < this.state.aiprog.actions_offset) {
            cat = 'ai';
            $('#ai_list').val(`AI_${idx}`);
        } else if (idx < this.state.aiprog.behaviors_offset) {
            cat = 'action';
            $('#action_list').val(`Action_${idx - this.state.aiprog.actions_offset}`);
        } else if (idx < this.state.aiprog.queries_offset) {
            cat = 'behavior';
            $('#behavior_list').val(`Behavior_${idx - this.state.aiprog.behaviors}`);
        } else {
            cat = 'query';
            $('#query_list').val(`Query_${idx - this.state.aiprog.queries}`);
        }
        $(`#${cat}`).addClass('active show');
        $(`#${cat}_list`)[0].dispatchEvent(new Event('change', {bubbles:true}));
        $(`.nav a[href="#${cat}"]`).addClass('active');
    }

    set_loading = () => this.setState({loading: true});
    unset_loading = () => this.setState({loading: false})

    render() {
        return (
            <React.Fragment>
                <div className="main">
                    <div className="toolbar">
                        <button className="btn btn-icon btn-primary" onClick={() => this.open_file()}>
                            <i className="material-icons">folder_open</i> <span className="tool-label">Open</span>
                        </button>
                        <button className="btn btn-icon btn-primary" onClick={() => this.save_file(this.state.path)}>
                            <i className="material-icons">save</i> <span className="tool-label">Save</span>
                        </button>
                        <button className="btn btn-icon btn-primary" onClick={() => this.save_file('')}>
                            <i className="material-icons">content_copy</i> <span className="tool-label">Save As</span>
                        </button>
                        {this.state.path &&
                            <span className='open-path'>File Open: {this.state.path}</span>}
                        {this.state.modified &&
                            <span style={{paddingTop: '0.25rem'}} className='badge badge-primary'>Unsaved Changes</span>}
                    </div>
                    <div className="row">
                        <nav id="treebar">
                            <strong>AI Tree</strong>
                            <ul className="tree tree-root">
                                {this.state.aiprog &&
                                    this.state.aiprog.get_tree(this.state.trans)
                                        .map(node => {
                                            return (<TreeItem key={node.index.toString() + node.text}
                                                        node={node} onPick={this.selectItem.bind(this)} />)
                                })}
                            </ul>
                        </nav>
                        <div className="content">
                            <ul className="nav nav-tabs" role="navlist">
                                <li className="nav-item"><a className="active" data-toggle="tab" href="#ai">AIs</a></li>
                                <li className="nav-item"><a data-toggle="tab" href="#action">Actions</a></li>
                                <li className="nav-item"><a data-toggle="tab" href="#behavior">Behaviors</a></li>
                                <li className="nav-item"><a data-toggle="tab" href="#query">Queries</a></li>
                            </ul>
                            <div id="tabs" className="tab-content">
                                <PlasticContext.Provider value={{
                                    aiprog: this.state.aiprog,
                                    trans: this.state.trans,
                                    classes: this.state.classes
                                }}>
                                    <div id="ai" className="tab-pane fade in show active">
                                        {this.state.aiprog && 
                                            <ProgramItemsView onAdd={this.add_ai.bind(this)} onUpdate={this.update_item.bind(this)} onRemove={this.remove_ai.bind(this)}
                                                setLoading={this.set_loading.bind(this)} unsetLoading={this.unset_loading.bind(this)}
                                                items={this.state.aiprog.ais} type={'ai'} classes={this.state.classes.AIs} />}
                                    </div>
                                    <div id="action" className="tab-pane fade">
                                        {this.state.aiprog && 
                                            <ProgramItemsView onAdd={this.add_ai.bind(this)} onUpdate={this.update_item.bind(this)} onRemove={this.remove_ai.bind(this)}
                                                setLoading={this.set_loading.bind(this)} unsetLoading={this.unset_loading.bind(this)}
                                                items={this.state.aiprog.actions} type={'action'} classes={this.state.classes.Actions} />}
                                    </div>
                                    <div id="behavior" className="tab-pane fade">
                                        {this.state.aiprog &&
                                            <ProgramItemsView onAdd={this.add_ai.bind(this)} onUpdate={this.update_item.bind(this)} onRemove={this.remove_ai.bind(this)}
                                                setLoading={this.set_loading.bind(this)} unsetLoading={this.unset_loading.bind(this)}
                                                label_list={true} items={this.state.aiprog.behaviors} type={'behavior'} classes={this.state.classes.Behaviors} />}
                                    </div>
                                    <div id="query" className="tab-pane fade">
                                        {this.state.aiprog &&
                                            <ProgramItemsView onAdd={this.add_ai.bind(this)} onUpdate={this.update_item.bind(this)} onRemove={this.remove_ai.bind(this)}
                                                setLoading={this.set_loading.bind(this)} unsetLoading={this.unset_loading.bind(this)}
                                                label_list={true} items={this.state.aiprog.queries} type={'query'} classes={this.state.classes.Querys} />}
                                    </div>
                                </PlasticContext.Provider>
                            </div>
                        </div>
                    </div>
                </div>
                {this.state.loading && 
                    <div id="loader">
                        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                    </div>}
            </React.Fragment>
        );
    }
}
