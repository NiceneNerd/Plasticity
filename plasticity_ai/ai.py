from copy import deepcopy
import json
from typing import List, Union
from zlib import crc32
import aamp
from aamp.parameters import ParameterIO, ParameterList, ParameterObject, ParameterType
from . import util


class AiProgram:

    _aiprog: ParameterIO
    _ais: List[ParameterList]
    _actions: List[ParameterList]
    _behaviors: List[ParameterList]
    _queries: List[ParameterList]

    def __init__(self, data: ParameterIO):
        self._aiprog = data
        total = 0
        self._ais = list(data.list('param_root').list('AI').lists.values())
        total += len(self._ais)
        self._actions = list(data.list('param_root').list('Action').lists.values())
        total += len(self._actions)
        self._behaviors = list(data.list('param_root').list('Behavior').lists.values())
        total += len(self._behaviors)
        self._queries = list(data.list('param_root').list('Query').lists.values())

    def get_references(self, idx: int) -> {}:
        idxs = {
            'demo': [],
            'ai': {
                'child': {},
                'behavior': {}
            },
            'action': {
                'behavior': {}
            }
        }
        for key, i in self._aiprog.list('param_root').object('DemoAIActionIdx').params.items():
            if i == idx:
                idxs['demo'].append(key)
        for i, ai in enumerate(self._ais):
            for key, index in ai.object('ChildIdx').params.items():
                if index == idx:
                    if not i in idxs['ai']['child']:
                        idxs['ai']['child'][i] = []
                    idxs['ai']['child'][i].append(key)
            if crc32('BehaviorIdx'.encode()) in ai.objects:
                for key, index in ai.object('BehaviorIdx').params.items():
                    if index == idx:
                        if not i in idxs['ai']['behavior']:
                            idxs['ai']['behavior'][i] = []
                        idxs['ai']['behavior'][i].append(key)
        for i, action in enumerate(self._actions):
            if crc32('BehaviorIdx'.encode()) in action.objects:
                for key, index in action.object('BehaviorIdx').params.items():
                    if index == idx:
                        if not i in idxs['action']['behavior']:
                            idxs['action']['behavior'][i] = []
                        idxs['action']['behavior'][i].append(key)
        return idxs

    def get_actions_offset(self) -> int:
        return len(self._ais)

    def get_behaviors_offset(self) -> int:
        return len(self._ais) + len(self._actions)
    
    def get_queries_offset(self) -> int:
        return len(self._ais) + len(self._actions) + len(self._behaviors)

    def get_ai_at_index(self, idx: int) -> ParameterList:
        return self._ais[idx]

    def get_action_at_index(self, idx: int) -> ParameterList:
        return self._actions[idx - self.get_actions_offset()]

    def get_behavior_at_index(self, idx: int, behavior_idx: bool = False) -> ParameterList:
        if not behavior_idx:
            return self._behaviors[idx - self.get_behaviors_offset()]
        else:
            return self._behaviors[idx]

    def get_query_at_index(self, idx: int) -> ParameterList:
        return self._queries[idx - self.get_queries_offset()]

    def get_item_at_index(self, idx: int) -> (str, ParameterList):
        if idx < self.get_actions_offset():
            return ('ai', self.get_ai_at_index(idx))
        elif self.get_actions_offset() <= idx < self.get_behaviors_offset():
            return ('action', self.get_action_at_index(idx))
        elif self.get_behaviors_offset() <= idx < self.get_queries_offset():
            return ('behavior', self.get_behavior_at_index(idx))
        else:
            return ('query', self.get_query_at_index(idx))

    def get_behavioridx(self, item: ParameterList) -> int:
        return self._behaviors.index(item)

    def items(self) -> tuple:
        return (*self._ais, *self._actions, *self._behaviors, *self._queries)

    def index(self, item: ParameterList) -> int:
        return self.items().index(item)

    def index_from_label(self, label: str) -> int:
        if label.startswith('AI'):
            return int(label.replace('AI_', ''))
        elif label.startswith('Action'):
            return int(label.replace('Action_', '')) + self.get_actions_offset()
        elif label.startswith('Behavior'):
            return int(label.replace('Behavior_', '')) + self.get_behaviors_offset()
        elif label.startswith('Query'):
            return int(label.replace('Query_', '')) + self.get_queries_offset()
        else:
            raise ValueError(f'{label} is not a valid AI entry.')

    def _remove_refs(self, idx: int):
        self._update_indexes(idx, 0)

    def _update_indexes(self, old_idx: int, new_idx: int):
        refs = self.get_references(old_idx)
        for param in refs['demo']:
            self._aiprog.list('param_root').object('DemoAIActionIdx').params[param] = new_idx
        for ai_idx, child_list in refs['ai']['child'].items():
            for child in child_list:
                self._ais[ai_idx].object('ChildIdx').params[child] = new_idx
        for be_idx, be_list in refs['ai']['behavior'].items():
            for be in be_list:
                self._ais[be_idx].object('BehaviorIdx').params[be] = \
                    new_idx - self.get_behaviors_offset()
        for be_idx, be_list in refs['action']['behavior'].items():
            for be in be_list:
                self._actions[be_idx].object('BehaviorIdx').params[be] = \
                    new_idx - self.get_behaviors_offset()             

    def add_ai(self, item: ParameterList) -> int:
        item = deepcopy(item)
        for thing in reversed([*self._actions, *self._behaviors, *self._queries]):
            self._update_indexes(self.index(thing), self.index(thing) + 1)
        if crc32(b'ChildIdx') in item.objects:
            for param in item.object('ChildIdx').params:
                item.object('ChildIdx').params[param] = -1
        if crc32(b'BehaviorIdx') in item.objects:
            for param in item.object('BehaviorIdx').params:
                item.object('BehaviorIdx').params[param] = -1
        self._ais.append(item)
        return self.index(item)

    def add_action(self, item: ParameterList) -> int:
        item = deepcopy(item)
        for thing in [*self._behaviors, *self._queries]:
            self._update_indexes(self.index(thing), self.index(thing) + 1)
        if crc32(b'BehaviorIdx') in item.objects:
            for param in item.object('BehaviorIdx').params:
                item.object('BehaviorIdx').params[param] = 0
        self._actions.append(item)
        return self.index(item)

    def add_behavior(self, item: ParameterList) -> int:
        item = deepcopy(item)
        for query in self._queries:
            self._update_indexes(self.index(query), self.index(query) + 1)
        self._behaviors.append(item)
        return self.index(item)

    def add_query(self, item: ParameterList) -> int:
        item = deepcopy(item)
        self._queries.append(item)
        return self.index(item)

    def remove_item(self, item: Union[int, ParameterList]) -> ParameterList:
        if isinstance(item, int):
            idx = item
            item = self.get_item_at_index(idx)
        else:
            idx = self.index(item)
        for i in [i for i, stuff in enumerate(self.items()) if i >= idx]:
            self._update_indexes(i, i - 1)
        if item[0] == 'ai':
            self._ais.remove(item[1])
        elif item[0] == 'action':
            self._actions.remove(item[1])
        elif item[0] == 'behavior':
            self._behaviors.remove(item[1])
        else:
            self._queries.remove(item)

    def generate_pio(self) -> aamp.ParameterIO:
        from zlib import crc32
        pio = deepcopy(self._aiprog)
        if self._ais:
            ais_list = aamp.ParameterList()
            for idx, ai in enumerate(self._ais):
                ais_list.set_list(f'AI_{idx}', ai)
            pio.list('param_root').set_list('AI', ais_list)
        if self._actions:
            actions_list = aamp.ParameterList()
            for idx, action in enumerate(self._actions):
                actions_list.set_list(f'Action_{idx}', action)
            pio.list('param_root').set_list('Action', actions_list)
        if self._behaviors:
            behaviors_list = aamp.ParameterList()
            for idx, behavior in enumerate(self._behaviors):
                behaviors_list.set_list(f'Behavior_{idx}', behavior)
            pio.list('param_root').set_list('Behavior', behaviors_list)
        if self._queries:
            queries_list = aamp.ParameterList()
            for idx, query in enumerate(self._queries):
                queries_list.set_list(f'Query_{idx}', query)
            pio.list('param_root').set_list('Query', queries_list)
        self._aiprog = pio
        return pio

    def get_roots(self) -> set:
        roots = set()
        for i, ai_item in enumerate(self._ais):
            refs = self.get_references(i)
            if not refs['ai']['child']:
                roots.add(i)
        return roots

    def get_tree(self) -> []:
        trees = []
        for r in self.get_roots():
            trees.append(self._generate_tree_node(r))
        return trees

    def _generate_tree_node(self, idx) -> dict:
        itms = self.items()
        jpen = util.get_trans_map()
        ai: ParameterList = itms[idx]
        try:
            text = util._try_name(ai.object('Def').param('Name'))
        except KeyError:
            text = util._try_name(str(ai.object('Def').param('ClassName')))
        tree = {
            'text': text if not text in jpen else jpen[text],
            'expanded': True,
            'index': idx
        }
        try:
            for child, i in ai.object('ChildIdx').params.items():
                if 'nodes' not in tree:
                    tree['nodes'] = []
                if i >= 0:
                    tree['nodes'].append(self._generate_tree_node(i))
        except KeyError:
            pass
        return tree

_param_type_map = {
    'String': aamp.String32,
    'Bool': bool,
    'Int': int,
    'Float': float,
    'Vec3': aamp.Vec3
}

class ProgramAI(ParameterList):

    def __init__(self, def_name: str, type: str, name: str = '', group: str = ''):
        super().__init__()
        defs = util.get_ai_defs()
        key = 'AIs' if type == 'ai' else 'Actions' if type == 'action'\
              else 'Behaviors' if type == 'behavior' else 'Querys' if type == 'query' else ''
        if def_name in defs[key]:
            ai_def = defs[key][def_name]
            self.lists = {}
            self.objects = {
                crc32(b'Def'): ParameterObject()
            }
            self.object('Def').set_param('ClassName', aamp.String32(def_name))
            self.object('Def').set_param('Name', name)
            self.object('Def').set_param('GroupName', group)
            if 'childs' in ai_def:
                self.set_object('ChildIdx', ParameterObject())
                for child in ai_def['childs']:
                    self.object('ChildIdx').set_param(child, -1)
            if 'StaticInstParams' in ai_def:
                self.set_object('SInst', ParameterObject())
                for sinst in ai_def['StaticInstParams']:
                    if 'Value' in sinst:
                        val = sinst['Value']
                    else:
                        val = _param_type_map[sinst['Type']]()
                    self.object('SInst').set_param(sinst['Name'], val)
        else:
            raise ValueError(f'{def_name} is not a valid AI')

