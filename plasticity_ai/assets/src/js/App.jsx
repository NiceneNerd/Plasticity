import React, { Component } from "react";
import {
    Button,
    ButtonToolbar,
    ButtonGroup,
    Tabs,
    Tab,
    Spinner,
    Badge
} from "react-bootstrap";
import { FolderOpen, Save, SaveAlt } from "@material-ui/icons";
import AiProgram from "./AIProg.jsx";
import { TreeItem, PlasticContext } from "./Components.jsx";
import ProgramItemsView from "./Items.jsx";

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            aiprog: null,
            classes: null,
            trans: null,
            selected: null,
            modified: false,
            path: "",
            loading: false,
            tree: null
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            this.state.aiprog != prevState.aiprog ||
            this.state.path != prevState.path
        ) {
            this.create_tree().then(tree => this.setState({ tree }));
        }
    }

    async add_ai(type, new_ai) {
        this.set_loading();
        let new_prog = new AiProgram(
            await pywebview.api.add_ai_item({
                ai: new_ai,
                prog: this.state.aiprog,
                type: type
            }),
            this.state.trans
        );
        this.setState({ aiprog: new_prog, modified: true, loading: false });
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
        this.setState({ aiprog: new_prog, modified: true, loading: false });
    }

    update_item(idx, new_item) {
        this.setState({ loading: true }, () => {
            let new_pio = this.state.aiprog.clone_pio();
            if (idx.startsWith("AI"))
                new_pio.lists.param_root.lists.AI.lists[idx] = new_item;
            else if (idx.startsWith("Action"))
                new_pio.lists.param_root.lists.Action.lists[idx] = new_item;
            else if (idx.startsWith("Behavior"))
                new_pio.lists.param_root.lists.Behavior.lists[idx] = new_item;
            else if (idx.startsWith("Query"))
                new_pio.lists.param_root.lists.Query.lists[idx] = new_item;

            this.setState({
                aiprog: new AiProgram(new_pio),
                modified: true,
                loading: false
            });
        });
    }

    async open_file() {
        this.setState({ loading: true }, async () => {
            let utils = false;
            if (!this.state.classes || !this.state.trans) {
                const { defs, trans } = await pywebview.api.init();
                utils = { defs, trans };
            }
            pywebview.api.open_file().then(open_ai => {
                if (open_ai) {
                    if (!open_ai.path) this.setState({ loading: false });
                    console.log(open_ai.pio);
                    const aiprog = new AiProgram(open_ai.pio);
                    if (utils)
                        this.setState({
                            aiprog,
                            classes: utils.defs,
                            trans: utils.trans,
                            modified: false,
                            path: open_ai.path,
                            selected: null,
                            loading: false,
                            tree: null
                        });
                    else
                        this.setState({
                            aiprog,
                            modified: false,
                            path: open_ai.path,
                            selected: null,
                            loading: false,
                            tree: null
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
        });
        if (response.error) {
            if (response.error != "cancel")
                alert(
                    `The following error occured when saving this file: ${response.error}`
                );
            this.setState({ loading: false });
        }
        else this.setState({ modified: false, path, loading: false });
    }

    selectItem(idx) {
        let cat;
        if (idx < this.state.aiprog.actions_offset) {
            cat = "ai";
            $("#ai_list").val(`AI_${idx}`);
        } else if (idx < this.state.aiprog.behaviors_offset) {
            cat = "action";
            $("#action_list").val(
                `Action_${idx - this.state.aiprog.actions_offset}`
            );
        } else if (idx < this.state.aiprog.queries_offset) {
            cat = "behavior";
            $("#behavior_list").val(
                `Behavior_${idx - this.state.aiprog.behaviors}`
            );
        } else {
            cat = "query";
            $("#query_list").val(`Query_${idx - this.state.aiprog.queries}`);
        }
        this.setState({ tab: cat });
        $(`#${cat}_list`)[0].dispatchEvent(
            new Event("change", { bubbles: true })
        );
    }

    set_loading = () => this.setState({ loading: true });
    unset_loading = () => this.setState({ loading: false });

    async create_tree() {
        let tree = await this.state.aiprog.get_tree();
        return tree.map(node => {
            return (
                <TreeItem
                    key={node.index.toString() + node.text}
                    node={node}
                    onPick={this.selectItem.bind(this)}
                />
            );
        });
    }

    render() {
        return (
            <>
                <div className="main">
                    <div className="toolbar">
                        <ButtonToolbar>
                            <ButtonGroup size="xs">
                                <Button
                                    onClick={() => this.open_file()}
                                    title="Open...">
                                    <FolderOpen />
                                </Button>
                                <Button
                                    disabled={!this.state.aiprog}
                                    onClick={() =>
                                        this.save_file(this.state.path)
                                    }
                                    title="Save">
                                    <Save />
                                </Button>
                                <Button
                                    disabled={!this.state.aiprog}
                                    onClick={() => this.save_file("")}
                                    title="Save As...">
                                    <SaveAlt />
                                </Button>
                            </ButtonGroup>
                        </ButtonToolbar>
                        <div className="flex-grow-1"></div>
                        {this.state.path && (
                            <Badge
                                variant="secondary"
                                className="align-text-bottom"
                                title={this.state.path}>
                                {this.state.path.split("/").slice(-1)[0]}
                            </Badge>
                        )}
                        {this.state.modified && (
                            <Badge
                                variant="success"
                                style={{ paddingTop: "0.25rem" }}>
                                Modified
                            </Badge>
                        )}
                    </div>
                    <div className="row">
                        <nav id="treebar">
                            <ul className="tree tree-root">
                                {this.state.aiprog &&
                                    (this.state.tree || (
                                        <Spinner animation="border" className="m-2" />
                                    ))}
                            </ul>
                        </nav>
                        <div className="content">
                            <PlasticContext.Provider
                                value={{
                                    aiprog: this.state.aiprog,
                                    trans: this.state.trans,
                                    classes: this.state.classes
                                }}>
                                <Tabs
                                    id="tabs"
                                    defaultActiveKey="ai"
                                    activeKey={this.state.tab}
                                    onSelect={key =>
                                        this.setState({ tab: key })
                                    }
                                    transition={false}>
                                    <Tab
                                        eventKey="ai"
                                        title="AIs"
                                        className="tab-content">
                                        {this.state.aiprog && (
                                            <ProgramItemsView
                                                onAdd={this.add_ai.bind(this)}
                                                onUpdate={this.update_item.bind(
                                                    this
                                                )}
                                                onRemove={this.remove_ai.bind(
                                                    this
                                                )}
                                                setLoading={this.set_loading.bind(
                                                    this
                                                )}
                                                unsetLoading={this.unset_loading.bind(
                                                    this
                                                )}
                                                items={this.state.aiprog.ais}
                                                type={"ai"}
                                                classes={this.state.classes.AIs}
                                            />
                                        )}
                                    </Tab>
                                    <Tab
                                        eventKey="action"
                                        title="Actions"
                                        className="tab-content">
                                        {this.state.aiprog && (
                                            <ProgramItemsView
                                                onAdd={this.add_ai.bind(this)}
                                                onUpdate={this.update_item.bind(
                                                    this
                                                )}
                                                onRemove={this.remove_ai.bind(
                                                    this
                                                )}
                                                setLoading={this.set_loading.bind(
                                                    this
                                                )}
                                                unsetLoading={this.unset_loading.bind(
                                                    this
                                                )}
                                                items={
                                                    this.state.aiprog.actions
                                                }
                                                type={"action"}
                                                classes={
                                                    this.state.classes.Actions
                                                }
                                            />
                                        )}
                                    </Tab>
                                    <Tab
                                        eventKey="behavior"
                                        title="Behaviors"
                                        className="tab-content">
                                        {this.state.aiprog && (
                                            <ProgramItemsView
                                                onAdd={this.add_ai.bind(this)}
                                                onUpdate={this.update_item.bind(
                                                    this
                                                )}
                                                onRemove={this.remove_ai.bind(
                                                    this
                                                )}
                                                setLoading={this.set_loading.bind(
                                                    this
                                                )}
                                                unsetLoading={this.unset_loading.bind(
                                                    this
                                                )}
                                                label_list={true}
                                                items={
                                                    this.state.aiprog.behaviors
                                                }
                                                type={"behavior"}
                                                classes={
                                                    this.state.classes.Behaviors
                                                }
                                            />
                                        )}
                                    </Tab>
                                    <Tab
                                        eventKey="query"
                                        title="Queries"
                                        className="tab-content">
                                        {this.state.aiprog && (
                                            <ProgramItemsView
                                                onAdd={this.add_ai.bind(this)}
                                                onUpdate={this.update_item.bind(
                                                    this
                                                )}
                                                onRemove={this.remove_ai.bind(
                                                    this
                                                )}
                                                setLoading={this.set_loading.bind(
                                                    this
                                                )}
                                                unsetLoading={this.unset_loading.bind(
                                                    this
                                                )}
                                                label_list={true}
                                                items={
                                                    this.state.aiprog.queries
                                                }
                                                type={"query"}
                                                classes={
                                                    this.state.classes.Querys
                                                }
                                            />
                                        )}
                                    </Tab>
                                </Tabs>
                            </PlasticContext.Provider>
                        </div>
                    </div>
                </div>
                {this.state.loading && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: 0.75,
                            backgroundColor: "#000"
                        }}>
                        <Spinner animation="border" />
                    </div>
                )}
            </>
        );
    }
}
