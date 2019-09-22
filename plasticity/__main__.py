import json
from pathlib import Path
import aamp
import webview
from . import DEBUG
from . import ai, util

def on_bridge(window):
    window.evaluate_js("if (window.onbridge) { window.onbridge(); }")

class Api:
    def __init__(self):
        self._encoder = util.AiProgJsonEncoder()

    @util.json_serialize
    def init(self, params):
        reader = aamp.Reader(
            Path(r"C:\Users\macad\Documents\BOTW Modding\FollowerYunobo\content\Actor\Pack\Npc_Follower_01\Actor\AIProgram\Npc_Follower_01.baiprog").read_bytes()
        )
        pio = reader.parse()
        prog = ai.AiProgram(pio)
        return pio
        # return ai.ProgramAI('LandHumEnemyFindPlayer', 'Root')


if __name__ == "__main__":
    api = Api()
    window = webview.create_window('Plasticity', url='assets/index.html', js_api=api, text_select=DEBUG)
    webview.start(func=on_bridge, args=window, gui='cef', debug=DEBUG)
