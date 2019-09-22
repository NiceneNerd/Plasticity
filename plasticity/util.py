import aamp
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


def json_serialize(f) -> str:
    def serializer(self, params):
        data = f(self, params)
        try:
            return self._encoder.default(data)
        except TypeError:
            return data
    return serializer


def _try_name(key: int) -> Union[str, int]:
    try:
        return hash_to_name_map[key]
    except KeyError:
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
        return {
            'lists': { _try_name(k): self.encode_plist(pl) for k, pl in plist.lists.items() },
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
