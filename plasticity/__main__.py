import json
from pathlib import Path
import aamp
import webview
from . import DEBUG
from . import ai, util

def on_bridge(window):
    window.evaluate_js("window.onbridge()")

class Api:
    def __init__(self):
        self._encoder = util.AiProgJsonEncoder()

    @util.json_serialize
    def init(self, params):
        return util.get_ai_defs()

    @util.json_serialize
    def open_aiprog(self, params):
        reader = aamp.Reader(
            Path(r"C:\Cemu\mlc01\usr\title\0005000E\101C9400\content\Actor\Pack\WolfLink\Actor\AIProgram\WolfLink.baiprog").read_bytes()
        )
        pio = reader.parse()
        prog = ai.AiProgram(pio)
        return pio


if __name__ == "__main__":
    api = Api()
    window = webview.create_window('Plasticity', url='assets/index.html', js_api=api, text_select=DEBUG, width=1024)
    webview.start(func=on_bridge, args=window, gui='cef', debug=DEBUG)
