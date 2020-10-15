# import aamp
from functools import lru_cache
from pathlib import Path, WindowsPath, PosixPath
import json
from os import path
from typing import Union, List

# from aamp.parameters import ParameterIO, ParameterList, ParameterObject
import oead
from oead.aamp import ParameterIO, ParameterList, ParameterObject, Parameter, Name
from aamp.botw_hashed_names import hash_to_name_map


EXEC_DIR = path.dirname(path.realpath(__file__))


@lru_cache(1)
def get_ai_defs() -> dict:
    with open(
        path.join(EXEC_DIR, "resources", "aidef.json"), "r", encoding="utf-8"
    ) as file:
        return json.load(file)


@lru_cache(1)
def get_trans_map() -> dict:
    with open(
        path.join(EXEC_DIR, "resources", "jpen.json"), "r", encoding="utf-8"
    ) as file:
        return json.load(file)


@lru_cache(1)
def get_ai_classes() -> list:
    classes = []
    defs = get_ai_defs()
    for key in defs:
        classes.extend(list(defs[key].keys()))
    return classes


def cjk_detect(texts):
    import re

    if (
        re.search("[\uac00-\ud7a3]", texts)
        or re.search("[\u3040-\u30ff]", texts)
        or re.search("[\u4e00-\u9FFF]", texts)
    ):
        return True
    return False


def json_serialize(f) -> str:
    def serializer(self, **kwargs):
        data = f(self, **kwargs)
        try:
            json_data = self._encoder.default(data)
            return json_data
        except TypeError:
            return data

    return serializer


def add_hashes():
    if not hasattr(add_hashes, "done"):
        with open(
            path.join(EXEC_DIR, "resources", "hashes.json"), "r", encoding="utf-8"
        ) as h_file:
            new_hashes = {int(k): v for k, v in json.load(h_file).items()}
        hash_to_name_map.update(new_hashes)
        add_hashes.done = True


@lru_cache(1024)
def _try_name(key: int) -> Union[str, int]:
    add_hashes()
    tmap = get_trans_map()
    if key in hash_to_name_map:
        s_key = hash_to_name_map[key]
        return s_key
    else:
        return _try_numbered_names(key)


@lru_cache(1024)
def _try_numbered_names(key: int) -> Union[str, int]:
    from zlib import crc32

    for i in range(1000):
        if crc32(f"AI_{i}".encode()) == key:
            return f"AI_{i}"
        elif crc32(f"Action_{i}".encode()) == key:
            return f"Action_{i}"
        elif crc32(f"Behavior_{i}".encode()) == key:
            return f"Behavior_{i}"
        elif crc32(f"Query_{i}".encode()) == key:
            return f"Query_{i}"
    return key


class AiProgJsonEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ParameterIO):
            return self.encode_pio(o)
        elif isinstance(o, ParameterList):
            return self.encode_plist(o)
        elif isinstance(o, ParameterObject):
            return self.encode_pobject(o)
        elif isinstance(o, (Path, WindowsPath, PosixPath)):
            return str(o)
        else:
            return super().default(o)

    def encode_pio(self, pio: ParameterIO) -> dict:
        return {
            "type": pio.type,
            "version": pio.version,
            "lists": {
                "param_root": {
                    "lists": {
                        _try_name(k.hash): self.encode_plist(pl)
                        for k, pl in pio.lists.items()
                    },
                    "objects": {
                        _try_name(k.hash): self.encode_pobject(pobj)
                        for k, pobj in pio.objects.items()
                    },
                }
            },
        }

    def encode_plist(self, plist: ParameterList) -> dict:
        lists = {
            _try_name(k.hash): self.encode_plist(pl) for k, pl in plist.lists.items()
        }
        return {
            "lists": lists,
            "objects": {
                _try_name(k.hash): self.encode_pobject(pobj)
                for k, pobj in plist.objects.items()
            },
        }

    def encode_pobject(self, obj: ParameterObject) -> dict:
        return {
            "params": {
                _try_name(k.hash): self.encode_param(param)
                for k, param in obj.params.items()
            }
        }

    def encode_param(self, param: Parameter) -> dict:
        t = param.type()
        v = param.v
        encoded = None
        if t == Parameter.Type.Vec2:
            encoded = self._encode_vec2(v)
        elif t == Parameter.Type.Vec3:
            encoded = self._encode_vec3(v)
        elif t == Parameter.Type.Vec4:
            encoded = self._encode_vec4(v)
        elif t == Parameter.Type.Color:
            encoded = self._encode_color(v)
        elif t == Parameter.Type.Quat:
            encoded = self._encode_quat(v)
        elif t in [
            Parameter.Type.Curve1,
            Parameter.Type.Curve2,
            Parameter.Type.Curve3,
            Parameter.Type.Curve4,
        ]:
            encoded = self._encode_curve(v)
        elif t in [
            Parameter.Type.String32,
            Parameter.Type.String64,
            Parameter.Type.String256,
            Parameter.Type.StringRef,
        ]:
            encoded = self._encode_str(v)
            if encoded in get_trans_map():
                encoded = get_trans_map()[encoded]
        elif t == Parameter.Type.U32:
            encoded = self._encode_u32(v)
        else:
            encoded = v
        return {t.name: encoded}

    def _encode_vec2(self, vec: oead.Vector2f) -> tuple:
        return vec.y, vec.z

    def _encode_vec3(self, vec: oead.Vector3f) -> tuple:
        return vec.x, vec.y, vec.z

    def _encode_vec4(self, vec: oead.Vector4f) -> tuple:
        return vec.w, vec.x, vec.y, vec.z

    def _encode_color(self, color: oead.Color4f) -> tuple:
        return {"a": color.a, "r": color.r, "g": color.g, "b": color.b}

    def _encode_quat(self, quat: oead.Quatf) -> tuple:
        return quat.a, quat.b, quat.c, quat.d

    def _encode_curve(self, curve: List[oead.Curve]) -> tuple:
        return [{"a": c.a, "b": c.b, "floats": c.floats} for c in curve]

    def _encode_str(
        self,
        string: Union[
            oead.FixedSafeString32, oead.FixedSafeString64, oead.FixedSafeString256, str
        ],
    ) -> str:
        return str(string)

    def _encode_u32(self, u32: oead.U32) -> int:
        return u32.v


class AiProgJsonDecoder(json.JSONDecoder):
    def __init__(self, *args, **kwargs):
        json.JSONDecoder.__init__(self, object_hook=self.object_hook, *args, **kwargs)

    def object_hook(self, obj):
        try:
            iter(obj)
        except:
            return obj
        if (
            isinstance(obj, ParameterList)
            or isinstance(obj, ParameterIO)
            or isinstance(obj, ParameterObject)
        ):
            return obj
        if "version" in obj:
            return self._to_pio(obj)
        elif "lists" in obj:
            return self._to_plist(obj)
        elif "params" in obj:
            return self._to_pobj(obj)
        else:
            return self._to_param(obj)

    def _to_param(self, obj) -> Parameter:
        enc_map = {
            "int": lambda p: oead.S32(int(p["int"])),
            "str": lambda p: str(p["str"]),
            "float": lambda p: oead.F32(float(p["float"])),
            "String32": lambda p: oead.FixedSafeString32(str(p["String32"])),
            "bool": lambda p: bool(p["bool"]),
            "Vec3": lambda p: oead.Vector3f(*obj["Vec3"]),
        }
        for t, c in enc_map.items():
            if t in obj:
                return c[obj]
        return obj

    def _to_pobj(self, obj) -> ParameterObject:
        if isinstance(obj, ParameterObject):
            return obj
        pobj = ParameterObject()
        if obj["params"]:
            for param, val in obj["params"].items():
                if param.isnumeric():
                    pobj.params[int(param)] = self.object_hook(val)
                else:
                    pobj.params[param] = self.object_hook(val)
        return pobj

    def _to_plist(self, obj) -> ParameterList:
        plist = ParameterList()
        if isinstance(obj, ParameterList):
            return obj
        if obj["lists"]:
            for name, content in obj["lists"].items():
                if name.isnumeric():
                    plist.lists[int(name)] = self._to_plist(content)
                else:
                    plist.lists[name] = self._to_plist(content)
        if obj["objects"]:
            for name, content in obj["objects"].items():
                if content["params"]:
                    if name.isnumeric():
                        plist.objects[int(name)] = self._to_pobj(content)
                    else:
                        plist.objects[name] = self._to_pobj(content)
        return plist

    def _to_pio(self, obj) -> ParameterIO:
        pio = ParameterIO()
        pio.type = obj["type"]
        pio.version = obj["version"]
        if obj["lists"]:
            for name, content in obj["lists"].items():
                if name.isnumeric():
                    pio.lists[int(name)] = self._to_plist(content)
                else:
                    pio.lists[name] = self._to_plist(content)
        if obj["objects"]:
            for name, content in obj["objects"].items():
                if content["params"]:
                    if name.isnumeric():
                        pio.objects[int(name)] = self._to_pobj(content)
                    else:
                        pio.objects[name] = self._to_pobj(content)
        return pio
