import aamp
from functools import lru_cache
import json
from os import path
from typing import Union
from aamp.parameters import ParameterIO, ParameterList, ParameterObject
from aamp.botw_hashed_names import hash_to_name_map


EXEC_DIR = path.dirname(path.realpath(__file__))

def get_ai_defs() -> dict:
    if not hasattr(get_ai_defs, 'defs'):
        with open(path.join(EXEC_DIR, 'aidef.json'), 'r', encoding='utf-8') as file:
            get_ai_defs.defs = json.load(file)
    return get_ai_defs.defs


def get_trans_map() -> dict:
    if not hasattr(get_trans_map, 'map'):
        with open(path.join(EXEC_DIR, 'jpen.json'), 'r', encoding='utf-8') as file:
            get_trans_map.map = json.load(file)
    return get_trans_map.map


def get_ai_classes() -> list:
    classes = []
    defs = get_ai_defs()
    for key in defs:
        classes.extend(list(defs[key].keys()))
    return classes


def cjk_detect(texts):
    import re
    if re.search("[\uac00-\ud7a3]", texts) or re.search("[\u3040-\u30ff]", texts) or re.search("[\u4e00-\u9FFF]", texts):
        return True
    return False


def json_serialize(f) -> str:
    def serializer(self, params):
        data = f(self, params)
        try:
            json_data = self._encoder.default(data)
            return json_data
        except TypeError:
            return data
    return serializer


def _try_name(key: int) -> Union[str, int]:
    import html
    tmap = get_trans_map()
    if key in hash_to_name_map:
        s_key = hash_to_name_map[key]
        if s_key in tmap:
            return tmap[s_key].title()
        else:
            return s_key
    else:
        return _try_numbered_names(key)

def _try_numbered_names(key: int) -> Union[str, int]:
    from zlib import crc32
    for i in range(1000):
        if crc32(f'AI_{i}'.encode()) == key:
            return f'AI_{i}'
        elif crc32(f'Action_{i}'.encode()) == key:
            return f'Action_{i}'
        elif crc32(f'Behavior_{i}'.encode()) == key:
            return f'Behavior_{i}'
        elif crc32(f'Query_{i}'.encode()) == key:
            return f'Query_{i}'
    return key


class AiProgJsonEncoder(json.JSONEncoder):

    def default(self, o):
        if isinstance(o, ParameterIO):
            return self.encode_pio(o)
        elif isinstance(o, ParameterList):
            return self.encode_plist(o)
        elif isinstance(o, ParameterObject):
            return self.encode_pobject(o)
        else:
            return super().default(o)

    def encode_pio(self, pio: ParameterIO) -> dict:
        return {
            'type': pio.type,
            'version': pio.version,
            'lists': { _try_name(k): self.encode_plist(pl) for k, pl in pio.lists.items() },
            'objects': { _try_name(k): self.encode_pobject(pobj) for k, pobj in pio.objects.items() },
        }

    def encode_plist(self, plist: ParameterList) -> dict:
        lists = { _try_name(k): self.encode_plist(pl) for k, pl in plist.lists.items() }
        return {
            'lists': lists,
            'objects': { _try_name(k): self.encode_pobject(pobj) for k, pobj in plist.objects.items() },
        }

    def encode_pobject(self, obj: ParameterObject) -> dict:
        return {
            'params': { _try_name(k): self.encode_param(param) for k, param in obj.params.items() }
        }

    def encode_param(self, param) -> dict:
        t = type(param).__name__
        encoded = None
        if isinstance(param, aamp.Vec2):
            encoded = self._encode_vec2(param)
        elif isinstance(param, aamp.Vec3):
            encoded = self._encode_vec3(param)
        elif isinstance(param, aamp.Vec4):
            encoded = self._encode_vec4(param)
        elif isinstance(param, aamp.Color):
            encoded = self._encode_color(param)
        elif isinstance(param, aamp.Quat):
            encoded = self._encode_quat(param)
        elif isinstance(param, aamp.Curve):
            encoded = self._encode_curve(param)
        elif type(param) in [aamp.String32, aamp.String64, aamp.String256]:
            encoded = self._encode_str(param)
            if encoded in get_trans_map():
                encoded = get_trans_map()[encoded]
        elif isinstance(param, aamp.U32):
            encoded = self._encode_u32(param)
        else:
            encoded = param
        return { t: encoded }

    def _encode_vec2(self, vec: aamp.Vec2) -> tuple:
        return vec.y, vec.z

    def _encode_vec3(self, vec: aamp.Vec3) -> tuple:
        return vec.x, vec.y, vec.z

    def _encode_vec4(self, vec: aamp.Vec4) -> tuple:
        return vec.w, vec.x, vec.y, vec.z

    def _encode_color(self, color: aamp.Color) -> tuple:
        return {
            'a': color.a,
            'r': color.r,
            'g': color.g,
            'b': color.b
        }

    def _encode_quat(self, quat: aamp.Quat) -> tuple:
        return quat.a, quat.b, quat.c, quat.d

    def _encode_curve(self, curve: aamp.Curve) -> tuple:
        return tuple(*curve.v)

    def _encode_str(self, string: Union[aamp.String32, aamp.String64, aamp.String256]) -> str:
        return str(string)

    def _encode_u32(self, u32: aamp.U32) -> int:
        return int(u32)
